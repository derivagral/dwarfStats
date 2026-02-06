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
      'Characteristics.Strength%6',
      'Characteristics.Strength%',
      'Strength%6',
      'Strength%',
    ],
    canonical: 'Characteristics.Strength%6',
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
      'Characteristics.Dexterity%6',
      'Characteristics.Dexterity%',
      'Dexterity%6',
      'Dexterity%',
    ],
    canonical: 'Characteristics.Dexterity%6',
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
      'Characteristics.Wisdom%6',
      'Characteristics.Wisdom%',
      'Wisdom%6',
      'Wisdom%',
    ],
    canonical: 'Characteristics.Wisdom%6',
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
      'Characteristics.Luck%6',
      'Characteristics.Luck%',
      'Luck%6',
      'Luck%',
    ],
    canonical: 'Characteristics.Luck%6',
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
      'Characteristics.Agility%6',
      'Characteristics.Agility%',
      'Agility%6',
      'Agility%',
    ],
    canonical: 'Characteristics.Agility%6',
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
      'Characteristics.Intelligence%6',
      'Characteristics.Intelligence%',
      'Characteristics.Endurance%6',
      'Characteristics.Endurance%',
      'Intelligence%6',
      'Intelligence%',
      'Endurance%6',
      'Endurance%',
    ],
    canonical: 'Characteristics.Intelligence%6',
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
      'Characteristics.Stamina%6',
      'Characteristics.Stamina%',
      'Stamina%6',
      'Stamina%',
    ],
    canonical: 'Characteristics.Stamina%6',
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
      'Characteristics.Vitality%6',
      'Characteristics.Vitality%',
      'Vitality%6',
      'Vitality%',
    ],
    canonical: 'Characteristics.Vitality%6',
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
      'Base.Damage%6',
      'Damage%6',
      'Damage%',
    ],
    canonical: 'Base.Damage%6',
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
      'Damage.Boss%6',
      'Boss%6',
      'Boss%',
    ],
    canonical: 'Damage.Boss%6',
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
      'Damage.Magery.Damage%6',
      'Magery.Damage%6',
      'MageryDamage%6',
      'MageryDamage',
      'MageryDamage%',
      'Magery.Damage',
    ],
    canonical: 'Damage.Magery.Damage%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Bonus magical damage from all sources',
  },
  mageryCritDamage: {
    id: 'mageryCritDamage',
    name: 'Magery Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.Magery.CriticalDamage%6',
      'Magery.CriticalDamage%6',
      'MageryCriticalDamage%6',
      'MageryCriticalDamage%',
      'MageryCritDamage',
    ],
    canonical: 'Damage.Magery.CriticalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Magery critical damage bonus',
  },
  mageryCritChance: {
    id: 'mageryCritChance',
    name: 'Magery Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.Magery.CriticalChance%6',
      'Magery.CriticalChance%6',
      'MageryCriticalChance%6',
      'MageryCriticalChance%',
      'MageryCritChance',
    ],
    canonical: 'Damage.Magery.CriticalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Magery critical chance bonus',
  },

  maulDamage: {
    id: 'maulDamage',
    name: 'Maul Damage',
    category: 'stance',
    patterns: [
      'Damage.Mauls.Damage%',
      'Mauls.Damage%',
      'MaulsDamage%',
      'MaulDamage',
      'Mauls.Damage',
      'PoleArm%',
    ],
    canonical: 'Damage.Mauls.Damage%',
    isPercent: false,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Maul damage bonus',
  },
  maulCritDamage: {
    id: 'maulCritDamage',
    name: 'Maul Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.Mauls.CriticalDamage%',
      'Mauls.CriticalDamage%',
      'MaulsCriticalDamage%',
      'MaulCritDamage',
      'Damage.PoleArmCriticalDamage%6',  // PoleArm = Maul in game data
      'PoleArmCriticalDamage%6',
      'PoleArmCriticalDamage%',
      'PoleArmCritcalDamage%6',  // Game typo: "Critcal" not "Critical"
    ],
    canonical: 'Damage.Mauls.CriticalDamage%',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Maul critical damage bonus',
  },
  maulCritChance: {
    id: 'maulCritChance',
    name: 'Maul Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.Mauls.CriticalChance%',
      'Mauls.CriticalChance%',
      'MaulsCriticalChance%',
      'MaulCritChance',
      'Damage.PoleArmCriticalChance%6',  // PoleArm = Maul in game data
      'PoleArmCriticalChance%6',
      'PoleArmCriticalChance%',
      'PoleArmCritcalChance%6',  // Game typo: "Critcal" not "Critical"
    ],
    canonical: 'Damage.Mauls.CriticalChance%',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Maul critical chance bonus',
  },

  archeryDamage: {
    id: 'archeryDamage',
    name: 'Archery Damage',
    category: 'stance',
    patterns: [
      'Damage.Archery.Damage%6',
      'Archery.Damage%6',
      'ArcheryDamage%6',
      'ArcheryDamage%',
      'ArcheryDamage',
      'Archery.Damage',
    ],
    canonical: 'Damage.Archery.Damage%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Archery damage bonus',
  },
  archeryCritDamage: {
    id: 'archeryCritDamage',
    name: 'Archery Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.Archery.CriticalDamage%6',
      'Archery.CriticalDamage%6',
      'ArcheryCriticalDamage%6',
      'ArcheryCriticalDamage%',
      'ArcheryCritDamage',
    ],
    canonical: 'Damage.Archery.CriticalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Archery critical damage bonus',
  },
  archeryCritChance: {
    id: 'archeryCritChance',
    name: 'Archery Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.Archery.CriticalChance%6',
      'Archery.CriticalChance%6',
      'ArcheryCriticalChance%6',
      'ArcheryCriticalChance%',
      'ArcheryCritChance',
    ],
    canonical: 'Damage.Archery.CriticalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Archery critical chance bonus',
  },

  unarmedDamage: {
    id: 'unarmedDamage',
    name: 'Fists Damage',
    category: 'stance',
    patterns: [
      'Damage.Fists.Damage%6',
      'Fists.Damage%6',
      'FistsDamage%6',
      'UnarmedDamage%',
      'UnarmedDamage',
      'Unarmed.Damage',
    ],
    canonical: 'Damage.Fists.Damage%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Fists/Unarmed damage bonus',
  },
  unarmedCritDamage: {
    id: 'unarmedCritDamage',
    name: 'Fists Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.Fists.CriticalDamage%6',
      'Fists.CriticalDamage%6',
      'FistsCriticalDamage%6',
      'UnarmedCriticalDamage%',
      'UnarmedCritDamage',
    ],
    canonical: 'Damage.Fists.CriticalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Fists/Unarmed critical damage bonus',
  },
  unarmedCritChance: {
    id: 'unarmedCritChance',
    name: 'Fists Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.Fists.CriticalChance%6',
      'Fists.CriticalChance%6',
      'FistsCriticalChance%6',
      'UnarmedCriticalChance%',
      'UnarmedCritChance',
    ],
    canonical: 'Damage.Fists.CriticalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Fists/Unarmed critical chance bonus',
  },

  swordDamage: {
    id: 'swordDamage',
    name: 'One-Handed Damage',
    category: 'stance',
    patterns: [
      'Damage.OneHanded%6',
      'OneHanded%6',
      'SwordDamage%6',
      'SwordDamage%',
      'SwordDamage',
      'Sword.Damage',
      'Damage.OneHanded',
      'OneHanded',
    ],
    canonical: 'Damage.OneHanded%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Sword/One-Handed damage bonus',
  },
  swordCritDamage: {
    id: 'swordCritDamage',
    name: 'One-Handed Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.OneHandCritcalDamage%6',  // Game typo: "Critcal" not "Critical"
      'Damage.OneHandedCriticalDamage%6',
      'OneHandCritcalDamage%6',
      'OneHandedCriticalDamage%6',
      'SwordCriticalDamage%',
      'SwordCritDamage',
      'Damage.OneHandedCriticalDamage',
      'OneHandedCriticalDamage',
    ],
    canonical: 'Damage.OneHandCritcalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Sword critical damage bonus',
  },
  swordCritChance: {
    id: 'swordCritChance',
    name: 'One-Handed Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.OneHandedCritcalChance%6',  // Game typo: "Critcal" not "Critical"
      'Damage.OneHandedCriticalChance%6',
      'OneHandedCritcalChance%6',
      'OneHandedCriticalChance%6',
      'SwordCriticalChance%',
      'SwordCritChance',
      'Damage.OneHandedCriticalChance',
      'OneHandedCriticalChance',
    ],
    canonical: 'Damage.OneHandedCritcalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Sword critical chance bonus',
  },

  spearDamage: {
    id: 'spearDamage',
    name: 'Polearm Damage',
    category: 'stance',
    patterns: [
      'Damage.PoleArm%6',
      'PoleArm%6',
      'SpearDamage%6',
      'SpearDamage%',
      'SpearDamage',
      'Spear.Damage',
      'Damage.PoleArmDamage',
      'PoleArmDamage',
    ],
    canonical: 'Damage.PoleArm%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Spear/Polearm damage bonus',
  },
  spearCritDamage: {
    id: 'spearCritDamage',
    name: 'Polearm Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.PoleArmCriticalDamage%6',
      'Damage.SpearCritcalDamage%6',  // Game typo: "Critcal" not "Critical"
      'PoleArmCriticalDamage%6',
      'SpearCritcalDamage%6',
      'SpearCriticalDamage%',
      'SpearCritDamage',
      'PoleArmCriticalDamage',
    ],
    canonical: 'Damage.PoleArmCriticalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Spear critical damage bonus',
  },
  spearCritChance: {
    id: 'spearCritChance',
    name: 'Polearm Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.PoleArmCriticalChance%6',
      'Damage.SpearCritcalChance%6',  // Game typo: "Critcal" not "Critical"
      'PoleArmCriticalChance%6',
      'SpearCritcalChance%6',
      'PoleArmCritcalChance',  // Legacy typo
      'SpearCriticalChance%',
      'SpearCritChance',
      'PoleArmCriticalChance',
    ],
    canonical: 'Damage.PoleArmCriticalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Spear critical chance bonus',
  },

  scytheDamage: {
    id: 'scytheDamage',
    name: 'Scythe Damage',
    category: 'stance',
    patterns: [
      'Damage.Scythe.Damage%6',
      'Scythe.Damage%6',
      'ScytheDamage%6',
      'ScythesDamage%',
      'ScythesDamage',
      'Scythes.Damage',
    ],
    canonical: 'Damage.Scythe.Damage%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Scythe damage bonus',
  },
  scytheCritDamage: {
    id: 'scytheCritDamage',
    name: 'Scythe Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.Scythe.CriticalDamage%6',
      'Scythe.CriticalDamage%6',
      'ScytheCriticalDamage%6',
      'ScythesCriticalDamage%',
      'ScythesCritDamage',
    ],
    canonical: 'Damage.Scythe.CriticalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Scythe critical damage bonus',
  },
  scytheCritChance: {
    id: 'scytheCritChance',
    name: 'Scythe Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.Scythe.CriticalChance%6',
      'Scythe.CriticalChance%6',
      'ScytheCriticalChance%6',
      'ScythesCriticalChance%',
      'ScythesCritChance',
    ],
    canonical: 'Damage.Scythe.CriticalChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Scythe critical chance bonus',
  },

  twohandDamage: {
    id: 'twohandDamage',
    name: 'Two-Handed Damage',
    category: 'stance',
    patterns: [
      'Damage.TwoHanded%6',
      'TwoHanded%6',
      'TwoHandedDamage%6',
      'TwoHandedDamage',
      'Damage.TwoHandedDamage',
    ],
    canonical: 'Damage.TwoHanded%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Two-Handed/Axes damage bonus',
  },
  twohandCritDamage: {
    id: 'twohandCritDamage',
    name: 'Two-Handed Critical Damage',
    category: 'stance',
    patterns: [
      'Damage.TwoHandCritcalDamage%6',  // Game typo: "Critcal" not "Critical"
      'Damage.TwoHandedCriticalDamage%6',
      'TwoHandCritcalDamage%6',
      'TwoHandedCriticalDamage%6',
      'TwoHandedCritDamage',
      'TwoHandedCriticalDamage',
    ],
    canonical: 'Damage.TwoHandCritcalDamage%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Two-Handed critical damage bonus',
  },
  twohandCritChance: {
    id: 'twohandCritChance',
    name: 'Two-Handed Critical Chance',
    category: 'stance',
    patterns: [
      'Damage.TwoHandCritcalChance%6',  // Game typo: "Critcal" not "Critical"
      'Damage.TwoHandedCriticalChance%6',
      'TwoHandCritcalChance%6',
      'TwoHandedCriticalChance%6',
      'TwoHandedCriticalChance',
      'TwoHandedCritChance',
    ],
    canonical: 'Damage.TwoHandCritcalChance%6',
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
      'Base.Armor%6',
      'Armor%6',
      'Armor%',
    ],
    canonical: 'Base.Armor%6',
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
      'Health%6',
      'Health%',
      'Life%6',
      'Life%',
    ],
    canonical: 'Health%6',
    isPercent: true,
    format: v => `+${v.toFixed(0)}%`,
    description: 'Maximum health bonus',
    regexPatterns: ['Health%6', 'Health%', '\\.Health%6', '\\.Health%', 'Life%6', 'Life%'],
  },
  healthRegen: {
    id: 'healthRegen',
    name: 'Health Regen',
    category: 'defense',
    patterns: [
      'Base.HealthRegeneration',
      'HealthRegeneration',
      'HealthRegen',
    ],
    canonical: 'Base.HealthRegeneration',
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
  // ENERGY
  // ---------------------------------------------------------------------------
  maxEnergy: {
    id: 'maxEnergy',
    name: 'Max Energy',
    category: 'defense',
    patterns: [
      'Base.MaxEnergy',
      'MaxEnergy',
    ],
    canonical: 'Base.MaxEnergy',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Maximum energy points',
  },
  energyRegen: {
    id: 'energyRegen',
    name: 'Energy Regen',
    category: 'defense',
    patterns: [
      'Base.EnergyRegeneration',
      'EnergyRegeneration',
      'EnergyRegen',
    ],
    canonical: 'Base.EnergyRegeneration',
    isPercent: false,
    format: v => `+${v.toFixed(1)}/s`,
    description: 'Energy regeneration per second',
  },

  // ---------------------------------------------------------------------------
  // LIFESTEAL
  // ---------------------------------------------------------------------------
  lifeSteal: {
    id: 'lifeSteal',
    name: 'Life Steal',
    category: 'offense',
    patterns: [
      'Damage.LifeSteal',
      'LifeSteal',
    ],
    canonical: 'Damage.LifeSteal',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Life stolen on hit',
    regexPatterns: ['LifeSteal$', '\\.LifeSteal$'],
  },
  lifeStealBonus: {
    id: 'lifeStealBonus',
    name: 'Life Steal Bonus',
    category: 'offense',
    patterns: [
      'Damage.LifeSteal%6',
      'LifeSteal%6',
      'LifeSteal%',
    ],
    canonical: 'Damage.LifeSteal%6',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Life steal percentage bonus',
  },
  lifeStealChance: {
    id: 'lifeStealChance',
    name: 'Life Steal Chance',
    category: 'offense',
    patterns: [
      'Damage.LifeStealChance%6',
      'LifeStealChance%6',
      'LifeStealChance%',
      'LifeStealChance',
    ],
    canonical: 'Damage.LifeStealChance%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to proc life steal',
  },

  // ---------------------------------------------------------------------------
  // RESISTANCES
  // ---------------------------------------------------------------------------
  damageReduction: {
    id: 'damageReduction',
    name: 'Damage Reduction',
    category: 'resistances',
    patterns: [
      'Base.DamageReduction%6',
      'DamageReduction%6',
      'DamageReduction%',
      'DamageReduction',
    ],
    canonical: 'Base.DamageReduction%6',
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
      'Damage.Fire%6',
      'Fire%6',
      'Fire%',
      'FireDamage',
    ],
    canonical: 'Damage.Fire%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Fire Damage%',
  },
  arcaneDamageBonus: {
    id: 'arcaneDamageBonus',
    name: 'Arcane Damage',
    category: 'elemental',
    patterns: [
      'Damage.Arcane%6',
      'Arcane%6',
      'Arcane%',
      'ArcaneDamage',
    ],
    canonical: 'Damage.Arcane%6',
    isPercent: true,
    format: v => `${(v * 100).toFixed(1)}%`,
    description: 'Arcane Damage%',
  },
  lightningDamageBonus: {
    id: 'lightningDamageBonus',
    name: 'Lightning Damage',
    category: 'elemental',
    patterns: [
      'Damage.Lightning%6',
      'Lightning%6',
      'Lightning%',
      'LightningDamage',
    ],
    canonical: 'Damage.Lightning%6',
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
      'Base.XPBonus',
      'XPBonus',
    ],
    canonical: 'Base.XPBonus',
    isPercent: true,
    format: v => `+${v.toFixed(1)}%`,
    description: 'XP Bonus',
    regexPatterns: ['XPBonus$', '\\.XPBonus$'],
  },
  globalLoot: {
    id: 'globalLoot',
    name: 'Global Loot',
    category: 'utility',
    patterns: [
      'GlobalModifiers.GlobalLoot',
      'GlobalLoot',
    ],
    canonical: 'GlobalModifiers.GlobalLoot',
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Increased loot drop chance',
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
  fireOrbDamage: {
    id: 'fireOrbDamage',
    name: 'Fire Orb Damage',
    category: 'abilities',
    patterns: [
      'Abilities.FireAtom.DamageMultiplier',  // FireAtom = Fire Orb in game
      'FireAtom.DamageMultiplier',
      'FireAtomDamage',
      'FireOrbDamage',
    ],
    canonical: 'FireAtom.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Fire Orb damage multiplier',
    displayOnly: true,
  },
  electricDragonsDamage: {
    id: 'electricDragonsDamage',
    name: 'Electric Dragons Damage',
    category: 'abilities',
    patterns: [
      'Abilities.ElectricDragons.DamageMultiplier',
      'ElectricDragons.DamageMultiplier',
      'ElectricDragonsDamage',
    ],
    canonical: 'ElectricDragons.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Electric Dragons damage multiplier',
    displayOnly: true,
  },
  burningShieldDamage: {
    id: 'burningShieldDamage',
    name: 'Burning Shield Damage',
    category: 'abilities',
    patterns: [
      'Abilities.BurningShield.DamageMultiplier',
      'BurningShield.DamageMultiplier',
      'BurningShieldDamage',
    ],
    canonical: 'BurningShield.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Burning Shield damage multiplier',
    displayOnly: true,
  },
  starBladesDamage: {
    id: 'starBladesDamage',
    name: 'Star Blades Damage',
    category: 'abilities',
    patterns: [
      'Abilities.StarBlades.DamageMultiplier',
      'StarBlades.DamageMultiplier',
      'StarBladesDamage',
    ],
    canonical: 'StarBlades.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Star Blades damage multiplier',
    displayOnly: true,
  },
  fireballDamage: {
    id: 'fireballDamage',
    name: 'Fireball Damage',
    category: 'abilities',
    patterns: [
      'Abilities.Fireball.DamageMultiplier',
      'Fireball.DamageMultiplier',
      'FireballDamage',
    ],
    canonical: 'Fireball.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Fireball damage multiplier',
    displayOnly: true,
  },
  lightningBallDamage: {
    id: 'lightningBallDamage',
    name: 'Lightning Ball Damage',
    category: 'abilities',
    patterns: [
      'Abilities.LightningBall.DamageMultiplier',
      'LightningBall.DamageMultiplier',
      'LightningBallDamage',
    ],
    canonical: 'LightningBall.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Lightning Ball damage multiplier',
    displayOnly: true,
  },
  arcaneOrbDamage: {
    id: 'arcaneOrbDamage',
    name: 'Arcane Orb Damage',
    category: 'abilities',
    patterns: [
      'Abilities.ArcaneOrb.DamageMultiplier',
      'ArcaneOrb.DamageMultiplier',
      'ArcaneOrbDamage',
    ],
    canonical: 'ArcaneOrb.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Arcane Orb damage multiplier',
    displayOnly: true,
  },
  meteorDamage: {
    id: 'meteorDamage',
    name: 'Meteor Damage',
    category: 'abilities',
    patterns: [
      'Abilities.Meteor.DamageMultiplier',
      'Meteor.DamageMultiplier',
      'MeteorDamage',
    ],
    canonical: 'Meteor.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Meteor damage multiplier',
    displayOnly: true,
  },
  dashDamage: {
    id: 'dashDamage',
    name: 'Dash Damage',
    category: 'abilities',
    patterns: [
      'Abilities.Dash.DamageMultiplier',
      'Dash.DamageMultiplier',
      'DashDamage',
    ],
    canonical: 'Dash.DamageMultiplier',
    isPercent: false,
    format: v => `x${v.toFixed(2)}`,
    description: 'Dash damage multiplier',
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
