import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Tv, 
  Sparkles, 
  Film,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { Channel, EPGProgram } from '../types';

interface EPGGuideProps {
  channels: Channel[];
  epgSchedule: Record<string, EPGProgram[]>;
  onSelectChannel: (channel: Channel) => void;
  selectedChannel: Channel | null;
  isAdultUnlocked?: boolean;
  onRequirePin?: (action?: () => void) => void;
}

const MINUTE_WIDTH = 4.5; // pixels per minute

export const EPGGuide: React.FC<EPGGuideProps> = ({
  channels,
  epgSchedule,
  onSelectChannel,
  selectedChannel,
  isAdultUnlocked = false,
  onRequirePin,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<{ program: EPGProgram; channel: Channel } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleChannelAction = (ch: Channel) => {
    const isAdultChannel = ch.isAdult || ch.group === 'Adult (+18)';
    if (isAdultChannel && !isAdultUnlocked && onRequirePin) {
      onRequirePin(() => {
        onSelectChannel(ch);
      });
      return;
    }
    onSelectChannel(ch);
  };

  const now = new Date();
  // Start timeline 2 hours before now
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 2, 0, 0, 0);
  const totalMinutes = 18 * 60; // 18 hours view

  // Generate 30-minute intervals for header
  const timeSlots: Date[] = [];
  for (let m = 0; m < totalMinutes; m += 30) {
    timeSlots.push(new Date(startTime.getTime() + m * 60 * 1000));
  }

  // Calculate current time position in pixels
  const nowOffsetMinutes = (now.getTime() - startTime.getTime()) / (60 * 1000);
  const nowPositionPx = nowOffsetMinutes * MINUTE_WIDTH;

  // Auto-scroll near current time on load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = Math.max(0, nowPositionPx - 250);
    }
  }, [nowPositionPx]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="epg-guide-container" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* EPG Top Subheader */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Canlı TV & EPG Yayın Akışı
              {isAdultUnlocked && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600/30 text-red-400 border border-red-500/40">
                  +18 Kilidi Açık
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">18 saatlik kesintisiz elektronik program rehberi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
              }
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = Math.max(0, nowPositionPx - 200);
              }
            }}
            className="px-3 py-1 bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold hover:bg-sky-600/30"
          >
            Şimdi
          </button>
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
              }
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main EPG Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Frozen Channels Column */}
        <div className="w-48 sm:w-60 shrink-0 border-r border-slate-800/80 bg-slate-900/60 overflow-y-hidden flex flex-col z-20 shadow-xl">
          {/* Header spacer */}
          <div className="h-11 border-b border-slate-800/80 bg-slate-950 px-3 flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kanallar
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
            {channels.map((ch) => {
              const isSelected = selectedChannel?.id === ch.id;
              const isAdultChannel = ch.isAdult || ch.group === 'Adult (+18)';
              const isLocked = isAdultChannel && !isAdultUnlocked;

              return (
                <div
                  key={ch.id}
                  id={`epg-channel-header-${ch.id}`}
                  onClick={() => handleChannelAction(ch)}
                  className={`h-16 px-3 flex items-center gap-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-sky-600/20 border-l-4 border-sky-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-slate-400 w-6 shrink-0">
                    {ch.number}
                  </span>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className={`w-full h-full object-contain bg-slate-900 border border-slate-800 p-0.5 ${isLocked ? 'blur-sm grayscale opacity-40' : ''}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}&background=0f172a&color=38bdf8&size=48`;
                      }}
                    />
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {isLocked ? `🔒 ${ch.name.replace(/\(\+18\)/, '').trim()}` : ch.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {isLocked ? 'Şifreli Yayın' : ch.group}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Timeline Grid */}
        <div 
          ref={scrollContainerRef}
          id="epg-scroll-timeline"
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-950/90"
        >
          <div style={{ width: `${totalMinutes * MINUTE_WIDTH}px` }} className="relative min-h-full">
            {/* Timeline Header Row */}
            <div className="h-11 border-b border-slate-800/80 bg-slate-900/90 sticky top-0 z-10 flex">
              {timeSlots.map((slot, idx) => (
                <div
                  key={idx}
                  style={{ width: `${30 * MINUTE_WIDTH}px` }}
                  className="h-full border-r border-slate-800/60 px-2 flex items-center text-[11px] font-mono text-slate-400 shrink-0"
                >
                  {formatTime(slot)}
                </div>
              ))}
            </div>

            {/* Current Time Red Marker Line */}
            {nowPositionPx > 0 && nowPositionPx < totalMinutes * MINUTE_WIDTH && (
              <div
                style={{ left: `${nowPositionPx}px` }}
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-15 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              >
                <div className="sticky top-11 -ml-3 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold tracking-tight shadow">
                  {formatTime(now)}
                </div>
              </div>
            )}

            {/* Channel Programs Rows */}
            <div className="divide-y divide-slate-900/80">
              {channels.map((ch) => {
                const programs = epgSchedule[ch.id] || [];
                const isAdultChannel = ch.isAdult || ch.group === 'Adult (+18)';
                const isLocked = isAdultChannel && !isAdultUnlocked;

                return (
                  <div key={ch.id} className="h-16 relative flex items-center">
                    {programs.map((prog) => {
                      const progStart = new Date(prog.startTime).getTime();
                      const progEnd = new Date(prog.endTime).getTime();

                      const offsetMinutes = (progStart - startTime.getTime()) / (60 * 1000);
                      const durationMinutes = (progEnd - progStart) / (60 * 1000);

                      const leftPx = offsetMinutes * MINUTE_WIDTH;
                      const widthPx = durationMinutes * MINUTE_WIDTH;

                      // Check if currently airing
                      const isAiring = now.getTime() >= progStart && now.getTime() < progEnd;

                      return (
                        <div
                          key={prog.id}
                          id={`epg-card-${prog.id}`}
                          onClick={() => {
                            if (isLocked && onRequirePin) {
                              onRequirePin(() => {
                                setSelectedProgram({ program: prog, channel: ch });
                              });
                            } else {
                              setSelectedProgram({ program: prog, channel: ch });
                            }
                          }}
                          style={{
                            left: `${Math.max(0, leftPx)}px`,
                            width: `${Math.max(30, widthPx - 2)}px`,
                          }}
                          className={`absolute h-13 rounded-xl px-2.5 py-1.5 flex flex-col justify-between cursor-pointer border transition-all hover:scale-[1.01] hover:z-10 shadow-sm ${
                            isLocked
                              ? 'bg-red-950/20 border-red-900/40 text-red-300'
                              : isAiring
                              ? 'bg-gradient-to-r from-sky-950/90 to-indigo-950/80 border-sky-500/50 hover:border-sky-400'
                              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1">
                              {isLocked ? (
                                <>
                                  <Lock className="w-3 h-3 text-red-400 shrink-0" />
                                  <span>Şifreli Yayın (+18)</span>
                                </>
                              ) : (
                                prog.title
                              )}
                            </h4>
                            {isAiring && !isLocked && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-600/80 text-white shrink-0">
                                NOW
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate">{isLocked ? 'PIN Kodu Gerekli' : (prog.category || ch.group)}</span>
                            <span className="font-mono text-slate-500 shrink-0">
                              {formatTime(new Date(prog.startTime))} - {formatTime(new Date(prog.endTime))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Program Details Modal */}
      {selectedProgram && (
        <div 
          id="epg-program-modal-backdrop"
          onClick={() => setSelectedProgram(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            id="epg-program-modal"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95"
          >
            <button
              id="close-epg-modal-btn"
              onClick={() => setSelectedProgram(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={selectedProgram.channel.logo}
                alt={selectedProgram.channel.name}
                className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1"
              />
              <div>
                <div className="text-xs font-semibold text-sky-400">
                  CH {selectedProgram.channel.number} • {selectedProgram.channel.name}
                </div>
                <h3 className="text-lg font-bold text-white">{selectedProgram.program.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {selectedProgram.program.category || selectedProgram.channel.group}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {selectedProgram.program.rating || 'TV-14'}
              </span>
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(new Date(selectedProgram.program.startTime))} - {formatTime(new Date(selectedProgram.program.endTime))}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              {selectedProgram.program.description}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
              <button
                id="epg-watch-now-btn"
                onClick={() => {
                  handleChannelAction(selectedProgram.channel);
                  setSelectedProgram(null);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>İzle: {selectedProgram.channel.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
