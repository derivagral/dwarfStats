// Attribute display mapping - transforms technical save data attribute names
// into user-friendly display names for tooltips and UI

// Map of attribute path patterns to display names
// Patterns can be:
// - Full paths: "FieryTotem.DamageMultiplier"
// - Single segments: "Wisdom%"
// - The matcher will try to match against the tail of the full path
const ATTRIBUTE_DISPLAY_MAP = {
  // Weapon-specific damage types
  'Magery.Damage': 'Magery Damage',
  'MageryDamage%': 'Magery Damage %',
  'Damage.Magery.CriticalDamage%': 'Magery Critical Damage %',
  'MageryCriticalDamage%': 'Magery Crit Damage %',
  'MageryCriticalChance%': 'Magery Crit Chance %',

  'Mauls.Damage': 'Mauls Damage',
  'MaulsDamage%': 'Mauls Damage %',
  'Damage.Mauls.CriticalDamage%': 'Mauls Critical Damage %',
  'MaulsCriticalDamage%': 'Mauls Crit Damage %',
  'MaulsCriticalChance%': 'Mauls Crit Chance %',

  'Archery.Damage': 'Archery Damage',
  'ArcheryDamage%': 'Archery Damage %',
  'Damage.Archery.CriticalDamage%': 'Archery Critical Damage %',
  'ArcheryCriticalDamage%': 'Archery Crit Damage %',
  'ArcheryCriticalChance%': 'Archery Crit Chance %',

  'Unarmed.Damage': 'Unarmed Damage',
  'UnarmedDamage%': 'Unarmed Damage %',
  'Damage.Unarmed.CriticalDamage%': 'Unarmed Critical Damage %',
  'UnarmedCriticalDamage%': 'Unarmed Crit Damage %',
  'UnarmedCriticalChance%': 'Unarmed Crit Chance %',

  'Sword.Damage': 'Sword Damage',
  'SwordDamage%': 'Sword Damage %',
  'Damage.Sword.CriticalDamage%': 'Sword Critical Damage %',
  'SwordCriticalDamage%': 'Sword Crit Damage %',
  'SwordCriticalChance%': 'Sword Crit Chance %',

  'Spear.Damage': 'Spear Damage',
  'SpearDamage%': 'Spear Damage %',
  'Damage.Spear.CriticalDamage%': 'Spear Critical Damage %',
  'SpearCriticalDamage%': 'Spear Crit Damage %',
  'SpearCriticalChance%': 'Spear Crit Chance %',

  'Scythes.Damage': 'Scythes Damage',
  'ScythesDamage%': 'Scythes Damage %',
  'Damage.Scythes.CriticalDamage%': 'Scythes Critical Damage %',
  'ScythesCriticalDamage%': 'Scythes Crit Damage %',
  'ScythesCriticalChance%': 'Scythes Crit Chance %',

  'Melee.Damage': 'Melee Damage',
  'MeleeDamage%': 'Melee Damage %',
  'Damage.Melee.CriticalDamage%': 'Melee Crit Damage %',
  'MeleeCriticalDamage%': 'Melee Crit Damage %',
  'MeleeCriticalChance%': 'Melee Crit Chance %',

  'Ranged.Damage': 'Ranged Damage',
  'RangedDamage%': 'Ranged Damage %',
  'Damage.Ranged.CriticalDamage%': 'Ranged Crit Damage %',
  'RangedCriticalDamage%': 'Ranged Crit Damage %',
  'RangedCriticalChance%': 'Ranged Crit Chance %',

  // Generic critical stats
  'CriticalDamage': 'Critical Damage %',
  'CriticalDamage%': 'Critical Damage %',
  'CriticalChance%': 'Critical Chance %',

  // Characteristics/Stats
  'Characteristics.Strength': 'Strength',
  'Characteristics.Strength%': 'Strength %',
  'Characteristics.Dexterity': 'Dexterity',
  'Characteristics.Dexterity%': 'Dexterity %',
  'Characteristics.Wisdom': 'Wisdom',
  'Characteristics.Wisdom%': 'Wisdom %',
  'Characteristics.Vitality': 'Vitality',
  'Characteristics.Vitality%': 'Vitality %',
  'Strength': 'Strength',
  'Strength%': 'Strength %',
  'Dexterity': 'Dexterity',
  'Dexterity%': 'Dexterity %',
  'Wisdom': 'Wisdom',
  'Wisdom%': 'Wisdom %',
  'Luck': 'Luck',
  'Luck%': 'Luck %',
  'Agility': 'Agility',
  'Agility%': 'Agility %',
  'Stamina': 'Stamina',
  'Stamina%': 'Stamina %',
  'Endurance': 'Endurance',
  'Endurance%': 'Endurance %',

  // Defensive stats
  'armor': 'Armor',
  'Armor': 'Armor',
  'Health': 'Health',
  'Health%': 'Health %',
  'MaxHealth': 'Max Health',

  // Ability-specific attributes (multi-segment paths)
  'Abilities.ChainLightning.DamageMultiplier': 'Chain Lightning Damage x',
  'ChainLightning.DamageMultiplier': 'Chain Lightning Damage x',
  'ChainLightningDamage': 'Chain Lightning Damage',

  'Abilities.FieryTotem.DamageMultiplier': 'Fiery Totem Damage x',
  'FieryTotem.DamageMultiplier': 'Fiery Totem Damage x',
  'Abilities.FieryTotem.Modifier.DamageBonus': 'Fiery Totem Damage Bonus',
  'FieryTotem.Modifier.DamageBonus': 'Fiery Totem Damage Bonus',
  'FieryTotemDamage': 'Fiery Totem Damage',

  'Abilities.DragonFlame.DamageMultiplier': 'Dragon Flame Damage x',
  'DragonFlame.DamageMultiplier': 'Dragon Flame Damage x',
  'DragonFlame.DamageMulxtiplier': 'Dragon Flame Damage x', // Handle typo in game data
  'Abilities.DragonFlame.DamageMulxtiplier': 'Dragon Flame Damage x', // Handle typo in game data
  'DragonFlameDamage': 'Dragon Flame Damage',

  'Abilities.EnemyDeath.DamageMultiplier': 'Enemy Death Damage x',
  'EnemyDeath.DamageMultiplier': 'Enemy Death Damage x',
  'EnemyDeathDamage': 'Enemy Death Damage',

  // Other
  'CraftingSpecks': 'Crafting Specks',
  'Amount': 'Amount',
  'Charges': 'Charges',
  'ItemTier': 'Item Tier',
};

// Pre-compute sorted patterns (longest first for better matching)
const SORTED_PATTERNS = Object.keys(ATTRIBUTE_DISPLAY_MAP).sort((a, b) => b.length - a.length);

// Extract the most relevant part of an attribute name for fallback display
function extractFallbackName(fullName) {
  if (!fullName) return 'Unknown';

  const parts = fullName.split('.');

  // If it's a deep path like "EasyRPG.Attributes.DamageSystem.Damage.Magery.CriticalDamage%"
  // We want to grab the meaningful parts toward the end
  if (parts.length > 3) {
    // Take the last 2-3 parts and join them
    const relevantParts = parts.slice(-2);
    return relevantParts.join(' ');
  }

  // Otherwise just return the last part
  return parts[parts.length - 1];
}

// Extract the meaningful tail of an attribute path
// E.g., "EasyRPG.Attributes.Abilities.DragonFlame.DamageMultiplier" -> "DragonFlame.DamageMultiplier"
function extractAttributeTail(fullName) {
  if (!fullName) return fullName;

  // Remove common prefixes
  const prefixesToStrip = [
    'EasyRPG.Attributes.Abilities.',
    'EasyRPG.Attributes.DamageSystem.',
    'EasyRPG.Attributes.Characteristics.',
    'EasyRPG.Attributes.Base.',
    'EasyRPG.Attributes.',
  ];

  for (const prefix of prefixesToStrip) {
    if (fullName.startsWith(prefix)) {
      return fullName.substring(prefix.length);
    }
  }

  return fullName;
}

// Transform an attribute name for display
export function getDisplayName(attributeName) {
  if (!attributeName) return 'Unknown';

  // First try exact match on the full attribute name
  if (ATTRIBUTE_DISPLAY_MAP[attributeName]) {
    return ATTRIBUTE_DISPLAY_MAP[attributeName];
  }

  // Extract the meaningful tail (strip common prefixes)
  const tail = extractAttributeTail(attributeName);

  // Try exact match on the tail
  if (tail !== attributeName && ATTRIBUTE_DISPLAY_MAP[tail]) {
    return ATTRIBUTE_DISPLAY_MAP[tail];
  }

  // Try matching patterns in order from longest to shortest (more specific first)
  // This ensures "DragonFlame.DamageMultiplier" matches before "DamageMultiplier"
  for (const pattern of SORTED_PATTERNS) {
    // Check if tail ends with the pattern (for multi-segment matches)
    if (tail.endsWith(pattern)) {
      return ATTRIBUTE_DISPLAY_MAP[pattern];
    }
  }

  // Try contains matching as last resort (case-sensitive)
  for (const pattern of SORTED_PATTERNS) {
    if (tail.includes(pattern)) {
      return ATTRIBUTE_DISPLAY_MAP[pattern];
    }
  }

  // Fallback: extract a reasonable name from the path
  return extractFallbackName(tail);
}

// Format an attribute value for display
export function formatAttributeValue(value, attributeName = '') {
  if (value === null || value === undefined) return '';

  // If it's a percentage attribute, format with 1 decimal place
  if (attributeName.includes('%') || attributeName.includes('Percent')) {
    if (typeof value === 'number') {
      // If value is between 0-1, treat as fraction and convert to percentage
      if (value > 0 && value < 1) {
        return `${(value * 100).toFixed(1)}%`;
      }
      // Otherwise it's already a percentage value
      return `${value.toFixed(1)}%`;
    }
  }

  // For regular numeric values
  if (typeof value === 'number') {
    // If it's a whole number, don't show decimals
    if (Number.isInteger(value)) {
      return value.toString();
    }
    // Otherwise show 1 decimal place
    return value.toFixed(1);
  }

  return String(value);
}

// Transform an attribute object for display (convenience function)
export function transformAttribute(attr) {
  return {
    ...attr,
    displayName: getDisplayName(attr.name),
    displayValue: formatAttributeValue(attr.value, attr.name),
  };
}
