import React, { useState, useCallback, useRef } from 'react';
import { Button, DropZone } from '../common';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { hasDirPicker } from '../../utils/platform';

export function UploadTab({ onFileLoaded, onLog, onStatusChange }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const fileInputRef = useRef(null);
  const { processFile, isProcessing } = useFileProcessor();

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

  const handlePickDir = useCallback(async () => {
    if (!hasDirPicker()) return;

    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      onLog('📁 Folder access granted');
      onStatusChange('Scanning folder...', 'scanning');

      const files = [];
      for await (const [name, h] of handle.entries()) {
        if (/\.sav$/i.test(name)) {
          const file = await h.getFile();
          files.push(file);
        }
      }

      if (files.length > 0) {
        files.sort((a, b) => b.lastModified - a.lastModified);
        onLog(`📄 Found ${files.length} save file(s), loading most recent`);
        setRecentFiles(files);
        await handleFileSelect(files[0]);
      } else {
        onLog('⚠️ No .sav files found in folder');
        onStatusChange('No files found', 'ready');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        onLog(`❌ Folder access failed: ${e?.message || e}`);
      }
      onStatusChange('Ready', 'ready');
    }
  }, [handleFileSelect, onLog, onStatusChange]);

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
          <Button icon="📁" onClick={handlePickDir} hidden={!hasDirPicker()} disabled={isProcessing}>
            Pick Save Folder
          </Button>
        </div>
      </div>

      <DropZone
        icon="🎮"
        text="Drop your .sav file here to begin"
        onFileDrop={handleFileDrop}
      />

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
