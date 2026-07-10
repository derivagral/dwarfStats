import React, { useState, useCallback, useRef } from 'react';
import { Button, DropZone } from '../common';
import { useFileProcessor } from '../../hooks/useFileProcessor';

export function UploadTab({ onFileLoaded, onLog, onStatusChange, onImportShare, saveWatcher }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef(null);
  const { processFile, isProcessing } = useFileProcessor();

  const handleImport = useCallback(async () => {
    if (!onImportShare) return;
    const ok = await onImportShare(importText);
    if (ok) setImportText('');
  }, [onImportShare, importText]);

  // Live watch toggle: checking it opens a FILE picker (pick the character's
  // .sav) and starts polling; the checkbox stays unchecked if the picker is
  // cancelled or blocked because `watching` is the source of truth.
  const handleWatchToggle = useCallback(async (e) => {
    if (!saveWatcher) return;
    if (e.target.checked) {
      const result = await saveWatcher.start();
      if (!result.ok) {
        if (result.reason === 'cancelled') {
          onLog('Live watch not started (file picker cancelled)');
        } else {
          onLog(`❌ Live watch failed: ${result.reason}`);
        }
      }
    } else {
      saveWatcher.stop();
    }
  }, [saveWatcher, onLog]);

  const handleFileSelect = useCallback(async (file) => {
    try {
      onStatusChange('Processing...', 'scanning');
      onLog(`📂 Loading save file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      const result = await processFile(file);

      onLog('✅ Save file loaded successfully');
      if (result.equippedItems && result.equippedItems.length > 0) {
        onLog(`📦 Found ${result.equippedItems.length} equipped items`);
      }

      onStatusChange('Ready', 'ready');
      onFileLoaded({
        file,
        filename: result.filename,
        raw: result.parsed,
        json: result.json,
        equippedItems: result.equippedItems || [],
        items: result.items || [],
        totalItems: result.totalItems || 0,
        timestamp: Date.now()
      });
    } catch (e) {
      onLog(`❌ ${e.message}`);
      onStatusChange('Error', 'ready');
    }
  }, [processFile, onLog, onStatusChange, onFileLoaded]);

  const handleFileDrop = useCallback((files) => {
    if (files.length > 0) {
      setRecentFiles(files);
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecentFiles([file]);
      handleFileSelect(file);
    }
    e.target.value = '';
  }, [handleFileSelect]);

  return (
    <div className="tab-content active">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav"
        hidden
        onChange={handleFileInputChange}
      />

      <div className="upload-hero">
        <div className="upload-hero-icon">📦</div>
        <h2 className="upload-hero-title">Load Save File</h2>
        <p className="upload-hero-subtitle">
          Drop a .sav file below or use the buttons to get started
        </p>
      </div>

      <div className="controls">
        <div className="control-row" style={{ justifyContent: 'center' }}>
          <Button icon="📄" variant="primary" onClick={handlePickFile} disabled={isProcessing}>
            Pick .sav File
          </Button>
        </div>
        {saveWatcher?.supported ? (
          <>
            <div className="control-row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
              <label
                className="live-watch-toggle"
                title="Opens a file picker: choose your character's .sav once, and the app re-scans automatically whenever the game saves (checked every 10s)"
              >
                <input
                  type="checkbox"
                  checked={saveWatcher.watching}
                  onChange={handleWatchToggle}
                />
                <span>Live watch a save file (pick it once, auto re-scan while you play)</span>
              </label>
            </div>
            {saveWatcher.watching && (
              <div className="live-watch-status">
                👁️ Watching <strong>{saveWatcher.watchedName}</strong> — checks every 10s
                {saveWatcher.lastChangeAt && (
                  <> · last change {new Date(saveWatcher.lastChangeAt).toLocaleTimeString()}</>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="live-watch-note">
            Live watch (auto re-scan while you play) needs Chrome or Edge — re-drop your save here to refresh on this browser.
          </div>
        )}
      </div>

      <DropZone
        icon="🎮"
        text="Drop your .sav file here to begin"
        onFileDrop={handleFileDrop}
      />

      {onImportShare && (
        <div className="controls" style={{ marginTop: '0.75rem' }}>
          <div className="control-row" style={{ justifyContent: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              className="share-import-input"
              placeholder="Paste a share link or code…"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
              style={{ minWidth: '20rem' }}
            />
            <Button icon="📥" onClick={handleImport} disabled={!importText.trim()}>
              Import Build
            </Button>
          </div>
        </div>
      )}

      <div className="upload-info">
        <div className="upload-info-item">
          <span className="upload-info-icon">🧙</span>
          <span>View character inventory and equipped items</span>
        </div>
        <div className="upload-info-item">
          <span className="upload-info-icon">🔍</span>
          <span>Filter items by attribute patterns</span>
        </div>
        <div className="upload-info-item">
          <span className="upload-info-icon">📁</span>
          <span>Pick a folder to auto-select the most recent save</span>
        </div>
      </div>
    </div>
  );
}
