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
const categoryOrder = ['vitals', 'edps', 'abilities', 'attributes', 'offense', 'stance', 'elemental', 'affinity', 'defense', 'utility', 'monograms', 'unmapped'];

// Display filters never change the calculation or shared build.
export function filterStatRows(stats, category, { hideZero = false, activeEffectsOnly = true } = {}) {
  return stats.filter(stat => (!hideZero || stat.value !== 0)
    && (category !== 'monograms' || !activeEffectsOnly || stat.isActiveEffect));
}

export function StatsPanel({ characterData }) {
  const [hideZero, setHideZero] = useState(false);
  const [activeEffectsOnly, setActiveEffectsOnly] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const { categories } = useDerivedStats(characterData || {});

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
        <div className="stats-display-toggles">
          <label className="hide-zero-toggle" title="Show only effects granted by equipped items, mastery, or the skill tree. This changes visibility only.">
            <input type="checkbox" checked={activeEffectsOnly}
              onChange={event => setActiveEffectsOnly(event.target.checked)} />
            <span>Active effects only</span>
          </label>
          <label className="hide-zero-toggle">
            <input
              type="checkbox"
              checked={hideZero}
              onChange={toggleHideZero}
            />
            <span>Hide zero</span>
          </label>
        </div>
      </div>

      <div className="stats-content">
        {categoryOrder.map(categoryKey => {
          let stats = categories[categoryKey];
          if (!stats || stats.length === 0) return null;

          stats = filterStatRows(stats, categoryKey, { hideZero, activeEffectsOnly });
          if (stats.length === 0) return null;

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
