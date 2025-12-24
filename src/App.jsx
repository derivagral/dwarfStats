import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, TabNavigation, LogPanel } from './components/common';
import { CharacterTab } from './components/character';
import { FilterTab } from './components/filter';
import { initWasm } from './utils/wasm';
import { detectPlatform } from './utils/platform';
import { useLogger } from './hooks/useLogger';

const TABS = [
  { id: 'character', label: 'Character', icon: '🧙' },
  { id: 'filter', label: 'Filter', icon: '🔍' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('character');
  const [status, setStatus] = useState('Loading...');
  const [statusType, setStatusType] = useState('scanning');
  const [platform, setPlatform] = useState({ icon: '🌐', name: 'Browser', isChromium: false });
  const [logVisible, setLogVisible] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const { logs, log } = useLogger();

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

  const handleStatusChange = useCallback((text, type = 'ready') => {
    setStatus(text);
    setStatusType(type);
  }, []);

  const toggleLog = useCallback(() => {
    setLogVisible(prev => !prev);
  }, []);

  return (
    <div className="app">
      <h1>Dwarf Stats</h1>

      <StatusBar status={status} statusType={statusType} platform={platform} />

      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {wasmReady && (
        <>
          {activeTab === 'character' && (
            <CharacterTab onLog={log} onStatusChange={handleStatusChange} />
          )}
          {activeTab === 'filter' && (
            <FilterTab onLog={log} onStatusChange={handleStatusChange} />
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
