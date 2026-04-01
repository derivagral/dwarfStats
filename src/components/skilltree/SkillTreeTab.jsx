import React from 'react';
import { KeystoneChecklist } from './KeystoneChecklist';
import { WeaponSkillsSection } from './WeaponSkillsSection';
import { CraftingSkillsSection } from './CraftingSkillsSection';
import { CardsSection } from './CardsSection';
import { countMainNodeTypes } from '../../models/SkillTree';
import './SkillTreeTab.css';

/**
 * Skill Tree tab - displays auto-detected skills and manual keystone checklist
 *
 * @param {Object} props
 * @param {Object} props.skillTreeStore - From useSkillTreeStore
 * @param {Object} props.saveData - Raw save data (for reference)
 * @param {Function} props.onLog - Logging callback
 */
export function SkillTreeTab({ skillTreeStore, saveData, onLog }) {
  const {
    skillTreeData,
    keystoneSelections,
    skillOverrides,
    skillValues,
    toggleKeystone,
    overrideSkill,
    setSkillValue,
    resetOverrides,
    isSkillEnabled,
    getEffectiveLevel,
  } = skillTreeStore;

  if (!skillTreeData) {
    return (
      <div className="tab-content active">
        <div className="skilltree-empty">No skill tree data available.</div>
      </div>
    );
  }

  const { metadata } = skillTreeData;
  const mainNodeCounts = countMainNodeTypes(skillTreeData);

  return (
    <div className="tab-content active">
      {/* Header with metadata */}
      <div className="skilltree-header">
        <div className="skilltree-meta">
          <span className="skilltree-meta-item">
            <strong>{metadata.totalNodes}</strong> total nodes
          </span>
          <span className="skilltree-meta-item">
            <strong>{metadata.skillPoints}</strong> skill points
          </span>
          <span className="skilltree-meta-item">
            <strong>{metadata.elvenCounter}</strong> elven counter
          </span>
        </div>
        <button className="btn skilltree-reset-btn" onClick={resetOverrides}>
          Reset All
        </button>
      </div>

      {/* Main tree summary (opaque IDs, count only) */}
      <div className="skill-section">
        <div className="skill-section-header">
          <span className="skill-section-title">Main Passive Tree</span>
          <span className="skill-section-subtitle">
            {skillTreeData.mainTree.length} nodes ({mainNodeCounts.small} small, {mainNodeCounts.large} large, {mainNodeCounts.dropdown} dropdown)
          </span>
        </div>
      </div>

      {/* Keystones - manual checklist */}
      <KeystoneChecklist
        selections={keystoneSelections}
        onToggle={toggleKeystone}
        skillValues={skillValues}
        onValueChange={setSkillValue}
      />

      {/* Weapon stances - auto-detected */}
      <WeaponSkillsSection
        weaponStances={skillTreeData.weaponStances}
        skillOverrides={skillOverrides}
        onOverride={overrideSkill}
        skillValues={skillValues}
        onValueChange={setSkillValue}
        isSkillEnabled={isSkillEnabled}
        getEffectiveLevel={getEffectiveLevel}
      />

      {/* Crafting/Elven - auto-detected */}
      <CraftingSkillsSection
        crafting={skillTreeData.crafting}
        skillOverrides={skillOverrides}
        onOverride={overrideSkill}
        skillValues={skillValues}
        onValueChange={setSkillValue}
        isSkillEnabled={isSkillEnabled}
        getEffectiveLevel={getEffectiveLevel}
      />

      {/* Cards - visual only */}
      <CardsSection
        cards={skillTreeData.cards}
        skillTreeData={skillTreeData}
      />
    </div>
  );
}
