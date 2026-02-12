import React, { useState, useMemo } from 'react';
import {
  AFFIXES_BY_CATEGORY,
  AFFIX_CATEGORIES,
  searchAffixes,
} from '../../utils/affixList';
import {
  getMonogramCategories,
  getMonogramsByCategory,
  getMonogramName,
  MONOGRAM_REGISTRY,
} from '../../utils/monogramRegistry';

/**
 * Grouped category definitions for monograms (derived from registry categories)
 */
const MONOGRAM_CATEGORY_LABELS = {
  mobility: 'Mobility / Phasing',
  bloodlust: 'Bloodlust',
  colossus: 'Colossus',
  shroud: 'Shroud',
  veil: 'Veil',
  damageCircle: 'Damage Circle',
  paragon: 'Paragon',
  elemental: 'Elemental',
  pulse: 'Pulse',
  mines: 'Mines',
  spawn: 'Spawn',
  potion: 'Potion',
  elite: 'Elite',
  damage: 'Damage',
  crit: 'Crit',
  defense: 'Defense',
  sustain: 'Sustain',
  stats: 'Stats',
  energy: 'Energy',
  secondary: 'Secondary',
  fellowship: 'Fellowship',
  glyphs: 'Glyphs',
  utility: 'Utility',
  inventory: 'Inventory',
  boots: 'Boots',
};

/**
 * Build monogram entries grouped by category for the picker
 */
function buildMonogramsByCategory() {
  const categories = getMonogramCategories();
  const grouped = {};
  for (const cat of categories) {
    const monos = getMonogramsByCategory(cat);
    if (monos.length > 0) {
      grouped[cat] = monos.map(m => ({
        id: m.id,
        name: m.name,
        category: cat,
      }));
    }
  }
  return grouped;
}

const MONOGRAMS_BY_CATEGORY = buildMonogramsByCategory();

/**
 * Unified filter picker for both stat affixes and monograms.
 * Outputs separate arrays for affix IDs and monogram IDs.
 */
export function AffixSelector({
  selectedAffixes = [],
  selectedMonograms = [],
  onAffixChange,
  onMonogramChange,
  compact = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['offense', 'attributes']);
  const [activeSection, setActiveSection] = useState('affixes'); // 'affixes' | 'monograms'

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

  // Filter monograms based on search
  const filteredMonograms = useMemo(() => {
    if (!searchQuery.trim()) {
      return MONOGRAMS_BY_CATEGORY;
    }
    const queryLower = searchQuery.toLowerCase();
    const grouped = {};
    for (const [cat, monos] of Object.entries(MONOGRAMS_BY_CATEGORY)) {
      const matches = monos.filter(m =>
        m.name.toLowerCase().includes(queryLower) ||
        m.id.toLowerCase().includes(queryLower)
      );
      if (matches.length > 0) {
        grouped[cat] = matches;
      }
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
    onAffixChange(newSelection);
  };

  const toggleMonogram = (monoId) => {
    const newSelection = selectedMonograms.includes(monoId)
      ? selectedMonograms.filter(id => id !== monoId)
      : [...selectedMonograms, monoId];
    onMonogramChange(newSelection);
  };

  const clearAll = () => {
    onAffixChange([]);
    onMonogramChange([]);
  };

  // Resolve selected tag names for display
  const selectedTags = useMemo(() => {
    const tags = [];
    for (const id of selectedAffixes) {
      const affix = Object.values(AFFIXES_BY_CATEGORY).flat().find(a => a.id === id);
      if (affix) tags.push({ id, name: affix.name, type: 'affix' });
    }
    for (const id of selectedMonograms) {
      tags.push({ id, name: getMonogramName(id), type: 'monogram' });
    }
    return tags;
  }, [selectedAffixes, selectedMonograms]);

  const affixCategoryOrder = ['attributes', 'offense', 'stance', 'defense', 'elemental', 'abilities', 'utility'];
  const monogramCategoryOrder = Object.keys(MONOGRAMS_BY_CATEGORY).sort();

  return (
    <div className={`affix-selector ${compact ? 'affix-selector--compact' : ''}`}>
      <div className="affix-selector-header">
        <input
          type="text"
          className="affix-search"
          placeholder={activeSection === 'affixes' ? 'Search affixes...' : 'Search monograms...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="affix-quick-actions">
          <button type="button" className="affix-quick-btn" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>

      <div className="affix-section-tabs">
        <button
          type="button"
          className={`affix-section-tab ${activeSection === 'affixes' ? 'active' : ''}`}
          onClick={() => setActiveSection('affixes')}
        >
          Affixes {selectedAffixes.length > 0 && `(${selectedAffixes.length})`}
        </button>
        <button
          type="button"
          className={`affix-section-tab ${activeSection === 'monograms' ? 'active' : ''}`}
          onClick={() => setActiveSection('monograms')}
        >
          Monograms {selectedMonograms.length > 0 && `(${selectedMonograms.length})`}
        </button>
      </div>

      {selectedTags.length > 0 && (
        <div className="affix-selected-tags">
          {selectedTags.map(tag => (
            <span
              key={`${tag.type}-${tag.id}`}
              className={`affix-tag ${tag.type === 'monogram' ? 'affix-tag--mono' : ''}`}
              onClick={() => tag.type === 'affix' ? toggleAffix(tag.id) : toggleMonogram(tag.id)}
            >
              {tag.name} ×
            </span>
          ))}
        </div>
      )}

      <div className="affix-categories">
        {activeSection === 'affixes' && affixCategoryOrder.map(categoryId => {
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

        {activeSection === 'monograms' && monogramCategoryOrder.map(categoryId => {
          const monos = filteredMonograms[categoryId];
          if (!monos || monos.length === 0) return null;

          const categoryLabel = MONOGRAM_CATEGORY_LABELS[categoryId] || categoryId;
          const isExpanded = expandedCategories.includes(`mono-${categoryId}`);
          const selectedCount = monos.filter(m => selectedMonograms.includes(m.id)).length;

          return (
            <div key={`mono-${categoryId}`} className="affix-category">
              <div
                className="affix-category-header"
                onClick={() => toggleCategory(`mono-${categoryId}`)}
              >
                <span className="affix-category-toggle">{isExpanded ? '▼' : '▶'}</span>
                <span className="affix-category-name">{categoryLabel}</span>
                {selectedCount > 0 && (
                  <span className="affix-category-count">({selectedCount})</span>
                )}
              </div>

              {isExpanded && (
                <div className="affix-list">
                  {monos.map(mono => (
                    <label key={mono.id} className="affix-item">
                      <input
                        type="checkbox"
                        checked={selectedMonograms.includes(mono.id)}
                        onChange={() => toggleMonogram(mono.id)}
                      />
                      <span className="affix-name">{mono.name}</span>
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
