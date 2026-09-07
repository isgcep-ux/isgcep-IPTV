import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  Flame, 
  Radio, 
  Globe2, 
  Sparkles, 
  Tv, 
  Compass, 
  Film, 
  Trophy, 
  Music, 
  Cpu, 
  ChevronDown, 
  SortAsc,
  SlidersHorizontal,
  Bookmark,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Flag
} from 'lucide-react';
import { Channel, EPGProgram } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { VoiceSearchButton } from './VoiceSearchButton';

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  epgSchedule: Record<string, EPGProgram[]>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  isAdultUnlocked: boolean;
  onRequirePin: (action?: () => void) => void;
  onLockAdult: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  onToggleFavorite,
  epgSchedule,
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  selectedCountry,
  onSelectCountry,
  isAdultUnlocked,
  onRequirePin,
  onLockAdult,
}) => {
  const { t } = useLanguage();
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'name'>('number');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const categories = useMemo(() => [
    { id: 'All', label: t('allCategories'), icon: Tv },
    { id: 'Türk TV', label: '🇹🇷 Türk TV', icon: Flag },
    { id: 'News', label: t('categoryNews'), icon: Radio },
    { id: 'Sports', label: t('categorySports'), icon: Trophy },
    { id: 'Movies', label: t('categoryCinema'), icon: Film },
    { id: 'Science', label: 'Science', icon: Compass },
    { id: 'Music', label: t('categoryMusic'), icon: Music },
    { id: 'Nature', label: t('categoryDocumentary'), icon: Globe2 },
    { id: 'Tech', label: 'Tech', icon: Cpu },
    { id: 'Adult (+18)', label: t('categoryAdult'), icon: Lock, isAdultOnly: true },
  ], [t]);

  // Extract unique countries
  const countries = Array.from(new Set(channels.map(c => c.country).filter(Boolean))) as string[];

  // Filter channels
  const filteredChannels = channels
    .filter(ch => {
      if (showFavoritesOnly && !ch.isFavorite) return false;
      if (selectedCategory !== 'All' && ch.group !== selectedCategory) return false;
      if (selectedCountry !== 'All' && ch.country !== selectedCountry) return false;
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const nowProg = epgSchedule[ch.id]?.[0]?.title?.toLowerCase() || '';
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.number.toString().includes(q) ||
          ch.group.toLowerCase().includes(q) ||
          nowProg.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.number - b.number;
    });

  const handleCategoryClick = (catId: string, isAdultOnly?: boolean) => {
    if (isAdultOnly && !isAdultUnlocked) {
      onRequirePin(() => {
        onSelectCategory(catId);
        if (showFavoritesOnly) onToggleFavoritesOnly();
      });
      return;
    }
    onSelectCategory(catId);
    if (showFavoritesOnly) onToggleFavoritesOnly();
  };

  const handleChannelClick = (ch: Channel) => {
    const isAdultChannel = ch.isAdult || ch.group === 'Adult (+18)';
    if (isAdultChannel && !isAdultUnlocked) {
      onRequirePin(() => {
        onSelectChannel(ch);
      });
      return;
    }
    onSelectChannel(ch);
  };

  return (
    <aside 
      id="channel-sidebar" 
      className="w-80 md:w-96 border-r border-slate-800/80 bg-slate-950 flex flex-col h-full shrink-0 select-none overflow-hidden"
    >
      {/* Category Pills Scroller */}
      <div className="p-3 border-b border-slate-800/80 flex flex-col gap-2.5 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('category')}</span>
            {isAdultUnlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                <Unlock className="w-2.5 h-2.5" />
                {t('adultUnlocked')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Adult Mode Quick Lock / Unlock Button */}
            {isAdultUnlocked ? (
              <button
                onClick={onLockAdult}
                title={t('lockAdult')}
                className="p-1 px-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-bold">{t('lockAdult')}</span>
              </button>
            ) : (
              <button
                onClick={() => onRequirePin()}
                title={t('unlockAdult')}
                className="p-1 px-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-medium">+18 PIN</span>
              </button>
            )}

            {/* Sort Toggle */}
            <button
              id="sidebar-sort-btn"
              onClick={() => setSortBy(sortBy === 'number' ? 'name' : 'number')}
              title={`Sort: ${sortBy === 'number' ? 'Name' : 'Channel No'}`}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <SortAsc className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase">{sortBy}</span>
            </button>

            {/* Country filter trigger */}
            <button
              id="sidebar-country-filter-btn"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              title={t('allCountries')}
              className={`p-1 px-1.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                selectedCountry !== 'All' 
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>{selectedCountry === 'All' ? t('countryRegion') : selectedCountry}</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map(cat => {
            const isAdultCat = cat.id === 'Adult (+18)';
            const Icon = isAdultCat ? (isAdultUnlocked ? Unlock : Lock) : cat.icon;
            const isSelected = selectedCategory === cat.id && !showFavoritesOnly;

            return (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => handleCategoryClick(cat.id, cat.isAdultOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? isAdultCat
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
                      : 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : isAdultCat
                    ? isAdultUnlocked
                      ? 'bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-800/60'
                      : 'bg-slate-900 text-red-400/80 hover:text-red-300 hover:bg-slate-800/80 border border-red-900/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isAdultCat ? (isAdultUnlocked ? 'text-emerald-400' : 'text-red-400') : ''}`} />
                <span>{cat.label}</span>
                {isAdultCat && !isAdultUnlocked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Drawer if open */}
        {showFilterDrawer && (
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs flex flex-col gap-1.5 animate-in fade-in">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">{t('countryRegion')}</div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  onSelectCountry('All');
                  setShowFilterDrawer(false);
                }}
                className={`px-2 py-1 rounded text-[11px] ${
                  selectedCountry === 'All' ? 'bg-sky-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t('allCountries')}
              </button>
              {countries.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    onSelectCountry(c);
                    setShowFilterDrawer(false);
                  }}
                  className={`px-2 py-1 rounded text-[11px] ${
                    selectedCountry === c ? 'bg-sky-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Search in sidebar */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-950">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="sidebar-search-filter"
            type="text"
            placeholder={t('searchChannels')}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-14 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {filterQuery && (
              <button
                id="sidebar-clear-search-btn"
                onClick={() => setFilterQuery('')}
                className="text-slate-400 hover:text-slate-200 text-xs px-1 hover:bg-slate-800 rounded"
              >
                ×
              </button>
            )}
            <VoiceSearchButton
              id="sidebar-voice-search-btn"
              onSearchResult={(spokenText) => setFilterQuery(spokenText)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Adult Unlocked Active Banner */}
      {selectedCategory === 'Adult (+18)' && isAdultUnlocked && (
        <div className="px-3 py-2 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-red-300">
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">{t('adultUnlocked')}</span>
          </div>
          <button
            onClick={onLockAdult}
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
          >
            {t('lockAdult')}
          </button>
        </div>
      )}

      {/* Channel List */}
      <div 
        id="sidebar-channel-list"
        className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-1.5 space-y-0.5"
      >
        {filteredChannels.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-300">{t('noChannelsFound')}</div>
            <p className="text-[11px] text-slate-500 mt-1">{t('clearFilter')}</p>
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const isSelected = selectedChannel?.id === ch.id;
            const currentShow = epgSchedule[ch.id]?.[0];
            const isAdultChannel = ch.isAdult || ch.group === 'Adult (+18)';
            const isLocked = isAdultChannel && !isAdultUnlocked;

            return (
              <div
                key={ch.id}
                id={`channel-item-${ch.id}`}
                onClick={() => handleChannelClick(ch)}
                className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? isAdultChannel
                      ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-500/50 shadow-md'
                      : 'bg-gradient-to-r from-sky-950/80 to-slate-900 border border-sky-500/40 shadow-md'
                    : isAdultChannel
                    ? isLocked
                      ? 'hover:bg-red-950/30 text-slate-400 border border-transparent hover:border-red-900/30'
                      : 'hover:bg-slate-900/90 text-slate-300'
                    : 'hover:bg-slate-900/90 text-slate-300'
                }`}
              >
                {/* Channel Number */}
                <div className={`w-8 shrink-0 text-center font-mono text-xs font-bold ${
                  isSelected 
                    ? isAdultChannel ? 'text-red-400' : 'text-sky-400' 
                    : isAdultChannel ? 'text-red-400/70' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  {ch.number}
                </div>

                {/* Logo with Adult Lock Overlay */}
                <div className="relative w-10 h-10 shrink-0 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}&background=0f172a&color=38bdf8&size=64`;
                    }}
                    className={`w-full h-full object-contain ${isLocked ? 'blur-sm grayscale opacity-40' : ''}`}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  {isSelected && (
                    <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-950 animate-ping ${
                      isAdultChannel ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />
                  )}
                </div>

                {/* Channel Title & Current Program */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className={`text-xs font-semibold truncate ${
                        isSelected 
                          ? 'text-white' 
                          : isLocked ? 'text-slate-300' : 'text-slate-200'
                      }`}>
                        {isLocked ? `🔒 ${ch.name.replace(/\(\+18\)/, '').trim()}` : ch.name}
                      </h3>
                      {ch.ageRating && (
                        <span className="text-[9px] font-black px-1 py-0.2 rounded bg-red-600/30 text-red-300 border border-red-500/40 shrink-0">
                          {ch.ageRating}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 shrink-0">
                      {ch.resolution || '1080p'}
                    </span>
                  </div>

                  {/* Program Title or Lock Badge */}
                  <p className="text-[11px] truncate mt-0.5 flex items-center gap-1">
                    {isLocked ? (
                      <span className="text-red-400 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 shrink-0" />
                        {t('encryptedBroadcast')}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {currentShow ? currentShow.title : ch.group}
                      </span>
                    )}
                  </p>
                </div>

                {/* Favorite Star */}
                <button
                  id={`fav-btn-${ch.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(ch.id);
                  }}
                  title={ch.isFavorite ? t('favorites') : t('favorites')}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    ch.isFavorite
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${ch.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Stats */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-400">
        <span>{filteredChannels.length} / {channels.length} {t('channelsCount')}</span>
        <span className="text-slate-500 font-mono">0-9 Dial</span>
      </div>
    </aside>
  );
};

