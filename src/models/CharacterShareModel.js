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
 * Build a full character share payload from equipped items and optional stanceContext.
 *
 * @param {import('./Item').Item[]} equippedItems
 * @param {{ activeStance: object }|null} [stanceContext]
 * @returns {CharacterSharePayload}
 */
export function createCharacterSharePayload(equippedItems, stanceContext = null) {
  const payload = { v: CHARACTER_SHARE_VERSION };

  if (equippedItems && equippedItems.length > 0) {
    payload.e = equippedItems.map(createItemShare);
  }

  const mastery = createMasteryShare(stanceContext);
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
