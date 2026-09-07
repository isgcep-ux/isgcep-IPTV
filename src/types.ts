export type StreamType = 'hls' | 'ts' | 'mp4' | 'webm' | 'direct';

export interface Channel {
  id: string;
  number: number;
  name: string;
  logo: string;
  url: string;
  group: string;
  country?: string;
  language?: string;
  tvgId?: string;
  resolution?: string; // e.g., '1080p', '720p', '4K'
  isFavorite?: boolean;
  isCustom?: boolean;
  isAdult?: boolean;
  ageRating?: string; // e.g. '18+'
  streamType?: StreamType;
  backupUrls?: string[];
  httpReferrer?: string;
  userAgent?: string;
}

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description: string;
  duration: string; // e.g. '52m'
  thumbnail: string;
  videoUrl: string;
  streamType: StreamType;
  introStart?: number; // seconds
  introEnd?: number;   // seconds
}

export interface CastMember {
  name: string;
  character: string;
  avatar: string;
}

export interface XRaySceneInfo {
  timestampSeconds: number;
  actors: CastMember[];
  musicTrack?: string;
  trivia?: string;
}

export interface VODItem {
  id: string;
  title: string;
  tagline?: string;
  synopsis: string;
  provider: 'netflix' | 'prime' | 'cinema' | 'vod';
  type: 'series' | 'movie';
  posterUrl: string;
  backdropUrl: string;
  logoUrl?: string;
  matchScore: number; // e.g., 98 for 98% Match
  ageRating: string;  // e.g., '18+', '16+', 'TV-MA', 'PG-13'
  releaseYear: number;
  durationOrSeasons: string; // e.g., '4 Seasons' or '2h 14m'
  genres: string[];
  audioQuality: string; // e.g., 'Dolby Atmos', '5.1 Spatial'
  videoQuality: string; // e.g., '4K Ultra HD', 'HDR10+', '1080p'
  streamUrl: string; // Direct play URL (.m3u8, .ts, .mp4)
  streamType: StreamType;
  trailerUrl?: string;
  cast: CastMember[];
  director?: string;
  episodes?: Episode[];
  xrayData?: XRaySceneInfo[];
  isFavorite?: boolean;
  isTrending?: boolean;
  isTop10?: boolean;
  top10Rank?: number;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  category?: string;
  rating?: string;
  seasonEpisode?: string;
}

export interface PlaylistSource {
  id: string;
  name: string;
  url?: string;
  channelCount: number;
  addedAt: string;
  type: 'builtin' | 'custom_url' | 'custom_file' | 'xtream' | 'vod';
  serverUrl?: string;
  username?: string;
}

export type AspectRatio = '16:9' | '4:3' | 'fit' | 'fill' | 'stretch';

export interface StreamStats {
  bitrate: number; // kbps
  fps: number;
  bufferLength: number; // seconds
  droppedFrames: number;
  resolution: string;
  audioCodec: string;
  videoCodec: string;
  latency: number; // ms
  qualityLevel: string;
  streamFormat?: string;
}

export interface MultiViewSlot {
  id: string;
  channelId: string | null;
  isMuted: boolean;
}

export type MultiViewLayout = 'single' | 'dual-side' | 'dual-stack' | 'triple' | 'quad';

export interface SleepTimerState {
  enabled: boolean;
  remainingSeconds: number;
  totalSeconds: number;
}

export type AppViewMode = 'player' | 'guide' | 'multiview' | 'netflix' | 'prime' | 'vod' | 'turkish';

export type AppLanguage = 'tr' | 'en' | 'de' | 'es' | 'fr';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
}
