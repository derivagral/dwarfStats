/**
 * Derived Stats Calculation Engine
 *
 * Handles chained stat calculations with dependency resolution.
 * Stats are calculated in topological order based on their dependencies.
 *
 * Calculation Types:
 * - 'sum': Add base + bonus (e.g., totalStrength = strength + strengthBonus%)
 * - 'perStat': X amount per Y stat (e.g., +5 damage per 100 strength)
 * - 'multiply': Base * multiplier (e.g., armor * (1 + armorBonus))
 * - 'chain': Output of previous calculation feeds into next
 * - 'custom': Arbitrary calculation function
 *
 * Example chains:
 * - totalAttribute -> potionsPerAttribute -> statPerPotion
 * - newCharacterValue per totalAttribute -> elementalDamage% per newCharacterValue
 */

// ============================================================================
// DERIVED STAT DEFINITIONS
// ============================================================================

export const DERIVED_STATS = {
  // ---------------------------------------------------------------------------
  // TOTAL ATTRIBUTES (base + bonus%)
  // ---------------------------------------------------------------------------
  totalStrength: {
    id: 'totalStrength',
    name: 'Total Strength',
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
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
    category: 'derived',
    dependencies: ['stamina', 'staminaBonus'],
    calculate: (stats) => {
      const base = stats.stamina || 0;
      const bonus = stats.staminaBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Stamina after bonuses applied',
  },

  // ---------------------------------------------------------------------------
  // TOTAL DEFENSE
  // ---------------------------------------------------------------------------
  totalArmor: {
    id: 'totalArmor',
    name: 'Total Armor',
    category: 'derived',
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
    category: 'derived',
    dependencies: ['health', 'healthBonus'],
    calculate: (stats) => {
      const base = stats.health || 0;
      const bonus = stats.healthBonus || 0;
      return Math.floor(base * (1 + bonus / 100));
    },
    format: v => v.toFixed(0),
    description: 'Health after bonuses applied',
  },

  // ---------------------------------------------------------------------------
  // CHAINED CALCULATIONS - PLACEHOLDERS
  // These demonstrate the "X per Y" pattern for monograms and other modifiers
  // ---------------------------------------------------------------------------

  /**
   * Example: Monogram gives "+X newCharacterValue per 100 totalStrength"
   * This is a placeholder - actual values would come from item affixes
   */
  monogramValueFromStrength: {
    id: 'monogramValueFromStrength',
    name: 'Monogram Value (from STR)',
    category: 'derived-chain',
    dependencies: ['totalStrength'],
    // Placeholder: 1 value per 100 strength
    perStatConfig: {
      sourceStat: 'totalStrength',
      ratio: 100,  // per 100 points
      baseValue: 1, // gain 1 per ratio
    },
    calculate: (stats, config) => {
      const source = stats.totalStrength || 0;
      const cfg = config?.perStatConfig || { ratio: 100, baseValue: 1 };
      return Math.floor(source / cfg.ratio) * cfg.baseValue;
    },
    format: v => v.toFixed(0),
    description: 'Bonus value from monogram based on total strength',
  },

  /**
   * Example: "+X% elemental damage per monogramValue"
   * Chain: totalStrength -> monogramValue -> elementalDamage%
   */
  chainedElementalBonus: {
    id: 'chainedElementalBonus',
    name: 'Chained Elemental Bonus',
    category: 'derived-chain',
    dependencies: ['monogramValueFromStrength'],
    perStatConfig: {
      sourceStat: 'monogramValueFromStrength',
      ratio: 1,    // per 1 point
      baseValue: 2, // gain 2% per point
    },
    calculate: (stats, config) => {
      const source = stats.monogramValueFromStrength || 0;
      const cfg = config?.perStatConfig || { ratio: 1, baseValue: 2 };
      return Math.floor(source / cfg.ratio) * cfg.baseValue;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Elemental damage bonus from chained monogram calculation',
  },

  /**
   * Example: "+X health per chainedElementalBonus"
   * Chain: totalStrength -> monogramValue -> elementalDamage% -> healthBonus
   */
  chainedHealthBonus: {
    id: 'chainedHealthBonus',
    name: 'Chained Health Bonus',
    category: 'derived-chain',
    dependencies: ['chainedElementalBonus'],
    perStatConfig: {
      sourceStat: 'chainedElementalBonus',
      ratio: 5,    // per 5% elemental
      baseValue: 10, // gain 10 health
    },
    calculate: (stats, config) => {
      const source = stats.chainedElementalBonus || 0;
      const cfg = config?.perStatConfig || { ratio: 5, baseValue: 10 };
      return Math.floor(source / cfg.ratio) * cfg.baseValue;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Health bonus from chained elemental calculation',
  },

  // ---------------------------------------------------------------------------
  // POTION CHAIN PLACEHOLDER
  // totalAttribute -> potionsPerAttribute -> statPerPotion
  // ---------------------------------------------------------------------------
  potionCountFromAttributes: {
    id: 'potionCountFromAttributes',
    name: 'Potion Slots (from Attributes)',
    category: 'derived-chain',
    dependencies: ['totalStrength', 'totalVitality'],
    calculate: (stats) => {
      // Example: 1 potion per 200 combined str+vit
      const combined = (stats.totalStrength || 0) + (stats.totalVitality || 0);
      return Math.floor(combined / 200);
    },
    format: v => v.toFixed(0),
    description: 'Additional potion slots from attributes',
  },

  statBonusFromPotions: {
    id: 'statBonusFromPotions',
    name: 'Stat Bonus (from Potions)',
    category: 'derived-chain',
    dependencies: ['potionCountFromAttributes'],
    perStatConfig: {
      sourceStat: 'potionCountFromAttributes',
      ratio: 1,
      baseValue: 5, // +5 to all stats per potion slot
    },
    calculate: (stats, config) => {
      const source = stats.potionCountFromAttributes || 0;
      const cfg = config?.perStatConfig || { ratio: 1, baseValue: 5 };
      return Math.floor(source / cfg.ratio) * cfg.baseValue;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Bonus to all stats from potion slots',
  },
};

// ============================================================================
// DEPENDENCY GRAPH & CALCULATION ENGINE
// ============================================================================

/**
 * Build adjacency list for dependency graph
 */
function buildDependencyGraph(derivedStats, baseStatIds) {
  const graph = new Map();
  const allStats = new Set([...baseStatIds, ...Object.keys(derivedStats)]);

  // Initialize all nodes
  for (const statId of allStats) {
    graph.set(statId, []);
  }

  // Add edges (stat -> stats that depend on it)
  for (const [statId, stat] of Object.entries(derivedStats)) {
    for (const dep of stat.dependencies || []) {
      if (graph.has(dep)) {
        graph.get(dep).push(statId);
      }
    }
  }

  return graph;
}

/**
 * Topological sort using Kahn's algorithm
 * Returns stats in calculation order (dependencies first)
 */
function topologicalSort(derivedStats, baseStatIds) {
  const inDegree = new Map();
  const graph = buildDependencyGraph(derivedStats, baseStatIds);

  // Calculate in-degrees
  for (const statId of graph.keys()) {
    inDegree.set(statId, 0);
  }

  for (const [statId, stat] of Object.entries(derivedStats)) {
    for (const dep of stat.dependencies || []) {
      const current = inDegree.get(statId) || 0;
      inDegree.set(statId, current + 1);
    }
  }

  // Start with nodes that have no dependencies (base stats)
  const queue = [];
  for (const [statId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(statId);
    }
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    for (const dependent of graph.get(current) || []) {
      const newDegree = inDegree.get(dependent) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // Filter to only derived stats (in correct order)
  return sorted.filter(id => derivedStats[id]);
}

/**
 * Calculate all derived stats in dependency order
 * @param {Object} baseStats - Map of statId -> value (from items, character, etc.)
 * @param {Object} overrides - Optional config overrides for perStatConfig
 * @returns {Object} Map of all stats including derived values
 */
export function calculateDerivedStats(baseStats, overrides = {}) {
  const result = { ...baseStats };
  const baseStatIds = Object.keys(baseStats);

  // Get calculation order
  const calculationOrder = topologicalSort(DERIVED_STATS, baseStatIds);

  // Calculate each derived stat in order
  for (const statId of calculationOrder) {
    const stat = DERIVED_STATS[statId];
    if (stat && stat.calculate) {
      const config = overrides[statId] || stat;
      result[statId] = stat.calculate(result, config);
    }
  }

  return result;
}

/**
 * Get the dependency chain for a specific stat (for debugging/display)
 */
export function getDependencyChain(statId) {
  const chain = [];
  const visited = new Set();

  function traverse(id) {
    if (visited.has(id)) return;
    visited.add(id);

    const stat = DERIVED_STATS[id];
    if (stat?.dependencies) {
      for (const dep of stat.dependencies) {
        traverse(dep);
      }
    }
    chain.push(id);
  }

  traverse(statId);
  return chain;
}

/**
 * Validate that there are no circular dependencies
 */
export function validateNoCycles() {
  const baseStatIds = []; // Would come from STAT_REGISTRY
  const sorted = topologicalSort(DERIVED_STATS, baseStatIds);
  const derivedCount = Object.keys(DERIVED_STATS).length;

  if (sorted.length !== derivedCount) {
    const missing = Object.keys(DERIVED_STATS).filter(id => !sorted.includes(id));
    throw new Error(`Circular dependency detected involving: ${missing.join(', ')}`);
  }

  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DERIVED_STATS,
  calculateDerivedStats,
  getDependencyChain,
  validateNoCycles,
};
