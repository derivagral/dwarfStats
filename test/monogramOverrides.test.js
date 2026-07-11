import { describe, expect, it } from 'vitest';
import {
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
