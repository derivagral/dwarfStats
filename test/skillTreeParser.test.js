import { describe, it, expect, beforeAll } from 'vitest';
import { extractSkillTree, categorizeSkill } from '../src/utils/skillTreeParser.js';
import {
  SKILL_CATEGORY,
  WEAPON_TYPE,
  MAIN_NODE_TYPE,
  parseCardRowName,
  classifyMainNode,
  countMainNodeTypes,
  getCardsByFamily,
  getWeaponStance,
  getSkillsByCategory,
  createEmptySkillTreeData,
} from '../src/models/SkillTree.js';
import {
  getWeaponSkillDef,
  getCraftingSkillDef,
  getCardDef,
  getKeystoneDef,
  getAllKeystones,
  isKnownWeaponSkill,
  isKnownCraftingSkill,
  getWeaponSkillsByType,
  getCraftingSkillsByBranch,
} from '../src/utils/skillTreeRegistry.js';

import fs from 'fs';
import path from 'path';

// Load the focused fixture
let skillsFixture;
let skillTree;

beforeAll(() => {
  const fixturePath = path.join(import.meta.dirname, 'fixtures', 'dr-character-skills.json');
  skillsFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  skillTree = extractSkillTree(skillsFixture);
});

// =============================================================================
// PARSER TESTS
// =============================================================================

describe('skillTreeParser', () => {
  describe('extractSkillTree', () => {
    it('should parse all 381 skill entries', () => {
      expect(skillTree.metadata.totalNodes).toBe(381);
    });

    it('should categorize main tree nodes (231)', () => {
      expect(skillTree.mainTree).toHaveLength(231);
    });

    it('should categorize weapon stance skills (110 total)', () => {
      const totalWeapon = Object.values(skillTree.weaponStances)
        .reduce((sum, ws) => sum + ws.skills.length, 0);
      expect(totalWeapon).toBe(94);
    });

    it('should categorize crystal cards (16)', () => {
      expect(skillTree.cards).toHaveLength(16);
    });

    it('should categorize crafting/elven skills (40)', () => {
      expect(skillTree.crafting).toHaveLength(40);
    });

    it('should break down weapon stances by type', () => {
      expect(skillTree.weaponStances.spear.skills).toHaveLength(14);
      expect(skillTree.weaponStances.mauls.skills).toHaveLength(14);
      expect(skillTree.weaponStances.oneHand.skills).toHaveLength(11);
      expect(skillTree.weaponStances.twoHand.skills).toHaveLength(11);
      expect(skillTree.weaponStances.archery.skills).toHaveLength(11);
      expect(skillTree.weaponStances.magery.skills).toHaveLength(11);
      expect(skillTree.weaponStances.scythe.skills).toHaveLength(11);
      expect(skillTree.weaponStances.unarmed.skills).toHaveLength(11);
    });

    it('should extract paragon-level skills correctly', () => {
      const polearm = skillTree.weaponStances.mauls.skills
        .find(s => s.rowName === 'PolearmDamage');
      expect(polearm).toBeDefined();
      expect(polearm.level).toBe(732);

      const paragon = skillTree.crafting
        .find(s => s.rowName === 'Damage_Bonus_DamageEnd_PARAGON');
      expect(paragon).toBeDefined();
      expect(paragon.level).toBe(177);
    });

    it('should extract multi-level weapon skills', () => {
      const spearDmg = skillTree.weaponStances.spear.skills
        .find(s => s.rowName === 'SpearsDamage');
      expect(spearDmg).toBeDefined();
      expect(spearDmg.level).toBe(5);
    });

    it('should extract card levels correctly', () => {
      const card5_1 = skillTree.cards.find(s => s.rowName === 'CARD5_1');
      expect(card5_1).toBeDefined();
      expect(card5_1.level).toBe(6);

      const card11 = skillTree.cards.find(s => s.rowName === 'CARD11');
      expect(card11).toBeDefined();
      expect(card11.level).toBe(3);

      const card7 = skillTree.cards.find(s => s.rowName === 'CARD7');
      expect(card7).toBeDefined();
      expect(card7.level).toBe(1);
    });

    it('should set correct category on each entry', () => {
      for (const entry of skillTree.mainTree) {
        expect(entry.category).toBe(SKILL_CATEGORY.MAIN);
      }
      for (const entry of skillTree.cards) {
        expect(entry.category).toBe(SKILL_CATEGORY.CARD);
      }
      for (const entry of skillTree.crafting) {
        expect(entry.category).toBe(SKILL_CATEGORY.CRAFTING);
      }
      for (const ws of Object.values(skillTree.weaponStances)) {
        for (const entry of ws.skills) {
          expect(entry.category).toBe(SKILL_CATEGORY.WEAPON);
        }
      }
    });
  });

  describe('metadata extraction', () => {
    it('should extract gained skill points', () => {
      expect(skillTree.metadata.skillPoints).toBe(199);
    });

    it('should extract elven counter', () => {
      expect(skillTree.metadata.elvenCounter).toBe(906);
    });

    it('should extract weapon XP values', () => {
      expect(skillTree.weaponStances.spear.xp).toBe(7680);
      expect(skillTree.weaponStances.mauls.xp).toBe(261870);
      expect(skillTree.weaponStances.oneHand.xp).toBe(4030);
      expect(skillTree.weaponStances.twoHand.xp).toBe(3600);
      expect(skillTree.weaponStances.archery.xp).toBe(3600);
      expect(skillTree.weaponStances.magery.xp).toBe(3760);
      expect(skillTree.weaponStances.unarmed.xp).toBe(3600);
      expect(skillTree.weaponStances.scythe.xp).toBe(3720);
    });

    it('should populate weaponXp in metadata', () => {
      expect(skillTree.metadata.weaponXp[WEAPON_TYPE.MAULS]).toBe(261870);
      expect(skillTree.metadata.weaponXp[WEAPON_TYPE.SPEAR]).toBe(7680);
    });
  });

  describe('edge cases', () => {
    it('should return empty data for null input', () => {
      const result = extractSkillTree(null);
      expect(result.metadata.totalNodes).toBe(0);
      expect(result.mainTree).toHaveLength(0);
    });

    it('should return empty data for empty object', () => {
      const result = extractSkillTree({});
      expect(result.metadata.totalNodes).toBe(0);
    });

    it('should return empty data for object without HostPlayerData', () => {
      const result = extractSkillTree({ root: { properties: {} } });
      expect(result.metadata.totalNodes).toBe(0);
    });
  });

  describe('categorizeSkill', () => {
    it('should detect main tree', () => {
      const result = categorizeSkill('/Game/.../DT_GENERATED_SkillTree_Main.DT_GENERATED_SkillTree_Main');
      expect(result.category).toBe(SKILL_CATEGORY.MAIN);
      expect(result.weaponType).toBeNull();
    });

    it('should detect cards', () => {
      const result = categorizeSkill('/Game/.../DT_Crystal_Cards_Skills.DT_Crystal_Cards_Skills');
      expect(result.category).toBe(SKILL_CATEGORY.CARD);
    });

    it('should detect crafting', () => {
      const result = categorizeSkill('/Game/.../DT_Skills_Crafting_S24.DT_Skills_Crafting_S24');
      expect(result.category).toBe(SKILL_CATEGORY.CRAFTING);
    });

    it('should detect weapon types', () => {
      const spear = categorizeSkill('/Game/.../DT_Skills_Spear.DT_Skills_Spear');
      expect(spear.category).toBe(SKILL_CATEGORY.WEAPON);
      expect(spear.weaponType).toBe(WEAPON_TYPE.SPEAR);

      const archery = categorizeSkill('/Game/.../DT_Skills_Archery.DT_Skills_Archery');
      expect(archery.weaponType).toBe(WEAPON_TYPE.ARCHERY);
    });
  });
});

// =============================================================================
// MODEL TESTS
// =============================================================================

describe('SkillTree model', () => {
  describe('parseCardRowName', () => {
    it('should parse CARD5_1', () => {
      const result = parseCardRowName('CARD5_1');
      expect(result).toEqual({ family: 5, variant: 1 });
    });

    it('should parse CARD11 (no variant)', () => {
      const result = parseCardRowName('CARD11');
      expect(result).toEqual({ family: 11, variant: null });
    });

    it('should parse CARD17_4', () => {
      const result = parseCardRowName('CARD17_4');
      expect(result).toEqual({ family: 17, variant: 4 });
    });

    it('should parse CARD11_0 (variant 0)', () => {
      const result = parseCardRowName('CARD11_0');
      expect(result).toEqual({ family: 11, variant: 0 });
    });

    it('should return null for invalid input', () => {
      expect(parseCardRowName(null)).toBeNull();
      expect(parseCardRowName('')).toBeNull();
      expect(parseCardRowName('NotACard')).toBeNull();
    });
  });

  describe('classifyMainNode', () => {
    it('should classify Small nodes', () => {
      expect(classifyMainNode('UI_SkillTreeNode_Small_624')).toBe(MAIN_NODE_TYPE.SMALL);
    });

    it('should classify Large nodes', () => {
      expect(classifyMainNode('UI_SkillTreeNode_Large_1')).toBe(MAIN_NODE_TYPE.LARGE);
      expect(classifyMainNode('UI_SkillTreeNode_Large')).toBe(MAIN_NODE_TYPE.LARGE);
    });

    it('should classify DropDown nodes', () => {
      expect(classifyMainNode('UI_SkillTreeNode_DropDown_32_1')).toBe(MAIN_NODE_TYPE.DROPDOWN);
    });
  });

  describe('countMainNodeTypes', () => {
    it('should count node types from fixture data', () => {
      const counts = countMainNodeTypes(skillTree);
      // From our exploration: 166 small + 26 large + 39 dropdown = 231
      expect(counts.small).toBeGreaterThan(150);
      expect(counts.large).toBeGreaterThan(20);
      expect(counts.dropdown).toBeGreaterThan(30);
      expect(counts.small + counts.large + counts.dropdown + counts.unknown).toBe(231);
    });
  });

  describe('getCardsByFamily', () => {
    it('should group cards by family', () => {
      const families = getCardsByFamily(skillTree);
      // CARD11 family has 4 entries: CARD11, CARD11_0, CARD11_2, CARD11_4
      expect(families[11]).toHaveLength(4);
      // CARD4 family has 2 entries: CARD4_1, CARD4_5
      expect(families[4]).toHaveLength(2);
      // CARD7 family has 1 entry
      expect(families[7]).toHaveLength(1);
    });
  });

  describe('getWeaponStance', () => {
    it('should return stance data for valid type', () => {
      const stance = getWeaponStance(skillTree, WEAPON_TYPE.MAULS);
      expect(stance).toBeDefined();
      expect(stance.skills.length).toBe(14);
      expect(stance.xp).toBe(261870);
    });

    it('should return null for invalid type', () => {
      expect(getWeaponStance(skillTree, 'invalid')).toBeNull();
    });
  });

  describe('getSkillsByCategory', () => {
    it('should return weapon skills flattened', () => {
      const weapons = getSkillsByCategory(skillTree, SKILL_CATEGORY.WEAPON);
      expect(weapons).toHaveLength(94);
    });
  });

  describe('createEmptySkillTreeData', () => {
    it('should create valid empty structure', () => {
      const empty = createEmptySkillTreeData();
      expect(empty.mainTree).toHaveLength(0);
      expect(empty.cards).toHaveLength(0);
      expect(empty.crafting).toHaveLength(0);
      expect(Object.keys(empty.weaponStances)).toHaveLength(8);
      expect(empty.metadata.totalNodes).toBe(0);
    });
  });
});

// =============================================================================
// REGISTRY TESTS
// =============================================================================

describe('skillTreeRegistry', () => {
  describe('weapon skill registry', () => {
    it('should find known weapon skills', () => {
      expect(getWeaponSkillDef('PolearmDamage')).toBeDefined();
      expect(getWeaponSkillDef('PolearmDamage').type).toBe('paragon');
      expect(getWeaponSkillDef('PolearmDamage').statId).toBe('maulDamage');
    });

    it('should identify ability nodes', () => {
      expect(getWeaponSkillDef('SpearsQ').type).toBe('ability');
      expect(getWeaponSkillDef('TwoHandsR').type).toBe('ability');
    });

    it('should identify buff nodes', () => {
      expect(getWeaponSkillDef('Spear_Damage_Buff').type).toBe('buff');
      expect(getWeaponSkillDef('1H_Damage_EndGame_Buff').type).toBe('buff');
    });

    it('should return null for unknown skills', () => {
      expect(getWeaponSkillDef('NotARealSkill')).toBeNull();
    });

    it('isKnownWeaponSkill should work', () => {
      expect(isKnownWeaponSkill('SpearCritDamage')).toBe(true);
      expect(isKnownWeaponSkill('Fake')).toBe(false);
    });

    it('should have all fixture weapon skills registered', () => {
      for (const ws of Object.values(skillTree.weaponStances)) {
        for (const skill of ws.skills) {
          expect(isKnownWeaponSkill(skill.rowName)).toBe(true);
        }
      }
    });

    it('getWeaponSkillsByType should filter correctly', () => {
      const spearSkills = getWeaponSkillsByType('spear');
      expect(spearSkills).toHaveLength(14);
      expect(spearSkills.every(s => s.weapon === 'spear')).toBe(true);
    });
  });

  describe('crafting skill registry', () => {
    it('should find known crafting skills', () => {
      expect(getCraftingSkillDef('Armor_Health%')).toBeDefined();
      expect(getCraftingSkillDef('Armor_Health%').statId).toBe('healthBonus');
    });

    it('should identify paragon nodes', () => {
      const paragon = getCraftingSkillDef('Damage_Bonus_DamageEnd_PARAGON');
      expect(paragon.paragon).toBe(true);
      expect(paragon.statId).toBe('damageBonus');
    });

    it('should have all fixture crafting skills registered', () => {
      for (const skill of skillTree.crafting) {
        expect(isKnownCraftingSkill(skill.rowName)).toBe(true);
      }
    });

    it('getCraftingSkillsByBranch should filter correctly', () => {
      const armor = getCraftingSkillsByBranch('armor');
      expect(armor).toHaveLength(8);
      expect(armor.every(s => s.branch === 'armor')).toBe(true);
    });
  });

  describe('card registry', () => {
    it('should find known cards', () => {
      expect(getCardDef('CARD5_1')).toBeDefined();
      expect(getCardDef('CARD5_1').family).toBe(5);
      expect(getCardDef('CARD5_1').variant).toBe(1);
    });

    it('should handle cards without variant', () => {
      expect(getCardDef('CARD11').variant).toBeNull();
      expect(getCardDef('CARD7').variant).toBeNull();
    });

    it('should have all fixture cards registered', () => {
      for (const card of skillTree.cards) {
        expect(getCardDef(card.rowName)).toBeDefined();
      }
    });
  });

  describe('tree keystones', () => {
    it('should have all keystone categories', () => {
      const keystones = getAllKeystones();
      const categories = new Set(keystones.map(k => k.category));
      expect(categories).toContain('proximity');
      expect(categories).toContain('mastery');
      expect(categories).toContain('affinity');
      expect(categories).toContain('utility');
    });

    it('should find keystones by id', () => {
      expect(getKeystoneDef('closeDistance')).toBeDefined();
      expect(getKeystoneDef('closeDistance').name).toBe('Close Distance');
    });

    it('proximity keystones should note monogram overlap', () => {
      const close = getKeystoneDef('closeDistance');
      expect(close.overlaps).toContain('monogram');
    });

    it('affinity damage keystones should reference stat IDs', () => {
      expect(getKeystoneDef('fireAffinityDamage').statId).toBe('fireDamageBonus');
      expect(getKeystoneDef('arcaneAffinityDamage').statId).toBe('arcaneDamageBonus');
      expect(getKeystoneDef('lightningAffinityDamage').statId).toBe('lightningDamageBonus');
    });
  });
});
