import { html } from "../lib/html.js";

export function StatusBar() {
  return html`
    <div className="status-bar">
      <div className="status-indicator">
        <span className="status-dot" id="statusDot"></span>
        <span id="statusText">Ready</span>
      </div>
      <div className="platform-badge" id="platformBadge">
        <span id="platformIcon">🌐</span>
        <span id="platformName">Browser</span>
      </div>
    </div>
  `;
}
