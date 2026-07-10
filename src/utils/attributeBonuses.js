import generated from '../data/attributeBonuses.generated.json';
import { findStatForAttribute, STAT_REGISTRY } from './statRegistry.js';

// DT_Attributes stores AttackSpeed in display points (1 Dexterity = 1 Attack
// Speed), while the app's canonical percent stats use decimals (0.01 = 1%).
const normalizeValue = (statId, value) => statId === 'attackSpeed' ? value / 100 : value;

const resolveEffect = ({ tag, valuePerPoint }) => {
  const stat = findStatForAttribute(tag);
  if (!stat) throw new Error(`Unmapped primary-attribute dependency: ${tag}`);

  return {
    tag,
    statId: stat.id,
    valuePerPoint: normalizeValue(stat.id, valuePerPoint),
    isPercent: Boolean(STAT_REGISTRY[stat.id]?.isPercent),
  };
};

/**
 * Compact runtime view of the primary-characteristic dependency rows exported
 * from DT_Attributes. Values are normalized to the units used by STAT_REGISTRY.
 */
export const ATTRIBUTE_BONUSES = Object.freeze(Object.fromEntries(
  Object.entries(generated.attributeBonuses).map(([id, attribute]) => [id, Object.freeze({
    ...attribute,
    effects: Object.freeze(attribute.effects.map(resolveEffect)),
  })]),
));

export function getAttributeBonusEffect(attributeId, targetStatId) {
  return ATTRIBUTE_BONUSES[attributeId]?.effects.find(effect => effect.statId === targetStatId) ?? null;
}

