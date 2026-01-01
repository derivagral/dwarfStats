# Hooks Guide

Custom React hooks for reusable logic.

## useDerivedStats

Calculates derived character stats from equipped items.

```js
import { useDerivedStats } from './hooks/useDerivedStats';

const { stats, categories, getStat, getCategory } = useDerivedStats(
  characterData,      // Character data with equippedItems
  customDefinitions   // Optional custom stat definitions array
);
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `stats` | `Array` | All calculated stats |
| `categories` | `Object` | Stats grouped by category |
| `getStat` | `(id) => stat` | Get stat by ID |
| `getCategory` | `(cat) => stats[]` | Get stats in category |

**Stat object shape:**
```js
{
  id: 'strength',
  name: 'Strength',
  category: 'attributes',
  value: 25,
  formattedValue: '25',
  breakdown: [...],       // Source breakdown for tooltip
  description: '...'
}
```

## useItemOverrides

Manages per-item stat modifications. Each equipped item can have stats added, removed, or modified.

```js
import { useItemOverrides } from './hooks/useItemOverrides';

const {
  overrides,           // Full state: { slotKey: { mods: [], removedIndices: [] } }
  hasAnyOverrides,     // Boolean: any modifications exist?
  getSlotOverrides,    // (slotKey) => slot override state
  hasSlotOverrides,    // (slotKey) => boolean
  applyOverridesToItem,// (slotKey, baseAttributes) => modified attributes
  updateMod,           // (slotKey, modIndex, updates) => void
  addMod,              // (slotKey, mod?) => void
  removeMod,           // (slotKey, modIndex) => void
  removeBaseStat,      // (slotKey, baseStatIndex) => void
  restoreBaseStat,     // (slotKey, baseStatIndex) => void
  clearSlot,           // (slotKey) => void
  clearAll,            // () => void
} = useItemOverrides({ onChange: (overrides) => {} });
```

**Slot override structure:**
```js
{
  mods: [
    { id: 'mod-123', name: 'Strength', value: 15, isNew: true }
  ],
  removedIndices: [0, 2]  // Indices of base stats to hide
}
```

**Usage with CharacterPanel:**
Item overrides are applied to equippedItems before passing to StatsPanel.
Modified items include both remaining base stats and added mods.

## useFileProcessor

Handles file reading and WASM conversion pipeline.

```js
import { useFileProcessor } from './hooks/useFileProcessor';

const { processFile, isProcessing, error } = useFileProcessor({
  onSuccess: (saveData) => { /* handle parsed data */ },
  onLog: (message) => { /* log message */ },
  onStatusChange: (message, type) => { /* update status */ },
  wasmReady: true
});

// Process a file
await processFile(file);
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `processFile` | `(file) => Promise` | Processes .sav file |
| `isProcessing` | `boolean` | Loading state |
| `error` | `string \| null` | Error message if failed |

**Pipeline:**
1. Validates `.sav` extension
2. Reads file as ArrayBuffer
3. Converts to Uint8Array
4. Calls WASM `to_json()`
5. Parses JSON result
6. Extracts equipped items
7. Calls `onSuccess` with data

**Error handling:**
- Invalid extension → error state
- WASM not ready → error state
- Parse failure → error state with message

## useLogger

Centralized logging with timestamps.

```js
import { useLogger } from './hooks/useLogger';

const { logs, log, clearLogs } = useLogger();

log('File loaded successfully');
// logs: [{ timestamp: '12:34:56', message: 'File loaded successfully' }]

clearLogs();
// logs: []
```

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `logs` | `Array<{timestamp, message}>` | Log entries |
| `log` | `(message) => void` | Add log entry |
| `clearLogs` | `() => void` | Clear all logs |

**Timestamp format:** `HH:MM:SS` (24-hour)

## Creating New Hooks

Follow this pattern:

```js
// useNewHook.js
import { useState, useCallback } from 'react';

export function useNewHook(options = {}) {
  const [state, setState] = useState(initialValue);

  const action = useCallback((param) => {
    // Logic here
    setState(newValue);
    options.onComplete?.(result);
  }, [options.onComplete]);

  return {
    state,
    action,
  };
}
```

**Conventions:**
- Name starts with `use`
- Accept options object for callbacks
- Memoize functions with `useCallback`
- Return object with state and actions
- Export from `index.js` in hooks folder
