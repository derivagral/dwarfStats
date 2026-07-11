export const MONOGRAM_SLOT_COUNT = 3;

/**
 * Normalize strings or parsed monogram entries into the engine-only
 * three-position shape used by item overrides and future named sets.
 *
 * @param {Array<string|{id?: string}|null>} monograms
 * @returns {Array<string|null>}
 */
export function normalizeMonogramSlots(monograms = []) {
  return Array.from({ length: MONOGRAM_SLOT_COUNT }, (_, index) => {
    const monogram = monograms[index];
    if (typeof monogram === 'string') return monogram || null;
    return monogram?.id || null;
  });
}

/**
 * Resolve the exact monograms used by calculations.
 * An explicit monogramSlots array replaces imported values position-for-position;
 * an absent array preserves the imported item.
 *
 * @param {Array<string|{id?: string, value?: number}|null>} importedMonograms
 * @param {{monogramSlots?: Array<string|null>}} slotOverride
 * @returns {Array<{id: string, value: number, source: 'item'|'override'}>}
 */
export function resolveEffectiveMonograms(importedMonograms = [], slotOverride = {}) {
  const hasOverride = Array.isArray(slotOverride.monogramSlots);
  const slots = hasOverride
    ? normalizeMonogramSlots(slotOverride.monogramSlots)
    : normalizeMonogramSlots(importedMonograms);

  return slots.flatMap((id, index) => {
    if (!id) return [];
    const imported = importedMonograms[index];
    return [{
      id,
      value: !hasOverride && typeof imported === 'object' ? (imported.value ?? 1) : 1,
      source: hasOverride ? 'override' : 'item',
    }];
  });
}

/**
 * Return an item model suitable for what-if UI surfaces. The imported item is
 * left untouched; an explicit three-slot override replaces only the displayed
 * monograms.
 *
 * @param {Object} item
 * @param {{monogramSlots?: Array<string|null>}} slotOverride
 * @returns {Object}
 */
export function applyMonogramOverrideToItem(item, slotOverride = {}) {
  if (!item || !Array.isArray(slotOverride.monogramSlots)) return item;

  const importedMonograms = item.monograms || item.model?.monograms || [];
  return {
    ...item,
    monograms: resolveEffectiveMonograms(importedMonograms, slotOverride),
  };
}
