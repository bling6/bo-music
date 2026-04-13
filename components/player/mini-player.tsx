"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, ChevronUp } from "lucide-react";
import { useMusicStore } from "@/stores/music-store";
import { DownloadButton } from "./download-button";
import { useI18n } from "@/lib/i18n";

export function MiniPlayer() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const generationStatus = useMusicStore((s) => s.generationStatus);
  const showFullPlayer = useMusicStore((s) => s.showFullPlayer);
  const setShowFullPlayer = useMusicStore((s) => s.setShowFullPlayer);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  // When non-null, user is dragging and progress is driven by this ratio
  // instead of audio.currentTime. This prevents timeupdate from fighting
  // the user's mouse position.
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  // Refs used inside event handlers so they don't need to be effect dependencies
  const dragRatioRef = useRef<number | null>(null);
  // When true, a programmatic seek is in progress and timeupdate should be
  // suppressed until the browser fires "seeked".
  const seekingRef = useRef(false);
  // The target time we're seeking to — used to set state once seek completes
  const seekTargetRef = useRef<number | null>(null);

  const hasSong = currentSong && generationStatus === "success";

  // Keep ref in sync with state
  useEffect(() => {
    dragRatioRef.current = dragRatio;
  }, [dragRatio]);

  // Bind audio event listeners (stable — no dependency on dragRatio)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      // Suppress updates while dragging or while a seek is in flight
      if (dragRatioRef.current !== null || seekingRef.current) return;
      setCurrentTime(audio.currentTime);
    };
    const onDurationChange = () => {
      const d = audio.duration;
      if (d && isFinite(d)) {
        setDuration(d);
      }
    };
    const onSeeked = () => {
      // A programmatic seek completed — apply the target time and resume updates
      if (seekingRef.current) {
        seekingRef.current = false;
        if (seekTargetRef.current !== null) {
          setCurrentTime(seekTargetRef.current);
          seekTargetRef.current = null;
        }
        // Now safe to clear drag state
        setDragRatio(null);
      }
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedMetadata = () => {
      const d = audio.duration;
      if (d && isFinite(d)) {
        setDuration(d);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Set audio src programmatically — convert data URLs to blob URLs
  // because data URLs don't support proper seeking in most browsers.
  // When audio.currentTime is set on a data URL source, the browser
  // reloads the entire audio from the beginning, resetting playback.
  const blobUrlRef = useRef<string | undefined>(undefined);
  const prevAudioUrl = useRef<string | undefined>(undefined);
  useEffect(() => {
    const url = currentSong?.audioUrl;
    const audio = audioRef.current;
    if (url && url !== prevAudioUrl.current && audio) {
      prevAudioUrl.current = url;

      // Revoke previous blob URL if any
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = undefined;
      }

      const setSrc = (src: string) => {
        // Reset seek state for new track
        seekingRef.current = false;
        seekTargetRef.current = null;
        audio.src = src;
        setCurrentTime(0);
        setDuration(0);
        audio.play().catch(() => {});
      };

      if (url.startsWith("data:")) {
        // Convert data URL to blob URL for proper seek support
        try {
          const [header, base64] = url.split(",");
          const mimeMatch = header.match(/data:([^;]+)/);
          const mime = mimeMatch ? mimeMatch[1] : "audio/mpeg";
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setSrc(blobUrl);
        } catch {
          // Fallback to data URL if conversion fails
          setSrc(url);
        }
      } else {
        setSrc(url);
      }
    }
  }, [currentSong?.audioUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  // During drag: only update the visual position, do NOT touch audio.currentTime
  const onDrag = useCallback((ratio: number) => {
    setDragRatio(ratio);
  }, []);

  // When drag/click ends: commit the seek to the audio element.
  // If the audio hasn't loaded enough data (readyState < HAVE_CURRENT_DATA),
  // wait for "canplay" before seeking, otherwise the browser may reset to 0.
  const onDragEnd = useCallback((ratio: number) => {
    const audio = audioRef.current;
    const d = audio?.duration;
    if (audio && d && isFinite(d)) {
      const clamped = Math.max(0, Math.min(1, ratio));
      const newTime = clamped * d;
      seekingRef.current = true;
      seekTargetRef.current = newTime;

      const doSeek = () => {
        audio.currentTime = newTime;
      };

      // readyState: 0=NOTHING, 1=METADATA, 2=CURRENT_DATA, 3=FUTURE_DATA, 4=ENOUGH_DATA
      if (audio.readyState >= 2) {
        doSeek();
      } else {
        // Wait for enough data to be loaded before seeking
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          doSeek();
        };
        audio.addEventListener("canplay", onCanPlay);
        // Safety: clear after 3s if canplay never fires
        setTimeout(() => {
          audio.removeEventListener("canplay", onCanPlay);
          if (seekingRef.current && seekTargetRef.current === newTime) {
            seekingRef.current = false;
            seekTargetRef.current = null;
            setDragRatio(null);
          }
        }, 3000);
      }
      // Safety: if seeked never fires after seek, clear after 2s
      setTimeout(() => {
        if (seekingRef.current && seekTargetRef.current === newTime) {
          seekingRef.current = false;
          seekTargetRef.current = null;
          setDragRatio(null);
        }
      }, 2000);
    } else {
      // No valid duration — just clear drag state
      setDragRatio(null);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  }, [isMuted, volume, prevVolume]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      setIsMuted(v === 0);
    },
    [],
  );

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // During drag, progress is driven by user's mouse ratio; otherwise by audio time
  const progress =
    duration > 0
      ? (dragRatio !== null ? dragRatio : currentTime / duration) * 100
      : 0;

  const displayTime =
    dragRatio !== null && duration > 0 ? dragRatio * duration : currentTime;

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      {/* Mini player bar — hidden when no song */}
      {hasSong && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800">
          {/* Progress bar (thin, at top of player) */}
          <ProgressBar
            progress={progress}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
          />

          <div className="flex items-center h-16 px-4 gap-4">
            {/* Cover + Title */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer bg-transparent border-none p-0"
            >
              <div className="w-10 h-10 rounded-lg cover-gradient flex-shrink-0 overflow-hidden">
                {currentSong.coverImageUrl ? (
                  <img
                    src={currentSong.coverImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2Icon />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {currentSong.title}
                </div>
                {currentSong.styleTags && (
                  <div className="text-xs text-zinc-500 truncate">
                    {currentSong.styleTags}
                  </div>
                )}
              </div>
            </button>

            {/* Playback controls */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            {/* Time */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500">
              <span>{formatTime(displayTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 accent-white cursor-pointer"
              />
            </div>

            {/* Expand button */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="text-zinc-400 hover:text-white transition-colors p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full player overlay */}
      {showFullPlayer && hasSong && (
        <FullPlayer
          isPlaying={isPlaying}
          currentTime={displayTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          progress={progress}
          onTogglePlay={togglePlay}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onToggleMute={toggleMute}
          onVolumeChange={handleVolumeChange}
          onClose={() => setShowFullPlayer(false)}
        />
      )}
    </>
  );
}

/* ── Progress bar (mini player) ────────────────────────────── */

function ProgressBar({
  progress,
  onDrag,
  onDragEnd,
}: {
  progress: number;
  onDrag: (ratio: number) => void;
  onDragEnd: (ratio: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const lastRatio = useRef(0);

  const getRatio = (clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const ratio = getRatio(e.clientX);
    lastRatio.current = ratio;
    onDrag(ratio);

    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const r = getRatio(ev.clientX);
      lastRatio.current = r;
      onDrag(r);
    };

    const handleMouseUp = () => {
      onDragEnd(lastRatio.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const ratio = getRatio(e.touches[0].clientX);
    lastRatio.current = ratio;
    onDrag(ratio);

    const handleTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const r = getRatio(ev.touches[0].clientX);
      lastRatio.current = r;
      onDrag(r);
    };

    const handleTouchEnd = () => {
      onDragEnd(lastRatio.current);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div
      ref={barRef}
      className="h-1.5 bg-zinc-800 cursor-pointer group relative"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="h-full bg-white/80 group-hover:bg-white transition-colors relative"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

/* ── Full player overlay ───────────────────────────────────── */

function FullPlayer({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  progress,
  onTogglePlay,
  onDrag,
  onDragEnd,
  onToggleMute,
  onVolumeChange,
  onClose,
}: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  progress: number;
  onTogglePlay: () => void;
  onDrag: (ratio: number) => void;
  onDragEnd: (ratio: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}) {
  const currentSong = useMusicStore((s) => s.currentSong);
  const { t } = useI18n();

  if (!currentSong) return null;

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const lyricsWithoutTags = currentSong.lyrics
    ? currentSong.lyrics
        .split("\n")
        .filter((line) => !line.trim().match(/^\[.+\]$/))
        .join("\n")
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/98 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors p-2"
        >
          <ChevronUp className="w-5 h-5 rotate-180" />
        </button>
        <span className="text-sm font-medium text-zinc-400">
          {t("player.playing")}
        </span>
        <div className="w-9" />
      </div>

      {/* Cover image */}
      <div className="flex-1 flex flex-col items-center  px-8 overflow-auto">
        <div className="flex justify-center w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden mb-8 flex-shrink-0">
          {currentSong.coverImageUrl ? (
            <img
              src={currentSong.coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full cover-gradient flex items-center justify-center">
              <Music2Icon />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center">
          {currentSong.title}
        </h2>
        {currentSong.styleTags && (
          <p className="text-sm text-zinc-500 mb-6 text-center">
            {currentSong.styleTags}
          </p>
        )}

        {/* Progress bar */}
        <FullProgressBar
          progress={progress}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />

        <div className="flex justify-between text-xs text-zinc-500 mt-1.5 w-full max-w-md">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mb-6 mt-4">
          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-300 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          <DownloadButton />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onToggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={onVolumeChange}
            className="w-32 h-1 accent-white cursor-pointer"
          />
        </div>

        {/* Lyrics */}
        {lyricsWithoutTags && (
          <div className="w-full max-w-lg text-center mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-3">
              {t("player.lyrics")}
            </div>
            <div className=" text-sm leading-7 text-zinc-400">
              {lyricsWithoutTags.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Progress bar (full player) ────────────────────────────── */

function FullProgressBar({
  progress,
  onDrag,
  onDragEnd,
}: {
  progress: number;
  onDrag: (ratio: number) => void;
  onDragEnd: (ratio: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const lastRatio = useRef(0);

  const getRatio = (clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const ratio = getRatio(e.clientX);
    lastRatio.current = ratio;
    onDrag(ratio);

    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const r = getRatio(ev.clientX);
      lastRatio.current = r;
      onDrag(r);
    };

    const handleMouseUp = () => {
      onDragEnd(lastRatio.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const ratio = getRatio(e.touches[0].clientX);
    lastRatio.current = ratio;
    onDrag(ratio);

    const handleTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const r = getRatio(ev.touches[0].clientX);
      lastRatio.current = r;
      onDrag(r);
    };

    const handleTouchEnd = () => {
      onDragEnd(lastRatio.current);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div className="w-full max-w-md mb-2">
      <div
        ref={barRef}
        className="h-1.5 bg-zinc-800 rounded-full cursor-pointer group relative"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="h-full bg-white rounded-full relative group-hover:bg-white transition-colors"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

function Music2Icon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-6 h-6 text-white/40"
    >
      <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
    </svg>
  );
}
