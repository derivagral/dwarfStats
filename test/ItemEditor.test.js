import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getMonogramSlot, ItemEditor } from '../src/components/character/ItemEditor.jsx';

describe('ItemEditor monogram slot resolution', () => {
  it('uses the authoritative equipment key for generic generated item types', () => {
    expect(getMonogramSlot(
      'Armor Mythic',
      'Armor_Mythic_Plate_Helmet',
      'head'
    )).toBe('head');
  });

  it('still reads the row when a nonempty generic type is present', () => {
    expect(getMonogramSlot(
      'Armor Mythic',
      'Armor_Mythic_Plate_Helmet'
    )).toBe('head');
  });

  it('renders three editable fields for the Spirit Clutch fixture shape', () => {
    const html = renderToStaticMarkup(React.createElement(ItemEditor, {
      item: {
        name: 'Spirit Clutch',
        itemType: 'Armor Mythic',
        itemRow: 'Armor_Mythic_Plate_Helmet',
      },
      slotKey: 'head',
      slotOverrides: {},
      currentMonograms: [{ id: 'ElementForCritChance.Arcane' }],
      onSetMonogramSlot: vi.fn(),
      onClearSlot: vi.fn(),
      onClose: vi.fn(),
    }));

    expect(html.match(/<select/g)).toHaveLength(3);
    expect(html).not.toContain('does not use a monogram recipe pool');
  });
});
