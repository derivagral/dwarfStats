import React, { useState, useCallback, useRef } from 'react';
import { StatLine } from './StatLine';
import { StatTooltip } from './StatTooltip';
import { useDerivedStats } from '../../hooks/useDerivedStats';

const categoryLabels = {
  totals: 'Totals',
  attributes: 'Attributes',
  offense: 'Offense',
  stance: 'Stance/Weapon',
  defense: 'Defense',
  elemental: 'Elemental',
  abilities: 'Abilities',
  utility: 'Utility',
  unmapped: 'Unmapped (Debug)',
};

const categoryOrder = ['totals', 'offense', 'stance', 'elemental', 'defense', 'attributes', 'abilities', 'utility', 'unmapped'];

/**
 * Render a consolidated total stat with optional breakdown and hover tooltip
 */
function TotalStatLine({ stat, hideZero = false }) {
  const lineRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverStateRef = useRef(false);
  const closeTimeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverStateRef.current = true;
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverStateRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      if (!hoverStateRef.current) {
        setIsHovered(false);
      }
    }, 150);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverStateRef.current = true;
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    hoverStateRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      if (!hoverStateRef.current) {
        setIsHovered(false);
      }
    }, 150);
  }, []);

  if (hideZero && stat.value === 0) return null;

  const isZero = stat.value === 0;

  return (
    <>
      <div
        ref={lineRef}
        className={`stat-line total-stat ${isZero ? 'zero-value' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="stat-name">{stat.name}</span>
        <span className="stat-value-group">
          <span className="stat-value">{stat.formattedValue}</span>
          {stat.breakdown && (
            <span className="stat-breakdown">({stat.breakdown})</span>
          )}
        </span>
      </div>
      <StatTooltip
        stat={stat}
        visible={isHovered}
        anchorRef={lineRef}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />
    </>
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
