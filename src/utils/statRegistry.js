/**
 * Unified Stat Registry
 *
 * Single source of truth for all stat definitions. This file consolidates:
 * - Stat types for UI selection (previously in statBuckets.js)
 * - Stat calculation definitions (previously in useDerivedStats.js)
 * - Display name mappings (previously in attributeDisplay.js)
 *
 * To add a new stat:
 * 1. Add an entry to STAT_REGISTRY with all known patterns
 * 2. The generated exports will automatically include it everywhere
 *
 * Pattern format:
 * - Use exact attribute paths as they appear in save data (after prefix stripping)
 * - Include all known variations (typos in game data, with/without prefixes)
 * - The 'canonical' field is used when writing new attributes
 */

// ============================================================================
// STAT REGISTRY - Single Source of Truth
// ============================================================================

export const STAT_REGISTRY = {
  // ---------------------------------------------------------------------------
  // PRIMARY ATTRIBUTES
  // ---------------------------------------------------------------------------
  strength: {
    id: 'strength',
    name: 'Strength',
    category: 'attributes',
    patterns: [
      'Characteristics.Strength',
      'Strength',
    ],
    canonical: 'Characteristics.Strength',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Strength',
  },
  strengthBonus: {
    id: 'strengthBonus',
    name: 'Strength Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Strength%',
      'Strength%',
    ],
    canonical: 'Characteristics.Strength%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Strength Bonus',
  },
  dexterity: {
    id: 'dexterity',
    name: 'Dexterity',
    category: 'attributes',
    patterns: [
      'Characteristics.Dexterity',
      'Dexterity',
    ],
    canonical: 'Characteristics.Dexterity',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Dexterity',
  },
  dexterityBonus: {
    id: 'dexterityBonus',
    name: 'Dexterity Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Dexterity%',
      'Dexterity%',
    ],
    canonical: 'Characteristics.Dexterity%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Dexterity Bonus',
  },
  wisdom: {
    id: 'wisdom',
    name: 'Wisdom',
    category: 'attributes',
    patterns: [
      'Characteristics.Wisdom',
      'Wisdom',
    ],
    canonical: 'Characteristics.Wisdom',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Wisdom',
  },
  wisdomBonus: {
    id: 'wisdomBonus',
    name: 'Wisdom Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Wisdom%',
      'Wisdom%',
    ],
    canonical: 'Characteristics.Wisdom%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Wisdom Bonus',
  },
  luck: {
    id: 'luck',
    name: 'Luck',
    category: 'attributes',
    patterns: [
      'Characteristics.Luck',
      'Luck',
    ],
    canonical: 'Characteristics.Luck',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Luck',
  },
  luckBonus: {
    id: 'luckBonus',
    name: 'Luck Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Luck%',
      'Luck%',
    ],
    canonical: 'Characteristics.Luck%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Luck Bonus',
  },
  agility: {
    id: 'agility',
    name: 'Agility',
    category: 'attributes',
    patterns: [
      'Characteristics.Agility',
      'Agility',
    ],
    canonical: 'Characteristics.Agility',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Agility',
  },
  agilityBonus: {
    id: 'agilityBonus',
    name: 'Agility Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Agility%',
      'Agility%',
    ],
    canonical: 'Characteristics.Agility%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Agility Bonus',
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    category: 'attributes',
    patterns: [
      'Characteristics.Endurance',
      'Endurance',
      'Characteristics.Intelligence', // Game uses Intelligence internally
      'Intelligence',
    ],
    canonical: 'Characteristics.Intelligence',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Endurance',
  },
  enduranceBonus: {
    id: 'enduranceBonus',
    name: 'Endurance Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Endurance%',
      'Endurance%',
      'Characteristics.Intelligence%',
      'Intelligence%',
    ],
    canonical: 'Characteristics.Intelligence%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Endurance Bonus',
  },
  stamina: {
    id: 'stamina',
    name: 'Stamina',
    category: 'attributes',
    patterns: [
      'Characteristics.Stamina',
      'Stamina',
    ],
    canonical: 'Characteristics.Stamina',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Stamina',
  },
  staminaBonus: {
    id: 'staminaBonus',
    name: 'Stamina Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Stamina%',
      'Stamina%',
    ],
    canonical: 'Characteristics.Stamina%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Stamina Bonus',
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    category: 'attributes',
    patterns: [
      'Characteristics.Vitality',
      'Vitality',
    ],
    canonical: 'Characteristics.Vitality',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Vitality',
  },
  vitalityBonus: {
    id: 'vitalityBonus',
    name: 'Vitality Bonus',
    category: 'attributes',
    patterns: [
      'Characteristics.Vitality%',
      'Vitality%',
    ],
    canonical: 'Characteristics.Vitality%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Vitality Bonus',
  },

  // ---------------------------------------------------------------------------
  // OFFENSE - GENERIC
  // ---------------------------------------------------------------------------
  damage: {
    id: 'damage',
    name: 'Damage',
    category: 'offense',
    patterns: [
      'Damage',
    ],
    canonical: 'Damage',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Base damage',
    // Use $ anchor in regex to avoid matching sub-patterns
    regexPatterns: ['Damage$'],
  },
  damageBonus: {
    id: 'damageBonus',
    name: 'Damage Bonus',
    category: 'offense',
    patterns: [
      'Damage%',
    ],
    canonical: 'Damage%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Damage Bonus',
  },
  critChance: {
    id: 'critChance',
    name: 'Critical Chance',
    category: 'offense',
    patterns: [
      'CriticalChance',
      'CritChance',
      'CriticalChance%',
    ],
    canonical: 'CriticalChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to deal critical strikes',
  },
  critDamage: {
    id: 'critDamage',
    name: 'Critical Damage',
    category: 'offense',
    patterns: [
      'CriticalDamage%',
      'CriticalDamage',
    ],
    canonical: 'CriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Bonus damage on critical strikes',
  },
  attackSpeed: {
    id: 'attackSpeed',
    name: 'Attack Speed',
    category: 'offense',
    patterns: [
      'AttackSpeed',
    ],
    canonical: 'AttackSpeed',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Increased attack speed',
    regexPatterns: ['AttackSpeed', 'Attack.*Speed'],
  },
  bossBonus: {
    id: 'bossBonus',
    name: 'Boss Damage Bonus',
    category: 'offense',
    patterns: [
      'Boss%',
    ],
    canonical: 'Boss%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Bonus damage against bosses',
  },

  // ---------------------------------------------------------------------------
  // OFFENSE - STANCE/WEAPON SPECIFIC
  // ---------------------------------------------------------------------------
  mageryDamage: {
    id: 'mageryDamage',
    name: 'Magery Damage',
    category: 'stance',
    patterns: [
      'MageryDamage',
      'MageryDamage%',
      'Magery.Damage',
    ],
    canonical: 'MageryDamage',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Bonus magical damage from all sources',
    regexPatterns: ['MageryDamage', 'Magery.*Damage(?!%)'],
  },
  mageryCritDamage: {
    id: 'mageryCritDamage',
    name: 'Magery Critical Damage',
    category: 'stance',
    patterns: [
      'MageryCriticalDamage%',
      'MageryCritDamage',
      'Damage.Magery.CriticalDamage%',
    ],
    canonical: 'MageryCriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Magery critical damage bonus',
  },
  mageryCritChance: {
    id: 'mageryCritChance',
    name: 'Magery Critical Chance',
    category: 'stance',
    patterns: [
      'MageryCriticalChance%',
      'MageryCritChance',
    ],
    canonical: 'MageryCriticalChance%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Magery critical chance bonus',
  },

  maulDamage: {
    id: 'maulDamage',
    name: 'Mauls Damage',
    category: 'stance',
    patterns: [
      'MaulsDamage%',
      'MaulDamage',
      'Mauls.Damage',
      'PoleArm%',
    ],
    canonical: 'MaulsDamage%',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Mauls damage bonus',
  },
  maulCritDamage: {
    id: 'maulCritDamage',
    name: 'Mauls Critical Damage',
    category: 'stance',
    patterns: [
      'MaulsCriticalDamage%',
      'MaulCritDamage',
      'Damage.Mauls.CriticalDamage%',
    ],
    canonical: 'MaulsCriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Mauls critical damage bonus',
  },
  maulCritChance: {
    id: 'maulCritChance',
    name: 'Mauls Critical Chance',
    category: 'stance',
    patterns: [
      'MaulsCriticalChance%',
      'MaulCritChance',
    ],
    canonical: 'MaulsCriticalChance%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Mauls critical chance bonus',
  },

  archeryDamage: {
    id: 'archeryDamage',
    name: 'Archery Damage',
    category: 'stance',
    patterns: [
      'ArcheryDamage%',
      'ArcheryDamage',
      'Archery.Damage',
    ],
    canonical: 'ArcheryDamage%',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Archery damage bonus',
  },
  archeryCritDamage: {
    id: 'archeryCritDamage',
    name: 'Archery Critical Damage',
    category: 'stance',
    patterns: [
      'ArcheryCriticalDamage%',
      'ArcheryCritDamage',
      'Damage.Archery.CriticalDamage%',
    ],
    canonical: 'ArcheryCriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Archery critical damage bonus',
  },
  archeryCritChance: {
    id: 'archeryCritChance',
    name: 'Archery Critical Chance',
    category: 'stance',
    patterns: [
      'ArcheryCriticalChance%',
      'ArcheryCritChance',
    ],
    canonical: 'ArcheryCriticalChance%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Archery critical chance bonus',
  },

  unarmedDamage: {
    id: 'unarmedDamage',
    name: 'Unarmed Damage',
    category: 'stance',
    patterns: [
      'UnarmedDamage%',
      'UnarmedDamage',
      'Unarmed.Damage',
    ],
    canonical: 'UnarmedDamage%',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Unarmed damage bonus',
  },
  unarmedCritDamage: {
    id: 'unarmedCritDamage',
    name: 'Unarmed Critical Damage',
    category: 'stance',
    patterns: [
      'UnarmedCriticalDamage%',
      'UnarmedCritDamage',
      'Damage.Unarmed.CriticalDamage%',
    ],
    canonical: 'UnarmedCriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Unarmed critical damage bonus',
  },
  unarmedCritChance: {
    id: 'unarmedCritChance',
    name: 'Unarmed Critical Chance',
    category: 'stance',
    patterns: [
      'UnarmedCriticalChance%',
      'UnarmedCritChance',
    ],
    canonical: 'UnarmedCriticalChance%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Unarmed critical chance bonus',
  },

  swordDamage: {
    id: 'swordDamage',
    name: 'Sword Damage',
    category: 'stance',
    patterns: [
      'SwordDamage%',
      'SwordDamage',
      'Sword.Damage',
      'Damage.OneHanded',
      'OneHanded',
    ],
    canonical: 'Damage.OneHanded',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Sword/One-Handed damage bonus',
  },
  swordCritDamage: {
    id: 'swordCritDamage',
    name: 'Sword Critical Damage',
    category: 'stance',
    patterns: [
      'SwordCriticalDamage%',
      'SwordCritDamage',
      'Damage.Sword.CriticalDamage%',
      'Damage.OneHandedCriticalDamage',
      'OneHandedCriticalDamage',
    ],
    canonical: 'Damage.OneHandedCriticalDamage',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Sword critical damage bonus',
  },
  swordCritChance: {
    id: 'swordCritChance',
    name: 'Sword Critical Chance',
    category: 'stance',
    patterns: [
      'SwordCriticalChance%',
      'SwordCritChance',
      'Damage.OneHandedCriticalChance',
      'OneHandedCriticalChance',
    ],
    canonical: 'Damage.OneHandedCriticalChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Sword critical chance bonus',
  },

  spearDamage: {
    id: 'spearDamage',
    name: 'Spear Damage',
    category: 'stance',
    patterns: [
      'SpearDamage%',
      'SpearDamage',
      'Spear.Damage',
      'Damage.PoleArmDamage',
      'PoleArmDamage',
    ],
    canonical: 'Damage.PoleArmDamage',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Spear/Polearm damage bonus',
  },
  spearCritDamage: {
    id: 'spearCritDamage',
    name: 'Spear Critical Damage',
    category: 'stance',
    patterns: [
      'SpearCriticalDamage%',
      'SpearCritDamage',
      'Damage.Spear.CriticalDamage%',
      'PoleArmCriticalDamage',
    ],
    canonical: 'PoleArmCriticalDamage',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Spear critical damage bonus',
  },
  spearCritChance: {
    id: 'spearCritChance',
    name: 'Spear Critical Chance',
    category: 'stance',
    patterns: [
      'SpearCriticalChance%',
      'SpearCritChance',
      'PoleArmCritcalChance', // Note: typo in game data
      'PoleArmCriticalChance',
    ],
    canonical: 'PoleArmCritcalChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Spear critical chance bonus',
  },

  scytheDamage: {
    id: 'scytheDamage',
    name: 'Scythes Damage',
    category: 'stance',
    patterns: [
      'ScythesDamage%',
      'ScythesDamage',
      'Scythes.Damage',
      'Damage.MageryDamage',
    ],
    canonical: 'ScythesDamage%',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Scythes damage bonus',
  },
  scytheCritDamage: {
    id: 'scytheCritDamage',
    name: 'Scythes Critical Damage',
    category: 'stance',
    patterns: [
      'ScythesCriticalDamage%',
      'ScythesCritDamage',
      'Damage.Scythes.CriticalDamage%',
    ],
    canonical: 'ScythesCritDamage',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Scythes critical damage bonus',
  },
  scytheCritChance: {
    id: 'scytheCritChance',
    name: 'Scythes Critical Chance',
    category: 'stance',
    patterns: [
      'ScythesCriticalChance%',
      'ScythesCritChance',
    ],
    canonical: 'ScythesCritChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Scythes critical chance bonus',
  },

  twohandDamage: {
    id: 'twohandDamage',
    name: 'Axes Damage',
    category: 'stance',
    patterns: [
      'TwoHandedDamage',
      'Damage.TwoHandedDamage',
    ],
    canonical: 'Damage.TwoHandedDamage',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Two-Handed/Axes damage bonus',
  },
  twohandCritDamage: {
    id: 'twohandCritDamage',
    name: 'Axes Critical Damage',
    category: 'stance',
    patterns: [
      'TwoHandedCritDamage',
      'TwoHandedCriticalDamage',
    ],
    canonical: 'TwoHandedCritDamage',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Two-Handed critical damage bonus',
  },
  twohandCritChance: {
    id: 'twohandCritChance',
    name: 'Axes Critical Chance',
    category: 'stance',
    patterns: [
      'TwoHandedCriticalChance',
      'TwoHandedCritChance',
    ],
    canonical: 'TwoHandedCriticalChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Two-Handed critical chance bonus',
  },

  // ---------------------------------------------------------------------------
  // DEFENSE
  // ---------------------------------------------------------------------------
  armor: {
    id: 'armor',
    name: 'Armor',
    category: 'defense',
    patterns: [
      'Armor',
      'armor',
    ],
    canonical: 'Armor',
    isPercent: false,
    format: v => v.toFixed(0),
    description: 'Armor',
    regexPatterns: ['Armor$', '\\.Armor$'],
  },
  armorBonus: {
    id: 'armorBonus',
    name: 'Armor Bonus',
    category: 'defense',
    patterns: [
      'Armor%',
    ],
    canonical: 'Armor%',
    isPercent: true,
    format: v => `${v.toFixed(1)}%`,
    description: 'Armor damage reduction bonus',
  },
  health: {
    id: 'health',
    name: 'Health',
    category: 'defense',
    patterns: [
      'MaxHealth',
      'Health',
    ],
    canonical: 'MaxHealth',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Maximum health points',
    regexPatterns: ['MaxHealth', 'Health$', '\\.Health$'],
  },
  healthBonus: {
    id: 'healthBonus',
    name: 'Health Bonus',
    category: 'defense',
    patterns: [
      'Health%',
      'Life%',
    ],
    canonical: 'Health%',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Maximum health bonus',
    regexPatterns: ['Health%', '\\.Health%', 'Life%'],
  },
  healthRegen: {
    id: 'healthRegen',
    name: 'Health Regen',
    category: 'defense',
    patterns: [
      'HealthRegeneration',
      'HealthRegen',
    ],
    canonical: 'HealthRegeneration',
    isPercent: false,
    format: v => `+${v.toFixed(1)}/s`,
    description: 'Health regeneration per second',
  },
  blockChance: {
    id: 'blockChance',
    name: 'Block Chance',
    category: 'defense',
    patterns: [
      'BlockChance',
    ],
    canonical: 'BlockChance',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to block attacks',
    regexPatterns: ['BlockChance', 'Block.*Chance'],
  },

  // ---------------------------------------------------------------------------
  // RESISTANCES
  // ---------------------------------------------------------------------------
  damageReduction: {
    id: 'damageReduction',
    name: 'Damage Reduction',
    category: 'resistances',
    patterns: [
      'DamageReduction%',
      'DamageReduction',
    ],
    canonical: 'DamageReduction%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to damage (<= 50%)',
  },

  // ---------------------------------------------------------------------------
  // ELEMENTAL
  // ---------------------------------------------------------------------------
  fireDamageBonus: {
    id: 'fireDamageBonus',
    name: 'Fire Damage',
    category: 'elemental',
    patterns: [
      'Fire%',
      'FireDamage',
    ],
    canonical: 'Fire%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Fire Damage%',
  },
  arcaneDamageBonus: {
    id: 'arcaneDamageBonus',
    name: 'Arcane Damage',
    category: 'elemental',
    patterns: [
      'Arcane%',
      'ArcaneDamage',
    ],
    canonical: 'Arcane%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Arcane Damage%',
  },
  lightningDamageBonus: {
    id: 'lightningDamageBonus',
    name: 'Lightning Damage',
    category: 'elemental',
    patterns: [
      'Lightning%',
      'LightningDamage',
    ],
    canonical: 'Lightning%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Lightning Damage%',
  },

  // ---------------------------------------------------------------------------
  // UTILITY / OTHER
  // ---------------------------------------------------------------------------
  xpBonus: {
    id: 'xpBonus',
    name: 'XP Bonus',
    category: 'utility',
    patterns: [
      'XPBonus',
    ],
    canonical: 'XPBonus',
    isPercent: true,
    format: v => `+${v.toFixed(1)}%`,
    description: 'XP Bonus',
    regexPatterns: ['XPBonus$'],
  },

  // ---------------------------------------------------------------------------
  // ABILITIES (display-only, not calculated in stat totals)
  // ---------------------------------------------------------------------------
  chainLightningDamage: {
    id: 'chainLightningDamage',
    name: 'Chain Lightning Damage',
    category: 'abilities',
    patterns: [
      'Abilities.ChainLightning.DamageMultiplier',
      'ChainLightning.DamageMultiplier',
      'ChainLightningDamage',
    ],
    canonical: 'ChainLightning.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Chain Lightning damage multiplier',
    displayOnly: true,
  },
  fieryTotemDamage: {
    id: 'fieryTotemDamage',
    name: 'Fiery Totem Damage',
    category: 'abilities',
    patterns: [
      'Abilities.FieryTotem.DamageMultiplier',
      'FieryTotem.DamageMultiplier',
      'Abilities.FieryTotem.Modifier.DamageBonus',
      'FieryTotem.Modifier.DamageBonus',
      'FieryTotemDamage',
    ],
    canonical: 'FieryTotem.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Fiery Totem damage multiplier',
    displayOnly: true,
  },
  dragonFlameDamage: {
    id: 'dragonFlameDamage',
    name: 'Dragon Flame Damage',
    category: 'abilities',
    patterns: [
      'Abilities.DragonFlame.DamageMultiplier',
      'DragonFlame.DamageMultiplier',
      'DragonFlame.DamageMulxtiplier', // Typo in game data
      'Abilities.DragonFlame.DamageMulxtiplier', // Typo in game data
      'DragonFlameDamage',
    ],
    canonical: 'DragonFlame.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Dragon Flame damage multiplier',
    displayOnly: true,
  },
  enemyDeathDamage: {
    id: 'enemyDeathDamage',
    name: 'Enemy Death Damage',
    category: 'abilities',
    patterns: [
      'Abilities.EnemyDeath.DamageMultiplier',
      'EnemyDeath.DamageMultiplier',
      'EnemyDeathDamage',
    ],
    canonical: 'EnemyDeath.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Enemy Death damage multiplier',
    displayOnly: true,
  },
};

// ============================================================================
// ADDITIONAL DISPLAY PATTERNS (for attributes not in stat calculations)
// ============================================================================

// These are display-only mappings for attributes that appear in tooltips
// but don't need to be tracked as stats
export const ADDITIONAL_DISPLAY_PATTERNS = {
  'CraftingSpecks': 'Crafting Specks',
  'Amount': 'Amount',
  'Charges': 'Charges',
  'ItemTier': 'Item Tier',
};

// ============================================================================
// GENERATED EXPORTS
// ============================================================================

/**
 * Convert registry patterns to regex patterns for matching
 * Escapes dots and handles special regex patterns
 */
function patternsToRegex(stat) {
  // If custom regex patterns are defined, use those
  if (stat.regexPatterns) {
    return stat.regexPatterns;
  }
  // Otherwise, escape dots in patterns for regex matching
  return stat.patterns.map(p => p.replace(/\./g, '\\.'));
}

/**
 * Generate stat definitions for useDerivedStats hook
 */
export function generateStatDefinitions() {
  return Object.values(STAT_REGISTRY)
    .filter(stat => !stat.displayOnly) // Exclude display-only stats
    .map(stat => ({
      id: stat.id,
      name: stat.name,
      category: stat.category,
      sources: patternsToRegex(stat),
      calculate: (sources) => sources.itemSum?.total || 0,
      format: stat.format,
      description: stat.description,
    }));
}

/**
 * Generate STAT_TYPES array for statBuckets (UI selection)
 */
export function generateStatTypes() {
  return Object.values(STAT_REGISTRY)
    .filter(stat => !stat.displayOnly) // Exclude display-only stats
    .map(stat => ({
      id: stat.id,
      name: stat.name,
      attributeName: stat.canonical,
      category: stat.category,
      defaultValue: 0,
      isPercent: stat.isPercent,
    }));
}

/**
 * Generate display name map for attributeDisplay
 */
export function generateDisplayMap() {
  const displayMap = {};

  // Add all patterns from registry
  for (const stat of Object.values(STAT_REGISTRY)) {
    for (const pattern of stat.patterns) {
      displayMap[pattern] = stat.name;
    }
  }

  // Add additional display patterns
  Object.assign(displayMap, ADDITIONAL_DISPLAY_PATTERNS);

  return displayMap;
}

/**
 * Get a stat definition by ID
 */
export function getStatById(id) {
  return STAT_REGISTRY[id] || null;
}

/**
 * Get stats by category
 */
export function getStatsByCategory(category) {
  return Object.values(STAT_REGISTRY).filter(s => s.category === category);
}

/**
 * Find which stat an attribute belongs to (for validation/debugging)
 */
export function findStatForAttribute(attributeName) {
  // Strip common prefixes
  const prefixes = [
    'EasyRPG.Attributes.Abilities.',
    'EasyRPG.Attributes.DamageSystem.',
    'EasyRPG.Attributes.Characteristics.',
    'EasyRPG.Attributes.Base.',
    'EasyRPG.Attributes.',
  ];

  let normalized = attributeName;
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length);
      break;
    }
  }

  // Check exact match first
  for (const stat of Object.values(STAT_REGISTRY)) {
    if (stat.patterns.includes(normalized)) {
      return stat;
    }
  }

  // Check regex patterns
  for (const stat of Object.values(STAT_REGISTRY)) {
    const regexPatterns = patternsToRegex(stat).map(p => new RegExp(p, 'i'));
    for (const regex of regexPatterns) {
      if (regex.test(normalized)) {
        return stat;
      }
    }
  }

  return null;
}

/**
 * Development helper: Log unknown attributes
 * Call this during development to identify attributes that need to be added
 */
export function warnUnknownAttribute(attributeName) {
  if (process.env.NODE_ENV === 'development') {
    const stat = findStatForAttribute(attributeName);
    if (!stat) {
      console.warn(`[StatRegistry] Unknown attribute: ${attributeName}`);
    }
  }
}

// Pre-generated exports for convenience
export const STAT_DEFINITIONS = generateStatDefinitions();
export const STAT_TYPES = generateStatTypes();
export const DISPLAY_MAP = generateDisplayMap();
