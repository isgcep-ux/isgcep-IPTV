import React from 'react';
import { 
  Tv, 
  Search, 
  Layers, 
  CalendarDays, 
  PlusCircle, 
  Keyboard, 
  Moon, 
  Maximize, 
  Radio, 
  SlidersHorizontal,
  Bookmark,
  Film,
  Sparkles,
  Lock,
  Unlock,
  Settings,
  Globe
} from 'lucide-react';
import { MultiViewLayout, SleepTimerState, AppViewMode } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { VoiceSearchButton } from './VoiceSearchButton';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  multiViewLayout: MultiViewLayout;
  onMultiViewLayoutChange: (layout: MultiViewLayout) => void;
  onOpenPlaylistModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenInfoModal: () => void;
  sleepTimer: SleepTimerState;
  onSetSleepTimer: (minutes: number) => void;
  totalChannels: number;
  favoriteCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  selectedCategory: string;
  isAdultUnlocked?: boolean;
  onRequirePin?: () => void;
  onLockAdult?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeView,
  onViewChange,
  multiViewLayout,
  onMultiViewLayoutChange,
  onOpenPlaylistModal,
  onOpenShortcutsModal,
  onOpenInfoModal,
  sleepTimer,
  onSetSleepTimer,
  totalChannels,
  favoriteCount,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  isAdultUnlocked = false,
  onRequirePin,
  onLockAdult,
}) => {
  const { t, language, availableLanguages } = useLanguage();
  const [showTimerMenu, setShowTimerMenu] = React.useState(false);

  const currentLangObj = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header id="iptv-header" className="h-16 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 select-none z-30 sticky top-0">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          onClick={() => onViewChange('player')}
          className="flex items-center gap-2.5 cursor-pointer group"
          id="iptv-brand-logo"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
                IPTV <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">PRO</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalChannels} {t('channelsAndVodCount')}</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 overflow-x-auto max-w-[50vw] sm:max-w-none scrollbar-none">
          <button
            id="view-mode-player"
            onClick={() => onViewChange('player')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeView === 'player'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{t('liveTv')}</span>
          </button>
          
          <button
            id="view-mode-turkish"
            onClick={() => onViewChange('turkish')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeView === 'turkish'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-red-400 hover:text-red-300 hover:bg-red-950/40'
            }`}
          >
            <span>🇹🇷</span>
            <span className="hidden sm:inline">{t('turkishHub')}</span>
            <span className="sm:hidden">{t('turkishHubShort')}</span>
          </button>

          <button
            id="view-mode-netflix"
            onClick={() => onViewChange('netflix')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeView === 'netflix'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-red-400 hover:text-red-300 hover:bg-red-950/40'
            }`}
          >
            <span className="font-serif font-black text-xs tracking-wider">N</span>
            <span>{t('netflix')}</span>
          </button>

          <button
            id="view-mode-prime"
            onClick={() => onViewChange('prime')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeView === 'prime'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-sky-400 hover:text-sky-300 hover:bg-sky-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('primeVideo')}</span>
          </button>

          <button
            id="view-mode-vod"
            onClick={() => onViewChange('vod')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeView === 'vod'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('vodCinema')}</span>
            <span className="sm:hidden">{t('vodCinemaShort')}</span>
          </button>

          <button
            id="view-mode-guide"
            onClick={() => onViewChange('guide')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeView === 'guide'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t('guideShort')}</span>
          </button>

          <button
            id="view-mode-multiview"
            onClick={() => onViewChange('multiview')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeView === 'multiview'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('multiView')}</span>
          </button>
        </nav>
      </div>

      {/* Center: Search & Quick Filters */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="channel-search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-16 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-200 text-xs px-1 hover:bg-slate-800 rounded"
              >
                ×
              </button>
            )}
            <VoiceSearchButton
              id="header-voice-search-btn"
              onSearchResult={(spokenText) => onSearchChange(spokenText)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Favorites Quick Filter */}
        <button
          id="toggle-favorites-header-btn"
          onClick={onToggleFavoritesOnly}
          title={showFavoritesOnly ? t('showAllChannels') : t('showFavoritesOnly')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            showFavoritesOnly 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span className="hidden sm:inline">{t('favorites')}</span>
          <span className="text-[10px] px-1 rounded bg-slate-800/80">{favoriteCount}</span>
        </button>

        {/* Multi-view Layout switcher (if on multiview) */}
        {activeView === 'multiview' && (
          <div className="hidden sm:flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              id="multiview-dual-btn"
              onClick={() => onMultiViewLayoutChange('dual-side')}
              className={`px-2 py-1 rounded text-xs ${multiViewLayout === 'dual-side' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="2 Channels Side-by-Side"
            >
              2x
            </button>
            <button
              id="multiview-quad-btn"
              onClick={() => onMultiViewLayoutChange('quad')}
              className={`px-2 py-1 rounded text-xs ${multiViewLayout === 'quad' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="4 Channels Quad Screen"
            >
              4x Quad
            </button>
          </div>
        )}

        {/* Parental Control / +18 Adult Pin Toggle */}
        {isAdultUnlocked ? (
          <button
            id="header-lock-adult-btn"
            onClick={onLockAdult}
            title={t('lockAdult')}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-bold">{t('adultUnlocked')}</span>
            <span className="text-[10px] bg-red-600 px-1 py-0.2 rounded text-white font-black">{t('lockAdult')}</span>
          </button>
        ) : (
          <button
            id="header-unlock-adult-btn"
            onClick={onRequirePin}
            title={t('unlockAdult')}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-900/50 text-slate-400 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-red-400/80" />
            <span className="hidden sm:inline font-medium">{t('adultLocked')}</span>
          </button>
        )}

        {/* Sleep Timer */}
        <div className="relative">
          <button
            id="sleep-timer-btn"
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            title={t('sleepTimer')}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              sleepTimer.enabled 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            {sleepTimer.enabled && (
              <span className="text-[11px] font-mono font-medium">{formatTimer(sleepTimer.remainingSeconds)}</span>
            )}
          </button>

          {showTimerMenu && (
            <div 
              id="sleep-timer-dropdown"
              className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('sleepTimer')}
              </div>
              {[
                { label: t('off'), minutes: 0 },
                { label: `15 ${t('minutes')}`, minutes: 15 },
                { label: `30 ${t('minutes')}`, minutes: 30 },
                { label: `45 ${t('minutes')}`, minutes: 45 },
                { label: `60 ${t('minutes')}`, minutes: 60 },
                { label: `90 ${t('minutes')}`, minutes: 90 },
                { label: `120 ${t('minutes')}`, minutes: 120 },
              ].map(opt => (
                <button
                  key={opt.minutes}
                  onClick={() => {
                    onSetSleepTimer(opt.minutes);
                    setShowTimerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    (opt.minutes === 0 && !sleepTimer.enabled) || (sleepTimer.enabled && Math.round(sleepTimer.totalSeconds / 60) === opt.minutes)
                      ? 'bg-sky-600/20 text-sky-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sleepTimer.enabled && Math.round(sleepTimer.totalSeconds / 60) === opt.minutes && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Playlist / Manage Playlists */}
        <button
          id="open-playlist-modal-btn"
          onClick={onOpenPlaylistModal}
          title={t('managePlaylists')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('playlists')}</span>
        </button>

        {/* Shortcuts */}
        <button
          id="open-shortcuts-modal-btn"
          onClick={onOpenShortcutsModal}
          title={t('shortcuts')}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Settings & Language Modal */}
        <button
          id="open-settings-modal-btn"
          onClick={onOpenInfoModal}
          title={t('settingsAndInfo')}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span className="text-[11px] font-mono font-bold">{currentLangObj.flag}</span>
        </button>
      </div>
    </header>
  );
};
