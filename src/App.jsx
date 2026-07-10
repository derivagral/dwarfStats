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
import { parseShareFromHash, decodeFilterShare, decodeCharacterShareAny } from './utils/shareUrl';
import { masteryShareToData, allocatedAttributesShareToData, skillTreeShareToData } from './models/CharacterShareModel';

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

  // Decode a character share code (compressed v2 or legacy v1) and load it
  // into the item store. Returns true if a build was loaded.
  const loadCharacterShareCode = useCallback(async (code) => {
    const decoded = await decodeCharacterShareAny(code);
    if (!decoded) return false;
    const masteryData = masteryShareToData(decoded.sk ?? null);
    const allocatedAttributes = allocatedAttributesShareToData(decoded.at ?? null);
    const skillTree = skillTreeShareToData(decoded.st ?? null);
    const identity = {
      name: decoded.cn ?? '',
      level: decoded.lv ?? 0,
      campaignBossCount: decoded.cb ?? 0,
    };
    itemStore.loadFromShare(decoded.e ?? [], masteryData, allocatedAttributes, decoded.hp ?? 0, skillTree, identity);
    setActiveTab('character');
    log(`Loaded shared character build${identity.name ? `: ${identity.name}` : ''}`);
    return true;
  }, [itemStore, log]);

  // Paste-import: accepts a full share URL or a bare share code
  const handleImportShare = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return false;
    const hashIdx = trimmed.indexOf('#');
    const parsed = hashIdx >= 0 ? parseShareFromHash(trimmed.slice(hashIdx)) : null;
    const code = parsed?.type === 'character' ? parsed.data : (hashIdx >= 0 ? null : trimmed);
    if (!code) return false;
    const ok = await loadCharacterShareCode(code);
    if (!ok) log('⚠️ Could not decode share code');
    return ok;
  }, [loadCharacterShareCode, log]);

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
    } else if (parsed.type === 'character') {
      loadCharacterShareCode(parsed.data);
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
  const disabledTabs = [
    ...(!itemStore.hasItems ? ['character'] : []),
    ...(!saveData ? ['items'] : []),
    ...(!saveData && !filterTabUnlocked ? ['filter'] : []),
  ];

  return (
    <div className="app">
      <h1>[ALPHA] Dwarf Stats</h1>

      <StatusBar status={status} statusType={statusType} platform={platform} />

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} disabledTabs={disabledTabs} />

      {wasmReady && (
        <>
          {activeTab === 'upload' && (
            <UploadTab onFileLoaded={handleFileLoaded} onLog={log} onStatusChange={handleStatusChange} onImportShare={handleImportShare} />
          )}
          {activeTab === 'character' && (saveData || itemStore.hasItems) && (
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
