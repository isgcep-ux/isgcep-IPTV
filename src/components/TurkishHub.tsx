import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  Star, 
  Film, 
  Tv, 
  Sparkles,
  Flame,
  Clock,
  Search,
  Award,
  Heart,
  ChevronRight,
  X
} from 'lucide-react';
import { VODItem, Episode } from '../types';
import { TURKISH_SERIES_CATALOG, TURKISH_MOVIES_CATALOG, ALL_TURKISH_VOD } from '../data/turkishVodData';

interface TurkishHubProps {
  onPlayVOD: (item: VODItem, episode?: Episode) => void;
}

export const TurkishHub: React.FC<TurkishHubProps> = ({ onPlayVOD }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [selectedModalItem, setSelectedModalItem] = useState<VODItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Hero items rotation
  const heroCandidates = ALL_TURKISH_VOD.filter(i => i.isTop10);
  const heroItem = heroCandidates[heroIndex % heroCandidates.length] || ALL_TURKISH_VOD[0];

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const categories = [
    { id: 'Tümü', label: 'Tümü' },
    { id: 'Dizi', label: '📺 Türk Dizileri' },
    { id: 'Film', label: '🎬 Türk Filmleri' },
    { id: 'Komedi', label: '😂 Komedi & Mizah' },
    { id: 'Aksiyon', label: '🔥 Aksiyon & Mafya' },
    { id: 'Dram', label: '❤️ Dram & Aşk' },
    { id: 'Ödüllü', label: '🏆 Ödüllü Başyapıtlar' }
  ];

  // Filtering
  const filteredItems = ALL_TURKISH_VOD.filter(item => {
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cast.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.character.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeCategory === 'Tümü') return true;
    if (activeCategory === 'Dizi') return item.type === 'series';
    if (activeCategory === 'Film') return item.type === 'movie';
    if (activeCategory === 'Komedi') return item.genres.some(g => g.includes('Komedi') || g.includes('Mizah'));
    if (activeCategory === 'Aksiyon') return item.genres.some(g => g.includes('Aksiyon') || g.includes('Mafya') || g.includes('Suç'));
    if (activeCategory === 'Dram') return item.genres.some(g => g.includes('Dram') || g.includes('Duygusal') || g.includes('Aşk'));
    if (activeCategory === 'Ödüllü') return item.genres.some(g => g.includes('Ödüllü') || g.includes('Cannes') || g.includes('Başyapıt'));
    return true;
  });

  const top10Items = ALL_TURKISH_VOD.filter(c => c.isTop10).sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));
  const seriesItems = TURKISH_SERIES_CATALOG;
  const movieItems = TURKISH_MOVIES_CATALOG;
  const comedyItems = ALL_TURKISH_VOD.filter(c => c.genres.some(g => g.includes('Komedi') || g.includes('Mizah') || g.includes('Absürt')));
  const awardWinningItems = ALL_TURKISH_VOD.filter(c => c.genres.some(g => g.includes('Ödüllü') || g.includes('Cannes') || g.includes('Emmy') || g.includes('Başyapıt')));

  return (
    <div id="turkish-hub-container" className="flex-1 bg-[#0b0c10] text-slate-100 overflow-y-auto overflow-x-hidden select-none font-sans">
      {/* Top Banner Header */}
      <div className="sticky top-0 z-30 bg-[#0b0c10]/95 backdrop-blur-md px-6 py-3.5 border-b border-red-900/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-red-500 flex items-center gap-1.5 font-serif">
              <span className="text-2xl">🇹🇷</span> TÜRK SİNEMA & DİZİ
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
              HD & 4K VOD
            </span>
          </div>

          {/* Quick Category Badges */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto text-xs ml-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Dizi, film, oyuncu veya replik ara (Kurtlar Vadisi, Ezel, 7. Koğuş, Gibi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-red-500 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="hidden md:flex items-center text-[11px] text-slate-400 font-medium whitespace-nowrap">
            <span>{ALL_TURKISH_VOD.length} Yapım</span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Category Scrollbar */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-6 py-2 bg-slate-950/60 border-b border-slate-900 text-xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-red-600 text-white font-bold'
                : 'text-slate-300 hover:text-white bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* If Search Active, Show Search Results Grid */}
      {searchQuery.trim() !== '' ? (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" />
              <span>"{searchQuery}" için Arama Sonuçları ({filteredItems.length})</span>
            </h2>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs text-red-400 hover:underline"
            >
              Filtreyi Temizle
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedModalItem(item)}
                className="group relative bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-800/80 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-950/50"
              >
                <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                  <img 
                    src={item.posterUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVOD(item);
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Hemen İzle
                    </button>
                  </div>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-red-400 border border-red-500/30">
                    {item.type === 'series' ? 'DİZİ' : 'FİLM'}
                  </span>
                </div>
                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="text-green-400 font-semibold">{item.matchScore}% Eşleşme</span>
                    <span>{item.releaseYear}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Hero Billboard Showcase */}
          <div className="relative w-full h-[58vh] min-h-[400px] max-h-[540px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
              style={{ backgroundImage: `url(${heroItem.backdropUrl})` }}
            />
            {/* Dark Dramatic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/70 to-transparent w-full md:w-3/4" />

            {/* Hero Text Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-3xl space-y-3 z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[11px] tracking-wider uppercase shadow-lg shadow-red-600/40 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-white" />
                  GÜNÜN ÖNE ÇIKAN TÜRK YAPIMI
                </span>
                <span className="text-xs text-red-300 font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-500/30">
                  {heroItem.type === 'series' ? 'Efsane Dizi' : 'Başyapıt Film'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl">
                {heroItem.title}
              </h1>

              {heroItem.tagline && (
                <p className="text-sm md:text-base font-serif italic text-red-200/90 font-medium">
                  "{heroItem.tagline}"
                </p>
              )}

              <p className="text-xs md:text-sm text-slate-300 line-clamp-3 max-w-2xl leading-relaxed">
                {heroItem.synopsis}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-emerald-400" />
                  {heroItem.matchScore}% Beğeni
                </span>
                <span className="text-slate-400">•</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                  {heroItem.ageRating}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-semibold">{heroItem.durationOrSeasons}</span>
                <span className="text-slate-400">•</span>
                <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-700/50 text-[10px] font-bold text-red-300">
                  {heroItem.videoQuality}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="hero-play-turkish-btn"
                  onClick={() => onPlayVOD(heroItem)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-red-600/40 hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Hemen Oynat
                </button>

                <button
                  onClick={() => setSelectedModalItem(heroItem)}
                  className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 backdrop-blur-md transition-all border border-slate-700 cursor-pointer"
                >
                  <Info className="w-4 h-4 text-red-400" />
                  Bölümler & Detaylar
                </button>

                <button
                  onClick={() => toggleWatchlist(heroItem.id)}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                    watchlist.includes(heroItem.id)
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700'
                  }`}
                  title="Listeme Ekle"
                >
                  {watchlist.includes(heroItem.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>

                {/* Hero switcher buttons */}
                <div className="ml-auto hidden md:flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-slate-800">
                  {heroCandidates.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        (heroIndex % heroCandidates.length) === idx ? 'bg-red-500 w-5' : 'bg-slate-600 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Rows */}
          <div className="p-6 md:p-8 space-y-8">
            
            {/* ROW 1: Türkiye Top 10 Listesi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white flex items-center gap-1.5">
                    <Flame className="w-5 h-5 text-red-500" />
                    Bugün Türkiye'de En Çok İzlenen 10 Yapım
                  </span>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-800">
                {top10Items.map((item, idx) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedModalItem(item)}
                    className="flex-shrink-0 group relative w-48 bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500/80 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-red-950/40"
                  >
                    {/* Big Rank Number Watermark */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                      <img 
                        src={item.posterUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Stylized Rank Number Overlay */}
                      <span className="absolute -bottom-3 -left-2 text-7xl font-black text-white/90 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] font-serif italic select-none">
                        {idx + 1}
                      </span>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayVOD(item);
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Oynat
                        </button>
                      </div>

                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold">
                        TOP 10
                      </span>
                    </div>

                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.genres.slice(0, 2).join(' • ')}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                        <span className="text-green-400 font-bold">{item.matchScore}% Eşleşme</span>
                        <span>{item.durationOrSeasons}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: Efsane Türk Dizileri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-500" />
                  Efsane Türk Dizileri (Kurtlar Vadisi, Ezel, Çukur, Gibi...)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {seriesItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedModalItem(item)}
                    className="group bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500/70 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-red-950/40 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                      <img 
                        src={item.posterUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-red-400 border border-red-500/30">
                        DİZİ
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayVOD(item);
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Bölümleri İzle
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.tagline || item.genres.join(', ')}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                        <span className="text-emerald-400 font-bold">{item.matchScore}%</span>
                        <span className="text-slate-400 font-semibold">{item.durationOrSeasons}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 3: Unutulmaz Türk Filmleri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-red-500" />
                  Unutulmaz Türk Filmleri & Sinema Başyapıtları
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movieItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedModalItem(item)}
                    className="group bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500/70 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-red-950/40 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                      <img 
                        src={item.posterUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        FİLM
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayVOD(item);
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Filmi Başlat
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.genres.slice(0, 2).join(' • ')}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                        <span className="text-emerald-400 font-bold">{item.matchScore}%</span>
                        <span className="text-slate-400 font-semibold">{item.durationOrSeasons}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 4: Ödüllü Türk Sineması & Absürt Komedi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Cannes & Emmy Ödüllü Türk Başyapıtları ve Kült Komediler
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...awardWinningItems, ...comedyItems.slice(0, 3)].slice(0, 6).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedModalItem(item)}
                    className="flex gap-4 p-3.5 bg-slate-900/70 border border-slate-800/90 rounded-2xl hover:border-red-500/50 transition-all cursor-pointer hover:bg-slate-900 group"
                  >
                    <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-slate-950 relative">
                      <img 
                        src={item.posterUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600/20 text-red-400">
                            {item.type === 'series' ? 'Dizi' : 'Film'}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            ★ {item.matchScore}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 group-hover:text-red-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {item.synopsis}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 font-semibold">{item.durationOrSeasons}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayVOD(item);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          İzle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* DETAIL & EPISODES MODAL */}
      {selectedModalItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto"
          onClick={() => setSelectedModalItem(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-[#121318] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Backdrop Banner */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${selectedModalItem.backdropUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121318] via-[#121318]/40 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                      {selectedModalItem.type === 'series' ? 'TÜRK DİZİSİ' : 'TÜRK FİLMİ'}
                    </span>
                    <span className="text-xs text-green-400 font-bold">{selectedModalItem.matchScore}% Eşleşme</span>
                    <span className="text-xs text-slate-300">• {selectedModalItem.releaseYear}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                      {selectedModalItem.ageRating}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                    {selectedModalItem.title}
                  </h2>

                  {selectedModalItem.tagline && (
                    <p className="text-xs md:text-sm font-serif italic text-red-300">
                      "{selectedModalItem.tagline}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onPlayVOD(selectedModalItem);
                      setSelectedModalItem(null);
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-red-600/40 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {selectedModalItem.type === 'series' ? '1. Bölümü Oynat' : 'Filmi Başlat'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Synopsis and Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Konu ve Hikaye</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedModalItem.synopsis}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedModalItem.genres.map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-400 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Ses Kalitesi:</span>
                    <span className="text-white font-semibold">{selectedModalItem.audioQuality}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Görüntü Kalitesi:</span>
                    <span className="text-white font-semibold">{selectedModalItem.videoQuality}</span>
                  </div>
                  {selectedModalItem.director && (
                    <div>
                      <span className="text-slate-500 block">Yönetmen:</span>
                      <span className="text-white font-semibold">{selectedModalItem.director}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Süre / Sezon:</span>
                    <span className="text-white font-semibold">{selectedModalItem.durationOrSeasons}</span>
                  </div>
                </div>
              </div>

              {/* Cast Members */}
              {selectedModalItem.cast && selectedModalItem.cast.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Oyuncu Kadrosu</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {selectedModalItem.cast.map(c => (
                      <div key={c.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <img 
                          src={c.avatar} 
                          alt={c.name} 
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-red-400 truncate">{c.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Series Episodes List */}
              {selectedModalItem.type === 'series' && selectedModalItem.episodes && selectedModalItem.episodes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Bölümler ({selectedModalItem.episodes.length})
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {selectedModalItem.episodes.map(ep => (
                      <div
                        key={ep.id}
                        onClick={() => {
                          onPlayVOD(selectedModalItem, ep);
                          setSelectedModalItem(null);
                        }}
                        className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-red-500/50 transition-all cursor-pointer"
                      >
                        <div className="w-full md:w-44 aspect-video rounded-xl overflow-hidden bg-slate-950 relative flex-shrink-0">
                          <img 
                            src={ep.thumbnail} 
                            alt={ep.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 fill-white text-white drop-shadow-lg" />
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                            {ep.duration}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                              {ep.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {ep.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* X-Ray Trivia Replik / Bilgi */}
              {selectedModalItem.xrayData && selectedModalItem.xrayData.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 text-xs space-y-1">
                  <span className="font-bold text-red-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Unutulmaz Sahne & Replik Notu:
                  </span>
                  <p className="text-slate-300 italic">
                    "{selectedModalItem.xrayData[0].trivia}"
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
