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
├── models/              # Clean data models (Item, SkillTree, transformers)
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
| URL sharing / encoding | `src/utils/shareUrl.js` |
| Item data model | `src/models/Item.js`, `src/models/itemTransformer.js` |
| Central item store | `src/hooks/useItemStore.js` |
| Monogram/modifier registry | `src/utils/monogramRegistry.js` |
| Monogram calculation configs | `src/utils/monogramConfigs.js` |
| Derived stats calculations | `src/utils/derivedStats.js`, `src/hooks/useDerivedStats.js` |
| Equipment slot mapping | `src/utils/equipmentParser.js` |
| Attribute display names | `src/utils/attributeDisplay.js` |
| Skill tree data model | `src/models/SkillTree.js` |
| Skill tree extraction | `src/utils/skillTreeParser.js` |
| Skill/card/keystone registry | `src/utils/skillTreeRegistry.js` |
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
├── sharedFilterModel → Decoded filter from URL hash (consumed once)
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
6. **Filter** → Filter tab excludes equipped items (matched by `rowName`) from search results
7. **Display** → All UI reads from Item model, not raw save data. Slot labels inferred via `inferEquipmentSlot()`

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
Edit `src/utils/equipmentParser.js` - update `SLOT_MAPPING`, `SLOT_LABELS`, and keyword patterns.

Slot utilities exported from `equipmentParser.js`:
- `inferEquipmentSlot(rowName)` - guess slot from any item row name (returns `'unknown'` if unrecognized)
- `formatSlotLabel(slotKey)` - convert slot key to display label (`'head'` → `'Head'`)

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
Layer 5: EDPS         - eDPS calculation buckets and final damage numbers
```

### eDPS Calculation (Layer 5)

Effective DPS calculation assuming 100% crit, ignoring IAS. Stats in `derivedStats.js` with `category: 'edps'`/`'edps-result'`, displayed in StatsPanel under "eDPS".

**Formula (Left Click / Q / R):**
```
Normal:  FLAT × (CHD + DB + SD) × SCHD × WAD × EMulti = DD
Boss:    DD × BD
Offhand: DD × (AD + AFFIN) × ED
```

**Stat IDs → Formula Terms:**

| Term | Stat ID | Source | Notes |
|------|---------|--------|-------|
| FLAT | `edpsFlat` | totalDamage + damageFromHealth + monograms | Primary attributes do NOT feed flat damage |
| CHD + DB + SD | `edpsAdditiveMulti` | critDamage + damageBonus + auto-detected stance + monogram dmg% | Auto-picks highest stance; S3.5 additive bucket |
| SCHD | `edpsSCHD` | Auto-detected stance crit damage + bloodlust crit + crit from armor | Standalone multiplier since S4.0 |
| WAD | `edpsWAD` | Config: primary=200%, secondary=400% | `useSecondary` toggle; `wadBonus` for monogram additions |
| EMulti | `edpsEMulti` | classWeaponBonus (manual) × distance procs × shroud flat% | Independent multipliers multiply together |
| BD | `edpsBD` | bossBonus (gear) + phasing boss dmg | Separate boss/elite multiplier |
| ED | `edpsED` | fire + arcane + lightning + elemFromCrit + mine monograms | All sources additive then applied as multiplier |
| AD + AFFIN | `edpsAD` | Config: abilityDamage (skill%), affinityDamage (tree) | Manual input until skill tree data available |

**Result Stats:**
- `edpsDDNormal` — Hit damage vs normal mobs
- `edpsDDBoss` — Hit damage vs boss/elite
- `edpsOffhandNormal` — Offhand damage vs normal
- `edpsOffhandBoss` — Offhand damage vs boss

**Configurable via overrides:** `edpsWAD` (primary/secondary toggle, wadBonus), `edpsAD` (ability + affinity), `edpsEMulti` (classWeaponBonus).

**Stance detection:** `inferWeaponStance(rowName)` in `equipmentParser.js` maps weapon keywords to stance prefixes. `useDerivedStats` auto-detects stance from the equipped weapon's row name and passes it to eDPS calcs via config override. Falls back to highest-stat heuristic if no weapon detected.

**Primary Attribute Mappings (NOT balanced, do not assume 1:1):**
| Attribute | Known Effect | Status |
|-----------|-------------|--------|
| STR | Armor bonus | Confirmed |
| DEX | Crit Chance | Confirmed |
| WIS | (TBD) | Needs testing |
| VIT | Health | Confirmed |
| END | (TBD) | Needs testing |
| AGI | Move Speed / Dodge | Likely |
| LCK | (TBD) | Needs testing |
| STA | (TBD) | Needs testing |

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

## Skill Tree System

Save data at `HostPlayerData_0.Struct.Struct.CharacterSkills_77_*` contains 4 skill categories:

| Category | DataTable Discriminator | ID Style | Levels |
|----------|------------------------|----------|--------|
| Main Passive Tree | `DT_GENERATED_SkillTree_Main` | Opaque (`UI_SkillTreeNode_Small_624`) | All 1 |
| Weapon Stance (8 types) | `DT_Skills_{Weapon}` | Descriptive (`SpearCritDamage`) | 1, paragon to 732 |
| Crystal Cards | `DT_Crystal_Cards_Skills` | `CARD{N}_{variant}` | 1, 2, 3, 6 |
| Crafting/Elven | `DT_Skills_Crafting_S24` | Descriptive (`Armor_Health%`) | 1-177 |

### Key files
- `src/models/SkillTree.js` - Data model, factory, helpers
- `src/utils/skillTreeParser.js` - `extractSkillTree(saveData)` extracts + categorizes
- `src/utils/skillTreeRegistry.js` - Four registries:
  - `WEAPON_SKILL_REGISTRY` - 94 weapon stance entries mapped to stat effects
  - `CRAFTING_SKILL_REGISTRY` - 40 crafting/elven entries mapped to branches
  - `CARD_REGISTRY` - 16 card entries (skeleton, effects TBD)
  - `TREE_KEYSTONES` - Manually curated main-tree keystones (proximity, mastery, affinity, utility)

### Main tree keystones (user-input checklist)
Opaque node IDs can't be auto-detected. `TREE_KEYSTONES` provides a checklist of notable effects that overlap with monograms or grant unique bonuses:
- Close/Far Distance (proximity damage), Melee/Ranged Mastery (damage/armor)
- Fire/Arcane/Lightning Affinity (CDR ~35%, damage ~100% additive)
- Extra inventory slots, extra potions

### TODO: Card registry
Card effects need population. Cards have L1/L2/L3 base stats; L6 doubles L3 and removes from further choice. Currently stored as skeleton entries with empty effects arrays.

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
- `test/shareUrl.test.js` - URL sharing encode/decode tests
- `test/skillTreeParser.test.js` - Skill tree parsing/registry tests

### Key Testable Modules
| Module | Pure Functions | Notes |
|--------|----------------|-------|
| `derivedStats.js` | `calculateDerivedStats()`, `getCalculationOrder()` | Layer-based calculations |
| `itemFilter.js` | `filterInventoryItems()`, `scoreItemPools()` | Pattern matching |
| `itemTransformer.js` | `transformItem()`, `transformAllItems()` | Save file parsing |
| `shareUrl.js` | `encodeFilterShare()`, `decodeFilterShare()`, `parseShareFromHash()` | URL sharing |
| `skillTreeParser.js` | `extractSkillTree()`, `categorizeSkill()` | Skill tree extraction |
| `skillTreeRegistry.js` | `getWeaponSkillDef()`, `getCraftingSkillDef()`, `getCardDef()` | Skill/card/keystone lookups |

## Test Fixtures

Located in `test/fixtures/`:
- `monograms_data.json` - Sample monogram data from save files
- `learned_ring_monograms.json` - Ring modifier data (LearnedRingModifiers_0)
- `dr-full-inventory.json` - Complete parsed save file (~7.8MB) with full character data
- `dr-extracted-items.json` - Focused fixture with 16 equipped, 1 hotbar, 50 inventory items
- `dr-character-skills.json` - CharacterSkills array + metadata (381 skills, weapon XP, skill points)

## URL Sharing

Hash-based URL sharing for filter profiles (extensible to other share types).

### Format
```
https://derivagral.github.io/dwarfStats/#filter=<base64url-encoded-json>
```

Each share type uses a separate hash key (`filter`, `character` in future), decoded independently in `App.jsx`.

### Compact Encoding
`src/utils/shareUrl.js` encodes FilterModel into compact JSON with short keys, then base64url-encodes it:

```json
{
  "v": 1,                                          // schema version
  "n": "Build Name",                               // profile name (omitted if default)
  "a": ["strength", "critChance"],                  // affix IDs
  "m": [["Bloodlust.Base", null]],                  // monogram tuples (omitted if empty)
  "o": { "h": 2, "t": 3 }                          // non-default options only
}
```

Options keys: `h`=minHitsPerPool, `c`=closeMinTotal, `w`=includeWeapons, `t`=minTotalMonograms.

### Flow
- **Share**: FilterConfig "Share" button → `encodeFilterShare()` → `buildShareUrl()` → clipboard
- **Load**: App mount → `parseShareFromHash()` → `decodeFilterShare()` → passed to FilterTab as `sharedFilterModel` prop → consumed once, config panel auto-opens
- When a shared filter is loaded without save data, the Filter tab is enabled so users can see the configuration before uploading a save

### Adding a new share type
1. Add encode/decode functions to `src/utils/shareUrl.js`
2. Add hash type handling in `App.jsx` mount effect
3. Pass decoded state to the target tab component

## Deployment

GitHub Actions workflow in `.github/workflows/static.yml`:
1. Installs dependencies
2. Runs `npm run build`
3. Deploys `dist/` to GitHub Pages

Push to `main` triggers deployment automatically.

## Integration TODOs

### Skill Tree / Affinity Data
- **AFFIN** (affinity damage from skill tree): Currently manual config in `edpsAD`. Need to parse skill tree data from save or provide UI input.
- Skill tree also provides **racial bonuses** — broad damage/crit damage totals that feed into eDPS buckets.
- Affinities contribute to AD (offhand ability damage) and potentially to other buckets.

### Ability Damage (AD)
- AD exists on offhand items as skill damage affixes (gear `DamageMultiplier` stats).
- Per-ability multipliers are already parsed as `displayOnly` stats in `statRegistry.js` (chainLightningDamage, fireballDamage, etc.).
- These could feed into `edpsAD` once we know which offhand is active.
- Skill-specific interactions are intentionally deferred — current goal is "sum of item/tree based stats" for build comparison.

### Void Ring / Special Weapon Interactions
- Unholy Void ring mod with health regen affects the Void's WAD (normally 100% base, not the standard 200%/400%).
- Void disables other abilities — would need special WAD handling.
- These edge cases can use config overrides for now.

### Attribute → Stat Mappings
- Primary attributes are NOT balanced and do NOT all map to damage.
- Known: STR→Armor, DEX→Crit, VIT→Health. Others TBD.
- Once confirmed, these can feed into appropriate eDPS buckets or defense calcs.

### WAD Monogram Bonuses
- Various monograms add to WAD (weapon ability damage multiplier).
- Real values are slightly less than listed. Fine for now; can refine later.
- Currently handled via `wadBonus` config on `edpsWAD`.
