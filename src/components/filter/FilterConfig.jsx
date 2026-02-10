import React from 'react';
import { Button } from '../common';
import { AffixSelector } from './AffixSelector';

/**
 * Filter configuration panel.
 * Uses the AffixSelector to build a FilterModel (affixes + monograms).
 * Includes profile naming and monogram count options.
 */
export function FilterConfig({
  visible,
  profileName,
  selectedAffixes,
  selectedMonograms,
  minTotalMonograms,
  onProfileNameChange,
  onAffixChange,
  onMonogramChange,
  onMinTotalMonogramsChange,
  onApply,
  onReset,
}) {
  if (!visible) return null;

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3>Filter Configuration</h3>
      </div>

      <div className="config-inputs">
        <div className="config-profile-row">
          <label className="config-label">
            Profile Name
            <input
              type="text"
              className="config-profile-name"
              value={profileName}
              onChange={(e) => onProfileNameChange(e.target.value)}
              placeholder="e.g., Double Mono Crit Build"
            />
          </label>
          <label className="config-label">
            Min Total Monograms
            <input
              type="number"
              className="config-mono-count"
              value={minTotalMonograms ?? ''}
              min={0}
              max={10}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                onMinTotalMonogramsChange(isNaN(val) ? null : val);
              }}
              placeholder="any"
            />
          </label>
        </div>

        <AffixSelector
          selectedAffixes={selectedAffixes}
          selectedMonograms={selectedMonograms}
          onAffixChange={onAffixChange}
          onMonogramChange={onMonogramChange}
        />
      </div>

      <div className="config-actions">
        <Button icon="✓" variant="primary" onClick={onApply}>
          Apply & Re-scan
        </Button>
        <Button onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
