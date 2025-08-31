// UE 5.x inventory parser/scorer (browser, read-only)
// Fixed version with proper UE5 JSON structure handling

export const DEFAULT_SLOT1 = [
  /Fiery.*Totem.*Damage/i, /Wisdom/i, /MageryCriticalDamage/i, 
  /LifeStealChance/i, /LifeStealAmount/i, /\bCriticalChance%/i, /MageryCriticalChance/
];
export const DEFAULT_SLOT2 = [...DEFAULT_SLOT1];
export const DEFAULT_SLOT3 = [...DEFAULT_SLOT1];

// Weapon markers to exclude
export const WEAPON_PATTERNS = [
  /scythe/i, /bow/i, /archer/i, /mage/i, /magery/i, /wand/i,
  /spear/i, /axe/i, /2h/i, /maul/i, /staff/i, /fists/i, /sword/i, /1h/i
];

const ITEMS_TABLE_SNIPPET = "DT_Items.DT_Items";
const ATTR_TABLE_PREFIX = "/GeneratedItems/DT_";

const POOL_PREFIXES = ["Pool1", "Pool2", "Pool3", "Inherent"];
const GENNAME_PREFIX = "GeneratedName";
const GENATTR_PREFIX = "GeneratedAttributes";
const AFFIXES_PREFIX = "AffixesPool";

// -------------------- Helpers --------------------

const keyPrefix = (name) => {
  if (typeof name !== "string") return "";
  return name.split("_")[0];
};

// Check if a structure is an item by looking for ItemHandle pointing to DT_Items
function isItemStruct(node) {
  if (!node || typeof node !== "object") return false;
  
  for (const key of Object.keys(node)) {
    if (key.includes("ItemHandle")) {
      const handle = node[key];
      // Navigate through Struct.Struct to find DataTable
      const dtPath = handle?.Struct?.Struct?.DataTable_0?.Object || 
                     handle?.Struct?.Struct?.DataTable?.Object ||
                     handle?.tag?.data?.Struct?.struct_type?.Struct;
      
      if (dtPath && dtPath.includes(ITEMS_TABLE_SNIPPET)) {
        return true;
      }
    }
  }
  return false;
}

// Extract item row name from ItemHandle structure
function extractItemRow(itemStruct) {
  if (!itemStruct || typeof itemStruct !== "object") return null;
  
  for (const [k, v] of Object.entries(itemStruct)) {
    if (k.includes("ItemHandle")) {
      // Navigate through nested structure to find RowName
      const rowName = v?.Struct?.Struct?.RowName_0?.Name || 
                     v?.Struct?.Struct?.RowName?.Name ||
                     v?.Struct?.Struct?.RowName_0?.tag?.data?.Other;
      if (rowName) return rowName;
    }
  }
  return null;
}

// Extract item type from row name
const extractItemType = (itemRowStr) => {
  if (!itemRowStr || typeof itemRowStr !== "string") return "Unknown";
  
  const parts = itemRowStr.split("_");
  if (parts.length >= 2) {
    let type = `${parts[0]} ${parts[1]}`;
    // Fix common typos
    type = type.replace(/Jewlery/i, "Jewelry");
    return type;
  }
  return parts[0] || "Unknown";
};

// Check if item type is a weapon
const isWeaponType = (typeStr) => {
  if (!typeStr) return false;
  const lower = typeStr.toLowerCase();
  return WEAPON_PATTERNS.some(pattern => pattern.test(lower));
};

// Extract generated name from structure
const findGeneratedName = (node) => {
  if (!node || typeof node !== "object") return null;
  
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith(GENNAME_PREFIX)) {
      // Handle both direct string and {Str: "..."} format
      if (typeof v === "string") return v;
      if (v?.Str) return v.Str;
      if (v?.tag?.data?.Other === "StrProperty" && v?.Str) return v.Str;
    }
  }
  return null;
};

// Extract tag name from GameplayTag structure
const extractTagFromGameplayTag = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  
  // Navigate through Struct.Struct.TagName_0.Name pattern
  const struct = obj?.Struct;
  if (struct && typeof struct === "object") {
    const innerStruct = struct.Struct || struct;
    // Look for TagName_* keys
    for (const [k, v] of Object.entries(innerStruct)) {
      if (k.startsWith("TagName")) {
        const name = v?.Name;
        if (name) {
          // Return just the last part after dots
          const parts = name.split(".");
          return parts[parts.length - 1];
        }
      }
    }
  }
  return null;
};

// Extract attributes from GeneratedAttributes array
const extractGeneratedAttributes = (node) => {
  const attrs = [];
  if (!node || typeof node !== "object") return attrs;
  
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith(GENATTR_PREFIX)) {
      // Navigate to array of attributes
      const array = v?.Array?.Struct?.value || v?.Array?.value || [];
      
      if (Array.isArray(array)) {
        for (const item of array) {
          const struct = item?.Struct || item;
          // Look for GameplayTag in the structure
          for (const [key, val] of Object.entries(struct)) {
            if (key.includes("GameplayTag")) {
              const tag = extractTagFromGameplayTag(val);
              if (tag) attrs.push(tag);
            }
          }
        }
      }
    }
  }
  return attrs;
};

// Extract pool attributes from pool structure
const extractPoolAttributes = (poolData) => {
  const attrs = [];
  if (!poolData || typeof poolData !== "object") return attrs;
  
  // Navigate to the array of attributes
  const array = poolData?.Array?.Struct?.value || 
                poolData?.Array?.value || 
                poolData?.value || [];
  
  if (Array.isArray(array)) {
    for (const item of array) {
      const struct = item?.Struct || item;
      
      // Look for DataTable row references
      const rowName = struct?.RowName_0?.Name || 
                     struct?.RowName?.Name ||
                     struct?.RowName_0?.tag?.data?.Other;
      
      if (rowName) {
        attrs.push(rowName);
      }
    }
  }
  
  return attrs;
};

// Extract affix pools from AffixesPool structure
const extractAffixPools = (node) => {
  const pools = {};
  if (!node || typeof node !== "object") return pools;
  
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith(AFFIXES_PREFIX)) {
      // Navigate through tag.data.Struct or Struct.Struct
      let poolStruct = v;
      if (v?.tag?.data?.Struct) {
        poolStruct = v;
      }
      if (v?.Struct?.Struct) {
        poolStruct = v.Struct.Struct;
      } else if (v?.Struct) {
        poolStruct = v.Struct;
      }
      
      // Process each pool
      for (const [poolKey, poolVal] of Object.entries(poolStruct)) {
        const poolName = keyPrefix(poolKey);
        if (POOL_PREFIXES.includes(poolName)) {
          const attrs = extractPoolAttributes(poolVal);
          if (attrs.length > 0) {
            pools[poolName] = attrs;
          }
        }
      }
    }
  }
  return pools;
};

// Process a complete item structure
function processItemStruct(itemStruct) {
  const itemRow = extractItemRow(itemStruct);
  const itemType = extractItemType(itemRow);
  const generatedName = findGeneratedName(itemStruct);
  const genAttrs = extractGeneratedAttributes(itemStruct);
  const affixPools = extractAffixPools(itemStruct);
  
  // Initialize pools
  const pools = {
    Pool1: affixPools.Pool1 || [],
    Pool2: affixPools.Pool2 || [],
    Pool3: affixPools.Pool3 || [],
    Inherent: affixPools.Inherent || []
  };
  
  // Also check for direct pool attributes in the structure
  for (const [k, v] of Object.entries(itemStruct)) {
    const poolName = keyPrefix(k);
    if (POOL_PREFIXES.includes(poolName) && !k.startsWith(AFFIXES_PREFIX)) {
      const attrs = extractPoolAttributes(v);
      if (attrs.length > 0) {
        pools[poolName] = [...pools[poolName], ...attrs];
      }
    }
  }
  
  // Remove duplicates
  const uniq = (arr) => Array.from(new Set(arr));
  
  return {
    item_row: itemRow,
    item_type: itemType,
    generated_name: generatedName,
    generated_attributes: uniq(genAttrs),
    pool1_attributes: uniq(pools.Pool1),
    pool2_attributes: uniq(pools.Pool2),
    pool3_attributes: uniq(pools.Pool3),
    inherent_attributes: uniq(pools.Inherent),
    all_attributes: uniq([
      ...genAttrs,
      ...pools.Pool1,
      ...pools.Pool2,
      ...pools.Pool3,
      ...pools.Inherent
    ])
  };
}

// Walk JSON to find all item structures
function walkJson(root) {
  const items = [];
  
  function traverse(node, path = []) {
    if (!node || typeof node !== "object") return;
    
    // Special handling for Array.Struct.value pattern (inventory arrays)
    if (node.Array && typeof node.Array === "object") {
      const arrayStruct = node.Array;
      if (arrayStruct.Struct && typeof arrayStruct.Struct === "object") {
        const structData = arrayStruct.Struct;
        if (Array.isArray(structData.value)) {
          // Process each item in the array
          for (let i = 0; i < structData.value.length; i++) {
            const wrapper = structData.value[i];
            if (wrapper && wrapper.Struct) {
              // Check if this is an item
              if (isItemStruct(wrapper.Struct)) {
                items.push(wrapper.Struct);
              }
            }
          }
          return; // Don't traverse this structure further
        }
      }
    }
    
    // Check if current node is itself an item
    if (isItemStruct(node)) {
      items.push(node);
      return; // Don't traverse inside items
    }
    
    // Continue traversing
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], [...path, `[${i}]`]);
      }
    } else {
      for (const [k, v] of Object.entries(node)) {
        traverse(v, [...path, k]);
      }
    }
  }
  
  traverse(root);
  return items;
}

// -------------------- Scoring --------------------

const compileRegexList = (arr) => {
  return arr.map(item => {
    if (item instanceof RegExp) return item;
    if (typeof item === "string") return new RegExp(item, "i");
    return null;
  }).filter(Boolean);
};

function countHits(attrs, regexList) {
  if (!Array.isArray(attrs) || !Array.isArray(regexList)) return 0;
  
  let hits = 0;
  for (const attr of attrs) {
    for (const regex of regexList) {
      if (regex && regex.test(attr)) {
        hits++;
        break; // Count each attribute only once
      }
    }
  }
  return hits;
}

function qualifiesWithPools(item, rx1, rx2, rx3, minHits = 1) {
  const s1 = countHits(item.pool1_attributes || [], rx1);
  const s2 = countHits(item.pool2_attributes || [], rx2);
  const s3 = countHits(item.pool3_attributes || [], rx3);
  const total = s1 + s2 + s3;
  const ok = (s1 >= minHits && s2 >= minHits && s3 >= minHits);
  
  return { s1, s2, s3, total, ok };
}

// -------------------- Main Analysis Function --------------------

export function analyzeUeSaveJson(jsonText, options = {}) {
  const {
    slot1 = DEFAULT_SLOT1,
    slot2 = DEFAULT_SLOT2,
    slot3 = DEFAULT_SLOT3,
    includeWeapons = false,
    showClose = true,
    closeMinTotal = 2,
    minHits = 1,
    debug = false
  } = options;
  
  // Parse JSON if string
  const data = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
  
  // Compile regex patterns
  const rx1 = compileRegexList(slot1);
  const rx2 = compileRegexList(slot2);
  const rx3 = compileRegexList(slot3);
  
  // Find all item structures
  const itemStructs = walkJson(data);
  
  if (debug) {
    console.log(`Found ${itemStructs.length} item structures`);
  }
  
  const results = [];
  const close = [];
  
  // Process each item
  for (let i = 0; i < itemStructs.length; i++) {
    const itemStruct = itemStructs[i];
    const item = processItemStruct(itemStruct);
    
    // Filter out weapons if requested
    if (!includeWeapons && isWeaponType(item.item_type)) {
      continue;
    }
    
    if (debug && i < 3) {
      console.log(`Item ${i}:`, item);
    }
    
    // Score the item
    const scores = qualifiesWithPools(item, rx1, rx2, rx3, minHits);
    
    const itemResult = {
      name: item.generated_name || item.item_row || "(unknown)",
      type: item.item_type,
      s1: scores.s1,
      s2: scores.s2,
      s3: scores.s3,
      total: scores.total,
      item: item
    };
    
    if (scores.ok) {
      results.push(itemResult);
    } else if (showClose && scores.total >= closeMinTotal) {
      close.push(itemResult);
    }
  }
  
  return { 
    hits: results, 
    close: close,
    totalItems: itemStructs.length
  };
}
