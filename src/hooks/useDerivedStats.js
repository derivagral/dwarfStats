import { useMemo } from 'react';

/**
 * Stat definition structure:
 * {
 *   id: string,           // Unique identifier
 *   name: string,         // Display name
 *   category: string,     // Category grouping (e.g., 'offense', 'defense', 'attributes')
 *   calculate: (sources) => number,  // Calculation function
 *   format: (value) => string,       // Optional formatter
 *   sources: string[],    // Attribute patterns to sum/use
 *   description: string,  // Tooltip description
 * }
 */

// Helper to sum attribute values matching patterns from all items
function sumFromItems(items, patterns) {
  if (!items || !patterns || patterns.length === 0) return { total: 0, breakdown: [] };

  const breakdown = [];
  let total = 0;

  const regexPatterns = patterns.map(p =>
    typeof p === 'string' ? new RegExp(p, 'i') : p
  );

  for (const item of items) {
    if (!item?.attributes) continue;

    for (const attr of item.attributes) {
      for (const pattern of regexPatterns) {
        if (pattern.test(attr.name)) {
          const value = typeof attr.value === 'number' ? attr.value : parseFloat(attr.value) || 0;
          total += value;
          breakdown.push({
            source: item.name || item.itemRow || 'Unknown Item',
            slot: item.slot || 'unknown',
            attribute: attr.name,
            value: value
          });
          break; // Only match once per attribute
        }
      }
    }
  }

  return { total, breakdown };
}

// Helper to get a single value from save data by path
function getFromSave(saveData, path) {
  if (!saveData || !path) return { value: 0, found: false };

  const parts = path.split('.');
  let current = saveData;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return { value: 0, found: false };
    }
    current = current[part];
  }

  const value = typeof current === 'number' ? current : parseFloat(current) || 0;
  return { value, found: current !== undefined };
}

// Default stat definitions with placeholder calculations
const defaultStatDefinitions = [
  // Primary Attributes
  {
    id: 'strength',
    name: 'Strength',
    category: 'attributes',
    sources: ['Characteristics\\.Strength', 'Strength$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Strength'
  },
  {
    id: 'strengthBonus',
    name: 'Strength Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Strength%', 'Strength%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Strength  Bonus'
  },
  {
    id: 'dexterity',
    name: 'Dexterity',
    category: 'attributes',
    sources: ['Characteristics\\.Dexterity', 'Dexterity$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Dexterity'
  },
  {
    id: 'dexterityBonus',
    name: 'Dexterity Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Dexterity%', 'Dexterity%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Dexterity Bonus'
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    category: 'attributes',
    sources: ['Characteristics\\.Wisdom', 'Wisdom$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Wisdom'
  },
  {
    id: 'wisdomBonus',
    name: 'Wisdom Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Wisdom%', 'Wisdom%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Wisdom Bonus'
  },
  {
    id: 'luck',
    name: 'Luck',
    category: 'attributes',
    sources: ['Characteristics\\.Luck', 'Luck$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Luck'
  },
  {
    id: 'luckBonus',
    name: 'Luck Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Luck%', 'Luck%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Luck Bonus'
  },
  {
    id: 'agility',
    name: 'Agility',
    category: 'attributes',
    sources: ['Characteristics\\.Agility', 'Agility$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Agility'
  },
  {
    id: 'agilityBonus',
    name: 'Agility Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Agility%', 'Agility%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Agility Bonus'
  },
  {
    id: 'endurance',
    name: 'Endurance',
    category: 'attributes',
    sources: ['Characteristics\\.Endurance', 'Endurance$', 'Characteristics\\.Intelligence', 'Intelligence$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Endurance'
  },
  {
    id: 'enduranceBonus',
    name: 'Endurance Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Endurance%', 'Endurance%', 'Characteristics\\.Intelligence%', 'Intelligence%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Endurance Bonus'
  },
  {
    id: 'stamina',
    name: 'Stamina',
    category: 'attributes',
    sources: ['Characteristics\\.Stamina', 'Stamina$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Stamina'
  },
  {
    id: 'staminaBonus',
    name: 'Stamina Bonus',
    category: 'attributes',
    sources: ['Characteristics\\.Stamina%', 'Stamina%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Stamina Bonus'
  },

  // Offense Stats
  {
    id: 'damage',
    name: 'Damage',
    category: 'offense',
    sources: ['Damage$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Base damage'
  },
  {
    id: 'damageBonus',
    name: 'Damage Bonus',
    category: 'offense',
    sources: ['Damage%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Damage Bonus'
  },
  {
    id: 'mageryDamage',
    name: 'Magery Damage',
    category: 'offense',
    sources: ['MageryDamage', 'Magery.*Damage(?!%)'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}%`,
    description: 'Bonus magical damage from all sources'
  },
  {
    id: 'critChance',
    name: 'Critical Chance',
    category: 'offense',
    sources: ['CriticalChance', 'CritChance'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to deal critical strikes'
  },
  {
    id: 'critDamage',
    name: 'Critical Damage',
    category: 'offense',
    sources: ['CriticalDamage%', 'MageryCriticalDamage%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${(v * 100).toFixed(0)}%`,
    description: 'Bonus damage on critical strikes'
  },
  {
    id: 'attackSpeed',
    name: 'Attack Speed',
    category: 'offense',
    sources: ['AttackSpeed', 'Attack.*Speed'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${(v * 100).toFixed(0)}%`,
    description: 'Increased attack speed'
  },


  // Defense Stats
  {
    id: 'armor',
    name: 'Armor',
    category: 'defense',
    sources: ['Armor$', '\\.Armor$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => v.toFixed(0),
    description: 'Armor'
  },
  {
    id: 'armorBonus',
    name: 'Armor Bonus',
    category: 'defense',
    sources: ['Armor%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Armor damage reduction bonus'
  },
  {
    id: 'health',
    name: 'Health',
    category: 'defense',
    sources: ['MaxHealth', 'Health$', '\\.Health$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Maximum health points'
  },
  {
    id: 'healthBonus',
    name: 'Health Bonus',
    category: 'defense',
    sources: ['Health%', '\\.Health%', 'Life%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Maximum health points'
  },
  {
    id: 'healthRegen',
    name: 'Health Regen',
    category: 'defense',
    sources: ['HealthRegeneration'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(1)}/s`,
    description: 'Health regeneration per second'
  },
  {
    id: 'xpBonus',
    name: 'XP Bonus',
    category: 'defense',
    sources: ['XPBonus$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(1)}%`,
    description: 'XP Bonus'
  },

  // Resist Stats
  {
    id: 'damageReduction',
    name: 'Damage Reduction',
    category: 'resistances',
    sources: ['DamageReduction%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to damage (<= 50%)'
  },
  // Elemental Stats
  {
    id: 'fireDamageBonus',
    name: 'Fire Damage',
    category: 'elemental',
    sources: ['Fire%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Fire Damage%'
  },
    {
    id: 'arcaneDamageBonus',
    name: 'Arcane Damage',
    category: 'elemental',
    sources: ['Arcane%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Arcane Damage%'
  },
    {
    id: 'lightningDamageBonus',
    name: 'Lightning Damage',
    category: 'elemental',
    sources: ['Lightning%'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Lightning Damage%'
  },
];

/**
 * Hook to derive stats from character data
 * @param {Object} characterData - The character data including equipped items
 * @param {Array} customDefinitions - Optional custom stat definitions to use instead of defaults
 * @returns {Object} - { stats, categories, getStat, getCategory }
 */
export function useDerivedStats(characterData, customDefinitions = null) {
  const definitions = customDefinitions || defaultStatDefinitions;

  const derivedStats = useMemo(() => {
    if (!characterData) {
      return { stats: [], categories: {}, byId: {} };
    }

    const items = characterData.equippedItems || [];
    const saveData = characterData.raw || {};

    const stats = definitions.map(def => {
      // Calculate sum from items (includes any modified item stats)
      const itemSum = sumFromItems(items, def.sources);

      // Get any direct save data values
      const saveValues = {};
      if (def.savePaths) {
        for (const [key, path] of Object.entries(def.savePaths)) {
          saveValues[key] = getFromSave(saveData, path);
        }
      }

      // Build sources object for calculation
      const sources = {
        itemSum,
        saveValues,
        items,
        saveData
      };

      // Calculate final value
      const rawValue = def.calculate(sources);
      const formattedValue = def.format ? def.format(rawValue) : rawValue.toString();

      return {
        id: def.id,
        name: def.name,
        category: def.category,
        value: rawValue,
        formattedValue,
        breakdown: itemSum.breakdown,
        description: def.description,
        sources: def.sources
      };
    });

    // Group by category
    const categories = {};
    for (const stat of stats) {
      if (!categories[stat.category]) {
        categories[stat.category] = [];
      }
      categories[stat.category].push(stat);
    }

    // Index by id
    const byId = {};
    for (const stat of stats) {
      byId[stat.id] = stat;
    }

    return { stats, categories, byId };
  }, [characterData, definitions]);

  const getStat = (id) => derivedStats.byId[id] || null;
  const getCategory = (category) => derivedStats.categories[category] || [];

  return {
    stats: derivedStats.stats,
    categories: derivedStats.categories,
    getStat,
    getCategory
  };
}

export { defaultStatDefinitions, sumFromItems, getFromSave };
