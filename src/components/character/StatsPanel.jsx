import React from 'react';
import { StatLine } from './StatLine';
import { useDerivedStats } from '../../hooks/useDerivedStats';

const categoryLabels = {
  attributes: 'Attributes',
  offense: 'Offense',
  defense: 'Defense',
  elemental: 'Elemental'
};

const categoryOrder = ['offense', 'elemental', 'defense', 'attributes'];

/**
 * @param {Object} props
 * @param {Object} props.characterData - Character data with equipped items (may include modified items)
 */
export function StatsPanel({ characterData }) {
  const { categories } = useDerivedStats(characterData);

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
      </div>

      <div className="stats-content">
        {categoryOrder.map(categoryKey => {
          const stats = categories[categoryKey];
          if (!stats || stats.length === 0) return null;

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
