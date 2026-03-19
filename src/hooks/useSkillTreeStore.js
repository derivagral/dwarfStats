import { useState, useCallback, useMemo } from 'react';
import { extractSkillTree } from '../utils/skillTreeParser';
import {
  getWeaponSkillDef,
  getCraftingSkillDef,
  TREE_KEYSTONES,
} from '../utils/skillTreeRegistry';

/**
 * Central store for skill tree data with override support
 *
 * Manages auto-detected skills from save files, manual keystone selections,
 * and user-entered stat values. Computes effective stats and config overrides
 * for integration with the derived stats calculation engine.
 *
 * @returns {Object} Skill tree store state and methods
 */
export function useSkillTreeStore() {
  // Parsed skill tree data from save file
  const [skillTreeData, setSkillTreeData] = useState(null);

  // Manual keystone selections: { [keystoneId]: boolean }
  const [keystoneSelections, setKeystoneSelections] = useState({});

  // Per-skill overrides: { [rowName]: { enabled: boolean, level?: number } }
  const [skillOverrides, setSkillOverrides] = useState({});

  // User-entered stat values: { [rowName]: number }
  const [skillValues, setSkillValuesState] = useState({});

  /**
   * Load skill tree from parsed save data
   */
  const loadFromSave = useCallback((saveJson) => {
    const data = extractSkillTree(saveJson);
    setSkillTreeData(data);
    // Reset user state on new load
    setKeystoneSelections({});
    setSkillOverrides({});
    setSkillValuesState({});
  }, []);

  /**
   * Clear all skill tree state
   */
  const clear = useCallback(() => {
    setSkillTreeData(null);
    setKeystoneSelections({});
    setSkillOverrides({});
    setSkillValuesState({});
  }, []);

  /**
   * Toggle a keystone selection
   */
  const toggleKeystone = useCallback((keystoneId) => {
    setKeystoneSelections(prev => ({
      ...prev,
      [keystoneId]: !prev[keystoneId],
    }));
  }, []);

  /**
   * Override a skill's enabled state or level
   */
  const overrideSkill = useCallback((rowName, override) => {
    setSkillOverrides(prev => ({
      ...prev,
      [rowName]: { ...prev[rowName], ...override },
    }));
  }, []);

  /**
   * Set the numeric stat value for a skill
   */
  const setSkillValue = useCallback((rowName, value) => {
    setSkillValuesState(prev => ({
      ...prev,
      [rowName]: value,
    }));
  }, []);

  /**
   * Reset all user overrides and values
   */
  const resetOverrides = useCallback(() => {
    setSkillOverrides({});
    setSkillValuesState({});
    setKeystoneSelections({});
  }, []);

  const isLoaded = skillTreeData !== null;

  /**
   * Check if a skill is effectively enabled
   * Default: enabled if present in save data
   */
  const isSkillEnabled = useCallback((rowName) => {
    const override = skillOverrides[rowName];
    if (override && override.enabled !== undefined) return override.enabled;
    return true; // default: enabled if in save
  }, [skillOverrides]);

  /**
   * Get effective level for a skill (override or save level)
   */
  const getEffectiveLevel = useCallback((rowName, saveLevel) => {
    const override = skillOverrides[rowName];
    if (override && override.level !== undefined) return override.level;
    return saveLevel;
  }, [skillOverrides]);

  /**
   * Aggregate stats from all active skills with user-entered values
   * Returns { [statId]: { total: number, sources: [] } } for useDerivedStats
   */
  const effectiveSkillStats = useMemo(() => {
    if (!skillTreeData) return {};

    const stats = {};

    const addStat = (statId, value, sourceName) => {
      if (!statId || !value) return;
      if (!stats[statId]) {
        stats[statId] = { total: 0, sources: [] };
      }
      stats[statId].total += value;
      stats[statId].sources.push({
        itemName: sourceName,
        slot: 'skillTree',
        value,
      });
    };

    // Process weapon stance skills
    for (const [, stanceData] of Object.entries(skillTreeData.weaponStances)) {
      for (const skill of stanceData.skills) {
        if (!isSkillEnabled(skill.rowName)) continue;

        const def = getWeaponSkillDef(skill.rowName);
        if (!def || !def.statId) continue;

        const userValue = skillValues[skill.rowName];
        if (userValue === undefined || userValue === 0) continue;

        const level = getEffectiveLevel(skill.rowName, skill.level);
        const value = def.perLevel ? userValue * level : userValue;
        addStat(def.statId, value, def.name);
      }
    }

    // Process crafting skills
    for (const skill of skillTreeData.crafting) {
      if (!isSkillEnabled(skill.rowName)) continue;

      const def = getCraftingSkillDef(skill.rowName);
      if (!def || !def.statId) continue;

      const userValue = skillValues[skill.rowName];
      if (userValue === undefined || userValue === 0) continue;

      const level = getEffectiveLevel(skill.rowName, skill.level);
      const value = def.paragon ? userValue * level : userValue;
      addStat(def.statId, value, def.name);
    }

    // Process keystone selections with statIds
    for (const [keystoneId, selected] of Object.entries(keystoneSelections)) {
      if (!selected) continue;
      const keystone = TREE_KEYSTONES[keystoneId];
      if (!keystone || !keystone.statId) continue;

      const userValue = skillValues[keystoneId];
      if (userValue === undefined || userValue === 0) continue;

      addStat(keystone.statId, userValue, keystone.name);
    }

    return stats;
  }, [skillTreeData, skillOverrides, skillValues, keystoneSelections, isSkillEnabled, getEffectiveLevel]);

  /**
   * Build config overrides from keystone selections for derived stats
   * Maps keystones to eDPS config overrides
   */
  const skillConfigOverrides = useMemo(() => {
    const overrides = {};

    // Affinity damage keystones → edpsAD affinityDamage
    const affinityDamageKeystones = ['fireAffinityDamage', 'arcaneAffinityDamage', 'lightningAffinityDamage'];
    let totalAffinityDamage = 0;
    for (const id of affinityDamageKeystones) {
      if (keystoneSelections[id]) {
        // Default ~100% additive per affinity, or use user value
        totalAffinityDamage += skillValues[id] || 1.0;
      }
    }
    if (totalAffinityDamage > 0) {
      overrides.edpsAD = {
        ...(overrides.edpsAD || {}),
        affinityDamage: totalAffinityDamage,
      };
    }

    // Proximity keystones → edpsEMulti distanceProcs
    if (keystoneSelections.closeDistance) {
      overrides.edpsEMulti = {
        ...(overrides.edpsEMulti || {}),
        closeDistanceKeystone: true,
      };
    }
    if (keystoneSelections.farDistance) {
      overrides.edpsEMulti = {
        ...(overrides.edpsEMulti || {}),
        farDistanceKeystone: true,
      };
    }

    return overrides;
  }, [keystoneSelections, skillValues]);

  return {
    // State
    skillTreeData,
    keystoneSelections,
    skillOverrides,
    skillValues,
    isLoaded,

    // Computed
    effectiveSkillStats,
    skillConfigOverrides,

    // Actions
    loadFromSave,
    clear,
    toggleKeystone,
    overrideSkill,
    setSkillValue,
    resetOverrides,
    isSkillEnabled,
    getEffectiveLevel,
  };
}

export default useSkillTreeStore;
