import React from 'react';
import { X, Keyboard, Tv, Radio, Layers, Volume2, Maximize, Play, Camera, Activity } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '↑ / ↓', desc: 'Previous / Next Channel (Zapping)' },
    { key: '← / →', desc: 'Volume Down / Volume Up' },
    { key: 'Space', desc: 'Play / Pause Video Stream' },
    { key: 'M', desc: 'Toggle Audio Mute / Unmute' },
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'P', desc: 'Toggle Picture-in-Picture (PiP)' },
    { key: 'G', desc: 'Switch to TV Guide (EPG Timeline)' },
    { key: 'Q', desc: 'Toggle Multi-View Quad Screen' },
    { key: 'T', desc: '🇹🇷 Türk Dizi & Sinema Hub' },
    { key: 'N', desc: 'Netflix VOD Hub' },
    { key: 'P', desc: 'Prime Video Hub' },
    { key: 'V', desc: 'VOD Cinema Hub' },
    { key: 'S', desc: 'Capture Broadcast Screenshot' },
    { key: 'D', desc: 'Toggle Stream Diagnostics HUD' },
    { key: '/', desc: 'Focus Quick Channel Search' },
    { key: '🎙️ Mic', desc: 'Voice Commands & Search (e.g. "Switch to BBC", "Channel 5")' },
    { key: '0 - 9', desc: 'Direct Channel Number Tuning (e.g. 1-0-2)' },
    { key: 'Esc', desc: 'Close Modals / Exit Fullscreen' },
  ];

  return (
    <div
      id="shortcuts-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        id="shortcuts-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95"
      >
        <button
          id="close-shortcuts-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">LG webOS & Klavye Kısayolları</h3>
            <p className="text-xs text-slate-400">Akıllı TV kumandası veya klavye ile tam kontrol</p>
          </div>
        </div>

        {/* LG Magic Remote Color Keys Bar */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span>Kırmızı: EPG Rehber</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Yeşil: 🇹🇷 Türk TV</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>Sarı: VOD Hub</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Mavi: Çoklu Ekran</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-6 max-h-64 overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800"
            >
              <span className="text-slate-300 text-[11px]">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-red-300 font-mono font-bold text-[10px] border border-slate-700 shadow-sm shrink-0 ml-2">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
