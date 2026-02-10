import React from 'react';
import { ItemCard } from './ItemCard';

export function ResultsSection({ title, icon, filename, items, totalItems, timestamp, filterModel, type }) {
  const timeStr = new Date(timestamp).toLocaleTimeString();

  return (
    <div className="results-section">
      <div className="section-header">
        <span>{icon}</span>
        <span>{title} - {filename}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {items.length} of {totalItems} items | {timeStr}
        </span>
      </div>
      <div className="item-grid">
        {items.map((item, i) => (
          <ItemCard key={i} item={item} type={type} filterModel={filterModel} />
        ))}
      </div>
    </div>
  );
}

export function EmptyResultsSection({ filename, totalItems, timestamp }) {
  const timeStr = new Date(timestamp).toLocaleTimeString();

  return (
    <div className="results-section">
      <div className="section-header">
        <span>📭</span>
        <span>{filename}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          0 matches from {totalItems} items | {timeStr}
        </span>
      </div>
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No items matched the current filters
      </div>
    </div>
  );
}
