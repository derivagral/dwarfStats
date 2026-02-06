/**
 * Monogram Calculation Configs
 *
 * Maps monogram IDs to their calculation engine configs.
 * When a monogram is applied, these configs override the default
 * calculation parameters in DERIVED_STATS.
 *
 * Structure:
 * - derivedStatId: Which derived stat this monogram affects (legacy single-stat format)
 * - effects: Array of { derivedStatId, config } for multi-stat monograms
 * - displayName: Human-readable name for UI display
 *
 * @module utils/monogramConfigs
 */

export const MONOGRAM_CALC_CONFIGS = {
  // ===========================================================================
  // PHASING (Helmet Monogram - 50 stacks)
  // Effects: 1% damage, 0.5% boss damage per stack
  // ===========================================================================
  'Phasing.TranceEffectsPotency.Highest': {
    displayName: 'Phasing',
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },
  'AllowPhasing': {
    displayName: 'Phasing',
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },

  // ===========================================================================
  // BLOODLUST (Helmet Monogram - 100 stacks)
  // Effects: 5% crit damage, 3% attack speed, 1% movement speed per stack
  // ===========================================================================
  'Bloodlust.Base': {
    displayName: 'Bloodlust',
    effects: [
      { derivedStatId: 'bloodlustStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  'Bloodlust.Damage%PerStack': {
    displayName: 'Bloodlust Damage',
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
    displayName: 'Dark Essence',
    effects: [
      { derivedStatId: 'darkEssenceStacks', config: { enabled: true, maxStacks: 500, currentStacks: 500 } },
    ],
  },

  // ===========================================================================
  // BLOODLUST LIFE (Amulet Monogram - 100 stacks)
  // Effects: 1% life bonus per stack
  // ===========================================================================
  'Bloodlust.DrawLife': {
    displayName: 'Bloodlust Life',
    effects: [
      { derivedStatId: 'lifeBuffStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  'Bloodlust.MoreLife.Highest': {
    displayName: 'Bloodlust Life',
    description: '0.1% life per stack per 50 highest attribute',
    effects: [
      { derivedStatId: 'bloodlustLifeBonus', config: { enabled: true, lifePerStackPer50: 0.1 } },
    ],
  },

  // ===========================================================================
  // ESSENCE → CRIT CHAIN
  // 1% crit per 20 essence
  // ===========================================================================
  'BonusCritDamage%ForEssence': {
    displayName: 'Crit from Essence',
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },
  'GainCritChanceForHighest': {
    displayName: 'Crit from Stats',
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },

  // ===========================================================================
  // ELEMENT FOR CRIT CHANCE (Helmet Monogram)
  // 3% fire/arcane/lightning per 1% crit over 100%
  // ===========================================================================
  'ElementForCritChance.Fire': {
    displayName: 'Fire from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'fire', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Lightning': {
    displayName: 'Lightning from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'lightning', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Arcane': {
    displayName: 'Arcane from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'arcane', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },

  // ===========================================================================
  // LIFE FROM ELEMENT (Ring Monogram)
  // 2% life per 30% of a particular element
  // ===========================================================================
  'ElementalToHp%.Fire': {
    displayName: 'Life from Fire',
    effects: [
      { derivedStatId: 'lifeFromElement', config: { enabled: true, elementPer: 30, lifeBonus: 2 } },
    ],
  },

  // ===========================================================================
  // GAIN DAMAGE FOR HP LOSE ARMOR (Bracer Monogram)
  // 1% of total life as flat damage
  // ===========================================================================
  'GainDamageForHPLoseArmor': {
    displayName: 'Damage from Life',
    effects: [
      { derivedStatId: 'damageFromLife', config: { enabled: true, lifePercent: 1 } },
    ],
  },

  // ===========================================================================
  // RING MONOGRAMS - Stat Scalers
  // ===========================================================================
  'DamageForStat.Highest': {
    displayName: 'Damage from Stats',
    derivedStatId: 'monogramValueFromStrength',
    config: {
      sourceStat: 'highestAttribute',
      ratio: 100,
      baseValue: 5,
    },
  },
  'BonusDamage%ForEssence': {
    displayName: 'Damage from Essence',
    effects: [],
  },
  'MaxHp%ForStat.Highest': {
    displayName: 'HP from Stats',
    effects: [],
  },
  'DamageReduction%ForStat.Highest': {
    displayName: 'DR from Stats',
    effects: [],
  },
  'Colossus.ElementalBonusForHighestStat.Arcane': {
    displayName: 'Arcane from Stats (Colossus)',
    effects: [],
  },

  // ===========================================================================
  // OTHER MONOGRAM CONFIGS
  // ===========================================================================
  'Health%ForHighest': {
    displayName: 'Health from Stats',
    derivedStatId: 'chainedHealthBonus',
    config: {
      sourceStat: 'totalVitality',
      ratio: 50,
      baseValue: 1,
    },
  },
  'Colossus.Base': {
    displayName: 'Colossus',
    derivedStatId: null,
  },
  'Colossus.DamageReduction': {
    displayName: 'Colossus DR',
    derivedStatId: null,
  },
  'DamageCircle.Base': {
    displayName: 'Damage Circle',
    derivedStatId: null,
  },
  'DamageCircle.DamageForStats.Highest': {
    displayName: 'Circle Damage from HP',
    derivedStatId: 'damageFromHealth',
    config: {
      sourceStat: 'totalHealth',
      percentage: 1,
    },
  },
  'PotionSlotForStat.Highest': {
    displayName: 'Potion Slots from Stats',
    derivedStatId: 'potionSlotsFromAttributes',
    config: {
      ratio: 200,
    },
  },
  'Damage%ForPotions': {
    displayName: 'Damage from Potions',
    derivedStatId: 'statBonusFromPotions',
    config: {
      sourceStat: 'potionSlotsFromAttributes',
      ratio: 1,
      baseValue: 3,
    },
  },
};

/**
 * Get effect summary text for a monogram
 * @param {string} monoId - Monogram ID
 * @returns {string|null} Human-readable effect description
 */
export function getMonogramEffectSummary(monoId) {
  const config = MONOGRAM_CALC_CONFIGS[monoId];
  if (!config) return null;

  if (config.displayName) {
    if (config.description) {
      return `${config.displayName}: ${config.description}`;
    }
    return config.displayName;
  }

  return null;
}

/**
 * Get all monogram IDs that trigger a specific derived stat
 * @param {string} derivedStatId - The derived stat ID
 * @returns {string[]} Array of monogram IDs
 */
export function getMonogramsForDerivedStat(derivedStatId) {
  const result = [];

  for (const [monoId, config] of Object.entries(MONOGRAM_CALC_CONFIGS)) {
    if (config.derivedStatId === derivedStatId) {
      result.push(monoId);
    }
    if (config.effects) {
      for (const effect of config.effects) {
        if (effect.derivedStatId === derivedStatId) {
          result.push(monoId);
          break;
        }
      }
    }
  }

  return result;
}

export default MONOGRAM_CALC_CONFIGS;
