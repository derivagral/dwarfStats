import { useState, useRef, useCallback, useEffect } from 'react';
import { hasFilePicker } from '../utils/platform';

// Give up after this many consecutive failed polls (file deleted/moved,
// permission revoked) instead of erroring every 10s forever.
const MAX_CONSECUTIVE_FAILURES = 6;

/**
 * Live single-file save watcher (Chromium only).
 *
 * Uses `showOpenFilePicker()` to take a persistent handle on ONE `.sav` file
 * and polls `handle.getFile()` for lastModified changes, re-delivering the
 * file when the game writes it.
 *
 * Why a FILE handle and not a directory: Chrome's File System Access
 * blocklist forbids DIRECTORY handles anywhere under AppData — which is where
 * UE save games live (`%LOCALAPPDATA%\...\Saved\SaveGames`) — but individual
 * file handles inside AppData are allowed. Firefox/Safari support neither
 * (their `File` objects are snapshots; re-reading a changed file throws), so
 * callers feature-gate on `supported`.
 *
 * Instantiate at App level so polling survives tab switches.
 *
 * @param {Object} options
 * @param {(file: File, info: {isInitial: boolean}) => Promise<void>|void} options.onSaveChanged
 *   Called with the file on start and whenever lastModified changes.
 * @param {(msg: string) => void} [options.onLog]
 * @param {number} [options.intervalMs=10000] - Poll interval
 * @returns {{
 *   watching: boolean,
 *   supported: boolean,
 *   watchedName: string|null,
 *   lastChangeAt: number|null,
 *   start: () => Promise<{ok: boolean, reason?: 'cancelled'|'unsupported'|string}>,
 *   stop: () => void,
 * }}
 */
export function useSaveWatcher({ onSaveChanged, onLog, intervalMs = 10000 }) {
  const [watching, setWatching] = useState(false);
  const [watchedName, setWatchedName] = useState(null);
  const [lastChangeAt, setLastChangeAt] = useState(null);
  const fileHandleRef = useRef(null);
  const timerRef = useRef(null);
  const lastModifiedRef = useRef(0);
  const busyRef = useRef(false);
  const failureCountRef = useRef(0);

  const stop = useCallback((reasonMsg) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    fileHandleRef.current = null;
    lastModifiedRef.current = 0;
    failureCountRef.current = 0;
    setWatching(false);
    setWatchedName(null);
    onLog?.(reasonMsg || '👁️ Live watch stopped');
  }, [onLog]);

  const pollOnce = useCallback(async (isInitial = false) => {
    const handle = fileHandleRef.current;
    if (!handle || busyRef.current) return;
    busyRef.current = true;
    try {
      const file = await handle.getFile();
      failureCountRef.current = 0;
      if (file.lastModified !== lastModifiedRef.current) {
        lastModifiedRef.current = file.lastModified;
        setLastChangeAt(Date.now());
        await onSaveChanged?.(file, { isInitial });
      }
    } catch (e) {
      failureCountRef.current += 1;
      if (failureCountRef.current === 1) {
        onLog?.(`⚠️ Watch poll failed: ${e?.message || e}`);
      }
      if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
        stop(`⚠️ Live watch stopped — the file couldn't be read ${MAX_CONSECUTIVE_FAILURES} times in a row (moved/deleted?)`);
      }
    } finally {
      busyRef.current = false;
    }
  }, [onSaveChanged, onLog, stop]);

  /**
   * Prompt for a .sav file and begin watching it.
   * @returns {Promise<{ok: boolean, reason?: string}>} `reason` is
   *   'cancelled' when the user dismissed the picker; otherwise the browser's
   *   error message (e.g. a policy block).
   */
  const start = useCallback(async () => {
    if (!hasFilePicker()) return { ok: false, reason: 'unsupported' };
    let handle;
    try {
      [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Unreal save files',
          accept: { 'application/octet-stream': ['.sav'] },
        }],
      });
    } catch (e) {
      if (e?.name === 'AbortError') return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: e?.message || String(e) };
    }

    fileHandleRef.current = handle;
    failureCountRef.current = 0;
    setWatching(true);
    setWatchedName(handle.name);
    onLog?.(`👁️ Live watching ${handle.name} (checking every ${Math.round(intervalMs / 1000)}s)`);
    await pollOnce(true);
    timerRef.current = setInterval(() => pollOnce(false), intervalMs);
    return { ok: true };
  }, [pollOnce, intervalMs, onLog]);

  // Clean up the timer on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { watching, supported: hasFilePicker(), watchedName, lastChangeAt, start, stop };
}

export default useSaveWatcher;
