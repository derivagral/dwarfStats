import { describe, expect, it } from 'vitest';
import {
  applyMonogramOverrideToItem,
  MONOGRAM_SLOT_COUNT,
  normalizeMonogramSlots,
  resolveEffectiveMonograms,
} from '../src/utils/monogramOverrides.js';

describe('monogram overrides', () => {
  const imported = [
    { id: 'Bloodlust.Base', value: 1 },
    { id: 'Shroud', value: 1 },
    { id: 'AllowPhasing', value: 1 },
  ];

  it('normalizes every item to three nullable positions', () => {
    expect(MONOGRAM_SLOT_COUNT).toBe(3);
    expect(normalizeMonogramSlots([{ id: 'Bloodlust.Base' }]))
      .toEqual(['Bloodlust.Base', null, null]);
  });

  it('uses imported monograms when no override exists', () => {
    expect(resolveEffectiveMonograms(imported, {})).toEqual([
      { id: 'Bloodlust.Base', value: 1, source: 'item' },
      { id: 'Shroud', value: 1, source: 'item' },
      { id: 'AllowPhasing', value: 1, source: 'item' },
    ]);
  });

  it('replaces positions instead of adding a fourth monogram', () => {
    const effective = resolveEffectiveMonograms(imported, {
      monogramSlots: ['Colossus.Base', 'Shroud', 'AllowPhasing'],
    });

    expect(effective).toHaveLength(3);
    expect(effective.map(monogram => monogram.id))
      .toEqual(['Colossus.Base', 'Shroud', 'AllowPhasing']);
    expect(effective.every(monogram => monogram.source === 'override')).toBe(true);
  });

  it('treats None as an explicit removal', () => {
    expect(resolveEffectiveMonograms(imported, {
      monogramSlots: ['Bloodlust.Base', null, null],
    }).map(monogram => monogram.id)).toEqual(['Bloodlust.Base']);
  });

  it('allows duplicate monograms in separate positions', () => {
    expect(resolveEffectiveMonograms(imported, {
      monogramSlots: ['Shroud', 'Shroud', 'Shroud'],
    }).map(monogram => monogram.id)).toEqual(['Shroud', 'Shroud', 'Shroud']);
  });

  it('ignores positions beyond the three-slot engine model', () => {
    expect(resolveEffectiveMonograms([], {
      monogramSlots: ['A', 'B', 'C', 'D'],
    }).map(monogram => monogram.id)).toEqual(['A', 'B', 'C']);
  });
});

describe('effective monogram item display', () => {
  const importedItem = {
    displayName: 'Spirit Clutch',
    monograms: [{ id: 'ElementForCritChance.Arcane', value: 7 }],
  };

  it('shows applied slots without mutating the imported save item', () => {
    const displayed = applyMonogramOverrideToItem(importedItem, {
      monogramSlots: ['MeleeParagon.BaseDamage', null, 'Shroud'],
    });

    expect(displayed.monograms.map(monogram => monogram.id))
      .toEqual(['MeleeParagon.BaseDamage', 'Shroud']);
    expect(displayed.monograms.every(monogram => monogram.source === 'override'))
      .toBe(true);
    expect(importedItem.monograms)
      .toEqual([{ id: 'ElementForCritChance.Arcane', value: 7 }]);
  });

  it('uses exactly the same effective values as the calculation engine', () => {
    const slotOverride = { monogramSlots: ['Bloodlust.Base', null, null] };
    expect(applyMonogramOverrideToItem(importedItem, slotOverride).monograms)
      .toEqual(resolveEffectiveMonograms(importedItem.monograms, slotOverride));
  });

  it('preserves the original item identity when there is no applied set', () => {
    expect(applyMonogramOverrideToItem(importedItem, {})).toBe(importedItem);
  });
});
