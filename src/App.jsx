import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, TabNavigation, LogPanel } from './components/common';
import { UploadTab } from './components/upload';
import { CharacterTab } from './components/character';
import { FilterTab } from './components/filter';
import { ItemsTab } from './components/items';
import { StatsTab } from './components/stats';
import { initWasm } from './utils/wasm';
import { detectPlatform } from './utils/platform';
import { useLogger } from './hooks/useLogger';
import { useItemStore } from './hooks/useItemStore';
import { parseShareFromHash, decodeFilterShare } from './utils/shareUrl';

const TABS = [
  { id: 'upload', label: 'Upload', icon: '📂' },
  { id: 'character', label: 'Character', icon: '🧙' },
  { id: 'items', label: 'Items', icon: '🎒' },
  { id: 'filter', label: 'Filter', icon: '🔍' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [status, setStatus] = useState('Loading...');
  const [statusType, setStatusType] = useState('scanning');
  const [platform, setPlatform] = useState({ icon: '🌐', name: 'Browser', isChromium: false });
  const [logVisible, setLogVisible] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const [saveData, setSaveData] = useState(null);
  const [sharedFilterModel, setSharedFilterModel] = useState(null);
  const [filterTabUnlocked, setFilterTabUnlocked] = useState(false);
  const { logs, log } = useLogger();

  // Central item store - all UI reads from here, not from raw saveData
  const itemStore = useItemStore();

  // Initialize WASM and detect platform
  useEffect(() => {
    async function init() {
      try {
        await initWasm();
        log('✅ Wasm module loaded');
        setPlatform(detectPlatform());
        setStatus('Ready');
        setStatusType('ready');
        setWasmReady(true);
      } catch (e) {
        log(`❌ Failed to load WASM: ${e.message}`);
        setStatus('Error loading WASM');
        setStatusType('ready');
      }
    }
    init();
  }, [log]);

  // Read share URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const parsed = parseShareFromHash(hash);
    if (!parsed) return;

    if (parsed.type === 'filter') {
      const decoded = decodeFilterShare(parsed.data);
      if (decoded) {
        setSharedFilterModel(decoded);
        setFilterTabUnlocked(true);
        setActiveTab('filter');
        log(`Loaded shared filter: "${decoded.name}"`);
      }
    }

    // Clean the hash from the URL
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [log]);

  const handleSharedFilterConsumed = useCallback(() => {
    setSharedFilterModel(null);
  }, []);

  const handleStatusChange = useCallback((text, type = 'ready') => {
    setStatus(text);
    setStatusType(type);
  }, []);

  const toggleLog = useCallback(() => {
    setLogVisible(prev => !prev);
  }, []);

  const handleFileLoaded = useCallback((data) => {
    setSaveData(data);
    // Load items into central store from parsed save data
    itemStore.loadFromSave(data.parsed || data.raw, data.filename);
    setActiveTab('character');
    log(`🎮 Save loaded: ${data.filename}`);
  }, [log, itemStore]);

  const handleClearSave = useCallback(() => {
    setSaveData(null);
    itemStore.clear();
    setActiveTab('upload');
    log('🗑️ Save data cleared');
  }, [log, itemStore]);

  // Determine which tabs are disabled
  const disabledTabs = itemStore.hasItems
    ? []
    : filterTabUnlocked
      ? ['character', 'items']
      : ['character', 'items', 'filter'];

  return (
    <div className="app">
      <h1>Dwarf Stats</h1>

      <StatusBar status={status} statusType={statusType} platform={platform} />

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} disabledTabs={disabledTabs} />

      {wasmReady && (
        <>
          {activeTab === 'upload' && (
            <UploadTab onFileLoaded={handleFileLoaded} onLog={log} onStatusChange={handleStatusChange} />
          )}
          {activeTab === 'character' && saveData && (
            <CharacterTab
              saveData={saveData}
              itemStore={itemStore}
              onClearSave={handleClearSave}
              onLog={log}
              onStatusChange={handleStatusChange}
            />
          )}
          {activeTab === 'items' && saveData && (
            <ItemsTab saveData={saveData} itemStore={itemStore} onLog={log} />
          )}
          {activeTab === 'filter' && (saveData || filterTabUnlocked) && (
            <FilterTab
              initialSaveData={saveData}
              itemStore={itemStore}
              onLog={log}
              onStatusChange={handleStatusChange}
              sharedFilterModel={sharedFilterModel}
              onSharedFilterConsumed={handleSharedFilterConsumed}
            />
          )}
          {activeTab === 'stats' && (
            <StatsTab
              onLog={log}
              onStatusChange={handleStatusChange}
              saveData={saveData}
              onSaveDataChange={setSaveData}
            />
          )}
        </>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button className="btn" onClick={toggleLog}>
          <span className="btn-icon">📋</span> Toggle Log
        </button>
      </div>

      <LogPanel logs={logs} visible={logVisible} />
    </div>
  );
}
