// Equipment parser - extracts and processes equipped items from save data
// Outputs items in the unified Item model format from models/Item.js

import { transformItem } from '../models/itemTransformer.js';

const EQUIPMENT_ITEMS_PATTERN = /EquipmentItems_\d+_[A-F0-9]+_0/i;
const HOTBAR_ITEMS_PATTERN = /HotbarItems_\d+_[A-F0-9]+_0/i;

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

// Map item row names to equipment slots
const SLOT_MAPPING = {
  // Head
  helmet: 'head',
  head: 'head',
  casque: 'head',

  // Chest
  chest: 'chest',
  torso: 'chest',

  // Hands
  gloves: 'hands',
  gauntlets: 'hands',
  hands: 'hands',

  // Pants
  pants: 'pants',
  legs: 'pants',

  // Boots
  boots: 'boots',
  feet: 'boots',

  // Weapon - 8 weapon/stance types
  weapon: 'weapon',
  sword: 'weapon',
  axe: 'weapon',
  bow: 'weapon',
  staff: 'weapon',
  wand: 'weapon',
  mace: 'weapon',
  maul: 'weapon',
  dagger: 'weapon',
  spear: 'weapon',

  // Neck
  amulet: 'neck',
  necklace: 'neck',

  // Bracer
  bracer: 'bracer',
  bracers: 'bracer',
  wrist: 'bracer',

  // Ring
  ring: 'ring',

  // Relic/Shield
  shield: 'relic',
  relic: 'relic',

  // Fossil (check before offhand) - Equipment_Dwarven_Heart
  fossil: 'fossil',
  artifact: 'fossil',
  ancient: 'fossil',
  heart: 'fossil',

  // Offhand items (goblets, horns, trinkets, belts) - must come before vague keywords
  goblet: 'offhand',
  horn: 'offhand',
  trinket: 'offhand',
  belt: 'offhand',
  waistband: 'offhand',
};

// Map weapon keywords to stance IDs for eDPS calculation
// Each weapon type maps to a stance prefix used in stat IDs
// e.g., 'maul' → { damage: 'maulDamage', critDamage: 'maulCritDamage' }
const WEAPON_STANCE_MAP = {
  maul:    'maul',
  mace:    'maul',      // maces use maul stance
  sword:   'sword',
  dagger:  'sword',     // daggers use one-handed stance
  axe:     'twohand',   // axes use two-handed stance
  bow:     'archery',
  staff:   'magery',
  wand:    'magery',    // wands use magery stance
  polearm: 'maul',     // polearms use maul stance
  spear:   'spear',
  scythe:  'scythe',
  fist:    'unarmed',
};

/**
 * Infer the stance (weapon type category) from an item row name.
 * Returns the stance prefix used in stat IDs (e.g., 'maul', 'sword', 'archery').
 * @param {string} itemRow - Item row name
 * @returns {string|null} Stance prefix or null if not a weapon
 */
export function inferWeaponStance(itemRow) {
  if (!itemRow) return null;
  const lower = itemRow.toLowerCase();
  for (const [keyword, stance] of Object.entries(WEAPON_STANCE_MAP)) {
    if (lower.includes(keyword)) return stance;
  }
  return null;
}

// Determine slot from item row name
function determineSlot(itemRow, fallback = 'unknown') {
  if (!itemRow) return 'unknown';

  const lowerRow = itemRow.toLowerCase();

  // Check for dragon/pet first with specific pattern (e.g., Equipment_Pet_Fire)
  if (lowerRow.includes('equipment_pet_') || lowerRow.includes('_pet_')) {
    return 'dragon';
  }

  // Check for fossil with specific pattern (e.g., Equipment_Dwarven_Heart)
  if (lowerRow.includes('dwarven') && lowerRow.includes('heart')) {
    return 'fossil';
  }

  // Check each slot mapping
  for (const [keyword, slot] of Object.entries(SLOT_MAPPING)) {
    // Skip these vague keywords that need specific patterns above
    if (['fossil', 'artifact', 'ancient', 'heart'].includes(keyword)) {
      continue;
    }
    if (lowerRow.includes(keyword)) {
      return slot;
    }
  }

  return fallback;
}

/**
 * Infer likely equipment slot from an item row name.
 * Uses the same keyword rules as equipped item extraction.
 *
 * @param {string} itemRow - Item row name from DT_Items
 * @returns {string} Slot key or 'unknown'
 */
export function inferEquipmentSlot(itemRow) {
  return determineSlot(itemRow, 'unknown');
}

/**
 * Format a slot key for display.
 * @param {string} slot - Slot key (head, chest, etc.)
 * @returns {string} Human-friendly slot label
 */
export function formatSlotLabel(slot) {
  return SLOT_LABELS[slot] || '';
}

/**
 * Process a single equipped item using the unified Item model transformer
 * Adds slot information based on item row name
 * @param {Object} itemStruct - Raw item structure from save
 * @param {number} index - Index for ID generation
 * @returns {import('../models/Item.js').Item & {slot: string}}
 */
function processEquippedItem(itemStruct, index) {
  // Use the transformer to get full Item model
  const item = transformItem(itemStruct, index);

  // Add slot based on row name
  const slot = determineSlot(item.rowName, 'offhand');

  return {
    ...item,
    slot,
  };
}

/**
 * Extract all equipped items from save data
 * Returns items in unified Item model format with slot information
 *
 * Note: Equipment can come from two sources:
 * 1. EquipmentItems_* - armor, accessories, relics, etc.
 * 2. HotbarItems_* - weapons (modern game stores weapons here)
 *
 * @param {Object} saveData - Parsed save data JSON
 * @returns {Array<import('../models/Item.js').Item & {slot: string}>}
 */
export function extractEquippedItems(saveData) {
  if (!saveData || typeof saveData !== "object") return [];

  const equippedItems = [];
  let itemIndex = 0;

  // Traverse the save data to find EquipmentItems and HotbarItems arrays
  function traverse(node, path = []) {
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      // Check for both EquipmentItems and HotbarItems patterns
      if (EQUIPMENT_ITEMS_PATTERN.test(key) || HOTBAR_ITEMS_PATTERN.test(key)) {
        // Found equipment or hotbar array
        const array = value?.Array?.Struct?.value;
        if (Array.isArray(array)) {
          for (const wrapper of array) {
            if (wrapper?.Struct) {
              const item = processEquippedItem(wrapper.Struct, itemIndex++);
              equippedItems.push(item);
            }
          }
        }
        // Continue traversing for other equipment arrays
        continue;
      }

      // Continue traversing
      if (typeof value === "object") {
        traverse(value, [...path, key]);
      }
    }
  }

  traverse(saveData);
  return equippedItems;
}

/**
 * Map equipped items to slots (handling multiple rings/offhands)
 * @param {Array} equippedItems - Array of equipped items with slot property
 * @returns {Object} Slot map with items
 */
export function mapItemsToSlots(equippedItems) {
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

  for (const item of equippedItems) {
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
    } else {
      slots[item.slot] = item;
    }
  }

  return slots;
}

/**
 * Create compressed log output for console
 * Updated to use Item model format
 * @param {Array} equippedItems - Array of equipped items in Item model format
 */
export function logEquipmentCompressed(equippedItems) {
  console.group('🎒 Equipped Items (Compressed)');

  for (const item of equippedItems) {
    const topStats = (item.baseStats || []).slice(0, 3);
    const statSummary = topStats.map(s => {
      const name = s.stat || s.rawTag?.split('.').pop() || 'Unknown';
      const value = s.value != null ? s.value : '?';
      return `${name}: ${value}`;
    }).join(', ');

    console.log(`[${(item.slot || 'unknown').toUpperCase()}] ${item.displayName}`);
    console.log(`  Type: ${item.type} | Row: ${item.rowName}`);
    console.log(`  Stats: ${statSummary} (${(item.baseStats || []).length} total)`);
    if (item.monograms?.length) {
      console.log(`  Monograms: ${item.monograms.map(m => m.id).join(', ')}`);
    }
  }

  console.groupEnd();
}
