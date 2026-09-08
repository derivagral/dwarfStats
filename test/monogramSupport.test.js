import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDerivedStats } from '../src/hooks/useDerivedStats.js';
import { StatsPanel, filterStatRows } from '../src/components/character/StatsPanel.jsx';
import { MONOGRAM_BASE_EFFECTS } from '../src/utils/monogramConfigs.js';
import { getMonogramCoverage } from '../src/utils/monogramSupport.js';
import { STAT_REGISTRY } from '../src/utils/statRegistry.js';
import { createMonogramSet, matchMonogramSet } from '../src/models/MonogramSet.js';
import { createCharacterSharePayload, itemShareToItem, allocatedAttributesShareToData } from '../src/models/CharacterShareModel.js';
import { encodeCharacterShareCompressed, decodeCharacterShareAny } from '../src/utils/shareUrl.js';
import generated from '../src/data/monograms.generated.json';

function probe(options) {
  let result;
  function Probe() { result = useDerivedStats(options); return null; }
  renderToStaticMarkup(React.createElement(Probe));
  return result;
}
// Tooltip positioning needs a browser layout; this test checks rendered rows.
vi.mock('../src/components/character/StatTooltip.jsx', () => ({ StatTooltip: () => null }));

const item = (slot, ids = [], baseStats = []) => ({ slot, rowName: `${slot}_test`, baseStats,
  monograms: ids.map(id => ({ id, value: 1 })) });
const activeRows = result => filterStatRows(result.categories.monograms, 'monograms');

describe('monogram stat-sheet visibility', () => {
  it('hides absent effects and nonzero placeholders, independently of hide-zero', () => {
    const result = probe({ characterStats: { strength: 1000 } });
    expect(result.values.monogramValueFromStrength).toBeGreaterThan(0);
    expect(activeRows(result)).toHaveLength(0);
    expect(filterStatRows(result.categories.monograms, 'monograms', { activeEffectsOnly: false })).toEqual(result.categories.monograms);
  });

  it('retains a granted conversion at zero until hide-zero is selected', () => {
    const result = probe({ equippedItems: [item('ring', ['BonusCritDamage%ForEssence'])] });
    expect(activeRows(result).map(row => row.id)).toContain('critDamageFromEssence');
    expect(filterStatRows(result.categories.monograms, 'monograms', { hideZero: true })).toHaveLength(0);
  });

  it('keeps mastery and tree grants visible after equipment grants are removed', () => {
    const options = {
      equippedItems: [item('head', ['Bloodlust.Base', 'MeleeParagon.BaseDamage'])],
      stanceContext: { activeStance: { id: 'spear', name: 'Spear', monogramFamily: 'melee',
        mastery: 10, keystoneUnlocked: true, keystoneMonogramId: 'Bloodlust.Base' } },
      skillTree: { mainTree: [{ rowName: 'UI_SkillTreeNode_Large_103', level: 1, category: 'main' }] },
    };
    const edited = probe({ ...options, itemOverrides: { head: { monogramSlots: [null, null, null] } } });
    expect(activeRows(edited).map(row => row.id)).toEqual(expect.arrayContaining(['bloodlustStacks', 'bloodlustArmorBonus', 'bloodlustCritDamageBonus', 'paragonDamageBonus']));
    expect(edited.values.paragonDamageBonus).toBe(20);
    expect(edited.values.bloodlustStacks).toBe(100);
  });

  it('hides removed effects and the suppressed distance option', () => {
    const options = { equippedItems: [item('neck', ['DarkEssence', 'DistanceProcsDamage', 'DistanceProcsDamage_Near'])] };
    const base = activeRows(probe(options)).map(row => row.id);
    expect(base).toContain('essence');
    expect(base).toContain('distanceProcsNearDamageBonus');
    expect(base).not.toContain('distanceProcsDamageBonus');
    expect(activeRows(probe({ ...options, itemOverrides: { neck: { monogramSlots: [null, null, null] } } }))).toHaveLength(0);
  });

  it('renders cooldowns ahead of monograms and handles the empty state', () => {
    const html = renderToStaticMarkup(React.createElement(StatsPanel, { characterData: {
      equippedItems: [item('head', ['Bloodlust.Base']), item('offhand', [], [
        { rawTag: 'EasyRPG.Attributes.Abilities.ElectricDragons.DamageMultiplier', value: 1 },
      ])],
    } }));
    expect(html).toContain('Active effects only');
    expect(html.indexOf('Offhand Cooldown')).toBeLessThan(html.indexOf('Bloodlust Stacks'));
    expect(html).not.toContain('Monogram Value (STR)');
    expect(renderToStaticMarkup(React.createElement(StatsPanel, { characterData: null }))).toContain('Load a character');
  });
});

describe('reviewed basic item monograms', () => {
  it('applies flat and percentage contributions before totals and crit/energy chains', () => {
    const result = probe({ characterStats: { health: 1000, armor: 1000 }, equippedItems: [
      item('ring', ['ExtraStrength', 'ExtraStrength', 'ExtraStrength']),
      item('boots', ['BootsExtraEnergy3', 'BootsExtraEnergyRegen4', 'BootsExtraEnergyRegen4']),
      item('head', ['ExtraEnergyAddDamage', 'CritChanceForEnergyRegen']),
      item('pants', ['ExtraHp', 'ExtraHp%', 'ExtraArmor']),
    ] });
    expect(result.values.totalStrength).toBe(600);
    expect(result.values.totalMaxEnergy).toBe(120);
    expect(result.values.totalEnergyRegen).toBe(16);
    expect(result.values.totalCritChance).toBeCloseTo(0.16);
    expect(result.values.energyDamageBonus).toBe(60);
    expect(result.values.edpsElemFlat).toBe(60);
    expect(result.values.totalHealth).toBeCloseTo(1210);
    expect(result.values.totalArmor).toBeCloseTo(1700); // +60% Strength, +10% mono
    expect(result.categories.attributes.find(row => row.id === 'totalStrength').sources
      .filter(source => source.monogramId === 'ExtraStrength')).toHaveLength(3);
  });

  it('handles items without base affixes and resets named-set overrides without mutating imports', () => {
    const equippedItems = [{ slot: 'ring', rowName: 'ring_test', monograms: [{ id: 'ExtraEnergy', value: 1 }] }];
    const original = JSON.stringify(equippedItems);
    const saved = createMonogramSet('Energy', equippedItems, { ring1: { monogramSlots: ['ExtraEnergy', 'ExtraEnergy', 'ExtraEnergy'] } });
    const matched = matchMonogramSet(saved, equippedItems);
    const itemOverrides = Object.fromEntries(Object.entries(matched.monogramSlotsByEquipment)
      .map(([slot, monogramSlots]) => [slot, { monogramSlots }]));
    expect(probe({ equippedItems, itemOverrides }).values.totalMaxEnergy).toBe(145);
    expect(probe({ equippedItems }).values.totalMaxEnergy).toBe(115);
    expect(JSON.stringify(equippedItems)).toBe(original);
  });

  it('recalculates contributions exactly once through compressed shares', async () => {
    const equippedItems = [item('ring', ['ExtraStrength', 'ExtraEnergy', 'ExtraHp%']),
      item('head', ['DarkEssence', 'ExtraEnergyAddDamage', 'BonusCritDamage%ForEssence'])];
    const characterStats = { strength: 1000, health: 1000 };
    const before = probe({ equippedItems, characterStats });
    const payload = createCharacterSharePayload(equippedItems, null, characterStats);
    const decoded = await decodeCharacterShareAny(await encodeCharacterShareCompressed(payload));
    const after = probe({ equippedItems: decoded.e.map(itemShareToItem), characterStats: allocatedAttributesShareToData(decoded.at) });
    expect(after.values).toEqual(before.values);
    expect(after.values.totalStrength).toBe(1200);
    expect(after.values.essence).toBe(1500);
  });

  it('keeps the reviewed table aligned with game exports and valid stat targets', () => {
    for (const [id, effects] of Object.entries(MONOGRAM_BASE_EFFECTS)) {
      expect(generated.monograms[id], id).toBeDefined();
      for (const effect of effects) {
        expect(STAT_REGISTRY[effect.statId], id).toBeDefined();
        if (generated.monograms[id].effects.length) {
          expect(generated.monograms[id].effects.map(row => row.value)).toContain(effect.value);
        } else {
          expect(generated.monograms[id].description).toContain('200');
        }
      }
    }
  });

  it('distinguishes connected bonuses, known gaps, and unimplemented effects', () => {
    expect(getMonogramCoverage('ExtraEnergy').status).toBe('on-hit');
    expect(getMonogramCoverage('ChanceToSpawnAnotherElite').status).toBe('stats-only');
    expect(getMonogramCoverage('DamageCircle.DamageForStats.Highest').status).toBe('partial');
    expect(getMonogramCoverage('ChanceToSpawnArcaneEagle').status).toBe('not-modeled');
    expect(getMonogramCoverage('FutureUnknownMonogram').status).toBe('not-modeled');
  });
});
