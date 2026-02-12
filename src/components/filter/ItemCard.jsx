import React from 'react';
import { getMonogramName } from '../../utils/monogramRegistry';
import { inferEquipmentSlot, formatSlotLabel } from '../../utils/equipmentParser';

/**
 * Render a pool's affixes with match highlighting.
 * Matched affixes are determined by the poolMatches array set during scoring.
 */
function AttributePool({ title, affixes, matchedAffixIds }) {
  if (!affixes || affixes.length === 0) return null;

  // matchedAffixIds are the STAT_REGISTRY keys that matched in this pool.
  // We highlight pool rowNames that correspond to a matched affix.
  // For simplicity, we just highlight if the rowName was in a matching set.
  const matchSet = new Set(matchedAffixIds || []);

  return (
    <div className="attribute-pool">
      <div className="pool-header">{title} ({affixes.length})</div>
      <div className="pool-attributes">
        {affixes.map((affix, i) => {
          // Check if this rowName contributed to a match
          // poolMatches contains affixIds, not rowNames, so we show all as potential
          // The score badges already show match counts per pool
          return (
            <span
              key={i}
              className="attribute-pill"
            >
              {affix.rowName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function InherentPool({ affixes }) {
  if (!affixes || affixes.length === 0) return null;

  return (
    <div className="attribute-pool">
      <div className="pool-header">Inherent ({affixes.length})</div>
      <div className="pool-attributes">
        {affixes.map((affix, i) => (
          <span key={i} className="attribute-pill inherent">{affix.rowName}</span>
        ))}
      </div>
    </div>
  );
}

function MonogramSection({ monograms, matchedIds, missingIds }) {
  if (!monograms || monograms.length === 0) return null;

  const matchedSet = new Set(matchedIds || []);
  const missingSet = new Set(missingIds || []);

  return (
    <div className="attribute-pool">
      <div className="pool-header">Monograms ({monograms.length})</div>
      <div className="pool-attributes">
        {monograms.map((mono, i) => {
          const isMatched = matchedSet.has(mono.id);
          return (
            <span
              key={i}
              className={`attribute-pill mono${isMatched ? ' match' : ''}`}
            >
              {getMonogramName(mono.id)}
            </span>
          );
        })}
        {missingIds && missingIds.length > 0 && missingIds.map((id, i) => (
          <span key={`missing-${i}`} className="attribute-pill mono missing">
            {getMonogramName(id)} (missing)
          </span>
        ))}
      </div>
    </div>
  );
}

export function ItemCard({ item, type, filterModel, equippedLabel = '', showScores = true }) {
  const scoreClass = (val) => val >= 2 ? 'good' : val === 1 ? 'partial' : 'zero';
  const slotLabel = equippedLabel || formatSlotLabel(inferEquipmentSlot(item.rowName));

  const pool1 = item.affixPools?.pool1 || [];
  const pool2 = item.affixPools?.pool2 || [];
  const pool3 = item.affixPools?.pool3 || [];
  const inherent = item.affixPools?.inherent || [];
  const monograms = item.monograms || [];

  const hasAttributes = pool1.length || pool2.length || pool3.length || inherent.length;
  const hasMonograms = monograms.length > 0 || (item.monoMissing && item.monoMissing.length > 0);

  return (
    <div className={`item-card ${type}`}>
      <div className="item-header">
        <div className="item-name">{item.displayName || item.rowName}</div>
        <div className="item-header-meta">
          {equippedLabel && (
            <span className="item-badge equipped">Equipped: {equippedLabel}</span>
          )}
          <div className="item-type">{slotLabel || item.type}</div>
        </div>
      </div>

      {showScores && (
        <div className="item-scores">
          <div className="score-badge">
            <div className="score-label">Pool 1</div>
            <div className={`score-value ${scoreClass(item.s1)}`}>{item.s1}</div>
          </div>
          <div className="score-badge">
            <div className="score-label">Pool 2</div>
            <div className={`score-value ${scoreClass(item.s2)}`}>{item.s2}</div>
          </div>
          <div className="score-badge">
            <div className="score-label">Pool 3</div>
            <div className={`score-value ${scoreClass(item.s3)}`}>{item.s3}</div>
          </div>
        </div>
      )}

      {hasAttributes && (
        <div className="item-attributes">
          <AttributePool title="Pool 1" affixes={pool1} matchedAffixIds={item.poolMatches?.pool1} />
          <AttributePool title="Pool 2" affixes={pool2} matchedAffixIds={item.poolMatches?.pool2} />
          <AttributePool title="Pool 3" affixes={pool3} matchedAffixIds={item.poolMatches?.pool3} />
          <InherentPool affixes={inherent} />
        </div>
      )}

      {hasMonograms && (
        <MonogramSection
          monograms={monograms}
          matchedIds={item.monoMatched}
          missingIds={item.monoMissing}
        />
      )}
    </div>
  );
}
