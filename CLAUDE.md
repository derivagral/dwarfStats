# DwarfStats - AI Assistant Guide

Browser-based tool for analyzing Unreal Engine 5 save files (`.sav` format). Converts saves to JSON and provides character inventory viewing and attribute filtering.

**Live:** https://derivagral.github.io/dwarfStats/

## Tech Stack

- React 18.2 with Vite 5.0
- WebAssembly (uesave-wasm) for .sav parsing
- CSS with dark/light theme support
- GitHub Pages deployment

## Quick Reference

```bash
npm install     # Install dependencies
npm run dev     # Development server with HMR
npm run build   # Production build to dist/
```

## Project Structure

```
src/
├── components/          # React components by feature
│   ├── common/          # Reusable UI (TabNavigation, Button, DropZone)
│   ├── upload/          # File upload tab
│   ├── character/       # Equipment/inventory display tab
│   ├── filter/          # Attribute search/filtering tab
│   └── items/           # Items browsing tab
├── hooks/               # Custom React hooks
├── models/              # Clean data models (Item, transformers)
├── utils/               # Core logic (parsing, filtering, WASM)
├── styles/              # CSS with theme variables
├── App.jsx              # Main app, tab routing, state
└── main.jsx             # React entry point
uesave-wasm/pkg/         # Pre-built WASM module (do not modify)
```

## Key Files to Review

| When working on... | Review these files |
|-------------------|-------------------|
| Tab navigation/routing | `src/App.jsx`, `src/components/common/TabNavigation.jsx` |
| Adding a new tab | `src/App.jsx` (TABS array), existing tab components |
| File upload/processing | `src/hooks/useFileProcessor.js`, `src/utils/wasm.js` |
| Item filtering logic | `src/utils/dwarfFilter.js`, `src/utils/itemFilter.js` |
| Affix list for filters | `src/utils/affixList.js` |
| Item data model | `src/models/Item.js`, `src/models/itemTransformer.js` |
| Central item store | `src/hooks/useItemStore.js` |
| Monogram/modifier registry | `src/utils/monogramRegistry.js` |
| Monogram calculation configs | `src/utils/monogramConfigs.js` |
| Derived stats calculations | `src/utils/derivedStats.js`, `src/hooks/useDerivedStats.js` |
| Equipment slot mapping | `src/utils/equipmentParser.js` |
| Attribute display names | `src/utils/attributeDisplay.js` |
| Styling/theming | `src/styles/index.css` |

## Tab Architecture

Tabs defined in `App.jsx` TABS array:
```jsx
{ id: 'upload', label: 'Upload', icon: '📁' }
{ id: 'character', label: 'Character', icon: '🧙' }
{ id: 'filter', label: 'Filter', icon: '🔍' }
{ id: 'items', label: 'Items', icon: '🎒' }
```

**To add a new tab:**
1. Create folder `src/components/newtab/` with `NewTab.jsx` and `index.js`
2. Add entry to TABS array in `App.jsx`
3. Add render condition in `App.jsx` return block
4. Update `disabledTabs` logic if tab requires `saveData`

## State Flow

```
App.jsx (state holder)
├── activeTab       → Current tab ID
├── saveData        → Parsed .sav JSON (backward compatibility)
├── itemStore       → Central item store (useItemStore hook)
│   ├── equipped[]        → Item model format
│   ├── inventory[]       → All items from save
│   ├── equippedSlotMap   → Items by slot key
│   └── metadata          → Filename, load time
├── status/statusType → UI feedback messages
├── logs            → Debug log buffer
└── wasmReady       → WASM initialization flag

Tab callbacks:
- onFileLoaded(data) → Sets saveData, loads itemStore, switches to Character tab
- onClearSave()      → Clears saveData and itemStore, returns to Upload tab
- onLog(msg)         → Adds to log buffer
- onStatusChange(msg, type) → Updates status bar
```

## Save File Processing Pipeline

1. **Upload** → File selected via drag/drop or picker
2. **Validate** → Check `.sav` extension
3. **Convert** → WASM `to_json()` converts bytes to JSON
4. **Parse** → `JSON.parse()` result
5. **Transform** → `extractEquippedItems()` uses `transformItem()` to create unified Item models
6. **Display** → All UI reads from Item model, not raw save data

## Unified Item Model

All items use the same data model defined in `src/models/Item.js`:

```javascript
{
  id: string,           // Unique identifier
  displayName: string,  // Human-readable name
  type: string,         // Item type (Armor, Weapon, etc.)
  rowName: string,      // Original row name from save
  baseStats: [          // Array of stat objects
    { stat: string, value: number, rawTag: string }
  ],
  monograms: [          // Applied monogram modifiers
    { id: string, value: number }
  ],
  slot: string,         // Equipment slot (added by equipmentParser)
}
```

### Data Flow Architecture

```
Save File (.sav)
    │
    ▼
WASM Parser (to_json)
    │
    ▼
extractEquippedItems() ──► transformItem() ──► Item[]
    │
    ▼
CharacterPanel / ItemsTab (reads Item model)
    │
    ▼
useDerivedStats (aggregates baseStats, applies overrides)
    │
    ▼
Calculation Engine (layer-based stat calculation)
    │
    ▼
StatsPanel (displays final values)
```

### Key Principle
The save file is an "import shortcut" - all UI components work from the internal Item model, never from raw save data. This enables:
- Consistent tooltip rendering across Character and Items tabs
- Item comparison features
- What-if stat calculations
- Override/modification tracking

## Platform-Specific Features

| Feature | Chromium (Chrome/Edge) | Firefox/Safari |
|---------|----------------------|----------------|
| Drag & drop | Yes | Yes |
| File picker | Yes | Yes |
| Folder picker | Yes (`showDirectoryPicker`) | No |
| Directory watching | Yes (10s polling) | No |

Detection in `src/utils/platform.js`.

## Patterns & Conventions

- **Component folders**: Each has `index.js` for clean imports
- **Custom hooks**: Reusable logic in `src/hooks/`
- **No Redux**: Props/callbacks for state management
- **CSS variables**: Theme colors in `src/styles/index.css`
- **Memoization**: `useCallback` for event handlers
- **WASM loading**: Lazy with promise caching in `wasm.js`

## Common Tasks

### Adding an attribute display name
Edit `src/utils/attributeDisplay.js` - add mapping to `ATTRIBUTE_NAMES` object.

### Adding a new equipment slot
Edit `src/utils/equipmentParser.js` - update `SLOT_PATTERNS` and slot type handling.

### Changing filter defaults
Edit `src/components/filter/FilterTab.jsx` - modify `DEFAULT_FILTERS` constant.

### Modifying tooltip behavior
Edit `src/components/character/ItemDetailTooltip.jsx` - handles edge detection and positioning.

## Derived Stats Calculation Engine

Layer-based calculation system in `src/utils/derivedStats.js`:

```
Layer 0: BASE         - Raw stats from items (computed by useDerivedStats)
Layer 1: TOTALS       - Base + bonus% calculations (totalStrength, totalHealth, etc.)
Layer 2: PRIMARY      - First derived values (monogram buffs, stack effects)
Layer 3: SECONDARY    - Chained calculations (essence → crit, element from crit)
Layer 4: TERTIARY     - Final chains (life from element, damage from life)
```

### Adding a new derived stat
1. Add definition to `DERIVED_STATS` in `src/utils/derivedStats.js`
2. Specify `layer`, `dependencies`, `calculate()`, and `format()`
3. If triggered by monogram, add entry to `MONOGRAM_CALC_CONFIGS` in `src/hooks/useDerivedStats.js`

### Monogram calculation configs
Located in `src/hooks/useDerivedStats.js` - `MONOGRAM_CALC_CONFIGS`:

```javascript
'MonogramId': {
  effects: [
    { derivedStatId: 'statName', config: { enabled: true, ...overrides } },
  ],
}
```

Key monogram chains:
- **Phasing** (helmet, 50 stacks): +1% damage, +0.5% boss damage per stack
- **Bloodlust** (helmet, 100 stacks): +5% crit damage, +3% AS, +1% MS per stack
- **Dark Essence** (amulet, 500 stacks): Essence = highestStat × 1.25
- **Life Buff** (amulet, 100 stacks): +1% life per stack
- **ElementForCritChance** (helmet): +3% element per 1% crit over 100%
- **ElementalToHp%.Fire** (ring): +2% life per 30% fire damage
- **GainDamageForHPLoseArmor** (bracer): +1% life as flat damage

### Slot monogram pools
Defined in `SLOT_MONOGRAMS` in `src/utils/monogramRegistry.js`:
- head, amulet, bracer, boots, pants, relic, ring

## Testing

Run tests with vitest:
```bash
npm test           # Watch mode
npm run test:run   # Single run
npm run test:coverage  # With coverage report
```

### Test Structure
- `test/derivedStats.test.js` - Calculation engine tests
- `test/itemFilter.test.js` - Item filtering/scoring tests
- `test/itemTransformer.test.js` - Save file parsing tests

### Key Testable Modules
| Module | Pure Functions | Notes |
|--------|----------------|-------|
| `derivedStats.js` | `calculateDerivedStats()`, `getCalculationOrder()` | Layer-based calculations |
| `itemFilter.js` | `filterInventoryItems()`, `scoreItemPools()` | Pattern matching |
| `itemTransformer.js` | `transformItem()`, `transformAllItems()` | Save file parsing |

## Test Fixtures

Located in `test/fixtures/`:
- `monograms_data.json` - Sample monogram data from save files
- `learned_ring_monograms.json` - Ring modifier data (LearnedRingModifiers_0)
- `dr-full-inventory.json` - Complete parsed save file (~7.8MB) with full character data
- `dr-extracted-items.json` - Focused fixture with 16 equipped, 1 hotbar, 50 inventory items

## Deployment

GitHub Actions workflow in `.github/workflows/static.yml`:
1. Installs dependencies
2. Runs `npm run build`
3. Deploys `dist/` to GitHub Pages

Push to `main` triggers deployment automatically.
