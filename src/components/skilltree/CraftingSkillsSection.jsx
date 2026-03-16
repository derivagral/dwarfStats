import React, { useState, useCallback } from 'react';
import { SkillRow } from './SkillRow';
import { getCraftingSkillDef } from '../../utils/skillTreeRegistry';

const BRANCH_LABELS = {
  armor: 'Armor',
  damage: 'Damage',
  crafting: 'Crafting',
  exp: 'Experience',
  luck: 'Luck',
  timeTear: 'Time Tear',
  utility: 'Utility',
};

const BRANCH_ORDER = ['armor', 'damage', 'luck', 'crafting', 'exp', 'timeTear', 'utility'];

/**
 * Crafting/Elven skills grouped by branch
 *
 * @param {Object} props
 * @param {Array} props.crafting - Crafting skill entries from save
 * @param {Object} props.skillOverrides - { [rowName]: { enabled, level } }
 * @param {Function} props.onOverride - (rowName, override) => void
 * @param {Object} props.skillValues - { [rowName]: number }
 * @param {Function} props.onValueChange - (rowName, value) => void
 * @param {Function} props.isSkillEnabled - (rowName) => boolean
 * @param {Function} props.getEffectiveLevel - (rowName, saveLevel) => number
 */
export function CraftingSkillsSection({
  crafting,
  skillOverrides,
  onOverride,
  skillValues,
  onValueChange,
  isSkillEnabled,
  getEffectiveLevel,
}) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = useCallback((branch) => {
    setCollapsed(prev => ({ ...prev, [branch]: !prev[branch] }));
  }, []);

  if (!crafting || crafting.length === 0) return null;

  // Group by branch
  const grouped = {};
  for (const skill of crafting) {
    const def = getCraftingSkillDef(skill.rowName);
    const branch = def?.branch || 'utility';
    if (!grouped[branch]) grouped[branch] = [];
    grouped[branch].push(skill);
  }

  const activeBranches = BRANCH_ORDER.filter(b => grouped[b] && grouped[b].length > 0);

  return (
    <div className="skill-section">
      <div className="skill-section-header">
        <span className="skill-section-title">Crafting / Elven Tree</span>
        <span className="skill-section-subtitle">Auto-detected from save</span>
      </div>

      {activeBranches.map(branch => {
        const skills = grouped[branch];
        const isCollapsed = collapsed[branch];
        const label = BRANCH_LABELS[branch] || branch;

        return (
          <div key={branch} className="weapon-group">
            <button
              className="weapon-group-header"
              onClick={() => toggleCollapse(branch)}
            >
              <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              <span className="weapon-label">{label}</span>
              <span className="weapon-count">{skills.length} skills</span>
            </button>

            {!isCollapsed && (
              <div className="weapon-skills-list">
                {skills.map(skill => {
                  const def = getCraftingSkillDef(skill.rowName);
                  const name = def?.name || skill.rowName;
                  const statId = def?.statId;
                  const isParagon = def?.paragon;
                  const enabled = isSkillEnabled(skill.rowName);
                  const effectiveLevel = getEffectiveLevel(skill.rowName, skill.level);

                  return (
                    <SkillRow
                      key={skill.rowName}
                      name={name}
                      level={skill.level}
                      type={isParagon ? 'paragon' : (statId ? 'stat' : 'utility')}
                      statId={statId}
                      perLevel={isParagon}
                      enabled={enabled}
                      onToggle={() => onOverride(skill.rowName, { enabled: !enabled })}
                      userValue={skillValues[skill.rowName]}
                      onValueChange={statId ? (v) => onValueChange(skill.rowName, v) : undefined}
                      effectiveLevel={isParagon ? effectiveLevel : undefined}
                      onLevelChange={isParagon
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
