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
│   └── filter/          # Attribute search/filtering tab
├── hooks/               # Custom React hooks
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
| Item filtering logic | `src/utils/dwarfFilter.js` |
| Equipment slot mapping | `src/utils/equipmentParser.js` |
| Attribute display names | `src/utils/attributeDisplay.js` |
| Styling/theming | `src/styles/index.css` |

## Tab Architecture

Tabs defined in `App.jsx` TABS array:
```jsx
{ id: 'upload', label: 'Upload', icon: '📁' }
{ id: 'character', label: 'Character', icon: '🧙' }
{ id: 'filter', label: 'Filter', icon: '🔍' }
```

**To add a 4th tab:**
1. Create folder `src/components/newtab/` with `NewTab.jsx` and `index.js`
2. Add entry to TABS array in `App.jsx`
3. Add render condition in `App.jsx` return block
4. Update `disabledTabs` logic if tab requires `saveData`

## State Flow

```
App.jsx (state holder)
├── activeTab       → Current tab ID
├── saveData        → Parsed .sav JSON (null until loaded)
├── status/statusType → UI feedback messages
├── logs            → Debug log buffer
└── wasmReady       → WASM initialization flag

Tab callbacks:
- onFileLoaded(data) → Sets saveData, switches to Character tab
- onClearSave()      → Clears saveData, returns to Upload tab
- onLog(msg)         → Adds to log buffer
- onStatusChange(msg, type) → Updates status bar
```

## Save File Processing Pipeline

1. **Upload** → File selected via drag/drop or picker
2. **Validate** → Check `.sav` extension
3. **Convert** → WASM `to_json()` converts bytes to JSON
4. **Parse** → `JSON.parse()` result
5. **Extract** → `extractEquippedItems()` pulls equipment
6. **Display** → Character tab shows slots, Filter tab searches

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

## Deployment

GitHub Actions workflow in `.github/workflows/static.yml`:
1. Installs dependencies
2. Runs `npm run build`
3. Deploys `dist/` to GitHub Pages

Push to `main` triggers deployment automatically.
