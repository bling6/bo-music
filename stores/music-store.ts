import { create } from 'zustand';

export type CreationMode = 'simple' | 'pro';
export type ProStep = 1 | 2 | 3;
export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface LyricsData {
  title: string;
  lyrics: string;
  styleTags: string;
}

export interface CurrentSong {
  audioUrl: string;
  audioData?: string;
  lyrics: string;
  title: string;
  coverImageUrl?: string;
  coverImageData?: string;
  styleTags: string;
  duration?: number;
  format?: string;
  recordId?: string;
}

export interface SongHistoryItem {
  id: string;
  audioUrl: string;
  lyrics: string;
  title: string;
  coverImageUrl?: string;
  styleTags: string;
  duration?: number;
  format?: string;
  createdAt: string;
  recordId?: string;
}

interface MusicState {
  mode: CreationMode;
  proStep: ProStep;
  lyricsData: LyricsData | null;
  generationStatus: GenerationStatus;
  currentSong: CurrentSong | null;
  errorMessage: string | null;
  showFullPlayer: boolean;
  recentSongs: SongHistoryItem[];

  setMode: (mode: CreationMode) => void;
  setProStep: (step: ProStep) => void;
  setLyricsData: (data: LyricsData | null) => void;
  startGeneration: () => void;
  generationSuccess: (song: CurrentSong) => void;
  playSong: (song: CurrentSong) => void;
  generationError: (message: string) => void;
  reset: () => void;
  setCoverImage: (url: string, data?: string) => void;
  setShowFullPlayer: (show: boolean) => void;
  deleteRecentSong: (id: string) => void;
  updateRecentCoverImage: (id: string, coverImageUrl: string) => void;
  renameRecentSong: (id: string, title: string) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  mode: 'simple',
  proStep: 1,
  lyricsData: null,
  generationStatus: 'idle',
  currentSong: null,
  errorMessage: null,
  showFullPlayer: false,
  recentSongs: [],

  setMode: (mode) => {
    // Don't allow switching mode while generating
    if (get().generationStatus === 'generating') return;
    set({ mode, proStep: 1, lyricsData: null, errorMessage: null });
  },
  setProStep: (step) => set({ proStep: step }),
  setLyricsData: (data) => set({ lyricsData: data }),
  startGeneration: () => set({ generationStatus: 'generating', errorMessage: null }),
  generationSuccess: (song) => {
    const historyItem: SongHistoryItem = {
      id: `local-${Date.now()}`,
      audioUrl: song.audioUrl,
      lyrics: song.lyrics,
      title: song.title,
      coverImageUrl: song.coverImageUrl,
      styleTags: song.styleTags,
      duration: song.duration,
      format: song.format,
      createdAt: new Date().toISOString(),
      recordId: song.recordId,
    };
    const newRecent = [historyItem, ...get().recentSongs];
    set({ generationStatus: 'success', currentSong: song, recentSongs: newRecent });
  },
  playSong: (song) => set({ generationStatus: 'success', currentSong: song }),
  generationError: (message) => set({ generationStatus: 'error', errorMessage: message }),
  reset: () => set({ mode: 'simple', proStep: 1, lyricsData: null, generationStatus: 'idle', currentSong: null, errorMessage: null, showFullPlayer: false }),
  setCoverImage: (url, data) =>
    set((state) => ({
      currentSong: state.currentSong
        ? { ...state.currentSong, coverImageUrl: url, coverImageData: data }
        : null,
    })),
  setShowFullPlayer: (show) => set({ showFullPlayer: show }),
  deleteRecentSong: (id) => {
    const newRecent = get().recentSongs.filter((item) => item.id !== id);
    set({ recentSongs: newRecent });
  },
  updateRecentCoverImage: (id, coverImageUrl) => {
    const newRecent = get().recentSongs.map((item) =>
      item.id === id ? { ...item, coverImageUrl } : item
    );
    set({ recentSongs: newRecent });
  },
  renameRecentSong: (id, title) => {
    const newRecent = get().recentSongs.map((item) =>
      item.id === id ? { ...item, title } : item
    );
    set((state) => ({
      recentSongs: newRecent,
      currentSong: state.currentSong && state.currentSong.audioUrl === get().recentSongs.find((i) => i.id === id)?.audioUrl
        ? { ...state.currentSong, title }
        : state.currentSong,
    }));
  },
}));
