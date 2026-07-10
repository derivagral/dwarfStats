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

export function hasDirPicker() {
  return 'showDirectoryPicker' in window;
}

// Single-file handle picker (Chromium). Unlike DIRECTORY handles — which
// Chrome's File System Access blocklist forbids anywhere under AppData, where
// UE save games actually live — FILE handles inside AppData are allowed, so
// live watch uses this instead of showDirectoryPicker.
export function hasFilePicker() {
  return 'showOpenFilePicker' in window;
}
