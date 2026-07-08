import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';
import { aggregateSkillEffects, hasWeaponSkillData } from '../src/utils/skillEffectAggregator.js';
import {
  createCharacterSharePayload,
  createSkillTreeShare,
  skillTreeShareToData,
  CHARACTER_SHARE_VERSION,
} from '../src/models/CharacterShareModel.js';
import {
  encodeCharacterShare,
  encodeCharacterShareCompressed,
  decodeCharacterShareAny,
  buildCharacterShareUrlCompressed,
} from '../src/utils/shareUrl.js';

let skillTree;

beforeAll(() => {
  const fixturePath = path.join(import.meta.dirname, 'fixtures', 'dr-character-skills.json');
  skillTree = extractSkillTree(JSON.parse(fs.readFileSync(fixturePath, 'utf8')));
});

describe('skill tree share section', () => {
  it('round-trips cards and weapon skills', () => {
    const st = createSkillTreeShare(skillTree);
    expect(st.cd.length).toBeGreaterThan(0);
    expect(st.ws.length).toBeGreaterThan(0);

    const restored = skillTreeShareToData(st);
    expect(hasWeaponSkillData(restored)).toBe(true);
    expect(restored.cards.length).toBe(skillTree.cards.length);

    // Paragon level survives (PolearmDamage L732, bucketed under mauls)
    const mauls = restored.weaponStances.mauls.skills.find(s => s.rowName === 'PolearmDamage');
    expect(mauls?.level).toBe(732);
  });

  it('restored tree produces identical aggregated skill effects', () => {
    const original = aggregateSkillEffects(skillTree);
    const restored = aggregateSkillEffects(skillTreeShareToData(createSkillTreeShare(skillTree)));

    const total = (contribs) => {
      const sums = {};
      for (const c of contribs) sums[c.tag] = (sums[c.tag] || 0) + c.value;
      return sums;
    };
    expect(total(restored)).toEqual(total(original));
  });

  it('returns null for empty trees', () => {
    expect(createSkillTreeShare(null)).toBeNull();
    expect(skillTreeShareToData(null)).toBeNull();
    expect(skillTreeShareToData({})).toBeNull();
  });
});

describe('compressed (v2) share encoding', () => {
  it('round-trips a full payload with skill tree', async () => {
    const payload = createCharacterSharePayload([], null, { luck: { value: 361 } }, 3731, skillTree);
    expect(payload.v).toBe(CHARACTER_SHARE_VERSION);
    expect(payload.st).toBeDefined();

    const code = await encodeCharacterShareCompressed(payload);
    expect(code.startsWith('2.')).toBe(true);

    const decoded = await decodeCharacterShareAny(code);
    expect(decoded).toEqual(payload);
  });

  it('still decodes legacy v1 uncompressed codes', async () => {
    const legacy = { v: 1, e: [], hp: 1000 };
    const code = encodeCharacterShare(legacy);
    const decoded = await decodeCharacterShareAny(code);
    expect(decoded).toEqual(legacy);
  });

  it('rejects garbage input', async () => {
    expect(await decodeCharacterShareAny('2.not-valid-deflate!!')).toBeNull();
    expect(await decodeCharacterShareAny('')).toBeNull();
    expect(await decodeCharacterShareAny(null)).toBeNull();
  });

  it('compression keeps the URL under the practical limit', async () => {
    const payload = createCharacterSharePayload([], null, null, 0, skillTree);
    const url = await buildCharacterShareUrlCompressed(payload, 'https://example.com/');
    console.log(`Skill-tree-only compressed URL: ${url.length} chars (${skillTree.cards.length} cards, ${
      Object.values(skillTree.weaponStances).reduce((n, s) => n + s.skills.length, 0)} weapon skills)`);
    expect(url.length).toBeLessThan(8000);
  });
});
