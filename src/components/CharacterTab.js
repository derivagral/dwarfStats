import { html } from "../lib/html.js";

export function CharacterTab() {
  return html`
    <div className="tab-content active" id="tab-character">
      <div className="controls">
        <div className="control-row">
          <button className="btn btn-primary" id="pickFileChar">
            <span className="btn-icon">📄</span> Pick .sav File
          </button>
          <button className="btn" id="pickDirChar" style="display: none;">
            <span className="btn-icon">📁</span> Pick Folder
          </button>
          <button className="btn" id="clearChar">
            <span className="btn-icon">🗑️</span> Clear
          </button>
          <button className="btn" id="toggleLogChar">
            <span className="btn-icon">📋</span> Toggle Log
          </button>
        </div>
      </div>

      <div id="dropChar">
        <div className="drop-icon">🧙</div>
        <div className="drop-text">Drop a character .sav file to view inventory</div>
      </div>

      <div className="character-panel" id="characterPanel" style="display: none;">
        <div className="character-header">
          <span className="character-name" id="charName">Character Name</span>
          <span className="character-class" id="charClass">Class</span>
        </div>

        <div className="equipment-section">
          <div className="section-title">Equipped Items</div>
          <div className="inventory-grid" id="equippedGrid"></div>
        </div>

        <div className="equipment-section">
          <div className="section-title">Inventory</div>
          <div className="inventory-grid" id="inventoryGrid"></div>
        </div>
      </div>

      <div className="placeholder-message" id="charPlaceholder">
        <div className="placeholder-icon">📦</div>
        <div>Load a .sav file to view character inventory</div>
        <div style="margin-top: 0.5rem; font-size: 0.9rem;">Equipment slots and items will appear here</div>
      </div>
    </div>
  `;
}
