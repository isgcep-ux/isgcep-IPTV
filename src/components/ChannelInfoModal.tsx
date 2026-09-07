import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Sliders, 
  Lock, 
  Unlock, 
  Activity, 
  RotateCcw, 
  Radio,
  Settings,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Channel, AppLanguage } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ChannelInfoModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  currentPin?: string;
  onOpenPinModal?: () => void;
  isAdultUnlocked?: boolean;
  onLockAdult?: () => void;
  isTVMode?: boolean;
  onToggleTVMode?: () => void;
  totalChannels?: number;
  onResetDefaultChannels?: () => void;
}

type ModalTab = 'settings' | 'channel' | 'diagnostics';

export const ChannelInfoModal: React.FC<ChannelInfoModalProps> = ({
  channel,
  isOpen,
  onClose,
  currentPin = '0000',
  onOpenPinModal,
  isAdultUnlocked = false,
  onLockAdult,
  isTVMode = false,
  onToggleTVMode,
  totalChannels = 0,
  onResetDefaultChannels,
}) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [activeTab, setActiveTab] = useState<ModalTab>('settings');
  const [copied, setCopied] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    if (!channel?.url) return;
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm(t('resetConfirm'))) {
      if (onResetDefaultChannels) {
        onResetDefaultChannels();
        setResetMessage(t('resetDone'));
        setTimeout(() => setResetMessage(null), 3000);
      }
    }
  };

  return (
    <div
      id="channel-info-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="channel-info-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t('settingsTitle')}
              </h2>
              <p className="text-[11px] text-slate-400">
                IPTV PRO • {totalChannels > 0 ? `${totalChannels} ${t('channelsAndVodCount')}` : 'System Settings'}
              </p>
            </div>
          </div>

          <button
            id="close-channel-info-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 px-4">
          <button
            id="modal-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('tabAppSettings')}</span>
          </button>

          {channel && (
            <button
              id="modal-tab-channel"
              onClick={() => setActiveTab('channel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'channel'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{t('tabChannelInfo')}</span>
            </button>
          )}

          <button
            id="modal-tab-diagnostics"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('tabPlayerDiag')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* ── TAB 1: APPLICATION SETTINGS ────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Application Language Selector */}
              <div 
                id="application-language-selector-section"
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white text-sm">
                      {t('appLanguage')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 uppercase">
                    {language.toUpperCase()}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('appLanguageDesc')}
                </p>

                {/* Language Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {availableLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        id={`language-option-${lang.code}`}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-600/30 to-indigo-600/30 border-sky-500 text-white shadow-md shadow-sky-500/10'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0 select-none">{lang.flag}</span>
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{lang.nativeName}</span>
                              {lang.code === 'tr' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-red-600 text-white font-black">
                                  TR
                                </span>
                              )}
                              {lang.code === 'en' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-600 text-white font-black">
                                  EN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {lang.name}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 shrink-0 shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart TV & Remote Mode */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      {t('smartTvMode')}
                    </span>
                  </div>
                  {onToggleTVMode && (
                    <button
                      id="toggle-tv-mode-settings-btn"
                      onClick={onToggleTVMode}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isTVMode
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isTVMode ? 'AKTİF (ON)' : 'KAPALI (OFF)'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('smartTvModeDesc')}
                </p>
              </div>

              {/* Parental PIN & Adult Controls */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white text-xs">
                      {t('parentalPinSettings')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdultUnlocked ? (
                      <button
                        onClick={onLockAdult}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {t('lockAdult')}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenPinModal) onOpenPinModal();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {t('unlockAdult')}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('parentalPinDesc')}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">
                    {t('currentPinIs')}: <span className="font-mono text-slate-200 font-bold tracking-widest">••••</span>
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenPinModal) onOpenPinModal();
                    }}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    {t('changePin')} →
                  </button>
                </div>
              </div>

              {/* Storage and Data Reset */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">
                      {t('storageAndCache')}
                    </span>
                  </div>
                  <button
                    id="reset-channels-defaults-btn"
                    onClick={handleReset}
                    className="px-3 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-400 hover:border-red-800 border border-slate-700 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                  >
                    {t('resetToDefaults')}
                  </button>
                </div>
                {resetMessage && (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-in fade-in">
                    ✓ {resetMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: CHANNEL INFO ────────────────────────────────── */}
          {activeTab === 'channel' && channel && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-14 h-14 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <span>{t('channelNumber')} {channel.number}</span>
                    {channel.isAdult && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                        +18
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">{channel.name}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {channel.group} • {channel.country || 'Global'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">{t('category')}:</span>
                  <span className="font-semibold text-slate-200">{channel.group}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">{t('broadcastQuality')}:</span>
                  <span className="font-mono text-sky-400 font-semibold">{channel.resolution || '1080p'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">{t('countryRegion')}:</span>
                  <span className="text-slate-200">{channel.country || 'Global'} ({channel.language || 'TR/EN'})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('tvgId')}:</span>
                  <span className="font-mono text-slate-400 text-[11px]">{channel.tvgId || 'N/A'}</span>
                </div>
              </div>

              {/* Stream URL */}
              <div className="space-y-1">
                <label className="block text-slate-400 font-medium text-[11px]">
                  {t('directStreamUrl')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={channel.url}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-[11px] select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t('copied') : t('copy')}</span>
                  </button>
                </div>
              </div>

              {/* External Media Players Launch */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  {t('openExternalPlayer')}
                </span>
                <div className="flex gap-2">
                  <a
                    href={`vlc://${channel.url}`}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                    <span>{t('vlcPlayer')}</span>
                  </a>
                  <a
                    href={`iina://weblink?url=${encodeURIComponent(channel.url)}`}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('iinaPlayer')}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: DIAGNOSTICS & TELEMETRY ─────────────────────── */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>{t('activeStreamsDiagnostics')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">{t('streamFormat')}</span>
                    <span className="font-bold text-white font-mono">{channel?.streamType?.toUpperCase() || 'HLS (.M3U8)'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">{t('resolution')}</span>
                    <span className="font-bold text-emerald-400 font-mono">{channel?.resolution || '1080p FULL HD'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">{t('bufferHealth')}</span>
                    <span className="font-bold text-sky-400 font-mono">12.4s (Optimal)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">{t('latency')}</span>
                    <span className="font-bold text-slate-200 font-mono">~180ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{availableLanguages.find(l => l.code === language)?.flag} {availableLanguages.find(l => l.code === language)?.nativeName}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
