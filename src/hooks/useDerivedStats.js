import { useMemo } from 'react';
import { calculateDerivedStats, calculateDerivedStatsDetailed, DERIVED_STATS, LAYERS } from '../utils/derivedStats.js';
import { getStatType } from '../utils/statBuckets.js';
import { STAT_REGISTRY, findStatForAttribute } from '../utils/statRegistry.js';
import { MONOGRAM_CALC_CONFIGS, MONOGRAM_BASE_EFFECTS, ADDITIVE_MONOGRAM_STATS, applyExclusiveMonogramRules } from '../utils/monogramConfigs.js';
import { resolveEffectiveMonograms } from '../utils/monogramOverrides.js';
import { inferWeaponStance, getUniqueSlotKeyMap } from '../utils/equipmentParser.js';
import { aggregateSkillEffects, hasWeaponSkillData, collectMainTreeModifierGrants } from '../utils/skillEffectAggregator.js';
import { detectEquippedAbilities, getStepCooldown } from '../utils/offhandAbilities.js';
import { getRacialContributions } from '../utils/raceBonuses.js';
import { getActiveMonogramStats } from '../utils/monogramSupport.js';
import { ATTRIBUTE_BONUSES } from '../utils/attributeBonuses.js';

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
  const {
    equippedItems = [], itemOverrides = {}, characterStats = {},
    stanceContext = null, maxHealth = 0, skillTree = null,
    characterRace = null, characterLevel = 0,
  } = options;

  // Collect all applied monograms for config overrides
  // Supports both formats:
  //   - item.monograms (direct from Item model)
  //   - item.model.monograms (nested model format)
  const appliedMonograms = useMemo(() => {
    const monograms = [];
    const uniqueSlotKeys = getUniqueSlotKeyMap(equippedItems);

    for (const item of equippedItems) {
      const itemMonograms = item?.monograms || item?.model?.monograms || [];
      const slotKey = uniqueSlotKeys.get(item) || item?.slotKey || item?.slot || '';
      const slotOverride = itemOverrides[slotKey] || {};

      // Overrides replace the imported three positions exactly. This is what
      // makes a dropdown selection a swap rather than an extra fourth effect.
      for (const mono of resolveEffectiveMonograms(itemMonograms, slotOverride)) {
        monograms.push({
          ...mono,
          itemSlot: slotKey,
          itemName: item?.displayName || item?.model?.displayName || item?.name || slotKey,
        });
      }
    }

    // Main-tree modifier grants (e.g. Melee Mastery: Damage = the
    // MeleeParagon.BaseDamage effect, +2 flat per mastery level). These stack
    // ADDITIVELY with helmet monograms of the same id — the shared
    // instanceCount makes the paragon calcs scale per source. Only ids with a
    // calc config matter; Melee/Ranged grants are gated by the active weapon
    // family ("While using a melee/ranged weapon…").
    const family = stanceContext?.activeStance?.monogramFamily || null;
    for (const grant of collectMainTreeModifierGrants(skillTree)) {
      if (!MONOGRAM_CALC_CONFIGS[grant.id] && !MONOGRAM_BASE_EFFECTS[grant.id]) continue;
      if (family && grant.id.startsWith('MeleeParagon') && family !== 'melee') continue;
      if (family && grant.id.startsWith('RangedParagon') && family !== 'ranged') continue;
      monograms.push({
        id: grant.id,
        value: 1,
        source: 'mainTree',
        itemSlot: 'skilltree',
      });
    }

    return monograms;
  }, [equippedItems, itemOverrides, skillTree, stanceContext]);


  // Aggregate base stats from all equipped items WITH source tracking
  // Returns { [statId]: { total: number, sources: [{ itemName, slot, value }] } }
  const aggregatedWithSources = useMemo(() => {
    const stats = {};

    // Initialize with character stats (if any)
    for (const [statId, rawValue] of Object.entries(characterStats)) {
      const value = typeof rawValue === 'number' ? rawValue : Number(rawValue?.value || 0);
      const sourceName = rawValue?.sourceName || 'Character';
      const sourceType = rawValue?.sourceType || 'allocated';
      stats[statId] = {
        total: value,
        sources: [{ itemName: sourceName, slot: 'base', value, sourceType }],
      };
    }

    // Skill tree contributions: cards × level, weapon skills × level, and
    // weapon buffs force-enabled at max stacks (buff state isn't in saves).
    const useRealSkillData = hasWeaponSkillData(skillTree);
    if (skillTree) {
      for (const contrib of aggregateSkillEffects(skillTree)) {
        const statId = contrib.statId || resolveStatId(contrib.tag);
        if (!statId) continue;
        if (!stats[statId]) {
          stats[statId] = { total: 0, sources: [] };
        }
        stats[statId].total += contrib.value;
        stats[statId].sources.push({
          itemName: contrib.source,
          slot: 'skill',
          value: contrib.value,
          sourceType: 'skill',
          kind: contrib.kind, // 'card' | 'weaponSkill' | 'buff'
        });
      }
    }

    // Racial skill contributions: threshold unlocks by character level
    // (weapon damage/crit, offhand affinity damage/CDR, stance multipliers)
    for (const contrib of getRacialContributions(characterRace, characterLevel)) {
      if (!stats[contrib.statId]) {
        stats[contrib.statId] = { total: 0, sources: [] };
      }
      stats[contrib.statId].total += contrib.value;
      stats[contrib.statId].sources.push({
        itemName: contrib.source,
        slot: 'race',
        value: contrib.value,
        sourceType: 'race',
      });
    }

    // Active stance mastery approximation: +1% stance damage per mastery
    // level. Only used when real skill data is unavailable (shared builds) —
    // otherwise the paragon node's actual per-level effects cover it.
    const activeStance = stanceContext?.activeStance;
    if (!useRealSkillData && activeStance?.damageStatId && activeStance.mastery > 0) {
      const value = activeStance.mastery * 0.01;
      if (!stats[activeStance.damageStatId]) {
        stats[activeStance.damageStatId] = { total: 0, sources: [] };
      }
      stats[activeStance.damageStatId].total += value;
      stats[activeStance.damageStatId].sources.push({
        itemName: `${activeStance.id}.level.1`,
        slot: 'stance',
        value,
        sourceType: 'stance',
      });
    }

    // Overrides are keyed by unique slot keys ('ring2', 'offhand3') — the same
    // key space the Items tab editor writes and the Character panel displays.
    const uniqueSlotKeys = getUniqueSlotKeyMap(equippedItems);

    for (const item of equippedItems) {
      // Get base stats from any of the supported formats:
      //   - item.baseStats (direct from Item model via extractEquippedItems)
      //   - item.model.baseStats (nested model format)
      //   - item.attributes (legacy format)
      const baseStats = item?.baseStats || item?.model?.baseStats || item?.attributes || [];
      if (!baseStats || !Array.isArray(baseStats)) continue;

      const slotKey = uniqueSlotKeys.get(item) || item.slotKey || item.slot || '';
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
            sourceType: 'item',
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
            sourceType: 'item',
          });
        }
      }
    }

    // Apply each effective monogram position exactly once. Keep these out of
    // saved baseStats: shares store the grants and recalculate them on load.
    for (const mono of appliedMonograms) {
      for (const effect of MONOGRAM_BASE_EFFECTS[mono.id] || []) {
        const { statId, value } = effect;
        if (!stats[statId]) stats[statId] = { total: 0, sources: [] };
        stats[statId].total += value;
        stats[statId].sources.push({
          itemName: `${mono.itemName || mono.source || 'Monogram'}: ${mono.id}`,
          slot: mono.itemSlot, value, sourceType: 'monogram', monogramId: mono.id,
        });
      }
    }

    return stats;
  }, [equippedItems, itemOverrides, characterStats, stanceContext, skillTree, characterRace, characterLevel, appliedMonograms]);

  // Flatten to simple { [statId]: total } for backward compatibility
  const aggregatedBaseStats = useMemo(() => {
    const flat = {};
    for (const [statId, data] of Object.entries(aggregatedWithSources)) {
      flat[statId] = data.total;
    }
    return flat;
  }, [aggregatedWithSources]);

  // Count how many instances of each monogram ID are applied
  const monogramInstanceCounts = useMemo(() => {
    const counts = {};
    for (const mono of appliedMonograms) {
      counts[mono.id] = (counts[mono.id] || 0) + 1;
    }
    return counts;
  }, [appliedMonograms]);

  // Buff grants remain unique. Numeric contributions add per copy, including
  // distinct monogram IDs feeding the same contribution (no last-writer loss).
  const configOverrides = useMemo(() => {
    const overrides = {};
    const seen = new Set();

    const applyMonogramConfig = (monogramId, instanceCount = 1) => {
      if (seen.has(monogramId)) return;
      seen.add(monogramId);

      const monoConfig = MONOGRAM_CALC_CONFIGS[monogramId];
      if (!monoConfig) return;

      const effects = monoConfig.effects || [monoConfig];
      for (const effect of effects) {
        const id = effect.derivedStatId;
        if (!id || !effect.config) continue;
        const previous = overrides[id];
        overrides[id] = {
          ...DERIVED_STATS[id]?.config,
          ...effect.config,
          instanceCount,
          ...(ADDITIVE_MONOGRAM_STATS.has(id) ? {
            monogramCopies: (previous?.monogramCopies || 0) + instanceCount,
          } : {}),
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
        ...overrides.paragonLevel,
        level: activeStance.mastery,
      };
    }

    // Enforce mutually exclusive monogram effects (e.g. near/far distance
    // procs can never be active together)
    applyExclusiveMonogramRules(overrides);

    return overrides;
  }, [appliedMonograms, monogramInstanceCounts, stanceContext]);

  // Detect weapon stance from equipped weapon item's row name
  const detectedStance = useMemo(() => {
    for (const item of equippedItems) {
      const slot = item?.slotKey || item?.slot || '';
      if (slot === 'weapon') {
        const rowName = item?.rowName || item?.model?.rowName || '';
        return inferWeaponStance(rowName);
      }
    }
    return null;
  }, [equippedItems]);

  // Detect proc abilities on the equipped offhand items. Affinities (base +
  // modifier-added) route the main-tree affinity damage/cooldown stats into
  // the eDPS elemental bucket and the offhand cooldown stat. Only offhand
  // items count — weapons can never carry an affinity tag.
  const offhandAbilities = useMemo(
    () => {
      const keys = getUniqueSlotKeyMap(equippedItems);
      return detectEquippedAbilities(equippedItems.map(item => {
        const override = itemOverrides[keys.get(item)] || {};
        const baseStats = item.baseStats || item.model?.baseStats || item.attributes || [];
        return {
          ...item,
          baseStats: [
            ...baseStats.filter((_, index) => !override.removedIndices?.includes(index)),
            ...(override.mods || []).map(mod => ({ stat: mod.statId, value: mod.value })),
          ],
        };
      }));
    },
    [equippedItems, itemOverrides],
  );

  // Merge stance detection into config overrides for eDPS.
  // Post ele/phys split, stance feeds the single physical additive bucket
  // (SCHD is merged in — no separate standalone multiplier).
  const finalConfigOverrides = useMemo(() => {
    const merged = { ...configOverrides };

    if (detectedStance) {
      merged.edpsPhysAdditive = { ...(configOverrides.edpsPhysAdditive || {}), stance: detectedStance };
      merged.edpsElemCrit = { ...(configOverrides.edpsElemCrit || {}), stance: detectedStance };
    }

    // The most-equipped ability supplies the element, item-damage scope,
    // affinities and cooldown. Ties use a stable ability-key ordering.
    const { abilities, offhandCount } = offhandAbilities;
    if (abilities.length > 0) {
      // All headline buckets must describe the same ability. Combining the
      // affinities of unrelated procs exaggerates mixed-offhand builds.
      const dominant = abilities[0];
      const activeAffinities = dominant.affinities;
      merged.edpsED = {
        ...(merged.edpsED || {}),
        activeElement: dominant.element,
        abilityName: dominant.name,
      };
      merged.edpsElemAdditive = {
        ...DERIVED_STATS.edpsElemAdditive.config,
        ...(merged.edpsElemAdditive || {}),
        activeAffinities,
        abilityDamageStatId: findStatForAttribute(`EasyRPG.Attributes.Abilities.${dominant.key}.DamageMultiplier`)?.id,
        abilityName: dominant.name,
      };
      merged.offhandCooldownReduction = {
        ...(merged.offhandCooldownReduction || {}),
        activeAffinities,
      };
      merged.offhandCooldownSeconds = {
        ...(merged.offhandCooldownSeconds || {}),
        baseCooldown: getStepCooldown(dominant, offhandCount),
        abilityName: dominant.name,
        offhandCount,
      };
    }

    // Saves and current shares reconstruct the progression health pool. Let
    // that calculation respond to edits. Older shares have only an observed
    // health snapshot; retain their legacy fallback until progression exists.
    if (maxHealth > 0 && !characterStats.health && merged.damageFromHealth) {
      merged.damageFromHealth = { ...merged.damageFromHealth, maxHealth };
    }

    return merged;
  }, [configOverrides, detectedStance, offhandAbilities, maxHealth, characterStats]);

  // Calculate all derived stats
  const calculatedStats = useMemo(() => {
    return calculateDerivedStatsDetailed(aggregatedBaseStats, finalConfigOverrides);
  }, [aggregatedBaseStats, finalConfigOverrides]);

  // Get summary stats for display
  const summary = useMemo(() => {
    const { values } = calculatedStats;
    return {
      // Primary attributes
      strength: values.totalStrength || values.strength || 0,
      dexterity: values.totalDexterity || values.dexterity || 0,
      wisdom: values.totalWisdom || values.wisdom || 0,
      endurance: values.totalEndurance || values.endurance || 0,
      agility: values.totalAgility || values.agility || 0,
      luck: values.totalLuck || values.luck || 0,
      stamina: values.totalStamina || values.stamina || 0,

      // Combat stats
      damage: values.finalDamage || values.totalDamage || values.damage || 0,
      armor: values.totalArmor || values.armor || 0,
      health: values.totalHealth || values.health || 0,
      critChance: values.totalCritChance || 0,
      critDamage: values.finalCritDamage || 0,

      // Monogram-derived
      monogramBonuses: Object.entries(values)
        .filter(([key]) => key.startsWith('monogram') || key.startsWith('chained'))
        .map(([key, value]) => ({ id: key, value })),
    };
  }, [calculatedStats]);

  // Build categories for StatsPanel display
  const categories = useMemo(() => {
    const { values, detailed } = calculatedStats;
    const activeMonogramStats = getActiveMonogramStats(finalConfigOverrides);

    // Map calculated totals to their raw sources and display routing. Primary,
    // armor, and health totals multiply bonus%; the remaining targets add the
    // generated primary-attribute dependency contribution.
    const TOTAL_STAT_ROUTING = {
      totalStrength: { base: 'strength', bonus: 'strengthBonus', attribute: 'strength', category: 'attributes', name: 'Strength' },
      totalDexterity: { base: 'dexterity', bonus: 'dexterityBonus', attribute: 'dexterity', category: 'attributes', name: 'Dexterity' },
      totalWisdom: { base: 'wisdom', bonus: 'wisdomBonus', attribute: 'wisdom', category: 'attributes', name: 'Wisdom' },
      totalEndurance: { base: 'endurance', bonus: 'enduranceBonus', attribute: 'endurance', category: 'attributes', name: 'Endurance' },
      totalAgility: { base: 'agility', bonus: 'agilityBonus', attribute: 'agility', category: 'attributes', name: 'Agility' },
      totalLuck: { base: 'luck', bonus: 'luckBonus', attribute: 'luck', category: 'attributes', name: 'Luck' },
      totalStamina: { base: 'stamina', bonus: 'staminaBonus', attribute: 'stamina', category: 'attributes', name: 'Stamina' },
      totalArmor: { base: 'armor', bonus: 'armorBonus', derivedFlat: { id: 'paragonArmorBonus', source: 'Paragon Armor' }, derivedBonuses: [{ id: 'strengthArmorBonus', source: 'Strength' }, { id: 'bloodlustArmorBonus', source: 'Bloodlust', sourceType: 'monogram' }], category: 'defense', name: 'Armor' },
      totalHealth: { base: 'health', bonus: 'healthBonus', derivedFlat: { id: 'paragonHpBonus', source: 'Paragon Health' }, derivedBonus: { id: 'staminaHealthBonus', source: 'Stamina' }, category: 'defense', name: 'Health' },
      totalCritDamage: { base: 'critDamage', additions: [{ id: 'agilityCritDamageBonus', source: 'Agility' }], isPercent: true, category: 'offense', name: 'Critical Damage (before effects)' },
      totalBossBonus: { base: 'bossBonus', additions: [{ id: 'wisdomBossBonus', source: 'Wisdom' }], isPercent: true, category: 'offense', name: 'Boss Damage Bonus' },
      totalHealthRegen: { base: 'healthRegen', additions: [{ id: 'staminaHealthRegen', source: 'Stamina' }], category: 'defense', name: 'Health Regen' },
      totalXpBonus: { base: 'xpBonus', additions: [{ id: 'luckXpBonus', source: 'Luck' }], isPercent: true, category: 'utility', name: 'XP Bonus' },
      totalFireDamageBonus: { base: 'fireDamageBonus', additions: [{ id: 'luckFireDamageBonus', source: 'Luck' }], isPercent: true, category: 'elemental', name: 'Fire Damage' },
      totalArcaneDamageBonus: { base: 'arcaneDamageBonus', additions: [{ id: 'luckArcaneDamageBonus', source: 'Luck' }], isPercent: true, category: 'elemental', name: 'Arcane Damage' },
      totalLightningDamageBonus: { base: 'lightningDamageBonus', additions: [{ id: 'luckLightningDamageBonus', source: 'Luck' }], isPercent: true, category: 'elemental', name: 'Lightning Damage' },
      // totalDamage is intentionally omitted from the display routing: the
      // Effective Damage headline (edpsEffective) is the canonical damage
      // number and its tooltip covers the full formula. totalDamage is still
      // calculated and feeds into edpsFlat; its base/bonus affixes stay
      // consumed by the set below so they don't surface as raw rows.
    };

    // Base/bonus stat IDs consumed by total stats (don't show separately).
    // damage and damageBonus are consumed manually since totalDamage no longer
    // owns them in the display routing above.
    const consumedByTotals = new Set(['damage', 'damageBonus', 'attackSpeed', 'critChance', 'maxEnergy', 'energyRegen', 'energyRegenBonus']);
    for (const info of Object.values(TOTAL_STAT_ROUTING)) {
      if (info.base) consumedByTotals.add(info.base);
      if (info.bonus) consumedByTotals.add(info.bonus);
    }

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
      'edps-result': 'edps',
    };

    const result = {
      vitals: [],
      attributes: [],
      offense: [],
      stance: [],
      defense: [],
      elemental: [],
      affinity: [],
      edps: [],
      monograms: [],
      abilities: [],
      utility: [],
      unmapped: [],
    };

    const processedIds = new Set();

    // Post ele/phys split, the eDPS section surfaces the per-skill on-hit rows
    // (physical + elemental, Left/Q/R) directly; their boss values live in each
    // row's tooltip breakdown. Nothing is hidden here.
    const EDPS_HIDDEN_RESULT_IDS = new Set();

    // Process calculated/derived stats first
    for (const stat of detailed) {
      if (EDPS_HIDDEN_RESULT_IDS.has(stat.id)) {
        processedIds.add(stat.id);
        continue;
      }
      // Route total stats to display categories with bonus% applied and source breakdown
      if (TOTAL_STAT_ROUTING[stat.id]) {
        const routing = TOTAL_STAT_ROUTING[stat.id];
        processedIds.add(stat.id);

        // Build combined sources from flat base + bonus%
        const baseSources = aggregatedWithSources[routing.base]?.sources || [];
        const bonusSources = routing.bonus ? aggregatedWithSources[routing.bonus]?.sources || [] : [];
        const derivedFlat = routing.derivedFlat ? values[routing.derivedFlat.id] || 0 : 0;
        const baseTotal = (aggregatedWithSources[routing.base]?.total || 0) + derivedFlat;
        const rawBonusTotal = routing.bonus ? aggregatedWithSources[routing.bonus]?.total || 0 : 0;
        const derivedBonuses = routing.derivedBonuses || (routing.derivedBonus ? [routing.derivedBonus] : []);
        const derivedBonusTotal = derivedBonuses.reduce((sum, bonus) => sum + (values[bonus.id] || 0), 0);
        const additions = routing.additions || [];
        const additionsTotal = additions.reduce((sum, addition) => sum + (values[addition.id] || 0), 0);
        const bonusTotal = rawBonusTotal + derivedBonusTotal;

        const sources = [
          ...baseSources.map(s => ({ ...s, isPercent: Boolean(routing.isPercent) })),
          ...(derivedFlat ? [{ itemName: routing.derivedFlat.source, slot: 'monogram', value: derivedFlat, sourceType: 'monogram', isPercent: false }] : []),
          ...bonusSources.map(s => ({ ...s, itemName: `${s.itemName} (%)`, isPercent: true })),
          ...derivedBonuses.filter(bonus => values[bonus.id]).map(bonus => ({
            itemName: bonus.source,
            slot: bonus.sourceType || 'attribute',
            value: values[bonus.id],
            sourceType: bonus.sourceType || 'attribute',
            isPercent: true,
          })),
          ...additions.filter(addition => values[addition.id]).map(addition => ({
            itemName: addition.source,
            slot: 'attribute',
            value: values[addition.id],
            sourceType: 'attribute',
            isPercent: Boolean(routing.isPercent),
          })),
        ];

        // Show both the total multiplier and bonus portion. The game reports
        // "+104%" while the formula multiplies by 204%.
        let description;
        if (additions.length) {
          const formatPart = value => routing.isPercent
            ? `${(value * 100).toFixed(1)}%`
            : value.toFixed(2);
          description = `${formatPart(baseTotal)} base + ${formatPart(additionsTotal)} from attributes = ${stat.formattedValue}`;
        } else if (bonusTotal) {
          const flatDisplay = routing.base === 'health' ? baseTotal.toFixed(2) : Math.floor(baseTotal);
          description = `${flatDisplay} flat \u00d7 ${((1 + bonusTotal) * 100).toFixed(0)}% total (+${(bonusTotal * 100).toFixed(0)}% bonus) = ${stat.formattedValue}`;
        } else {
          description = routing.attribute ? `${routing.name} total` : `${routing.name} from gear`;
        }

        if (routing.attribute) {
          const dependency = ATTRIBUTE_BONUSES[routing.attribute].description.replace(/;(?!\s)/g, '; ');
          description = `${description}. ${dependency}`;
        }

        // For primary attributes, append bonus% to the displayed value
        let displayValue = stat.formattedValue;
        if (routing.category === 'attributes' && bonusTotal) {
          displayValue = `${stat.formattedValue} (+${(bonusTotal * 100).toFixed(0)}%)`;
        }

        result[routing.category].push({
          id: stat.id,
          name: routing.name,
          value: stat.value,
          formattedValue: displayValue,
          description,
          sources,
          layer: stat.layer,
        });
        continue;
      }

      // Skip remaining totals-category stats not in routing map
      if (stat.category === 'totals') continue;

      processedIds.add(stat.id);

      // Route monogram stats to monograms section
      if (monogramStatIds.has(stat.id) || stat.category === 'monogram' || stat.category === 'monogram-buff' || stat.category === 'monogram-chain' || stat.category === 'chained') {
        result.monograms.push({
          isActiveEffect: activeMonogramStats.has(stat.id),
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
        const record = {
          id: stat.id,
          name: stat.name,
          value: stat.value,
          formattedValue: stat.formattedValue,
          description: stat.description,
          layer: stat.layer,
        };
        const def = DERIVED_STATS[stat.id];
        if (def?.breakdown) {
          const cfg = { ...def.config, ...finalConfigOverrides[stat.id] };
          record.breakdown = def.breakdown(values, cfg);
        }
        result[displayCategory].push(record);
      }
    }

    // Add remaining aggregated base stats with source tracking
    for (const [statId, data] of Object.entries(aggregatedWithSources)) {
      // Skip if already processed
      if (processedIds.has(statId)) continue;
      // Skip base/bonus stats that are shown as part of a total stat
      if (consumedByTotals.has(statId)) continue;

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
            sources: data.sources.map(s => ({ ...s, isPercent: statDef.isPercent })),
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


    // Health_29 is current health, but at full health it provides an exact
    // in-game value to compare with the reconstructed calculation.
    if (maxHealth > 0) {
      const gearCalc = values.totalHealth || 0;
      result.vitals.push({
        id: 'saveMaxHealth',
        name: 'Health (save snapshot)',
        value: maxHealth,
        formattedValue: Math.round(maxHealth).toLocaleString(),
        description: `Read from the save file (current health; equals max when full). Calculated max health: ${gearCalc.toFixed(2)}.`,
        sources: [{ itemName: 'Save file (Health_29)', value: maxHealth, sourceType: 'save' }],
        layer: LAYERS.BASE,
      });
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
        id: 'activeStanceFamily',
        name: 'Stance Monogram Family',
        value: active.monogramFamily === 'melee' ? 1 : 2,
        formattedValue: active.monogramFamily || 'unknown',
        description: 'Melee stances: sword/axe/maul/spear. Ranged stances: bow/magery/scythe/fist.',
        sources: [{ itemName: `${active.id}.family`, value: active.monogramFamily === 'melee' ? 1 : 2 }],
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

    // Keep effective cooldown and total CDR ahead of raw ability affixes.
    const cooldownOrder = ['offhandCooldownSeconds', 'offhandCooldownReduction'];
    result.abilities.sort((a, b) => {
      const rank = id => cooldownOrder.includes(id) ? cooldownOrder.indexOf(id) : cooldownOrder.length;
      return rank(a.id) - rank(b.id);
    });

    // Pin the per-skill on-hit results to the top of the eDPS section so the
    // damage headlines are the user's landing spot, ahead of the buckets.
    if (Array.isArray(result.edps)) {
      const RESULT_ORDER = [
        'edpsPhysPrimary', 'edpsPhysQ', 'edpsPhysR',
        'edpsElemPrimary', 'edpsElemQ', 'edpsElemR',
      ];
      result.edps.sort((a, b) => {
        const ai = RESULT_ORDER.indexOf(a.id);
        const bi = RESULT_ORDER.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }

    return result;
  }, [calculatedStats, aggregatedWithSources, stanceContext, finalConfigOverrides, maxHealth]);

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

    // Detected offhand proc abilities ({ abilities, offhandCount })
    offhandAbilities,

    // Config overrides applied
    configOverrides: finalConfigOverrides,
  };
}

/**
 * Resolve a raw tag or stat name to a statId
 * Exported for tests — this is the aggregation path every equipped item stat
 * (including pet conversion flags) goes through on save load.
 * @param {string} rawTag - Raw attribute tag or stat name
 * @returns {string|null} Normalized stat ID
 */
export function resolveStatId(rawTag) {
  if (!rawTag) return null;

  // Use the same resolver as extraction, skills, and character sharing.
  // Never discard the ability namespace before attempting an exact match.
  const known = getStatType(rawTag) || findStatForAttribute(rawTag);
  if (known) return known.id;

  // Keep unknown namespaces intact for diagnostics and share round-trips.
  return rawTag;
}

export default useDerivedStats;
