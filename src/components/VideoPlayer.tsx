import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  PictureInPicture2, 
  Camera, 
  Activity, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Radio, 
  Tv, 
  Sliders, 
  Layers, 
  Check, 
  Info,
  Sparkles,
  Maximize,
  RotateCw,
  FastForward,
  Rewind,
  Film,
  Music,
  Users,
  SkipForward,
  List,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { Channel, EPGProgram, AspectRatio, StreamStats, VODItem, Episode, StreamType } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  activeVOD?: VODItem | null;
  activeEpisode?: Episode | null;
  currentProgram?: EPGProgram;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  onSelectChannel: (channel: Channel) => void;
  onSelectEpisode?: (vod: VODItem, episode: Episode) => void;
  allChannels: Channel[];
  onOpenInfoModal?: () => void;
  isAdultUnlocked?: boolean;
  onRequirePin?: (action?: () => void) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  activeVOD,
  activeEpisode,
  currentProgram,
  onNextChannel,
  onPrevChannel,
  onSelectChannel,
  onSelectEpisode,
  allChannels,
  onOpenInfoModal,
  isAdultUnlocked = false,
  onRequirePin,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showStatsHud, setShowStatsHud] = useState(false);
  const [showXRay, setShowXRay] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState(false);
  const [channelDialBuffer, setChannelDialBuffer] = useState<string>('');
  const channelDialTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // VOD Seek & Time tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Determine active media properties
  const isVODMode = !!activeVOD;
  const isChannelAdultLocked = !isVODMode && (channel?.isAdult || channel?.group === 'Adult (+18)') && !isAdultUnlocked;
  const currentStreamUrl = activeEpisode?.videoUrl || activeVOD?.streamUrl || channel?.url || '';
  const currentTitle = activeEpisode ? `${activeVOD?.title}: ${activeEpisode.title}` : activeVOD?.title || channel?.name || '';
  const streamType: StreamType = activeEpisode?.streamType || activeVOD?.streamType || channel?.streamType || 'hls';

  // Stream Diagnostic Metrics
  const [stats, setStats] = useState<StreamStats>({
    bitrate: 0,
    fps: 0,
    bufferLength: 0,
    droppedFrames: 0,
    resolution: 'Auto',
    audioCodec: 'aac',
    videoCodec: 'h264',
    latency: 120,
    qualityLevel: 'Auto',
  });

  // Calculate Show Progress
  const [programProgress, setProgramProgress] = useState(0);
  const [programRemainingMins, setProgramRemainingMins] = useState(0);

  useEffect(() => {
    if (!currentProgram || isVODMode) return;
    const updateProgress = () => {
      const start = new Date(currentProgram.startTime).getTime();
      const end = new Date(currentProgram.endTime).getTime();
      const now = Date.now();
      const total = end - start;
      const elapsed = Math.max(0, now - start);
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      const rem = Math.max(0, Math.round((end - now) / 60000));
      setProgramProgress(pct);
      setProgramRemainingMins(rem);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 10000);
    return () => clearInterval(interval);
  }, [currentProgram, isVODMode]);

  // Handle Controls Fadeout on Inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showXRay && !showEpisodeDrawer) {
        setShowControls(false);
        setShowQualityMenu(false);
        setShowAudioMenu(false);
        setShowAspectMenu(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  };

  // Video Load & HLS/TS/MP4 Engine
  const loadStream = useCallback((rawUrl: string, type: StreamType) => {
    const video = videoRef.current;
    if (!video || !rawUrl) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsOrTs = type === 'hls' || type === 'ts' || rawUrl.includes('.m3u8') || rawUrl.includes('.ts');

    if (isHlsOrTs && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });

      hlsRef.current = hls;
      hls.loadSource(rawUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        setErrorMsg(null);
        
        // Parse quality levels
        const levels = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height || 720,
          bitrate: Math.round(lvl.bitrate / 1000),
          label: lvl.height ? `${lvl.height}p (${Math.round(lvl.bitrate / 1000)}k)` : `Stream ${index + 1}`,
        }));
        setQualityLevels(levels);

        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        const tracks = data.audioTracks.map((tr, index) => ({
          id: index,
          name: tr.name || `Track ${index + 1}`,
          lang: tr.lang || 'und',
        }));
        setAudioTracks(tracks);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const levelObj = hls.levels[data.level];
        if (levelObj) {
          setStats(prev => ({
            ...prev,
            resolution: `${levelObj.width}x${levelObj.height}`,
            bitrate: Math.round(levelObj.bitrate / 1000),
            qualityLevel: `${levelObj.height}p`,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Fatal network error in HLS, trying proxy/recovery...');
              // Fallback to proxy stream
              if (!rawUrl.startsWith('/api/proxy-stream')) {
                const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(rawUrl)}`;
                hls.loadSource(proxyUrl);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Fatal media error in HLS, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable HLS error:', data);
              setErrorMsg('Stream temporarily offline or CORS-restricted. Retrying with backup...');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsOrTs) {
      // Native Apple Safari HLS
      video.src = rawUrl;
      video.load();
      video.play().catch(() => setIsPlaying(false));
      setIsLoading(false);
    } else {
      // Direct MP4 / WebM / Video file
      video.src = rawUrl;
      video.load();
      video.play().catch(() => setIsPlaying(false));
      setIsLoading(false);
    }
  }, []);

  // Channel or VOD switch effect
  useEffect(() => {
    if (isChannelAdultLocked) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      setIsLoading(false);
      return;
    }

    if (!currentStreamUrl) return;
    loadStream(currentStreamUrl, streamType);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStreamUrl, streamType, loadStream, isChannelAdultLocked]);

  // Video Time Update & Seeking
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    setCurrentTime(video.currentTime);
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
  };

  const skipSeconds = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const skipIntro = () => {
    const video = videoRef.current;
    if (!video || !activeEpisode?.introEnd) return;
    video.currentTime = activeEpisode.introEnd;
  };

  // Next Episode Trigger
  const handleNextEpisode = () => {
    if (!activeVOD?.episodes || !activeEpisode || !onSelectEpisode) return;
    const currentIndex = activeVOD.episodes.findIndex(e => e.id === activeEpisode.id);
    if (currentIndex >= 0 && currentIndex < activeVOD.episodes.length - 1) {
      const nextEp = activeVOD.episodes[currentIndex + 1];
      onSelectEpisode(activeVOD, nextEp);
    }
  };

  // Periodic Diagnostics Gathering
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      const buffered = video.buffered;
      let bufLength = 0;
      if (buffered.length > 0) {
        bufLength = Math.max(0, buffered.end(buffered.length - 1) - video.currentTime);
      }

      // @ts-ignore
      const videoPlaybackQuality = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality() : null;
      const dropped = videoPlaybackQuality ? videoPlaybackQuality.droppedVideoFrames : 0;

      setStats(prev => ({
        ...prev,
        bufferLength: Number(bufLength.toFixed(1)),
        droppedFrames: dropped,
        resolution: video.videoWidth ? `${video.videoWidth}x${video.videoHeight}` : prev.resolution,
        fps: 60,
      }));
    }, 1500);

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, []);

  // Controls Handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isMuted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const handlePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  // Quality Switcher
  const handleSelectQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  // Audio Track Switcher
  const handleSelectAudio = (trackIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = trackIndex;
    setCurrentAudioTrack(trackIndex);
    setShowAudioMenu(false);
  };

  // Snapshot capture
  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `iptv-snapshot-${currentTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        a.click();

        setSnapshotFeedback(true);
        setTimeout(() => setSnapshotFeedback(false), 2000);
      }
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
    }
  };

  // Format time (MM:SS or HH:MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check if Skip Intro should show
  const showSkipIntro = activeEpisode?.introStart !== undefined && 
                        activeEpisode?.introEnd !== undefined && 
                        currentTime >= activeEpisode.introStart && 
                        currentTime <= activeEpisode.introEnd;

  // Aspect ratio styling
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video object-contain';
      case '4:3': return 'aspect-4/3 object-contain';
      case 'fill': return 'w-full h-full object-cover';
      case 'stretch': return 'w-full h-full object-fill';
      case 'fit': return 'w-full h-full object-contain';
      default: return 'w-full h-full object-contain';
    }
  };

  if (!channel && !activeVOD) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-slate-200 mb-1">No Stream or Video Selected</h2>
        <p className="text-xs text-slate-400 max-w-sm">Select a live IPTV channel, Netflix series, Prime Video hit, or custom .m3u8/.ts/.mp4 video to start playback.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="iptv-player-container"
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      className="relative flex-1 bg-black overflow-hidden flex items-center justify-center group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        id="main-video-player"
        playsInline
        className={`max-h-full max-w-full transition-all duration-200 ${getAspectRatioClass()}`}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
            setIsLoading(false);
          }
        }}
      />

      {/* Snapshot Feedback */}
      {snapshotFeedback && (
        <div className="absolute inset-0 bg-white/25 pointer-events-none animate-ping z-40" />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-12 h-12 rounded-full border-3 border-sky-500/20 border-t-sky-400 animate-spin" />
          <div className="text-xs font-medium text-slate-300 flex items-center gap-2">
            <span>Buffering {streamType.toUpperCase()} Stream...</span>
          </div>
        </div>
      )}

      {/* Skip Intro Floating Button (Netflix / Prime feature) */}
      {showSkipIntro && (
        <div className="absolute bottom-24 right-8 z-30 animate-in fade-in slide-in-from-bottom-3">
          <button
            id="skip-intro-btn"
            onClick={skipIntro}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/80 hover:bg-white text-white hover:text-black font-bold text-xs uppercase tracking-wider border border-white/50 backdrop-blur-md transition-all shadow-2xl hover:scale-105 cursor-pointer"
          >
            <FastForward className="w-4 h-4" />
            <span>Skip Intro</span>
          </button>
        </div>
      )}

      {/* Parental Adult Lock Overlay */}
      {isChannelAdultLocked && (
        <div 
          id="video-adult-lock-screen"
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-35 animate-in fade-in"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-950/50">
            <Lock className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white shadow">
              +18 YETİŞKİN KANALI
            </span>
            <span className="text-xs font-mono text-slate-400">
              CH {channel?.number}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Bu Yayın Ebeveyn Kilidi ile Şifrelenmiştir
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {channel?.name} kanalını izlemek için 4 haneli PIN kodunuzu girmeniz gerekmektedir. Varsayılan PIN: <span className="font-mono text-slate-200 font-bold bg-slate-800 px-1.5 py-0.5 rounded">0000</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="unlock-adult-player-btn"
              onClick={() => onRequirePin && onRequirePin()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-105"
            >
              <Unlock className="w-4 h-4" />
              <span>PIN Kodu ile Kilidi Aç</span>
            </button>
            <button
              id="adult-prev-channel-btn"
              onClick={onPrevChannel}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Önceki Kanal
            </button>
            <button
              id="adult-next-channel-btn"
              onClick={onNextChannel}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Sonraki Kanal
            </button>
          </div>
        </div>
      )}

      {/* Error / Recovery Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-slate-100 mb-1">Stream Signal Offline or Restricted</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">{errorMsg}</p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadStream(currentStreamUrl, streamType)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Top OSD Banner */}
      <div 
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent transition-opacity duration-300 z-20 flex items-start justify-between ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          {activeVOD ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 p-0.5 shadow-lg shrink-0">
              <img
                src={activeVOD.posterUrl}
                alt={activeVOD.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ) : (
            <img
              src={channel?.logo}
              alt={channel?.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel?.name || 'TV')}&background=0284c7&color=fff&size=64`;
              }}
              className="w-12 h-12 rounded-xl object-contain bg-slate-900/90 border border-slate-700/60 p-1 shadow-lg"
            />
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeVOD ? (
                <>
                  <span className={`font-serif font-black text-xs px-2 py-0.5 rounded text-white ${
                    activeVOD.provider === 'netflix' ? 'bg-red-600' : activeVOD.provider === 'prime' ? 'bg-sky-600' : 'bg-indigo-600'
                  }`}>
                    {activeVOD.provider.toUpperCase()}
                  </span>
                  <h1 className="text-base font-bold text-white drop-shadow-md">{currentTitle}</h1>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700">
                    {streamType.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeVOD.videoQuality}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    CH {channel?.number}
                  </span>
                  <h1 className="text-base font-bold text-white drop-shadow-md">{channel?.name}</h1>
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 text-white tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                    {channel?.resolution || '1080p'}
                  </span>
                </>
              )}
            </div>

            {/* Now Playing / Episode Synopsis */}
            {activeEpisode ? (
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {activeEpisode.description}
              </p>
            ) : currentProgram ? (
              <div className="mt-1 flex items-center gap-3">
                <div className="text-xs text-slate-200 font-medium">
                  <span className="text-sky-400 font-semibold">Now: </span>
                  {currentProgram.title}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-1000"
                      style={{ width: `${programProgress}%` }}
                    />
                  </div>
                  <span>{programRemainingMins}m left</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Prime Video X-Ray Button */}
          {activeVOD && (
            <button
              id="toggle-xray-btn"
              onClick={() => setShowXRay(!showXRay)}
              title="Toggle Prime X-Ray (Trivia & Cast)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
                showXRay
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/80 text-sky-400 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">X-Ray</span>
            </button>
          )}

          {/* Episodes Drawer for Series */}
          {activeVOD?.episodes && activeVOD.episodes.length > 0 && (
            <button
              id="toggle-episodes-drawer-btn"
              onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
              title="Episode Selector"
              className={`p-2 rounded-xl text-xs transition-colors backdrop-blur-md border ${
                showEpisodeDrawer
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          )}

          {/* Stream Diagnostics HUD button */}
          <button
            id="toggle-stream-stats-btn"
            onClick={() => setShowStatsHud(!showStatsHud)}
            title="Stream Diagnostics HUD (D)"
            className={`p-2 rounded-xl text-xs transition-colors backdrop-blur-md border ${
              showStatsHud
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Screenshot button */}
          <button
            id="capture-snapshot-btn"
            onClick={handleCaptureSnapshot}
            title="Capture Broadcast Screenshot"
            className="p-2 rounded-xl text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prime Video X-Ray Scene Panel Overlay */}
      {showXRay && activeVOD && (
        <div 
          id="prime-xray-panel"
          className="absolute top-20 left-6 z-30 w-80 bg-slate-950/95 border border-sky-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md font-sans text-xs text-slate-200 space-y-3 animate-in fade-in slide-in-from-left-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-sky-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>X-RAY • LIVE SCENE INFO</span>
            </span>
            <button onClick={() => setShowXRay(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>

          {/* Cast in scene */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-400" />
              Cast in Scene
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {activeVOD.cast.map(c => (
                <div key={c.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate text-[11px]">{c.name}</div>
                    <div className="text-[10px] text-sky-400 truncate">{c.character}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Music Track or Trivia */}
          {activeVOD.xrayData?.[0]?.musicTrack && (
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Music className="w-3 h-3 text-emerald-400" />
                Featured Music
              </span>
              <p className="text-[11px] text-slate-300 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                {activeVOD.xrayData[0].musicTrack}
              </p>
            </div>
          )}

          {activeVOD.xrayData?.[0]?.trivia && (
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                Behind the Scenes Trivia
              </span>
              <p className="text-[11px] text-slate-300 bg-slate-900/70 p-2 rounded-lg border border-slate-800 leading-relaxed">
                {activeVOD.xrayData[0].trivia}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Episode Selector Drawer Overlay */}
      {showEpisodeDrawer && activeVOD?.episodes && (
        <div 
          id="episode-selector-drawer"
          className="absolute top-20 right-6 z-30 w-80 max-h-[70vh] bg-slate-950/95 border border-red-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-3 flex flex-col animate-in fade-in slide-in-from-right-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-white font-bold">
            <span className="flex items-center gap-1.5">
              <List className="w-4 h-4 text-red-500" />
              <span>Episodes • Season 1</span>
            </span>
            <button onClick={() => setShowEpisodeDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {activeVOD.episodes.map(ep => (
              <div
                key={ep.id}
                onClick={() => {
                  if (onSelectEpisode) onSelectEpisode(activeVOD, ep);
                  setShowEpisodeDrawer(false);
                }}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                  activeEpisode?.id === ep.id
                    ? 'bg-red-950/60 border-red-600/60 text-white'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="relative w-16 h-10 rounded-md overflow-hidden shrink-0 bg-black">
                  <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[11px] truncate">{ep.episodeNumber}. {ep.title}</div>
                  <div className="text-[10px] text-slate-400">{ep.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stream Diagnostics HUD */}
      {showStatsHud && (
        <div 
          id="stream-diagnostics-hud"
          className="absolute top-20 right-4 z-30 w-72 bg-slate-950/90 border border-sky-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md font-mono text-[11px] text-slate-300 space-y-2 animate-in fade-in slide-in-from-right-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-sky-400 font-bold tracking-wider">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              TELEMETRY & CODEC
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500">Format:</span>
              <div className="font-bold text-white text-xs">{streamType.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-slate-500">Resolution:</span>
              <div className="font-bold text-white text-xs">{stats.resolution}</div>
            </div>
            <div>
              <span className="text-slate-500">Buffer Health:</span>
              <div className="font-bold text-emerald-400 text-xs">{stats.bufferLength}s</div>
            </div>
            <div>
              <span className="text-slate-500">Dropped Frames:</span>
              <div className={`font-bold text-xs ${stats.droppedFrames > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {stats.droppedFrames}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Channel Surfing Arrows */}
      {!isVODMode && (
        <>
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <button
              id="prev-channel-zap-btn"
              onClick={onPrevChannel}
              title="Previous Channel"
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-800/80 backdrop-blur-md transition-all shadow-xl hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <button
              id="next-channel-zap-btn"
              onClick={onNextChannel}
              title="Next Channel"
              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-800/80 backdrop-blur-md transition-all shadow-xl hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Bottom Main Controls Bar */}
      <div 
        id="player-bottom-controls"
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-2 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Interactive Scrub Bar for VOD / Direct Video */}
        {duration > 0 && (
          <div className="flex items-center gap-3 px-1">
            <span className="font-mono text-[11px] text-slate-300 min-w-12 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 group/bar py-2 cursor-pointer flex items-center">
              <input
                id="video-timeline-scrubber"
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                onMouseDown={() => setIsSeeking(true)}
                onMouseUp={() => setIsSeeking(false)}
                className="w-full h-1.5 group-hover/bar:h-2.5 bg-slate-800 accent-sky-500 rounded-lg cursor-pointer transition-all"
              />
            </div>

            <span className="font-mono text-[11px] text-slate-400 min-w-12">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              id="player-play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Skip 10s Backward/Forward (VOD) */}
            {duration > 0 && (
              <>
                <button
                  onClick={() => skipSeconds(-10)}
                  title="Rewind 10s"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Rewind className="w-4 h-4" />
                </button>
                <button
                  onClick={() => skipSeconds(10)}
                  title="Fast Forward 10s"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <FastForward className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Next Episode Button if series */}
            {activeVOD?.episodes && onSelectEpisode && (
              <button
                onClick={handleNextEpisode}
                title="Next Episode"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Volume & Mute */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                id="player-mute-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                id="player-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-18 md:w-24 h-1.5 bg-slate-800 accent-sky-500 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {/* Playback Speed Menu (VOD) */}
            {duration > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  title="Playback Speed"
                  className="px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-medium"
                >
                  {playbackRate}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-2xl z-50 text-xs flex flex-col gap-0.5">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                      <button
                        key={r}
                        onClick={() => handlePlaybackRate(r)}
                        className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                          playbackRate === r ? 'bg-sky-600/20 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{r}x</span>
                        {playbackRate === r && <Check className="w-3 h-3 text-sky-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aspect Ratio Menu */}
            <div className="relative">
              <button
                id="aspect-ratio-menu-btn"
                onClick={() => {
                  setShowAspectMenu(!showAspectMenu);
                  setShowQualityMenu(false);
                  setShowAudioMenu(false);
                  setShowSpeedMenu(false);
                }}
                title="Aspect Ratio"
                className="px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-medium transition-colors"
              >
                {aspectRatio.toUpperCase()}
              </button>

              {showAspectMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-32 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-2xl z-50 text-xs flex flex-col gap-0.5">
                  {(['16:9', '4:3', 'fill', 'fit', 'stretch'] as AspectRatio[]).map(ar => (
                    <button
                      key={ar}
                      onClick={() => {
                        setAspectRatio(ar);
                        setShowAspectMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                        aspectRatio === ar ? 'bg-sky-600/20 text-sky-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{ar.toUpperCase()}</span>
                      {aspectRatio === ar && <Check className="w-3 h-3 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector Menu */}
            <div className="relative">
              <button
                id="quality-menu-btn"
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowAspectMenu(false);
                  setShowAudioMenu(false);
                  setShowSpeedMenu(false);
                }}
                title="Quality"
                className="px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-medium transition-colors"
              >
                {currentQuality === -1 ? 'AUTO' : `${qualityLevels[currentQuality]?.height || 'HD'}p`}
              </button>

              {showQualityMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-2xl z-50 text-xs flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] text-slate-400 font-semibold uppercase">Resolution</div>
                  <button
                    onClick={() => handleSelectQuality(-1)}
                    className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                      currentQuality === -1 ? 'bg-sky-600/20 text-sky-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Auto (Adaptive)</span>
                    {currentQuality === -1 && <Check className="w-3 h-3 text-sky-400" />}
                  </button>
                  {qualityLevels.map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => handleSelectQuality(lvl.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                        currentQuality === lvl.id ? 'bg-sky-600/20 text-sky-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{lvl.label}</span>
                      {currentQuality === lvl.id && <Check className="w-3 h-3 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP button */}
            <button
              id="player-pip-btn"
              onClick={togglePiP}
              title="Picture-in-Picture"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen button */}
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
