import { describe, it, expect } from 'vitest';
import {
  encodeFilterShare,
  decodeFilterShare,
  buildShareUrl,
  parseShareFromHash,
} from '../src/utils/shareUrl.js';
import { createFilterModel, addAffix, addMonogram, updateOptions } from '../src/models/FilterModel.js';

describe('shareUrl', () => {
  describe('encodeFilterShare / decodeFilterShare round-trip', () => {
    it('should round-trip a filter with affixes and monograms', () => {
      let model = createFilterModel('Crit Build');
      model = addAffix(model, 'strength');
      model = addAffix(model, 'critChance');
      model = addMonogram(model, 'Bloodlust.Base');
      model = addMonogram(model, 'AllowPhasing', 2);
      model = updateOptions(model, { closeMinTotal: 3 });

      const encoded = encodeFilterShare(model);
      const decoded = decodeFilterShare(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded.name).toBe('Crit Build');
      expect(decoded.affixes).toEqual([
        { affixId: 'strength' },
        { affixId: 'critChance' },
      ]);
      expect(decoded.monograms).toEqual([
        { monogramId: 'Bloodlust.Base', minCount: null },
        { monogramId: 'AllowPhasing', minCount: 2 },
      ]);
      expect(decoded.options.closeMinTotal).toBe(3);
      // Defaults preserved
      expect(decoded.options.minHitsPerPool).toBe(1);
      expect(decoded.options.includeWeapons).toBe(true);
      expect(decoded.options.minTotalMonograms).toBeNull();
    });

    it('should round-trip a minimal filter (affixes only, no monograms)', () => {
      let model = createFilterModel();
      model = addAffix(model, 'vitality');

      const encoded = encodeFilterShare(model);
      const decoded = decodeFilterShare(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded.affixes).toEqual([{ affixId: 'vitality' }]);
      expect(decoded.monograms).toEqual([]);
      expect(decoded.options.minHitsPerPool).toBe(1);
    });

    it('should round-trip an empty filter (no affixes, no monograms)', () => {
      const model = createFilterModel();

      const encoded = encodeFilterShare(model);
      const decoded = decodeFilterShare(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded.affixes).toEqual([]);
      expect(decoded.monograms).toEqual([]);
    });

    it('should round-trip all non-default options', () => {
      let model = createFilterModel('Options Test');
      model = updateOptions(model, {
        minHitsPerPool: 2,
        closeMinTotal: 4,
        includeWeapons: false,
        minTotalMonograms: 3,
      });

      const encoded = encodeFilterShare(model);
      const decoded = decodeFilterShare(encoded);

      expect(decoded.options.minHitsPerPool).toBe(2);
      expect(decoded.options.closeMinTotal).toBe(4);
      expect(decoded.options.includeWeapons).toBe(false);
      expect(decoded.options.minTotalMonograms).toBe(3);
    });

    it('should omit default options to keep encoding compact', () => {
      const model = createFilterModel();
      const encoded = encodeFilterShare(model);

      // Decode the raw JSON to verify compactness
      const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(raw);

      expect(parsed.o).toBeUndefined(); // No options key when all defaults
    });

    it('should omit monograms key when none selected', () => {
      let model = createFilterModel();
      model = addAffix(model, 'strength');

      const encoded = encodeFilterShare(model);
      const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(raw);

      expect(parsed.m).toBeUndefined();
    });

    it('should omit profile name for default names', () => {
      const model1 = createFilterModel('Default');
      const model2 = createFilterModel('Untitled Filter');

      const enc1 = encodeFilterShare(model1);
      const enc2 = encodeFilterShare(model2);

      const raw1 = JSON.parse(atob(enc1.replace(/-/g, '+').replace(/_/g, '/')));
      const raw2 = JSON.parse(atob(enc2.replace(/-/g, '+').replace(/_/g, '/')));

      expect(raw1.n).toBeUndefined();
      expect(raw2.n).toBeUndefined();
    });

    it('should assign "Shared Filter" name when name is omitted', () => {
      const model = createFilterModel('Default');
      const encoded = encodeFilterShare(model);
      const decoded = decodeFilterShare(encoded);
      expect(decoded.name).toBe('Shared Filter');
    });
  });

  describe('base64url safety', () => {
    it('should produce URL-safe output (no +, /, or = characters)', () => {
      let model = createFilterModel('Test/Build+Name==');
      model = addAffix(model, 'strength');
      model = addAffix(model, 'critChance');
      model = addAffix(model, 'critDamage');
      model = addMonogram(model, 'Bloodlust.Base');
      model = addMonogram(model, 'AllowPhasing', 5);

      const encoded = encodeFilterShare(model);

      expect(encoded).not.toMatch(/[+/=]/);
    });
  });

  describe('decodeFilterShare error handling', () => {
    it('should return null for empty string', () => {
      expect(decodeFilterShare('')).toBeNull();
    });

    it('should return null for invalid base64', () => {
      expect(decodeFilterShare('!!!not-base64!!!')).toBeNull();
    });

    it('should return null for valid base64 but invalid JSON', () => {
      const encoded = btoa('not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(decodeFilterShare(encoded)).toBeNull();
    });

    it('should return null when version is missing', () => {
      const noVersion = btoa(JSON.stringify({ a: ['strength'] }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(decodeFilterShare(noVersion)).toBeNull();
    });

    it('should return null when version is too high', () => {
      const futureVersion = btoa(JSON.stringify({ v: 999, a: [] }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(decodeFilterShare(futureVersion)).toBeNull();
    });

    it('should return null when affixes array is missing', () => {
      const noAffixes = btoa(JSON.stringify({ v: 1 }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(decodeFilterShare(noAffixes)).toBeNull();
    });

    it('should generate unique IDs for each decode call', () => {
      const model = createFilterModel();
      const encoded = encodeFilterShare(model);

      const a = decodeFilterShare(encoded);
      const b = decodeFilterShare(encoded);
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('parseShareFromHash', () => {
    it('should parse a valid filter hash', () => {
      const result = parseShareFromHash('#filter=abc123');
      expect(result).toEqual({ type: 'filter', data: 'abc123' });
    });

    it('should parse a valid character hash', () => {
      const result = parseShareFromHash('#character=xyz789');
      expect(result).toEqual({ type: 'character', data: 'xyz789' });
    });

    it('should return null for empty hash', () => {
      expect(parseShareFromHash('')).toBeNull();
      expect(parseShareFromHash('#')).toBeNull();
    });

    it('should return null for hash without = separator', () => {
      expect(parseShareFromHash('#filterabc')).toBeNull();
    });

    it('should return null for hash with empty data', () => {
      expect(parseShareFromHash('#filter=')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(parseShareFromHash(null)).toBeNull();
      expect(parseShareFromHash(undefined)).toBeNull();
    });

    it('should handle data containing = characters', () => {
      // base64 can have = padding; the data portion may contain them
      const result = parseShareFromHash('#filter=abc=def==');
      expect(result).toEqual({ type: 'filter', data: 'abc=def==' });
    });
  });

  describe('buildShareUrl', () => {
    it('should build a URL with hash fragment', () => {
      const url = buildShareUrl('filter', 'abc123', 'https://example.com/app/');
      expect(url).toBe('https://example.com/app/#filter=abc123');
    });

    it('should build a URL for character type', () => {
      const url = buildShareUrl('character', 'xyz', 'https://example.com/app/');
      expect(url).toBe('https://example.com/app/#character=xyz');
    });
  });

  describe('end-to-end: encode → buildUrl → parseHash → decode', () => {
    it('should survive the full sharing pipeline', () => {
      let model = createFilterModel('E2E Test');
      model = addAffix(model, 'strength');
      model = addAffix(model, 'critDamage');
      model = addMonogram(model, 'Bloodlust.Base', 3);
      model = updateOptions(model, { minTotalMonograms: 2 });

      const encoded = encodeFilterShare(model);
      const url = buildShareUrl('filter', encoded, 'https://derivagral.github.io/dwarfStats/');

      // Simulate extracting hash from URL
      const hashPart = '#' + url.split('#')[1];
      const parsed = parseShareFromHash(hashPart);

      expect(parsed.type).toBe('filter');

      const decoded = decodeFilterShare(parsed.data);
      expect(decoded.name).toBe('E2E Test');
      expect(decoded.affixes.length).toBe(2);
      expect(decoded.monograms[0].monogramId).toBe('Bloodlust.Base');
      expect(decoded.monograms[0].minCount).toBe(3);
      expect(decoded.options.minTotalMonograms).toBe(2);
    });
  });
});
