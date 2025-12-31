# Hooks Guide

Custom React hooks for reusable logic.

## useDerivedStats

Calculates derived character stats from equipped items and manual overrides.

```js
import { useDerivedStats } from './hooks/useDerivedStats';

const { stats, categories, getStat, getCategory } = useDerivedStats(
  characterData,
  {
    customDefinitions: null,      // Optional custom stat definitions
    overrideTotals: { strength: 10 }  // Manual stat overrides
  }
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
  value: 25,              // Final value (base + overrides)
  baseValue: 15,          // Value from items only
  overrideValue: 10,      // Value from manual overrides
  formattedValue: '25',
  breakdown: [...],       // Source breakdown for tooltip
  description: '...'
}
```

## useCharacterOverrides

Manages editable stat overrides across multiple buckets (Base Stats, Main Stats, Affixes, Enchants, Monograms).

```js
import { useCharacterOverrides } from './hooks/useCharacterOverrides';

const {
  overrides,      // Full overrides state
  totals,         // { statId: totalValue } for all overrides
  hasOverrides,   // Boolean: any values set?
  updateSlot,     // (bucketId, slotIndex, updates) => void
  addSlot,        // (bucketId) => void
  removeSlot,     // (bucketId, slotIndex) => void
  clearBucket,    // (bucketId) => void
  clearAll,       // () => void
  reset,          // (newState?) => void
  getBucket,      // (bucketId) => bucket state
} = useCharacterOverrides({ onChange: (overrides) => {} });
```

**Bucket structure:**
```js
{
  bucketId: 'base',
  slots: [
    { id: 'base-0', statId: 'strength', value: 10 },
    { id: 'base-1', statId: null, value: 0 },
  ]
}
```

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
