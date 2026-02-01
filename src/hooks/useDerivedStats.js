import { useMemo } from 'react';
import { calculateDerivedStats, calculateDerivedStatsDetailed, DERIVED_STATS, LAYERS } from '../utils/derivedStats.js';
import { getStatType } from '../utils/statBuckets.js';
import { STAT_REGISTRY } from '../utils/statRegistry.js';

/**
 * Hook for calculating derived stats from equipped items
 *
 * Aggregates base stats from all equipped items, applies overrides,
 * and calculates derived/chained stats using the calculation engine.
 *
 * @param {Object} options
 * @param {Array} options.equippedItems - Array of equipped item objects with model data
 * @param {Object} options.itemOverrides - Per-slot stat overrides from useItemOverrides
 * @param {Object} options.characterStats - Base character stats (level, class bonuses, etc.)
 * @returns {Object} Aggregated and calculated stats
 */
export function useDerivedStats(options = {}) {
  const { equippedItems = [], itemOverrides = {}, characterStats = {} } = options;

  // Aggregate base stats from all equipped items
  // Supports both formats:
  //   - New model format: item.model.baseStats (from itemTransformer)
  //   - Old format: item.attributes (from equipmentParser)
  const aggregatedBaseStats = useMemo(() => {
    const stats = { ...characterStats };

    for (const item of equippedItems) {
      // Get base stats from either format
      const baseStats = item?.model?.baseStats || item?.attributes;
      if (!baseStats || !Array.isArray(baseStats)) continue;

      const slotKey = item.slotKey || item.slot || '';
      const overrides = itemOverrides[slotKey] || {};
      const removedIndices = overrides.removedIndices || [];

      // Add base stats from this item (excluding removed ones)
      baseStats.forEach((stat, index) => {
        if (removedIndices.includes(index)) return;

        // Handle both formats: { stat, rawTag, value } or { name, value }
        const rawTag = stat.rawTag || stat.stat || stat.name;
        const statId = resolveStatId(rawTag);
        if (statId) {
          stats[statId] = (stats[statId] || 0) + (stat.value || 0);
        }
      });

      // Add override mods
      for (const mod of overrides.mods || []) {
        if (mod.statId && mod.value !== undefined) {
          stats[mod.statId] = (stats[mod.statId] || 0) + mod.value;
        }
      }
    }

    return stats;
  }, [equippedItems, itemOverrides, characterStats]);

  // Collect all applied monograms for config overrides
  // Supports both formats:
  //   - New model format: item.model.monograms
  //   - Old format: monograms need to be parsed from attributes (not yet implemented)
  const appliedMonograms = useMemo(() => {
    const monograms = [];

    for (const item of equippedItems) {
      // Monograms from item model
      const itemMonograms = item?.model?.monograms || item?.monograms;
      if (itemMonograms && Array.isArray(itemMonograms)) {
        for (const mono of itemMonograms) {
          monograms.push({
            id: mono.id,
            value: mono.value,
            source: 'item',
            itemSlot: item.slot,
          });
        }
      }

      // Added monograms from overrides
      const slotKey = item?.slotKey || item?.slot || '';
      const overrides = itemOverrides[slotKey] || {};
      for (const mono of overrides.monograms || []) {
        monograms.push({
          id: mono.id,
          value: mono.value || 1,
          source: 'override',
          itemSlot: item?.slot,
        });
      }
    }

    return monograms;
  }, [equippedItems, itemOverrides]);

  // Build config overrides from applied monograms
  // This maps monogram effects to calculation engine configs
  const configOverrides = useMemo(() => {
    const overrides = {};

    // For each applied monogram, check if it has calculation effects
    for (const mono of appliedMonograms) {
      const monoConfig = MONOGRAM_CALC_CONFIGS[mono.id];
      if (!monoConfig) continue;

      // Handle new 'effects' array format (multiple derived stats per monogram)
      if (monoConfig.effects) {
        for (const effect of monoConfig.effects) {
          if (effect.derivedStatId && effect.config) {
            overrides[effect.derivedStatId] = {
              ...DERIVED_STATS[effect.derivedStatId]?.config,
              ...effect.config,
            };
          }
        }
      }
      // Handle legacy single-stat format
      else if (monoConfig.derivedStatId && monoConfig.config) {
        overrides[monoConfig.derivedStatId] = {
          ...DERIVED_STATS[monoConfig.derivedStatId]?.config,
          ...monoConfig.config,
        };
      }
    }

    return overrides;
  }, [appliedMonograms]);

  // Calculate all derived stats
  const calculatedStats = useMemo(() => {
    return calculateDerivedStatsDetailed(aggregatedBaseStats, configOverrides);
  }, [aggregatedBaseStats, configOverrides]);

  // Get summary stats for display
  const summary = useMemo(() => {
    const { values } = calculatedStats;
    return {
      // Primary attributes
      strength: values.totalStrength || values.strength || 0,
      dexterity: values.totalDexterity || values.dexterity || 0,
      wisdom: values.totalWisdom || values.wisdom || 0,
      vitality: values.totalVitality || values.vitality || 0,
      endurance: values.totalEndurance || values.endurance || 0,
      agility: values.totalAgility || values.agility || 0,
      luck: values.totalLuck || values.luck || 0,
      stamina: values.totalStamina || values.stamina || 0,

      // Combat stats
      damage: values.finalDamage || values.totalDamage || values.damage || 0,
      armor: values.totalArmor || values.armor || 0,
      health: values.totalHealth || values.health || 0,
      critChance: values.critChance || 0,
      critDamage: values.critDamage || 0,

      // Monogram-derived
      monogramBonuses: Object.entries(values)
        .filter(([key]) => key.startsWith('monogram') || key.startsWith('chained'))
        .map(([key, value]) => ({ id: key, value })),
    };
  }, [calculatedStats]);

  // Build categories for StatsPanel display
  const categories = useMemo(() => {
    const { values, detailed } = calculatedStats;

    // Map internal categories to display categories
    const categoryMapping = {
      totals: 'attributes',
      conversion: 'offense',
      monogram: 'offense',
      chained: 'offense',
      final: 'offense',
      'utility-derived': 'defense',
    };

    const result = {
      attributes: [],
      offense: [],
      defense: [],
      elemental: [],
    };

    for (const stat of detailed) {
      const displayCategory = categoryMapping[stat.category] || 'attributes';
      if (result[displayCategory]) {
        result[displayCategory].push({
          id: stat.id,
          name: stat.name,
          value: stat.value,
          formattedValue: stat.formattedValue,
          description: stat.description,
          layer: stat.layer,
        });
      }
    }

    // Also add any raw base stats that weren't calculated
    for (const [statId, value] of Object.entries(aggregatedBaseStats)) {
      // Skip if already in detailed
      if (detailed.some(d => d.id === statId)) continue;

      const statDef = STAT_REGISTRY[statId];
      if (statDef) {
        const displayCategory = statDef.category === 'stance' ? 'offense' :
                               statDef.category === 'defense' ? 'defense' :
                               statDef.category === 'elemental' ? 'elemental' : 'attributes';
        result[displayCategory].push({
          id: statId,
          name: statDef.name,
          value: value,
          formattedValue: statDef.format ? statDef.format(value) : String(value),
          description: statDef.description,
          layer: LAYERS.BASE,
        });
      }
    }

    return result;
  }, [calculatedStats, aggregatedBaseStats]);

  return {
    // For StatsPanel compatibility
    categories,

    // Raw aggregated stats (before calculation)
    baseStats: aggregatedBaseStats,

    // All calculated values
    values: calculatedStats.values,

    // Detailed stat objects for UI
    detailed: calculatedStats.detailed,

    // Stats grouped by category
    byCategory: calculatedStats.byCategory,

    // Stats grouped by layer
    byLayer: calculatedStats.byLayer,

    // Summary for quick display
    summary,

    // Applied monograms list
    appliedMonograms,

    // Config overrides applied
    configOverrides,
  };
}

/**
 * Resolve a raw tag or stat name to a statId
 * @param {string} rawTag - Raw attribute tag or stat name
 * @returns {string|null} Normalized stat ID
 */
function resolveStatId(rawTag) {
  if (!rawTag) return null;

  // Try direct lookup first
  const statType = getStatType(rawTag);
  if (statType) return statType.id;

  // Extract last segment and try again
  const parts = rawTag.split('.');
  const lastPart = parts[parts.length - 1];

  // Normalize common patterns
  const normalized = lastPart
    .replace(/%6?$/, '')  // Remove %6 or % suffix
    .replace(/Bonus$/, 'Bonus')
    .toLowerCase();

  // Check against known stat patterns
  for (const [id, stat] of Object.entries(STAT_REGISTRY)) {
    if (stat.patterns?.some(p => p.toLowerCase().includes(normalized))) {
      return id;
    }
  }

  // Fallback: use the last part as-is (camelCase)
  return lastPart.charAt(0).toLowerCase() + lastPart.slice(1);
}

// ============================================================================
// MONOGRAM CALCULATION CONFIGS
// ============================================================================

/**
 * Maps monogram IDs to their calculation engine configs
 *
 * When a monogram is applied, these configs override the default
 * calculation parameters in DERIVED_STATS.
 *
 * Structure:
 * - derivedStatId: Which derived stat this monogram affects
 * - config: Override values for that stat's calculation
 * - Multi-stat monograms can have multiple entries via 'effects' array
 */
export const MONOGRAM_CALC_CONFIGS = {
  // ===========================================================================
  // PHASING (Helmet Monogram - 50 stacks)
  // Effects: 1% damage, 0.5% boss damage per stack
  // ===========================================================================
  'Phasing.TranceEffectsPotency.Highest': {
    // This is the main Phasing monogram that enables stacks
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },
  'AllowPhasing': {
    // Also enables phasing stacks
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },

  // ===========================================================================
  // BLOODLUST (Helmet Monogram - 100 stacks)
  // Effects: 5% crit damage, 3% attack speed, 1% movement speed per stack
  // ===========================================================================
  'Bloodlust.Base': {
    effects: [
      { derivedStatId: 'bloodlustStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  // Additional bloodlust modifiers can enhance the base effect
  'Bloodlust.Damage%PerStack': {
    // Adds damage per stack on top of base bloodlust effects
    derivedStatId: 'monogramValueFromStrength',
    config: {
      sourceStat: 'bloodlustStacks',
      ratio: 1,
      baseValue: 2, // Extra 2% damage per stack
    },
  },

  // ===========================================================================
  // DARK ESSENCE (Amulet Monogram - 500 stacks)
  // At 500 stacks: Essence = highestStat * 1.25
  // ===========================================================================
  'DarkEssence': {
    effects: [
      { derivedStatId: 'darkEssenceStacks', config: { enabled: true, maxStacks: 500, currentStacks: 500 } },
    ],
  },

  // ===========================================================================
  // LIFE BUFF (Amulet Monogram for Bloodlust chain - 100 stacks)
  // Effects: 1% life bonus per stack
  // ===========================================================================
  'Bloodlust.DrawLife': {
    effects: [
      { derivedStatId: 'lifeBuffStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  'Bloodlust.MoreLife.Highest': {
    effects: [
      { derivedStatId: 'lifeBuffStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },

  // ===========================================================================
  // ESSENCE → CRIT CHAIN
  // Missing monogram: 1% crit per 20 essence
  // ===========================================================================
  'BonusCritDamage%ForEssence': {
    // This might be the one - crit bonus from essence
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },
  'GainCritChanceForHighest': {
    // Alternative crit chance source
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },

  // ===========================================================================
  // ELEMENT FOR CRIT CHANCE (Helmet Monogram)
  // 3% fire/arcane/lightning per 1% crit over 100%
  // ===========================================================================
  'ElementForCritChance.Fire': {
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'fire', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Lightning': {
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'lightning', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Arcane': {
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'arcane', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },

  // ===========================================================================
  // LIFE FROM ELEMENT (Ring Monogram)
  // 2% life per 30% of a particular element
  // ===========================================================================
  'ElementalToHp%.Fire': {
    effects: [
      { derivedStatId: 'lifeFromElement', config: { enabled: true, elementPer: 30, lifeBonus: 2 } },
    ],
  },

  // ===========================================================================
  // GAIN DAMAGE FOR HP LOSE ARMOR (Bracer Monogram)
  // 1% of total life as flat damage
  // ===========================================================================
  'GainDamageForHPLoseArmor': {
    effects: [
      { derivedStatId: 'damageFromLife', config: { enabled: true, lifePercent: 1 } },
    ],
  },

  // ===========================================================================
  // RING MONOGRAMS
  // ===========================================================================
  'BonusDamage%ForEssence': {
    // Damage bonus based on essence
    effects: [
      // TODO: Add derived stat for damage% from essence
    ],
  },
  'MaxHp%ForStat.Highest': {
    // HP% bonus based on highest stat
    effects: [
      // TODO: Add derived stat for hp% from highest
    ],
  },
  'DamageReduction%ForStat.Highest': {
    // Damage reduction based on highest stat
    effects: [
      // TODO: Add derived stat for DR from highest
    ],
  },
  'Colossus.ElementalBonusForHighestStat.Arcane': {
    // Arcane damage bonus from highest stat during Colossus
    effects: [
      // TODO: Add derived stat for elemental from highest (conditional on Colossus)
    ],
  },

  // ===========================================================================
  // OTHER EXISTING MONOGRAM CONFIGS
  // ===========================================================================
  'DamageForStat.Highest': {
    derivedStatId: 'monogramValueFromStrength',
    config: {
      sourceStat: 'highestAttribute',
      ratio: 100,
      baseValue: 5,
    },
  },
  'Health%ForHighest': {
    derivedStatId: 'chainedHealthBonus',
    config: {
      sourceStat: 'totalVitality',
      ratio: 50,
      baseValue: 1,
    },
  },
  'Colossus.Base': {
    derivedStatId: null,
  },
  'Colossus.DamageReduction': {
    derivedStatId: null,
  },
  'DamageCircle.Base': {
    derivedStatId: null,
  },
  'DamageCircle.DamageForStats.Highest': {
    derivedStatId: 'damageFromHealth',
    config: {
      sourceStat: 'totalHealth',
      percentage: 1,
    },
  },
  'PotionSlotForStat.Highest': {
    derivedStatId: 'potionSlotsFromAttributes',
    config: {
      ratio: 200,
    },
  },
  'Damage%ForPotions': {
    derivedStatId: 'statBonusFromPotions',
    config: {
      sourceStat: 'potionSlotsFromAttributes',
      ratio: 1,
      baseValue: 3,
    },
  },
};

export default useDerivedStats;
