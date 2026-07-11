import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MonogramSetPanel } from '../src/components/items/MonogramSetPanel.jsx';

describe('MonogramSetPanel', () => {
  it('renders the current editable layout before a set is saved or selected', () => {
    const html = renderToStaticMarkup(React.createElement(MonogramSetPanel, {
      name: '',
      onNameChange: vi.fn(),
      savedSets: [],
      selectedSet: null,
      currentEntries: [{
        slotKey: 'head',
        itemRow: 'Armor_Head_A',
        itemName: 'Spirit Clutch',
        monogramSlots: ['Bloodlust.Base', null, null],
      }],
      onSelectSet: vi.fn(),
      onSetMonogramSlot: vi.fn(),
      onSave: vi.fn(),
      onApply: vi.fn(),
      onDelete: vi.fn(),
    }));

    expect(html).toContain('Spirit Clutch');
    expect(html).toContain('Spirit Clutch monogram 1');
    expect(html.match(/<select/g)).toHaveLength(4); // set picker + three positions
    expect(html).toContain('value="Bloodlust.Base" selected=""');
  });
});
