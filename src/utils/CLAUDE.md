# Utils Guide

Core logic for save file parsing, filtering, and display.

## File Overview

| File | Purpose | Main Exports |
|------|---------|--------------|
| `wasm.js` | WASM module bridge | `initWasm()`, `convertSavToJson()` |
| `dwarfFilter.js` | Item filtering engine | `analyzeUeSaveJson()` |
| `equipmentParser.js` | Equipment extraction | `extractEquippedItems()`, `mapItemsToSlots()` |
| `attributeDisplay.js` | Friendly stat names | `getDisplayName()`, `formatAttributeValue()` |
| `statBuckets.js` | Stat override definitions | `STAT_TYPES`, `BUCKET_DEFINITIONS`, helpers |
| `platform.js` | Browser detection | `getPlatformInfo()` |
| `sound.js` | Audio notifications | `playMatchSound()` |

## wasm.js - WASM Bridge

Handles WebAssembly module for .sav parsing.

```js
import { initWasm, convertSavToJson } from './utils/wasm';

// Initialize once (promise is cached)
await initWasm();

// Convert file bytes to JSON
const jsonString = convertSavToJson(uint8Array);
const data = JSON.parse(jsonString);
```

**Key details:**
- Lazy loads `uesave-wasm` module
- Promise caching prevents duplicate initialization
- WASM module pre-built in `uesave-wasm/pkg/`

## dwarfFilter.js - Filtering Engine

Core filtering logic for attribute search.

```js
import { analyzeUeSaveJson } from './utils/dwarfFilter';

const results = analyzeUeSaveJson(saveJson, filterPatterns);
// Returns: { matches: [], nearMisses: [], stats: {} }
```

**Scoring system:**
- Items have 3 attribute pools
- Each pool scored: 0, 1, or 2+ matches
- **Match**: 1+ in Pool1 AND Pool2 AND Pool3
- **Near Miss**: 2+ total matches but missing a pool

**Pattern format:**
- Comma-separated list
- `*` converted to `.*` regex
- Case-insensitive
- Example: `Fiery*Damage, Wisdom, \bLifeSteal\b`

**Important functions:**
- `parseFilterPatterns(filterString)` - Converts input to regex array
- `scoreItem(item, patterns)` - Calculates pool scores
- `categorizeResults(items)` - Splits into matches/nearMisses

## equipmentParser.js - Equipment Extraction

Parses equipped items from save data.

```js
import { extractEquippedItems, mapItemsToSlots } from './utils/equipmentParser';

// Get all equipped items
const items = extractEquippedItems(saveJson);

// Map to slot layout for Character panel
const slots = mapItemsToSlots(items);
```

**Slot types:**
```js
const SLOT_TYPES = [
  'head', 'chest', 'hands', 'pants', 'boots',
  'neck', 'bracer', 'ring1', 'ring2',
  'relic', 'weapon', 'fossil',
  'belt', 'goblet', 'horn', 'trinket'
];
```

**Pattern matching:**
Uses `SLOT_PATTERNS` object to classify items by row name patterns.

## attributeDisplay.js - Display Names

Maps internal attribute paths to human-readable names.

```js
import { getDisplayName, formatAttributeValue } from './utils/attributeDisplay';

getDisplayName('AddedAttributeValue.Magery.MageryCriticalDamage');
// Returns: "Magery Critical Damage"

formatAttributeValue('AddedAttributeValue.Wisdom', 15);
// Returns: "+15 Wisdom"
```

**Adding new attributes:**
```js
// In ATTRIBUTE_NAMES object:
'AddedAttributeValue.NewStat.SubPath': 'Display Name',
```

**Categories covered:**
- Weapon damage types (Magery, Mauls, Archery, etc.)
- Character stats (Strength, Dexterity, Wisdom, Vitality)
- Resistances and currencies
- Critical chance/damage
- Life steal variants

## statBuckets.js - Stat Type Definitions

Defines available stat types for the item editor dropdown.

```js
import { STAT_TYPES, getStatType } from './utils/statBuckets';
```

**STAT_TYPES:** Array of available stat types (18 stats across 4 categories):
```js
{ id: 'strength', name: 'Strength', category: 'attributes', defaultValue: 0 }
{ id: 'critChance', name: 'Critical Chance', category: 'offense', isPercent: true }
```

**Categories:**
- `attributes`: Strength, Dexterity, Wisdom, Vitality
- `offense`: Physical/Magery Damage, Crit Chance/Damage, Attack Speed
- `defense`: Armor, Health, Health Regen, Evasion, Block Chance
- `resistances`: Fire, Cold, Lightning, Poison Resistance

**Helper functions:**
- `getStatType(id)` - Get stat definition by ID
- `getStatTypesByCategory(category)` - Get all stats in a category

**Adding a new stat type:**
Add entry to `STAT_TYPES` array:
```js
{ id: 'newStat', name: 'New Stat', category: 'offense', defaultValue: 0, isPercent: false }
```

## platform.js - Browser Detection

Feature detection for platform-specific UI.

```js
import { getPlatformInfo } from './utils/platform';

const platform = getPlatformInfo();
// Returns: { name: 'Chrome', icon: '🌐', supportsDirectoryPicker: true }
```

**Detection logic:**
- Checks `showDirectoryPicker` API support
- Identifies Safari, Firefox, Chromium
- Returns platform name and emoji icon

## sound.js - Audio

Web Audio API notification sound.

```js
import { playMatchSound } from './utils/sound';

// Plays 760Hz sine wave beep
playMatchSound();
```

**Behavior:**
- Silent fail if audio unavailable
- Used when filter finds matches
- Short beep duration

## Common Modifications

### Add attribute display name
In `attributeDisplay.js`:
```js
ATTRIBUTE_NAMES = {
  // existing...
  'AddedAttributeValue.NewCategory.NewStat': 'New Stat Name',
};
```

### Add equipment slot type
In `equipmentParser.js`:
1. Add to `SLOT_TYPES` array
2. Add pattern to `SLOT_PATTERNS` object:
```js
SLOT_PATTERNS = {
  // existing...
  newslot: /Pattern.*ToMatch/i,
};
```

### Change filter defaults
In `FilterTab.jsx`:
```js
const DEFAULT_FILTERS = 'Pattern1, Pattern2, Pattern3';
```

### Add new filter scoring tier
In `dwarfFilter.js`, modify `categorizeResults()` function.

## Data Flow

```
.sav file (bytes)
    ↓ wasm.js
JSON string
    ↓ JSON.parse()
Save object
    ↓ equipmentParser.js
Equipped items array
    ↓ dwarfFilter.js (for Filter tab)
Matches & near misses
    ↓ attributeDisplay.js
Human-readable display
```
