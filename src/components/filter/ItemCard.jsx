import React from 'react';

function AttributePool({ title, attributes, filterPatterns }) {
  const isMatch = (attr) => {
    return filterPatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
      return regex.test(attr);
    });
  };

  if (attributes.length === 0) return null;

  return (
    <div className="attribute-pool">
      <div className="pool-header">{title} ({attributes.length})</div>
      <div className="pool-attributes">
        {attributes.map((attr, i) => (
          <span
            key={i}
            className={`attribute-pill${isMatch(attr) ? ' match' : ''}`}
          >
            {attr}
          </span>
        ))}
      </div>
    </div>
  );
}

function InherentPool({ attributes }) {
  if (attributes.length === 0) return null;

  return (
    <div className="attribute-pool">
      <div className="pool-header">Inherent ({attributes.length})</div>
      <div className="pool-attributes">
        {attributes.map((attr, i) => (
          <span key={i} className="attribute-pill inherent">{attr}</span>
        ))}
      </div>
    </div>
  );
}

export function ItemCard({ item, type, filterPatterns, equippedLabel = '', showScores = true }) {
  const scoreClass = (val) => val >= 2 ? 'good' : val === 1 ? 'partial' : 'zero';

  const pool1Attrs = item.item?.pool1_attributes || [];
  const pool2Attrs = item.item?.pool2_attributes || [];
  const pool3Attrs = item.item?.pool3_attributes || [];
  const inherentAttrs = item.item?.inherent_attributes || [];

  const hasAttributes = pool1Attrs.length || pool2Attrs.length || pool3Attrs.length || inherentAttrs.length;

  return (
    <div className={`item-card ${type}`}>
      <div className="item-header">
        <div className="item-name">{item.name}</div>
        <div className="item-header-meta">
          {equippedLabel && (
            <span className="item-badge equipped">Equipped: {equippedLabel}</span>
          )}
          <div className="item-type">{item.type}</div>
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
          <AttributePool title="Pool 1" attributes={pool1Attrs} filterPatterns={filterPatterns} />
          <AttributePool title="Pool 2" attributes={pool2Attrs} filterPatterns={filterPatterns} />
          <AttributePool title="Pool 3" attributes={pool3Attrs} filterPatterns={filterPatterns} />
          <InherentPool attributes={inherentAttrs} />
        </div>
      )}
    </div>
  );
}
