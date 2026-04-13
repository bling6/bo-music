'use client';

import { useMusicStore, type CreationMode } from '@/stores/music-store';
import { useI18n } from '@/lib/i18n';

export function ModeSwitch() {
  const mode = useMusicStore((s) => s.mode);
  const setMode = useMusicStore((s) => s.setMode);
  const isGenerating = useMusicStore((s) => s.generationStatus === 'generating');
  const { t } = useI18n();

  return (
    <div className="flex gap-3 mb-12">
      <button
        onClick={() => setMode('simple')}
        disabled={isGenerating}
        className={`px-7 py-3.5 rounded-full text-sm font-semibold cursor-pointer border transition-all ${
          mode === 'simple'
            ? 'bg-white text-black border-white'
            : 'bg-transparent text-muted-foreground border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
        } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {t('creation.simpleMode')}
      </button>
      <button
        onClick={() => setMode('pro')}
        disabled={isGenerating}
        className={`px-7 py-3.5 rounded-full text-sm font-semibold cursor-pointer border transition-all ${
          mode === 'pro'
            ? 'bg-white text-black border-white'
            : 'bg-transparent text-muted-foreground border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
        } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {t('creation.proMode')}
      </button>
    </div>
  );
}
