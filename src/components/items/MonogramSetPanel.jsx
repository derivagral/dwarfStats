import React from 'react';
import { Button } from '../common';
import { getMonogramName } from '../../utils/monogramRegistry.js';

export function MonogramSetPanel({
  name,
  onNameChange,
  savedSets,
  selectedSet,
  onSelectSet,
  onSave,
  onApply,
  onDelete,
}) {
  return (
    <div className="monogram-set-panel">
      <div className="monogram-set-controls">
        <label className="config-label">
          Monogram Set
          <input
            className="config-profile-name"
            value={name}
            onChange={event => onNameChange(event.target.value)}
            placeholder="e.g., Boss breakpoint"
          />
        </label>
        <Button icon="💾" onClick={onSave} disabled={!name.trim()}>
          Save Current
        </Button>
        <select
          className="config-profile-select"
          value={selectedSet?.name || ''}
          onChange={event => onSelectSet(event.target.value)}
        >
          <option value="">Load set...</option>
          {savedSets.map(monogramSet => (
            <option key={monogramSet.id} value={monogramSet.name}>
              {monogramSet.name}
            </option>
          ))}
        </select>
        <Button icon="↻" variant="primary" onClick={onApply} disabled={!selectedSet}>
          Apply
        </Button>
        <Button icon="🗑️" onClick={onDelete} disabled={!selectedSet}>
          Delete
        </Button>
      </div>

      {selectedSet && (
        <div className="monogram-set-preview">
          {selectedSet.entries.map(entry => (
            <div className="monogram-set-entry" key={entry.slotKey}>
              <span className="monogram-set-item">
                {entry.itemName} <small>({entry.slotKey})</small>
              </span>
              <span className="monogram-set-values">
                {entry.monogramSlots.map((id, index) => (
                  <span className="item-badge" key={index}>
                    {id ? getMonogramName(id) : 'None'}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
