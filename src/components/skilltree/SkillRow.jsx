import React from 'react';
import { StatInput } from '../character/StatInput';

/**
 * A single skill row with toggle, name, level display, and optional value input
 *
 * @param {Object} props
 * @param {string} props.name - Display name
 * @param {number} props.level - Skill level from save
 * @param {string} props.type - Skill type badge (ability, stat, buff, paragon, utility)
 * @param {string} [props.statId] - Stat this skill contributes to
 * @param {boolean} [props.perLevel] - Whether value scales with level
 * @param {boolean} props.enabled - Whether skill is active
 * @param {Function} props.onToggle - Toggle enabled state
 * @param {number} [props.userValue] - User-entered stat value
 * @param {Function} [props.onValueChange] - Called with new value
 * @param {number} [props.effectiveLevel] - Override level (for paragon editing)
 * @param {Function} [props.onLevelChange] - Called with new level
 */
export function SkillRow({
  name,
  level,
  type,
  statId,
  perLevel,
  enabled,
  onToggle,
  userValue,
  onValueChange,
  effectiveLevel,
  onLevelChange,
}) {
  const isParagon = type === 'paragon';
  const displayLevel = effectiveLevel !== undefined ? effectiveLevel : level;

  const typeBadgeClass = {
    ability: 'skill-badge-ability',
    stat: 'skill-badge-stat',
    buff: 'skill-badge-buff',
    paragon: 'skill-badge-paragon',
    utility: 'skill-badge-utility',
  }[type] || 'skill-badge-stat';

  return (
    <div className={`skill-row ${!enabled ? 'skill-row-disabled' : ''}`}>
      <label className="skill-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
        />
        <span className="skill-name">{name}</span>
      </label>

      <span className={`skill-badge ${typeBadgeClass}`}>{type}</span>

      {isParagon && onLevelChange ? (
        <div className="skill-level-input">
          <span className="skill-level-label">Lv</span>
          <StatInput
            value={displayLevel}
            onChange={onLevelChange}
            min={0}
            step={1}
            disabled={!enabled}
            placeholder="0"
          />
        </div>
      ) : (
        <span className="skill-level">Lv {displayLevel}</span>
      )}

      {statId && onValueChange && (
        <div className="skill-value-input">
          <StatInput
            value={userValue || 0}
            onChange={onValueChange}
            min={0}
            step={1}
            isPercent
            disabled={!enabled}
            placeholder="0"
          />
          <span className="skill-stat-id">{statId}</span>
        </div>
      )}
    </div>
  );
}
