import { describe, it, expect } from 'vitest';
import {
  createFilterModel,
  addAffix,
  removeAffix,
  addMonogram,
  removeMonogram,
  updateOptions,
  hasAnyCriteria,
  serializeFilter,
  deserializeFilter,
} from '../src/models/FilterModel.js';

describe('FilterModel', () => {
  describe('createFilterModel', () => {
    it('should create a filter model with default values', () => {
      const model = createFilterModel();
      expect(model.id).toBeDefined();
      expect(model.name).toBe('Untitled Filter');
      expect(model.affixes).toEqual([]);
      expect(model.monograms).toEqual([]);
      expect(model.options.minHitsPerPool).toBe(1);
      expect(model.options.closeMinTotal).toBe(2);
      expect(model.options.includeWeapons).toBe(true);
    });

    it('should accept a custom name', () => {
      const model = createFilterModel('My Build');
      expect(model.name).toBe('My Build');
    });

    it('should generate unique IDs', () => {
      const a = createFilterModel();
      const b = createFilterModel();
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('addAffix / removeAffix', () => {
    it('should add an affix immutably', () => {
      const model = createFilterModel();
      const updated = addAffix(model, 'strength');
      expect(updated.affixes.length).toBe(1);
      expect(updated.affixes[0].affixId).toBe('strength');
      // Original unchanged
      expect(model.affixes.length).toBe(0);
    });

    it('should not add duplicates', () => {
      const model = addAffix(createFilterModel(), 'strength');
      const again = addAffix(model, 'strength');
      expect(again.affixes.length).toBe(1);
      expect(again).toBe(model); // Same reference, no mutation
    });

    it('should remove an affix immutably', () => {
      let model = createFilterModel();
      model = addAffix(model, 'strength');
      model = addAffix(model, 'vitality');
      const updated = removeAffix(model, 'strength');
      expect(updated.affixes.length).toBe(1);
      expect(updated.affixes[0].affixId).toBe('vitality');
    });
  });

  describe('addMonogram / removeMonogram', () => {
    it('should add a monogram immutably', () => {
      const model = createFilterModel();
      const updated = addMonogram(model, 'Bloodlust.Base');
      expect(updated.monograms.length).toBe(1);
      expect(updated.monograms[0].monogramId).toBe('Bloodlust.Base');
      expect(model.monograms.length).toBe(0);
    });

    it('should not add duplicates', () => {
      const model = addMonogram(createFilterModel(), 'Bloodlust.Base');
      const again = addMonogram(model, 'Bloodlust.Base');
      expect(again).toBe(model);
    });

    it('should remove a monogram immutably', () => {
      let model = createFilterModel();
      model = addMonogram(model, 'Bloodlust.Base');
      model = addMonogram(model, 'AllowPhasing');
      const updated = removeMonogram(model, 'Bloodlust.Base');
      expect(updated.monograms.length).toBe(1);
      expect(updated.monograms[0].monogramId).toBe('AllowPhasing');
    });
  });

  describe('updateOptions', () => {
    it('should update options immutably', () => {
      const model = createFilterModel();
      const updated = updateOptions(model, { minHitsPerPool: 2, closeMinTotal: 3 });
      expect(updated.options.minHitsPerPool).toBe(2);
      expect(updated.options.closeMinTotal).toBe(3);
      expect(updated.options.includeWeapons).toBe(true); // Preserved
      expect(model.options.minHitsPerPool).toBe(1); // Original unchanged
    });
  });

  describe('hasAnyCriteria', () => {
    it('should return false for empty model', () => {
      expect(hasAnyCriteria(createFilterModel())).toBe(false);
    });

    it('should return true with affixes', () => {
      const model = addAffix(createFilterModel(), 'strength');
      expect(hasAnyCriteria(model)).toBe(true);
    });

    it('should return true with monograms', () => {
      const model = addMonogram(createFilterModel(), 'Bloodlust.Base');
      expect(hasAnyCriteria(model)).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should round-trip a filter model', () => {
      let model = createFilterModel('Test Filter');
      model = addAffix(model, 'strength');
      model = addAffix(model, 'critChance');
      model = addMonogram(model, 'Bloodlust.Base');
      model = updateOptions(model, { closeMinTotal: 3 });

      const json = serializeFilter(model);
      const restored = deserializeFilter(json);

      expect(restored).not.toBeNull();
      expect(restored.id).toBe(model.id);
      expect(restored.name).toBe('Test Filter');
      expect(restored.affixes.length).toBe(2);
      expect(restored.monograms.length).toBe(1);
      expect(restored.options.closeMinTotal).toBe(3);
    });

    it('should return null for invalid JSON', () => {
      expect(deserializeFilter('not json')).toBeNull();
    });

    it('should return null for missing required fields', () => {
      expect(deserializeFilter(JSON.stringify({ foo: 'bar' }))).toBeNull();
    });

    it('should provide defaults for missing options', () => {
      const minimal = JSON.stringify({
        id: 'test',
        affixes: [],
        monograms: [],
      });
      const restored = deserializeFilter(minimal);
      expect(restored.options.minHitsPerPool).toBe(1);
      expect(restored.options.closeMinTotal).toBe(2);
      expect(restored.options.includeWeapons).toBe(true);
    });
  });
});
