/**
 * Derived Stats Calculation Engine
 *
 * Handles chained stat calculations with dependency resolution using layers.
 * Stats are calculated in topological order based on their dependencies.
 *
 * Layer System:
 * - Layer 0: Base stats (from items/character) - not defined here
 * - Layer 1: Total stats (base + bonus%)
 * - Layer 2: First-order derived (e.g., monogram values from total stats)
 * - Layer 3: Second-order derived (e.g., elemental bonus from monogram value)
 * - Layer 4+: Higher-order chains
 *
 * Calculation Types:
 * - 'totalStat': Base * (1 + bonus%) - standard total calculation
 * - 'perStat': X amount per Y stat (e.g., +5 damage per 100 strength)
 * - 'custom': Arbitrary calculation function
 */

import { STAT_REGISTRY } from './statRegistry.js';

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

export const LAYERS = {
  BASE: 0,           // Raw stats from items/character (computed by useDerivedStats)
  TOTALS: 1,         // Base + bonus% calculations
  PRIMARY_DERIVED: 2, // First derived values (e.g., monogram bonuses)
  SECONDARY_DERIVED: 3, // Second-order derived
  TERTIARY_DERIVED: 4,  // Third-order derived
};

// ============================================================================
// DERIVED STAT DEFINITIONS
// ============================================================================

export const DERIVED_STATS = {
  // ---------------------------------------------------------------------------
  // LAYER 1: TOTAL ATTRIBUTES (base + bonus%)
  // ---------------------------------------------------------------------------
  totalStrength: {
    id: 'totalStrength',
    name: 'Total Strength',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['strength', 'strengthBonus'],
    calculate: (stats) => {
      const base = stats.strength || 0;
      const bonus = stats.strengthBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Strength after bonuses applied',
  },
  totalDexterity: {
    id: 'totalDexterity',
    name: 'Total Dexterity',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['dexterity', 'dexterityBonus'],
    calculate: (stats) => {
      const base = stats.dexterity || 0;
      const bonus = stats.dexterityBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Dexterity after bonuses applied',
  },
  totalWisdom: {
    id: 'totalWisdom',
    name: 'Total Wisdom',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['wisdom', 'wisdomBonus'],
    calculate: (stats) => {
      const base = stats.wisdom || 0;
      const bonus = stats.wisdomBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Wisdom after bonuses applied',
  },
  totalVitality: {
    id: 'totalVitality',
    name: 'Total Vitality',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['vitality', 'vitalityBonus'],
    calculate: (stats) => {
      const base = stats.vitality || 0;
      const bonus = stats.vitalityBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Vitality after bonuses applied',
  },
  totalEndurance: {
    id: 'totalEndurance',
    name: 'Total Endurance',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['endurance', 'enduranceBonus'],
    calculate: (stats) => {
      const base = stats.endurance || 0;
      const bonus = stats.enduranceBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Endurance after bonuses applied',
  },
  totalAgility: {
    id: 'totalAgility',
    name: 'Total Agility',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['agility', 'agilityBonus'],
    calculate: (stats) => {
      const base = stats.agility || 0;
      const bonus = stats.agilityBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Agility after bonuses applied',
  },
  totalLuck: {
    id: 'totalLuck',
    name: 'Total Luck',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['luck', 'luckBonus'],
    calculate: (stats) => {
      const base = stats.luck || 0;
      const bonus = stats.luckBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Luck after bonuses applied',
  },
  totalStamina: {
    id: 'totalStamina',
    name: 'Total Stamina',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['stamina', 'staminaBonus'],
    calculate: (stats) => {
      const base = stats.stamina || 0;
      const bonus = stats.staminaBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Stamina after bonuses applied',
  },

  // Defense totals
  totalArmor: {
    id: 'totalArmor',
    name: 'Total Armor',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['armor', 'armorBonus'],
    calculate: (stats) => {
      const base = stats.armor || 0;
      const bonus = stats.armorBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Armor after bonuses applied',
  },
  totalHealth: {
    id: 'totalHealth',
    name: 'Total Health',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['health', 'healthBonus'],
    calculate: (stats) => {
      const base = stats.health || 0;
      const bonus = stats.healthBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Health after bonuses applied',
  },
  totalDamage: {
    id: 'totalDamage',
    name: 'Total Damage',
    category: 'totals',
    layer: LAYERS.TOTALS,
    dependencies: ['damage', 'damageBonus'],
    calculate: (stats) => {
      const base = stats.damage || 0;
      const bonus = stats.damageBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Damage after bonuses applied',
  },

  // ---------------------------------------------------------------------------
  // LAYER 2: PRIMARY DERIVED (monogram-style bonuses from total stats)
  // ---------------------------------------------------------------------------

  /**
   * Placeholder: Monogram gives "+X newCharacterValue per 100 totalStrength"
   * In practice, the ratio/baseValue would come from item affix data
   */
  monogramValueFromStrength: {
    id: 'monogramValueFromStrength',
    name: 'Monogram Value (STR)',
    category: 'monogram',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['totalStrength'],
    // Config can be overridden per-item/affix
    config: {
      sourceStat: 'totalStrength',
      ratio: 100,    // per 100 points of source
      baseValue: 1,  // gain this much per ratio
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.monogramValueFromStrength.config;
      const source = stats[config.sourceStat] || 0;
      return Math.floor(source / config.ratio) * config.baseValue;
    },
    format: v => v.toFixed(0),
    description: 'Bonus value from monogram based on strength',
  },

  /**
   * Placeholder: Potions per combined attributes
   */
  potionSlotsFromAttributes: {
    id: 'potionSlotsFromAttributes',
    name: 'Potion Slots (Attrs)',
    category: 'utility-derived',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['totalStrength', 'totalVitality'],
    config: {
      ratio: 200,  // per 200 combined str+vit
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.potionSlotsFromAttributes.config;
      const combined = (stats.totalStrength || 0) + (stats.totalVitality || 0);
      return Math.floor(combined / config.ratio);
    },
    format: v => v.toFixed(0),
    description: 'Additional potion slots from attributes',
  },

  // ---------------------------------------------------------------------------
  // LAYER 3: SECONDARY DERIVED (chain from layer 2)
  // ---------------------------------------------------------------------------

  /**
   * Placeholder: "+X% elemental damage per monogramValue"
   * Chain: totalStrength -> monogramValue -> elementalDamageBonus
   */
  chainedElementalBonus: {
    id: 'chainedElementalBonus',
    name: 'Elemental Bonus (Chain)',
    category: 'chained',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['monogramValueFromStrength'],
    config: {
      sourceStat: 'monogramValueFromStrength',
      ratio: 1,      // per 1 point
      baseValue: 2,  // gain 2% per point
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.chainedElementalBonus.config;
      const source = stats[config.sourceStat] || 0;
      return Math.floor(source / config.ratio) * config.baseValue;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Elemental damage bonus from chained calculation',
  },

  /**
   * Placeholder: Stat bonus per potion slot
   */
  statBonusFromPotions: {
    id: 'statBonusFromPotions',
    name: 'Stat Bonus (Potions)',
    category: 'chained',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['potionSlotsFromAttributes'],
    config: {
      sourceStat: 'potionSlotsFromAttributes',
      ratio: 1,
      baseValue: 5,  // +5 to stats per potion slot
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.statBonusFromPotions.config;
      const source = stats[config.sourceStat] || 0;
      return Math.floor(source / config.ratio) * config.baseValue;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Bonus to stats from potion slots',
  },

  // ---------------------------------------------------------------------------
  // LAYER 4: TERTIARY DERIVED (chain from layer 3)
  // ---------------------------------------------------------------------------

  /**
   * Placeholder: "+X health per chainedElementalBonus"
   * Chain: totalStrength -> monogramValue -> elementalBonus -> healthBonus
   */
  chainedHealthBonus: {
    id: 'chainedHealthBonus',
    name: 'Health Bonus (Chain)',
    category: 'chained',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['chainedElementalBonus'],
    config: {
      sourceStat: 'chainedElementalBonus',
      ratio: 5,       // per 5% elemental
      baseValue: 10,  // gain 10 health
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.chainedHealthBonus.config;
      const source = stats[config.sourceStat] || 0;
      return Math.floor(source / config.ratio) * config.baseValue;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Health bonus from chained elemental calculation',
  },
};

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

/**
 * Get stats grouped by layer for ordered calculation
 */
export function getStatsByLayer() {
  const byLayer = {};

  for (const [id, stat] of Object.entries(DERIVED_STATS)) {
    const layer = stat.layer ?? LAYERS.TOTALS;
    if (!byLayer[layer]) {
      byLayer[layer] = [];
    }
    byLayer[layer].push({ id, ...stat });
  }

  return byLayer;
}

/**
 * Get calculation order (layers sorted, then topological within layer)
 */
export function getCalculationOrder() {
  const byLayer = getStatsByLayer();
  const layers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);

  const order = [];
  for (const layer of layers) {
    // Within each layer, sort by dependencies (simple approach: deps first)
    const layerStats = byLayer[layer] || [];
    const sorted = topologicalSortWithinLayer(layerStats);
    order.push(...sorted);
  }

  return order;
}

/**
 * Simple topological sort within a layer
 */
function topologicalSortWithinLayer(stats) {
  const statMap = new Map(stats.map(s => [s.id, s]));
  const inDegree = new Map();
  const graph = new Map();

  // Initialize
  for (const stat of stats) {
    inDegree.set(stat.id, 0);
    graph.set(stat.id, []);
  }

  // Build edges (only for deps within this layer)
  for (const stat of stats) {
    for (const dep of stat.dependencies || []) {
      if (statMap.has(dep)) {
        graph.get(dep).push(stat.id);
        inDegree.set(stat.id, (inDegree.get(stat.id) || 0) + 1);
      }
    }
  }

  // Kahn's algorithm
  const queue = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(statMap.get(current));

    for (const next of graph.get(current) || []) {
      const newDegree = inDegree.get(next) - 1;
      inDegree.set(next, newDegree);
      if (newDegree === 0) queue.push(next);
    }
  }

  // Add any remaining (shouldn't happen if no cycles)
  for (const stat of stats) {
    if (!sorted.find(s => s.id === stat.id)) {
      sorted.push(stat);
    }
  }

  return sorted;
}

/**
 * Calculate all derived stats from base stats
 *
 * @param {Object} baseStats - Map of statId -> value (from items/character)
 * @param {Object} configOverrides - Optional per-stat config overrides
 * @returns {Object} All stats including derived values
 */
export function calculateDerivedStats(baseStats, configOverrides = {}) {
  const result = { ...baseStats };
  const calculationOrder = getCalculationOrder();

  for (const stat of calculationOrder) {
    const config = configOverrides[stat.id] || stat.config;
    result[stat.id] = stat.calculate(result, config);
  }

  return result;
}

/**
 * Calculate and return detailed stat objects (for UI display)
 */
export function calculateDerivedStatsDetailed(baseStats, configOverrides = {}) {
  const values = calculateDerivedStats(baseStats, configOverrides);
  const calculationOrder = getCalculationOrder();

  const detailed = [];
  for (const stat of calculationOrder) {
    detailed.push({
      id: stat.id,
      name: stat.name,
      category: stat.category,
      layer: stat.layer,
      value: values[stat.id],
      formattedValue: stat.format ? stat.format(values[stat.id]) : String(values[stat.id]),
      dependencies: stat.dependencies || [],
      description: stat.description,
    });
  }

  return {
    values,
    detailed,
    byCategory: groupByCategory(detailed),
    byLayer: groupByLayer(detailed),
  };
}

function groupByCategory(stats) {
  const grouped = {};
  for (const stat of stats) {
    if (!grouped[stat.category]) grouped[stat.category] = [];
    grouped[stat.category].push(stat);
  }
  return grouped;
}

function groupByLayer(stats) {
  const grouped = {};
  for (const stat of stats) {
    const layer = stat.layer ?? LAYERS.TOTALS;
    if (!grouped[layer]) grouped[layer] = [];
    grouped[layer].push(stat);
  }
  return grouped;
}

/**
 * Get the full dependency chain for a stat (for debugging/tooltips)
 */
export function getDependencyChain(statId, visited = new Set()) {
  if (visited.has(statId)) return [];
  visited.add(statId);

  const stat = DERIVED_STATS[statId];
  if (!stat) return [statId]; // Base stat

  const chain = [];
  for (const dep of stat.dependencies || []) {
    chain.push(...getDependencyChain(dep, visited));
  }
  chain.push(statId);

  return chain;
}

/**
 * Get base stat IDs from the registry (for reference)
 */
export function getBaseStatIds() {
  return Object.keys(STAT_REGISTRY);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  LAYERS,
  DERIVED_STATS,
  calculateDerivedStats,
  calculateDerivedStatsDetailed,
  getCalculationOrder,
  getStatsByLayer,
  getDependencyChain,
  getBaseStatIds,
};
