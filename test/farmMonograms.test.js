import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { summarizeFarmMonograms, createMonogramSet } from '../src/models/MonogramSet.js';
import { MonogramSetPanel } from '../src/components/items/MonogramSetPanel.jsx';
import { useDerivedStats } from '../src/hooks/useDerivedStats.js';

const elite = 'ChanceToSpawnAnotherElite';
const container = 'ChanceToSpawnContainer';
function itemsFor(elites, containers) {
  const ids = [...Array(elites).fill(elite), ...Array(containers).fill(container)];
  return ['head', 'neck', 'pants', 'bracer', 'boots', 'relic'].map((slot, i) => ({
    slot, rowName: `${slot}_test`, monograms: ids.slice(i * 3, i * 3 + 3).map(id => ({ id, value: 1 })),
  }));
}
function valuesFor(equippedItems) {
  let result;
  function Probe() { result = useDerivedStats({ equippedItems }); return null; }
  renderToString(React.createElement(Probe));
  return result.values;
}

describe('farm-set copy budgets', () => {
  it.each([[0, 0], [3, 7], [4, 10], [5, 11]])('matches the engine at %i elite and %i container copies', (elites, containers) => {
    const items = itemsFor(elites, containers);
    const entries = createMonogramSet('Farm', items).entries;
    const summary = summarizeFarmMonograms(entries);
    const values = valuesFor(items);
    for (const [index, copies, cap] of [[0, elites, 4], [1, containers, 10]]) {
      expect(summary[index]).toMatchObject({ copies, maxCopies: cap,
        chance: Math.min(copies, cap) * 10,
        excessCopies: Math.max(0, copies - cap), remainingCopies: Math.max(0, cap - copies) });
      expect(summary[index].chance).toBe(values[summary[index].derivedStatId]);
    }
  });

  it('counts edited positions and exposes capped/excess copies in the set editor', () => {
    const items = itemsFor(5, 10);
    const currentEntries = createMonogramSet('Farm', items).entries;
    const html = renderToString(React.createElement(MonogramSetPanel, { name: 'Farm', savedSets: [],
      currentEntries, onNameChange: () => {} })).replace(/<!--.*?-->/g, '');
    expect(html).toContain('5/4 copies · 40% chance');
    expect(html).toContain('1 excess — no added chance');
    expect(html).toContain('10/10 copies · 100% chance');
    const edited = createMonogramSet('Farm', items, { head: { monogramSlots: [elite, null, container] } });
    expect(summarizeFarmMonograms(edited.entries).map(e => e.copies)).toEqual([3, 11]);
  });
});
