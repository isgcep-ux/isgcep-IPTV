import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useLanguage } from '../i18n/LanguageContext';

interface VoiceSearchButtonProps {
  onSearchResult: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  id?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onSearchResult,
  className = '',
  size = 'sm',
  id = 'voice-search-btn',
}) => {
  const { t } = useLanguage();

  const {
    isSupported,
    isListening,
    interimText,
    errorMessage,
    toggleListening,
    clearError,
  } = useVoiceSearch({
    onResult: (text, isFinal) => {
      onSearchResult(text);
      if (isFinal) {
        // Can add subtle haptic or visual confirmation if needed
      }
    },
  });

  if (!isSupported) {
    return (
      <button
        id={id}
        type="button"
        disabled
        title={t('voiceNotSupported')}
        className={`opacity-40 cursor-not-allowed text-slate-500 hover:text-slate-400 p-1.5 rounded-lg transition-colors ${className}`}
      >
        <MicOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        id={id}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleListening();
        }}
        title={
          isListening
            ? t('voiceClickToStop')
            : errorMessage
            ? errorMessage
            : t('voiceSearch')
        }
        className={`relative group p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
            : errorMessage
            ? 'text-amber-400 hover:bg-amber-500/10'
            : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
        } ${className}`}
      >
        {isListening ? (
          <>
            <Mic className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-bounce`} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </>
        ) : (
          <Mic className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        )}
      </button>

      {/* Floating Active Voice Recognition Toast / Popup */}
      {isListening && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2.5 bg-slate-900/95 border border-red-500/50 rounded-xl shadow-2xl z-50 flex flex-col gap-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>{t('voiceListening')}</span>
          </div>

          <div className="flex items-center gap-1.5 h-4 py-1">
            <div className="w-1 bg-red-500 rounded-full h-2 animate-[pulse_0.4s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-4 animate-[pulse_0.6s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-5 animate-[pulse_0.7s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-2 animate-[pulse_0.4s_ease-in-out_infinite]" />
            <span className="text-[11px] text-slate-400 italic ml-1">
              {interimText ? `"${interimText}"` : t('voiceSpeakNow')}
            </span>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorMessage && (
        <div 
          onClick={clearError}
          className="absolute right-0 top-full mt-2 w-56 p-2 bg-slate-900/95 border border-amber-500/40 rounded-xl shadow-xl z-50 flex items-start gap-2 text-amber-300 text-xs backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-[11px]">{errorMessage}</span>
            <span className="text-[9px] text-slate-400">Tıklayarak kapatın</span>
          </div>
        </div>
      )}
    </div>
  );
};
