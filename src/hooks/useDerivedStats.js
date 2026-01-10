import { useMemo } from 'react';
import { STAT_DEFINITIONS } from '../utils/statRegistry.js';
import {
  calculateDerivedStatsDetailed,
  LAYERS,
  DERIVED_STATS,
} from '../utils/derivedStats.js';

/**
 * Stat definition structure (provided by statRegistry.js):
 * {
 *   id: string,           // Unique identifier
 *   name: string,         // Display name
 *   category: string,     // Category grouping (e.g., 'offense', 'defense', 'attributes')
 *   calculate: (sources) => number,  // Calculation function
 *   format: (value) => string,       // Optional formatter
 *   sources: string[],    // Attribute patterns to sum/use
 *   description: string,  // Tooltip description
 * }
 */

// Helper to sum attribute values matching patterns from all items
function sumFromItems(items, patterns) {
  if (!items || !patterns || patterns.length === 0) return { total: 0, breakdown: [] };

  const breakdown = [];
  let total = 0;

  const regexPatterns = patterns.map(p =>
    typeof p === 'string' ? new RegExp(p, 'i') : p
  );

  for (const item of items) {
    if (!item?.attributes) continue;

    for (const attr of item.attributes) {
      for (const pattern of regexPatterns) {
        if (pattern.test(attr.name)) {
          const value = typeof attr.value === 'number' ? attr.value : parseFloat(attr.value) || 0;
          total += value;
          breakdown.push({
            source: item.name || item.itemRow || 'Unknown Item',
            slot: item.slot || 'unknown',
            attribute: attr.name,
            value: value
          });
          break; // Only match once per attribute
        }
      }
    }
  }

  return { total, breakdown };
}

// Helper to get a single value from save data by path
function getFromSave(saveData, path) {
  if (!saveData || !path) return { value: 0, found: false };

  const parts = path.split('.');
  let current = saveData;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return { value: 0, found: false };
    }
    current = current[part];
  }

  const value = typeof current === 'number' ? current : parseFloat(current) || 0;
  return { value, found: current !== undefined };
}

// Use stat definitions from the unified registry
const defaultStatDefinitions = STAT_DEFINITIONS;

/**
 * Hook to derive stats from character data
 * @param {Object} characterData - The character data including equipped items
 * @param {Array} customDefinitions - Optional custom stat definitions to use instead of defaults
 * @param {Object} options - Additional options
 * @param {boolean} options.includeDerived - Whether to calculate chained derived stats (default: true)
 * @param {Object} options.derivedConfigOverrides - Per-stat config overrides for derived calculations
 * @returns {Object} - { stats, categories, getStat, getCategory, derivedStats, allStats }
 */
export function useDerivedStats(characterData, customDefinitions = null, options = {}) {
  const {
    includeDerived = true,
    derivedConfigOverrides = {},
  } = options;
  const definitions = customDefinitions || defaultStatDefinitions;

  const result = useMemo(() => {
    if (!characterData) {
      return {
        stats: [],
        categories: {},
        byId: {},
        derivedStats: { values: {}, detailed: [], byCategory: {}, byLayer: {} },
        allStats: {},
      };
    }

    const items = characterData.equippedItems || [];
    const saveData = characterData.raw || {};

    // =========================================================================
    // LAYER 0: Calculate base stats from items
    // =========================================================================
    const baseStats = definitions.map(def => {
      // Calculate sum from items (includes any modified item stats)
      const itemSum = sumFromItems(items, def.sources);

      // Get any direct save data values
      const saveValues = {};
      if (def.savePaths) {
        for (const [key, path] of Object.entries(def.savePaths)) {
          saveValues[key] = getFromSave(saveData, path);
        }
      }

      // Build sources object for calculation
      const sources = {
        itemSum,
        saveValues,
        items,
        saveData
      };

      // Calculate final value
      const rawValue = def.calculate(sources);
      const formattedValue = def.format ? def.format(rawValue) : rawValue.toString();

      return {
        id: def.id,
        name: def.name,
        category: def.category,
        layer: LAYERS.BASE,
        value: rawValue,
        formattedValue,
        breakdown: itemSum.breakdown,
        description: def.description,
        sources: def.sources
      };
    });

    // Group by category
    const categories = {};
    for (const stat of baseStats) {
      if (!categories[stat.category]) {
        categories[stat.category] = [];
      }
      categories[stat.category].push(stat);
    }

    // Index by id
    const byId = {};
    for (const stat of baseStats) {
      byId[stat.id] = stat;
    }

    // =========================================================================
    // LAYERS 1+: Calculate derived stats (totals, chained, etc.)
    // =========================================================================
    let derivedStatsResult = { values: {}, detailed: [], byCategory: {}, byLayer: {} };

    if (includeDerived) {
      // Build base stats map for derived calculation
      const baseStatsMap = {};
      for (const stat of baseStats) {
        baseStatsMap[stat.id] = stat.value;
      }

      // Calculate all derived stats
      derivedStatsResult = calculateDerivedStatsDetailed(baseStatsMap, derivedConfigOverrides);

      // Add derived stats to categories and byId
      for (const stat of derivedStatsResult.detailed) {
        if (!categories[stat.category]) {
          categories[stat.category] = [];
        }
        categories[stat.category].push(stat);
        byId[stat.id] = stat;
      }
    }

    // Build combined all stats map
    const allStats = { ...derivedStatsResult.values };
    for (const stat of baseStats) {
      allStats[stat.id] = stat.value;
    }

    return {
      stats: baseStats,
      categories,
      byId,
      derivedStats: derivedStatsResult,
      allStats,
    };
  }, [characterData, definitions, includeDerived, derivedConfigOverrides]);

  const getStat = (id) => result.byId[id] || null;
  const getCategory = (category) => result.categories[category] || [];
  const getStatValue = (id) => result.allStats[id] ?? null;

  return {
    // Base stats (layer 0)
    stats: result.stats,
    // All categories (including derived)
    categories: result.categories,
    // Lookup helpers
    getStat,
    getCategory,
    getStatValue,
    // Derived stats details (layers 1+)
    derivedStats: result.derivedStats,
    // All stat values in one map
    allStats: result.allStats,
  };
}

// Re-export for convenience
export { defaultStatDefinitions, sumFromItems, getFromSave };
export { LAYERS, DERIVED_STATS } from '../utils/derivedStats.js';
