import React, { useState, useMemo } from 'react';
import {
  AFFIXES_BY_CATEGORY,
  AFFIX_CATEGORIES,
  POPULAR_AFFIXES,
  searchAffixes,
} from '../../utils/affixList';

/**
 * Affix selector for item filtering
 * Displays affixes grouped by category with checkboxes
 */
export function AffixSelector({
  selectedAffixes = [],
  onSelectionChange,
  compact = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['offense', 'attributes']);

  // Filter affixes based on search
  const filteredAffixes = useMemo(() => {
    if (!searchQuery.trim()) {
      return AFFIXES_BY_CATEGORY;
    }
    const matches = searchAffixes(searchQuery, 50);
    const grouped = {};
    for (const affix of matches) {
      if (!grouped[affix.category]) {
        grouped[affix.category] = [];
      }
      grouped[affix.category].push(affix);
    }
    return grouped;
  }, [searchQuery]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleAffix = (affixId) => {
    const newSelection = selectedAffixes.includes(affixId)
      ? selectedAffixes.filter(id => id !== affixId)
      : [...selectedAffixes, affixId];
    onSelectionChange(newSelection);
  };

  const selectPopular = () => {
    const popularIds = POPULAR_AFFIXES.map(a => a.id);
    onSelectionChange(popularIds);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  // Category order for display
  const categoryOrder = ['attributes', 'offense', 'stance', 'defense', 'elemental', 'abilities', 'utility'];

  return (
    <div className={`affix-selector ${compact ? 'affix-selector--compact' : ''}`}>
      <div className="affix-selector-header">
        <input
          type="text"
          className="affix-search"
          placeholder="Search affixes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="affix-quick-actions">
          <button type="button" className="affix-quick-btn" onClick={selectPopular}>
            Popular
          </button>
          <button type="button" className="affix-quick-btn" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>

      {selectedAffixes.length > 0 && (
        <div className="affix-selected-tags">
          {selectedAffixes.map(id => {
            const affix = Object.values(AFFIXES_BY_CATEGORY)
              .flat()
              .find(a => a.id === id);
            if (!affix) return null;
            return (
              <span key={id} className="affix-tag" onClick={() => toggleAffix(id)}>
                {affix.name} ×
              </span>
            );
          })}
        </div>
      )}

      <div className="affix-categories">
        {categoryOrder.map(categoryId => {
          const affixes = filteredAffixes[categoryId];
          if (!affixes || affixes.length === 0) return null;

          const category = AFFIX_CATEGORIES[categoryId] || { name: categoryId };
          const isExpanded = expandedCategories.includes(categoryId);
          const selectedCount = affixes.filter(a => selectedAffixes.includes(a.id)).length;

          return (
            <div key={categoryId} className="affix-category">
              <div
                className="affix-category-header"
                onClick={() => toggleCategory(categoryId)}
              >
                <span className="affix-category-toggle">{isExpanded ? '▼' : '▶'}</span>
                <span className="affix-category-name">{category.name}</span>
                {selectedCount > 0 && (
                  <span className="affix-category-count">({selectedCount})</span>
                )}
              </div>

              {isExpanded && (
                <div className="affix-list">
                  {affixes.map(affix => (
                    <label key={affix.id} className="affix-item">
                      <input
                        type="checkbox"
                        checked={selectedAffixes.includes(affix.id)}
                        onChange={() => toggleAffix(affix.id)}
                      />
                      <span className="affix-name">{affix.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AffixSelector;
