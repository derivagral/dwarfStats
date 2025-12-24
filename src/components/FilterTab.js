import { html } from "../lib/html.js";

export function FilterTab() {
  return html`
    <div class="tab-content" id="tab-filter">
      <div class="controls">
        <div class="control-row">
          <button class="btn btn-primary" id="pickFile">
            <span class="btn-icon">📄</span> Pick .sav File
          </button>
          <button class="btn" id="pickDir" style="display: none;">
            <span class="btn-icon">📁</span> Pick Folder
          </button>
          <button class="btn" id="startWatch" style="display: none;">
            <span class="btn-icon">👁️</span> Start Watching
          </button>
          <button class="btn" id="rerunLast">
            <span class="btn-icon">🔄</span> Re-run Last
          </button>
        </div>
        <div class="control-row">
          <button class="btn" id="clearResults">
            <span class="btn-icon">🗑️</span> Clear Results
          </button>
          <button class="btn" id="toggleLog">
            <span class="btn-icon">📋</span> Toggle Log
          </button>
          <button class="btn" id="toggleConfig">
            <span class="btn-icon">⚙️</span> Configure Filters
          </button>
        </div>
      </div>

      <div class="config-panel" id="configPanel" style="display: none;">
        <div class="config-header">
          <h3>Filter Configuration</h3>
          <span class="config-hint">Enter comma-separated attributes. Use * for wildcards (e.g., Fiery*Totem*Damage)</span>
          <span class="config-hint" style="display: block; margin-top: 5px;">These filters will be applied to all 3 attribute pools</span>
        </div>
        <div class="config-inputs">
          <div class="config-group">
            <label for="filterConfig">Target Attributes:</label>
            <textarea id="filterConfig" class="config-textarea" rows="3" placeholder="Fiery*Totem*Damage, Wisdom, MageryCriticalDamage, LifeStealChance, LifeStealAmount, CriticalChance"></textarea>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-primary" id="applyConfig">Apply & Re-scan</button>
          <button class="btn" id="resetConfig">Reset to Defaults</button>
        </div>
      </div>

      <div id="drop">
        <div class="drop-icon">📦</div>
        <div class="drop-text">Drop .sav files here or use the Pick button above</div>
      </div>

      <div class="results-container" id="resultsContainer"></div>
    </div>
  `;
}
