// Attribute display mapping - transforms technical save data attribute names
// into user-friendly display names for tooltips and UI

// Map of full attribute paths (or partial matches) to display names
const ATTRIBUTE_DISPLAY_MAP = {
  // Base damage
  'Damage': 'Damage',
  'Base.Damage': 'Base Damage',

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

  // Ability-specific attributes
  'ChainLightningDamage': 'Chain Lightning Damage',
  'FieryTotemDamage': 'Fiery Totem Damage',
  'FieryTotem.DamageMultiplier': 'Fiery Totem Damage x',
  'FieryTotem.Modifier.DamageBonus': 'Fiery Totem Damage Bonus',
  'DragonFlameDamage': 'Dragon Flame Damage',
  'EnemyDeathDamage': 'Enemy Death Damage',

  // Other
  'CraftingSpecks': 'Crafting Specks',
  'Amount': 'Amount',
  'Charges': 'Charges',
  'ItemTier': 'Item Tier',
};

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

// Transform an attribute name for display
export function getDisplayName(attributeName) {
  if (!attributeName) return 'Unknown';

  // First try exact match on the full attribute name
  if (ATTRIBUTE_DISPLAY_MAP[attributeName]) {
    return ATTRIBUTE_DISPLAY_MAP[attributeName];
  }

  // Try to find a partial match by checking if the attribute ends with a known pattern
  for (const [pattern, displayName] of Object.entries(ATTRIBUTE_DISPLAY_MAP)) {
    if (attributeName.endsWith(pattern)) {
      return displayName;
    }
  }

  // Try to find a partial match by checking if the attribute contains the pattern
  for (const [pattern, displayName] of Object.entries(ATTRIBUTE_DISPLAY_MAP)) {
    if (attributeName.includes(pattern)) {
      return displayName;
    }
  }

  // Fallback: extract a reasonable name from the path
  return extractFallbackName(attributeName);
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
