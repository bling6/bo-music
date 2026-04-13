'use client';

import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useMusicStore } from '@/stores/music-store';
import { DownloadButton } from './download-button';

export function AudioPlayerWrapper() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const generationStatus = useMusicStore((s) => s.generationStatus);

  if (!currentSong || generationStatus !== 'success') return null;

  return (
    <div className="mt-6">
      <AudioPlayer
        src={currentSong.audioUrl}
        showJumpControls={false}
        layout="horizontal-reverse"
        customAdditionalControls={[<DownloadButton key="download" />]}
        className="!bg-transparent !shadow-none [&_.rhap_main]:!flex-col [&_.rhap_main-controls-button]:!text-white [&_.rhap_progress-bar]:!bg-zinc-800 [&_.rhap_progress-filled]:!bg-white [&_.rhap_progress-indicator]:!bg-white [&_.rhap_download-progress]:!bg-zinc-700 [&_.rhap_time]:!text-zinc-500 [&_.rhap_volume-bar]:!bg-zinc-800 [&_.rhap_volume-filled]:!bg-white [&_.rhap_volume-indicator]:!bg-white [&_.rhap_button-clear]:!text-white hover:[&_.rhap_button-clear]:!bg-zinc-800"
      />
    </div>
  );
}
