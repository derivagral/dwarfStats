/**
 * Share Codec — String ↔ Integer Dictionary Mappings
 *
 * Pure dictionary module for URL payload compression.
 * Maps known string IDs to integer indices for compact encoding.
 *
 * Rules:
 *   - Array index = encoded integer
 *   - Source registries are imported in insertion order (ES2015+ object key order)
 *   - Entries should only ever be APPENDED to source registries, never reordered
 *   - Unknown IDs (not in dict) are stored as strings in payloads (forward-compatible)
 *   - Increment CODEC_VERSION if dictionary ordering must change (breaks old URLs)
 *
 * @module utils/shareCodec
 */

import { STAT_REGISTRY } from './statRegistry.js';
import { MONOGRAM_REGISTRY } from './monogramRegistry.js';
import { WEAPON_SKILL_REGISTRY, TREE_KEYSTONES } from './skillTreeRegistry.js';

export const CODEC_VERSION = 1;

/**
 * Stat IDs — ordered by insertion in STAT_REGISTRY (append-only)
 * @type {readonly string[]}
 */
export const STAT_DICT = Object.freeze(Object.keys(STAT_REGISTRY));

/**
 * Monogram IDs — ordered by insertion in MONOGRAM_REGISTRY (append-only)
 * @type {readonly string[]}
 */
export const MONOGRAM_DICT = Object.freeze(Object.keys(MONOGRAM_REGISTRY));

/**
 * Weapon skill row names — ordered by insertion in WEAPON_SKILL_REGISTRY (append-only)
 * @type {readonly string[]}
 */
export const WEAPON_SKILL_DICT = Object.freeze(Object.keys(WEAPON_SKILL_REGISTRY));

/**
 * Keystone IDs — ordered by insertion in TREE_KEYSTONES (append-only)
 * @type {readonly string[]}
 */
export const KEYSTONE_DICT = Object.freeze(Object.keys(TREE_KEYSTONES));

/**
 * Equipment slot keys — stable list of all known slot types.
 * Hard-coded (not derived) because SLOT_LABELS is internal to equipmentParser.
 * Append new slots at the end only.
 * @type {readonly string[]}
 */
export const SLOT_DICT = Object.freeze([
  'head', 'chest', 'hands', 'pants', 'boots',
  'weapon', 'neck', 'bracer', 'ring', 'relic',
  'fossil', 'dragon', 'offhand',
]);

/**
 * Weapon stance IDs — must match STANCE_DEFS keys in stanceSkills.js (append-only).
 * Hard-coded to avoid a circular import through CharacterShareModel.
 * These are the IDs used in stanceContext.activeStance.id, NOT the SkillTree WEAPON_TYPE enum
 * values (which use different names: 'mauls', 'oneHand', 'archery', etc.).
 * @type {readonly string[]}
 */
export const WEAPON_TYPE_DICT = Object.freeze([
  'spear', 'maul', 'sword', 'twohand', 'bow', 'magery', 'fist', 'scythe',
]);

/**
 * Encode a string ID to its integer index in the given dictionary.
 * Returns null if the ID is not in the dictionary.
 *
 * @param {readonly string[]} dict - Ordered dictionary array
 * @param {string} str - ID to encode
 * @returns {number|null} Integer index, or null if unknown
 */
export function encodeId(dict, str) {
  const idx = dict.indexOf(str);
  return idx === -1 ? null : idx;
}

/**
 * Decode an integer index back to its string ID.
 * Returns null if the index is out of range.
 *
 * @param {readonly string[]} dict - Ordered dictionary array
 * @param {number} idx - Integer index
 * @returns {string|null} Decoded string, or null if out of range
 */
export function decodeId(dict, idx) {
  return (idx >= 0 && idx < dict.length) ? dict[idx] : null;
}

/**
 * Encode a string ID, falling back to the string itself for unknown IDs.
 * Use this when building payload arrays that must survive unknown values.
 *
 * @param {readonly string[]} dict - Ordered dictionary array
 * @param {string} str - ID to encode
 * @returns {number|string} Integer index if known, original string if not
 */
export function encodeIdOrString(dict, str) {
  const idx = dict.indexOf(str);
  return idx === -1 ? str : idx;
}

/**
 * Decode a value that may be either an integer index or a fallback string.
 * Integers are looked up in the dictionary; strings are returned as-is.
 *
 * @param {readonly string[]} dict - Ordered dictionary array
 * @param {number|string} value - Encoded value
 * @returns {string|null} Decoded string ID, or null if integer is out of range
 */
export function decodeIdOrString(dict, value) {
  if (typeof value === 'string') return value;
  return decodeId(dict, value);
}
