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
  STAT_DICT, MONOGRAM_DICT, WEAPON_SKILL_DICT, KEYSTONE_DICT,
  SLOT_DICT, WEAPON_TYPE_DICT,
  encodeIdOrString, decodeIdOrString,
} from '../utils/shareCodec.js';
import { createEmptyItem } from './Item.js';

export const CHARACTER_SHARE_VERSION = 1;

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/**
 * Compact equipped item for URL sharing.
 * @typedef {Object} EquippedItemShare
 * @property {number|string} sl - Slot (SLOT_DICT index or fallback string)
 * @property {string} rn - Row name (kept as string; too many to enumerate)
 * @property {number} [ra] - Rarity 0-4 (omitted if 0)
 * @property {number} [ti] - Tier (omitted if 0)
 * @property {Array<[number|string, number|null]>} [bs] - Base stats [[statEnc, value], ...]
 * @property {Array<[number|string, number|null]>} [mg] - Monograms [[monogramEnc, value], ...]
 */

/**
 * Compact mastery snapshot for URL sharing.
 * V1 scope: active weapon type, weapon stance skill levels, main-tree keystones.
 * @typedef {Object} MasteryShare
 * @property {number|string} wt - Weapon type (WEAPON_TYPE_DICT index or fallback string)
 * @property {Array<[number|string, number]>} [ws] - Weapon skills [[skillEnc, level], ...]
 * @property {Array<number|string>} [ks] - Active keystone IDs [keystoneEnc, ...]
 */

/**
 * Full character share payload.
 * @typedef {Object} CharacterSharePayload
 * @property {number} v - Schema version
 * @property {EquippedItemShare[]} [e] - Equipped items (omitted if none)
 * @property {MasteryShare} [sk] - Mastery snapshot (omitted if none)
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

  if (item.rarity) share.ra = item.rarity;
  if (item.tier) share.ti = item.tier;

  if (item.baseStats && item.baseStats.length > 0) {
    share.bs = item.baseStats.map(s => [
      encodeIdOrString(STAT_DICT, s.stat),
      s.value ?? null,
    ]);
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
 * Convert SkillTreeData to compact mastery share form.
 * Selects the weapon stance with the most allocated skills as the active one.
 *
 * @param {import('./SkillTree').SkillTreeData|null} skillTreeData
 * @returns {MasteryShare|null}
 */
export function createMasteryShare(skillTreeData) {
  if (!skillTreeData) return null;

  const stances = skillTreeData.weaponStances || {};

  // Pick the stance with the most skills as the active weapon type
  const weaponType = Object.keys(stances).reduce(
    (best, type) => {
      const count = stances[type]?.skills?.length ?? 0;
      return count > (stances[best]?.skills?.length ?? 0) ? type : best;
    },
    null
  );

  // Nothing to encode if no weapon stance and no keystones
  const hasKeystones = skillTreeData.keystones?.length > 0;
  if (!weaponType && !hasKeystones) return null;

  const mastery = {
    wt: encodeIdOrString(WEAPON_TYPE_DICT, weaponType || ''),
  };

  const activeStance = weaponType ? stances[weaponType] : null;
  if (activeStance?.skills?.length > 0) {
    mastery.ws = activeStance.skills.map(skill => [
      encodeIdOrString(WEAPON_SKILL_DICT, skill.rowName),
      skill.level,
    ]);
  }

  if (hasKeystones) {
    mastery.ks = skillTreeData.keystones.map(k =>
      encodeIdOrString(KEYSTONE_DICT, typeof k === 'string' ? k : k.id)
    );
  }

  return mastery;
}

/**
 * Build a full character share payload from equipped items and optional mastery data.
 *
 * @param {import('./Item').Item[]} equippedItems
 * @param {import('./SkillTree').SkillTreeData|null} [skillTreeData]
 * @returns {CharacterSharePayload}
 */
export function createCharacterSharePayload(equippedItems, skillTreeData = null) {
  const payload = { v: CHARACTER_SHARE_VERSION };

  if (equippedItems && equippedItems.length > 0) {
    payload.e = equippedItems.map(createItemShare);
  }

  const mastery = createMasteryShare(skillTreeData);
  if (mastery) payload.sk = mastery;

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

  const baseStats = (share.bs || []).map(([enc, value]) => ({
    stat: decodeIdOrString(STAT_DICT, enc) || String(enc),
    value: value ?? null,
  }));

  const monograms = (share.mg || []).map(([enc, value]) => ({
    id: decodeIdOrString(MONOGRAM_DICT, enc) || String(enc),
    value: value ?? null,
  }));

  return {
    ...createEmptyItem(),
    id: `share-${index}-${rowName}`,
    rowName,
    type: typeFromRowName(rowName),
    displayName: displayNameFromRowName(rowName),
    slot,
    rarity: share.ra || 0,
    tier: share.ti || 0,
    baseStats,
    monograms,
  };
}

/**
 * Reconstruct decoded mastery state from a MasteryShare.
 *
 * @param {MasteryShare|null} share
 * @returns {{ weaponType: string|null, weaponSkills: Array, keystones: string[] }|null}
 */
export function masteryShareToData(share) {
  if (!share) return null;

  const weaponType = share.wt != null
    ? decodeIdOrString(WEAPON_TYPE_DICT, share.wt) || null
    : null;

  const weaponSkills = (share.ws || []).map(([enc, level]) => ({
    rowName: decodeIdOrString(WEAPON_SKILL_DICT, enc) || String(enc),
    level,
  }));

  const keystones = (share.ks || []).map(enc =>
    decodeIdOrString(KEYSTONE_DICT, enc) || String(enc)
  );

  return { weaponType, weaponSkills, keystones };
}
