'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMusicStore } from '@/stores/music-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowRight, RotateCcw, PenLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function EditStep() {
  const { lyricsData, setLyricsData, setProStep } = useMusicStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (lyricsData?.lyrics) {
      setEditedLyrics(lyricsData.lyrics);
    }
  }, [lyricsData]);

  const handleContinue = async () => {
    if (!apiKey || !editedLyrics.trim()) return;

    setIsContinuing(true);
    try {
      const res = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          mode: 'edit',
          lyrics: editedLyrics,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('errors.continueFailed'));

      setLyricsData({
        ...lyricsData!,
        lyrics: data.lyrics,
        styleTags: data.style_tags || lyricsData?.styleTags || '',
      });
      setEditedLyrics(data.lyrics);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.continueFailed'));
    } finally {
      setIsContinuing(false);
    }
  };

  const handleNext = () => {
    setLyricsData({
      ...lyricsData!,
      lyrics: editedLyrics,
    });
    setProStep(3);
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-3xl p-12">
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-1">{lyricsData?.title || t('player.lyrics')}</h3>
        {lyricsData?.styleTags && (
          <p className="text-sm text-muted-foreground">{lyricsData.styleTags}</p>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          {t('proMode.editLyrics')}
        </label>
        <Textarea
          value={editedLyrics}
          onChange={(e) => setEditedLyrics(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-2xl min-h-[300px] text-base leading-relaxed resize-y font-mono placeholder:text-zinc-700 focus:border-zinc-600"
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setProStep(1)}
          className="rounded-xl border-zinc-700 text-muted-foreground hover:text-white hover:border-zinc-500 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t('proMode.regenerate')}
        </Button>
        <Button
          variant="outline"
          onClick={handleContinue}
          disabled={isContinuing}
          className="rounded-xl border-zinc-700 text-muted-foreground hover:text-white hover:border-zinc-500 flex items-center gap-2"
        >
          {isContinuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          {t('proMode.continue')}
        </Button>
        <Button
          onClick={handleNext}
          className="ml-auto rounded-xl bg-white text-black hover:bg-zinc-300 flex items-center gap-2 px-6"
        >
          {t('proMode.nextGenerateMusic')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
