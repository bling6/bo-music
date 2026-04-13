'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function MusicStep() {
  const { lyricsData, startGeneration, generationSuccess, generationError, setCoverImage, updateRecentCoverImage, generationStatus } = useMusicStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const router = useRouter();
  const { t } = useI18n();

  const [prompt, setPrompt] = useState(lyricsData?.styleTags || '');
  const [model, setModel] = useState<'music-2.6' | 'music-2.6-free'>('music-2.6-free');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sampleRate, setSampleRate] = useState('32000');
  const [bitrate, setBitrate] = useState('128000');
  const [format, setFormat] = useState('mp3');

  const isGenerating = generationStatus === 'generating';

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error(t('errors.apiKeyRequired'));
      return;
    }

    startGeneration();

    try {
      const body: Record<string, unknown> = {
        apiKey,
        model,
        prompt: prompt.trim() || undefined,
        lyrics: isInstrumental ? undefined : lyricsData?.lyrics,
        is_instrumental: isInstrumental,
        output_format: 'hex',
        title: lyricsData?.title,
        styleTags: lyricsData?.styleTags,
      };

      if (showAdvanced) {
        body.audio_setting = {
          sample_rate: Number(sampleRate),
          bitrate: Number(bitrate),
          format,
        };
      }

      const musicData = await apiFetch<{
        data: { audio: string };
        extra_info?: { music_duration?: number };
        recordId?: string;
      }>('/api/music/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const audioHex = musicData.data.audio;
      const audioUrl = `data:audio/${format};base64,${hexToBase64(audioHex)}`;
      const recordId = musicData.recordId;

      generationSuccess({
        audioUrl,
        lyrics: lyricsData?.lyrics || '',
        title: lyricsData?.title || '',
        styleTags: lyricsData?.styleTags || '',
        duration: musicData.extra_info?.music_duration,
        format,
        recordId,
      });
      router.push('/history');

      generateCoverAsync(recordId);

    } catch (error) {
      const message = error instanceof ApiRequestError
        ? (error.action ? `${error.message}，${error.action}` : error.message)
        : (error instanceof Error ? error.message : t('errors.generationFailed'));
      generationError(message);
      toast.error(message);
    }
  };

  const generateCoverAsync = async (recordId?: string) => {
    try {
      const coverPrompt = buildCoverPrompt(prompt || lyricsData?.title || '', lyricsData?.styleTags || '');
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
        <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
          {t('proMode.styleDescription')}
        </Label>
        <Textarea
          placeholder={t('proMode.stylePlaceholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-black/50 border-zinc-800 rounded-2xl min-h-[80px] placeholder:text-zinc-700 focus:border-zinc-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 block">
            {t('proMode.model')}
          </Label>
          <Select value={model} onValueChange={(v) => setModel(v as 'music-2.6' | 'music-2.6-free')}>
            <SelectTrigger className="bg-black/50 border-zinc-800 rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="music-2.6-free">music-2.6-free</SelectItem>
              <SelectItem value="music-2.6">music-2.6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between md:pt-7">
          <Label className="text-sm font-medium">{t('proMode.instrumental')}</Label>
          <Switch
            checked={isInstrumental}
            onCheckedChange={setIsInstrumental}
          />
        </div>
      </div>

      {/* Advanced settings */}
      <div className="mb-8">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t('proMode.audioSettings')}
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-black/50 border border-zinc-800 rounded-2xl">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">
                {t('proMode.sampleRate')}
              </Label>
              <Select value={sampleRate} onValueChange={(v) => v && setSampleRate(v)}>
                <SelectTrigger className="bg-black border-zinc-800 rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="16000">16000 Hz</SelectItem>
                  <SelectItem value="24000">24000 Hz</SelectItem>
                  <SelectItem value="32000">32000 Hz</SelectItem>
                  <SelectItem value="44100">44100 Hz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">
                {t('proMode.bitrate')}
              </Label>
              <Select value={bitrate} onValueChange={(v) => v && setBitrate(v)}>
                <SelectTrigger className="bg-black border-zinc-800 rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="32000">32 kbps</SelectItem>
                  <SelectItem value="64000">64 kbps</SelectItem>
                  <SelectItem value="128000">128 kbps</SelectItem>
                  <SelectItem value="256000">256 kbps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">
                {t('proMode.audioFormat')}
              </Label>
              <Select value={format} onValueChange={(v) => v && setFormat(v)}>
                <SelectTrigger className="bg-black border-zinc-800 rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="pcm">PCM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
            {t('proMode.startGenerate')}
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
