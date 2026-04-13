'use client';

import { parseLyrics } from '@/lib/lyrics-parser';
import { useMusicStore } from '@/stores/music-store';

export function LyricsDisplay() {
  const currentSong = useMusicStore((s) => s.currentSong);

  if (!currentSong?.lyrics) return null;

  const sections = parseLyrics(currentSong.lyrics);

  return (
    <div className="bg-black/50 rounded-2xl p-6 text-sm leading-8 text-muted-foreground max-h-[250px] overflow-y-auto">
      {sections.map((section, i) => (
        <div key={i}>
          <div className="text-zinc-400 font-semibold uppercase text-xs tracking-wider mb-1">
            [{section.tag}{section.number ? ` ${section.number}` : ''}]
          </div>
          {section.lines.map((line, j) => (
            <div key={j}>{line}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
