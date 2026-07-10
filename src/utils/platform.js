// Platform detection utilities

export function detectPlatform() {
  const ua = navigator.userAgent;
  const hasDirPicker = 'showDirectoryPicker' in window;

  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return { icon: '🧭', name: 'Safari', isChromium: false };
  } else if (ua.includes('Firefox')) {
    return { icon: '🦊', name: 'Firefox', isChromium: false };
  } else if (hasDirPicker) {
    return { icon: '⚡', name: 'Chromium', isChromium: true };
  }

  return { icon: '🌐', name: 'Browser', isChromium: false };
}

// NOTE: live save-watching via the File System Access API was tried and
// removed. Chrome's blocklist classifies Windows Local AppData — where UE
// saves live — as kBlockAllChildren: BOTH directory and file handles are
// rejected there (showDirectoryPicker and showOpenFilePicker alike). Only the
// traditional <input type="file"> snapshot works, which cannot be re-read
// after the game writes. Refresh = user re-drops the save.
export function hasDirPicker() {
  return 'showDirectoryPicker' in window;
}
