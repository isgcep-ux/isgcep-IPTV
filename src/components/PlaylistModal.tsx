import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Link2, 
  Globe2, 
  Download, 
  Trash2, 
  Check, 
  Server, 
  Plus, 
  Layers, 
  Radio, 
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Channel, PlaylistSource } from '../types';
import { parseM3U, exportToM3U } from '../utils/m3uParser';
import { PRESET_PLAYLIST_URLS } from '../data/defaultChannels';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannels: (channels: Channel[], source: PlaylistSource) => void;
  onClearCustomChannels: () => void;
  customPlaylistSources: PlaylistSource[];
  onRemovePlaylistSource: (sourceId: string) => void;
  currentChannels: Channel[];
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onAddChannels,
  onClearCustomChannels,
  customPlaylistSources,
  onRemovePlaylistSource,
  currentChannels,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'presets' | 'xtream' | 'export'>('url');
  
  // URL Tab State
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [useServerProxy, setUseServerProxy] = useState(true);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // File Tab State
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileChannelCount, setFileChannelCount] = useState<number>(0);

  // Xtream Codes Tab State
  const [xtreamServer, setXtreamServer] = useState('');
  const [xtreamUser, setXtreamUser] = useState('');
  const [xtreamPass, setXtreamPass] = useState('');
  const [isLoadingXtream, setIsLoadingXtream] = useState(false);
  const [xtreamError, setXtreamError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle URL Load
  const handleLoadFromUrl = async () => {
    if (!playlistUrl.trim()) return;
    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      let fetchUrl = playlistUrl.trim();
      if (useServerProxy) {
        fetchUrl = `/api/proxy-playlist?url=${encodeURIComponent(fetchUrl)}`;
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Failed to load playlist: HTTP ${res.status}`);
      }

      const text = await res.text();
      const channels = parseM3U(text, 'url');

      if (channels.length === 0) {
        throw new Error('No valid streams found in this M3U playlist file.');
      }

      const source: PlaylistSource = {
        id: `url-source-${Date.now()}`,
        name: playlistName.trim() || 'Custom M3U Feed',
        url: playlistUrl,
        channelCount: channels.length,
        addedAt: new Date().toISOString(),
        type: 'custom_url',
      };

      onAddChannels(channels, source);
      setPlaylistUrl('');
      setPlaylistName('');
      onClose();
    } catch (err: any) {
      setUrlError(err.message || 'Error fetching M3U playlist');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      const parsed = parseM3U(text, 'file');
      setFileChannelCount(parsed.length);
    };
    reader.readAsText(file);
  };

  const handleConfirmFileUpload = () => {
    if (!fileContent) return;
    const channels = parseM3U(fileContent, 'file');
    const source: PlaylistSource = {
      id: `file-source-${Date.now()}`,
      name: fileName || 'Local M3U File',
      channelCount: channels.length,
      addedAt: new Date().toISOString(),
      type: 'custom_file',
    };
    onAddChannels(channels, source);
    setFileContent(null);
    setFileName('');
    onClose();
  };

  // Handle Preset Load
  const handleLoadPreset = async (preset: typeof PRESET_PLAYLIST_URLS[0]) => {
    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      const fetchUrl = `/api/proxy-playlist?url=${encodeURIComponent(preset.url)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const channels = parseM3U(text, preset.id);

      const source: PlaylistSource = {
        id: `preset-${preset.id}-${Date.now()}`,
        name: preset.name,
        url: preset.url,
        channelCount: channels.length,
        addedAt: new Date().toISOString(),
        type: 'builtin',
      };

      onAddChannels(channels, source);
      onClose();
    } catch (err: any) {
      setUrlError(`Failed to load preset: ${err.message}`);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle Xtream Codes Login
  const handleXtreamLogin = async () => {
    if (!xtreamServer || !xtreamUser || !xtreamPass) {
      setXtreamError('Please fill in all Xtream credentials.');
      return;
    }

    setIsLoadingXtream(true);
    setXtreamError(null);

    try {
      const cleanServer = xtreamServer.replace(/\/+$/, '');
      const m3uUrl = `${cleanServer}/get.php?username=${encodeURIComponent(xtreamUser)}&password=${encodeURIComponent(xtreamPass)}&type=m3u_plus&output=m3u8`;
      const proxyUrl = `/api/proxy-playlist?url=${encodeURIComponent(m3uUrl)}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Xtream server returned status: ${res.status}`);
      const text = await res.text();
      const channels = parseM3U(text, 'xtream');

      if (channels.length === 0) {
        throw new Error('Authentication passed but no live channels were returned.');
      }

      const source: PlaylistSource = {
        id: `xtream-${Date.now()}`,
        name: `Xtream (${xtreamUser})`,
        serverUrl: cleanServer,
        username: xtreamUser,
        channelCount: channels.length,
        addedAt: new Date().toISOString(),
        type: 'xtream',
      };

      onAddChannels(channels, source);
      onClose();
    } catch (err: any) {
      setXtreamError(err.message || 'Xtream connection failed. Verify URL and credentials.');
    } finally {
      setIsLoadingXtream(false);
    }
  };

  // Handle Export M3U
  const handleDownloadM3U = (favoritesOnly = false) => {
    const target = favoritesOnly ? currentChannels.filter(c => c.isFavorite) : currentChannels;
    const content = exportToM3U(target, favoritesOnly ? 'My Favorite Channels' : 'IPTV Export');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = favoritesOnly ? 'iptv-favorites.m3u' : 'iptv-channels-export.m3u';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="playlist-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        id="playlist-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Playlist & Stream Manager</h2>
              <p className="text-[11px] text-slate-400">Import M3U, M3U8, Xtream Codes, or Curated Feeds</p>
            </div>
          </div>
          <button
            id="close-playlist-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-950/30 px-4 text-xs font-medium">
          {[
            { id: 'url', label: 'M3U URL', icon: Link2 },
            { id: 'file', label: 'Upload File', icon: Upload },
            { id: 'presets', label: 'Preset Feeds', icon: Globe2 },
            { id: 'xtream', label: 'Xtream Codes', icon: Server },
            { id: 'export', label: 'Export M3U', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-sky-500 text-sky-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Playlist Name (Optional)</label>
                <input
                  id="input-playlist-name"
                  type="text"
                  placeholder="e.g. My Premium Cable Feed"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">M3U / M3U8 Playlist URL</label>
                <input
                  id="input-playlist-url"
                  type="url"
                  placeholder="https://example.com/playlist.m3u8"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="text-slate-200 font-medium">Bypass CORS via Proxy Server</div>
                  <div className="text-[11px] text-slate-400">Routes request through local server to prevent browser CORS blocks.</div>
                </div>
                <input
                  id="toggle-cors-proxy-checkbox"
                  type="checkbox"
                  checked={useServerProxy}
                  onChange={(e) => setUseServerProxy(e.target.checked)}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
              </div>

              {urlError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}

              <button
                id="btn-import-url"
                onClick={handleLoadFromUrl}
                disabled={!playlistUrl.trim() || isLoadingUrl}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingUrl ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Import Playlist</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-800 hover:border-sky-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition-all">
                <input
                  id="playlist-file-input"
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-sky-600/10 text-sky-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-200">
                    {fileName ? fileName : 'Choose M3U / M3U8 File'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {fileChannelCount > 0
                      ? `${fileChannelCount} valid channels detected`
                      : 'Drag & drop or browse from your computer'}
                  </div>
                </div>
              </label>

              {fileContent && (
                <button
                  id="btn-confirm-file-upload"
                  onClick={handleConfirmFileUpload}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Load {fileChannelCount} Channels</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2.5">
              <div className="text-slate-400 text-[11px] mb-2">
                Select from verified global public open IPTV feeds:
              </div>
              {PRESET_PLAYLIST_URLS.map(preset => (
                <div
                  key={preset.id}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-slate-200">{preset.name}</h4>
                    <p className="text-[11px] text-slate-400">{preset.description}</p>
                  </div>
                  <button
                    id={`btn-load-preset-${preset.id}`}
                    onClick={() => handleLoadPreset(preset)}
                    disabled={isLoadingUrl}
                    className="px-3.5 py-1.5 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white rounded-lg font-medium transition-all shrink-0 cursor-pointer"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Xtream Codes */}
          {activeTab === 'xtream' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Server URL</label>
                <input
                  id="input-xtream-server"
                  type="text"
                  placeholder="http://iptv-server.com:8080"
                  value={xtreamServer}
                  onChange={(e) => setXtreamServer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    id="input-xtream-user"
                    type="text"
                    placeholder="user123"
                    value={xtreamUser}
                    onChange={(e) => setXtreamUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    id="input-xtream-pass"
                    type="password"
                    placeholder="••••••••"
                    value={xtreamPass}
                    onChange={(e) => setXtreamPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {xtreamError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  {xtreamError}
                </div>
              )}

              <button
                id="btn-xtream-login"
                onClick={handleXtreamLogin}
                disabled={isLoadingXtream}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingXtream ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <Server className="w-4 h-4" />
                    <span>Connect to Xtream Codes</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 5: Export */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Export All Loaded Channels ({currentChannels.length})</h4>
                  <p className="text-[11px] text-slate-400">Download complete M3U playlist file for VLC, Smart TV, or Kodi.</p>
                </div>
                <button
                  id="btn-export-all-m3u"
                  onClick={() => handleDownloadM3U(false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export M3U</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Export Favorite Channels Only</h4>
                  <p className="text-[11px] text-slate-400">Download only starred favorite channels into a custom playlist.</p>
                </div>
                <button
                  id="btn-export-favs-m3u"
                  onClick={() => handleDownloadM3U(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Favorites</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Playlists Source Manager */}
          {customPlaylistSources.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Playlists</span>
                <button
                  id="btn-clear-all-custom"
                  onClick={onClearCustomChannels}
                  className="text-rose-400 hover:text-rose-300 text-[11px] hover:underline"
                >
                  Clear All Custom
                </button>
              </div>

              <div className="space-y-1.5">
                {customPlaylistSources.map(src => (
                  <div
                    key={src.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{src.name}</div>
                      <div className="text-[10px] text-slate-400">{src.channelCount} Channels • {src.type}</div>
                    </div>
                    <button
                      onClick={() => onRemovePlaylistSource(src.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
