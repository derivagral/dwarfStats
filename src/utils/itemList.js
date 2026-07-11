import { getUniqueSlotKeyMap, inferEquipmentSlot } from './equipmentParser.js';

/**
 * Build the Items-tab source as a union. Inventory extraction intentionally
 * excludes equipped arrays, so the equipped instances must be added back.
 */
export function buildItemList(equipped = [], inventory = [], totalInventoryCount = 0) {
  const equippedItems = Array.from(
    getUniqueSlotKeyMap(equipped),
    ([item, equipmentSlotKey]) => ({
      ...item,
      isEquipped: true,
      equipmentSlotKey,
    })
  );
  const inventoryItems = inventory.map(item => ({
    ...item,
    isEquipped: false,
    equipmentSlotKey: null,
  }));

  return {
    items: [...equippedItems, ...inventoryItems],
    totalItems: (totalInventoryCount || inventory.length) + equippedItems.length,
  };
}

export function getListItemSlot(item) {
  return item?.slot || inferEquipmentSlot(item?.rowName) || 'unknown';
}
