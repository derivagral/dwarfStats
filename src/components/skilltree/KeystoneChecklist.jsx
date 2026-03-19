import React from 'react';
import { StatInput } from '../character/StatInput';
import { TREE_KEYSTONES } from '../../utils/skillTreeRegistry';
import { STAT_REGISTRY } from '../../utils/statRegistry';

const CATEGORY_LABELS = {
  proximity: 'Proximity',
  mastery: 'Mastery',
  affinity: 'Affinity',
  utility: 'Utility',
};

const CATEGORY_ORDER = ['proximity', 'mastery', 'affinity', 'utility'];

/**
 * Manual checklist for main tree keystones grouped by category
 *
 * @param {Object} props
 * @param {Object} props.selections - { [keystoneId]: boolean }
 * @param {Function} props.onToggle - (keystoneId) => void
 * @param {Object} props.skillValues - { [keystoneId]: number }
 * @param {Function} props.onValueChange - (keystoneId, value) => void
 */
export function KeystoneChecklist({ selections, onToggle, skillValues, onValueChange }) {
  // Group keystones by category
  const grouped = {};
  for (const keystone of Object.values(TREE_KEYSTONES)) {
    if (!grouped[keystone.category]) {
      grouped[keystone.category] = [];
    }
    grouped[keystone.category].push(keystone);
  }

  return (
    <div className="skill-section">
      <div className="skill-section-header">
        <span className="skill-section-title">Main Tree Keystones</span>
        <span className="skill-section-subtitle">Manual selection (can't auto-detect from save)</span>
      </div>

      <div className="keystone-grid">
        {CATEGORY_ORDER.map(category => {
          const keystones = grouped[category];
          if (!keystones || keystones.length === 0) return null;

          return (
            <div key={category} className="keystone-category">
              <div className="keystone-category-label">{CATEGORY_LABELS[category]}</div>
              {keystones.map(keystone => {
                const checked = !!selections[keystone.id];
                const hasStatId = !!keystone.statId;

                return (
                  <div key={keystone.id} className="keystone-item">
                    <label className="keystone-toggle">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(keystone.id)}
                      />
                      <span className="keystone-name">{keystone.name}</span>
                      {keystone.overlaps && (
                        <span className="keystone-overlap-badge" title="Overlaps with monogram effect">
                          overlap
                        </span>
                      )}
                    </label>
                    <span className="keystone-desc">{keystone.description}</span>
                    {hasStatId && checked && (
                      <div className="keystone-value-input">
                        <StatInput
                          value={skillValues[keystone.id] || 0}
                          onChange={(v) => onValueChange(keystone.id, v)}
                          min={0}
                          step={(STAT_REGISTRY[keystone.statId]?.isPercent ?? true) ? 1 : 10}
                          isPercent={STAT_REGISTRY[keystone.statId]?.isPercent ?? true}
                          placeholder="0"
                        />
                        <span className="skill-stat-id">{keystone.statId}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
