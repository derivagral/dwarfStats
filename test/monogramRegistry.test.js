import { describe, it, expect } from 'vitest';
import {
  MONOGRAM_REGISTRY,
  getMonogramById,
  getMonogramName,
  isKnownMonogram,
  parseMonogramTag,
} from '../src/utils/monogramRegistry.js';

describe('monogramRegistry generated-data fallback', () => {
  it('curated entries still win over generated data', () => {
    const def = getMonogramById('Bloodlust.Base');
    expect(def).toBe(MONOGRAM_REGISTRY['Bloodlust.Base']);
    expect(def.generated).toBeUndefined();
  });

  it('falls back to generated game data for uncurated monograms', () => {
    // EleAsBasePhys exists in the extracted game data but not the curated registry
    expect(MONOGRAM_REGISTRY['EleAsBasePhys']).toBeUndefined();
    const def = getMonogramById('EleAsBasePhys');
    expect(def).not.toBeNull();
    expect(def.generated).toBe(true);
    expect(def.description).toMatch(/elemental damage as Physical/i);
  });

  it('resolves full tags through the generated fallback', () => {
    const { def } = parseMonogramTag('EasyRPG.Items.Modifiers.GlobalEssenceDamageHpDrain');
    expect(def).not.toBeNull();
    expect(isKnownMonogram('GlobalEssenceDamageHpDrain')).toBe(true);
  });

  it('exposes machine-readable effects from game data', () => {
    const def = getMonogramById('DamageGainNoEnergy');
    // Curated entry may exist; if so effects come from curated def — check a
    // generated-only entry instead for tag/value effect pairs.
    const generatedOnly = getMonogramById('EnergyNoHPRegen');
    const withEffects = [def, generatedOnly].find(d => d?.effects?.length);
    expect(withEffects).toBeTruthy();
    expect(withEffects.effects[0]).toHaveProperty('tag');
    expect(withEffects.effects[0]).toHaveProperty('value');
  });

  it('still returns null / prettified name for truly unknown ids', () => {
    expect(getMonogramById('TotallyFakeTag.DoesNotExist')).toBeNull();
    expect(isKnownMonogram('TotallyFakeTag.DoesNotExist')).toBe(false);
    expect(getMonogramName('TotallyFakeTag.DoesNotExist')).toBe('Totally Fake Tag Does Not Exist');
  });
});
