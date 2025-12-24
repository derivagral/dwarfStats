import { html } from "../lib/html.js";

export function FilterTab() {
  return html`
    <div className="tab-content" id="tab-filter">
      <div className="controls">
        <div className="control-row">
          <button className="btn btn-primary" id="pickFile">
            <span className="btn-icon">📄</span> Pick .sav File
          </button>
          <button className="btn" id="pickDir" style="display: none;">
            <span className="btn-icon">📁</span> Pick Folder
          </button>
          <button className="btn" id="startWatch" style="display: none;">
            <span className="btn-icon">👁️</span> Start Watching
          </button>
          <button className="btn" id="rerunLast">
            <span className="btn-icon">🔄</span> Re-run Last
          </button>
        </div>
        <div className="control-row">
          <button className="btn" id="clearResults">
            <span className="btn-icon">🗑️</span> Clear Results
          </button>
          <button className="btn" id="toggleLog">
            <span className="btn-icon">📋</span> Toggle Log
          </button>
          <button className="btn" id="toggleConfig">
            <span className="btn-icon">⚙️</span> Configure Filters
          </button>
        </div>
      </div>

      <div className="config-panel" id="configPanel" style="display: none;">
        <div className="config-header">
          <h3>Filter Configuration</h3>
          <span className="config-hint">Enter comma-separated attributes. Use * for wildcards (e.g., Fiery*Totem*Damage)</span>
          <span className="config-hint" style="display: block; margin-top: 5px;">These filters will be applied to all 3 attribute pools</span>
        </div>
        <div className="config-inputs">
          <div className="config-group">
            <label htmlFor="filterConfig">Target Attributes:</label>
            <textarea id="filterConfig" className="config-textarea" rows="3" placeholder="Fiery*Totem*Damage, Wisdom, MageryCriticalDamage, LifeStealChance, LifeStealAmount, CriticalChance"></textarea>
          </div>
        </div>
        <div className="config-actions">
          <button className="btn btn-primary" id="applyConfig">Apply & Re-scan</button>
          <button className="btn" id="resetConfig">Reset to Defaults</button>
        </div>
      </div>

      <div id="drop">
        <div className="drop-icon">📦</div>
        <div className="drop-text">Drop .sav files here or use the Pick button above</div>
      </div>

      <div className="results-container" id="resultsContainer"></div>
    </div>
  `;
}
