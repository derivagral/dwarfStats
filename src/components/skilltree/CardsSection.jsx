import React from 'react';
import { getCardDef } from '../../utils/skillTreeRegistry';
import { getCardsByFamily } from '../../models/SkillTree';

/**
 * Crystal cards display (visual only, effects TBD)
 *
 * @param {Object} props
 * @param {Array} props.cards - Card skill entries from save
 * @param {Object} props.skillTreeData - Full skill tree data for family grouping
 */
export function CardsSection({ cards, skillTreeData }) {
  if (!cards || cards.length === 0) return null;

  const families = skillTreeData ? getCardsByFamily(skillTreeData) : {};

  return (
    <div className="skill-section">
      <div className="skill-section-header">
        <span className="skill-section-title">Crystal Cards</span>
        <span className="skill-section-subtitle">{cards.length} cards allocated (effects TBD)</span>
      </div>

      <div className="cards-grid">
        {cards.map(card => {
          const def = getCardDef(card.rowName);
          const name = def?.name || card.rowName;

          return (
            <div key={card.rowName} className="card-item">
              <span className="card-name">{name}</span>
              <span className="card-level">Lv {card.level}{def?.maxLevel ? ` / ${def.maxLevel}` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
