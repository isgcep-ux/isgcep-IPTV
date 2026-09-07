import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Tv, 
  Layers, 
  ChevronDown, 
  Radio,
  Sliders,
  Check,
  Lock,
  Unlock
} from 'lucide-react';
import { Channel, MultiViewLayout } from '../types';

interface MultiViewPlayerProps {
  channels: Channel[];
  layout: MultiViewLayout;
  onSelectMainChannel: (channel: Channel) => void;
  isAdultUnlocked?: boolean;
  onRequirePin?: (action?: () => void) => void;
}

interface TileState {
  channelId: string;
  isMuted: boolean;
}

export const MultiViewPlayer: React.FC<MultiViewPlayerProps> = ({
  channels,
  layout,
  onSelectMainChannel,
  isAdultUnlocked = false,
  onRequirePin,
}) => {
  const slotCount = layout === 'quad' ? 4 : layout === 'triple' ? 3 : 2;

  // Initialize slots with non-adult channels by default
  const safeChannels = channels.filter(c => !c.isAdult && c.group !== 'Adult (+18)');
  const [slots, setSlots] = useState<TileState[]>([
    { channelId: safeChannels[0]?.id || channels[0]?.id || '', isMuted: false },
    { channelId: safeChannels[1]?.id || channels[1]?.id || '', isMuted: true },
    { channelId: safeChannels[2]?.id || channels[2]?.id || '', isMuted: true },
    { channelId: safeChannels[3]?.id || channels[3]?.id || '', isMuted: true },
  ]);

  const [activeAudioSlot, setActiveAudioSlot] = useState<number>(0);

  const handleSetAudioFocus = (index: number) => {
    setActiveAudioSlot(index);
    setSlots(prev => prev.map((s, idx) => ({
      ...s,
      isMuted: idx !== index
    })));
  };

  const handleChannelChange = (slotIndex: number, channelId: string) => {
    const targetChannel = channels.find(c => c.id === channelId);
    const isAdult = targetChannel?.isAdult || targetChannel?.group === 'Adult (+18)';
    if (isAdult && !isAdultUnlocked && onRequirePin) {
      onRequirePin(() => {
        setSlots(prev => {
          const next = [...prev];
          next[slotIndex] = { ...next[slotIndex], channelId };
          return next;
        });
      });
      return;
    }

    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], channelId };
      return next;
    });
  };

  return (
    <div id="multiview-container" className="flex-1 bg-black p-2 flex flex-col h-full overflow-hidden select-none">
      <div className={`grid gap-2 flex-1 h-full ${
        layout === 'quad' 
          ? 'grid-cols-1 md:grid-cols-2 grid-rows-2' 
          : layout === 'triple'
          ? 'grid-cols-1 md:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {Array.from({ length: slotCount }).map((_, index) => {
          const slot = slots[index];
          const channel = channels.find(c => c.id === slot?.channelId) || safeChannels[index % safeChannels.length] || channels[index % channels.length];
          const isAudioActive = activeAudioSlot === index;

          return (
            <MultiViewTile
              key={index}
              slotIndex={index}
              channel={channel}
              channels={channels}
              isAudioActive={isAudioActive}
              isAdultUnlocked={isAdultUnlocked}
              onRequirePin={onRequirePin}
              onFocusAudio={() => handleSetAudioFocus(index)}
              onSelectChannel={(chId) => handleChannelChange(index, chId)}
              onExpandToMain={() => channel && onSelectMainChannel(channel)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface MultiViewTileProps {
  slotIndex: number;
  channel: Channel | undefined;
  channels: Channel[];
  isAudioActive: boolean;
  isAdultUnlocked?: boolean;
  onRequirePin?: (action?: () => void) => void;
  onFocusAudio: () => void;
  onSelectChannel: (channelId: string) => void;
  onExpandToMain: () => void;
}

const MultiViewTile: React.FC<MultiViewTileProps> = ({
  slotIndex,
  channel,
  channels,
  isAudioActive,
  isAdultUnlocked = false,
  onRequirePin,
  onFocusAudio,
  onSelectChannel,
  onExpandToMain,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAdult = channel?.isAdult || channel?.group === 'Adult (+18)';
  const isLocked = isAdult && !isAdultUnlocked;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    if (isLocked) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.src = '';
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.muted = !isAudioActive;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, () => {
        setIsLoading(false);
      });
    } else {
      video.src = channel.url;
      video.muted = !isAudioActive;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, isLocked, isAudioActive]);

  // Sync mute state with active audio tile
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
    }
  }, [isAudioActive]);

  return (
    <div 
      id={`multiview-tile-${slotIndex}`}
      className={`relative rounded-2xl overflow-hidden bg-slate-950 border-2 transition-all flex items-center justify-center group ${
        isAudioActive ? 'border-sky-500 shadow-lg shadow-sky-500/10' : isLocked ? 'border-red-900/40' : 'border-slate-800'
      }`}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        className={`w-full h-full object-contain ${isLocked ? 'blur-lg opacity-20' : ''}`}
        onClick={onFocusAudio}
      />

      {isLocked && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center z-20">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
            <Lock className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 mb-1">
            Şifreli Yayın (+18)
          </span>
          <button
            onClick={() => onRequirePin && onRequirePin()}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md transition-transform hover:scale-105"
          >
            <Unlock className="w-3 h-3" />
            <span>PIN Gir</span>
          </button>
        </div>
      )}

      {isLoading && !isLocked && (
        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
        </div>
      )}

      {/* Top Overlay Controls */}
      <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            id={`tile-${slotIndex}-select-btn`}
            onClick={() => setShowChannelDropdown(!showChannelDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 backdrop-blur-md transition-colors"
          >
            <span className="font-mono text-sky-400">CH {channel?.number}</span>
            <span className="truncate max-w-[120px]">{isLocked ? `🔒 ${channel?.name}` : channel?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showChannelDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-60 max-h-56 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-2xl z-50 text-xs flex flex-col gap-0.5 animate-in fade-in">
              {channels.map(c => {
                const cLocked = (c.isAdult || c.group === 'Adult (+18)') && !isAdultUnlocked;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectChannel(c.id);
                      setShowChannelDropdown(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                      channel?.id === c.id ? 'bg-sky-600/20 text-sky-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cLocked ? `🔒 ` : ''}CH {c.number} • {c.name}</span>
                    {channel?.id === c.id && <Check className="w-3 h-3 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio focus button */}
          <button
            id={`tile-${slotIndex}-audio-btn`}
            onClick={onFocusAudio}
            title={isAudioActive ? "Audio Active" : "Click for Audio"}
            className={`p-1.5 rounded-lg text-xs border backdrop-blur-md transition-colors ${
              isAudioActive
                ? 'bg-sky-600 text-white border-sky-400'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Expand to Main View */}
          <button
            id={`tile-${slotIndex}-expand-btn`}
            onClick={onExpandToMain}
            title="Expand to Full Player"
            className="p-1.5 rounded-lg text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Live badge & Channel Info */}
      <div className="absolute bottom-2 left-3 z-10 pointer-events-none flex items-center gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded text-white animate-pulse ${isLocked ? 'bg-red-800' : 'bg-red-600'}`}>
          {isLocked ? 'KİLİTLİ' : 'LIVE'}
        </span>
        <span className="text-xs font-semibold text-white/90 drop-shadow-md">
          {isLocked ? `🔒 ${channel?.name}` : channel?.name}
        </span>
      </div>
    </div>
  );
};
