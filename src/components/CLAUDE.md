# Components Guide

Components organized by feature domain. Each folder has an `index.js` for clean imports.

## Folder Structure

```
components/
├── common/      # Shared UI components
├── upload/      # Upload tab - file input
├── character/   # Character tab - equipment display
└── filter/      # Filter tab - attribute search
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

Equipment inventory display with tooltips and stat editing.

| Component | Purpose |
|-----------|---------|
| `CharacterTab` | Tab container, passes saveData |
| `CharacterPanel` | Layout manager, maps items to slots, hosts stat editor |
| `InventorySlot` | Individual slot with hover state |
| `ItemDetailTooltip` | Attribute tooltip with smart positioning |
| `StatsPanel` | Displays derived stats with category grouping |
| `StatEditor` | Container for all stat editing buckets |
| `StatBucket` | Collapsible group of editable stat slots |
| `StatInput` | Numeric input with +/- controls |

**Slot types (12 main + 4 offhand):**
- Main: head, chest, hands, pants, boots, neck, bracer, ring1, ring2, relic, weapon, fossil
- Offhand: belt, goblet, horn, trinket

**Tooltip positioning:**
- Detects viewport edges
- Adjusts for scroll position
- Prevents off-screen rendering

**Stat Editing System:**
Stats can be overridden via buckets (Base Stats, Main Stats, Affixes, Enchants, Monograms).
Each bucket contains slots where users select a stat type and value.
Overrides are summed and added to derived stats from equipment.

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
