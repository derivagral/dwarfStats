import { aggregateSkillEffects } from '../src/utils/skillEffectAggregator';

describe('skillEffectAggregator', () => {
  it('aggregates skill card effects', () => {
    const cards = [
      { tag: 'EasyRPG.Attributes.Base.MaxHealth%', value: 0.2 },
    ];

    const result = aggregateSkillEffects(cards);
    expect(result).toBeDefined();

    const card = result[0];
    expect(card).toBeDefined();
    expect(card.tag).toBe('EasyRPG.Attributes.Base.MaxHealth%');
    expect(card.value).toBeCloseTo(0.2);
    expect(card.statId).toBe('healthBonus');
  });

  it('handles max-level (L6) cards', () => {
    // Test implementation for L6 cards
  });
});
