export interface LyricsSection {
  tag: string;
  number?: number;
  lines: string[];
}

export function parseLyrics(lyrics: string): LyricsSection[] {
  const sections: LyricsSection[] = [];
  let currentSection: LyricsSection | null = null;

  const lines = lyrics.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const tagMatch = trimmed.match(/^\[(.+?)\]$/);

    if (tagMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      const rawTag = tagMatch[1];
      const numMatch = rawTag.match(/^(.+?)\s+(\d+)$/);

      currentSection = {
        tag: numMatch ? numMatch[1] : rawTag,
        number: numMatch ? parseInt(numMatch[2], 10) : undefined,
        lines: [],
      };
    } else if (trimmed) {
      if (!currentSection) {
        currentSection = { tag: 'Intro', lines: [] };
      }
      currentSection.lines.push(trimmed);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}
