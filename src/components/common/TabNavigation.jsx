import React from 'react';

export function TabNavigation({ tabs, activeTab, onTabChange, disabledTabs = [] }) {
  return (
    <div className="tab-container">
      <div className="tab-nav">
        {tabs.map(tab => {
          const isDisabled = disabledTabs.includes(tab.id);
          return (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              title={isDisabled ? 'Load a save file first' : ''}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
