import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDerivedStats } from '../src/hooks/useDerivedStats.js';
import { calculateDerivedStats } from '../src/utils/derivedStats.js';
import generated from '../src/data/monograms.generated.json';

function probe(ids, characterStats = { strength: 1000 }) {
  let result;
  function Probe() {
    result = useDerivedStats({ characterStats, equippedItems: ids.map((id, i) => ({
      slot: ['head', 'neck', 'bracer'][i], rowName: `item_${i}`, baseStats: [], monograms: [{ id, value: 1 }],
    })) });
    return null;
  }
  renderToString(React.createElement(Probe));
  return result.values;
}

describe('potion grants and explicit damage drawbacks', () => {
  it('does not invent attribute-derived potion slots without a grant', () => {
    const absent = probe([]);
    expect(absent.potionSlotsFromAttributes).toBe(0);
    expect(absent.statBonusFromPotions).toBe(0);
    expect(probe(['Damage%NoPotion']).damageNoPotionBonus).toBe(45); // existing 3-slot baseline
    const granted = probe(['PotionSlotForStat.Highest', 'Damage%NoPotion']);
    expect(granted.potionSlotsFromAttributes).toBe(20);
    expect(granted.damageNoPotionBonus).toBe(345);
    expect(granted.statBonusFromPotions).toBe(0); // independent grant
  });

  it('orders the no-healing-potions bonus before its elemental consumer', () => {
    // This configured dependency raises the grant to a later presentation layer.
    // The consumer must still run after it.
    const values = calculateDerivedStats({ strength: 1000 }, {
      damageNoPotionBonus: { enabled: true, sourceStat: 'lifeFromElement' },
    });
    expect(values.damageNoPotionBonus).toBe(45);
    expect(values.edpsED).toBeCloseTo(1.45);
  });

  it.each(['DamageGainNoEnergy', 'DamageBonusAnd51Damage'])('%s grants both exported +300 flats per copy', id => {
    const effectTags = generated.monograms[id].effects.filter(effect => effect.value === 300).map(effect => effect.tag);
    expect(effectTags).toEqual(expect.arrayContaining(['EasyRPG.Attributes.Base.Damage', 'EasyRPG.Attributes.Base.ElementalDamage']));
    const values = probe([id, id]);
    expect(values.edpsPhysFlat).toBe(600);
    expect(values.edpsElemFlat).toBe(600);
  });

  it('no-energy disables energy conversion while retaining its elemental flat grant', () => {
    const values = probe(['DamageGainNoEnergy', 'ExtraEnergyAddDamage'], { maxEnergy: 500 });
    expect(values.totalMaxEnergy).toBe(0);
    expect(values.energyDamageBonus).toBe(0);
    expect(values.edpsElemFlat).toBe(300);
  });

  it('the minimum-incoming-hit drawback does not halve maximum health', () => {
    const values = probe(['DamageBonusAnd51Damage'], { health: 1000 });
    expect(values.totalHealth).toBe(1000);
  });
});
