import React, { useState, useCallback } from 'react';
import { StatLine } from './StatLine';
import { useDerivedStats } from '../../hooks/useDerivedStats';

const categoryLabels = {
  totals: 'Totals',
  attributes: 'Other Attributes',
  offense: 'Offense',
  defense: 'Defense',
  elemental: 'Elemental'
};

const categoryOrder = ['totals', 'offense', 'elemental', 'defense', 'attributes'];

/**
 * Render a consolidated total stat with optional breakdown
 */
function TotalStatLine({ stat, hideZero = false }) {
  if (hideZero && stat.value === 0) return null;

  const isZero = stat.value === 0;

  return (
    <div className={`stat-line total-stat ${isZero ? 'zero-value' : ''}`}>
      <span className="stat-name">{stat.name}</span>
      <span className="stat-value-group">
        <span className="stat-value">{stat.formattedValue}</span>
        {stat.breakdown && (
          <span className="stat-breakdown">({stat.breakdown})</span>
        )}
      </span>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.characterData - Character data with equipped items (may include modified items)
 */
export function StatsPanel({ characterData }) {
  const { categories } = useDerivedStats(characterData);
  const [hideZero, setHideZero] = useState(false);

  const toggleHideZero = useCallback(() => {
    setHideZero(prev => !prev);
  }, []);

  if (!characterData) {
    return (
      <div className="stats-panel">
        <div className="stats-empty">
          Load a character to view stats
        </div>
      </div>
    );
  }

  // Filter totals if hideZero is enabled
  const visibleTotals = hideZero
    ? (categories.totals || []).filter(s => s.value !== 0)
    : (categories.totals || []);

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <span className="stats-title">Character Stats</span>
        <label className="hide-zero-toggle">
          <input
            type="checkbox"
            checked={hideZero}
            onChange={toggleHideZero}
          />
          <span>Hide zero</span>
        </label>
      </div>

      <div className="stats-content">
        {/* Totals section with consolidated display */}
        {visibleTotals.length > 0 && (
          <div className="stats-category totals-category">
            <div className="category-header">
              {categoryLabels.totals}
            </div>
            <div className="category-stats totals-grid">
              {visibleTotals.map(stat => (
                <TotalStatLine key={stat.id} stat={stat} hideZero={hideZero} />
              ))}
            </div>
          </div>
        )}

        {/* Other categories */}
        {categoryOrder.slice(1).map(categoryKey => {
          let stats = categories[categoryKey];
          if (!stats || stats.length === 0) return null;

          // Filter zeros if enabled
          if (hideZero) {
            stats = stats.filter(s => s.value !== 0);
            if (stats.length === 0) return null;
          }

          return (
            <div key={categoryKey} className="stats-category">
              <div className="category-header">
                {categoryLabels[categoryKey] || categoryKey}
              </div>
              <div className="category-stats">
                {stats.map(stat => (
                  <StatLine key={stat.id} stat={stat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stats-footer">
        <div className="stats-note">
          Hover over stats for details
        </div>
      </div>
    </div>
  );
}
