# Filter Model Refactor Plan

## Current State Analysis

### Two Parallel Filter Paths (Problem)

The FilterTab currently maintains **two independent filtering pipelines**:

1. **Legacy path** (`dwarfFilter.js` → `analyzeUeSaveJson()`): Operates on raw JSON from the save file. Re-parses the entire JSON structure, walks the tree to find items, builds its own legacy `item` objects with `pool1_attributes`, `pool2_attributes`, etc. Used when processing newly dropped/picked `.sav` files (lines 50, 103 in FilterTab.jsx).

2. **Model path** (`itemFilter.js` → `filterInventoryItems()`): Operates on `itemStore.inventory` (already-transformed Item models). Used when the tab first loads and a save was already imported via Upload tab (line 85 in FilterTab.jsx).

Both paths ultimately produce `{ hits, close, totalItems }` with the same shape, but items from path 1 carry **legacy format** (`item_row`, `pool1_attributes`, etc.) while path 2 wraps Item models. The `ItemCard` component reads `item.item?.pool1_attributes` — the legacy nested format — so even path 2 items need that nested `.item` structure.

### FilterConfig Has Two Modes

`FilterConfig.jsx` line 14 has a mode toggle: `'picker'` (AffixSelector) vs `'regex'` (raw textarea). The picker converts affix selections to regex pattern strings via `affixIdsToFilterString()` and feeds them into the same regex pipeline. So the affix picker is just a regex generator — it doesn't use a structured filter model.

### What's Missing: Monograms

The affix list (`affixList.js` → `statRegistry.js`) only covers **stat affixes** (Strength, Crit, etc.). Monograms are a completely separate system:

- **`MONOGRAM_REGISTRY`** (~100 entries) has full definitions with display names, categories, descriptions
- **`SLOT_MONOGRAMS`** maps which monograms are valid per equipment slot
- The **Item model** stores `monograms[]` as separate entries: `{ id, value, rawTag }`
- **Duplicate monograms** (2x or 3x of same type) are stored as separate array entries — no deduplication or count tracking
- **No filtering support**: `itemFilter.js` and `dwarfFilter.js` never look at `item.monograms`, only at pool attributes
- **No UI for monogram filtering**: `AffixSelector` only shows stat affixes from `STAT_REGISTRY`

### Monogram Count Question

If an item has `[{id: 'Bloodlust.Base'}, {id: 'Bloodlust.Base'}]`, that's 2x Bloodlust. Currently:
- **Item model**: Stores both entries, no count field
- **Tooltip**: Renders both as separate lines (duplicate display)
- **Calculations** (`monogramConfigs.js`): Only checks `if monogram exists`, doesn't scale with count
- **Filter**: Doesn't consider monograms at all

## Proposed Changes

### Phase 1: Introduce a Structured Filter Model (this PR)

Replace the raw regex string approach with a proper filter model that both the UI and the filter engine consume directly.

#### 1. New `FilterModel` schema (`src/models/FilterModel.js`)

```javascript
/**
 * @typedef {Object} FilterModel
 * @property {string} id - Unique filter ID (uuid or slug)
 * @property {string} name - User-given name (e.g., "My Crit Build")
 * @property {AffixFilter[]} affixes - Stat affix criteria
 * @property {MonogramFilter[]} monograms - Monogram criteria
 * @property {FilterOptions} options - Scoring/threshold options
 */

/**
 * @typedef {Object} AffixFilter
 * @property {string} affixId - References STAT_REGISTRY key
 * @property {boolean} required - Must be present (vs nice-to-have)
 */

/**
 * @typedef {Object} MonogramFilter
 * @property {string} monogramId - References MONOGRAM_REGISTRY key
 * @property {number|null} minCount - Minimum instances (null = any, 2 = at least 2x)
 * @property {boolean} required - Must be present
 */

/**
 * @typedef {Object} FilterOptions
 * @property {number} closeMinTotal - Minimum total hits for "near miss"
 * @property {number} minHitsPerPool - Minimum hits per pool for "match"
 * @property {boolean} includeWeapons - Include weapon items
 */
```

This schema is designed to be serializable to JSON for localStorage/sharing later.

#### 2. Refactor `itemFilter.js` to accept `FilterModel`

- New function `filterByModel(items, filterModel)` that:
  - Converts `filterModel.affixes` to patterns internally (no regex exposed to callers)
  - Scores monograms: checks `item.monograms` for matching IDs and counts
  - Returns `{ hits, close, totalItems }` with enriched scoring (affix score + monogram score)

- Keep `compilePatterns()` and `countHits()` as internal helpers
- Deprecate but don't remove `filterInventoryItems()` yet (used by legacy path)

#### 3. Remove the regex mode from `FilterConfig`

- Remove the `'picker' | 'regex'` mode toggle
- `FilterConfig` works exclusively with the structured picker
- The picker output is a `FilterModel`, not a regex string
- Remove `DEFAULT_FILTERS` regex constant from `FilterTab.jsx`

#### 4. Add monogram selection to `AffixSelector` (or new `MonogramSelector`)

- Add a "Monograms" category section to the affix picker
- Source options from `MONOGRAM_REGISTRY` grouped by their existing categories (bloodlust, colossus, etc.)
- Each monogram toggle produces a `MonogramFilter` entry
- Optional count selector (1+, 2+, 3+) per monogram

#### 5. Wire FilterTab to use FilterModel exclusively

- Replace `filterPatterns` state with `filterModel` state
- When `itemStore.inventory` is available, use `filterByModel()`
- When processing raw `.sav` files, run through `transformAllItems()` first, *then* `filterByModel()` — eliminating the need for `analyzeUeSaveJson()`
- Remove import of `analyzeUeSaveJson` from FilterTab

#### 6. Update ItemCard to show monogram matches

- Add monogram display section to `ItemCard`
- Highlight monograms that match filter criteria
- Show count badges for duplicate monograms (e.g., "×2")

### Phase 2: Monogram Count Awareness (separate follow-up)

#### In the Item model:
- Add `getMonogramCounts(item)` helper that returns `Map<string, number>` (id → count)
- Tooltip should group duplicate monograms: "Bloodlust ×2" instead of two separate lines

#### In calculations:
- `MONOGRAM_CALC_CONFIGS` needs a `scalingMode` field:
  - `'boolean'` — effect is on/off (current behavior)
  - `'linear'` — effect scales with count (e.g., 2x Bloodlust = 2x stacks)
  - `'custom'` — function-based scaling
- `useDerivedStats` should pass monogram count to the calculation

#### In the tooltip:
- Group duplicate monograms with count badge
- Show scaling info when count > 1 and the monogram has linear scaling

### Phase 3: Persistence & Sharing (future)

- `FilterModel` serializes cleanly to JSON → `localStorage.setItem('filters', JSON.stringify(filters))`
- Export/import as JSON or base64-encoded URL param for sharing
- Named filter presets with CRUD UI

## Files to Modify

| File | Change |
|------|--------|
| **NEW** `src/models/FilterModel.js` | Filter model types, factory functions, serialization |
| `src/utils/itemFilter.js` | Add `filterByModel()`, add monogram scoring |
| `src/components/filter/FilterTab.jsx` | Replace regex state with FilterModel, remove legacy path |
| `src/components/filter/FilterConfig.jsx` | Remove regex mode toggle, output FilterModel |
| `src/components/filter/AffixSelector.jsx` | Add monogram category/section |
| `src/components/filter/ItemCard.jsx` | Show monogram matches, count badges |
| `src/models/Item.js` | Add `getMonogramCounts()` helper |
| `src/utils/dwarfFilter.js` | **No changes** — left for removal in separate cleanup PR |

## What We're NOT Doing Yet

- Not removing `dwarfFilter.js` entirely (it may still be useful for the raw-file-drop workflow until we verify `transformAllItems` handles everything)
- Not implementing localStorage persistence (schema first, storage later)
- Not implementing sharing/export
- Not changing calculation behavior for monogram stacking (research needed on game mechanics)
