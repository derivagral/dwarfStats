import { describe, expect, it } from 'vitest';
import {
  createMonogramSet,
  deserializeMonogramSet,
  matchMonogramSet,
  serializeMonogramSet,
} from '../src/models/MonogramSet.js';

const equipped = [
  {
    slot: 'head',
    rowName: 'Equipment_Armor_Head_A',
    displayName: 'A Head',
    monograms: [{ id: 'Bloodlust.Base' }, { id: 'Shroud' }],
  },
  {
    slot: 'ring',
    rowName: 'Equipment_Ring_A',
    displayName: 'A Ring',
    monograms: [{ id: 'ExtraHp%' }],
  },
  {
    slot: 'ring',
    rowName: 'Equipment_Ring_B',
    displayName: 'B Ring',
    monograms: [{ id: 'ExtraArmor%' }],
  },
  { slot: 'weapon', rowName: 'Equipment_Weapon_A', displayName: 'Weapon' },
];

describe('MonogramSet', () => {
  it('captures the complete effective loadout and ignores non-monogram equipment', () => {
    const monogramSet = createMonogramSet('Boss', equipped, {
      head: { monogramSlots: ['Colossus.Base', null, 'Shroud'] },
    });

    expect(monogramSet.entries.map(entry => entry.slotKey))
      .toEqual(['head', 'ring1', 'ring2']);
    expect(monogramSet.entries[0].monogramSlots)
      .toEqual(['Colossus.Base', null, 'Shroud']);
    expect(monogramSet.entries[1].monogramSlots)
      .toEqual(['ExtraHp%', null, null]);
  });

  it('applies only when both the unique slot and item identity match', () => {
    const monogramSet = createMonogramSet('Boss', equipped, {});
    const changedGear = equipped.map(item => item.slot === 'head'
      ? { ...item, rowName: 'Equipment_Armor_Head_B' }
      : item);

    const { monogramSlotsByEquipment, skipped } = matchMonogramSet(monogramSet, changedGear);

    expect(monogramSlotsByEquipment.head).toBeUndefined();
    expect(monogramSlotsByEquipment.ring1).toEqual(['ExtraHp%', null, null]);
    expect(skipped.map(entry => entry.slotKey)).toEqual(['head']);
  });

  it('round-trips through the localStorage representation', () => {
    const monogramSet = createMonogramSet('Boss', equipped, {});
    expect(deserializeMonogramSet(serializeMonogramSet(monogramSet)))
      .toEqual(monogramSet);
  });

  it('rejects malformed serialized sets', () => {
    expect(deserializeMonogramSet('{}')).toBeNull();
    expect(deserializeMonogramSet('not json')).toBeNull();
  });
});
