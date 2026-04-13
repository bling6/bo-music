'use client';

import Link from 'next/link';
import { Music, Sparkles, Palette, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-12 pt-32 pb-24 relative">
        {/* <div className="flex items-center gap-2.5 px-5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-full mb-12">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Powered by MiniMax AI</span>
        </div> */}

        <h1 className="text-5xl md:text-7xl lg:text-[100px] font-bold leading-[0.95] tracking-tight mb-8">
          <span className="block">{t('hero.line1')}</span>
          <span className="block text-zinc-600">{t('hero.line2')}</span>
        </h1>

        <p className="text-lg text-zinc-500 max-w-lg leading-relaxed mb-12">
          {t('hero.subtitle')}
        </p>

        <Link
          href="/create"
          className="inline-flex items-center gap-2.5 px-9 py-4.5 rounded-full bg-white text-black font-semibold text-base hover:bg-zinc-300 transition-all hover:-translate-y-0.5"
        >
          {t('hero.cta')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Audio Visualizer */}
        <div className="flex items-center gap-2 h-[120px] px-5">
          {[40,70,50,90,60,100,70,110,80,60,90,50,100,70,80,60,110,50,90,70,100,60,80,40].map((h, i) => (
            <div
              key={i}
              className="visualizer-bar w-2 bg-zinc-600 rounded"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-12 py-28 max-w-6xl mx-auto border-t border-border">
        <div className="mb-20">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-6">
            {t('features.label')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            {t('features.title1')}<br />{t('features.title2')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
          <div className="bg-black p-12 hover:bg-zinc-950 transition-colors">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('features.compose.title')}</h3>
            <p className="text-zinc-500 leading-relaxed">
              {t('features.compose.desc')}
            </p>
          </div>

          <div className="bg-black p-12 hover:bg-zinc-950 transition-colors">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('features.lyrics.title')}</h3>
            <p className="text-zinc-500 leading-relaxed">
              {t('features.lyrics.desc')}
            </p>
          </div>

          <div className="bg-black p-12 hover:bg-zinc-950 transition-colors">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('features.cover.title')}</h3>
            <p className="text-zinc-500 leading-relaxed">
              {t('features.cover.desc')}
            </p>
          </div>

          <div className="bg-black p-12 hover:bg-zinc-950 transition-colors">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('features.dual.title')}</h3>
            <p className="text-zinc-500 leading-relaxed">
              {t('features.dual.desc')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
