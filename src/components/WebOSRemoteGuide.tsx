import React, { useState } from 'react';
import { 
  Tv, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Radio, 
  Info,
  Layers,
  Sparkles,
  Search,
  Sliders
} from 'lucide-react';
import { detectWebOS } from '../utils/webOSIntegration';

interface WebOSRemoteGuideProps {
  isTVMode: boolean;
  onToggleTVMode: () => void;
  channelDialBuffer: string;
  onSimulateKey: (keyName: string, keyCode: number) => void;
}

export const WebOSRemoteGuide: React.FC<WebOSRemoteGuideProps> = ({
  isTVMode,
  onToggleTVMode,
  channelDialBuffer,
  onSimulateKey,
}) => {
  const [isVirtualRemoteOpen, setIsVirtualRemoteOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const deviceInfo = detectWebOS();

  return (
    <>
      {/* ON SCREEN CHANNEL DIAL BANNER (OSD) */}
      {channelDialBuffer && (
        <div className="fixed top-8 right-8 z-50 animate-in zoom-in-90 fade-in duration-150">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/40 flex items-center gap-4 backdrop-blur-lg">
            <Radio className="w-8 h-8 animate-pulse text-white" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-red-100">Kanal Numarası</p>
              <p className="text-3xl font-black font-mono tracking-widest leading-none">
                {channelDialBuffer}<span className="animate-ping text-white font-bold">_</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM REMOTE CONTROL QUICK BAR */}
      <div 
        id="webos-remote-bar"
        className={`fixed bottom-3 right-3 z-40 transition-all duration-300 ${
          isTVMode ? 'opacity-100 translate-y-0' : 'opacity-90 hover:opacity-100'
        }`}
      >
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
          
          {/* Quick Remote Toggle Button */}
          <button
            onClick={() => setIsVirtualRemoteOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer hover:border-red-500/50"
            title="Sanal LG Kumandayı Aç"
          >
            <Tv className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">LG Magic Remote</span>
          </button>

          {/* Color Key Badges Legend */}
          {isLegendExpanded && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold px-2 border-l border-slate-800">
              <button 
                onClick={() => onSimulateKey('Red', 403)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Kırmızı Tuş: TV Rehberi (EPG)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/60 inline-block" />
                <span>EPG Rehber</span>
              </button>

              <button 
                onClick={() => onSimulateKey('Green', 404)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Yeşil Tuş: Türk Dizi & Sinema Hub"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60 inline-block" />
                <span>🇹🇷 Türk TV</span>
              </button>

              <button 
                onClick={() => onSimulateKey('Yellow', 405)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sarı Tuş: VOD & Netflix Hub"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60 inline-block" />
                <span>VOD Hub</span>
              </button>

              <button 
                onClick={() => onSimulateKey('Blue', 406)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Mavi Tuş: Çoklu Ekran (Multi-View)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/60 inline-block" />
                <span>Çoklu Ekran</span>
              </button>
            </div>
          )}

          {/* TV Mode Badge */}
          <button
            onClick={onToggleTVMode}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              isTVMode 
                ? 'bg-red-600/30 border-red-500 text-red-300 shadow-sm shadow-red-600/30' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTVMode ? '📺 webOS Modu: Açık' : 'TV Modu'}
          </button>
        </div>
      </div>

      {/* VIRTUAL LG MAGIC REMOTE CONTROLLER MODAL */}
      {isVirtualRemoteOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsVirtualRemoteOpen(false)}
        >
          <div 
            className="relative w-80 bg-gradient-to-b from-[#181920] to-[#0c0d12] border-2 border-slate-700/80 rounded-[40px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-slate-100 flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Remote Close Button */}
            <button
              onClick={() => setIsVirtualRemoteOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Remote Header / Brand */}
            <div className="text-center pt-2">
              <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-sm tracking-wider">
                <Tv className="w-4 h-4" />
                <span>webOS MAGIC REMOTE</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{deviceInfo.modelName}</p>
            </div>

            {/* Power & Mute & Back Row */}
            <div className="grid grid-cols-3 gap-3 w-full px-2">
              <button
                onClick={() => onSimulateKey('Back', 461)}
                className="py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 flex flex-col items-center gap-1 border border-slate-700 active:scale-95 transition-transform"
                title="Geri / Back Tuşu (461)"
              >
                <RotateCcw className="w-4 h-4 text-slate-300" />
                <span className="text-[9px]">BACK</span>
              </button>

              <button
                onClick={() => onSimulateKey('Info', 457)}
                className="py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 flex flex-col items-center gap-1 border border-slate-700 active:scale-95 transition-transform"
                title="Kanal Bilgisi (457)"
              >
                <Info className="w-4 h-4 text-slate-300" />
                <span className="text-[9px]">INFO</span>
              </button>

              <button
                onClick={() => onSimulateKey('Search', 191)}
                className="py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 flex flex-col items-center gap-1 border border-slate-700 active:scale-95 transition-transform"
                title="Arama Odaklanma"
              >
                <Search className="w-4 h-4 text-slate-300" />
                <span className="text-[9px]">SEARCH</span>
              </button>
            </div>

            {/* D-Pad 4-Way Navigation with OK/Wheel Wheel in center */}
            <div className="relative w-48 h-48 bg-slate-900/90 rounded-full border-2 border-slate-700 shadow-inner flex items-center justify-center p-3">
              {/* UP */}
              <button
                onClick={() => onSimulateKey('ArrowUp', 38)}
                className="absolute top-2 w-14 h-11 bg-slate-800 hover:bg-slate-700 active:bg-red-600 rounded-t-full flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                title="Yukarı / Önceki Kanal"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* DOWN */}
              <button
                onClick={() => onSimulateKey('ArrowDown', 40)}
                className="absolute bottom-2 w-14 h-11 bg-slate-800 hover:bg-slate-700 active:bg-red-600 rounded-b-full flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                title="Aşağı / Sonraki Kanal"
              >
                <ChevronDown className="w-5 h-5" />
              </button>

              {/* LEFT */}
              <button
                onClick={() => onSimulateKey('ArrowLeft', 37)}
                className="absolute left-2 w-11 h-14 bg-slate-800 hover:bg-slate-700 active:bg-red-600 rounded-l-full flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                title="Sol / Geri Sar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* RIGHT */}
              <button
                onClick={() => onSimulateKey('ArrowRight', 39)}
                className="absolute right-2 w-11 h-14 bg-slate-800 hover:bg-slate-700 active:bg-red-600 rounded-r-full flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
                title="Sağ / İleri Sar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* OK / Center Wheel */}
              <button
                onClick={() => onSimulateKey('Enter', 13)}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer border border-red-400/50"
                title="Tamam / Oynat / Seç (OK)"
              >
                OK
              </button>
            </div>

            {/* LG 4 Color Function Buttons */}
            <div className="grid grid-cols-4 gap-2.5 w-full px-2">
              <button
                onClick={() => onSimulateKey('Red', 403)}
                className="py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black shadow-md shadow-red-600/30 flex flex-col items-center active:scale-95 transition-all"
                title="Kırmızı (403): Rehber EPG"
              >
                <span>🔴</span>
                <span className="mt-0.5">EPG</span>
              </button>

              <button
                onClick={() => onSimulateKey('Green', 404)}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-600/30 flex flex-col items-center active:scale-95 transition-all"
                title="Yeşil (404): 🇹🇷 Türk TV & Dizi"
              >
                <span>🟢</span>
                <span className="mt-0.5">TÜRK</span>
              </button>

              <button
                onClick={() => onSimulateKey('Yellow', 405)}
                className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black shadow-md shadow-amber-500/30 flex flex-col items-center active:scale-95 transition-all"
                title="Sarı (405): VOD Sinema"
              >
                <span>🟡</span>
                <span className="mt-0.5">VOD</span>
              </button>

              <button
                onClick={() => onSimulateKey('Blue', 406)}
                className="py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black shadow-md shadow-blue-600/30 flex flex-col items-center active:scale-95 transition-all"
                title="Mavi (406): Çoklu Ekran"
              >
                <span>🔵</span>
                <span className="mt-0.5">ÇOKLU</span>
              </button>
            </div>

            {/* Media Playback Controls */}
            <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-900/60 rounded-2xl border border-slate-800">
              <button 
                onClick={() => onSimulateKey('MediaRewind', 412)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white"
                title="Geri Sar"
              >
                <Rewind className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onSimulateKey('MediaPlayPause', 179)}
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg"
                title="Oynat / Duraklat"
              >
                <Play className="w-4 h-4 fill-white" />
              </button>
              <button 
                onClick={() => onSimulateKey('MediaFastForward', 417)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white"
                title="İleri Sar"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Number Keypad (0-9) */}
            <div className="w-full bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => onSimulateKey(`Digit${num}`, 48 + num)}
                    className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white border border-slate-700/60 active:scale-90 transition-transform"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => onSimulateKey('ChannelDown', 428)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700/60"
                >
                  CH-
                </button>
                <button
                  onClick={() => onSimulateKey('Digit0', 48)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white border border-slate-700/60 active:scale-90 transition-transform"
                >
                  0
                </button>
                <button
                  onClick={() => onSimulateKey('ChannelUp', 427)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700/60"
                >
                  CH+
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
