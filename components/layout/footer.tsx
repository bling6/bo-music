'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="px-6 md:px-12 py-16 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold no-underline text-white">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-black" />
          </div>
          BO-Music
        </Link>
        <div className="text-sm text-zinc-600">
          {t('footer.slogan')}
        </div>
        <div className="flex gap-8">
          <Link href="/create" className="text-sm text-muted-foreground hover:text-white transition-colors no-underline">
            {t('nav.create')}
          </Link>
          <Link href="/history" className="text-sm text-muted-foreground hover:text-white transition-colors no-underline">
            {t('nav.history')}
          </Link>
          <Link href="/settings" className="text-sm text-muted-foreground hover:text-white transition-colors no-underline">
            {t('nav.settings')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
