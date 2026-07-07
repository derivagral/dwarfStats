import { calculateDerivedStats, findStatForAttribute, DERIVED_STATS } from '../src/utils/derivedStats';

describe('derivedStats', () => {
  describe('calculateDerivedStats', () => {
    it('should calculate totalStrength from strength and strengthBonus', () => {
      const result = calculateDerivedStats({ strength: 100, strengthBonus: 0.5 });
      expect(result.totalStrength).toBe(150); // 100 * (1 + 0.50) = 150
    });

    it('should keep MaxHealth% as a percentage health bonus', () => {
      const healthBonus = findStatForAttribute('EasyRPG.Attributes.Base.MaxHealth%');
      const flatHealth = findStatForAttribute('EasyRPG.Attributes.Base.MaxHealth');

      expect(healthBonus.id).toBe('healthBonus');
      expect(flatHealth.id).toBe('health');

      const result = calculateDerivedStats({ health: 1000, healthBonus: 0.2 });
      expect(result.totalHealth).toBe(1200);
    });

    it('should calculate highestAttribute correctly', () => {
      const baseStats = {
        strength: 100,
        dexterity: 120,
        endurance: 90,
      };
      const result = calculateDerivedStats(baseStats);
      expect(result.highestAttribute).toBe(120);
    });

    it('distance monograms are exclusive when both near and far are present', () => {
      const result = calculateDerivedStats({}, {
        distanceProcsDamageBonus: { enabled: true, bonusPercent: 50 },
        distanceProcsNearDamageBonus: { enabled: true, bonusPercent: 50 },
      });

      expect(result.distanceProcsNearDamageBonus).toBe(50);
      expect(result.distanceProcsDamageBonus).toBe(0);
      expect(result.edpsEMulti).toBeCloseTo(1.5, 2);
    });

    it('elemental offhand bucket = item offhand% + affinity + both-types (skill mult added per skill)', () => {
      const config = {
        edpsElemAdditive: { offhandItemBonus: 0.2, affinity: 0.5 },
      };
      const result = calculateDerivedStats({}, config);
      expect(result.edpsElemAdditive).toBeCloseTo(0.7, 2);
    });
  });
});
