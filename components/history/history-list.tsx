'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trash2, Download, Pencil } from 'lucide-react';
import { useMusicStore } from '@/stores/music-store';
import type { CurrentSong, SongHistoryItem } from '@/stores/music-store';
import { useI18n } from '@/lib/i18n';

interface ServerHistoryItem {
  id: string;
  title: string;
  lyrics: string;
  styleTags: string;
  coverImagePath?: string;
  audioFormat: string;
  duration?: number;
  createdAt: string;
}

interface UnifiedItem {
  id: string;
  title: string;
  lyrics: string;
  styleTags: string;
  coverImageUrl?: string;
  audioUrl: string;
  format: string;
  duration?: number;
  createdAt: string;
  source: 'recent' | 'server';
  serverId?: string;
}

export function HistoryList() {
  const [serverItems, setServerItems] = useState<ServerHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const playSong = useMusicStore((s) => s.playSong);
  const recentSongs = useMusicStore((s) => s.recentSongs);
  const deleteRecentSong = useMusicStore((s) => s.deleteRecentSong);
  const renameRecentSong = useMusicStore((s) => s.renameRecentSong);

  useEffect(() => {
    fetchServerHistory();
  }, []);

  const fetchServerHistory = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/music/history', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setServerItems(data);
      }
    } catch {
      // Network error or timeout — still show recent songs
    } finally {
      setLoading(false);
    }
  };

  // Deduplicate: server items whose id matches a recent song's recordId are skipped
  const serverRecordIds = useMemo(
    () => new Set(recentSongs.filter((s) => s.recordId).map((s) => s.recordId)),
    [recentSongs]
  );

  const unifiedItems = useMemo<UnifiedItem[]>(() => {
    const recent: UnifiedItem[] = recentSongs.map((item) => ({
      id: item.id,
      title: item.title,
      lyrics: item.lyrics,
      styleTags: item.styleTags,
      coverImageUrl: item.coverImageUrl,
      audioUrl: item.audioUrl,
      format: item.format || 'mp3',
      duration: item.duration,
      createdAt: item.createdAt,
      source: 'recent' as const,
    }));

    const server: UnifiedItem[] = serverItems
      .filter((item) => !serverRecordIds.has(item.id))
      .map((item) => ({
        id: `server-${item.id}`,
        title: item.title,
        lyrics: item.lyrics,
        styleTags: item.styleTags,
        coverImageUrl: item.coverImagePath ? `/api/music/history?id=${item.id}&type=cover` : undefined,
        audioUrl: `/api/music/history?id=${item.id}&type=audio`,
        format: item.audioFormat || 'mp3',
        duration: item.duration,
        createdAt: item.createdAt,
        source: 'server' as const,
        serverId: item.id,
      }));

    return [...recent, ...server].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [recentSongs, serverItems, serverRecordIds]);

  const handlePlay = (item: UnifiedItem) => {
    const song: CurrentSong = {
      audioUrl: item.audioUrl,
      lyrics: item.lyrics,
      title: item.title,
      styleTags: item.styleTags,
      coverImageUrl: item.coverImageUrl,
      duration: item.duration,
      format: item.format,
    };
    playSong(song);
  };

  const handleDelete = async (item: UnifiedItem) => {
    if (item.source === 'recent') {
      deleteRecentSong(item.id);
    } else if (item.serverId) {
      const res = await fetch('/api/music/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.serverId }),
      });
      if (res.ok) {
        setServerItems((prev) => prev.filter((s) => s.id !== item.serverId));
      }
    }
  };

  const handleDownload = (item: UnifiedItem) => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    link.download = `${item.title || 'music'}.${item.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartRename = (item: UnifiedItem) => {
    setRenamingId(item.id);
    setRenameValue(item.title);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const handleConfirmRename = () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    // Update recent songs in store
    renameRecentSong(renamingId, trimmed);

    // Update server items locally
    setServerItems((prev) =>
      prev.map((item) =>
        `server-${item.id}` === renamingId ? { ...item, title: trimmed } : item
      )
    );

    setRenamingId(null);
    setRenameValue('');
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  if (unifiedItems.length === 0 && loading) {
    return <div className="text-center text-muted-foreground py-8">{t('common.loading')}</div>;
  }

  if (unifiedItems.length === 0 && !loading) {
    return <div className="text-center text-muted-foreground py-8">{t('history.empty')}</div>;
  }

  return (
    <div className="space-y-2">
      {unifiedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 p-4 bg-black/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg cover-gradient flex-shrink-0 flex items-center justify-center overflow-hidden">
            {item.coverImageUrl ? (
              <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Play className="w-4 h-4 text-white/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {renamingId === item.id ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') handleCancelRename();
                }}
                onBlur={handleConfirmRename}
                className="font-medium bg-transparent border-b border-white/30 outline-none w-full text-white focus:border-white/60"
                autoFocus
              />
            ) : (
              <div
                className={`font-medium truncate ${!item.title ? 'text-zinc-500 italic' : ''}`}
                onDoubleClick={() => handleStartRename(item)}
              >
                {item.title || t('history.untitled')}
              </div>
            )}
            <div className="text-sm text-muted-foreground truncate">
              {item.styleTags || t('history.noStyle')}
            </div>
          </div>

          <div className="text-xs text-zinc-600">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleStartRename(item)}
              className="h-8 w-8 text-muted-foreground hover:text-white"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handlePlay(item)}
              className="h-8 w-8 text-muted-foreground hover:text-white"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDownload(item)}
              className="h-8 w-8 text-muted-foreground hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(item)}
              className="h-8 w-8 text-muted-foreground hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
