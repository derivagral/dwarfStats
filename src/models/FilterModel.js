/**
 * Filter Model for DwarfStats
 *
 * Structured filter definitions that replace raw regex patterns.
 * Designed for serialization (localStorage, URL sharing).
 *
 * @module models/FilterModel
 */

/**
 * @typedef {Object} AffixCriterion
 * @property {string} affixId - References STAT_REGISTRY key
 */

/**
 * @typedef {Object} MonogramCriterion
 * @property {string} monogramId - References MONOGRAM_REGISTRY key
 * @property {number|null} minCount - Minimum instances of this specific monogram (null = at least 1)
 */

/**
 * @typedef {Object} FilterOptions
 * @property {number} minHitsPerPool - Minimum matching affixes per pool for a "hit" (default 1)
 * @property {number} closeMinTotal - Minimum total hits across pools for "near miss" (default 2)
 * @property {boolean} includeWeapons - Include weapon-type items in results (default true)
 * @property {number|null} minTotalMonograms - Minimum total monograms on item regardless of type (null = no constraint)
 */

/**
 * @typedef {Object} FilterModel
 * @property {string} id - Unique identifier
 * @property {string} name - User-given display name
 * @property {AffixCriterion[]} affixes - Stat affix criteria
 * @property {MonogramCriterion[]} monograms - Monogram criteria
 * @property {FilterOptions} options - Scoring thresholds
 */

let _nextId = 1;

/**
 * Create a new empty filter model
 * @param {string} [name='Untitled Filter'] - Display name
 * @returns {FilterModel}
 */
export function createFilterModel(name = 'Untitled Filter') {
  return {
    id: `filter-${Date.now()}-${_nextId++}`,
    name,
    affixes: [],
    monograms: [],
    options: {
      minHitsPerPool: 1,
      closeMinTotal: 2,
      includeWeapons: true,
      minTotalMonograms: null,
    },
  };
}

/**
 * Add an affix criterion to a filter model (immutable)
 * @param {FilterModel} model
 * @param {string} affixId - STAT_REGISTRY key
 * @returns {FilterModel} New model with affix added
 */
export function addAffix(model, affixId) {
  if (model.affixes.some(a => a.affixId === affixId)) return model;
  return {
    ...model,
    affixes: [...model.affixes, { affixId }],
  };
}

/**
 * Remove an affix criterion from a filter model (immutable)
 * @param {FilterModel} model
 * @param {string} affixId
 * @returns {FilterModel}
 */
export function removeAffix(model, affixId) {
  return {
    ...model,
    affixes: model.affixes.filter(a => a.affixId !== affixId),
  };
}

/**
 * Add a monogram criterion to a filter model (immutable)
 * @param {FilterModel} model
 * @param {string} monogramId - MONOGRAM_REGISTRY key
 * @param {number|null} [minCount=null] - Minimum instances (null = at least 1)
 * @returns {FilterModel}
 */
export function addMonogram(model, monogramId, minCount = null) {
  if (model.monograms.some(m => m.monogramId === monogramId)) return model;
  return {
    ...model,
    monograms: [...model.monograms, { monogramId, minCount }],
  };
}

/**
 * Update the minCount for an existing monogram criterion (immutable)
 * @param {FilterModel} model
 * @param {string} monogramId
 * @param {number|null} minCount
 * @returns {FilterModel}
 */
export function updateMonogramCount(model, monogramId, minCount) {
  return {
    ...model,
    monograms: model.monograms.map(m =>
      m.monogramId === monogramId ? { ...m, minCount } : m
    ),
  };
}

/**
 * Remove a monogram criterion from a filter model (immutable)
 * @param {FilterModel} model
 * @param {string} monogramId
 * @returns {FilterModel}
 */
export function removeMonogram(model, monogramId) {
  return {
    ...model,
    monograms: model.monograms.filter(m => m.monogramId !== monogramId),
  };
}

/**
 * Update filter options (immutable)
 * @param {FilterModel} model
 * @param {Partial<FilterOptions>} optionUpdates
 * @returns {FilterModel}
 */
export function updateOptions(model, optionUpdates) {
  return {
    ...model,
    options: { ...model.options, ...optionUpdates },
  };
}

/**
 * Check if a filter model has any criteria defined
 * @param {FilterModel} model
 * @returns {boolean}
 */
export function hasAnyCriteria(model) {
  return model.affixes.length > 0 || model.monograms.length > 0;
}

/**
 * Serialize a filter model to JSON string
 * @param {FilterModel} model
 * @returns {string}
 */
export function serializeFilter(model) {
  return JSON.stringify(model);
}

/**
 * Deserialize a filter model from JSON string
 * @param {string} json
 * @returns {FilterModel|null}
 */
export function deserializeFilter(json) {
  try {
    const parsed = JSON.parse(json);
    // Validate required fields
    if (!parsed.id || !Array.isArray(parsed.affixes) || !Array.isArray(parsed.monograms)) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name || 'Imported Filter',
      affixes: parsed.affixes,
      monograms: parsed.monograms.map(m => ({
        monogramId: m.monogramId,
        minCount: m.minCount ?? null,
      })),
      options: {
        minHitsPerPool: parsed.options?.minHitsPerPool ?? 1,
        closeMinTotal: parsed.options?.closeMinTotal ?? 2,
        includeWeapons: parsed.options?.includeWeapons ?? true,
        minTotalMonograms: parsed.options?.minTotalMonograms ?? null,
      },
    };
  } catch {
    return null;
  }
}
