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
| URL sharing / encoding | `src/utils/shareUrl.js`, `src/utils/shareCodec.js` |
| Character data sharing | `src/models/CharacterShareModel.js` |
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

### eDPS Calculation (Layer 5) — Ele/Phys Split

Effective on-hit calculation assuming 100% crit, ignoring IAS. Since the
ele/phys damage split, damage is **two independent pipelines** — physical and
elemental — each starting from its own flat base pool. Stats in `derivedStats.js`
with `category: 'edps'`/`'edps-result'`, displayed in StatsPanel under "eDPS".

**Formulae:**
```
Physical  = BasePhys × (StanceCritDmg + CritDmg + PhysDmgBonus + StanceDmg + both-types%) × SkillMult × EMulti  (× BD for boss)
Elemental = BaseElem × (OffhandItemBonus + SkillMult + Affinity + both-types%) × ED × OffhandMods             (× BD for boss)
```

Key structural points (vs the pre-split single-line model):
- **Flat is split**: `edpsPhysFlat` (raw `Base.Damage`) vs `edpsElemFlat`
  (`Base.ElementalDamage`, new stat). Both roll on items now. Physical flat uses
  the RAW `damage` stat, not `totalDamage`, because the damage bonus% lives in the
  additive bucket (using `totalDamage` would double-count it).
- **SCHD is merged** into the physical additive bucket (`edpsPhysAdditive`) — no
  standalone stance-crit multiplier anymore.
- **Elemental is fully independent** — it does NOT multiply through the physical
  hit. It starts from `edpsElemFlat`.
- **Skill multipliers** default per-skill: Left/Primary 200%, Q 150%, R 200%
  (config `multiplier` on each result stat).
- **"Both damage types"** monogram bonuses feed `edpsBothTypesDamageBonus`, which
  is added into BOTH additive buckets.
- **Fire/Arcane/Lightning%** stay elemental-only (`edpsED`).
- **OffhandMods** (`edpsOffhandMods`, skill-specific extra multipliers) defaults to 1.
- **OffhandItemBonus** = total offhand/ability damage% from items (auto from
  `damageMultiplier` aggregate + manual `offhandItemBonus` config).

**Stat IDs → Formula Terms:**

| Term | Stat ID | Source |
|------|---------|--------|
| BasePhys | `edpsPhysFlat` | raw `damage` + damageFromHealth + statDamageFlat + paragon + flat monograms |
| BaseElem | `edpsElemFlat` | `elementalDamage` + damageFromHealth + statDamageFlat + paragon + energy→elem + essence→elem |
| Phys bucket | `edpsPhysAdditive` | StanceCrit + Crit + PhysDmg% + StanceDmg + bloodlust/armor crit + phys monograms + both-types |
| Elem bucket | `edpsElemAdditive` | item offhand% + affinity + both-types (skill mult added per skill) |
| both-types% | `edpsBothTypesDamageBonus` | phasing + shroud + highestStat + dmgPerStat2 + phasingDuration + essence(2%/10) |
| ED | `edpsED` | fire + arcane + lightning + elemFromCrit + mines + new elemental monograms |
| ElemCrit | `edpsElemCrit` | 1 + regular crit dmg + stance crit dmg (provisional elemental crit bucket) |
| BD | `edpsBD` | bossBonus (gear) + phasing boss dmg |
| EMulti | `edpsEMulti` | classWeapon × distance procs × shroud flat% (physical line) |
| OffhandMods | `edpsOffhandMods` | skill-specific extra multiplier (default 1) |

Elemental on-hit now multiplies through `edpsElemCrit` as well:
`BaseElem × (ElemBucket + SkillMult) × ED × ElemCrit × OffhandMods`. The crit
bucket exists because offhand abilities can now crit at 10% of crit chance; the
exact weighting is unconfirmed, so `edpsElemCrit.offhandCritFactor` (default 1)
is the hook for it.

**Elemental→Physical conversion monograms** ("gain 75% of elemental … as physical
… you can no longer deal elemental damage"):
- `edpsPhysFlat.elemToPhysFlatRatio` adds that fraction of `edpsElemFlat` into physical flat.
- `edpsPhysAdditive.elemBonusToPhysRatio` adds that fraction of `(edpsED − 1)` into physical additive.
- `elementalDisabled` (set by the same monograms) forces the elemental on-hit results to 0.
  Raw `edpsElemFlat`/`edpsED` still compute so the conversion can read pre-disable values.

**Attack speed:** `effectiveAttackSpeed` (display only — eDPS stays IAS-independent)
applies the new rule: all AS bonuses at 50% effectiveness, capped at 300%. Prior
cap was a logarithmic ~79%; the new IAS→DPS curve is unconfirmed so it does not
fold into eDPS yet.

**Result Stats (per-skill on-hit, normal value; boss in tooltip):**
- `edpsPhysPrimary` / `edpsPhysQ` / `edpsPhysR` — physical on-hit (Left/Q/R)
- `edpsElemPrimary` / `edpsElemQ` / `edpsElemR` — elemental on-hit (Left/Q/R)

**Configurable via overrides:** result-stat `multiplier` (skill %), `edpsElemAdditive`
(offhandItemBonus + affinity), `edpsEMulti` (classWeaponBonus), `edpsOffhandMods` (multiplier),
`edpsElemCrit` (offhandCritFactor), `edpsPhysFlat`/`edpsPhysAdditive` (elem→phys conversion ratios).

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
- `test/shareUrl.test.js` - URL sharing encode/decode tests (filter)
- `test/characterShare.test.js` - Character sharing codec/round-trip tests
- `test/skillTreeParser.test.js` - Skill tree parsing/registry tests

### Key Testable Modules
| Module | Pure Functions | Notes |
|--------|----------------|-------|
| `derivedStats.js` | `calculateDerivedStats()`, `getCalculationOrder()` | Layer-based calculations |
| `itemFilter.js` | `filterInventoryItems()`, `scoreItemPools()` | Pattern matching |
| `itemTransformer.js` | `transformItem()`, `transformAllItems()` | Save file parsing |
| `shareUrl.js` | `encodeFilterShare()`, `decodeFilterShare()`, `encodeCharacterShare()`, `decodeCharacterShare()` | URL sharing |
| `shareCodec.js` | `encodeIdOrString()`, `decodeIdOrString()` | Dictionary compression |
| `CharacterShareModel.js` | `createItemShare()`, `itemShareToItem()`, `createCharacterSharePayload()` | Character data round-trip |
| `skillTreeParser.js` | `extractSkillTree()`, `categorizeSkill()` | Skill tree extraction |
| `skillTreeRegistry.js` | `getWeaponSkillDef()`, `getCraftingSkillDef()`, `getCardDef()` | Skill/card/keystone lookups |

## Test Fixtures

Located in `test/fixtures/`. Kept lean — fixtures back current-season tests, not a
lifetime archive. Old unreferenced save dumps were pruned.
- `dr-full-inventory.json` - Complete parsed save file (~7.8MB) with full character data (parsing/extract/share/stance tests)
- `dr-character-skills.json` - CharacterSkills array + metadata (381 skills, weapon XP, skill points)
- `chaos-dual-bow-equipped.json` - Slim extracted equipped items from a dual-bow build; has both `Base.Damage` and `Base.ElementalDamage` flats (ele/phys split regression test)

## URL Sharing

Hash-based URL sharing for filter profiles and character builds.

### Format
```
https://derivagral.github.io/dwarfStats/#filter=<base64url-encoded-json>
https://derivagral.github.io/dwarfStats/#character=<base64url-encoded-json>
```

Each share type uses a separate hash key, decoded independently in `App.jsx` mount effect.

### Share Codec (`src/utils/shareCodec.js`)

String↔integer dictionary module that compresses known IDs to array indices for shorter URLs.
Dictionaries are built from existing registries at import time:

| Dictionary | Source Registry | Count |
|-----------|----------------|-------|
| `STAT_DICT` | `STAT_REGISTRY` (statRegistry.js) | ~88 |
| `MONOGRAM_DICT` | `MONOGRAM_REGISTRY` (monogramRegistry.js) | ~175 |
| `WEAPON_SKILL_DICT` | `WEAPON_SKILL_REGISTRY` (skillTreeRegistry.js) | ~94 |
| `KEYSTONE_DICT` | `TREE_KEYSTONES` (skillTreeRegistry.js) | ~14 |
| `SLOT_DICT` | Hard-coded (13 slots) | 13 |
| `WEAPON_TYPE_DICT` | `WEAPON_TYPE` (SkillTree.js) | 8 |

**Backwards compatibility:** Dictionary order = encoding. Source registries must be append-only (never reorder). `CODEC_VERSION` tracks breaking changes. Unknown IDs fall back to string storage for forward compatibility with new game content.

### Filter Share Encoding

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

### Character Share Encoding

`src/models/CharacterShareModel.js` converts equipped items + optional mastery data into a compact payload. Stat/monogram IDs are compressed to integers via `shareCodec.js`:

```json
{
  "v": 1,                                          // schema version
  "e": [                                           // equipped items
    {
      "sl": 0,                                     // slot (SLOT_DICT index)
      "rn": "Armor_Head_Zone_4_Tiger_Helm",        // row name (string, too many to enumerate)
      "ra": 3,                                     // rarity (omitted if 0)
      "ti": 42,                                    // tier (omitted if 0)
      "bs": [[0, 197.57], [16, 0.316]],            // baseStats [[statEnc, value], ...]
      "mg": [[7, 1]]                               // monograms [[monogramEnc, value], ...]
    }
  ],
  "sk": {                                          // mastery snapshot (omitted if none)
    "wt": 0,                                       // weapon type (WEAPON_TYPE_DICT index)
    "ws": [[0, 1], [8, 5]],                        // weapon skills [[skillEnc, level], ...]
    "ks": [0, 2]                                   // keystones [keystoneEnc, ...]
  }
}
```

**Stat values:** Raw decimals from save file. Percentages are stored as decimals (0.316 = 31.6%). Flat stats as-is (Armor = 197.57). No conversion — `useDerivedStats` already handles the raw format.

**URL size:** Full 17-item build ≈ 5,800 chars. Well within browser URL limits (~8KB safe, 2KB+ for older systems).

### Flow
- **Filter Share**: FilterConfig "Share" button → `encodeFilterShare()` → `buildShareUrl('filter', ...)` → clipboard
- **Filter Load**: App mount → `parseShareFromHash()` → `decodeFilterShare()` → passed to FilterTab as `sharedFilterModel` prop → consumed once, config panel auto-opens
- **Character Share**: (UI button TBD) → `createCharacterSharePayload()` → `encodeCharacterShare()` → `buildCharacterShareUrl()` → clipboard
- **Character Load**: App mount → `parseShareFromHash()` → `decodeCharacterShare()` → `itemStore.loadFromShare()` → navigates to Character tab
- When a shared filter is loaded without save data, the Filter tab is enabled so users can see the configuration before uploading a save
- When a shared character is loaded, only Character and Stats tabs are enabled (no inventory/filter data)

### Key Files

| File | Purpose |
|------|---------|
| `src/utils/shareCodec.js` | String↔int dictionaries, `encodeIdOrString`/`decodeIdOrString` |
| `src/models/CharacterShareModel.js` | `createItemShare`, `itemShareToItem`, `createMasteryShare`, `masteryShareToData`, `createCharacterSharePayload` |
| `src/utils/shareUrl.js` | `encodeCharacterShare`, `decodeCharacterShare`, `buildCharacterShareUrl`, plus existing filter functions |
| `src/hooks/useItemStore.js` | `loadFromShare(itemShares, masteryData)` — populates store from decoded share |

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

### Unconfirmed monogram save-tag IDs (engine wired, off by default)
These derived stats are implemented and unit-tested, but their real
`EasyRPG.Items.Modifiers.*` save-tag suffixes haven't been observed yet, so the
`MONOGRAM_CALC_CONFIGS` keys are descriptive placeholders. Rename the keys once a
save with the items is parsed; the calc wiring stays put. Append confirmed
mappings here as they land.

| Placeholder key | Derived stat(s) | Effect |
|-----------------|-----------------|--------|
| `BerserkerFury.ElementalForHighest` | `berserkerElementalFromHighest` | +5% elem per 30 highest (Berserker Fury) |
| `BerserkerFury.MaxDrDamage` | `berserkerMaxDrFlatDamage` | +100 physical at max DR |
| `ElementalDamage%ForEssence` | `elementalFromEssence` | +2% elem per 10 essence |
| `ElementalFlatForEssence` | `elementalFlatFromEssence` | +1.5 flat elem per 20 essence |
| `ElementalDamage%ForHighest` | `elementalFromHighest` | +1% elem per 40 highest |
| `Shroud.ElementalForHighest` | `shroudElementalFromHighest` | +0.15% elem per stack per 50 highest |
| `Phasing.DurationDamage` | `phasingDurationDamage` | +1% damage (both) per 10s phasing |
| `BonusDamage%ForEssence` / `Damage%ForEssence.HealthDrain` | `damageFromEssence` | +2% damage (both) per 10 essence |
| `ElementalToPhysical.Flat` | `edpsPhysFlat.elemToPhysFlatRatio` + `elementalDisabled` | 75% of elem flat → physical; elemental off |
| `ElementalToPhysical.Bonus` | `edpsPhysAdditive.elemBonusToPhysRatio` + `elementalDisabled` | 75% of elem bonus → physical; elemental off |

### Attack Speed (IAS) curve
- New rule: AS bonuses at 50% effectiveness, hard cap 300% (prior cap ~79% logarithmic).
- `effectiveAttackSpeed` surfaces the capped value but eDPS still ignores IAS — the
  IAS→DPS relationship is unknown. Fold into eDPS once the curve is confirmed.

### Elemental crit weighting
- Offhand abilities crit at 10% of crit chance. `edpsElemCrit` currently bakes the
  two crit-damage stats into a flat multiplier (`offhandCritFactor` default 1).
  Replace with the proper `0.1 × critChance` expected-value weighting once confirmed.

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
