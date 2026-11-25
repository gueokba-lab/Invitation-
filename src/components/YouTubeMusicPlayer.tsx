import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, X } from 'lucide-react';
import { YOUTUBE_VIDEO_ID } from '../constants/invitation';

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayerInstance;
  data: number;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: number | string;
      height?: number | string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
        onError?: () => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState?: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window unavailable'));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API failed to initialize'));
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load YouTube API'));
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

export const YouTubeMusicPlayer: React.FC = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const pendingPlayRef = useRef<boolean>(false);
  const blockCheckTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showMobileFallback, setShowMobileFallback] = useState(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let active = true;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (!active || !hostRef.current) return;

        playerRef.current = new YT.Player(hostRef.current, {
          videoId: YOUTUBE_VIDEO_ID,
          width: '240',
          height: '135',
          playerVars: {
            autoplay: 0,
            controls: 1,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (!active) return;
              setIsReady(true);
              // Only play if the guest already clicked the music toggle button
              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                try {
                  event.target.unMute();
                  event.target.setVolume(70);
                  event.target.playVideo();
                } catch {
                  setShowMobileFallback(true);
                }
              }
            },
            onStateChange: (event) => {
              if (!active) return;
              const state = event.data;
              // YT.PlayerState: 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING
              if (state === 1) {
                if (blockCheckTimerRef.current !== null) {
                  window.clearTimeout(blockCheckTimerRef.current);
                  blockCheckTimerRef.current = null;
                }
                setIsPlaying(true);
                setIsBuffering(false);
                setShowMobileFallback(false);
              } else if (state === 3) {
                setIsBuffering(true);
              } else if (state === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (state === 0) {
                // Seamless loop fallback
                try {
                  event.target.playVideo();
                } catch {
                  setIsPlaying(false);
                }
              }
            },
            onError: () => {
              if (!active) return;
              setIsPlaying(false);
              setIsBuffering(false);
              setShowMobileFallback(true);
            },
          },
        });
      })
      .catch(() => {
        if (active) setIsReady(false);
      });

    return () => {
      active = false;
      if (blockCheckTimerRef.current !== null) {
        window.clearTimeout(blockCheckTimerRef.current);
      }
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore teardown errors
      }
      playerRef.current = null;
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current;

    if (isPlayingRef.current) {
      pendingPlayRef.current = false;
      if (blockCheckTimerRef.current !== null) {
        window.clearTimeout(blockCheckTimerRef.current);
        blockCheckTimerRef.current = null;
      }
      try {
        player?.pauseVideo();
      } catch {
        // Ignore
      }
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    // Start playback strictly on explicit guest click
    if (!player || !isReady) {
      pendingPlayRef.current = true;
      setIsBuffering(true);
      return;
    }

    try {
      player.unMute();
      player.setVolume(70);
      player.playVideo();
      setIsBuffering(true);

      // Mobile Safari fallback: if cross-origin playVideo doesn't start within 1.4s, reveal compact tap-to-play card
      if (blockCheckTimerRef.current !== null) {
        window.clearTimeout(blockCheckTimerRef.current);
      }
      blockCheckTimerRef.current = window.setTimeout(() => {
        if (!isPlayingRef.current) {
          setIsBuffering(false);
          setShowMobileFallback(true);
        }
      }, 1400);
    } catch {
      setIsBuffering(false);
      setShowMobileFallback(true);
    }
  }, [isReady]);

  return (
    <div className="relative flex items-center">
      {/* Beautiful Music Toggle Button with Play / Pause States */}
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-pressed={isPlaying}
        aria-label={
          isPlaying
            ? 'Mettre la musique en pause'
            : "Lire la musique d'ambiance"
        }
        title={isPlaying ? 'Pause' : 'Écouter la musique'}
        className={`inline-flex items-center justify-center gap-2 min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CE8E] cursor-pointer ${
          isPlaying
            ? 'border-[#E8CE8E]/75 bg-[#1B315E] text-[#FAF4E7] shadow-[0_0_16px_rgba(212,172,93,0.28)]'
            : 'border-[#C89D4C]/35 bg-[#142344]/85 hover:bg-[#1E2F54] text-[#F2DFB4]'
        }`}
      >
        <span className="inline-flex items-center justify-center w-4 h-4 shrink-0">
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-[#E8CE8E]" aria-hidden="true" />
          ) : (
            <Play
              className="w-3.5 h-3.5 text-[#E8CE8E] fill-[#E8CE8E]/30 translate-x-[0.5px]"
              aria-hidden="true"
            />
          )}
        </span>

        {/* Subtle animated gold equalizer bars when active */}
        {isPlaying ? (
          <span
            aria-hidden="true"
            className="inline-flex items-end gap-[2px] h-3"
          >
            <span className="w-[2px] h-2 bg-[#E8CE8E] rounded-full animate-pulse" />
            <span className="w-[2px] h-3 bg-[#F2DFB4] rounded-full animate-bounce" />
            <span className="w-[2px] h-1.5 bg-[#E8CE8E] rounded-full animate-pulse" />
          </span>
        ) : (
          <Music
            className={`w-3.5 h-3.5 text-[#C89D4C] ${
              isBuffering ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
        )}

        <span className="hidden sm:inline text-[11px] tracking-[0.04em] whitespace-nowrap">
          {isPlaying ? 'En lecture' : 'Musique'}
        </span>
      </button>

      {/* Persistent non-zero YouTube IFrame container: kept off-visual unless mobile requires direct iframe tap */}
      <div
        className={
          showMobileFallback
            ? 'fixed top-[58px] left-3 z-50 w-[256px] rounded-xl bg-[#101F3F] border border-[#D4AC5D]/70 shadow-[0_18px_48px_rgba(3,6,16,0.75)] p-2.5'
            : 'fixed bottom-0 right-0 w-[240px] h-[135px] opacity-0 pointer-events-none -z-10 overflow-hidden'
        }
        aria-hidden={!showMobileFallback}
      >
        {showMobileFallback && (
          <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
            <span className="font-luxury-serif text-[13px] text-[#F2DFB4]">
              Appuyez sur lecture pour le son
            </span>
            <button
              type="button"
              onClick={() => setShowMobileFallback(false)}
              aria-label="Réduire le lecteur"
              className="inline-flex items-center justify-center w-6 h-6 rounded text-[#CFC3B0] hover:bg-[#1D315C] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div
          className={
            showMobileFallback
              ? 'w-full aspect-video rounded-lg overflow-hidden bg-black'
              : 'w-[240px] h-[135px]'
          }
        >
          <div ref={hostRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
