'use client';

import { ModeSwitch } from '@/components/creation/mode-switch';
import { SimpleMode } from '@/components/creation/simple-mode';
import { LyricsStep } from '@/components/creation/pro-mode/lyrics-step';
import { EditStep } from '@/components/creation/pro-mode/edit-step';
import { MusicStep } from '@/components/creation/pro-mode/music-step';
import { useMusicStore } from '@/stores/music-store';
import { useI18n } from '@/lib/i18n';

export default function CreatePage() {
  const mode = useMusicStore((s) => s.mode);
  const proStep = useMusicStore((s) => s.proStep);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-black pt-24 pb-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            {t('creation.title')}
          </h1>
        </div>

        <ModeSwitch />

        {mode === 'simple' ? (
          <SimpleMode />
        ) : (
          <div>
            {/* Pro mode step indicator */}
            <div className="flex items-center gap-4 mb-8">
              {[
                { step: 1, label: '生成歌词' },
                { step: 2, label: '编辑歌词' },
                { step: 3, label: '生成音乐' },
              ].map(({ step, label }, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${proStep >= step ? 'text-white' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      proStep > step ? 'bg-white text-black' :
                      proStep === step ? 'bg-white text-black' :
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {proStep > step ? '✓' : step}
                    </div>
                    <span className="text-sm font-medium hidden md:inline">{label}</span>
                  </div>
                  {i < 2 && <div className="w-8 h-px bg-zinc-800" />}
                </div>
              ))}
            </div>

            {proStep === 1 && <LyricsStep />}
            {proStep === 2 && <EditStep />}
            {proStep === 3 && <MusicStep />}
          </div>
        )}
      </div>
    </div>
  );
}
