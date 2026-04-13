import fs from 'fs/promises';
import path from 'path';
import { isDev } from '@/lib/env';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'music');

export interface MusicMeta {
  id: string;
  title: string;
  lyrics: string;
  styleTags: string;
  coverImagePath?: string;
  audioFormat: string;
  duration?: number;
  createdAt: string;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveMusic(
  id: string,
  meta: Omit<MusicMeta, 'id' | 'createdAt'>,
  audioBuffer: Buffer,
  coverImageBuffer?: Buffer
): Promise<MusicMeta> {
  if (!isDev) throw new Error('Local storage is only available in development');

  const dir = path.join(STORAGE_DIR, id);
  await ensureDir(dir);

  const audioFileName = `audio.${meta.audioFormat || 'mp3'}`;
  await fs.writeFile(path.join(dir, audioFileName), audioBuffer);

  let coverPath: string | undefined;
  if (coverImageBuffer) {
    coverPath = 'cover.jpg';
    await fs.writeFile(path.join(dir, coverPath), coverImageBuffer);
  }

  const fullMeta: MusicMeta = {
    id,
    ...meta,
    coverImagePath: coverPath,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(fullMeta, null, 2));

  return fullMeta;
}

export async function getMusicList(): Promise<MusicMeta[]> {
  if (!isDev) return [];

  try {
    await ensureDir(STORAGE_DIR);
    const entries = await fs.readdir(STORAGE_DIR);
    const list: MusicMeta[] = [];

    for (const entry of entries) {
      const metaPath = path.join(STORAGE_DIR, entry, 'meta.json');
      try {
        const content = await fs.readFile(metaPath, 'utf-8');
        list.push(JSON.parse(content));
      } catch {
        // Skip invalid entries
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getMusicAudio(id: string): Promise<Buffer | null> {
  if (!isDev) return null;

  try {
    const metaPath = path.join(STORAGE_DIR, id, 'meta.json');
    const meta: MusicMeta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
    const audioPath = path.join(STORAGE_DIR, id, `audio.${meta.audioFormat || 'mp3'}`);
    return await fs.readFile(audioPath);
  } catch {
    return null;
  }
}

export async function getMusicCover(id: string): Promise<Buffer | null> {
  if (!isDev) return null;

  try {
    const coverPath = path.join(STORAGE_DIR, id, 'cover.jpg');
    return await fs.readFile(coverPath);
  } catch {
    return null;
  }
}

export async function saveCoverImage(id: string, imageBuffer: Buffer): Promise<void> {
  if (!isDev) return;

  const dir = path.join(STORAGE_DIR, id);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, 'cover.jpg'), imageBuffer);

  // Update meta.json to include cover path
  const metaPath = path.join(dir, 'meta.json');
  try {
    const meta: MusicMeta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
    meta.coverImagePath = 'cover.jpg';
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
  } catch {
    // Meta file may not exist yet
  }
}

export async function deleteMusic(id: string): Promise<boolean> {
  if (!isDev) return false;

  try {
    const dir = path.join(STORAGE_DIR, id);
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
