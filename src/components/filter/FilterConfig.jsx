import React, { useState, useCallback } from 'react';
import { Button } from '../common';
import { AffixSelector } from './AffixSelector';
import { affixIdsToFilterString } from '../../utils/affixList';

export function FilterConfig({
  visible,
  filterValue,
  onFilterChange,
  onApply,
  onReset,
  onClose
}) {
  const [mode, setMode] = useState('picker'); // 'picker' or 'regex'
  const [selectedAffixes, setSelectedAffixes] = useState([]);

  const handleAffixSelectionChange = useCallback((affixIds) => {
    setSelectedAffixes(affixIds);
    // Convert selected affixes to filter string
    const filterStr = affixIdsToFilterString(affixIds);
    onFilterChange(filterStr);
  }, [onFilterChange]);

  const handleModeToggle = useCallback((newMode) => {
    setMode(newMode);
    // When switching to picker mode, clear the text input
    if (newMode === 'picker') {
      setSelectedAffixes([]);
      onFilterChange('');
    }
  }, [onFilterChange]);

  if (!visible) return null;

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3>Filter Configuration</h3>
        <div className="config-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'picker' ? 'active' : ''}`}
            onClick={() => handleModeToggle('picker')}
          >
            Affix Picker
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'regex' ? 'active' : ''}`}
            onClick={() => handleModeToggle('regex')}
          >
            Regex
          </button>
        </div>
      </div>

      {mode === 'picker' ? (
        <div className="config-inputs">
          <AffixSelector
            selectedAffixes={selectedAffixes}
            onSelectionChange={handleAffixSelectionChange}
          />
          {filterValue && (
            <div className="config-preview">
              <span className="config-hint">Generated pattern: {filterValue}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="config-inputs">
          <span className="config-hint">
            Enter comma-separated attributes. Use * for wildcards (e.g., Fiery*Totem*Damage)
          </span>
          <div className="config-group">
            <label htmlFor="filterConfig">Target Attributes:</label>
            <textarea
              id="filterConfig"
              className="config-textarea"
              rows={3}
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Fiery*Totem*Damage, Wisdom, MageryCriticalDamage, LifeStealChance, LifeStealAmount, CriticalChance"
            />
          </div>
        </div>
      )}

      <div className="config-actions">
        <Button icon="✓" variant="primary" onClick={onApply}>
          Apply & Re-scan
        </Button>
        <Button onClick={onReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
