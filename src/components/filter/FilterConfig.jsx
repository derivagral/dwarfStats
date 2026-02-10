import React, { useCallback } from 'react';
import { Button } from '../common';
import { AffixSelector } from './AffixSelector';

/**
 * Filter configuration panel.
 * Uses the AffixSelector to build a FilterModel (affixes + monograms).
 * No more raw regex textarea.
 */
export function FilterConfig({
  visible,
  selectedAffixes,
  selectedMonograms,
  onAffixChange,
  onMonogramChange,
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
