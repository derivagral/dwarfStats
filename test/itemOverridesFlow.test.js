/**
 * What-if override flow: edits made in the Items tab editor (stored in the
 * shared useItemOverrides instance, keyed by UNIQUE slot keys) must reach
 * useDerivedStats. Regression for "paragon isn't picking up flat phys/ele":
 * editor-added monograms used to be keyed by list position and never matched
 * the hook's slot lookup, so MeleeParagon.BaseDamage (+2 flat per mastery
 * level, both damage types) never fired.
 *
 * The hook is exercised for real via renderToString (no test renderer dep).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDerivedStats } from '../src/hooks/useDerivedStats.js';
import { extractEquippedItems, getUniqueSlotKeyMap } from '../src/utils/equipmentParser.js';
import { parseStanceContext } from '../src/utils/stanceSkills.js';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';

function probeHook(options) {
  let out;
  function Probe() { out = useDerivedStats(options); return null; }
  renderToString(React.createElement(Probe));
  return out;
}

let equippedItems;
let stanceContext;
let skillTree;

beforeAll(() => {
  const save = JSON.parse(fs.readFileSync(
    path.join(import.meta.dirname, 'fixtures', 'dr-full-inventory.json'), 'utf8'));
  equippedItems = extractEquippedItems(save);
  stanceContext = parseStanceContext(save, equippedItems);
  skillTree = extractSkillTree(save);
});

describe('unique slot keys', () => {
  it('assigns numbered keys matching the character panel layout', () => {
    const map = getUniqueSlotKeyMap(equippedItems);
    const keys = [...map.values()];
    expect(keys).toContain('head');
    expect(keys).toContain('ring1');
    expect(keys).toContain('ring2');
    expect(keys.filter(k => k.startsWith('offhand')).sort())
      .toEqual(['offhand1', 'offhand2', 'offhand3', 'offhand4']);
  });
});

describe('override monograms reach derived stats', () => {
  it('MeleeParagon.BaseDamage added on head feeds flat phys AND elem', () => {
    const withoutOverride = probeHook({ equippedItems, stanceContext, skillTree });
    const withOverride = probeHook({
      equippedItems,
      stanceContext,
      skillTree,
      itemOverrides: { head: { monograms: [{ id: 'MeleeParagon.BaseDamage', value: 1 }] } },
    });

    // Mastery 733 × 2 flat damage, both damage types
    const mastery = stanceContext.activeStance.mastery;
    expect(withOverride.values.paragonDamageBonus).toBe(mastery * 2);
    expect(withOverride.values.edpsPhysFlat - withoutOverride.values.edpsPhysFlat)
      .toBe(mastery * 2);
    expect(withOverride.values.edpsElemFlat - withoutOverride.values.edpsElemFlat)
      .toBe(mastery * 2);
  });

  it('override stat mods apply through unique slot keys', () => {
    const base = probeHook({ equippedItems, stanceContext, skillTree });
    const modded = probeHook({
      equippedItems,
      stanceContext,
      skillTree,
      itemOverrides: { offhand2: { mods: [{ statId: 'strength', value: 50 }] } },
    });
    expect((modded.values.strength || 0) - (base.values.strength || 0)).toBe(50);
  });
});

describe('racial bonuses through the hook', () => {
  it('Dwarf at level 741 contributes affinity + stance stats', () => {
    const withRace = probeHook({
      equippedItems, stanceContext, skillTree,
      characterRace: 2, characterLevel: 741,
    });
    const withoutRace = probeHook({ equippedItems, stanceContext, skillTree });

    // Racial Area affinity (10% + 25%) on top of tree-sourced Area nodes
    expect((withRace.baseStats.areaAffinityDamage || 0) - (withoutRace.baseStats.areaAffinityDamage || 0))
      .toBeCloseTo(0.35, 10);
    // Racial PoleArm/Mauls grants: L10 damage 10% + L150 stance multiplier 10%
    expect((withRace.baseStats.maulDamage || 0) - (withoutRace.baseStats.maulDamage || 0))
      .toBeCloseTo(0.2, 10);
    // Active affinities (Dragon/Orbit/Area from Electric Dragons) route the
    // racial Area damage into the elemental bucket automatically
    expect(withRace.values.edpsElemAdditive - withoutRace.values.edpsElemAdditive)
      .toBeCloseTo(0.35, 5);
  });
});
