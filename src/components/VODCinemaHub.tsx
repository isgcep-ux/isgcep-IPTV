import React, { useState } from 'react';
import { 
  Play, 
  Film, 
  Tv, 
  Radio, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  ExternalLink, 
  Layers, 
  Sparkles,
  Link,
  Info
} from 'lucide-react';
import { VODItem, StreamType } from '../types';
import { VOD_MOVIES_CATALOG, NETFLIX_CATALOG, PRIME_VIDEO_CATALOG } from '../data/vodData';

interface VODCinemaHubProps {
  onPlayVOD: (item: VODItem) => void;
  onPlayCustomUrl: (url: string, streamType: StreamType, title?: string) => void;
}

export const VODCinemaHub: React.FC<VODCinemaHubProps> = ({ onPlayVOD, onPlayCustomUrl }) => {
  const allVODs: VODItem[] = [...VOD_MOVIES_CATALOG, ...NETFLIX_CATALOG, ...PRIME_VIDEO_CATALOG];
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customFormat, setCustomFormat] = useState<StreamType>('hls');

  const filteredVODs = allVODs.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.synopsis.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (selectedFormat === 'all') return true;
    if (selectedFormat === 'm3u8') return item.streamType === 'hls' || item.streamUrl.includes('.m3u8');
    if (selectedFormat === 'ts') return item.streamType === 'ts' || item.streamUrl.includes('.ts');
    if (selectedFormat === 'mp4') return item.streamType === 'mp4' || item.streamUrl.includes('.mp4');
    if (selectedFormat === 'netflix') return item.provider === 'netflix';
    if (selectedFormat === 'prime') return item.provider === 'prime';
    return true;
  });

  const handleLaunchCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamUrl.trim()) return;

    let detectedFormat: StreamType = customFormat;
    const lower = customStreamUrl.toLowerCase();
    if (lower.includes('.m3u8')) detectedFormat = 'hls';
    else if (lower.includes('.ts')) detectedFormat = 'ts';
    else if (lower.includes('.mp4')) detectedFormat = 'mp4';
    else if (lower.includes('.webm')) detectedFormat = 'webm';

    onPlayCustomUrl(customStreamUrl.trim(), detectedFormat, customTitle.trim() || 'Custom Video Stream');
  };

  return (
    <div id="vod-cinema-hub" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6 font-sans">
      {/* Top Banner with Custom Stream Launcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold">
              UNIVERSAL VIDEO & STREAM HUB
            </span>
            <span className="text-xs text-slate-400">Supports .m3u8, .ts, .mp4, .webm</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Video On Demand & Custom Stream Player
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Play high-quality movies, IPTV Transport Streams (.ts), HLS Adaptive Bitrate (.m3u8), or paste your own direct media link.
          </p>
        </div>

        {/* Quick Custom Stream URL Launcher Form */}
        <form onSubmit={handleLaunchCustomUrl} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              placeholder="Paste direct stream URL (e.g., https://.../video.m3u8 or .ts or .mp4)..."
              value={customStreamUrl}
              onChange={(e) => setCustomStreamUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Title (optional)"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Stream</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Format Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'm3u8', label: '.m3u8 (HLS Streams)' },
            { id: 'ts', label: '.ts (MPEG-TS)' },
            { id: 'mp4', label: '.mp4 (Direct Video)' },
            { id: 'netflix', label: 'Netflix' },
            { id: 'prime', label: 'Prime Video' },
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFormat === fmt.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search VOD movies & series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* VOD Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredVODs.map(item => (
          <div
            key={item.id}
            onClick={() => onPlayVOD(item)}
            className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 hover:scale-102 cursor-pointer shadow-lg flex flex-col"
          >
            {/* Poster / Thumbnail */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
              <img
                src={item.backdropUrl || item.posterUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Provider Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {item.provider === 'netflix' && (
                  <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold font-serif shadow">
                    NETFLIX
                  </span>
                )}
                {item.provider === 'prime' && (
                  <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px] font-bold shadow">
                    PRIME
                  </span>
                )}
                {item.provider === 'cinema' && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold shadow">
                    CINEMA
                  </span>
                )}
                {item.provider === 'vod' && (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shadow">
                    STREAM
                  </span>
                )}

                <span className="px-1.5 py-0.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 rounded text-[9px] font-mono">
                  {item.streamType.toUpperCase()}
                </span>
              </div>

              {/* Hover Play Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="p-3.5 rounded-full bg-indigo-600 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 fill-white" />
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {item.synopsis}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <span className="text-emerald-400 font-semibold">{item.matchScore}%</span>
                <span>{item.durationOrSeasons}</span>
                <span className="font-mono text-slate-300">{item.videoQuality}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
