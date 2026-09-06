import React from 'react';
import { getMonogramCoverage } from '../../utils/monogramSupport.js';
import { Button } from '../common';
import { getMonogramsForSlot, getMonogramName } from '../../utils/monogramRegistry.js';
import { getMonogramPoolForEquipmentSlot, summarizeFarmMonograms } from '../../models/MonogramSet.js';

export function MonogramSetPanel({
  name,
  onNameChange,
  savedSets,
  selectedSet,
  currentEntries,
  onSelectSet,
  onSetMonogramSlot,
  onSave,
  onApply,
  onDelete,
}) {
  const farmSummary = summarizeFarmMonograms(currentEntries);
  const counts = new Map();
  for (const entry of currentEntries) {
    for (const id of entry.monogramSlots || []) {
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  const coverage = [...counts].map(([id, copies]) => ({ ...getMonogramCoverage(id), copies }));
  const incompleteCount = coverage.filter(effect => ['not-modeled', 'partial'].includes(effect.status)).length;
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

      <div className="monogram-farm-summary" aria-label="Equipped farm monograms">
        {farmSummary.map(effect => (
          <div key={effect.id}>
            <strong>{effect.name}</strong>
            <span>{effect.copies}/{effect.maxCopies} copies · {effect.chance}% chance</span>
            <small>
              {effect.excessCopies > 0
                ? `${effect.excessCopies} excess — no added chance`
                : effect.remainingCopies > 0
                  ? `${effect.remainingCopies} more to cap`
                  : 'At cap'}
            </small>
          </div>
        ))}
      </div>

      {coverage.length > 0 && (
        <details className="monogram-coverage">
          <summary>Calculation coverage · {incompleteCount} partial or unmodeled</summary>
          <p>These checks identify connected calculations. They do not verify every in-game rule.</p>
          <ul>
            {coverage.map(effect => (
              <li key={effect.id}>
                <strong>{effect.name} ×{effect.copies}</strong>: {effect.label}
                {effect.note && <small>{effect.note}</small>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {currentEntries.length > 0 ? (
        <div className="monogram-set-preview">
          {currentEntries.map(entry => (
            <MonogramSetEntry
              entry={entry}
              key={entry.slotKey}
              onSetMonogramSlot={onSetMonogramSlot}
            />
          ))}
        </div>
      ) : (
        <div className="item-editor-empty">No equipped monogram items.</div>
      )}
    </div>
  );
}

function MonogramSetEntry({ entry, onSetMonogramSlot }) {
  const pool = getMonogramPoolForEquipmentSlot(entry.slotKey);
  const available = pool ? getMonogramsForSlot(pool) : [];
  const optionMap = new Map(available.map(monogram => [monogram.id, monogram]));

  for (const id of entry.monogramSlots) {
    if (id && !optionMap.has(id)) {
      optionMap.set(id, { id, name: getMonogramName(id) });
    }
  }

  const options = Array.from(optionMap.values());

  return (
    <div className="monogram-set-entry">
      <span className="monogram-set-item">
        {entry.itemName} <small>({entry.slotKey})</small>
      </span>
      <span className="monogram-set-values">
        {entry.monogramSlots.map((id, index) => (
          <select
            aria-label={`${entry.itemName} monogram ${index + 1}`}
            className="stat-row-select monogram-select"
            key={index}
            value={id || ''}
            onChange={event => onSetMonogramSlot(
              entry.slotKey,
              index,
              event.target.value || null
            )}
          >
            <option value="">None</option>
            {options.map(monogram => (
              <option key={monogram.id} value={monogram.id}>
                {monogram.name}
              </option>
            ))}
          </select>
        ))}
      </span>
    </div>
  );
}
