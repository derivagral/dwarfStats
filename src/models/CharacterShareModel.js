/**
 * Character Share Model
 *
 * Payload types and factory functions for character data URL sharing.
 * Converts between internal Item/SkillTree models and the compact encoded
 * format used in #character= URL hashes.
 *
 * Encoding:
 *   - String IDs are compressed to integer indices via shareCodec dictionaries
 *   - Unknown IDs (new game content) fall back to string storage
 *   - Optional fields are omitted when empty/default to keep URLs short
 *
 * @module models/CharacterShareModel
 */

import {
  STAT_DICT, MONOGRAM_DICT,
  SLOT_DICT, WEAPON_TYPE_DICT, WEAPON_SKILL_DICT,
  encodeIdOrString, decodeIdOrString,
} from '../utils/shareCodec.js';
import { findStatForAttribute, getStatById } from '../utils/statRegistry.js';
import { getWeaponSkillDef } from '../utils/skillTreeRegistry.js';
import { hasMainTreeHealthEffect, hasMainTreeAffinityEffect, hasMainTreeModifierGrant } from '../utils/skillEffectAggregator.js';
import { createEmptySkillTreeData } from './SkillTree.js';
import { createEmptyItem } from './Item.js';

// v2: adds the `st` skill tree section (cards + weapon skill levels, later
// extended with additive main-tree health rows) so shared
// builds compute real skill effects instead of the mastery approximation.
// v2 payloads travel compressed ("2." prefix, see shareUrl.js); v1 decode is
// unchanged for old links.
export const CHARACTER_SHARE_VERSION = 2;

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/**
 * Compact equipped item for URL sharing.
 * @typedef {Object} EquippedItemShare
 * @property {number|string} sl - Slot (SLOT_DICT index or fallback string)
 * @property {string} rn - Row name (kept as string; too many to enumerate)
 * @property {string} [dn] - Display name from save file (omitted if empty)
 * @property {number} [ra] - Rarity 0-4 (omitted if 0)
 * @property {number} [ti] - Tier (omitted if 0)
 * @property {Array<[number|string, number|null]>} [bs] - Base stats [[statEnc, value], ...]
 * @property {Array<[number|string, number|null]>} [mg] - Monograms [[monogramEnc, value], ...]
 */

/**
 * Compact mastery snapshot for URL sharing.
 * V1 scope: active weapon type, stance keystone status, paragon level.
 * @typedef {Object} MasteryShare
 * @property {number|string} wt - Weapon type (WEAPON_TYPE_DICT index or fallback string)
 * @property {1} [ku] - Keystone unlocked flag (omitted if false)
 * @property {number} [pl] - Paragon level / mastery level (omitted if 0)
 */

/**
 * Full character share payload.
 * @typedef {Object} CharacterSharePayload
 * @property {number} v - Schema version
 * @property {EquippedItemShare[]} [e] - Equipped items (omitted if none)
 * @property {MasteryShare} [sk] - Mastery snapshot (omitted if none)
 * @property {Array<[number|string, number]>} [at] - Allocated attribute points
 *   [[statEnc, value], ...] (omitted if none). These are the character's base
 *   attribute pool from the save's Attributes_21_* block — NOT on any item, so
 *   without this a shared build under-counts totals (e.g. luck) and every
 *   highestAttribute-driven derived stat.
 * @property {number} [hp] - Character max health (omitted if 0). Not derivable
 *   from gear; needed by the 1%-of-max-Health monogram.
 * @property {{ cd?: Array<[string, number]>, ws?: Array<[number|string, number]>, mh?: string[] }} [st] -
 *   Skill tree section (v2+): cards [[rowName, level]], weapon skills
 *   [[skillEnc, level]], and known main-tree health node row names.
 * @property {string} [cn] - Character name (display; omitted if unknown)
 * @property {number} [lv] - Character level (drives the progression health
 *   pool on the receiving side; omitted if unknown)
 * @property {number} [cb] - Campaign bosses defeated (0-6; each grants +100
 *   flat health; omitted if 0)
 */

// ---------------------------------------------------------------------------
// Encoding (Item model → compact share form)
// ---------------------------------------------------------------------------

/**
 * Convert an equipped Item model to compact share form.
 *
 * @param {import('./Item').Item} item
 * @returns {EquippedItemShare}
 */
export function createItemShare(item) {
  const share = {
    sl: encodeIdOrString(SLOT_DICT, item.slot || 'unknown'),
    rn: item.rowName || '',
  };

  if (item.displayName) share.dn = item.displayName;
  if (item.rarity) share.ra = item.rarity;
  if (item.tier) share.ti = item.tier;

  if (item.baseStats && item.baseStats.length > 0) {
    share.bs = item.baseStats.map(s => {
      // Resolve to registry ID via rawTag for ability-specific stats
      // (e.g. rawTag "EasyRPG...EnemyDeath.DamageMultiplier" → registry ID "enemyDeathDamage")
      const registryEntry = s.rawTag ? findStatForAttribute(s.rawTag) : null;
      const statKey = registryEntry ? registryEntry.id : s.stat;
      return [
        encodeIdOrString(STAT_DICT, statKey),
        s.value ?? null,
      ];
    });
  }

  if (item.monograms && item.monograms.length > 0) {
    share.mg = item.monograms.map(m => [
      encodeIdOrString(MONOGRAM_DICT, m.id),
      m.value ?? null,
    ]);
  }

  return share;
}

/**
 * Convert a stanceContext to compact mastery share form.
 * Encodes the active weapon type, stance keystone status, and paragon level.
 * These are the fields actually consumed by useDerivedStats on load.
 *
 * @param {{ activeStance: { id: string, mastery: number, keystoneUnlocked: boolean } }|null} stanceContext
 * @returns {MasteryShare|null}
 */
export function createMasteryShare(stanceContext) {
  const activeStance = stanceContext?.activeStance;
  if (!activeStance?.id) return null;

  const share = { wt: encodeIdOrString(WEAPON_TYPE_DICT, activeStance.id) };
  if (activeStance.keystoneUnlocked) share.ku = 1;
  if (activeStance.mastery > 0) share.pl = activeStance.mastery;
  return share;
}

/**
 * Convert a parsed skill tree (extractSkillTree) to compact share form.
 * Cards keep string row names (already short: "CARD3_2"); weapon skills use
 * WEAPON_SKILL_DICT indices with string fallback for unknown rows.
 *
 * @param {Object|null} skillTree
 * @returns {{ cd?: Array<[string, number]>, ws?: Array<[number|string, number]>, mh?: string[] }|null}
 */
export function createSkillTreeShare(skillTree) {
  if (!skillTree) return null;
  const st = {};

  const cards = (skillTree.cards ?? [])
    .filter(c => c.rowName && c.level > 0)
    .map(c => [c.rowName, c.level]);
  if (cards.length > 0) st.cd = cards;

  const ws = [];
  for (const stance of Object.values(skillTree.weaponStances ?? {})) {
    for (const skill of stance.skills ?? []) {
      if (!skill.rowName) continue;
      ws.push([encodeIdOrString(WEAPON_SKILL_DICT, skill.rowName), skill.level || 1]);
    }
  }
  if (ws.length > 0) st.ws = ws;

  // Main-tree rows are normally too numerous for a share URL. Preserve only
  // the generated nodes with known effects (health, offhand affinity,
  // modifier grants like the Melee/Ranged Mastery paragon nodes) so shared
  // builds compute the same health/affinity/paragon numbers as a save import.
  const mainNodes = (skillTree.mainTree ?? [])
    .filter(skill => skill.rowName
      && (hasMainTreeHealthEffect(skill.rowName)
        || hasMainTreeAffinityEffect(skill.rowName)
        || hasMainTreeModifierGrant(skill.rowName)))
    .map(skill => skill.rowName);
  if (mainNodes.length > 0) st.mh = mainNodes;

  return Object.keys(st).length > 0 ? st : null;
}

/**
 * Reconstruct a skill-tree-shaped object from a decoded `st` section —
 * enough for skillEffectAggregator (cards + weaponStances with rowName/level).
 * Weapon skills are bucketed by their registry/game-data weapon type.
 *
 * @param {{ cd?: Array<[string, number]>, ws?: Array<[number|string, number]>, mh?: string[] }|null|undefined} st
 * @returns {Object|null} SkillTreeData-shaped object, or null if empty
 */
export function skillTreeShareToData(st) {
  if (!st || (!st.cd?.length && !st.ws?.length && !st.mh?.length)) return null;
  const tree = createEmptySkillTreeData();

  for (const [rowName, level] of st.cd || []) {
    tree.cards.push({ rowName, level: level ?? 1 });
  }

  for (const [enc, level] of st.ws || []) {
    const rowName = decodeIdOrString(WEAPON_SKILL_DICT, enc) || String(enc);
    const weapon = getWeaponSkillDef(rowName)?.weapon;
    const stance = tree.weaponStances[weapon] ?? tree.weaponStances.spear;
    stance.skills.push({ rowName, level: level ?? 1 });
  }

  for (const rowName of st.mh || []) {
    if (!rowName || !(hasMainTreeHealthEffect(rowName)
      || hasMainTreeAffinityEffect(rowName)
      || hasMainTreeModifierGrant(rowName))) continue;
    tree.mainTree.push({ rowName, level: 1, category: 'main' });
  }

  return tree;
}

/**
 * Convert the character's allocated attribute pool to compact share form.
 * Input shape matches parseAllocatedAttributes(): { statId: { value, sourceName } }.
 * Plain numeric values are also accepted.
 *
 * @param {Object<string, {value:number}|number>|null} allocatedAttributes
 * @returns {Array<[number|string, number]>|null} [[statEnc, value], ...] or null if empty
 */
export function createAllocatedAttributesShare(allocatedAttributes) {
  if (!allocatedAttributes) return null;
  const entries = Object.entries(allocatedAttributes);
  if (entries.length === 0) return null;

  const out = [];
  for (const [statId, raw] of entries) {
    const value = typeof raw === 'number' ? raw : Number(raw?.value ?? 0);
    if (!value) continue; // skip zeros to keep URLs short
    out.push([encodeIdOrString(STAT_DICT, statId), value]);
  }
  return out.length > 0 ? out : null;
}

/**
 * Reconstruct the allocated attribute pool from a decoded `at` array.
 * Returns the same shape parseAllocatedAttributes() produces so it can be
 * dropped straight into itemStore.metadata.allocatedAttributes.
 *
 * @param {Array<[number|string, number]>|null|undefined} at
 * @returns {Object<string, {value:number, sourceName:string}>}
 */
export function allocatedAttributesShareToData(at) {
  const result = {};
  for (const [enc, value] of at || []) {
    const statId = decodeIdOrString(STAT_DICT, enc) || String(enc);
    result[statId] = { value: value ?? 0, sourceName: 'Allocated Points' };
  }
  return result;
}

/**
 * Build a full character share payload from equipped items, optional
 * stanceContext, and the character's allocated attribute pool.
 *
 * @param {import('./Item').Item[]} equippedItems
 * @param {{ activeStance: object }|null} [stanceContext]
 * @param {Object<string, {value:number}|number>|null} [allocatedAttributes]
 * @returns {CharacterSharePayload}
 */
export function createCharacterSharePayload(equippedItems, stanceContext = null, allocatedAttributes = null, maxHealth = 0, skillTree = null, identity = null) {
  const payload = { v: CHARACTER_SHARE_VERSION };

  if (equippedItems && equippedItems.length > 0) {
    payload.e = equippedItems.map(createItemShare);
  }

  const mastery = createMasteryShare(stanceContext);
  if (mastery) payload.sk = mastery;

  const at = createAllocatedAttributesShare(allocatedAttributes);
  if (at) payload.at = at;

  // Character max health (for the 1%-of-max-Health monogram); not derivable
  // from gear. Rounded to keep the URL short.
  if (maxHealth > 0) payload.hp = Math.round(maxHealth);

  // Skill tree (cards + weapon skill levels) so the receiving side computes
  // real skill effects; the mastery snapshot above stays as the fallback.
  const st = createSkillTreeShare(skillTree);
  if (st) payload.st = st;

  // Character identity + progression inputs. Name/level for display; level
  // plus campaign-boss count let the receiving side rebuild the exact
  // progression health pool (base + per-level + boss bonuses), so shared
  // builds compute the same max health as a direct save load.
  if (identity?.name) payload.cn = identity.name;
  if (identity?.level > 0) payload.lv = identity.level;
  if (identity?.campaignBossCount > 0) payload.cb = identity.campaignBossCount;
  // Race enum index (0 = Human is meaningful, so only null/undefined omit).
  // Level + race let the receiving side recompute racial skill bonuses.
  if (identity?.race != null) payload.rc = identity.race;

  return payload;
}

// ---------------------------------------------------------------------------
// Decoding (compact share form → usable data)
// ---------------------------------------------------------------------------

/**
 * Derive a human-readable item type string from a row name.
 * Falls back gracefully for unknown row name formats.
 *
 * @param {string} rowName
 * @returns {string}
 */
function typeFromRowName(rowName) {
  if (!rowName) return 'Item';
  const parts = rowName.split('_');
  if (parts.length >= 2) {
    return parts.slice(0, 2)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }
  return rowName;
}

/**
 * Derive a display name from a row name (last two underscore-separated segments).
 *
 * @param {string} rowName
 * @returns {string}
 */
function displayNameFromRowName(rowName) {
  if (!rowName) return '';
  const parts = rowName.split('_');
  return parts.slice(-2).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

/**
 * Reconstruct a partial Item model from a decoded EquippedItemShare.
 * Only populates fields needed by CharacterTab and useDerivedStats.
 * Fields not present in the share (affixPools, isLocked, etc.) use defaults.
 *
 * @param {EquippedItemShare} share
 * @param {number} index - Position index for generating a unique id
 * @returns {import('./Item').Item}
 */
export function itemShareToItem(share, index) {
  const slot = decodeIdOrString(SLOT_DICT, share.sl) || 'unknown';
  const rowName = share.rn || '';

  const baseStats = (share.bs || []).map(([enc, value]) => {
    const statId = decodeIdOrString(STAT_DICT, enc) || String(enc);
    const registryEntry = getStatById(statId);
    return {
      stat: statId,
      value: value ?? null,
      rawTag: registryEntry?.canonical || statId,
    };
  });

  const monograms = (share.mg || []).map(([enc, value]) => ({
    id: decodeIdOrString(MONOGRAM_DICT, enc) || String(enc),
    value: value ?? null,
  }));

  return {
    ...createEmptyItem(),
    id: `share-${index}-${rowName}`,
    rowName,
    type: typeFromRowName(rowName),
    displayName: share.dn || displayNameFromRowName(rowName),
    slot,
    rarity: share.ra || 0,
    tier: share.ti || 0,
    baseStats,
    monograms,
  };
}

/**
 * Reconstruct mastery state from a decoded MasteryShare.
 * Returns the fields needed to reconstruct a stanceContext via convertMasteryToStanceContext.
 *
 * @param {MasteryShare|null} share
 * @returns {{ weaponType: string|null, keystoneUnlocked: boolean, paragonLevel: number }|null}
 */
export function masteryShareToData(share) {
  if (!share) return null;

  const weaponType = share.wt != null
    ? decodeIdOrString(WEAPON_TYPE_DICT, share.wt) || null
    : null;

  return {
    weaponType,
    keystoneUnlocked: !!share.ku,
    paragonLevel: share.pl || 0,
  };
}
