import React from 'react';
import { Button } from '../common';

export function FilterConfig({
  visible,
  filterValue,
  onFilterChange,
  onApply,
  onReset,
  onClose
}) {
  if (!visible) return null;

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3>Filter Configuration</h3>
        <span className="config-hint">
          Enter comma-separated attributes. Use * for wildcards (e.g., Fiery*Totem*Damage)
        </span>
        <span className="config-hint" style={{ display: 'block', marginTop: '5px' }}>
          These filters will be applied to all 3 attribute pools
        </span>
      </div>
      <div className="config-inputs">
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
