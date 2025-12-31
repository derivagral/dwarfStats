/**
 * Stat Bucket Definitions
 *
 * Defines the different "buckets" or layers of stat modifications:
 * - base: Default/inherent stats (class base, level bonuses)
 * - mainStats: Primary stat group slots (STR, DEX, WIS, VIT)
 * - affixes: Prefix/suffix modifiers from gear
 * - enchants: Enchantment slots
 * - monograms: Monogram/rune slots
 * - gems: Socket bonuses
 *
 * Each bucket can have slot-type restrictions (e.g., gems only on socketed items)
 */

// Available stat types that can be selected in editors
export const STAT_TYPES = [
  // Primary Attributes
  { id: 'strength', name: 'Strength', category: 'attributes', defaultValue: 0 },
  { id: 'dexterity', name: 'Dexterity', category: 'attributes', defaultValue: 0 },
  { id: 'wisdom', name: 'Wisdom', category: 'attributes', defaultValue: 0 },
  { id: 'vitality', name: 'Vitality', category: 'attributes', defaultValue: 0 },

  // Offense
  { id: 'physicalDamage', name: 'Physical Damage', category: 'offense', defaultValue: 0 },
  { id: 'mageryDamage', name: 'Magery Damage', category: 'offense', defaultValue: 0 },
  { id: 'critChance', name: 'Critical Chance', category: 'offense', defaultValue: 0, isPercent: true },
  { id: 'critDamage', name: 'Critical Damage', category: 'offense', defaultValue: 0, isPercent: true },
  { id: 'attackSpeed', name: 'Attack Speed', category: 'offense', defaultValue: 0, isPercent: true },

  // Defense
  { id: 'armor', name: 'Armor', category: 'defense', defaultValue: 0 },
  { id: 'health', name: 'Health', category: 'defense', defaultValue: 0 },
  { id: 'healthRegen', name: 'Health Regen', category: 'defense', defaultValue: 0 },
  { id: 'evasion', name: 'Evasion', category: 'defense', defaultValue: 0, isPercent: true },
  { id: 'blockChance', name: 'Block Chance', category: 'defense', defaultValue: 0, isPercent: true },

  // Resistances
  { id: 'fireResist', name: 'Fire Resistance', category: 'resistances', defaultValue: 0, isPercent: true },
  { id: 'coldResist', name: 'Cold Resistance', category: 'resistances', defaultValue: 0, isPercent: true },
  { id: 'lightningResist', name: 'Lightning Resistance', category: 'resistances', defaultValue: 0, isPercent: true },
  { id: 'poisonResist', name: 'Poison Resistance', category: 'resistances', defaultValue: 0, isPercent: true },
];

// Get stat type by id
export function getStatType(id) {
  return STAT_TYPES.find(s => s.id === id) || null;
}

// Get stat types by category
export function getStatTypesByCategory(category) {
  return STAT_TYPES.filter(s => s.category === category);
}

/**
 * Bucket Definitions
 *
 * Each bucket defines:
 * - id: Unique identifier
 * - name: Display name
 * - description: What this bucket represents
 * - maxSlots: Maximum number of stat slots in this bucket
 * - allowedStats: Array of stat IDs or null for all
 * - slotRestrictions: Which equipment slots this applies to (null = all)
 * - defaultSlots: Initial slot configuration
 */
export const BUCKET_DEFINITIONS = {
  base: {
    id: 'base',
    name: 'Base Stats',
    description: 'Inherent stats from class, level, and item base',
    maxSlots: 4,
    allowedStats: null, // All stats allowed
    slotRestrictions: null, // Applies to all equipment
    defaultSlots: [
      { statId: null, value: 0 },
      { statId: null, value: 0 },
    ],
  },

  mainStats: {
    id: 'mainStats',
    name: 'Main Stats',
    description: 'Primary attribute bonuses',
    maxSlots: 2,
    allowedStats: ['strength', 'dexterity', 'wisdom', 'vitality'],
    slotRestrictions: null,
    defaultSlots: [
      { statId: null, value: 0 },
    ],
  },

  affixes: {
    id: 'affixes',
    name: 'Affixes',
    description: 'Prefix and suffix modifiers',
    maxSlots: 6,
    allowedStats: null,
    slotRestrictions: null,
    defaultSlots: [
      { statId: null, value: 0 },
      { statId: null, value: 0 },
      { statId: null, value: 0 },
    ],
  },

  enchants: {
    id: 'enchants',
    name: 'Enchantments',
    description: 'Enchantment slot bonuses',
    maxSlots: 2,
    allowedStats: null,
    slotRestrictions: ['weapon', 'chest', 'head', 'hands', 'boots'],
    defaultSlots: [
      { statId: null, value: 0 },
    ],
  },

  monograms: {
    id: 'monograms',
    name: 'Monograms',
    description: 'Monogram/rune bonuses',
    maxSlots: 3,
    allowedStats: null,
    slotRestrictions: null,
    defaultSlots: [
      { statId: null, value: 0 },
    ],
  },
};

// Order buckets appear in the UI
export const BUCKET_ORDER = ['base', 'mainStats', 'affixes', 'enchants', 'monograms'];

/**
 * Create empty bucket state
 * @param {string} bucketId - The bucket definition ID
 * @returns {Object} Empty bucket state with default slots
 */
export function createEmptyBucket(bucketId) {
  const def = BUCKET_DEFINITIONS[bucketId];
  if (!def) return null;

  return {
    bucketId,
    slots: def.defaultSlots.map((slot, index) => ({
      id: `${bucketId}-${index}`,
      statId: slot.statId,
      value: slot.value,
    })),
  };
}

/**
 * Create empty overrides state for all buckets
 * @returns {Object} Map of bucketId -> bucket state
 */
export function createEmptyOverrides() {
  const overrides = {};
  for (const bucketId of BUCKET_ORDER) {
    overrides[bucketId] = createEmptyBucket(bucketId);
  }
  return overrides;
}

/**
 * Validate if a stat can be added to a bucket
 * @param {string} bucketId - Bucket ID
 * @param {string} statId - Stat ID to add
 * @returns {boolean}
 */
export function isStatAllowedInBucket(bucketId, statId) {
  const def = BUCKET_DEFINITIONS[bucketId];
  if (!def) return false;
  if (!def.allowedStats) return true; // null means all allowed
  return def.allowedStats.includes(statId);
}

/**
 * Check if a bucket applies to a given equipment slot
 * @param {string} bucketId - Bucket ID
 * @param {string} equipSlot - Equipment slot (head, chest, weapon, etc.)
 * @returns {boolean}
 */
export function isBucketApplicable(bucketId, equipSlot) {
  const def = BUCKET_DEFINITIONS[bucketId];
  if (!def) return false;
  if (!def.slotRestrictions) return true; // null means all slots
  return def.slotRestrictions.includes(equipSlot);
}

/**
 * Sum all override values by stat ID
 * @param {Object} overrides - The full overrides state
 * @returns {Object} Map of statId -> total value
 */
export function sumOverridesByStatId(overrides) {
  const totals = {};

  for (const bucketId of BUCKET_ORDER) {
    const bucket = overrides[bucketId];
    if (!bucket || !bucket.slots) continue;

    for (const slot of bucket.slots) {
      if (slot.statId && typeof slot.value === 'number') {
        totals[slot.statId] = (totals[slot.statId] || 0) + slot.value;
      }
    }
  }

  return totals;
}
