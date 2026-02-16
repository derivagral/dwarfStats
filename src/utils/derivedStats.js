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
  EDPS: 5,              // eDPS calculation (depends on all prior layers)
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
      const bonus = stats.strengthBonus || 0; // decimal: 0.50 = 50%
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      const bonus = stats.luckBonus || 0; // decimal: 1.64 = 164%
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
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
      return Math.floor(base * (1 + bonus));
    },
    format: v => v.toFixed(0),
    description: 'Damage after bonuses applied',
  },

  // ---------------------------------------------------------------------------
  // LAYER 2: PRIMARY DERIVED (conversions from total stats)
  // ---------------------------------------------------------------------------

  /**
   * 1% of totalHealth applied as flat damage
   * Common affix pattern: "Gain X% of Health as Damage"
   */
  damageFromHealth: {
    id: 'damageFromHealth',
    name: 'Damage from Health',
    category: 'conversion',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['totalHealth'],
    config: {
      sourceStat: 'totalHealth',
      percentage: 1,  // 1% of health as damage
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.damageFromHealth.config;
      const source = stats[config.sourceStat] || 0;
      return Math.floor(source * (config.percentage / 100));
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat damage gained from percentage of total health',
  },

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
   * Extra potion slots from highest attribute (1 per 50)
   */
  potionSlotsFromAttributes: {
    id: 'potionSlotsFromAttributes',
    name: 'Potion Slots (Stats)',
    category: 'utility-derived',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['highestAttribute'],
    config: {
      ratio: 50,  // per 50 of highest stat
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.potionSlotsFromAttributes.config;
      const highest = stats.highestAttribute || 0;
      return Math.floor(highest / config.ratio);
    },
    format: v => v.toFixed(0),
    description: 'Additional potion slots from highest attribute (1 per 50)',
  },

  // ---------------------------------------------------------------------------
  // LAYER 3: SECONDARY DERIVED (combinations and chains from layer 2)
  // ---------------------------------------------------------------------------

  /**
   * Final damage combining all flat damage sources
   * totalDamage + damageFromHealth + other conversion sources
   */
  finalDamage: {
    id: 'finalDamage',
    name: 'Final Damage',
    category: 'final',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['totalDamage', 'damageFromHealth'],
    calculate: (stats) => {
      const baseDamage = stats.totalDamage || 0;
      const healthDamage = stats.damageFromHealth || 0;
      // Add other damage sources here as they're implemented
      return Math.floor(baseDamage + healthDamage);
    },
    format: v => v.toFixed(0),
    description: 'Total damage from all sources combined',
  },

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
   * Damage bonus per potion slot (5% per slot)
   */
  statBonusFromPotions: {
    id: 'statBonusFromPotions',
    name: 'Damage% (Potions)',
    category: 'chained',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['potionSlotsFromAttributes'],
    config: {
      sourceStat: 'potionSlotsFromAttributes',
      ratio: 1,
      baseValue: 5,  // +5% damage per potion slot
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

  // ===========================================================================
  // MONOGRAM BUFF STACKS - Enabled when specific monograms are applied
  // ===========================================================================

  /**
   * Helper: Highest primary attribute value
   * Used by many monograms that scale with "highest stat"
   */
  highestAttribute: {
    id: 'highestAttribute',
    name: 'Highest Attribute',
    category: 'utility',
    layer: LAYERS.TOTALS,
    dependencies: ['totalStrength', 'totalDexterity', 'totalWisdom', 'totalVitality', 'totalEndurance', 'totalAgility', 'totalLuck', 'totalStamina'],
    calculate: (stats) => {
      return Math.max(
        stats.totalStrength || 0,
        stats.totalDexterity || 0,
        stats.totalWisdom || 0,
        stats.totalVitality || 0,
        stats.totalEndurance || 0,
        stats.totalAgility || 0,
        stats.totalLuck || 0,
        stats.totalStamina || 0
      );
    },
    format: v => v.toFixed(0),
    description: 'The highest primary attribute value',
  },

  // ---------------------------------------------------------------------------
  // PHASING BUFF (Helmet Monogram - 50 stacks max)
  // Effects: 1% damage, 0.5% boss damage per stack
  // ---------------------------------------------------------------------------
  phasingStacks: {
    id: 'phasingStacks',
    name: 'Phasing Stacks',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,  // Set to true when Phasing monogram is applied
      maxStacks: 50,
      currentStacks: 50, // Default to max for theorycraft
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.phasingStacks.config;
      if (!config.enabled) return 0;
      return Math.min(config.currentStacks, config.maxStacks);
    },
    format: v => v.toFixed(0),
    description: 'Current Phasing buff stacks (max 50)',
  },
  phasingDamageBonus: {
    id: 'phasingDamageBonus',
    name: 'Phasing Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['phasingStacks'],
    config: {
      damagePerStack: 1, // 1% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.phasingDamageBonus.config;
      const stacks = stats.phasingStacks || 0;
      return stacks * config.damagePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage bonus from Phasing stacks (1% per stack)',
  },
  phasingBossDamageBonus: {
    id: 'phasingBossDamageBonus',
    name: 'Phasing Boss Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['phasingStacks'],
    config: {
      bossDamagePerStack: 0.5, // 0.5% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.phasingBossDamageBonus.config;
      const stacks = stats.phasingStacks || 0;
      return stacks * config.bossDamagePerStack;
    },
    format: v => `+${v.toFixed(1)}%`,
    description: 'Boss damage bonus from Phasing stacks (0.5% per stack)',
  },

  // ---------------------------------------------------------------------------
  // BLOODLUST BUFF (Helmet Monogram - 100 stacks max)
  // Effects: 5% crit damage, 3% attack speed, 1% movement speed per stack
  // ---------------------------------------------------------------------------
  bloodlustStacks: {
    id: 'bloodlustStacks',
    name: 'Bloodlust Stacks',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      maxStacks: 100,
      currentStacks: 100, // Default to max for theorycraft
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustStacks.config;
      if (!config.enabled) return 0;
      return Math.min(config.currentStacks, config.maxStacks);
    },
    format: v => v.toFixed(0),
    description: 'Current Bloodlust buff stacks (max 100)',
  },
  bloodlustCritDamageBonus: {
    id: 'bloodlustCritDamageBonus',
    name: 'Bloodlust Crit Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['bloodlustStacks'],
    config: {
      critDamagePerStack: 5, // 5% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustCritDamageBonus.config;
      const stacks = stats.bloodlustStacks || 0;
      return stacks * config.critDamagePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Critical damage bonus from Bloodlust stacks (5% per stack)',
  },
  bloodlustAttackSpeedBonus: {
    id: 'bloodlustAttackSpeedBonus',
    name: 'Bloodlust Attack Speed%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['bloodlustStacks'],
    config: {
      attackSpeedPerStack: 3, // 3% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustAttackSpeedBonus.config;
      const stacks = stats.bloodlustStacks || 0;
      return stacks * config.attackSpeedPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Attack speed bonus from Bloodlust stacks (3% per stack)',
  },
  bloodlustMoveSpeedBonus: {
    id: 'bloodlustMoveSpeedBonus',
    name: 'Bloodlust Move Speed%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['bloodlustStacks'],
    config: {
      moveSpeedPerStack: 1, // 1% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustMoveSpeedBonus.config;
      const stacks = stats.bloodlustStacks || 0;
      return stacks * config.moveSpeedPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Movement speed bonus from Bloodlust stacks (1% per stack)',
  },

  // ---------------------------------------------------------------------------
  // DARK ESSENCE BUFF (Amulet Monogram - 500 stacks max)
  // At 500 stacks: Essence = highestStat * 1.25
  // ---------------------------------------------------------------------------
  darkEssenceStacks: {
    id: 'darkEssenceStacks',
    name: 'Dark Essence Stacks',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      maxStacks: 500,
      currentStacks: 500, // Default to max for theorycraft
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.darkEssenceStacks.config;
      if (!config.enabled) return 0;
      return Math.min(config.currentStacks, config.maxStacks);
    },
    format: v => v.toFixed(0),
    description: 'Current Dark Essence buff stacks (max 500)',
  },
  essence: {
    id: 'essence',
    name: 'Essence',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['darkEssenceStacks', 'highestAttribute'],
    config: {
      multiplier: 1.25, // highestStat * 1.25 at max stacks
      thresholdStacks: 500, // Need this many stacks for full effect
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.essence.config;
      const stacks = stats.darkEssenceStacks || 0;
      if (stacks < config.thresholdStacks) {
        // Partial effect? Or none until max? Let's do proportional
        return Math.floor((stacks / config.thresholdStacks) * (stats.highestAttribute || 0) * config.multiplier);
      }
      return Math.floor((stats.highestAttribute || 0) * config.multiplier);
    },
    format: v => v.toFixed(0),
    description: 'Essence value from Dark Essence (highestStat × 1.25 at 500 stacks)',
  },

  // ---------------------------------------------------------------------------
  // LIFE BUFF (Amulet Monogram for Bloodlust chain - 100 stacks max)
  // Effects: 1% life bonus per stack
  // ---------------------------------------------------------------------------
  lifeBuffStacks: {
    id: 'lifeBuffStacks',
    name: 'Life Buff Stacks',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      maxStacks: 100,
      currentStacks: 100, // Default to max
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lifeBuffStacks.config;
      if (!config.enabled) return 0;
      return Math.min(config.currentStacks, config.maxStacks);
    },
    format: v => v.toFixed(0),
    description: 'Life buff stacks from amulet monogram (max 100)',
  },
  lifeBuffBonus: {
    id: 'lifeBuffBonus',
    name: 'Life Buff Bonus%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['lifeBuffStacks'],
    config: {
      lifePerStack: 1, // 1% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lifeBuffBonus.config;
      const stacks = stats.lifeBuffStacks || 0;
      return stacks * config.lifePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from Life buff stacks (1% per stack)',
  },

  // ---------------------------------------------------------------------------
  // BLOODLUST LIFE (Ring Monogram - Bloodlust.MoreLife.Highest)
  // 0.1% life bonus per life stack per 50 of highest attribute
  // At 100 stacks: 10% life per 50 highest attribute
  // ---------------------------------------------------------------------------
  bloodlustLifeBonus: {
    id: 'bloodlustLifeBonus',
    name: 'Bloodlust Life%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['lifeBuffStacks', 'highestAttribute'],
    config: {
      enabled: false,
      lifePerStackPer50: 0.1, // 0.1% life per stack per 50 of highest attribute
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustLifeBonus.config;
      if (!config.enabled) return 0;
      const stacks = stats.lifeBuffStacks || 0;
      const highest = stats.highestAttribute || 0;
      // Formula: stacks * lifePerStackPer50 * (highest / 50)
      return stacks * config.lifePerStackPer50 * (highest / 50);
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from Bloodlust stacks scaling with highest attribute',
  },

  // ---------------------------------------------------------------------------
  // SHROUD BUFF (1H Monogram - 50 stacks max)
  // Effects: 3% life per stack
  // ---------------------------------------------------------------------------
  shroudStacks: {
    id: 'shroudStacks',
    name: 'Shroud Stacks',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      maxStacks: 50,
      currentStacks: 50,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.shroudStacks.config;
      if (!config.enabled) return 0;
      return Math.min(config.currentStacks, config.maxStacks);
    },
    format: v => v.toFixed(0),
    description: 'Current Shroud buff stacks (max 50)',
  },
  shroudLifeBonus: {
    id: 'shroudLifeBonus',
    name: 'Shroud Life%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['shroudStacks'],
    config: {
      lifePerStack: 3, // 3% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.shroudLifeBonus.config;
      const stacks = stats.shroudStacks || 0;
      return stacks * config.lifePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from Shroud stacks (3% per stack, 150% at max)',
  },

  // ---------------------------------------------------------------------------
  // DAMAGE CIRCLE / UNHOLY VOID (Amulet + upcoming Helmet Monogram)
  // 2% life bonus per 50 of highest attribute
  // ---------------------------------------------------------------------------
  damageCircleLifeBonus: {
    id: 'damageCircleLifeBonus',
    name: 'Circle Life%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['highestAttribute'],
    config: {
      enabled: false,
      lifePerInterval: 2,  // 2% life bonus
      statInterval: 50,    // per 50 highest attribute
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.damageCircleLifeBonus.config;
      if (!config.enabled) return 0;
      const highest = stats.highestAttribute || 0;
      return Math.floor(highest / config.statInterval) * config.lifePerInterval;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from Damage Circle (2% per 50 highest attribute)',
  },

  // ---------------------------------------------------------------------------
  // DISTANCE PROCS (Amulet Monograms - exclusive pair)
  // 50% damage each, own additive bucket (not damageBonus)
  // ---------------------------------------------------------------------------
  distanceProcsDamageBonus: {
    id: 'distanceProcsDamageBonus',
    name: 'Distance Damage%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPercent: 50,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.distanceProcsDamageBonus.config;
      if (!config.enabled) return 0;
      return config.bonusPercent;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Distance proc damage (50%, own additive bucket, exclusive with Near)',
  },
  distanceProcsNearDamageBonus: {
    id: 'distanceProcsNearDamageBonus',
    name: 'Near Distance Damage%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPercent: 50,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.distanceProcsNearDamageBonus.config;
      if (!config.enabled) return 0;
      return config.bonusPercent;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Near distance proc damage (50%, own additive bucket, exclusive with Far)',
  },

  // ---------------------------------------------------------------------------
  // ELITE BUFFS (Amulet Monograms - assume capped stacks)
  // ---------------------------------------------------------------------------
  eliteAttackSpeedBonus: {
    id: 'eliteAttackSpeedBonus',
    name: 'Elite AS%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      attackSpeedPerStack: 3,
      maxStacks: 10,
      currentStacks: 10,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.eliteAttackSpeedBonus.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      return stacks * config.attackSpeedPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Attack speed from elite kills (assume capped stacks)',
  },
  eliteEnergyBonus: {
    id: 'eliteEnergyBonus',
    name: 'Elite Energy',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      energyPerStack: 10,
      maxStacks: 10,
      currentStacks: 10,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.eliteEnergyBonus.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      return stacks * config.energyPerStack;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Energy from elite kills (assume capped stacks)',
  },

  // ---------------------------------------------------------------------------
  // EXTRA LIFESTEAL (Amulet Monogram)
  // +10% lifesteal, simple additive
  // ---------------------------------------------------------------------------
  extraLifestealBonus: {
    id: 'extraLifestealBonus',
    name: 'Extra Lifesteal%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      lifestealPercent: 10,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.extraLifestealBonus.config;
      if (!config.enabled) return 0;
      return config.lifestealPercent;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Extra lifesteal bonus (10%)',
  },

  // ---------------------------------------------------------------------------
  // FLAT DAMAGE MONOGRAMS (Amulet)
  // DamageBonusAnd51Damage: 300 flat, drawback: incoming deals 50% HP
  // DamageGainNoEnergy: 300 flat, drawback: sets energy to 0
  // ---------------------------------------------------------------------------
  flatDamageMonogramBonus: {
    id: 'flatDamageMonogramBonus',
    name: 'Flat Damage (Monogram)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      flatDamage: 300,
      drawback: 'Incoming damage deals 50% of max HP',
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.flatDamageMonogramBonus.config;
      if (!config.enabled) return 0;
      return config.flatDamage;
    },
    format: v => `+${v.toFixed(0)}`,
    description: '+300 flat damage (drawback: incoming damage deals 50% HP)',
  },
  noEnergyDamageBonus: {
    id: 'noEnergyDamageBonus',
    name: 'No Energy Damage',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      flatDamage: 300,
      drawback: 'Sets energy to 0',
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.noEnergyDamageBonus.config;
      if (!config.enabled) return 0;
      return config.flatDamage;
    },
    format: v => `+${v.toFixed(0)}`,
    description: '+300 flat damage (drawback: sets energy to 0)',
  },

  // ---------------------------------------------------------------------------
  // HIGHEST STAT FOR DAMAGE (Amulet Monogram)
  // 1% damage bonus per 50 of highest stat
  // ---------------------------------------------------------------------------
  highestStatDamageBonus: {
    id: 'highestStatDamageBonus',
    name: 'Highest Stat Damage%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['highestAttribute'],
    config: {
      enabled: false,
      damagePerInterval: 1, // 1% damage bonus
      statInterval: 50,     // per 50 highest stat
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.highestStatDamageBonus.config;
      if (!config.enabled) return 0;
      const highest = stats.highestAttribute || 0;
      return Math.floor(highest / config.statInterval) * config.damagePerInterval;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage bonus from highest stat (1% per 50)',
  },

  // ---------------------------------------------------------------------------
  // SPAWN CHANCE DISPLAY (Amulet Monograms - display only, no calc chain)
  // ---------------------------------------------------------------------------
  eliteSpawnChance: {
    id: 'eliteSpawnChance',
    name: 'Elite Spawn%',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      chancePerInstance: 10,
      maxChance: 40,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.eliteSpawnChance.config;
      if (!config.enabled) return 0;
      const instances = config.instanceCount || 1;
      return Math.min(instances * config.chancePerInstance, config.maxChance);
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Chance to spawn another elite on kill (10% per, cap 40%)',
  },
  containerSpawnChance: {
    id: 'containerSpawnChance',
    name: 'Container Spawn%',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      chancePerInstance: 10,
      maxChance: 100,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.containerSpawnChance.config;
      if (!config.enabled) return 0;
      const instances = config.instanceCount || 1;
      return Math.min(instances * config.chancePerInstance, config.maxChance);
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Chance to spawn container on elite kill (10% per, cap 100%)',
  },

  // ---------------------------------------------------------------------------
  // CRIT DAMAGE FROM ARMOR (Helmet Monogram)
  // 1% crit damage per 500 total armor
  // ---------------------------------------------------------------------------
  critDamageFromArmor: {
    id: 'critDamageFromArmor',
    name: 'Crit Damage (Armor)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['totalArmor'],
    config: {
      enabled: false,
      critDamagePerInterval: 1, // 1% crit damage
      armorInterval: 500,       // per 500 total armor
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.critDamageFromArmor.config;
      if (!config.enabled) return 0;
      const armor = stats.totalArmor || 0;
      return Math.floor(armor / config.armorInterval) * config.critDamagePerInterval;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Crit damage bonus from armor (1% per 500 armor)',
  },

  // ---------------------------------------------------------------------------
  // ENERGY TO DAMAGE (Helmet Monogram)
  // 2 flat damage per energy over base 100
  // ---------------------------------------------------------------------------
  energyDamageBonus: {
    id: 'energyDamageBonus',
    name: 'Energy Damage',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      baseEnergy: 100,      // energy threshold
      damagePerEnergy: 2,   // 2 flat damage per energy over base
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.energyDamageBonus.config;
      if (!config.enabled) return 0;
      const energy = stats.energy || 0;
      const excess = Math.max(0, energy - config.baseEnergy);
      return excess * config.damagePerEnergy;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat damage from energy over 100 (2 per energy)',
  },

  // ---------------------------------------------------------------------------
  // INVENTORY SLOT BONUSES (Helmet Monograms)
  // Slots come from skill tree, cards, etc. — configurable until save mapping
  // ---------------------------------------------------------------------------
  invSlotBossDamageBonus: {
    id: 'invSlotBossDamageBonus',
    name: 'Boss Damage (Inv)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerSlot: 1,   // 1% boss damage per extra slot
      extraSlots: 0,     // set from save data
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.invSlotBossDamageBonus.config;
      if (!config.enabled) return 0;
      return (config.extraSlots || 0) * config.bonusPerSlot;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Boss damage from extra inventory slots (1% per slot)',
  },
  invSlotCritDamageBonus: {
    id: 'invSlotCritDamageBonus',
    name: 'Crit Damage (Inv)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerSlot: 5,   // 5% crit damage per extra slot
      extraSlots: 0,     // set from save data
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.invSlotCritDamageBonus.config;
      if (!config.enabled) return 0;
      return (config.extraSlots || 0) * config.bonusPerSlot;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Crit damage from extra inventory slots (5% per slot)',
  },

  // ---------------------------------------------------------------------------
  // JUGGERNAUT (Helmet - Fist Pinnacle, single instance only)
  // +40% move speed, +25% crit chance, 2x crit damage multiplier
  // ---------------------------------------------------------------------------
  juggernautMoveSpeed: {
    id: 'juggernautMoveSpeed',
    name: 'Juggernaut MS%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      moveSpeedBonus: 40,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.juggernautMoveSpeed.config;
      if (!config.enabled) return 0;
      return config.moveSpeedBonus;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Movement speed from Juggernaut (40%, single instance)',
  },
  juggernautCritChance: {
    id: 'juggernautCritChance',
    name: 'Juggernaut Crit%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      critChanceBonus: 25,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.juggernautCritChance.config;
      if (!config.enabled) return 0;
      return config.critChanceBonus;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Crit chance from Juggernaut (25%, single instance)',
  },
  juggernautCritDamage: {
    id: 'juggernautCritDamage',
    name: 'Juggernaut Crit Dmg',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      critDamageMultiplier: 2, // straight 2x multiplier on crit damage
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.juggernautCritDamage.config;
      if (!config.enabled) return 0;
      return config.critDamageMultiplier;
    },
    format: v => `${v.toFixed(0)}x`,
    description: 'Crit damage multiplier from Juggernaut (2x, single instance)',
  },

  // ---------------------------------------------------------------------------
  // PARAGON (Helmet Monograms - Melee & Ranged)
  // Per paragon level: 15 armor, 2 flat damage, 10 flat HP
  // Paragon level derived from stance XP (3500 XP per level after 5k)
  // Level configurable — XP calculation out of scope
  // ---------------------------------------------------------------------------
  paragonLevel: {
    id: 'paragonLevel',
    name: 'Paragon Level',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      level: 0, // set from save data (stance XP / 3500 after 5k threshold)
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.paragonLevel.config;
      if (!config.enabled) return 0;
      return config.level;
    },
    format: v => v.toFixed(0),
    description: 'Paragon level (from stance XP, 3500 per level)',
  },
  paragonArmorBonus: {
    id: 'paragonArmorBonus',
    name: 'Paragon Armor',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['paragonLevel'],
    config: {
      armorPerLevel: 15,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.paragonArmorBonus.config;
      const level = stats.paragonLevel || 0;
      return level * config.armorPerLevel;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat armor from Paragon level (15 per level)',
  },
  paragonDamageBonus: {
    id: 'paragonDamageBonus',
    name: 'Paragon Damage',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['paragonLevel'],
    config: {
      damagePerLevel: 2,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.paragonDamageBonus.config;
      const level = stats.paragonLevel || 0;
      return level * config.damagePerLevel;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat damage from Paragon level (2 per level)',
  },
  paragonHpBonus: {
    id: 'paragonHpBonus',
    name: 'Paragon HP',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['paragonLevel'],
    config: {
      hpPerLevel: 10,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.paragonHpBonus.config;
      const level = stats.paragonLevel || 0;
      return level * config.hpPerLevel;
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat HP from Paragon level (10 per level)',
  },

  // ---------------------------------------------------------------------------
  // SHROUD DAMAGE BONUSES (Helmet - base Shroud monogram)
  // 5% damageBonus per stack + 1% flatDamageBonus per stack (separate multiplier)
  // ---------------------------------------------------------------------------
  shroudDamageBonus: {
    id: 'shroudDamageBonus',
    name: 'Shroud Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['shroudStacks'],
    config: {
      damagePerStack: 5, // 5% per stack = 250% at max
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.shroudDamageBonus.config;
      const stacks = stats.shroudStacks || 0;
      return stacks * config.damagePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage bonus from Shroud stacks (5% per stack, 250% at max)',
  },
  shroudFlatDamageBonus: {
    id: 'shroudFlatDamageBonus',
    name: 'Shroud Flat Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['shroudStacks'],
    config: {
      flatDamagePerStack: 1, // 1% per stack = 50% at max (SEPARATE multiplier)
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.shroudFlatDamageBonus.config;
      const stacks = stats.shroudStacks || 0;
      return stacks * config.flatDamagePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Flat damage bonus from Shroud stacks (1% per stack, separate multiplier)',
  },

  // ---------------------------------------------------------------------------
  // SNAIL SPAWN CHANCE (Helmet - display only)
  // ---------------------------------------------------------------------------
  snailSpawnChance: {
    id: 'snailSpawnChance',
    name: 'Snail Spawn%',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      chancePerInstance: 10,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.snailSpawnChance.config;
      if (!config.enabled) return 0;
      const instances = config.instanceCount || 1;
      return instances * config.chancePerInstance;
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Chance to spawn snails (10% per instance)',
  },

  // ---------------------------------------------------------------------------
  // LIFESTEAL TO ENERGY STEAL (Helmet - drawback, no bonus calc)
  // ---------------------------------------------------------------------------
  lifestealToEnergySteal: {
    id: 'lifestealToEnergySteal',
    name: 'Energy Steal',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lifestealToEnergySteal.config;
      return config.enabled ? 1 : 0;
    },
    format: v => v > 0 ? 'Active' : 'Inactive',
    description: 'Converts lifesteal to energy steal (drawback)',
  },

  // ---------------------------------------------------------------------------
  // ESSENCE → CRIT CHAIN
  // Crit chance per essence: 1% crit per 20 essence
  // ---------------------------------------------------------------------------
  critChanceFromEssence: {
    id: 'critChanceFromEssence',
    name: 'Crit Chance (Essence)',
    category: 'monogram-chain',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['essence'],
    config: {
      enabled: false, // Enabled by monogram
      essencePerCrit: 20, // 20 essence = 1% crit
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.critChanceFromEssence.config;
      if (!config.enabled) return 0;
      const essence = stats.essence || 0;
      return Math.floor(essence / config.essencePerCrit);
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Critical chance from Essence (1% per 20 essence)',
  },

  // ---------------------------------------------------------------------------
  // ELEMENT FOR CRIT CHANCE (Helmet Monogram)
  // 3% fire/arcane/lightning per 1% crit over 100%
  // ---------------------------------------------------------------------------
  elementFromCritChance: {
    id: 'elementFromCritChance',
    name: 'Element% (Crit)',
    category: 'monogram-chain',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['critChanceFromEssence'],
    config: {
      enabled: false,
      elementType: 'fire', // fire, arcane, or lightning
      critThreshold: 100, // Only counts crit over this %
      elementPerCrit: 3, // 3% element per 1% crit over threshold
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.elementFromCritChance.config;
      if (!config.enabled) return 0;
      // Total crit = base crit + crit from essence + other sources
      const baseCrit = stats.critChance || 0;
      const essenceCrit = stats.critChanceFromEssence || 0;
      const totalCrit = baseCrit + essenceCrit;
      const excessCrit = Math.max(0, totalCrit - config.critThreshold);
      return excessCrit * config.elementPerCrit;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Elemental damage from crit over 100% (3% per 1% crit)',
  },

  // ---------------------------------------------------------------------------
  // LIFE FROM OVERCRIT (Helmet Monogram - ElementForCritChance.MaxHealth)
  // 1% life bonus per 1% crit over 100%
  // ---------------------------------------------------------------------------
  lifeBonusFromCritChance: {
    id: 'lifeBonusFromCritChance',
    name: 'Life% (Crit)',
    category: 'monogram-chain',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['critChanceFromEssence'],
    config: {
      enabled: false,
      critThreshold: 100, // Only counts crit over this %
      lifePerCrit: 1,     // 1% life per 1% crit over threshold
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lifeBonusFromCritChance.config;
      if (!config.enabled) return 0;
      const baseCrit = stats.critChance || 0;
      const essenceCrit = stats.critChanceFromEssence || 0;
      const totalCrit = baseCrit + essenceCrit;
      const excessCrit = Math.max(0, totalCrit - config.critThreshold);
      return excessCrit * config.lifePerCrit;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from crit over 100% (1% life per 1% overcrit)',
  },

  // ---------------------------------------------------------------------------
  // LIFE FROM ELEMENT (Ring Monogram - placeholder)
  // 2% life per 30% of a particular element
  // ---------------------------------------------------------------------------
  lifeFromElement: {
    id: 'lifeFromElement',
    name: 'Life% (Element)',
    category: 'monogram-chain',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['elementFromCritChance'],
    config: {
      enabled: false,
      elementPer: 30, // 30% element = this bonus
      lifeBonus: 2, // 2% life per threshold
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lifeFromElement.config;
      if (!config.enabled) return 0;
      const element = stats.elementFromCritChance || 0;
      return Math.floor(element / config.elementPer) * config.lifeBonus;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Life bonus from elemental damage (2% per 30% element)',
  },

  // ---------------------------------------------------------------------------
  // GAIN DAMAGE FOR HP LOSE ARMOR (Bracer Monogram)
  // 1% of total life added as Flat Damage
  // ---------------------------------------------------------------------------
  damageFromLife: {
    id: 'damageFromLife',
    name: 'Damage (Life)',
    category: 'monogram-chain',
    layer: LAYERS.TERTIARY_DERIVED,
    dependencies: ['totalHealth', 'lifeBuffBonus', 'lifeFromElement'],
    config: {
      enabled: false,
      lifePercent: 1, // 1% of total life
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.damageFromLife.config;
      if (!config.enabled) return 0;
      // Calculate total life with all bonuses
      const baseHealth = stats.totalHealth || 0;
      const lifeBuffPct = stats.lifeBuffBonus || 0;
      const lifeFromElemPct = stats.lifeFromElement || 0;
      const totalLifeBonus = lifeBuffPct + lifeFromElemPct;
      const totalLife = Math.floor(baseHealth * (1 + totalLifeBonus / 100));
      return Math.floor(totalLife * (config.lifePercent / 100));
    },
    format: v => `+${v.toFixed(0)}`,
    description: 'Flat damage from total life (1% of life)',
  },

  // ===========================================================================
  // BRACER MONOGRAM STATS
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // BLOODLUST DRAW BLOOD (Bracer Monogram)
  // 1% damage bonus per bloodlust stack (100% at max 100 stacks)
  // ---------------------------------------------------------------------------
  bloodlustDrawBloodBonus: {
    id: 'bloodlustDrawBloodBonus',
    name: 'Draw Blood Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['bloodlustStacks'],
    config: {
      damagePerStack: 1, // 1% per stack
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.bloodlustDrawBloodBonus.config;
      const stacks = stats.bloodlustStacks || 0;
      return stacks * config.damagePerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage bonus from Draw Blood (1% per bloodlust stack)',
  },

  // ---------------------------------------------------------------------------
  // COLOSSUS DOUBLE ATTACK SPEED (Bracer Monogram)
  // 2x IAS during Colossus (display flag)
  // ---------------------------------------------------------------------------
  colossusDoubleAttackSpeed: {
    id: 'colossusDoubleAttackSpeed',
    name: 'Colossus 2x IAS',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      multiplier: 2,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.colossusDoubleAttackSpeed.config;
      return config.enabled ? config.multiplier : 0;
    },
    format: v => v > 0 ? `${v.toFixed(0)}x` : 'Inactive',
    description: 'Double attack speed during Colossus',
  },

  // ---------------------------------------------------------------------------
  // CRIT CHANCE FROM ENERGY REGEN (Bracer Monogram)
  // 1:1 totalEnergyRegen → crit chance
  // ---------------------------------------------------------------------------
  critChanceFromEnergyRegen: {
    id: 'critChanceFromEnergyRegen',
    name: 'Crit% (Energy Regen)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      ratio: 1, // 1% crit per 1 energy regen
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.critChanceFromEnergyRegen.config;
      if (!config.enabled) return 0;
      const energyRegen = stats.energyRegen || 0;
      return energyRegen * config.ratio;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Crit chance from energy regen (1:1 ratio)',
  },

  // ---------------------------------------------------------------------------
  // DAMAGE% FOR STAT2 (Bracer Monogram)
  // 1% damageBonus per 50 of highest stat (duplicate ID for same mechanic)
  // ---------------------------------------------------------------------------
  damagePercentForStat2: {
    id: 'damagePercentForStat2',
    name: 'Stat Damage% II',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['highestAttribute'],
    config: {
      enabled: false,
      damagePerInterval: 1, // 1% damage bonus
      statInterval: 50,     // per 50 highest stat
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.damagePercentForStat2.config;
      if (!config.enabled) return 0;
      const highest = stats.highestAttribute || 0;
      return Math.floor(highest / config.statInterval) * config.damagePerInterval;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage% from highest stat (1% per 50)',
  },

  // ---------------------------------------------------------------------------
  // DAMAGE% NO POTION (Bracer Monogram)
  // 5% damage per potion slot, drawback: cannot use potions
  // ---------------------------------------------------------------------------
  damageNoPotionBonus: {
    id: 'damageNoPotionBonus',
    name: 'No Potion Damage%',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['potionSlotsFromAttributes'],
    config: {
      enabled: false,
      damagePerSlot: 5, // 5% per potion slot
      basePotionSlots: 3, // default base potion slots
      drawback: 'Cannot use potions',
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.damageNoPotionBonus.config;
      if (!config.enabled) return 0;
      const extraSlots = stats.potionSlotsFromAttributes || 0;
      const baseSlots = config.basePotionSlots || 3;
      return (baseSlots + extraSlots) * config.damagePerSlot;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage% per potion slot (5% per slot, cannot use potions)',
  },

  // ---------------------------------------------------------------------------
  // EXPLODING MINES (Bracer Monograms - 20 stacks max each)
  // 5% elemental bonus per stack
  // ---------------------------------------------------------------------------
  arcaneMineBonus: {
    id: 'arcaneMineBonus',
    name: 'Mine Arcane%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerStack: 5,
      maxStacks: 20,
      currentStacks: 20,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.arcaneMineBonus.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      return stacks * config.bonusPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Arcane bonus from mines (5% per stack, 20 max = 100%)',
  },
  fireMineBonus: {
    id: 'fireMineBonus',
    name: 'Mine Fire%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerStack: 5,
      maxStacks: 20,
      currentStacks: 20,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.fireMineBonus.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      return stacks * config.bonusPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Fire bonus from mines (5% per stack, 20 max = 100%)',
  },
  lightningMineBonus: {
    id: 'lightningMineBonus',
    name: 'Mine Lightning%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerStack: 5,
      maxStacks: 20,
      currentStacks: 20,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.lightningMineBonus.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      return stacks * config.bonusPerStack;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Lightning bonus from mines (5% per stack, 20 max = 100%)',
  },

  // ---------------------------------------------------------------------------
  // PULSE EXPLOSIONS (Bracer Monograms - 100 stacks max)
  // Proc damage = 3% of elementalBonus per stack
  // ---------------------------------------------------------------------------
  pulseArcaneDamage: {
    id: 'pulseArcaneDamage',
    name: 'Pulse Arcane Damage',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['arcaneMineBonus'],
    config: {
      enabled: false,
      percentPerStack: 3,
      maxStacks: 100,
      currentStacks: 100,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.pulseArcaneDamage.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      // Total arcane bonus from all sources
      const arcaneBonus = (stats.arcaneBonus || 0) + (stats.arcaneMineBonus || 0);
      return stacks * (config.percentPerStack / 100) * arcaneBonus;
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Pulse arcane proc damage (3% of arcane bonus × stacks, 100 max)',
  },
  pulseFireDamage: {
    id: 'pulseFireDamage',
    name: 'Pulse Fire Damage',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['fireMineBonus'],
    config: {
      enabled: false,
      percentPerStack: 3,
      maxStacks: 100,
      currentStacks: 100,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.pulseFireDamage.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      const fireBonus = (stats.fireBonus || 0) + (stats.fireMineBonus || 0);
      return stacks * (config.percentPerStack / 100) * fireBonus;
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Pulse fire proc damage (3% of fire bonus × stacks, 100 max)',
  },
  pulseLightningDamage: {
    id: 'pulseLightningDamage',
    name: 'Pulse Lightning Damage',
    category: 'monogram-buff',
    layer: LAYERS.SECONDARY_DERIVED,
    dependencies: ['lightningMineBonus'],
    config: {
      enabled: false,
      percentPerStack: 3,
      maxStacks: 100,
      currentStacks: 100,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.pulseLightningDamage.config;
      if (!config.enabled) return 0;
      const stacks = Math.min(config.currentStacks, config.maxStacks);
      const lightningBonus = (stats.lightningBonus || 0) + (stats.lightningMineBonus || 0);
      return stacks * (config.percentPerStack / 100) * lightningBonus;
    },
    format: v => `${v.toFixed(0)}%`,
    description: 'Pulse lightning proc damage (3% of lightning bonus × stacks, 100 max)',
  },

  // ---------------------------------------------------------------------------
  // CHARGED SECONDARY DAMAGE (Bracer Monogram - primary scaling driver)
  // 100% charged secondary damage per 100 of highest stat
  // ---------------------------------------------------------------------------
  chargedSecondaryDamageBonus: {
    id: 'chargedSecondaryDamageBonus',
    name: 'Charged Secondary%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: ['highestAttribute'],
    config: {
      enabled: false,
      bonusPer100Stat: 100, // 100% charged secondary damage per 100 highest stat
      uptimeEstimate: 0.5,  // estimated uptime for effective DPS display
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.chargedSecondaryDamageBonus.config;
      if (!config.enabled) return 0;
      const highest = stats.highestAttribute || 0;
      return Math.floor(highest / 100) * config.bonusPer100Stat;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Charged secondary damage from highest stat (100% per 100 stat)',
  },

  // ---------------------------------------------------------------------------
  // SHROUD MAX STACKS BONUS (Bracer Monogram)
  // 2x multiplier on first hit when light→dark shroud transition
  // Display only, don't fold into primary damage
  // ---------------------------------------------------------------------------
  shroudMaxStacksMultiplier: {
    id: 'shroudMaxStacksMultiplier',
    name: 'Shroud First-Hit',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      multiplier: 2,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.shroudMaxStacksMultiplier.config;
      return config.enabled ? config.multiplier : 0;
    },
    format: v => v > 0 ? `${v.toFixed(0)}x` : 'Inactive',
    description: '2x damage on first hit (light→dark shroud transition)',
  },

  // ---------------------------------------------------------------------------
  // DOUBLE BUFF LENGTH (Bracer - display stub)
  // ---------------------------------------------------------------------------
  doubleBuffLength: {
    id: 'doubleBuffLength',
    name: 'Double Buff Length',
    category: 'monogram-display',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.doubleBuffLength.config;
      return config.enabled ? 1 : 0;
    },
    format: v => v > 0 ? 'Active' : 'Inactive',
    description: 'Doubles buff durations',
  },

  // ---------------------------------------------------------------------------
  // COLOSSUS DAMAGE BONUS (Bracer Monogram)
  // 70% damage while Colossus is active
  // ---------------------------------------------------------------------------
  colossusDamageBonus: {
    id: 'colossusDamageBonus',
    name: 'Colossus Damage%',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      damageBonus: 70, // 70% damage while Colossus active
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.colossusDamageBonus.config;
      return config.enabled ? config.damageBonus : 0;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: '70% damage while Colossus is active',
  },

  // ---------------------------------------------------------------------------
  // INVENTORY SLOT DAMAGE BONUS (Bracer Monogram)
  // 2% damage per bonus inventory slot
  // ---------------------------------------------------------------------------
  invSlotDamageBonus: {
    id: 'invSlotDamageBonus',
    name: 'Damage% (Inv Slot)',
    category: 'monogram-buff',
    layer: LAYERS.PRIMARY_DERIVED,
    dependencies: [],
    config: {
      enabled: false,
      bonusPerSlot: 2, // 2% damage per extra slot
      extraSlots: 0,   // populated from save data / user config
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.invSlotDamageBonus.config;
      if (!config.enabled) return 0;
      const slots = config.extraSlots || stats.extraInventorySlots || 0;
      return slots * config.bonusPerSlot;
    },
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage% per bonus inventory slot (2% per slot)',
  },

  // ===========================================================================
  // eDPS CALCULATION
  //
  // Formula (assuming 100% crit, ignoring IAS):
  //   Normal:  FLAT × (CHD + DB + SD) × SCHD × WAD × EMulti = DD
  //   Boss:    DD × BD
  //   Offhand: DD × (AD + AFFIN) × ED
  //
  // Terms:
  //   FLAT  = total flat damage (gear damage + monogram flat sources)
  //   CHD   = base crit hit damage (additive bucket since S3.5)
  //   DB    = damage bonus % (additive from all sources)
  //   SD    = stance damage % (included for display; 0 when using offhands)
  //   SCHD  = stance crit hit damage (standalone multiplier since S4.0)
  //   WAD   = weapon ability damage multiplier (primary 200%, secondary 400%)
  //   EMulti= enchantment independent multipliers (class weapon, distance, etc.)
  //   BD    = boss damage %
  //   AD    = ability damage (offhand skill damage)
  //   ED    = elemental damage % (additive from all sources)
  //   AFFIN = affinity damage from skill tree
  //
  // NOTE: Primary attributes do NOT feed flat damage directly.
  //   STR → Armor bonus      DEX → Crit Chance
  //   WIS → (TBD)            VIT → Health
  //   END → (TBD)            AGI → Move Speed / Dodge
  //   LCK → (TBD)            STA → (TBD)
  //   Attribute→bonus mappings are NOT balanced and vary by build.
  //
  // TODO: Wire stance detection from equipped weapon type (rowName keywords)
  // TODO: Integrate skill tree data for AFFIN / AD
  // TODO: Map attribute→stat bonuses once confirmed (STR→armor, DEX→crit, etc.)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // eDPS LAYER: Bucket aggregations and final damage numbers
  // ---------------------------------------------------------------------------

  /**
   * FLAT: Total flat damage from all sources.
   * Gear flat damage + health conversion + monogram flat bonuses.
   * NOTE: Primary attributes (STR, etc.) do NOT feed flat damage directly.
   */
  edpsFlat: {
    id: 'edpsFlat',
    name: 'FLAT (Base Damage)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: ['totalDamage', 'damageFromHealth',
      'flatDamageMonogramBonus', 'noEnergyDamageBonus', 'paragonDamageBonus'],
    calculate: (stats) => {
      const baseDamage = stats.totalDamage || 0;
      const healthDamage = stats.damageFromHealth || 0;
      const flatMono = stats.flatDamageMonogramBonus || 0;
      const noEnergyMono = stats.noEnergyDamageBonus || 0;
      const paragonDmg = stats.paragonDamageBonus || 0;
      return Math.floor(baseDamage + healthDamage + flatMono + noEnergyMono + paragonDmg);
    },
    format: v => v.toFixed(0),
    description: 'Total flat damage: gear damage + health conversion + monogram flat bonuses',
  },

  /**
   * CHD + DB + SD: Additive damage multiplier bucket.
   * Base crit damage + damage bonus% + stance damage% (all additive since S3.5).
   * Values stored as decimals in save data (0.50 = 50%).
   *
   * When config.stance is set (from equipped weapon), uses that stance's stats.
   * Otherwise falls back to picking the highest non-zero stance.
   */
  edpsAdditiveMulti: {
    id: 'edpsAdditiveMulti',
    name: 'CHD + DB + SD',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: [],
    config: { stance: null },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.edpsAdditiveMulti.config;
      const critDmg = stats.critDamage || 0;         // decimal: 1.5 = 150%
      const dmgBonus = stats.damageBonus || 0;        // decimal: 0.50 = 50%

      // Stance damage: use weapon-detected stance if available, else highest
      const STANCE_DMG_IDS = {
        maul: 'maulDamage', sword: 'swordDamage', archery: 'archeryDamage',
        magery: 'mageryDamage', unarmed: 'unarmedDamage', scythe: 'scytheDamage',
        twohand: 'twohandDamage', spear: 'spearDamage',
      };
      let stanceDmg = 0;
      if (config.stance && STANCE_DMG_IDS[config.stance]) {
        stanceDmg = stats[STANCE_DMG_IDS[config.stance]] || 0;
      } else {
        for (const id of Object.values(STANCE_DMG_IDS)) {
          if ((stats[id] || 0) > stanceDmg) stanceDmg = stats[id];
        }
      }

      // Add monogram damage% sources that are additive with this bucket
      const phasingDmg = (stats.phasingDamageBonus || 0) / 100;
      const shroudDmg = (stats.shroudDamageBonus || 0) / 100;
      const drawBloodDmg = (stats.bloodlustDrawBloodBonus || 0) / 100;
      const highestStatDmg = (stats.highestStatDamageBonus || 0) / 100;
      const dmgPerStat2 = (stats.damagePercentForStat2 || 0) / 100;
      const colossusDmg = (stats.colossusDamageBonus || 0) / 100;
      const noPotionDmg = (stats.damageNoPotionBonus || 0) / 100;
      const invSlotDmg = (stats.invSlotDamageBonus || 0) / 100;

      return critDmg + dmgBonus + stanceDmg
        + phasingDmg + shroudDmg + drawBloodDmg + highestStatDmg
        + dmgPerStat2 + colossusDmg + noPotionDmg + invSlotDmg;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Additive bucket: Crit Damage + Damage Bonus% + Stance Damage% + monogram damage%',
  },

  /**
   * SCHD: Stance Crit Hit Damage — standalone multiplier since S4.0.
   * Uses weapon-detected stance when available, else highest.
   * Applied as (1 + SCHD) multiplier.
   */
  edpsSCHD: {
    id: 'edpsSCHD',
    name: 'SCHD (Stance Crit)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: [],
    config: { stance: null },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.edpsSCHD.config;

      const STANCE_CRIT_IDS = {
        maul: 'maulCritDamage', sword: 'swordCritDamage', archery: 'archeryCritDamage',
        magery: 'mageryCritDamage', unarmed: 'unarmedCritDamage', scythe: 'scytheCritDamage',
        twohand: 'twohandCritDamage', spear: 'spearCritDamage',
      };
      let stanceCrit = 0;
      if (config.stance && STANCE_CRIT_IDS[config.stance]) {
        stanceCrit = stats[STANCE_CRIT_IDS[config.stance]] || 0;
      } else {
        for (const id of Object.values(STANCE_CRIT_IDS)) {
          if ((stats[id] || 0) > stanceCrit) stanceCrit = stats[id];
        }
      }

      // Bloodlust crit damage is additive into this bucket
      const bloodlustCrit = (stats.bloodlustCritDamageBonus || 0) / 100;
      const critFromArmor = (stats.critDamageFromArmor || 0) / 100;
      return 1 + stanceCrit + bloodlustCrit + critFromArmor;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Stance Crit Hit Damage multiplier (standalone since S4.0)',
  },

  /**
   * WAD: Weapon Ability Damage multiplier.
   * Primary (left click) = 200%, Q/R = 400% base.
   * Monogram bonuses are additive to these.
   * Config determines which to show (default: primary).
   */
  edpsWAD: {
    id: 'edpsWAD',
    name: 'WAD (Ability Damage)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: [],
    config: {
      primaryBase: 2.0,    // 200% base for left click
      secondaryBase: 4.0,  // 400% base for Q/R
      useSecondary: false,  // toggle to show Q/R instead of primary
      wadBonus: 0,         // additive bonus from monograms/tree (decimal)
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.edpsWAD.config;
      const base = config.useSecondary ? config.secondaryBase : config.primaryBase;
      return base + (config.wadBonus || 0);
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Weapon Ability Damage: primary 200%, Q/R 400% + monogram bonuses',
  },

  /**
   * EMulti: Enchantment / independent multipliers.
   * Class weapon bonus, distance procs, shroud flat damage%, etc.
   * Each is its own multiplier — they multiply together.
   */
  edpsEMulti: {
    id: 'edpsEMulti',
    name: 'EMulti (Enchant)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: ['distanceProcsDamageBonus', 'distanceProcsNearDamageBonus',
      'shroudFlatDamageBonus'],
    config: {
      classWeaponBonus: 0, // manual: class weapon augmentation (decimal, e.g. 0.50 = 50%)
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.edpsEMulti.config;
      let multi = 1;

      // Class weapon bonus
      if (config.classWeaponBonus) {
        multi *= (1 + config.classWeaponBonus);
      }

      // Distance procs (exclusive pair — only one active, own bucket)
      const distFar = stats.distanceProcsDamageBonus || 0;
      const distNear = stats.distanceProcsNearDamageBonus || 0;
      const distBonus = Math.max(distFar, distNear);
      if (distBonus) {
        multi *= (1 + distBonus / 100);
      }

      // Shroud flat damage% (separate multiplier from shroud damage%)
      const shroudFlat = stats.shroudFlatDamageBonus || 0;
      if (shroudFlat) {
        multi *= (1 + shroudFlat / 100);
      }

      return multi;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Independent multipliers: class weapon, distance procs, shroud flat%',
  },

  /**
   * BD: Boss Damage % — separate multiplier applied to boss/elite targets.
   */
  edpsBD: {
    id: 'edpsBD',
    name: 'BD (Boss Damage)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: ['phasingBossDamageBonus'],
    calculate: (stats) => {
      const bossBonus = stats.bossBonus || 0; // decimal from gear
      const phasingBoss = (stats.phasingBossDamageBonus || 0) / 100;
      return 1 + bossBonus + phasingBoss;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Boss/Elite damage multiplier',
  },

  /**
   * ED: Elemental Damage — additive from all sources.
   * Fire + Arcane + Lightning + monogram element bonuses.
   * Applied as (1 + ED) multiplier on offhand.
   */
  edpsED: {
    id: 'edpsED',
    name: 'ED (Elemental)',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: ['elementFromCritChance', 'arcaneMineBonus', 'fireMineBonus', 'lightningMineBonus'],
    calculate: (stats) => {
      // Gear elemental (decimals)
      const fire = stats.fireDamageBonus || 0;
      const arcane = stats.arcaneDamageBonus || 0;
      const lightning = stats.lightningDamageBonus || 0;
      // Monogram element bonuses (already whole numbers, convert)
      const elemFromCrit = (stats.elementFromCritChance || 0) / 100;
      const arcMine = (stats.arcaneMineBonus || 0) / 100;
      const fireMine = (stats.fireMineBonus || 0) / 100;
      const ltngMine = (stats.lightningMineBonus || 0) / 100;
      return 1 + fire + arcane + lightning + elemFromCrit + arcMine + fireMine + ltngMine;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Elemental damage multiplier (all sources additive)',
  },

  /**
   * AD + AFFIN: Ability Damage + Affinity — offhand skill scaling.
   * AD comes from offhand skill damage affixes on gear.
   * AFFIN is skill tree affinity damage (manual input for now).
   */
  edpsAD: {
    id: 'edpsAD',
    name: 'AD + Affinity',
    category: 'edps',
    layer: LAYERS.EDPS,
    dependencies: [],
    config: {
      abilityDamage: 1.0, // decimal: offhand ability base (from gear skill% affixes)
      affinityDamage: 0,  // decimal: skill tree affinity bonus
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.edpsAD.config;
      return config.abilityDamage + config.affinityDamage;
    },
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Offhand ability damage + skill tree affinity',
  },

  /**
   * DD: Damage per hit (normal mobs).
   * FLAT × (CHD + DB + SD) × SCHD × WAD × EMulti
   */
  edpsDDNormal: {
    id: 'edpsDDNormal',
    name: 'Hit Damage (Normal)',
    category: 'edps-result',
    layer: LAYERS.EDPS,
    dependencies: ['edpsFlat', 'edpsAdditiveMulti', 'edpsSCHD', 'edpsWAD', 'edpsEMulti'],
    calculate: (stats) => {
      return Math.floor(
        (stats.edpsFlat || 0)
        * (stats.edpsAdditiveMulti || 1)
        * (stats.edpsSCHD || 1)
        * (stats.edpsWAD || 1)
        * (stats.edpsEMulti || 1)
      );
    },
    format: v => v.toLocaleString(),
    description: 'FLAT × (CHD + DB + SD) × SCHD × WAD × EMulti',
  },

  /**
   * DD: Damage per hit (boss/elite mobs).
   * DDNormal × BD
   */
  edpsDDBoss: {
    id: 'edpsDDBoss',
    name: 'Hit Damage (Boss)',
    category: 'edps-result',
    layer: LAYERS.EDPS,
    dependencies: ['edpsDDNormal', 'edpsBD'],
    calculate: (stats) => {
      return Math.floor((stats.edpsDDNormal || 0) * (stats.edpsBD || 1));
    },
    format: v => v.toLocaleString(),
    description: 'Hit Damage × Boss Damage%',
  },

  /**
   * Offhand Damage (normal): DD × (AD + AFFIN) × ED
   */
  edpsOffhandNormal: {
    id: 'edpsOffhandNormal',
    name: 'Offhand Damage (Normal)',
    category: 'edps-result',
    layer: LAYERS.EDPS,
    dependencies: ['edpsDDNormal', 'edpsAD', 'edpsED'],
    calculate: (stats) => {
      return Math.floor(
        (stats.edpsDDNormal || 0)
        * (stats.edpsAD || 1)
        * (stats.edpsED || 1)
      );
    },
    format: v => v.toLocaleString(),
    description: 'DD × (AD + Affinity) × Elemental Damage',
  },

  /**
   * Offhand Damage (boss): DDBoss × (AD + AFFIN) × ED
   */
  edpsOffhandBoss: {
    id: 'edpsOffhandBoss',
    name: 'Offhand Damage (Boss)',
    category: 'edps-result',
    layer: LAYERS.EDPS,
    dependencies: ['edpsDDBoss', 'edpsAD', 'edpsED'],
    calculate: (stats) => {
      return Math.floor(
        (stats.edpsDDBoss || 0)
        * (stats.edpsAD || 1)
        * (stats.edpsED || 1)
      );
    },
    format: v => v.toLocaleString(),
    description: 'Boss DD × (AD + Affinity) × Elemental Damage',
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
