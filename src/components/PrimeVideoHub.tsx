import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  ChevronRight, 
  X, 
  Sparkles, 
  Flame, 
  Film, 
  Layers, 
  Radio, 
  Award,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { VODItem, Episode } from '../types';
import { PRIME_VIDEO_CATALOG } from '../data/vodData';

interface PrimeVideoHubProps {
  onPlayVOD: (item: VODItem, episode?: Episode) => void;
}

export const PrimeVideoHub: React.FC<PrimeVideoHubProps> = ({ onPlayVOD }) => {
  const [catalog] = useState<VODItem[]>(PRIME_VIDEO_CATALOG);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedModalItem, setSelectedModalItem] = useState<VODItem | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');

  const heroItem = catalog[heroIndex] || catalog[0];

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const categories = ['All', 'Action', 'Sci-Fi', 'Superhero', 'Fantasy', 'Adventure'];

  const filteredCatalog = selectedFilterCategory === 'All'
    ? catalog
    : catalog.filter(c => c.genres.includes(selectedFilterCategory));

  return (
    <div id="prime-video-hub" className="flex-1 bg-[#0F172A] text-slate-100 overflow-y-auto overflow-x-hidden select-none font-sans">
      {/* Top Prime Header */}
      <div className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-md px-6 py-3.5 border-b border-sky-950/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-sky-400 tracking-tight">prime</span>
            <span className="text-base font-semibold text-white">video</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 ml-1">
              ORIGINALS & MOVIES
            </span>
          </div>

          {/* Filter pills */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedFilterCategory === cat
                    ? 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Includes Prime X-Ray Live Scene Trivia</span>
        </div>
      </div>

      {/* Prime Hero Carousel Banner */}
      <div className="relative w-full h-[58vh] min-h-[380px] max-h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${heroItem.backdropUrl})` }}
        />
        {/* Prime Signature Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/70 to-transparent w-3/4" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-2xl z-10 space-y-3">
          {/* Prime Video Ribbon */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
              Included with Prime
            </span>
            <span className="text-xs text-slate-300 font-medium">Amazon Original</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            {heroItem.title}
          </h1>

          {/* Tagline & Specs */}
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <span className="text-sky-400 font-bold">{heroItem.matchScore}% Prime Score</span>
            <span className="text-slate-300">{heroItem.releaseYear}</span>
            <span className="px-1.5 py-0.2 border border-slate-700 text-slate-300 rounded text-[10px]">
              {heroItem.ageRating}
            </span>
            <span className="text-slate-300">{heroItem.durationOrSeasons}</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-700/50 text-[10px] font-mono text-sky-300">
              {heroItem.videoQuality}
            </span>
            <span className="text-[10px] text-slate-400">{heroItem.audioQuality}</span>
          </div>

          <p className="text-xs md:text-sm text-slate-200 line-clamp-3 max-w-xl drop-shadow-md">
            {heroItem.synopsis}
          </p>

          {/* Prime Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="prime-hero-play-btn"
              onClick={() => onPlayVOD(heroItem)}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/25 hover:scale-105 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now with Prime</span>
            </button>

            <button
              onClick={() => setSelectedModalItem(heroItem)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm backdrop-blur-sm transition-all border border-slate-700 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Episodes & X-Ray</span>
            </button>

            <button
              onClick={() => toggleWatchlist(heroItem.id)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
              title="Add to Watchlist"
            >
              {watchlist.includes(heroItem.id) ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
          {catalog.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setHeroIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                heroIndex === idx ? 'bg-sky-400 w-6' : 'bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Prime Rows */}
      <div className="px-6 md:px-12 py-6 space-y-8">
        {/* Amazon Originals Row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Amazon Originals & Exclusives
            </h2>
            <span className="text-xs text-sky-400 font-medium hover:underline cursor-pointer">See more</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedModalItem(item)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-sky-500/60 transition-all duration-300 hover:scale-102 cursor-pointer shadow-xl flex flex-col"
              >
                {/* Backdrop Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.backdropUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-sky-600/90 text-white rounded text-[10px] font-bold">
                    Prime
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVOD(item);
                      }}
                      className="p-3 rounded-full bg-sky-500 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.synopsis}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="text-sky-400 font-semibold">{item.durationOrSeasons}</span>
                    <span className="font-mono text-slate-300">{item.videoQuality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prime Detail Modal & X-Ray Info */}
      {selectedModalItem && (
        <div
          id="prime-detail-modal"
          onClick={() => setSelectedModalItem(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#0F172A] border border-sky-900/50 rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col"
          >
            <button
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Banner */}
            <div className="relative h-64 md:h-80 shrink-0">
              <img
                src={selectedModalItem.backdropUrl}
                alt={selectedModalItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/40" />

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-sky-950/90 px-2 py-0.5 rounded border border-sky-500/40">
                    Prime Video Exclusive
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-md mt-1.5">
                    {selectedModalItem.title}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    onPlayVOD(selectedModalItem);
                    setSelectedModalItem(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:scale-105 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Now</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-semibold flex-wrap">
                    <span className="text-sky-400 font-bold">{selectedModalItem.matchScore}% Prime Score</span>
                    <span className="text-slate-400">{selectedModalItem.releaseYear}</span>
                    <span className="px-1.5 py-0.2 border border-slate-700 text-slate-300 rounded text-[10px]">
                      {selectedModalItem.ageRating}
                    </span>
                    <span className="text-slate-300">{selectedModalItem.durationOrSeasons}</span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-950 text-[10px] text-sky-300 border border-sky-800">
                      {selectedModalItem.videoQuality}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {selectedModalItem.synopsis}
                  </p>

                  {/* X-Ray Feature Spotlight */}
                  <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-sky-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>X-Ray Experience Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Access live character bios, scene soundtracks, and trivia during playback in the IPTV Player.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-l border-slate-800 pl-4">
                  <div>
                    <span className="text-slate-500">Starring: </span>
                    <span className="text-slate-300">
                      {selectedModalItem.cast.map(c => c.name).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Genres: </span>
                    <span className="text-slate-300">{selectedModalItem.genres.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Audio: </span>
                    <span className="text-slate-300">{selectedModalItem.audioQuality}</span>
                  </div>
                </div>
              </div>

              {/* Episodes List */}
              {selectedModalItem.episodes && selectedModalItem.episodes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white">Season 1 Episodes</h3>

                  <div className="space-y-2">
                    {selectedModalItem.episodes.map(ep => (
                      <div
                        key={ep.id}
                        onClick={() => {
                          onPlayVOD(selectedModalItem, ep);
                          setSelectedModalItem(null);
                        }}
                        className="group flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer"
                      >
                        <span className="text-base font-bold font-mono text-slate-500 group-hover:text-sky-400 w-6 text-center shrink-0">
                          {ep.episodeNumber}
                        </span>

                        <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                              {ep.title}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">{ep.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{ep.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
