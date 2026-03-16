import React, { useState, useCallback } from 'react';
import { SkillRow } from './SkillRow';
import { getWeaponSkillDef } from '../../utils/skillTreeRegistry';
import { WEAPON_TYPE } from '../../models/SkillTree';

const WEAPON_LABELS = {
  [WEAPON_TYPE.SPEAR]: 'Spear',
  [WEAPON_TYPE.MAULS]: 'Mauls',
  [WEAPON_TYPE.ONE_HAND]: 'One-Hand',
  [WEAPON_TYPE.TWO_HAND]: 'Two-Hand',
  [WEAPON_TYPE.ARCHERY]: 'Archery',
  [WEAPON_TYPE.MAGERY]: 'Magery',
  [WEAPON_TYPE.SCYTHE]: 'Scythe',
  [WEAPON_TYPE.UNARMED]: 'Unarmed',
};

/**
 * Collapsible weapon stance skills grouped by weapon type
 *
 * @param {Object} props
 * @param {Object} props.weaponStances - { [weaponType]: WeaponStanceData }
 * @param {Object} props.skillOverrides - { [rowName]: { enabled, level } }
 * @param {Function} props.onOverride - (rowName, override) => void
 * @param {Object} props.skillValues - { [rowName]: number }
 * @param {Function} props.onValueChange - (rowName, value) => void
 * @param {Function} props.isSkillEnabled - (rowName) => boolean
 * @param {Function} props.getEffectiveLevel - (rowName, saveLevel) => number
 */
export function WeaponSkillsSection({
  weaponStances,
  skillOverrides,
  onOverride,
  skillValues,
  onValueChange,
  isSkillEnabled,
  getEffectiveLevel,
}) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = useCallback((weaponType) => {
    setCollapsed(prev => ({ ...prev, [weaponType]: !prev[weaponType] }));
  }, []);

  if (!weaponStances) return null;

  // Only show weapon types with allocated skills
  const activeStances = Object.entries(weaponStances)
    .filter(([, data]) => data.skills.length > 0)
    .sort(([, a], [, b]) => b.skills.length - a.skills.length);

  if (activeStances.length === 0) return null;

  return (
    <div className="skill-section">
      <div className="skill-section-header">
        <span className="skill-section-title">Weapon Stances</span>
        <span className="skill-section-subtitle">Auto-detected from save</span>
      </div>

      {activeStances.map(([weaponType, stanceData]) => {
        const isCollapsed = collapsed[weaponType];
        const label = WEAPON_LABELS[weaponType] || weaponType;

        return (
          <div key={weaponType} className="weapon-group">
            <button
              className="weapon-group-header"
              onClick={() => toggleCollapse(weaponType)}
            >
              <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              <span className="weapon-label">{label}</span>
              <span className="weapon-count">{stanceData.skills.length} skills</span>
              {stanceData.xp > 0 && (
                <span className="weapon-xp">XP: {stanceData.xp.toLocaleString()}</span>
              )}
            </button>

            {!isCollapsed && (
              <div className="weapon-skills-list">
                {stanceData.skills.map(skill => {
                  const def = getWeaponSkillDef(skill.rowName);
                  const name = def?.name || skill.rowName;
                  const type = def?.type || 'stat';
                  const statId = def?.statId;
                  const perLevel = def?.perLevel;
                  const enabled = isSkillEnabled(skill.rowName);
                  const effectiveLevel = getEffectiveLevel(skill.rowName, skill.level);

                  return (
                    <SkillRow
                      key={skill.rowName}
                      name={name}
                      level={skill.level}
                      type={type}
                      statId={statId}
                      perLevel={perLevel}
                      enabled={enabled}
                      onToggle={() => onOverride(skill.rowName, { enabled: !enabled })}
                      userValue={skillValues[skill.rowName]}
                      onValueChange={statId ? (v) => onValueChange(skill.rowName, v) : undefined}
                      effectiveLevel={type === 'paragon' ? effectiveLevel : undefined}
                      onLevelChange={type === 'paragon'
                        ? (v) => onOverride(skill.rowName, { level: v })
                        : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
