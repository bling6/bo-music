'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, Settings, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings-store';
import { useI18n } from '@/lib/i18n';

export function Header() {
  const pathname = usePathname();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const { t } = useI18n();

  const navItems = [
    { href: '/create', label: t('nav.create'), icon: Plus },
    { href: '/history', label: t('nav.history'), icon: History },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex justify-between items-center bg-black/80 backdrop-blur-xl border-b border-border">
      <Link href="/" className="flex items-center gap-3 text-xl font-bold text-white no-underline">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-black" />
        </div>
        BO-Music
      </Link>

      <div className="flex items-center gap-2">
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-medium no-underline px-4 py-2 rounded-full transition-colors ${
                  isActive
                    ? 'text-black bg-white'
                    : 'text-muted-foreground hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="text-xs font-semibold px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          {locale === 'zh' ? '中' : 'EN'}
        </button>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1">
          {navItems.map(({ href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`p-2 rounded-lg transition-colors ${
                  isActive ? 'text-white bg-zinc-800' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
