import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  X, 
  Star, 
  Film, 
  Tv, 
  Sparkles,
  Flame,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VODItem, Episode } from '../types';
import { NETFLIX_CATALOG } from '../data/vodData';

interface NetflixHubProps {
  onPlayVOD: (item: VODItem, episode?: Episode) => void;
  onSelectChannelById?: (channelId: string) => void;
}

export const NetflixHub: React.FC<NetflixHubProps> = ({ onPlayVOD }) => {
  const [catalog, setCatalog] = useState<VODItem[]>(NETFLIX_CATALOG);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedModalItem, setSelectedModalItem] = useState<VODItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeFilterGenre, setActiveFilterGenre] = useState<string>('All');

  const heroItem = catalog[heroIndex] || catalog[0];

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const genres = ['All', 'Sci-Fi', 'Thriller', 'Drama', 'Dark Comedy', 'Action', 'Fantasy'];

  const filteredCatalog = activeFilterGenre === 'All'
    ? catalog
    : catalog.filter(c => c.genres.includes(activeFilterGenre));

  const trendingItems = catalog.filter(c => c.isTrending);
  const top10Items = catalog.filter(c => c.isTop10).sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));

  return (
    <div id="netflix-hub-container" className="flex-1 bg-[#141414] text-white overflow-y-auto overflow-x-hidden select-none font-sans">
      {/* Top Netflix Brand Bar & Genre Filter */}
      <div className="sticky top-0 z-30 bg-[#141414]/90 backdrop-blur-md px-6 py-3.5 border-b border-red-950/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-widest text-[#E50914] font-serif uppercase">
              NETFLIX
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-600/30">
              ORIGINALS & SERIES
            </span>
          </div>

          {/* Genre Tabs */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto text-xs">
            {genres.map(g => (
              <button
                key={g}
                onClick={() => setActiveFilterGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFilterGenre === g
                    ? 'bg-white text-black font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          <span>{catalog.length} Stream Titles • .m3u8, .ts, .mp4</span>
        </div>
      </div>

      {/* Hero Billboard Banner */}
      <div className="relative w-full h-[62vh] min-h-[400px] max-h-[560px] overflow-hidden">
        {/* Background Image / Poster */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${heroItem.backdropUrl})` }}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent w-2/3" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-2xl z-10 space-y-3">
          {/* Netflix N Logo Tag */}
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-black text-sm font-serif">N</span>
            <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              {heroItem.type === 'series' ? 'SERIES' : 'FILM'}
            </span>
            {heroItem.isTop10 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                <Flame className="w-3 h-3 text-red-500" />
                #1 in TV Shows Today
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            {heroItem.title}
          </h1>

          {/* Tagline / Match */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-400 font-bold">{heroItem.matchScore}% Match</span>
            <span className="text-slate-300">{heroItem.releaseYear}</span>
            <span className="px-1.5 py-0.2 border border-slate-600 text-slate-300 rounded text-[10px] uppercase">
              {heroItem.ageRating}
            </span>
            <span className="text-slate-300">{heroItem.durationOrSeasons}</span>
            <span className="px-1.5 py-0.2 rounded bg-red-900/60 border border-red-700/50 text-[10px] font-mono text-red-300">
              {heroItem.videoQuality}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs md:text-sm text-slate-200 line-clamp-3 drop-shadow-md max-w-xl">
            {heroItem.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="hero-play-btn"
              onClick={() => onPlayVOD(heroItem)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-lg text-sm transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play Now</span>
            </button>

            <button
              id="hero-info-btn"
              onClick={() => setSelectedModalItem(heroItem)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/90 text-white font-semibold rounded-lg text-sm backdrop-blur-sm transition-all border border-slate-700 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>More Info & Episodes</span>
            </button>

            <button
              onClick={() => toggleWatchlist(heroItem.id)}
              className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
              title="Add to My List"
            >
              {watchlist.includes(heroItem.id) ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Switcher Indicators */}
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
          {catalog.slice(0, 4).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setHeroIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                heroIndex === idx ? 'bg-red-600 w-7' : 'bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Catalog Rows */}
      <div className="px-6 md:px-12 py-6 space-y-8">
        {/* Row 1: Top 10 Today */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Top 10 Series & Movies Today
            </h2>
            <ChevronRight className="w-4 h-4 text-red-500" />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
            {top10Items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedModalItem(item)}
                className="group relative flex shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105"
              >
                {/* Giant Number */}
                <div className="w-14 md:w-20 text-6xl md:text-8xl font-black font-serif text-slate-800 group-hover:text-red-600/80 transition-colors self-end pb-2 -mr-3 select-none">
                  {idx + 1}
                </div>

                {/* Poster Card */}
                <div className="w-32 md:w-44 h-48 md:h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-red-600/60 shadow-xl relative">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white leading-tight">{item.title}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">{item.matchScore}% Match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Trending Netflix Originals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Trending on Netflix
            </h2>
            <span className="text-xs text-red-500 font-medium cursor-pointer hover:underline">Explore All</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedModalItem(item)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-red-600/60 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg aspect-[2/3]"
              >
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                {/* N Badge */}
                <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-red-600 flex items-center justify-center text-white font-serif font-black text-xs shadow-md">
                  N
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <h3 className="text-xs font-bold text-white line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                    <span className="text-emerald-400 font-bold">{item.matchScore}%</span>
                    <span>•</span>
                    <span>{item.durationOrSeasons}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVOD(item);
                      }}
                      className="p-1.5 rounded-full bg-white hover:bg-slate-200 text-black shadow"
                    >
                      <Play className="w-3 h-3 fill-black" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(item.id);
                      }}
                      className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                    >
                      {watchlist.includes(item.id) ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Netflix Detail & Episode Selector Modal */}
      {selectedModalItem && (
        <div
          id="netflix-detail-modal"
          onClick={() => setSelectedModalItem(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#181818] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col"
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Backdrop Banner */}
            <div className="relative h-64 md:h-80 shrink-0">
              <img
                src={selectedModalItem.backdropUrl}
                alt={selectedModalItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/40" />

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-red-600 font-serif font-black text-sm">N</span>
                    <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">
                      {selectedModalItem.type === 'series' ? 'NETFLIX SERIES' : 'NETFLIX ORIGINAL'}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {selectedModalItem.title}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    onPlayVOD(selectedModalItem);
                    setSelectedModalItem(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:scale-105 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play</span>
                </button>
              </div>
            </div>

            {/* Modal Body & Episodes List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Metadata row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-semibold flex-wrap">
                    <span className="text-emerald-400 font-bold">{selectedModalItem.matchScore}% Match</span>
                    <span className="text-slate-400">{selectedModalItem.releaseYear}</span>
                    <span className="px-1.5 py-0.2 border border-slate-700 text-slate-300 rounded text-[10px]">
                      {selectedModalItem.ageRating}
                    </span>
                    <span className="text-slate-300">{selectedModalItem.durationOrSeasons}</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800 text-[10px] text-red-300">
                      {selectedModalItem.videoQuality}
                    </span>
                    <span className="text-slate-400">{selectedModalItem.audioQuality}</span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {selectedModalItem.synopsis}
                  </p>
                </div>

                {/* Cast & Genres */}
                <div className="space-y-3 text-xs border-l border-slate-800 pl-4">
                  <div>
                    <span className="text-slate-500">Cast: </span>
                    <span className="text-slate-300">
                      {selectedModalItem.cast.map(c => c.name).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Genres: </span>
                    <span className="text-slate-300">{selectedModalItem.genres.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stream Source: </span>
                    <span className="font-mono text-sky-400 text-[11px]">
                      {selectedModalItem.streamType.toUpperCase()} Stream
                    </span>
                  </div>
                </div>
              </div>

              {/* Episodes Section (If Series) */}
              {selectedModalItem.episodes && selectedModalItem.episodes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Episodes</h3>
                    <span className="text-xs text-slate-400 font-medium">Season 1</span>
                  </div>

                  <div className="space-y-2">
                    {selectedModalItem.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => {
                          onPlayVOD(selectedModalItem, ep);
                          setSelectedModalItem(null);
                        }}
                        className="group flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-600/40 transition-all cursor-pointer"
                      >
                        <span className="text-lg font-bold font-mono text-slate-500 group-hover:text-red-500 w-6 text-center shrink-0">
                          {ep.episodeNumber}
                        </span>

                        <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800">
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 fill-white text-white" />
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
