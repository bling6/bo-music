'use client';

import { Download } from 'lucide-react';
import { useMusicStore } from '@/stores/music-store';
import { useI18n } from '@/lib/i18n';

export function DownloadButton() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const { t } = useI18n();

  if (!currentSong) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentSong.audioUrl;
    link.download = `${currentSong.title || 'music'}.${currentSong.format || 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="rhap_button-clear flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800 transition-colors"
      title={t('common.download')}
    >
      <Download className="w-4 h-4 text-white" />
    </button>
  );
}
