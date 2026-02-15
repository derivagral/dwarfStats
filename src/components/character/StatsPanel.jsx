import React, { useState, useCallback } from 'react';
import { StatLine } from './StatLine';
import { useDerivedStats } from '../../hooks/useDerivedStats';

const categoryLabels = {
  attributes: 'Attributes',
  offense: 'Offense',
  stance: 'Stance/Weapon',
  defense: 'Defense',
  elemental: 'Elemental',
  edps: 'eDPS',
  monograms: 'Monograms',
  abilities: 'Abilities',
  utility: 'Utility',
  unmapped: 'Unmapped (Debug)',
};

// Attributes first, then combat stats, eDPS, then monograms at the end
const categoryOrder = ['attributes', 'offense', 'stance', 'elemental', 'defense', 'edps', 'monograms', 'abilities', 'utility', 'unmapped'];

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
