import { html } from "../lib/html.js";

export function CharacterTab() {
  return html`
    <div class="tab-content active" id="tab-character">
      <div class="controls">
        <div class="control-row">
          <button class="btn btn-primary" id="pickFileChar">
            <span class="btn-icon">📄</span> Pick .sav File
          </button>
          <button class="btn" id="pickDirChar" style="display: none;">
            <span class="btn-icon">📁</span> Pick Folder
          </button>
          <button class="btn" id="clearChar">
            <span class="btn-icon">🗑️</span> Clear
          </button>
          <button class="btn" id="toggleLogChar">
            <span class="btn-icon">📋</span> Toggle Log
          </button>
        </div>
      </div>

      <div id="dropChar">
        <div class="drop-icon">🧙</div>
        <div class="drop-text">Drop a character .sav file to view inventory</div>
      </div>

      <div class="character-panel" id="characterPanel" style="display: none;">
        <div class="character-header">
          <span class="character-name" id="charName">Character Name</span>
          <span class="character-class" id="charClass">Class</span>
        </div>

        <div class="equipment-section">
          <div class="section-title">Equipped Items</div>
          <div class="inventory-grid" id="equippedGrid"></div>
        </div>

        <div class="equipment-section">
          <div class="section-title">Inventory</div>
          <div class="inventory-grid" id="inventoryGrid"></div>
        </div>
      </div>

      <div class="placeholder-message" id="charPlaceholder">
        <div class="placeholder-icon">📦</div>
        <div>Load a .sav file to view character inventory</div>
        <div style="margin-top: 0.5rem; font-size: 0.9rem;">Equipment slots and items will appear here</div>
      </div>
    </div>
  `;
}
