/**
 * Clean Item Model for DwarfStats
 *
 * This module defines the internal item representation used throughout the app.
 * It transforms the deeply nested UE5 save structure into a flat, easy-to-use model
 * optimized for read-only display and analysis (not round-trip editing).
 *
 * @module models/Item
 */

/**
 * Rarity levels mapped from E_Rarity enum
 * @readonly
 * @enum {number}
 */
export const Rarity = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

/**
 * Human-readable rarity names
 * @type {Object<number, string>}
 */
export const RARITY_NAMES = {
  [Rarity.COMMON]: 'Common',
  [Rarity.UNCOMMON]: 'Uncommon',
  [Rarity.RARE]: 'Rare',
  [Rarity.EPIC]: 'Epic',
  [Rarity.LEGENDARY]: 'Legendary',
};

/**
 * CSS class names for rarity styling
 * @type {Object<number, string>}
 */
export const RARITY_CLASSES = {
  [Rarity.COMMON]: 'rarity-common',
  [Rarity.UNCOMMON]: 'rarity-uncommon',
  [Rarity.RARE]: 'rarity-rare',
  [Rarity.EPIC]: 'rarity-epic',
  [Rarity.LEGENDARY]: 'rarity-legendary',
};

/**
 * A single stat entry with name and value
 * @typedef {Object} StatEntry
 * @property {string} stat - Parsed stat name (e.g., "Armor", "CriticalChance")
 * @property {number|null} value - Numeric value, or null if not available
 * @property {string} [rawTag] - Full gameplay tag path for reference
 */

/**
 * Reference to an affix from a data table
 * @typedef {Object} AffixReference
 * @property {string} rowName - Row name in the data table (e.g., "StaticChargeDamage")
 * @property {string} [dataTable] - Data table path (e.g., "DT_Base_Item_Attributes")
 */

/**
 * Affix pools structure - contains possible affixes for each slot
 * @typedef {Object} AffixPools
 * @property {AffixReference[]} inherent - Inherent/base affixes
 * @property {AffixReference[]} pool1 - Pool 1 affixes (prefix-like)
 * @property {AffixReference[]} pool2 - Pool 2 affixes (suffix-like)
 * @property {AffixReference[]} pool3 - Pool 3 affixes (tertiary)
 */

/**
 * A monogram (modifier) entry on an item
 * Monograms are special crafted modifiers from the Codex
 * @typedef {Object} MonogramEntry
 * @property {string} id - Monogram ID (e.g., "Bloodlust.Base", "DamageCircle.Hp%.Highest")
 * @property {number|null} value - Numeric value (usually 1 for boolean effects)
 * @property {string} [rawTag] - Full gameplay tag path for reference
 */

/**
 * Clean Item model - the primary data structure for items in DwarfStats
 *
 * @typedef {Object} Item
 *
 * @property {string} id - Unique identifier (generated from rowName + index)
 * @property {string} rowName - Original row name from DT_Items (e.g., "Armor_Bracers_Zone_4_Desert_Tiger_Bracers")
 * @property {string} type - Parsed item type (e.g., "Armor Bracers")
 * @property {string} displayName - Generated display name (e.g., "Rune Keep")
 *
 * @property {number} rarity - Rarity level (0-4, use Rarity enum)
 * @property {number} tier - Item tier/level
 * @property {number} specks - Crafting specks on this item
 * @property {boolean} isLocked - Whether item is locked from modification
 * @property {boolean} isGenerated - Whether item was procedurally generated
 * @property {number} stackCount - Stack quantity (Amount)
 * @property {number} charges - Charges remaining (if applicable)
 *
 * @property {StatEntry[]} baseStats - Base stats from GeneratedAttributes (excluding monograms)
 * @property {AffixPools} affixPools - Affix pools with potential rolls
 * @property {MonogramEntry[]} monograms - Monograms (modifiers) on this item
 *
 * @property {number} upgradeCount - Gamble/anvil upgrade count
 */

/**
 * Creates an empty Item with default values
 * @returns {Item}
 */
export function createEmptyItem() {
  return {
    id: '',
    rowName: '',
    type: 'Unknown',
    displayName: '',

    rarity: Rarity.COMMON,
    tier: 0,
    specks: 0,
    isLocked: false,
    isGenerated: false,
    stackCount: 1,
    charges: 0,

    baseStats: [],
    affixPools: {
      inherent: [],
      pool1: [],
      pool2: [],
      pool3: [],
    },

    upgradeCount: 0,
    monograms: [],
  };
}

/**
 * Gets the rarity name for display
 * @param {number} rarity - Rarity value
 * @returns {string}
 */
export function getRarityName(rarity) {
  return RARITY_NAMES[rarity] ?? 'Unknown';
}

/**
 * Gets the CSS class for rarity styling
 * @param {number} rarity - Rarity value
 * @returns {string}
 */
export function getRarityClass(rarity) {
  return RARITY_CLASSES[rarity] ?? '';
}

/**
 * Gets all stat names from an item (base + all affix pools)
 * @param {Item} item - The item to extract stats from
 * @returns {string[]} Array of stat names
 */
export function getAllStatNames(item) {
  const stats = new Set();

  // Add base stats
  for (const stat of item.baseStats) {
    stats.add(stat.stat);
  }

  // Add affix pool row names
  for (const affix of item.affixPools.inherent) {
    stats.add(affix.rowName);
  }
  for (const affix of item.affixPools.pool1) {
    stats.add(affix.rowName);
  }
  for (const affix of item.affixPools.pool2) {
    stats.add(affix.rowName);
  }
  for (const affix of item.affixPools.pool3) {
    stats.add(affix.rowName);
  }

  return Array.from(stats);
}

/**
 * Checks if an item has any affixes in any pool
 * @param {Item} item - The item to check
 * @returns {boolean}
 */
export function hasAffixes(item) {
  return (
    item.affixPools.inherent.length > 0 ||
    item.affixPools.pool1.length > 0 ||
    item.affixPools.pool2.length > 0 ||
    item.affixPools.pool3.length > 0
  );
}

/**
 * Gets total affix count across all pools
 * @param {Item} item - The item to count affixes for
 * @returns {number}
 */
export function getTotalAffixCount(item) {
  return (
    item.affixPools.inherent.length +
    item.affixPools.pool1.length +
    item.affixPools.pool2.length +
    item.affixPools.pool3.length
  );
}

/**
 * Checks if an item has any monograms
 * @param {Item} item - The item to check
 * @returns {boolean}
 */
export function hasMonograms(item) {
  return item.monograms && item.monograms.length > 0;
}

/**
 * Gets monogram count for an item
 * @param {Item} item - The item to count monograms for
 * @returns {number}
 */
export function getMonogramCount(item) {
  return item.monograms ? item.monograms.length : 0;
}

/**
 * Gets all monogram IDs from an item
 * @param {Item} item - The item to extract monograms from
 * @returns {string[]} Array of monogram IDs
 */
export function getMonogramIds(item) {
  if (!item.monograms) return [];
  return item.monograms.map(m => m.id);
}
