import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Tv, Search, CheckCircle2 } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useLanguage } from '../i18n/LanguageContext';
import { Channel } from '../types';
import { parseVoiceCommand, VoiceCommandResult } from '../utils/voiceCommands';

interface VoiceSearchButtonProps {
  onSearchResult?: (text: string) => void;
  onSelectChannel?: (channel: Channel) => void;
  channels?: Channel[];
  activeChannel?: Channel | null;
  onNavigateChannel?: (direction: 'next' | 'prev') => void;
  className?: string;
  size?: 'sm' | 'md';
  id?: string;
}

interface VoiceFeedbackState {
  type: 'success' | 'warning' | 'info';
  title: string;
  subtitle?: string;
  channel?: Channel;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onSearchResult,
  onSelectChannel,
  channels = [],
  activeChannel,
  onNavigateChannel,
  className = '',
  size = 'sm',
  id = 'voice-search-btn',
}) => {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState<VoiceFeedbackState | null>(null);

  // Auto-dismiss feedback popup after 3.5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleSpeechResult = (text: string, isFinal: boolean) => {
    if (!isFinal) return;

    // If channels and onSelectChannel are available, process as a rich voice command
    if (channels.length > 0 && onSelectChannel) {
      const result: VoiceCommandResult = parseVoiceCommand(text, channels, activeChannel);

      if (result.type === 'switch_channel' && result.targetChannel) {
        onSelectChannel(result.targetChannel);
        setFeedback({
          type: 'success',
          title: `${t('voiceSwitchedTo')} ${result.targetChannel.name}`,
          subtitle: `Ch. ${result.targetChannel.number} • ${result.targetChannel.group}`,
          channel: result.targetChannel,
        });
        return;
      }

      if (result.type === 'navigate_channel' && result.navigationDirection) {
        if (onNavigateChannel) {
          onNavigateChannel(result.navigationDirection);
        } else if (activeChannel) {
          const currentIndex = channels.findIndex((c) => c.id === activeChannel.id);
          if (currentIndex !== -1) {
            const nextIdx =
              result.navigationDirection === 'next'
                ? (currentIndex + 1) % channels.length
                : (currentIndex - 1 + channels.length) % channels.length;
            const nextChannel = channels[nextIdx];
            if (nextChannel) {
              onSelectChannel(nextChannel);
              setFeedback({
                type: 'success',
                title: `${t('voiceSwitchedTo')} ${nextChannel.name}`,
                subtitle: `Ch. ${nextChannel.number}`,
                channel: nextChannel,
              });
              return;
            }
          }
        }
        setFeedback({
          type: 'info',
          title: result.navigationDirection === 'next' ? t('nextChannel') : t('prevChannel'),
        });
        return;
      }

      if (result.type === 'channel_not_found') {
        const query = result.query || text;
        onSearchResult?.(query);
        setFeedback({
          type: 'warning',
          title: t('voiceChannelNotFound'),
          subtitle: `"${query}"`,
        });
        return;
      }

      // Default fallback: regular search
      const query = result.query || text;
      onSearchResult?.(query);
      setFeedback({
        type: 'info',
        title: `${t('voiceSearching')} "${query}"`,
      });
      return;
    }

    // Fallback if no channels provided: straight search query
    onSearchResult?.(text);
    setFeedback({
      type: 'info',
      title: `${t('voiceSearching')} "${text}"`,
    });
  };

  const {
    isSupported,
    isListening,
    interimText,
    errorMessage,
    toggleListening,
    clearError,
  } = useVoiceSearch({
    onResult: (text, isFinal) => {
      handleSpeechResult(text, isFinal);
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
          setFeedback(null);
          toggleListening();
        }}
        title={
          isListening
            ? t('voiceClickToStop')
            : errorMessage
            ? errorMessage
            : `${t('voiceSearch')} (${t('voiceCommandExamples')})`
        }
        className={`relative group p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse ring-2 ring-red-400/60'
            : feedback?.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900/98 border border-red-500/60 rounded-xl shadow-2xl z-50 flex flex-col gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>{t('voiceListening')}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live</span>
          </div>

          <div className="flex items-center gap-1.5 h-5 py-1">
            <div className="w-1 bg-red-500 rounded-full h-2 animate-[pulse_0.4s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-5 animate-[pulse_0.6s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-6 animate-[pulse_0.7s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-4 animate-[pulse_0.4s_ease-in-out_infinite]" />
            <div className="w-1 bg-red-500 rounded-full h-2 animate-[pulse_0.6s_ease-in-out_infinite]" />
            <span className="text-xs text-slate-200 font-medium ml-1.5 truncate">
              {interimText ? `"${interimText}"` : t('voiceSpeakNow')}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">{t('voiceCommandExamples')}</span>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {feedback && !isListening && (
        <div
          onClick={() => setFeedback(null)}
          className={`absolute right-0 top-full mt-2 w-72 p-2.5 rounded-xl shadow-2xl z-50 flex items-start gap-2.5 backdrop-blur-md cursor-pointer animate-in fade-in zoom-in-95 duration-200 border ${
            feedback.type === 'success'
              ? 'bg-slate-900/98 border-emerald-500/60 text-emerald-300'
              : feedback.type === 'warning'
              ? 'bg-slate-900/98 border-amber-500/60 text-amber-300'
              : 'bg-slate-900/98 border-sky-500/60 text-sky-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Tv className="w-4 h-4" />
            </div>
          ) : feedback.type === 'warning' ? (
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
              <Search className="w-4 h-4" />
            </div>
          )}

          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-slate-100 truncate">
                {feedback.title}
              </span>
              {feedback.type === 'success' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </div>
            {feedback.subtitle && (
              <span className="text-[11px] text-slate-400 truncate">
                {feedback.subtitle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorMessage && !isListening && (
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
