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
