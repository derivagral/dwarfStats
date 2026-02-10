import { useState, useCallback, useMemo } from 'react';
import { extractEquippedItems } from '../utils/equipmentParser';
import { transformAllItems } from '../models/itemTransformer';

/**
 * Central store for all item data
 *
 * Provides unified access to equipped and inventory items across all tabs.
 * Save files are "imported" into the store - all UI reads from the store,
 * not from raw save data.
 *
 * All items use the unified Item model format:
 * - equipped[]: Item model { id, displayName, type, rowName, baseStats, monograms, slot }
 * - inventory[]: Item model (same shape, from transformAllItems)
 *
 * @returns {Object} Item store state and methods
 */
export function useItemStore() {
  // Equipped items in unified Item model format
  const [equipped, setEquipped] = useState([]);

  // All inventory items (DwarfFilter format for now)
  const [inventory, setInventory] = useState([]);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);

  // Metadata about the loaded save
  const [metadata, setMetadata] = useState({
    filename: null,
    loadedAt: null,
  });

  /**
   * Load items from parsed save data
   * Extracts equipped items and inventory from the save file JSON
   *
   * @param {Object} saveJson - Parsed save file JSON
   * @param {string} filename - Original filename for metadata
   */
  const loadFromSave = useCallback((saveJson, filename) => {
    // Extract equipped items using equipmentParser (outputs Item model format)
    const equippedItems = extractEquippedItems(saveJson);

    // Extract all inventory items using unified Item model
    const { items: inventoryItems, totalCount } = transformAllItems(saveJson);

    setEquipped(equippedItems);
    setInventory(inventoryItems);
    setTotalInventoryCount(totalCount);
    setMetadata({
      filename,
      loadedAt: new Date().toISOString(),
    });
  }, []);

  /**
   * Clear all loaded items
   */
  const clear = useCallback(() => {
    setEquipped([]);
    setInventory([]);
    setTotalInventoryCount(0);
    setMetadata({
      filename: null,
      loadedAt: null,
    });
  }, []);

  /**
   * Check if items have been loaded
   */
  const hasItems = equipped.length > 0 || inventory.length > 0;

  /**
   * Get equipped item by slot key
   * @param {string} slotKey - Slot identifier (e.g., 'head', 'ring1')
   * @returns {Object|null} Item in that slot or null
   */
  const getEquippedBySlot = useCallback((slotKey) => {
    // Handle numbered slots (ring1, ring2, offhand1, etc.)
    const baseSlot = slotKey.replace(/\d+$/, '');
    const slotNumber = parseInt(slotKey.match(/\d+$/)?.[0] || '1', 10);

    const matchingItems = equipped.filter(item => item.slot === baseSlot);

    if (matchingItems.length === 0) {
      // Try exact slot match
      return equipped.find(item => item.slot === slotKey) || null;
    }

    // Return the nth item for numbered slots
    return matchingItems[slotNumber - 1] || null;
  }, [equipped]);

  /**
   * Build slot map from equipped items (for CharacterPanel compatibility)
   * @returns {Object} Map of slot keys to items
   */
  const equippedSlotMap = useMemo(() => {
    const slots = {
      head: null,
      chest: null,
      hands: null,
      pants: null,
      boots: null,
      weapon: null,
      neck: null,
      bracer: null,
      ring1: null,
      ring2: null,
      relic: null,
      fossil: null,
      dragon: null,
      offhand1: null,
      offhand2: null,
      offhand3: null,
      offhand4: null,
    };

    const ringCount = { count: 0 };
    const offhandCount = { count: 0 };

    for (const item of equipped) {
      if (item.slot === 'ring') {
        if (ringCount.count === 0) {
          slots.ring1 = item;
          ringCount.count++;
        } else if (ringCount.count === 1) {
          slots.ring2 = item;
          ringCount.count++;
        }
      } else if (item.slot === 'offhand') {
        if (offhandCount.count === 0) {
          slots.offhand1 = item;
          offhandCount.count++;
        } else if (offhandCount.count === 1) {
          slots.offhand2 = item;
          offhandCount.count++;
        } else if (offhandCount.count === 2) {
          slots.offhand3 = item;
          offhandCount.count++;
        } else if (offhandCount.count === 3) {
          slots.offhand4 = item;
          offhandCount.count++;
        }
      } else if (slots.hasOwnProperty(item.slot)) {
        slots[item.slot] = item;
      }
    }

    return slots;
  }, [equipped]);

  /**
   * Check if an inventory item is equipped
   * @param {string} itemRow - Item row name to check
   * @returns {Object|null} Equipped item info or null
   */
  const getEquippedInfo = useCallback((itemRow) => {
    if (!itemRow) return null;

    const equippedItem = equipped.find(item =>
      item.rowName === itemRow || item.itemRow === itemRow
    );

    if (!equippedItem) return null;

    // Determine display slot name
    const SLOT_LABELS = {
      head: 'Head',
      chest: 'Chest',
      hands: 'Hands',
      pants: 'Pants',
      boots: 'Boots',
      weapon: 'Weapon',
      neck: 'Neck',
      bracer: 'Bracer',
      ring: 'Ring',
      relic: 'Relic',
      fossil: 'Fossil',
      dragon: 'Dragon',
      offhand: 'Offhand',
    };

    return {
      item: equippedItem,
      slot: equippedItem.slot,
      label: SLOT_LABELS[equippedItem.slot] || equippedItem.slot,
    };
  }, [equipped]);

  return {
    // State
    equipped,
    inventory,
    totalInventoryCount,
    metadata,
    hasItems,

    // Slot access
    equippedSlotMap,
    getEquippedBySlot,
    getEquippedInfo,

    // Actions
    loadFromSave,
    clear,
  };
}

export default useItemStore;
