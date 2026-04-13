'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';
import { useMusicStore } from '@/stores/music-store';
import { useI18n } from '@/lib/i18n';

export function CoverImage() {
  const { currentSong, generationStatus } = useMusicStore();
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const coverUrl = currentSong?.coverImageUrl;
  const isGenerating = generationStatus === 'generating';

  return (
    <>
      <div
        className="aspect-square rounded-2xl overflow-hidden cursor-pointer relative group"
        onClick={() => coverUrl && !error && setShowFull(true)}
      >
        {isGenerating ? (
          <Skeleton className="w-full h-full rounded-2xl cover-gradient" />
        ) : coverUrl && !error ? (
          <>
            <img
              src={coverUrl}
              alt="Cover"
              className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
            {!loaded && <Skeleton className="absolute inset-0 rounded-2xl" />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                {t('player.viewLarge')}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full cover-gradient flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 text-white/50 mx-auto mb-2" />
              <span className="text-sm text-white/50">{t('player.coverGenerating')}</span>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showFull} onOpenChange={setShowFull}>
        <DialogContent className="bg-black border-zinc-800 max-w-lg p-2">
          <DialogTitle className="sr-only">{t('player.viewLarge')}</DialogTitle>
          {coverUrl && (
            <img src={coverUrl} alt="Cover Full" className="w-full rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
