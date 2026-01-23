# Items Tab

The Items tab provides a browsable list of all items parsed from a save file with filtering, equipped item highlighting, and inline stat editing.

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `ItemsTab` | `ItemsTab.jsx` | Main tab container with filtering and item list |
| `ItemListRow` | `ItemsTab.jsx` | Individual item row with tooltip and selection |

## Features

### Item Display
- Shows all items from the save file
- Displays item name and type
- Equipped items tagged with slot label (Head, Chest, etc.)
- Hover tooltip shows full attribute list

### Filtering
- **Text filter**: Regex-based attribute search (e.g., `Fiery*Totem*Damage`)
- **Equipped only**: Toggle to show only equipped items
- **Slot filter**: Checkboxes to filter by equipment slot type

### Stat Editing
- Click any item to open the ItemEditor panel
- View and modify base stats
- Add custom stats for theorycrafting
- Changes reflected in real-time

## Data Flow

```
saveData.raw/json
    ↓
analyzeUeSaveJson() → items[]
    ↓
Each item has:
├── Legacy fields (item_row, all_attributes, etc.)
└── item.model → Clean Item model
```

## Item Model

Items are transformed into a clean model (see `src/models/Item.js`):

```javascript
{
  // Identity
  id: string,           // Unique identifier
  rowName: string,      // e.g., "Armor_Bracers_Zone_4_..."
  type: string,         // e.g., "Armor Bracers"
  displayName: string,  // e.g., "Rune Keep"

  // Metadata
  rarity: number,       // 0-4 (Common to Legendary)
  tier: number,         // Item tier/level
  specks: number,       // Crafting specks
  isLocked: boolean,
  isGenerated: boolean,
  stackCount: number,
  charges: number,

  // Stats (regular attributes, excludes monograms)
  baseStats: [{stat, value, rawTag}],

  // Affix pools (craftable affix slots)
  affixPools: {
    inherent: [{rowName, dataTable}],
    pool1: [{rowName, dataTable}],
    pool2: [{rowName, dataTable}],
    pool3: [{rowName, dataTable}],
  },

  // Monograms (Codex modifiers, up to 4 per item)
  monograms: [{id, value, rawTag}],

  upgradeCount: number, // Gamble/anvil upgrades
}
```

## Monograms

Monograms are special modifiers craftable at the Codex. They are identified by the `EasyRPG.Items.Modifiers.` prefix in save data.

**Registry:** `src/utils/monogramRegistry.js`

```javascript
import { getMonogramName, getMonogramsForSlot } from '../utils/monogramRegistry';

// Get display name for a monogram
getMonogramName('Bloodlust.Base'); // "Bloodlust"

// Get available monograms for a slot
getMonogramsForSlot('head'); // [{id, name, category, description}, ...]
```

**Slot-specific monograms:**
- head, amulet, bracer, boots, pants, relic each have their own pool
- Use `SLOT_MONOGRAMS` to check what's available per slot

## Props

```jsx
<ItemsTab
  saveData={Object}     // Parsed save data with raw/json
  onLog={Function}      // Logging callback
/>
```

## State

| State | Type | Purpose |
|-------|------|---------|
| `filterValue` | string | Raw filter input |
| `filterPatterns` | string[] | Parsed regex patterns |
| `showEquippedOnly` | boolean | Filter toggle |
| `selectedItem` | Object | Currently selected item |
| `selectedItemKey` | string | Key for item overrides |
| `selectedItemKeys` | Set | Multi-select tracking |
| `singleSelectMode` | boolean | Single vs multi-select |
| `selectedSlots` | Set | Active slot filters |

## Hooks Used

- `useItemOverrides` - Manages stat and monogram modifications for theorycrafting
  - `addMod`, `removeMod`, `updateMod` - Stat modifications
  - `addMonogram`, `removeMonogram` - Monogram modifications
  - `removeBaseStat`, `restoreBaseStat` - Base stat toggling

## Slot Types

```javascript
const SLOT_OPTIONS = [
  'weapon', 'head', 'chest', 'hands', 'pants', 'boots',
  'neck', 'bracer', 'ring', 'relic', 'fossil', 'dragon',
  'offhand', 'unknown'
];
```

## CSS Classes

- `.items-header` - Tab header section
- `.items-layout` - Main grid layout (list + editor)
- `.items-list` - Scrollable item list container
- `.items-list-row` - Individual item row
- `.items-list-row.selected` - Selected state
- `.items-list-row.has-overrides` - Modified indicator
- `.items-editor-panel` - Right-side editor panel
- `.item-badge` - Tag badges (equipped, modified)
- `.items-filter-input` - Filter text input
- `.items-slot-options` - Slot filter checkboxes

## Integration with Item Model

The `item.model` property provides access to the clean Item model with:
- Full metadata (rarity, tier, specks, etc.)
- Structured affix pools
- Upgrade counts

Example usage:
```javascript
const { model } = item.item;
console.log(`${model.displayName} - ${getRarityName(model.rarity)}`);
console.log(`Tier ${model.tier}, ${model.specks} specks`);
```
