import { html } from "../lib/html.js";

export function TabNavigation() {
  return html`
    <div className="tab-container">
      <div className="tab-nav">
        <button className="tab-btn active" data-tab="character">
          <span className="tab-icon">🧙</span> Character
        </button>
        <button className="tab-btn" data-tab="filter">
          <span className="tab-icon">🔍</span> Filter
        </button>
      </div>
    </div>
  `;
}
