import React, { useState, useCallback } from 'react';
import { Button } from '../common';
import { CharacterPanel } from './CharacterPanel';
import { createCharacterSharePayload } from '../../models/CharacterShareModel';
import { encodeCharacterShare, buildCharacterShareUrl } from '../../utils/shareUrl';

export function CharacterTab({ saveData, itemStore, onClearSave, onLog }) {
  const [shareFeedback, setShareFeedback] = useState(null);

  // Build characterData from itemStore (central source of truth)
  // Falls back to saveData for backward compatibility
  const characterData = itemStore?.hasItems ? {
    filename: itemStore.metadata.filename || saveData?.filename,
    equippedItems: itemStore.equipped,
    timestamp: itemStore.metadata.loadedAt,
    stanceContext: itemStore.metadata.stanceContext,
    characterStats: itemStore.metadata.allocatedAttributes,
  } : saveData ? {
    filename: saveData.filename,
    equippedItems: saveData.equippedItems || [],
    timestamp: saveData.timestamp,
  } : null;

  const handleShare = useCallback(async () => {
    const payload = createCharacterSharePayload(
      itemStore.equipped,
      characterData?.stanceContext ?? null
    );
    const url = buildCharacterShareUrl(payload);
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Copied!');
    } catch {
      window.prompt('Copy this share link:', url);
      setShareFeedback('Ready');
    }
    if (onLog) onLog('Share link copied to clipboard');
    setTimeout(() => setShareFeedback(null), 2000);
  }, [itemStore.equipped, characterData?.stanceContext, onLog]);

  return (
    <div className="tab-content active">
      <div className="controls" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="control-row" style={{ marginBottom: 0 }}>
          <div className="current-file-info">
            <span className="current-file-icon">📄</span>
            <span className="current-file-name">{characterData?.filename || saveData?.filename}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="🔗" onClick={handleShare} hidden={!itemStore?.hasItems}>
              {shareFeedback || 'Share Build'}
            </Button>
            <Button icon="📂" onClick={onClearSave}>
              Load Different File
            </Button>
          </div>
        </div>
      </div>

      {characterData && (
        <CharacterPanel characterData={characterData} />
      )}
    </div>
  );
}
