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
