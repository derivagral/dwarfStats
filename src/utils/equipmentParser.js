// Equipment parser - extracts and processes equipped items from save data
// Similar to dwarfFilter.js but specifically for EquipmentItems

const EQUIPMENT_ITEMS_PATTERN = /EquipmentItems_\d+_[A-F0-9]+_0/i;

// Map item row names to equipment slots
const SLOT_MAPPING = {
  // Head
  helmet: 'head',
  head: 'head',

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

  // Weapon
  weapon: 'weapon',
  sword: 'weapon',
  axe: 'weapon',
  bow: 'weapon',
  staff: 'weapon',
  wand: 'weapon',

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

  // Fossil (check before offhand) - add common variations
  fossil: 'fossil',
  artifact: 'fossil',
  ancient: 'fossil',

  // Dragon/Pet (check before offhand)
  dragon: 'dragon',
  pet: 'dragon',

  // Offhand items (goblets, horns, trinkets, belts)
  goblet: 'offhand',
  horn: 'offhand',
  trinket: 'offhand',
  belt: 'offhand',
  waistband: 'offhand',
  heart: 'offhand',
};

// Extract item row name from ItemHandle structure
function extractItemRow(itemStruct) {
  if (!itemStruct || typeof itemStruct !== "object") return null;

  for (const [k, v] of Object.entries(itemStruct)) {
    if (k.includes("ItemHandle")) {
      const rowName = v?.Struct?.Struct?.RowName_0?.Name ||
                     v?.Struct?.Struct?.RowName?.Name;
      if (rowName) return rowName;
    }
  }
  return null;
}

// Extract generated name
function findGeneratedName(node) {
  if (!node || typeof node !== "object") return null;

  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("GeneratedName")) {
      if (typeof v === "string") return v;
      if (v?.Str) return v.Str;
    }
  }
  return null;
}

// Extract tag name from GameplayTag
function extractTagFromGameplayTag(obj) {
  if (!obj || typeof obj !== "object") return null;

  const struct = obj?.Struct;
  if (struct && typeof struct === "object") {
    const innerStruct = struct.Struct || struct;
    for (const [k, v] of Object.entries(innerStruct)) {
      if (k.startsWith("TagName")) {
        const name = v?.Name;
        if (name) {
          const parts = name.split(".");
          return parts[parts.length - 1];
        }
      }
    }
  }
  return null;
}

// Extract generated attributes with values
function extractGeneratedAttributes(node) {
  const attrs = [];
  if (!node || typeof node !== "object") return attrs;

  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("GeneratedAttributes")) {
      const array = v?.Array?.Struct?.value || v?.Array?.value || [];

      if (Array.isArray(array)) {
        for (const item of array) {
          const struct = item?.Struct || item;
          let attrName = null;
          let attrValue = null;

          for (const [key, val] of Object.entries(struct)) {
            if (key.includes("GameplayTag")) {
              attrName = extractTagFromGameplayTag(val);
            }
            if (key.includes("Value")) {
              attrValue = val?.Float || val?.Int || val;
            }
          }

          if (attrName) {
            attrs.push({ name: attrName, value: attrValue });
          }
        }
      }
    }
  }
  return attrs;
}

// Determine slot from item row name
function determineSlot(itemRow) {
  if (!itemRow) return 'unknown';

  const lowerRow = itemRow.toLowerCase();

  // Check each slot mapping
  for (const [keyword, slot] of Object.entries(SLOT_MAPPING)) {
    if (lowerRow.includes(keyword)) {
      return slot;
    }
  }

  return 'offhand'; // Default to offhand if unknown
}

// Extract item type from row name
function extractItemType(itemRow) {
  if (!itemRow || typeof itemRow !== "string") return "Unknown";

  const parts = itemRow.split("_");
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] || "Unknown";
}

// Process a single equipped item
function processEquippedItem(itemStruct) {
  const itemRow = extractItemRow(itemStruct);
  const itemType = extractItemType(itemRow);
  const generatedName = findGeneratedName(itemStruct);
  const attributes = extractGeneratedAttributes(itemStruct);
  const slot = determineSlot(itemRow);

  return {
    itemRow,
    itemType,
    name: generatedName || itemRow || "Unknown",
    slot,
    attributes,
    rawData: itemStruct // Keep for detailed inspection
  };
}

// Extract all equipped items from save data
export function extractEquippedItems(saveData) {
  if (!saveData || typeof saveData !== "object") return [];

  const equippedItems = [];

  // Traverse the save data to find EquipmentItems arrays
  function traverse(node, path = []) {
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      if (EQUIPMENT_ITEMS_PATTERN.test(key)) {
        // Found equipment array
        const array = value?.Array?.Struct?.value;
        if (Array.isArray(array)) {
          for (const wrapper of array) {
            if (wrapper?.Struct) {
              const item = processEquippedItem(wrapper.Struct);
              equippedItems.push(item);
            }
          }
        }
        return; // Don't traverse deeper once we find equipment
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

// Map equipped items to slots (handling multiple rings/offhands)
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

// Create compressed log output for console
export function logEquipmentCompressed(equippedItems) {
  console.group('🎒 Equipped Items (Compressed)');

  for (const item of equippedItems) {
    const topAttrs = item.attributes.slice(0, 3);
    const attrSummary = topAttrs.map(a => {
      const shortName = a.name.split('.').pop();
      return `${shortName}: ${typeof a.value === 'number' ? a.value.toFixed(2) : a.value}`;
    }).join(', ');

    console.log(`[${item.slot.toUpperCase()}] ${item.name}`);
    console.log(`  Type: ${item.itemType} | Row: ${item.itemRow}`);
    console.log(`  Attrs: ${attrSummary} (${item.attributes.length} total)`);
  }

  console.groupEnd();
}
