import { html } from "../lib/html.js";

export function StatusBar() {
  return html`
    <div class="status-bar">
      <div class="status-indicator">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">Ready</span>
      </div>
      <div class="platform-badge" id="platformBadge">
        <span id="platformIcon">🌐</span>
        <span id="platformName">Browser</span>
      </div>
    </div>
  `;
}
