import React, { useState, useCallback } from 'react';
import { StatLine } from './StatLine';
import { useDerivedStats } from '../../hooks/useDerivedStats';

const categoryLabels = {
  vitals: 'Vitals',
  attributes: 'Attributes',
  offense: 'Offense',
  stance: 'Stance/Weapon',
  defense: 'Defense',
  elemental: 'Elemental',
  edps: 'On-hit damage',
  affinity: 'Offhand Affinity',
  monograms: 'Monograms',
  abilities: 'Abilities',
  utility: 'Utility',
  unmapped: 'Unmapped (Debug)',
};

// Vitals (in-game max health) and eDPS first — the progress-indicator numbers
// belong above the fold; monograms last.
const categoryOrder = ['vitals', 'edps', 'attributes', 'offense', 'stance', 'elemental', 'affinity', 'defense', 'monograms', 'abilities', 'utility', 'unmapped'];

/**
 * @param {Object} props
 * @param {Object} props.characterData - Character data with equipped items (may include modified items)
 */
export function StatsPanel({ characterData }) {
  const [hideZero, setHideZero] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const { categories } = useDerivedStats(characterData);

  const toggleHideZero = useCallback(() => {
    setHideZero(prev => !prev);
  }, []);

  const toggleCategory = useCallback((categoryKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
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
        {categoryOrder.map(categoryKey => {
          let stats = categories[categoryKey];
          if (!stats || stats.length === 0) return null;

          // Filter zeros if enabled
          if (hideZero) {
            stats = stats.filter(s => s.value !== 0);
            if (stats.length === 0) return null;
          }

          const isCollapsed = Boolean(collapsedCategories[categoryKey]);
          const contentId = `stats-category-${categoryKey}`;

          return (
            <div key={categoryKey} className={`stats-category${isCollapsed ? ' is-collapsed' : ''}`}>
              <button
                type="button"
                className="category-header category-toggle"
                aria-expanded={!isCollapsed}
                aria-controls={contentId}
                onClick={() => toggleCategory(categoryKey)}
              >
                <span>{categoryLabels[categoryKey] || categoryKey}</span>
                <span className="category-count">{stats.length}</span>
                <span className="category-chevron" aria-hidden="true">▾</span>
              </button>
              {!isCollapsed && (
                <div id={contentId} className="category-stats">
                  {stats.map(stat => (
                    <StatLine key={stat.id} stat={stat} />
                  ))}
                </div>
              )}
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
