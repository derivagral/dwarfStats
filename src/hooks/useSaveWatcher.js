import { useState, useRef, useCallback, useEffect } from 'react';
import { hasDirPicker } from '../utils/platform';

/**
 * Live save-folder watcher (Chromium only).
 *
 * Uses the File System Access API (`showDirectoryPicker`) to poll the game's
 * save folder and re-deliver the newest `.sav` whenever the game writes a new
 * one. Firefox/Safari can't do this: a `File` from an input or drag is a
 * snapshot — re-reading after the file changes on disk throws — and neither
 * ships the handle-based API, so callers should feature-gate on `supported`.
 *
 * Instantiate at App level so polling survives tab switches.
 *
 * @param {Object} options
 * @param {(file: File, info: {isInitial: boolean}) => Promise<void>|void} options.onSaveChanged
 *   Called with the newest .sav on start and whenever name/lastModified changes.
 * @param {(msg: string) => void} [options.onLog]
 * @param {number} [options.intervalMs=10000] - Poll interval
 * @returns {{ watching: boolean, supported: boolean, start: () => Promise<boolean>, stop: () => void }}
 */
export function useSaveWatcher({ onSaveChanged, onLog, intervalMs = 10000 }) {
  const [watching, setWatching] = useState(false);
  const dirHandleRef = useRef(null);
  const timerRef = useRef(null);
  const lastSeenRef = useRef(null); // `${name}:${lastModified}` of newest .sav
  const busyRef = useRef(false);

  const scanOnce = useCallback(async (isInitial = false) => {
    const handle = dirHandleRef.current;
    if (!handle || busyRef.current) return;
    busyRef.current = true;
    try {
      let newest = null;
      for await (const [name, entry] of handle.entries()) {
        if (!/\.sav$/i.test(name)) continue;
        const file = await entry.getFile();
        if (!newest || file.lastModified > newest.lastModified) newest = file;
      }
      if (!newest) {
        if (isInitial) onLog?.('⚠️ No .sav files found in folder');
        return;
      }
      const stamp = `${newest.name}:${newest.lastModified}`;
      if (stamp !== lastSeenRef.current) {
        lastSeenRef.current = stamp;
        await onSaveChanged?.(newest, { isInitial });
      }
    } catch (e) {
      onLog?.(`⚠️ Watch scan failed: ${e?.message || e}`);
    } finally {
      busyRef.current = false;
    }
  }, [onSaveChanged, onLog]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    dirHandleRef.current = null;
    lastSeenRef.current = null;
    setWatching(false);
    onLog?.('👁️ Live watch stopped');
  }, [onLog]);

  /**
   * Prompt for the save folder and begin watching.
   * @returns {Promise<boolean>} false if unsupported or the picker was cancelled
   */
  const start = useCallback(async () => {
    if (!hasDirPicker()) return false;
    let handle;
    try {
      handle = await window.showDirectoryPicker({ mode: 'read' });
    } catch {
      return false; // user cancelled the picker
    }
    dirHandleRef.current = handle;
    setWatching(true);
    onLog?.(`👁️ Live watch started (polling every ${Math.round(intervalMs / 1000)}s)`);
    await scanOnce(true);
    timerRef.current = setInterval(() => scanOnce(false), intervalMs);
    return true;
  }, [scanOnce, intervalMs, onLog]);

  // Clean up the timer on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { watching, supported: hasDirPicker(), start, stop };
}

export default useSaveWatcher;
