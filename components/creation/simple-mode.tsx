'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMusicStore } from '@/stores/music-store';
import { useSettingsStore } from '@/stores/settings-store';
import { buildCoverPrompt } from '@/lib/minimax/image';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function SimpleMode() {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [model, setModel] = useState<'music-2.6' | 'music-2.6-free'>('music-2.6');
  const router = useRouter();

  const { startGeneration, generationSuccess, generationError, setCoverImage, updateRecentCoverImage, generationStatus } = useMusicStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const { t } = useI18n();

  const isGenerating = generationStatus === 'generating';

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error(t('errors.apiKeyRequired'));
      return;
    }
    if (!prompt.trim()) {
      toast.error(t('errors.promptRequired'));
      return;
    }

    startGeneration();

    try {
      const musicData = await apiFetch<{
        data: { audio: string };
        extra_info?: { music_duration?: number };
        recordId?: string;
      }>('/api/music/generate', {
        method: 'POST',
        body: JSON.stringify({
          apiKey,
          model,
          prompt: prompt.trim(),
          lyrics_optimizer: true,
          output_format: 'hex',
          title: title || prompt.slice(0, 20),
        }),
      });
      console.log(musicData)
      const audioHex = musicData.data.audio;
      const audioUrl = `data:audio/mp3;base64,${hexToBase64(audioHex)}`;
      const recordId = musicData.recordId;

      const song = {
        audioUrl,
        lyrics: '',
        title: title || prompt.slice(0, 20),
        styleTags: '',
        duration: musicData.extra_info?.music_duration,
        format: 'mp3',
        recordId,
      };

      generationSuccess(song);
      router.push('/history');

      generateCoverAsync(prompt, '', recordId);

    } catch (error) {
      const message = error instanceof ApiRequestError
        ? (error.action ? `${error.message}，${error.action}` : error.message)
        : (error instanceof Error ? error.message : t('errors.generationFailed'));
      generationError(message);
      toast.error(message);
    }
  };

  const generateCoverAsync = async (songPrompt: string, styleTags: string, recordId?: string) => {
    try {
      const coverPrompt = buildCoverPrompt(songPrompt, styleTags);
      const imageData = await apiFetch<{
        data: { image_urls?: string[] };
      }>('/api/image/generate', {
        method: 'POST',
        body: JSON.stringify({ apiKey, prompt: coverPrompt, recordId }),
      });

      if (imageData.data?.image_urls?.[0]) {
        setCoverImage(imageData.data.image_urls[0]);
        // Update the most recent history item's cover image
        const recentSongs = useMusicStore.getState().recentSongs;
        const latestItem = recentSongs[0];
        if (latestItem) {
          updateRecentCoverImage(latestItem.id, imageData.data.image_urls[0]);
        }
      }
    } catch (error) {
      const message = error instanceof ApiRequestError
        ? (error.action ? `${error.message}，${error.action}` : error.message)
        : t('errors.coverGenerationFailed');
      toast.warning(`${t('errors.coverGenerationFailed')}：${message}`);
    }
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-3xl p-12">
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          {t('creation.songDescription')}
        </label>
        <Textarea
          placeholder={t('creation.songDescriptionPlaceholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-2xl min-h-[120px] text-base resize-y focus:border-zinc-600 placeholder:text-zinc-700"
        />
        <p className="text-sm text-zinc-600 mt-2.5">{t('creation.autoHint')}</p>
        <p className="text-sm text-amber-600/70 mt-1">{t('creation.simpleModeNoLyricsHint')}</p>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          {t('creation.songTitle')}
        </label>
        <Input
          placeholder={t('creation.songTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-xl h-12 placeholder:text-zinc-700 focus:border-zinc-600"
        />
      </div>

      <div className="mb-8">
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
          {t('proMode.model')}
        </Label>
        <Select value={model} onValueChange={(v) => setModel(v as 'music-2.6' | 'music-2.6-free')}>
          <SelectTrigger className="bg-black/50 border-zinc-800 rounded-xl h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="music-2.6">music-2.6</SelectItem>
            <SelectItem value="music-2.6-free">music-2.6-free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-300 text-base font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('creation.generating')}
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {t('creation.generateMusic')}
          </>
        )}
      </Button>
    </div>
  );
}

function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
