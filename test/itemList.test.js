import { describe, expect, it } from 'vitest';
import { buildItemList, getListItemSlot } from '../src/utils/itemList.js';

describe('Items-tab item list', () => {
  it('includes equipped instances that inventory extraction omits', () => {
    const equipped = [
      { rowName: 'Armor_Head_A', slot: 'head' },
      { rowName: 'Ring_A', slot: 'ring' },
      { rowName: 'Ring_B', slot: 'ring' },
    ];
    const inventory = [{ rowName: 'Armor_Boots_Inventory' }];

    const result = buildItemList(equipped, inventory, 1);

    expect(result.items).toHaveLength(4);
    expect(result.items.filter(item => item.isEquipped)).toHaveLength(3);
    expect(result.items.map(item => item.equipmentSlotKey))
      .toEqual(['head', 'ring1', 'ring2', null]);
    expect(result.totalItems).toBe(4);
  });

  it('infers equipment categories for unequipped inventory items', () => {
    expect(getListItemSlot({ rowName: 'Armor_Boots_Zone_4' })).toBe('boots');
    expect(getListItemSlot({ rowName: 'Consumable_Potion' })).toBe('unknown');
  });
});
