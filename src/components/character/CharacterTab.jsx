import React, { useState, useCallback, useRef } from 'react';
import { Button, DropZone } from '../common';
import { CharacterPanel } from './CharacterPanel';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { hasDirPicker } from '../../utils/platform';

export function CharacterTab({ onLog, onStatusChange, saveData, onSaveDataChange }) {
  const [showFileControls, setShowFileControls] = useState(!saveData);
  const fileInputRef = useRef(null);
  const { processFile, isProcessing } = useFileProcessor();

  const handleFileSelect = useCallback(async (file) => {
    try {
      onStatusChange('Processing...', 'scanning');
      onLog(`🧙 Loading character: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      const result = await processFile(file);
      onSaveDataChange({
        filename: result.filename,
        raw: result.parsed,
        equippedItems: result.equippedItems || [],
        timestamp: Date.now()
      });

      onLog('✅ Character file loaded successfully');
      if (result.equippedItems && result.equippedItems.length > 0) {
        onLog(`📦 Found ${result.equippedItems.length} equipped items`);
      }
      onStatusChange('Ready', 'ready');
      setShowFileControls(false);
    } catch (e) {
      onLog(`❌ ${e.message}`);
      onStatusChange('Error', 'ready');
    }
  }, [processFile, onLog, onStatusChange, onSaveDataChange]);

  const handleFileDrop = useCallback((files) => {
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  }, [handleFileSelect]);

  const handlePickDir = useCallback(async () => {
    if (!hasDirPicker()) return;

    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      onLog('📁 Folder granted for character (Chromium)');
      onStatusChange('Scanning...', 'scanning');

      const files = [];
      for await (const [name, h] of handle.entries()) {
        if (/\.sav$/i.test(name)) {
          const file = await h.getFile();
          files.push(file);
        }
      }

      if (files.length > 0) {
        files.sort((a, b) => b.lastModified - a.lastModified);
        await handleFileSelect(files[0]);
      } else {
        onLog('⚠️ No .sav files found in folder');
        onStatusChange('No files found', 'ready');
      }
    } catch (e) {
      onLog(`❌ Pick canceled: ${e?.message || e}`);
      onStatusChange('Ready', 'ready');
    }
  }, [handleFileSelect, onLog, onStatusChange]);

  const handleClear = useCallback(() => {
    onSaveDataChange(null);
    setShowFileControls(true);
    onLog('🗑️ Character data cleared');
  }, [onLog, onSaveDataChange]);

  return (
    <div className="tab-content active">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav"
        hidden
        onChange={handleFileInputChange}
      />

      {saveData && !showFileControls && (
        <div className="controls" style={{ padding: '0.75rem 1.25rem' }}>
          <div className="control-row" style={{ marginBottom: 0 }}>
            <Button icon="🗑️" onClick={handleClear}>
              Clear
            </Button>
            <Button icon="📂" onClick={() => setShowFileControls(true)}>
              Load Different File
            </Button>
          </div>
        </div>
      )}

      {(!saveData || showFileControls) && (
        <>
          <div className="controls">
            <div className="control-row">
              <Button icon="📄" variant="primary" onClick={handlePickFile} disabled={isProcessing}>
                Pick .sav File
              </Button>
              <Button icon="📁" onClick={handlePickDir} hidden={!hasDirPicker()} disabled={isProcessing}>
                Pick Folder
              </Button>
              {saveData && (
                <Button icon="🗑️" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <DropZone
            icon="🧙"
            text="Drop a character .sav file to view inventory"
            onFileDrop={handleFileDrop}
          />
        </>
      )}

      {saveData ? (
        <CharacterPanel characterData={saveData} />
      ) : (
        <div className="placeholder-message">
          <div className="placeholder-icon">📦</div>
          <div>Load a .sav file to view character inventory</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Equipment slots and items will appear here
          </div>
        </div>
      )}
    </div>
  );
}
