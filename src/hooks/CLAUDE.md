# Hooks Guide

Custom React hooks for reusable logic.

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
