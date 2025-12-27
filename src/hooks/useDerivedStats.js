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
    description: 'Physical power affecting melee damage and carry capacity'
  },
  {
    id: 'dexterity',
    name: 'Dexterity',
    category: 'attributes',
    sources: ['Characteristics\\.Dexterity', 'Dexterity$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    description: 'Agility affecting attack speed and evasion'
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    category: 'attributes',
    sources: ['Characteristics\\.Wisdom', 'Wisdom$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    description: 'Mental acuity affecting spell power and mana'
  },
  {
    id: 'vitality',
    name: 'Vitality',
    category: 'attributes',
    sources: ['Characteristics\\.Vitality', 'Vitality$'],
    calculate: (sources) => sources.itemSum?.total || 0,
    description: 'Constitution affecting health and resistances'
  },

  // Offense Stats
  {
    id: 'physicalDamage',
    name: 'Physical Damage',
    category: 'offense',
    sources: ['PhysicalDamage', 'Physical.*Damage'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
    description: 'Bonus physical damage from all sources'
  },
  {
    id: 'mageryDamage',
    name: 'Magery Damage',
    category: 'offense',
    sources: ['MageryDamage', 'Magery.*Damage(?!%)'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(0)}`,
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
    description: 'Physical damage reduction'
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
    id: 'healthRegen',
    name: 'Health Regen',
    category: 'defense',
    sources: ['HealthRegen', 'Health.*Regen'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `+${v.toFixed(1)}/s`,
    description: 'Health regeneration per second'
  },
  {
    id: 'evasion',
    name: 'Evasion',
    category: 'defense',
    sources: ['Evasion', 'Dodge'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to evade attacks'
  },
  {
    id: 'blockChance',
    name: 'Block Chance',
    category: 'defense',
    sources: ['BlockChance', 'Block.*Chance'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    description: 'Chance to block attacks'
  },

  // Elemental Stats
  {
    id: 'fireResist',
    name: 'Fire Resistance',
    category: 'resistances',
    sources: ['FireResist', 'Fire.*Resist'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to fire damage'
  },
  {
    id: 'coldResist',
    name: 'Cold Resistance',
    category: 'resistances',
    sources: ['ColdResist', 'Cold.*Resist', 'IceResist'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to cold damage'
  },
  {
    id: 'lightningResist',
    name: 'Lightning Resistance',
    category: 'resistances',
    sources: ['LightningResist', 'Lightning.*Resist'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to lightning damage'
  },
  {
    id: 'poisonResist',
    name: 'Poison Resistance',
    category: 'resistances',
    sources: ['PoisonResist', 'Poison.*Resist'],
    calculate: (sources) => sources.itemSum?.total || 0,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    description: 'Resistance to poison damage'
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
      // Calculate sum from items
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
