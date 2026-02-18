import { useMemo } from 'react';
import { calculateDerivedStats, calculateDerivedStatsDetailed, DERIVED_STATS, LAYERS } from '../utils/derivedStats.js';
import { getStatType } from '../utils/statBuckets.js';
import { STAT_REGISTRY } from '../utils/statRegistry.js';
import { MONOGRAM_CALC_CONFIGS } from '../utils/monogramConfigs.js';

// Re-export for backward compatibility
export { MONOGRAM_CALC_CONFIGS } from '../utils/monogramConfigs.js';

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
  const { equippedItems = [], itemOverrides = {}, characterStats = {}, stanceContext = null } = options;

  // Aggregate base stats from all equipped items WITH source tracking
  // Returns { [statId]: { total: number, sources: [{ itemName, slot, value }] } }
  const aggregatedWithSources = useMemo(() => {
    const stats = {};

    // Initialize with character stats (if any)
    for (const [statId, rawValue] of Object.entries(characterStats)) {
      const value = typeof rawValue === 'number' ? rawValue : Number(rawValue?.value || 0);
      const sourceName = rawValue?.sourceName || 'Character';
      stats[statId] = {
        total: value,
        sources: [{ itemName: sourceName, slot: 'base', value }],
      };
    }

    // Active stance mastery defaults: +1% stance-specific damage per mastery level
    const activeStance = stanceContext?.activeStance;
    if (activeStance?.damageStatId && activeStance.mastery > 0) {
      const value = activeStance.mastery * 0.01;
      if (!stats[activeStance.damageStatId]) {
        stats[activeStance.damageStatId] = { total: 0, sources: [] };
      }
      stats[activeStance.damageStatId].total += value;
      stats[activeStance.damageStatId].sources.push({
        itemName: `${activeStance.id}.level.1`,
        slot: 'stance',
        value,
      });
    }

    for (const item of equippedItems) {
      // Get base stats from any of the supported formats:
      //   - item.baseStats (direct from Item model via extractEquippedItems)
      //   - item.model.baseStats (nested model format)
      //   - item.attributes (legacy format)
      const baseStats = item?.baseStats || item?.model?.baseStats || item?.attributes;
      if (!baseStats || !Array.isArray(baseStats)) continue;

      const slotKey = item.slotKey || item.slot || '';
      const itemName = item?.displayName || item?.model?.displayName || item?.name || slotKey;
      const overrides = itemOverrides[slotKey] || {};
      const removedIndices = overrides.removedIndices || [];

      // Add base stats from this item (excluding removed ones)
      baseStats.forEach((stat, index) => {
        if (removedIndices.includes(index)) return;

        // Handle both formats: { stat, rawTag, value } or { name, value }
        const rawTag = stat.rawTag || stat.stat || stat.name;
        const statId = resolveStatId(rawTag);
        if (statId && stat.value) {
          if (!stats[statId]) {
            stats[statId] = { total: 0, sources: [] };
          }
          stats[statId].total += stat.value;
          stats[statId].sources.push({
            itemName,
            slot: slotKey,
            value: stat.value,
          });
        }
      });

      // Add override mods
      for (const mod of overrides.mods || []) {
        if (mod.statId && mod.value !== undefined) {
          if (!stats[mod.statId]) {
            stats[mod.statId] = { total: 0, sources: [] };
          }
          stats[mod.statId].total += mod.value;
          stats[mod.statId].sources.push({
            itemName: `${itemName} (override)`,
            slot: slotKey,
            value: mod.value,
          });
        }
      }
    }

    return stats;
  }, [equippedItems, itemOverrides, characterStats, stanceContext]);

  // Flatten to simple { [statId]: total } for backward compatibility
  const aggregatedBaseStats = useMemo(() => {
    const flat = {};
    for (const [statId, data] of Object.entries(aggregatedWithSources)) {
      flat[statId] = data.total;
    }
    return flat;
  }, [aggregatedWithSources]);

  // Collect all applied monograms for config overrides
  // Supports both formats:
  //   - item.monograms (direct from Item model)
  //   - item.model.monograms (nested model format)
  const appliedMonograms = useMemo(() => {
    const monograms = [];

    for (const item of equippedItems) {
      // Monograms from item (direct or nested model)
      const itemMonograms = item?.monograms || item?.model?.monograms;
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

  // Count how many instances of each monogram ID are applied
  const monogramInstanceCounts = useMemo(() => {
    const counts = {};
    for (const mono of appliedMonograms) {
      counts[mono.id] = (counts[mono.id] || 0) + 1;
    }
    return counts;
  }, [appliedMonograms]);

  // Build config overrides from applied monograms
  // This maps monogram effects to calculation engine configs.
  // When the same monogram appears multiple times (e.g., 2x Bloodlust.Base
  // across helmet + amulet), instanceCount is set so calculations can
  // optionally scale with it.
  const configOverrides = useMemo(() => {
    const overrides = {};
    const seen = new Set();

    const applyMonogramConfig = (monogramId, instanceCount = 1) => {
      if (seen.has(monogramId)) return;
      seen.add(monogramId);

      const monoConfig = MONOGRAM_CALC_CONFIGS[monogramId];
      if (!monoConfig) return;

      if (monoConfig.effects) {
        for (const effect of monoConfig.effects) {
          if (effect.derivedStatId && effect.config) {
            overrides[effect.derivedStatId] = {
              ...DERIVED_STATS[effect.derivedStatId]?.config,
              ...effect.config,
              instanceCount,
            };
          }
        }
      } else if (monoConfig.derivedStatId && monoConfig.config) {
        overrides[monoConfig.derivedStatId] = {
          ...DERIVED_STATS[monoConfig.derivedStatId]?.config,
          ...monoConfig.config,
          instanceCount,
        };
      }
    };

    for (const mono of appliedMonograms) {
      applyMonogramConfig(mono.id, monogramInstanceCounts[mono.id] || 1);
    }

    const activeStance = stanceContext?.activeStance;
    if (activeStance?.keystoneUnlocked && activeStance.keystoneMonogramId) {
      applyMonogramConfig(activeStance.keystoneMonogramId, 1);
    }

    if (activeStance && activeStance.mastery > 0) {
      overrides.paragonLevel = {
        ...DERIVED_STATS.paragonLevel?.config,
        enabled: true,
        level: activeStance.mastery,
      };
    }

    return overrides;
  }, [appliedMonograms, monogramInstanceCounts, stanceContext]);

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

    // Primary attribute IDs that should go in "attributes" category
    const primaryAttributeIds = new Set([
      'strength', 'dexterity', 'wisdom', 'vitality',
      'endurance', 'agility', 'luck', 'stamina',
      'health', 'armor', 'damage',
      // Also include their bonus variants
      'strengthBonus', 'dexterityBonus', 'wisdomBonus', 'vitalityBonus',
      'enduranceBonus', 'agilityBonus', 'luckBonus', 'staminaBonus',
      'healthBonus', 'armorBonus', 'damageBonus',
    ]);

    // Monogram-derived stat IDs - these go in the monograms section
    const monogramStatIds = new Set([
      'phasingStacks', 'phasingDamageBonus', 'phasingBossDamageBonus',
      'bloodlustStacks', 'bloodlustCritDamageBonus', 'bloodlustAttackSpeedBonus', 'bloodlustMoveSpeedBonus',
      'darkEssenceStacks', 'essence', 'critChanceFromEssence',
      'lifeBuffStacks', 'lifeBuffBonus',
      'elementForCritChance', 'elementalToHpFire', 'elementalToHpLightning',
      'damageFromHealth', 'finalDamage',
      'highestAttribute', // intermediate calculation
      // Amulet monogram stats
      'shroudStacks', 'shroudLifeBonus',
      'damageCircleLifeBonus',
      'distanceProcsDamageBonus', 'distanceProcsNearDamageBonus',
      'eliteAttackSpeedBonus', 'eliteEnergyBonus',
      'extraLifestealBonus',
      'flatDamageMonogramBonus', 'noEnergyDamageBonus',
      'highestStatDamageBonus',
      'eliteSpawnChance', 'containerSpawnChance',
      // Helmet monogram stats
      'critDamageFromArmor', 'lifeBonusFromCritChance',
      'energyDamageBonus',
      'invSlotBossDamageBonus', 'invSlotCritDamageBonus',
      'juggernautMoveSpeed', 'juggernautCritChance', 'juggernautCritDamage',
      'paragonLevel', 'paragonArmorBonus', 'paragonDamageBonus', 'paragonHpBonus',
      'shroudDamageBonus', 'shroudFlatDamageBonus',
      'snailSpawnChance', 'lifestealToEnergySteal',
      // Bracer monogram stats
      'bloodlustDrawBloodBonus', 'colossusDoubleAttackSpeed',
      'critChanceFromEnergyRegen', 'damagePercentForStat2',
      'damageNoPotionBonus', 'doubleBuffLength',
      'arcaneMineBonus', 'fireMineBonus', 'lightningMineBonus',
      'pulseArcaneDamage', 'pulseFireDamage', 'pulseLightningDamage',
      'chargedSecondaryDamageBonus', 'shroudMaxStacksMultiplier',
      'colossusDamageBonus', 'invSlotDamageBonus',
    ]);

    // Map internal categories to display categories
    const categoryMapping = {
      conversion: 'offense',
      final: 'offense',
      'utility-derived': 'defense',
    };

    const result = {
      attributes: [],
      offense: [],
      stance: [],
      defense: [],
      elemental: [],
      monograms: [],
      abilities: [],
      utility: [],
      unmapped: [],
    };

    const processedIds = new Set();

    // Process calculated/derived stats first
    for (const stat of detailed) {
      // Skip totals category (handled via base stats)
      if (stat.category === 'totals') continue;
      // Skip total* stats (we use base stats directly)
      if (stat.id.startsWith('total')) continue;

      processedIds.add(stat.id);

      // Route monogram stats to monograms section
      if (monogramStatIds.has(stat.id) || stat.category === 'monogram' || stat.category === 'monogram-buff' || stat.category === 'monogram-chain' || stat.category === 'chained') {
        result.monograms.push({
          id: stat.id,
          name: stat.name,
          value: stat.value,
          formattedValue: stat.formattedValue,
          description: stat.description,
          layer: stat.layer,
        });
        continue;
      }

      const displayCategory = categoryMapping[stat.category] || stat.category || 'attributes';
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

    // Add ALL aggregated base stats with source tracking
    for (const [statId, data] of Object.entries(aggregatedWithSources)) {
      // Skip if already processed
      if (processedIds.has(statId)) continue;

      const statDef = STAT_REGISTRY[statId];
      if (statDef) {
        // Use the stat's own category
        const displayCategory = statDef.category || 'attributes';
        if (result[displayCategory]) {
          result[displayCategory].push({
            id: statId,
            name: statDef.name,
            value: data.total,
            formattedValue: statDef.format ? statDef.format(data.total) : String(data.total),
            description: statDef.description,
            sources: data.sources,
            layer: LAYERS.BASE,
          });
        }
      } else {
        // Unmapped stat - add to unmapped category for debugging
        result.unmapped.push({
          id: statId,
          name: statId, // Use raw ID as name
          value: data.total,
          formattedValue: String(data.total.toFixed?.(2) ?? data.total),
          description: `Unmapped stat: ${statId}`,
          sources: data.sources,
          layer: LAYERS.BASE,
        });
      }
    }


    // Add stance context debug/info rows
    if (stanceContext?.activeStance) {
      const active = stanceContext.activeStance;
      result.stance.push({
        id: 'activeStanceSkill',
        name: 'Active Stance Skill',
        value: active.totalSkill || 0,
        formattedValue: `${active.name}: ${(active.totalSkill || 0).toFixed(0)}`,
        description: 'Total stance skill from HostPlayerData',
        sources: [{ itemName: `${active.id}.total`, value: active.totalSkill || 0 }],
        layer: LAYERS.BASE,
      });
      result.stance.push({
        id: 'activeStanceMastery',
        name: 'Active Stance Mastery',
        value: active.mastery || 0,
        formattedValue: (active.mastery || 0).toFixed(0),
        description: 'Mastery = floor((skill - 5000) / 350)',
        sources: [{ itemName: `${active.id}.mastery`, value: active.mastery || 0 }],
        layer: LAYERS.BASE,
      });
      result.stance.push({
        id: 'activeStanceKeystone',
        name: 'Keystone Active',
        value: active.keystoneUnlocked ? 1 : 0,
        formattedValue: active.keystoneUnlocked ? 'Yes' : 'No',
        description: `${active.keystoneAbility || 'Keystone'} unlocks at 5000 while this weapon is equipped`,
        sources: [{ itemName: `${active.id}.keystone`, value: active.keystoneUnlocked ? 1 : 0 }],
        layer: LAYERS.BASE,
      });
    }

    // Sort each category by value descending for easier reading
    for (const key of Object.keys(result)) {
      if (Array.isArray(result[key])) {
        result[key].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      }
    }

    return result;
  }, [calculatedStats, aggregatedWithSources, stanceContext]);

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

  // Log unmapped stats for debugging
  console.warn(`[useDerivedStats] Unmapped stat pattern: "${rawTag}" (normalized: "${normalized}")`);

  // Fallback: use the last part as-is (camelCase)
  return lastPart.charAt(0).toLowerCase() + lastPart.slice(1);
}

export default useDerivedStats;
