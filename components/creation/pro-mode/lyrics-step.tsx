'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMusicStore } from '@/stores/music-store';
import { useSettingsStore } from '@/stores/settings-store';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function LyricsStep() {
  const [mode, setMode] = useState<'write_full_song' | 'edit'>('write_full_song');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [existingLyrics, setExistingLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const setLyricsData = useMusicStore((s) => s.setLyricsData);
  const setProStep = useMusicStore((s) => s.setProStep);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const { t } = useI18n();

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error(t('errors.apiKeyRequired'));
      return;
    }
    if (mode === 'write_full_song' && !prompt.trim()) {
      toast.error(t('errors.promptRequired'));
      return;
    }
    if (mode === 'edit' && !existingLyrics.trim()) {
      toast.error(t('errors.lyricsRequired'));
      return;
    }

    setIsGenerating(true);

    try {
      const data = await apiFetch<{
        song_title?: string;
        lyrics: string;
        style_tags?: string;
      }>('/api/lyrics/generate', {
        method: 'POST',
        body: JSON.stringify({
          apiKey,
          mode,
          prompt: prompt.trim() || undefined,
          title: title.trim() || undefined,
          lyrics: mode === 'edit' ? existingLyrics : undefined,
        }),
      });

      setLyricsData({
        title: data.song_title || title,
        lyrics: data.lyrics,
        styleTags: data.style_tags || '',
      });

      setProStep(2);
    } catch (error) {
      const message = error instanceof ApiRequestError
        ? (error.action ? `${error.message}，${error.action}` : error.message)
        : (error instanceof Error ? error.message : t('errors.lyricsFailed'));
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-3xl p-12">
      <div className="mb-8">
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
          {t('proMode.generationMode')}
        </Label>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('write_full_song')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer border transition-all ${
              mode === 'write_full_song'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-muted-foreground border-zinc-700 hover:border-zinc-500'
            }`}
          >
            {t('proMode.generateLyrics')}
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer border transition-all ${
              mode === 'edit'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-muted-foreground border-zinc-700 hover:border-zinc-500'
            }`}
          >
            {t('proMode.editContinue')}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
          {t('proMode.songPrompt')}
        </Label>
        <Textarea
          placeholder={t('proMode.songPromptPlaceholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-2xl min-h-[100px] placeholder:text-zinc-700 focus:border-zinc-600"
        />
      </div>

      <div className="mb-8">
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
          {t('creation.songTitle')}
        </Label>
        <Input
          placeholder={t('creation.songTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-xl h-12 placeholder:text-zinc-700 focus:border-zinc-600"
        />
      </div>

      {mode === 'edit' && (
        <div className="mb-8">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
            {t('proMode.existingLyrics')}
          </Label>
          <Textarea
            placeholder={t('proMode.existingLyricsPlaceholder')}
            value={existingLyrics}
            onChange={(e) => setExistingLyrics(e.target.value)}
            className="bg-black/50 border-zinc-800 rounded-2xl min-h-[150px] placeholder:text-zinc-700 focus:border-zinc-600"
          />
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-300 text-base font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('creation.generatingLyrics')}
          </>
        ) : (
          <>
            {t('proMode.generateLyrics')}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}
