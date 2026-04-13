'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { MiniPlayer } from '@/components/player/mini-player';
import { Toaster } from '@/components/ui/sonner';
import { useSettingsStore } from '@/stores/settings-store';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <MiniPlayer />
      <Toaster theme="dark" />
    </>
  );
}
