import React from 'react';
import { Button } from '../common';
import { CharacterPanel } from './CharacterPanel';

export function CharacterTab({ saveData, onClearSave, onLog }) {
  // Convert saveData to characterData format expected by CharacterPanel
  const characterData = saveData ? {
    filename: saveData.filename,
    raw: saveData.raw,
    equippedItems: saveData.equippedItems || [],
    timestamp: saveData.timestamp
  } : null;

  return (
    <div className="tab-content active">
      <div className="controls" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="control-row" style={{ marginBottom: 0 }}>
          <div className="current-file-info">
            <span className="current-file-icon">📄</span>
            <span className="current-file-name">{saveData?.filename}</span>
          </div>
          <Button icon="📂" onClick={onClearSave}>
            Load Different File
          </Button>
        </div>
      </div>

      {characterData && (
        <CharacterPanel characterData={characterData} />
      )}
    </div>
  );
}
