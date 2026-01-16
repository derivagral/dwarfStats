import { useState, useCallback, useMemo } from 'react';
import { Button, DropZone } from '../common';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { extractDungeonCounters } from '../../utils/dungeonParser';
import './StatsTab.css';

export default function StatsTab({ onLog, onStatusChange, saveData, onSaveDataChange }) {
  const [showFileControls, setShowFileControls] = useState(!saveData);
  const { processFile, isProcessing } = useFileProcessor();

  // Derive dungeon counters from shared save data
  const dungeonCounters = useMemo(() => {
    if (!saveData?.raw) return [];
    return extractDungeonCounters(saveData.raw);
  }, [saveData]);

  const handleFileSelect = useCallback(
    async (file) => {
      try {
        onStatusChange('Processing...', 'scanning');
        onLog(`📊 Loading stats: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

        const result = await processFile(file);

        onSaveDataChange({
          filename: result.filename,
          raw: result.parsed,
          equippedItems: result.equippedItems || [],
          items: result.items || [],
          totalItems: result.totalItems || 0,
          timestamp: Date.now()
        });

        const counters = extractDungeonCounters(result.parsed);
        if (counters.length === 0) {
          onLog('⚠️ No dungeon counters found in save file');
        } else {
          onLog(`✅ Found ${counters.length} dungeon counters`);
        }

        onStatusChange('Ready', 'ready');
        setShowFileControls(false);
      } catch (error) {
        onLog(`❌ ${error.message}`);
        onStatusChange('Error', 'ready');
      }
    },
    [processFile, onLog, onStatusChange, onSaveDataChange]
  );

  const handleFileDrop = useCallback((files) => {
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handlePickFile = useCallback(() => {
    document.getElementById('stats-file-input')?.click();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleClear = useCallback(() => {
    onSaveDataChange(null);
    setShowFileControls(true);
    onLog('🗑️ Save data cleared');
  }, [onLog, onSaveDataChange]);

  return (
    <div className="tab-content active">
      <input
        type="file"
        id="stats-file-input"
        accept=".sav"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="stats-header">
        <h2>Dungeon Statistics</h2>
        <p className="stats-description">
          View your dungeon completion counts from your save file
        </p>
      </div>

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
              {saveData && (
                <Button icon="🗑️" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <DropZone
            icon="📊"
            text="Drop a .sav file to view dungeon statistics"
            onFileDrop={handleFileDrop}
          />
        </>
      )}

      {saveData && (
        <>
          {saveData.filename && (
            <div className="stats-filename">
              <span className="filename-label">Loaded:</span>
              <span className="filename-value">{saveData.filename}</span>
            </div>
          )}

          {dungeonCounters.length > 0 ? (
            <div className="dungeon-counters">
              <h3>Dungeon Completions</h3>
              <div className="counters-grid">
                {dungeonCounters.map((dungeon) => (
                  <div key={dungeon.name} className="counter-card">
                    <div className="counter-name">{dungeon.displayName}</div>
                    <div className="counter-value">{dungeon.count}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="stats-empty">
              <p>No dungeon statistics found in this save file.</p>
            </div>
          )}
        </>
      )}

      {!saveData && !showFileControls && (
        <div className="placeholder-message">
          <div className="placeholder-icon">📊</div>
          <div>Load a .sav file to view dungeon statistics</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Dungeon completion counts will appear here
          </div>
        </div>
      )}
    </div>
  );
}
