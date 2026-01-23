/**
 * Item Transformer
 *
 * Transforms raw UE5 save file structures into clean Item models.
 * Handles the deeply nested JSON format from uesave-wasm output.
 *
 * @module models/itemTransformer
 */

import { createEmptyItem, Rarity } from './Item.js';

// Constants for parsing
const ITEMS_TABLE_SNIPPET = 'DT_Items.DT_Items';
const POOL_PREFIXES = ['Pool1', 'Pool2', 'Pool3', 'Inherent'];

// Monogram detection prefix
const MONOGRAM_TAG_PREFIX = 'EasyRPG.Items.Modifiers.';

// Field name prefixes in the raw structure
const FIELD_PREFIXES = {
  ITEM_HANDLE: 'ItemHandle',
  GENERATED_NAME: 'GeneratedName',
  GENERATED_ATTRIBUTES: 'GeneratedAttributes',
  AFFIXES_POOL: 'AffixesPool',
  AMOUNT: 'Amount',
  CHARGES: 'Charges',
  RARITY: 'Rarity',
  IS_GENERATED: 'isGenerated?',
  ITEM_TIER: 'ItemTier',
  CRAFTING_SPECKS: 'CraftingSpecks',
  IS_LOCKED: 'IsLocked',
  GAMBLE_UPGRADE: 'GabmleUpgradeAmount', // Note: typo in save file
};

/**
 * Extract the prefix from a key name (before first underscore with numbers)
 * @param {string} name - Key name like "ItemHandle_50_771C5BDE..."
 * @returns {string} Prefix like "ItemHandle"
 */
function keyPrefix(name) {
  if (typeof name !== 'string') return '';
  return name.split('_')[0];
}

/**
 * Check if a field key starts with a given prefix
 * @param {string} key - The field key
 * @param {string} prefix - The prefix to check
 * @returns {boolean}
 */
function keyStartsWith(key, prefix) {
  return key.startsWith(prefix);
}

/**
 * Find a field value by prefix in an object
 * @param {Object} obj - Object to search
 * @param {string} prefix - Field prefix
 * @returns {*} The field value or undefined
 */
function findFieldByPrefix(obj, prefix) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const [key, value] of Object.entries(obj)) {
    if (keyStartsWith(key, prefix)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Check if a structure is an item by looking for ItemHandle pointing to DT_Items
 * @param {Object} node - Structure to check
 * @returns {boolean}
 */
export function isItemStruct(node) {
  if (!node || typeof node !== 'object') return false;

  for (const key of Object.keys(node)) {
    if (key.includes('ItemHandle')) {
      const handle = node[key];
      const dtPath =
        handle?.Struct?.Struct?.DataTable_0?.Object ||
        handle?.Struct?.Struct?.DataTable?.Object ||
        handle?.tag?.data?.Struct?.struct_type?.Struct;

      if (dtPath && dtPath.includes(ITEMS_TABLE_SNIPPET)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extract item row name from ItemHandle structure
 * @param {Object} itemStruct - Raw item structure
 * @returns {string|null}
 */
function extractItemRow(itemStruct) {
  if (!itemStruct || typeof itemStruct !== 'object') return null;

  for (const [k, v] of Object.entries(itemStruct)) {
    if (k.includes('ItemHandle')) {
      const rowName =
        v?.Struct?.Struct?.RowName_0?.Name ||
        v?.Struct?.Struct?.RowName?.Name;
      if (rowName) return rowName;
    }
  }
  return null;
}

/**
 * Parse item type from row name
 * @param {string} itemRowStr - Row name like "Armor_Bracers_Zone_4_..."
 * @returns {string} Type like "Armor Bracers"
 */
function parseItemType(itemRowStr) {
  if (!itemRowStr || typeof itemRowStr !== 'string') return 'Unknown';

  const parts = itemRowStr.split('_');
  if (parts.length >= 2) {
    let type = `${parts[0]} ${parts[1]}`;
    // Fix common typos
    type = type.replace(/Jewlery/i, 'Jewelry');
    return type;
  }
  return parts[0] || 'Unknown';
}

/**
 * Extract generated name from structure
 * @param {Object} node - Item structure
 * @returns {string|null}
 */
function extractGeneratedName(node) {
  if (!node || typeof node !== 'object') return null;

  const field = findFieldByPrefix(node, FIELD_PREFIXES.GENERATED_NAME);
  if (!field) return null;

  if (typeof field === 'string') return field;
  if (field?.Str) return field.Str;
  return null;
}

/**
 * Parse rarity from E_Rarity enum label
 * @param {Object} rarityField - Rarity field value
 * @returns {number} Rarity level (0-4)
 */
function parseRarity(rarityField) {
  if (!rarityField?.Byte?.Label) return Rarity.COMMON;

  const label = rarityField.Byte.Label;
  // Format: "E_Rarity::NewEnumerator0" -> extract the number
  const match = label.match(/NewEnumerator(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return Math.min(num, 4); // Cap at legendary
  }
  return Rarity.COMMON;
}

/**
 * Extract integer field value
 * @param {Object} field - Field object with Int property
 * @returns {number}
 */
function extractInt(field) {
  if (!field) return 0;
  return field?.Int ?? 0;
}

/**
 * Extract boolean field value
 * @param {Object} field - Field object with Bool property
 * @returns {boolean}
 */
function extractBool(field) {
  if (!field) return false;
  return field?.Bool ?? false;
}

/**
 * Extract tag name from GameplayTag structure
 * @param {Object} obj - GameplayTag structure
 * @returns {{stat: string, rawTag: string}|null}
 */
function extractTagFromGameplayTag(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const struct = obj?.Struct;
  if (struct && typeof struct === 'object') {
    const innerStruct = struct.Struct || struct;
    for (const [k, v] of Object.entries(innerStruct)) {
      if (k.startsWith('TagName')) {
        const rawTag = v?.Name;
        if (rawTag) {
          // Extract the last part after dots as the stat name
          const parts = rawTag.split('.');
          return {
            stat: parts[parts.length - 1],
            rawTag: rawTag,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Check if a tag is a monogram (modifier) rather than a regular stat
 * @param {string} rawTag - Full tag path
 * @returns {boolean}
 */
function isMonogramTag(rawTag) {
  return rawTag && rawTag.startsWith(MONOGRAM_TAG_PREFIX);
}

/**
 * Parse monogram ID from full tag, normalizing %6 suffix variations
 * @param {string} rawTag - Full monogram tag
 * @returns {string} Normalized monogram ID
 */
function parseMonogramId(rawTag) {
  if (!rawTag) return '';
  let id = rawTag.replace(MONOGRAM_TAG_PREFIX, '');
  // Normalize %6 suffix to % (save file quirk)
  id = id.replace(/%6/g, '%');
  return id;
}

/**
 * Extract base stats and monograms from GeneratedAttributes array
 * Monograms are identified by "EasyRPG.Items.Modifiers." prefix
 * @param {Object} node - Item structure
 * @returns {{stats: Array, monograms: Array}}
 */
function extractStatsAndMonograms(node) {
  const stats = [];
  const monograms = [];

  if (!node || typeof node !== 'object') return { stats, monograms };

  const field = findFieldByPrefix(node, FIELD_PREFIXES.GENERATED_ATTRIBUTES);
  if (!field) return { stats, monograms };

  const array = field?.Array?.Struct?.value || field?.Array?.value || [];

  if (Array.isArray(array)) {
    for (const item of array) {
      const struct = item?.Struct || item;
      let tagInfo = null;
      let value = null;

      for (const [key, val] of Object.entries(struct)) {
        if (key.includes('GameplayTag')) {
          tagInfo = extractTagFromGameplayTag(val);
        }
        if (key.includes('Value')) {
          value = val?.Float ?? val?.Int ?? null;
        }
      }

      if (tagInfo) {
        if (isMonogramTag(tagInfo.rawTag)) {
          // This is a monogram
          monograms.push({
            id: parseMonogramId(tagInfo.rawTag),
            value: value,
            rawTag: tagInfo.rawTag,
          });
        } else {
          // Regular stat
          stats.push({
            stat: tagInfo.stat,
            value: value,
            rawTag: tagInfo.rawTag,
          });
        }
      }
    }
  }

  return { stats, monograms };
}

/**
 * Extract affix references from a pool array
 * @param {Object} poolData - Pool array data
 * @returns {Array<{rowName: string, dataTable: string}>}
 */
function extractPoolAffixes(poolData) {
  const affixes = [];
  if (!poolData || typeof poolData !== 'object') return affixes;

  const array =
    poolData?.Array?.Struct?.value ||
    poolData?.Array?.value ||
    poolData?.value ||
    [];

  if (Array.isArray(array)) {
    for (const item of array) {
      const struct = item?.Struct || item;

      const rowName =
        struct?.RowName_0?.Name ||
        struct?.RowName?.Name;

      const dataTable =
        struct?.DataTable_0?.Object ||
        struct?.DataTable?.Object ||
        '';

      if (rowName) {
        // Extract just the table name from the full path
        const tableMatch = dataTable.match(/DT_[^.]+/);
        affixes.push({
          rowName: rowName,
          dataTable: tableMatch ? tableMatch[0] : '',
        });
      }
    }
  }

  return affixes;
}

/**
 * Extract all affix pools from AffixesPool structure
 * @param {Object} node - Item structure
 * @returns {Object} Affix pools object
 */
function extractAffixPools(node) {
  const pools = {
    inherent: [],
    pool1: [],
    pool2: [],
    pool3: [],
  };

  if (!node || typeof node !== 'object') return pools;

  const field = findFieldByPrefix(node, FIELD_PREFIXES.AFFIXES_POOL);
  if (!field) return pools;

  // Navigate through the nested structure
  let poolStruct = field;
  if (field?.Struct?.Struct) {
    poolStruct = field.Struct.Struct;
  } else if (field?.Struct) {
    poolStruct = field.Struct;
  }

  // Process each pool
  for (const [poolKey, poolVal] of Object.entries(poolStruct)) {
    const poolName = keyPrefix(poolKey);
    if (POOL_PREFIXES.includes(poolName)) {
      const affixes = extractPoolAffixes(poolVal);
      if (affixes.length > 0) {
        const normalizedName = poolName.toLowerCase().replace('pool', 'pool');
        if (normalizedName === 'inherent') {
          pools.inherent = affixes;
        } else if (normalizedName === 'pool1') {
          pools.pool1 = affixes;
        } else if (normalizedName === 'pool2') {
          pools.pool2 = affixes;
        } else if (normalizedName === 'pool3') {
          pools.pool3 = affixes;
        }
      }
    }
  }

  return pools;
}

/**
 * Transform a raw UE5 item structure into a clean Item model
 * @param {Object} rawStruct - Raw item structure from save file
 * @param {number} [index=0] - Index for ID generation
 * @returns {import('./Item.js').Item}
 */
export function transformItem(rawStruct, index = 0) {
  const item = createEmptyItem();

  // Identity
  const rowName = extractItemRow(rawStruct);
  item.rowName = rowName || '';
  item.id = rowName ? `${rowName}-${index}` : `item-${index}`;
  item.type = parseItemType(rowName);
  item.displayName = extractGeneratedName(rawStruct) || rowName || '';

  // Metadata - find fields by prefix
  const rarityField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.RARITY);
  item.rarity = parseRarity(rarityField);

  const tierField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.ITEM_TIER);
  item.tier = extractInt(tierField);

  const specksField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.CRAFTING_SPECKS);
  item.specks = extractInt(specksField);

  const lockedField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.IS_LOCKED);
  item.isLocked = extractBool(lockedField);

  const generatedField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.IS_GENERATED);
  item.isGenerated = extractBool(generatedField);

  const amountField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.AMOUNT);
  item.stackCount = extractInt(amountField) || 1;

  const chargesField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.CHARGES);
  item.charges = extractInt(chargesField);

  // Gamble/Anvil upgrade count
  const upgradeField = findFieldByPrefix(rawStruct, FIELD_PREFIXES.GAMBLE_UPGRADE);
  item.upgradeCount = extractInt(upgradeField);

  // Extract stats and monograms from GeneratedAttributes
  // Monograms have "EasyRPG.Items.Modifiers." prefix
  const { stats, monograms } = extractStatsAndMonograms(rawStruct);
  item.baseStats = stats;
  item.monograms = monograms;

  // Extract affix pools
  item.affixPools = extractAffixPools(rawStruct);

  return item;
}

/**
 * Walk JSON tree to find all item structures
 * @param {Object} root - Root of JSON tree
 * @returns {Object[]} Array of raw item structures
 */
export function findAllItemStructs(root) {
  const items = [];

  function traverse(node) {
    if (!node || typeof node !== 'object') return;

    // Handle Array.Struct.value pattern (inventory arrays)
    if (node.Array && typeof node.Array === 'object') {
      const arrayStruct = node.Array;
      if (arrayStruct.Struct && typeof arrayStruct.Struct === 'object') {
        const structData = arrayStruct.Struct;
        if (Array.isArray(structData.value)) {
          for (const wrapper of structData.value) {
            if (wrapper?.Struct && isItemStruct(wrapper.Struct)) {
              items.push(wrapper.Struct);
            }
          }
          return;
        }
      }
    }

    // Check if current node is an item
    if (isItemStruct(node)) {
      items.push(node);
      return;
    }

    // Continue traversing
    if (Array.isArray(node)) {
      for (const child of node) {
        traverse(child);
      }
    } else {
      for (const value of Object.values(node)) {
        traverse(value);
      }
    }
  }

  traverse(root);
  return items;
}

/**
 * Transform all items from a save file JSON
 * @param {Object|string} saveData - Parsed JSON or JSON string
 * @returns {{items: import('./Item.js').Item[], totalCount: number}}
 */
export function transformAllItems(saveData) {
  const data = typeof saveData === 'string' ? JSON.parse(saveData) : saveData;
  const rawStructs = findAllItemStructs(data);

  const items = rawStructs.map((struct, index) => transformItem(struct, index));

  return {
    items,
    totalCount: items.length,
  };
}

/**
 * Weapon type patterns for filtering
 * @type {RegExp[]}
 */
export const WEAPON_PATTERNS = [
  /scythe/i, /bow/i, /archer/i, /mage/i, /magery/i, /wand/i,
  /spear/i, /axe/i, /2h/i, /maul/i, /staff/i, /fists/i, /sword/i, /1h/i,
];

/**
 * Check if an item type is a weapon
 * @param {string} typeStr - Item type string
 * @returns {boolean}
 */
export function isWeaponType(typeStr) {
  if (!typeStr) return false;
  return WEAPON_PATTERNS.some((pattern) => pattern.test(typeStr));
}
