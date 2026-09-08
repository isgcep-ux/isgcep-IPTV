import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Channel, EPGProgram, MultiViewLayout, PlaylistSource, SleepTimerState, AppViewMode, VODItem, Episode } from './types';
import { DEFAULT_CHANNELS, generateLiveEPG } from './data/defaultChannels';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelSidebar } from './components/ChannelSidebar';
import { EPGGuide } from './components/EPGGuide';
import { MultiViewPlayer } from './components/MultiViewPlayer';
import { PlaylistModal } from './components/PlaylistModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ChannelInfoModal } from './components/ChannelInfoModal';
import { NetflixHub } from './components/NetflixHub';
import { PrimeVideoHub } from './components/PrimeVideoHub';
import { VODCinemaHub } from './components/VODCinemaHub';
import { TurkishHub } from './components/TurkishHub';
import { ParentalPinModal } from './components/ParentalPinModal';
import { WebOSRemoteGuide } from './components/WebOSRemoteGuide';
import { 
  detectWebOS, 
  TV_KEYCODES, 
  requestScreenWakeLock, 
  releaseScreenWakeLock,
  navigateSpatialFocus 
} from './utils/webOSIntegration';

const STORAGE_KEY_CHANNELS = 'iptv_custom_channels_v2';
const STORAGE_KEY_FAVORITES = 'iptv_favorites_v2';
const STORAGE_KEY_SOURCES = 'iptv_sources_v2';
const STORAGE_KEY_PARENTAL_PIN = 'iptv_parental_pin_v2';

export default function App() {
  // ── Parental Control & PIN State (+18) ────────────────────────
  const [parentalPin, setParentalPin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PARENTAL_PIN) || '0000';
    } catch {
      return '0000';
    }
  });
  const [isAdultUnlocked, setIsAdultUnlocked] = useState<boolean>(false);
  const [isParentalPinModalOpen, setIsParentalPinModalOpen] = useState<boolean>(false);
  const [pendingPinAction, setPendingPinAction] = useState<(() => void) | null>(null);

  // ── Channels & Playlists State ────────────────────────────────
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
      const favs = localStorage.getItem(STORAGE_KEY_FAVORITES);
      const favoriteIds: string[] = favs ? JSON.parse(favs) : [];

      if (saved) {
        const parsed: Channel[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(c => c.id));
        const missingDefaults = DEFAULT_CHANNELS.filter(dc => !existingIds.has(dc.id));
        const combined = [...parsed, ...missingDefaults];
        return combined.map(c => ({
          ...c,
          isFavorite: favoriteIds.includes(c.id) || !!c.isFavorite
        }));
      }

      return DEFAULT_CHANNELS.map(c => ({
        ...c,
        isFavorite: favoriteIds.includes(c.id) || !!c.isFavorite
      }));
    } catch {
      return DEFAULT_CHANNELS;
    }
  });

  const [playlistSources, setPlaylistSources] = useState<PlaylistSource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected active channel
  const [selectedChannelId, setSelectedChannelId] = useState<string>(() => {
    return channels[0]?.id || DEFAULT_CHANNELS[0].id;
  });

  const selectedChannel = useMemo(() => {
    return channels.find(c => c.id === selectedChannelId) || channels[0] || null;
  }, [channels, selectedChannelId]);

  // VOD Active Playback State
  const [activeVOD, setActiveVOD] = useState<VODItem | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);

  // EPG Schedule
  const [epgSchedule, setEpgSchedule] = useState<Record<string, EPGProgram[]>>(() => {
    return generateLiveEPG(channels);
  });

  // Regenerate EPG periodically
  useEffect(() => {
    setEpgSchedule(generateLiveEPG(channels));
    const timer = setInterval(() => {
      setEpgSchedule(generateLiveEPG(channels));
    }, 60000 * 5); // refresh every 5 mins
    return () => clearInterval(timer);
  }, [channels]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
      const favoriteIds = channels.filter(c => c.isFavorite).map(c => c.id);
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoriteIds));
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(playlistSources));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [channels, playlistSources]);

  // ── Navigation & Views State ──────────────────────────────────
  const [activeView, setActiveView] = useState<AppViewMode>('player');
  const [multiViewLayout, setMultiViewLayout] = useState<MultiViewLayout>('quad');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Modals State ──────────────────────────────────────────────
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // ── WebOS & Smart TV State ────────────────────────────────────
  const [isTVMode, setIsTVMode] = useState<boolean>(() => {
    return detectWebOS().isSmartTV;
  });
  const [channelDialBuffer, setChannelDialBuffer] = useState<string>('');

  // Keep screen awake on WebOS Smart TVs
  useEffect(() => {
    requestScreenWakeLock();
    return () => {
      releaseScreenWakeLock();
    };
  }, []);

  // ── Sleep Timer State ─────────────────────────────────────────
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    enabled: false,
    remainingSeconds: 0,
    totalSeconds: 0,
  });

  const handleSetSleepTimer = (minutes: number) => {
    if (minutes === 0) {
      setSleepTimer({ enabled: false, remainingSeconds: 0, totalSeconds: 0 });
    } else {
      const secs = minutes * 60;
      setSleepTimer({ enabled: true, remainingSeconds: secs, totalSeconds: secs });
    }
  };

  useEffect(() => {
    if (!sleepTimer.enabled || sleepTimer.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setSleepTimer(prev => {
        if (prev.remainingSeconds <= 1) {
          // Trigger sleep: pause media
          const videos = document.querySelectorAll('video');
          videos.forEach(v => v.pause());
          return { enabled: false, remainingSeconds: 0, totalSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.enabled, sleepTimer.remainingSeconds]);

  // ── Parental PIN Handlers (+18) ──────────────────────────────
  const handleRequirePin = useCallback((action?: () => void) => {
    setPendingPinAction(action ? () => action : null);
    setIsParentalPinModalOpen(true);
  }, []);

  const handlePinSuccess = useCallback(() => {
    setIsAdultUnlocked(true);
    setIsParentalPinModalOpen(false);
    if (pendingPinAction) {
      pendingPinAction();
      setPendingPinAction(null);
    }
  }, [pendingPinAction]);

  const handleLockAdult = useCallback(() => {
    setIsAdultUnlocked(false);
    // If current channel is adult, switch to a safe channel
    if (selectedChannel && (selectedChannel.isAdult || selectedChannel.group === 'Adult (+18)')) {
      const safeChannel = channels.find(c => !c.isAdult && c.group !== 'Adult (+18)') || channels[0];
      if (safeChannel) {
        setSelectedChannelId(safeChannel.id);
      }
    }
    if (selectedCategory === 'Adult (+18)') {
      setSelectedCategory('All');
    }
  }, [channels, selectedChannel, selectedCategory]);

  const handleUpdatePin = useCallback((newPin: string) => {
    setParentalPin(newPin);
    try {
      localStorage.setItem(STORAGE_KEY_PARENTAL_PIN, newPin);
    } catch (e) {
      console.warn('Failed to save PIN:', e);
    }
  }, []);

  // ── Channel Handlers ──────────────────────────────────────────
  const handleSelectChannel = useCallback((channel: Channel) => {
    const isAdult = channel.isAdult || channel.group === 'Adult (+18)';
    if (isAdult && !isAdultUnlocked) {
      handleRequirePin(() => {
        setActiveVOD(null);
        setActiveEpisode(null);
        setSelectedChannelId(channel.id);
        if (activeView !== 'player') {
          setActiveView('player');
        }
      });
      return;
    }

    setActiveVOD(null);
    setActiveEpisode(null);
    setSelectedChannelId(channel.id);
    if (activeView !== 'player') {
      setActiveView('player');
    }
  }, [activeView, isAdultUnlocked, handleRequirePin]);

  // Channel dial buffer timeout (e.g. typing "1", "0" plays channel #10 after 1.2s)
  useEffect(() => {
    if (!channelDialBuffer) return;

    const timer = setTimeout(() => {
      const channelNum = parseInt(channelDialBuffer, 10);
      if (!isNaN(channelNum)) {
        const found = channels.find(c => c.number === channelNum);
        if (found) {
          handleSelectChannel(found);
        }
      }
      setChannelDialBuffer('');
    }, 1200);

    return () => clearTimeout(timer);
  }, [channelDialBuffer, channels, handleSelectChannel]);

  const handlePlayVOD = useCallback((item: VODItem, ep?: Episode) => {
    setActiveVOD(item);
    setActiveEpisode(ep || item.episodes?.[0] || null);
    setActiveView('player');
  }, []);

  const handleSelectEpisode = useCallback((vod: VODItem, ep: Episode) => {
    setActiveVOD(vod);
    setActiveEpisode(ep);
  }, []);

  const handleNextChannel = useCallback(() => {
    if (activeVOD) {
      // If in VOD and next channel triggered, return to live TV
      setActiveVOD(null);
      setActiveEpisode(null);
      return;
    }
    if (!selectedChannel) return;
    const currentIndex = channels.findIndex(c => c.id === selectedChannel.id);
    const nextIndex = (currentIndex + 1) % channels.length;
    setSelectedChannelId(channels[nextIndex].id);
  }, [channels, selectedChannel, activeVOD]);

  const handlePrevChannel = useCallback(() => {
    if (activeVOD) {
      setActiveVOD(null);
      setActiveEpisode(null);
      return;
    }
    if (!selectedChannel) return;
    const currentIndex = channels.findIndex(c => c.id === selectedChannel.id);
    const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
    setSelectedChannelId(channels[prevIndex].id);
  }, [channels, selectedChannel, activeVOD]);

  const handleToggleFavorite = useCallback((channelId: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        return { ...c, isFavorite: !c.isFavorite };
      }
      return c;
    }));
  }, []);

  // Add new playlist channels
  const handleAddChannels = (newChannels: Channel[], source: PlaylistSource) => {
    setChannels(prev => {
      const maxNum = prev.reduce((max, c) => Math.max(max, c.number), 100);
      const formatted = newChannels.map((c, idx) => ({
        ...c,
        number: maxNum + idx + 1,
      }));
      return [...prev, ...formatted];
    });

    setPlaylistSources(prev => [...prev, source]);
  };

  const handleClearCustomChannels = () => {
    setChannels(DEFAULT_CHANNELS);
    setPlaylistSources([]);
    setSelectedChannelId(DEFAULT_CHANNELS[0].id);
    setActiveVOD(null);
    setActiveEpisode(null);
  };

  const handleRemovePlaylistSource = (sourceId: string) => {
    setPlaylistSources(prev => prev.filter(s => s.id !== sourceId));
  };

  // ── WebOS & Smart TV Remote Action Dispatcher ─────────────────
  const handleTVRemoteAction = useCallback((action: string, keyCode?: number) => {
    switch (action) {
      case 'ArrowUp':
      case 'ChannelUp':
        handlePrevChannel();
        break;
      case 'ArrowDown':
      case 'ChannelDown':
        handleNextChannel();
        break;
      case 'ArrowLeft':
        navigateSpatialFocus('left');
        break;
      case 'ArrowRight':
        navigateSpatialFocus('right');
        break;
      case 'Red':
        setActiveView(prev => prev === 'guide' ? 'player' : 'guide');
        break;
      case 'Green':
        setActiveView(prev => prev === 'turkish' ? 'player' : 'turkish');
        break;
      case 'Yellow':
        setActiveView(prev => prev === 'vod' ? 'player' : 'vod');
        break;
      case 'Blue':
        setActiveView(prev => prev === 'multiview' ? 'player' : 'multiview');
        break;
      case 'Back':
      case 'Escape':
        if (isPlaylistModalOpen || isShortcutsModalOpen || isInfoModalOpen) {
          setIsPlaylistModalOpen(false);
          setIsShortcutsModalOpen(false);
          setIsInfoModalOpen(false);
        } else if (activeVOD) {
          setActiveVOD(null);
          setActiveEpisode(null);
        } else if (activeView !== 'player') {
          setActiveView('player');
        }
        break;
      case 'Info':
        setIsInfoModalOpen(prev => !prev);
        break;
      case 'Enter':
      case 'OK': {
        const focused = document.activeElement as HTMLElement;
        if (focused && typeof focused.click === 'function') {
          focused.click();
        }
        break;
      }
      case 'MediaPlayPause': {
        const video = document.querySelector('video');
        if (video) {
          if (video.paused) video.play();
          else video.pause();
        }
        break;
      }
      case 'MediaFastForward': {
        const video = document.querySelector('video');
        if (video) video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        break;
      }
      case 'MediaRewind': {
        const video = document.querySelector('video');
        if (video) video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      }
      default:
        if (action.startsWith('Digit') && action.length === 6) {
          const num = action.charAt(5);
          setChannelDialBuffer(prev => (prev + num).slice(0, 4));
        }
        break;
    }
  }, [
    handleNextChannel, 
    handlePrevChannel, 
    isPlaylistModalOpen, 
    isShortcutsModalOpen, 
    isInfoModalOpen, 
    activeVOD, 
    activeView
  ]);

  // ── Global Keyboard & WebOS TV Remote Shortcuts ──────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape' || e.keyCode === TV_KEYCODES.BACK) {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const code = e.keyCode;

      // LG webOS Return / Back key
      if (code === TV_KEYCODES.BACK || code === TV_KEYCODES.TIZEN_BACK || e.key === 'Escape') {
        e.preventDefault();
        handleTVRemoteAction('Back');
        return;
      }

      // LG Magic Remote Color Keys
      if (code === TV_KEYCODES.RED) {
        e.preventDefault();
        handleTVRemoteAction('Red');
        return;
      }
      if (code === TV_KEYCODES.GREEN) {
        e.preventDefault();
        handleTVRemoteAction('Green');
        return;
      }
      if (code === TV_KEYCODES.YELLOW) {
        e.preventDefault();
        handleTVRemoteAction('Yellow');
        return;
      }
      if (code === TV_KEYCODES.BLUE) {
        e.preventDefault();
        handleTVRemoteAction('Blue');
        return;
      }

      // LG Channel Up / Down Keys
      if (code === TV_KEYCODES.CHANNEL_UP || code === TV_KEYCODES.PAGE_UP) {
        e.preventDefault();
        handlePrevChannel();
        return;
      }
      if (code === TV_KEYCODES.CHANNEL_DOWN || code === TV_KEYCODES.PAGE_DOWN) {
        e.preventDefault();
        handleNextChannel();
        return;
      }

      // LG Info & Guide Keys
      if (code === TV_KEYCODES.INFO) {
        e.preventDefault();
        setIsInfoModalOpen(prev => !prev);
        return;
      }
      if (code === TV_KEYCODES.GUIDE) {
        e.preventDefault();
        setActiveView(prev => prev === 'guide' ? 'player' : 'guide');
        return;
      }

      // LG Media Playback Keys
      if (code === TV_KEYCODES.PLAY_PAUSE || code === TV_KEYCODES.PLAY || code === TV_KEYCODES.PAUSE) {
        e.preventDefault();
        handleTVRemoteAction('MediaPlayPause');
        return;
      }
      if (code === TV_KEYCODES.FAST_FORWARD) {
        e.preventDefault();
        handleTVRemoteAction('MediaFastForward');
        return;
      }
      if (code === TV_KEYCODES.REWIND) {
        e.preventDefault();
        handleTVRemoteAction('MediaRewind');
        return;
      }

      // Direct Numeric Dialing (0-9) on TV Remote
      if (code >= TV_KEYCODES.NUM_0 && code <= TV_KEYCODES.NUM_9) {
        const digit = (code - TV_KEYCODES.NUM_0).toString();
        setChannelDialBuffer(prev => (prev + digit).slice(0, 4));
        return;
      }
      if (code >= TV_KEYCODES.NUMPAD_0 && code <= TV_KEYCODES.NUMPAD_9) {
        const digit = (code - TV_KEYCODES.NUMPAD_0).toString();
        setChannelDialBuffer(prev => (prev + digit).slice(0, 4));
        return;
      }

      // Standard PC Keyboard Fallbacks
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlePrevChannel();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNextChannel();
          break;
        case 'g':
        case 'G':
          setActiveView(prev => prev === 'guide' ? 'player' : 'guide');
          break;
        case 'q':
        case 'Q':
          setActiveView(prev => prev === 'multiview' ? 'player' : 'multiview');
          break;
        case 'n':
        case 'N':
          setActiveView(prev => prev === 'netflix' ? 'player' : 'netflix');
          break;
        case 'p':
        case 'P':
          setActiveView(prev => prev === 'prime' ? 'player' : 'prime');
          break;
        case 'v':
        case 'V':
          setActiveView(prev => prev === 'vod' ? 'player' : 'vod');
          break;
        case 't':
        case 'T':
          setActiveView(prev => prev === 'turkish' ? 'player' : 'turkish');
          break;
        case '/':
          e.preventDefault();
          document.getElementById('channel-search-input')?.focus();
          break;
        case '?':
          setIsShortcutsModalOpen(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextChannel, handlePrevChannel, handleTVRemoteAction]);

  // Current program for active channel
  const currentProgram = selectedChannel ? epgSchedule[selectedChannel.id]?.[0] : undefined;
  const favoriteCount = channels.filter(c => c.isFavorite).length;

  return (
    <div id="iptv-app-root" className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* App Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onViewChange={setActiveView}
        multiViewLayout={multiViewLayout}
        onMultiViewLayoutChange={setMultiViewLayout}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        sleepTimer={sleepTimer}
        onSetSleepTimer={handleSetSleepTimer}
        totalChannels={channels.length}
        favoriteCount={favoriteCount}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
        selectedCategory={selectedCategory}
        isAdultUnlocked={isAdultUnlocked}
        onRequirePin={handleRequirePin}
        onLockAdult={handleLockAdult}
        channels={channels}
        onSelectChannel={handleSelectChannel}
        activeChannel={selectedChannel}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Channel Navigation Sidebar (Visible in Single Player & Multi-View) */}
        {activeView === 'player' && !activeVOD && (
          <ChannelSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            epgSchedule={epgSchedule}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            isAdultUnlocked={isAdultUnlocked}
            onRequirePin={handleRequirePin}
            onLockAdult={handleLockAdult}
          />
        )}

        {/* Dynamic Center Stage View */}
        <section className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeView === 'player' && (
            <VideoPlayer
              channel={selectedChannel}
              activeVOD={activeVOD}
              activeEpisode={activeEpisode}
              currentProgram={currentProgram}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              onSelectChannel={handleSelectChannel}
              onSelectEpisode={handleSelectEpisode}
              allChannels={channels}
              onOpenInfoModal={() => setIsInfoModalOpen(true)}
              isAdultUnlocked={isAdultUnlocked}
              onRequirePin={handleRequirePin}
            />
          )}

          {activeView === 'turkish' && (
            <TurkishHub onPlayVOD={handlePlayVOD} />
          )}

          {activeView === 'netflix' && (
            <NetflixHub onPlayVOD={handlePlayVOD} />
          )}

          {activeView === 'prime' && (
            <PrimeVideoHub onPlayVOD={handlePlayVOD} />
          )}

          {activeView === 'vod' && (
            <VODCinemaHub onPlayVOD={handlePlayVOD} />
          )}

          {activeView === 'multiview' && (
            <MultiViewPlayer
              channels={channels}
              layout={multiViewLayout}
              onSelectMainChannel={handleSelectChannel}
              isAdultUnlocked={isAdultUnlocked}
              onRequirePin={handleRequirePin}
            />
          )}

          {activeView === 'guide' && (
            <EPGGuide
              channels={channels}
              epgSchedule={epgSchedule}
              onSelectChannel={handleSelectChannel}
              selectedChannel={selectedChannel}
              isAdultUnlocked={isAdultUnlocked}
              onRequirePin={handleRequirePin}
            />
          )}
        </section>
      </main>

      {/* Modals & Overlays */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onAddChannels={handleAddChannels}
        onClearCustomChannels={handleClearCustomChannels}
        customPlaylistSources={playlistSources}
        onRemovePlaylistSource={handleRemovePlaylistSource}
        currentChannels={channels}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <ChannelInfoModal
        channel={selectedChannel}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        currentPin={parentalPin}
        onOpenPinModal={() => {
          setIsInfoModalOpen(false);
          setIsParentalPinModalOpen(true);
        }}
        isAdultUnlocked={isAdultUnlocked}
        onLockAdult={handleLockAdult}
        isTVMode={isTVMode}
        onToggleTVMode={() => setIsTVMode(prev => !prev)}
        totalChannels={channels.length}
        onResetDefaultChannels={handleClearCustomChannels}
      />

      {/* Parental PIN Control Modal (+18) */}
      <ParentalPinModal
        isOpen={isParentalPinModalOpen}
        onClose={() => {
          setIsParentalPinModalOpen(false);
          setPendingPinAction(null);
        }}
        onSuccess={handlePinSuccess}
        currentPin={parentalPin}
        onUpdatePin={handleUpdatePin}
      />

      {/* LG webOS & Smart TV Virtual Remote and OSD Banner */}
      <WebOSRemoteGuide
        isTVMode={isTVMode}
        onToggleTVMode={() => setIsTVMode(prev => !prev)}
        channelDialBuffer={channelDialBuffer}
        onSimulateKey={handleTVRemoteAction}
      />
    </div>
  );
}
