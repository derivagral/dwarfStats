# Components Guide

Components organized by feature domain. Each folder has an `index.js` for clean imports.

## Folder Structure

```
components/
├── common/      # Shared UI components
├── upload/      # Upload tab - file input
├── character/   # Character tab - equipment display
├── filter/      # Filter tab - attribute search
└── items/       # Items tab - browsable item list
```

## Common Components (`common/`)

Reusable across all tabs:

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `TabNavigation` | Tab switcher bar | `tabs`, `activeTab`, `onTabChange`, `disabledTabs` |
| `StatusBar` | Platform badge + status | `platform`, `status`, `statusType` |
| `Button` | Styled button with icon | `onClick`, `icon`, `children`, `variant` |
| `DropZone` | Drag/drop file area | `onDrop`, `accept`, `children` |
| `LogPanel` | Scrollable log display | `logs` |

## Upload Tab (`upload/`)

**File:** `UploadTab.jsx`

Single-file tab for all upload methods:
- Drag & drop
- File picker
- Folder picker (Chromium only)

**Props:**
```jsx
{
  onFileLoaded: (saveData) => void,  // Called with parsed JSON
  onLog: (message) => void,
  onStatusChange: (message, type) => void,
  wasmReady: boolean
}
```

**Key behavior:**
- Folder picker auto-selects most recent `.sav` file
- Logs file size and processing status
- Navigates to Character tab on success

## Character Tab (`character/`)

Equipment inventory display with item-level stat editing.

| Component | Purpose |
|-----------|---------|
| `CharacterTab` | Tab container, passes saveData |
| `CharacterPanel` | Layout manager, maps items to slots, hosts item editor |
| `InventorySlot` | Clickable slot with selection and override indicators |
| `ItemDetailTooltip` | Attribute tooltip with smart positioning |
| `StatsPanel` | Displays derived stats with category grouping |
| `ItemEditor` | Panel for editing individual item stats |
| `StatInput` | Numeric input with +/- controls |

**Slot types (12 main + 4 offhand):**
- Main: head, chest, hands, pants, boots, neck, bracer, ring1, ring2, relic, weapon, fossil
- Offhand: belt, goblet, horn, trinket

**Tooltip positioning:**
- Detects viewport edges
- Adjusts for scroll position
- Prevents off-screen rendering
- Hidden when item is selected for editing

**Item-Level Stat Editing:**
Click any equipped item to open the ItemEditor panel below the equipment grid.
- View and remove base stats from the item
- Add custom stats with type selector and value input
- Add/remove monograms (for applicable slots: head, amulet, bracer, boots, pants, relic)
- Changes immediately reflect in the StatsPanel on the right
- Edit icon (✎) shows on slots with modifications

## Filter Tab (`filter/`)

Attribute search with scoring system.

| Component | Purpose |
|-----------|---------|
| `FilterTab` | Main container, search logic |
| `FilterConfig` | Pattern input panel |
| `ResultsSection` | Results container |
| `ItemCard` | Item with pool breakdown |
| `EmptyResultsSection` | No-results state |

**Scoring system:**
- Pool 1, Pool 2, Pool 3 each scored (0, 1, or 2+ matches)
- **Match**: 1+ in ALL pools (green)
- **Near Miss**: 2+ total but missing a pool (blue)

**Filter patterns:**
- Supports regex with `*` as wildcard
- Comma-separated list
- Case-insensitive matching

## Items Tab (`items/`)

Browsable item list with filtering and stat editing.

| Component | Purpose |
|-----------|---------|
| `ItemsTab` | Main container, filtering, item list |
| `ItemListRow` | Item row with tooltip |

**Features:**
- All items from save file
- Equipped items tagged with slot
- Regex-based attribute filtering
- Slot type filtering
- Inline stat editing via ItemEditor

**Item Model:**
Items now include a clean `model` property with:
- Full metadata (rarity, tier, specks, upgradeCount)
- Structured affix pools (inherent, pool1-3)
- Base stats with values (excludes monograms)
- Monograms array with id, value, rawTag

**Monograms:**
Codex-craftable modifiers identified by `EasyRPG.Items.Modifiers.` prefix.
Registry at `src/utils/monogramRegistry.js` provides display names and slot mappings.

See `src/models/Item.js` for the complete model definition.

## Adding a New Tab

1. Create folder: `src/components/newtab/`

2. Create main component:
```jsx
// NewTab.jsx
import { useCallback } from 'react';

export function NewTab({ saveData, onLog, onStatusChange }) {
  // Tab implementation
  return (
    <div className="new-tab">
      {/* Content */}
    </div>
  );
}
```

3. Create exports:
```jsx
// index.js
export { NewTab } from './NewTab';
```

4. Register in `App.jsx`:
```jsx
// Add to TABS array
{ id: 'newtab', label: 'New Tab', icon: '🆕' }

// Add render condition
{activeTab === 'newtab' && saveData && (
  <NewTab
    saveData={saveData}
    onLog={log}
    onStatusChange={handleStatusChange}
  />
)}
```

## Component Patterns

### Props callback pattern
```jsx
// Parent provides callbacks
<ChildComponent
  onAction={handleAction}
  onStatusChange={handleStatusChange}
/>

// Child calls them
const handleClick = useCallback(() => {
  onStatusChange('Processing...', 'info');
  // do work
  onAction(result);
}, [onAction, onStatusChange]);
```

### Memoized handlers
```jsx
const handleFileSelect = useCallback(async (file) => {
  // Processing logic
}, [dependencies]);
```

### Conditional rendering by state
```jsx
{!saveData && <EmptyState />}
{saveData && <DataView data={saveData} />}
```

## Styling

Components use classes from `src/styles/index.css`:
- `.tab-*` - Tab navigation
- `.character-*` - Character panel
- `.inventory-slot` - Equipment slots
- `.item-*` - Item cards
- `.config-*` - Config panels
- `.results-*` - Results sections
- `.drop-zone` - Upload areas
