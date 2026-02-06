/**
 * Affix List for Item Filtering
 *
 * Provides a structured list of item affixes derived from the stat registry.
 * Used to build filter UI where users can select desired affixes instead of
 * writing regex patterns.
 *
 * @module utils/affixList
 */

import { STAT_REGISTRY, getStatsByCategory } from './statRegistry.js';

/**
 * Affix categories for UI grouping
 */
export const AFFIX_CATEGORIES = {
  attributes: {
    id: 'attributes',
    name: 'Attributes',
    description: 'Primary character attributes',
  },
  offense: {
    id: 'offense',
    name: 'Offense',
    description: 'Damage, crit, and attack stats',
  },
  stance: {
    id: 'stance',
    name: 'Weapon/Stance',
    description: 'Weapon-specific damage bonuses',
  },
  defense: {
    id: 'defense',
    name: 'Defense',
    description: 'Armor, health, and resistances',
  },
  elemental: {
    id: 'elemental',
    name: 'Elemental',
    description: 'Fire, Arcane, Lightning damage',
  },
  abilities: {
    id: 'abilities',
    name: 'Abilities',
    description: 'Skill-specific multipliers',
  },
  utility: {
    id: 'utility',
    name: 'Utility',
    description: 'XP, loot, and other bonuses',
  },
};

/**
 * Build the affix list from the stat registry
 * @returns {Array<{id: string, name: string, category: string, patterns: string[]}>}
 */
export function buildAffixList() {
  const affixes = [];

  for (const [id, stat] of Object.entries(STAT_REGISTRY)) {
    affixes.push({
      id: stat.id,
      name: stat.name,
      category: stat.category,
      patterns: stat.patterns || [],
      description: stat.description || '',
      isPercent: stat.isPercent || false,
    });
  }

  // Sort by category then name
  affixes.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  return affixes;
}

/**
 * Get affixes grouped by category
 * @returns {Object<string, Array>}
 */
export function getAffixesByCategory() {
  const affixes = buildAffixList();
  const grouped = {};

  for (const affix of affixes) {
    if (!grouped[affix.category]) {
      grouped[affix.category] = [];
    }
    grouped[affix.category].push(affix);
  }

  return grouped;
}

/**
 * Convert selected affix IDs to filter patterns
 * These patterns can be used with filterInventoryItems
 *
 * @param {string[]} affixIds - Array of affix IDs to include
 * @returns {string[]} Array of regex pattern strings
 */
export function affixIdsToPatterns(affixIds) {
  const patterns = [];

  for (const affixId of affixIds) {
    const stat = STAT_REGISTRY[affixId];
    if (!stat) continue;

    // Use the first pattern (most specific) or canonical form
    if (stat.patterns && stat.patterns.length > 0) {
      // Convert to regex pattern - escape dots, allow variations
      const basePattern = stat.patterns[0];
      // Replace dots with regex pattern, escape special chars
      const regex = basePattern
        .replace(/\./g, '\\.')
        .replace(/%6/g, '%6?')  // Match with or without %6
        .replace(/%$/g, '%6?'); // Match trailing % with or without 6
      patterns.push(regex);
    }
  }

  return patterns;
}

/**
 * Convert selected affixes to a filter string (comma-separated patterns)
 * Compatible with existing FilterTab pattern input
 *
 * Uses the most specific pattern from the stat registry to avoid
 * over-matching (e.g., "Fire Damage" shouldn't match "FireAtomDamage").
 *
 * @param {string[]} affixIds - Array of affix IDs
 * @returns {string} Comma-separated pattern string
 */
export function affixIdsToFilterString(affixIds) {
  const patterns = [];

  for (const affixId of affixIds) {
    const stat = STAT_REGISTRY[affixId];
    if (!stat) continue;

    // Use registry patterns which are more specific than display names
    // Prefer patterns with dots (e.g., "Damage.Element.Fire") as they're most specific
    // Fall back to canonical form or first pattern with word boundary
    if (stat.patterns && stat.patterns.length > 0) {
      // Find the most specific pattern (one with dots, or longest)
      const dottedPattern = stat.patterns.find(p => p.includes('.'));
      if (dottedPattern) {
        // Escape dots for regex and use as-is (dots make it specific)
        patterns.push(dottedPattern.replace(/\./g, '\\.'));
      } else {
        // No dotted pattern - use word boundary to prevent partial matches
        // e.g., "FireDamage" should not match "FireAtomDamage"
        const basePattern = stat.canonical || stat.patterns[0];
        patterns.push(`\\b${basePattern}\\b`);
      }
    } else {
      // Fallback: use name with word boundaries
      patterns.push(`\\b${stat.name.replace(/\s+/g, '.*')}\\b`);
    }
  }

  return patterns.join(', ');
}

/**
 * Search affixes by name (for autocomplete/search)
 *
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Array} Matching affixes
 */
export function searchAffixes(query, limit = 10) {
  if (!query || query.trim() === '') {
    return buildAffixList().slice(0, limit);
  }

  const queryLower = query.toLowerCase();
  const affixes = buildAffixList();

  // Score each affix by relevance
  const scored = affixes.map(affix => {
    const nameLower = affix.name.toLowerCase();
    let score = 0;

    // Exact match
    if (nameLower === queryLower) score += 100;
    // Starts with query
    else if (nameLower.startsWith(queryLower)) score += 50;
    // Contains query
    else if (nameLower.includes(queryLower)) score += 25;
    // Pattern contains query
    else if (affix.patterns.some(p => p.toLowerCase().includes(queryLower))) score += 10;

    return { affix, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.affix);
}

/**
 * Get popular/common affixes for quick selection
 * @returns {Array}
 */
export function getPopularAffixes() {
  const popularIds = [
    'strength', 'wisdom', 'vitality', 'dexterity',
    'critChance', 'critDamage', 'damageBonus',
    'lifeSteal', 'lifeStealBonus',
    'fireDamageBonus', 'arcaneDamageBonus', 'lightningDamageBonus',
    'health', 'healthBonus', 'armor',
  ];

  return popularIds
    .map(id => STAT_REGISTRY[id])
    .filter(Boolean)
    .map(stat => ({
      id: stat.id,
      name: stat.name,
      category: stat.category,
    }));
}

/**
 * Get stance/weapon-specific affixes
 * @returns {Array}
 */
export function getStanceAffixes() {
  return getStatsByCategory('stance').map(stat => ({
    id: stat.id,
    name: stat.name,
    category: stat.category,
    description: stat.description,
  }));
}

// Pre-built affix list for convenience
export const AFFIX_LIST = buildAffixList();
export const AFFIXES_BY_CATEGORY = getAffixesByCategory();
export const POPULAR_AFFIXES = getPopularAffixes();

export default AFFIX_LIST;
