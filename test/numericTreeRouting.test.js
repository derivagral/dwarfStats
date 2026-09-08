import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDerivedStats, resolveStatId } from '../src/hooks/useDerivedStats.js';
import { calculateDerivedStats } from '../src/utils/derivedStats.js';
import { aggregateSkillEffects } from '../src/utils/skillEffectAggregator.js';
import { createSkillTreeShare, skillTreeShareToData, itemShareToItem, createCharacterSharePayload } from '../src/models/CharacterShareModel.js';

function probe(options) {
  let result;
  function Probe() { result = useDerivedStats(options); return null; }
  renderToString(React.createElement(Probe));
  return result;
}
// Synthetic build, using node definitions in the committed game export.
const skillTree = { mainTree: [
  { rowName: 'UI_SkillTreeNode_Small_917', level: 1 }, // +2 Luck
  { rowName: 'UI_SkillTreeNode_Small_919', level: 1 }, // +1% Luck
] };
const equippedItems = [{ slot: 'fossil', rowName: 'Equipment_Dwarven_Heart', baseStats: [
  { rawTag: 'EasyRPG.Attributes.Base.Damage%', value: 2 },
  { rawTag: 'EasyRPG.Attributes.Base.ElementalDamage%', value: 3 },
], monograms: [] }];

describe('numeric tree grants and physical/elemental routing', () => {
  it('retains fractional attributes in dependent calculations', () => {
    const values = calculateDerivedStats({ wisdom: 10.5, wisdomBonus: 0.25 });
    expect(values.totalWisdom).toBe(13.125);
    expect(values.wisdomBossBonus).toBeCloseTo(0.0065625, 10);
  });

  it('applies numeric tree grants before primary and dependent totals', () => {
    const result = probe({ skillTree, characterStats: { luck: 10 } });
    expect(result.baseStats.luck).toBe(12);
    expect(result.baseStats.luckBonus).toBe(0.01);
    expect(result.values.totalLuck).toBeCloseTo(12.12, 10);
    expect(result.values.luckXpBonus).toBeCloseTo(0.01212);
  });

  it('keeps physical/elemental percentages and behavior flags distinct', () => {
    const base = probe({ equippedItems }).baseStats;
    expect(base.damageBonus).toBe(2);
    expect(base.elementalDamageBonus).toBe(3);
    expect(resolveStatId('EasyRPG.Attributes.GlobalModifiers.Damage%ForInventorySlots')).not.toBe('damageBonus');
    const changed = calculateDerivedStats({ damage: 10, elementalDamage: 10, elementalDamageBonus: 2 });
    const original = calculateDerivedStats({ damage: 10, elementalDamage: 10 });
    expect(changed.edpsED - original.edpsED).toBe(2);
    expect(changed.edpsPhysAdditive).toBe(original.edpsPhysAdditive);
  });

  it('preserves new tree grants and elemental identity through sharing', () => {
    const restoredTree = skillTreeShareToData(createSkillTreeShare(skillTree));
    expect(aggregateSkillEffects(restoredTree)).toEqual(aggregateSkillEffects(skillTree));
    const payload = createCharacterSharePayload(equippedItems);
    expect(probe({ skillTree: restoredTree, equippedItems: payload.e.map(itemShareToItem) }).values)
      .toEqual(probe({ skillTree, equippedItems }).values);
  });

  it('omits unallocated nodes from calculations and shares', () => {
    const unallocated = { mainTree: skillTree.mainTree.map(node => ({ ...node, level: 0 })) };
    expect(aggregateSkillEffects(unallocated)).toEqual([]);
    expect(createSkillTreeShare(unallocated)).toBeNull();
  });
});
