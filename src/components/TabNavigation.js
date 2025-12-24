import { html } from "../lib/html.js";

export function TabNavigation() {
  return html`
    <div class="tab-container">
      <div class="tab-nav">
        <button class="tab-btn active" data-tab="character">
          <span class="tab-icon">🧙</span> Character
        </button>
        <button class="tab-btn" data-tab="filter">
          <span class="tab-icon">🔍</span> Filter
        </button>
      </div>
    </div>
  `;
}
