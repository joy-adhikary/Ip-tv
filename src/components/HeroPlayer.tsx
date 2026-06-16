'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/types/channel';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  Loader2,
  ExternalLink,
  Signal,
} from 'lucide-react';
import { clsx } from 'clsx';

interface HeroPlayerProps {
  channel: Channel;
}

type PlayerState = 'loading' | 'playing' | 'paused' | 'error';

function FlagEmoji({ country }: { country: string }) {
  const flags: Record<string, string> = { bd: '🇧🇩', in: '🇮🇳', ar: '🇦🇷' };
  return <span>{flags[country] || '🌐'}</span>;
}

export default function HeroPlayer({ channel }: HeroPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (playerState === 'playing') {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playerState]);

  // Load and play stream — routes through /api/proxy to bypass CORS & geo-restrictions
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    setPlayerState('loading');
    setShowControls(true);

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Always route through our server-side proxy
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(channel.url)}`;

    const loadStream = async () => {
      const { default: Hls } = await import('hls.js');

      // Safari: native HLS — use proxy URL directly
      if (video.canPlayType('application/vnd.apple.mpegurl') && !Hls.isSupported()) {
        video.src = proxyUrl;
        video
          .play()
          .then(() => setPlayerState('playing'))
          .catch(() => setPlayerState('error'));
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          // Increase timeout tolerance for proxied streams
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 3,
          levelLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
        });

        hlsRef.current = hls;

        hls.loadSource(proxyUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video
            .play()
            .then(() => setPlayerState('playing'))
            .catch(() => setPlayerState('error'));
        });

        hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean; type: string }) => {
          if (data.fatal) {
            setPlayerState('error');
          }
        });
      } else {
        // Fallback: try as a direct video src (MP4 / non-HLS)
        video.src = proxyUrl;
        video
          .play()
          .then(() => setPlayerState('playing'))
          .catch(() => setPlayerState('error'));
      }
    };

    loadStream();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = '';
    };
  }, [channel]);

  // Volume control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (playerState === 'playing') {
      videoRef.current.pause();
      setPlayerState('paused');
    } else {
      videoRef.current
        .play()
        .then(() => setPlayerState('playing'))
        .catch(() => setPlayerState('error'));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.06] mb-6 animate-fade-slide-in">
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black group"
        onMouseMove={resetControlsTimer}
        onMouseEnter={resetControlsTimer}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
          autoPlay
        />

        {/* Loading Overlay */}
        {playerState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="text-indigo-400 animate-spin" />
              <p className="text-slate-300 text-sm font-medium">Connecting to stream...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {playerState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle size={28} className="text-rose-400" />
              </div>
              <div>
                <p className="text-slate-200 font-semibold mb-1">Stream Unavailable</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  This stream may be geo-restricted, offline, or require a different codec. Try another channel.
                </p>
              </div>
              {channel.url && (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={11} />
                  Open stream URL directly
                </a>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          className={clsx(
            'absolute inset-x-0 bottom-0 transition-all duration-300',
            showControls || playerState !== 'playing'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
          )}
        >
          <div className="player-gradient-overlay px-4 pb-4 pt-12">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                {playerState === 'playing' ? (
                  <Pause size={16} fill="white" />
                ) : (
                  <Play size={16} fill="white" className="ml-0.5" />
                )}
              </button>

              {/* Volume */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  setIsMuted(v === 0);
                }}
                className="w-20 h-1 rounded-full accent-indigo-500"
              />

              <div className="flex-1" />

              {/* Live indicator */}
              {playerState === 'playing' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/80 backdrop-blur-sm border border-rose-400/30">
                  <Signal size={10} className="text-white animate-live-blink" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <Maximize size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Top-left channel info overlay */}
        {(showControls || playerState !== 'playing') && (
          <div className="absolute top-4 left-4 flex items-center gap-3 animate-fade-slide-in">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1 border border-white/10"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm leading-tight drop-shadow">
                  {channel.name}
                </h3>
                <FlagEmoji country={channel.country} />
              </div>
              <p className="text-slate-400 text-[10px]">{channel.group}</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="px-5 py-4 border-t border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold text-slate-100 truncate">{channel.name}</h2>
              <FlagEmoji country={channel.country} />
              {playerState === 'playing' && (
                <span className="live-badge text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-blink" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{channel.group}</p>
          </div>
          <button
            onClick={togglePlayPause}
            className="btn-watch shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold ml-4"
          >
            {playerState === 'playing' ? (
              <>
                <Pause size={14} />
                Pause
              </>
            ) : (
              <>
                <Play size={14} fill="white" />
                Watch Live
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
