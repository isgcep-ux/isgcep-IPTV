import { Channel } from '../types';

/**
 * Parses raw M3U/M3U8 string into structured Channel array
 */
export function parseM3U(content: string, playlistPrefix = 'ext'): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentGroup = 'General';
  let currentChannel: Partial<Channel> | null = null;
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTGRP:')) {
      currentGroup = line.substring(8).trim() || 'General';
      if (currentChannel) {
        currentChannel.group = currentGroup;
      }
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      // Format: #EXTINF:-1 tvg-id="id" tvg-name="name" tvg-logo="url" group-title="group", Channel Name
      const extinfMatch = line.match(/^#EXTINF:([^,]*),(.*)$/);
      const attributesStr = extinfMatch ? extinfMatch[1] : line.substring(8);
      const rawName = extinfMatch ? extinfMatch[2].trim() : 'Live Channel';

      // Extract attributes with regex
      const getAttr = (key: string): string => {
        const regex = new RegExp(`${key}="([^"]*)"`, 'i');
        const match = attributesStr.match(regex);
        if (match && match[1]) return match[1].trim();

        // Try unquoted
        const unquotedRegex = new RegExp(`${key}=([^\\s,]+)`, 'i');
        const unquotedMatch = attributesStr.match(unquotedRegex);
        return unquotedMatch && unquotedMatch[1] ? unquotedMatch[1].trim() : '';
      };

      const tvgId = getAttr('tvg-id');
      const tvgName = getAttr('tvg-name');
      const tvgLogo = getAttr('tvg-logo') || getAttr('logo');
      const groupTitle = getAttr('group-title') || getAttr('group') || currentGroup;
      const country = getAttr('tvg-country') || getAttr('country');
      const language = getAttr('tvg-language') || getAttr('language');

      const name = tvgName || rawName || `Channel ${counter}`;

      // Detect resolution from name
      let resolution = '1080p';
      const upperName = (name + ' ' + line).toUpperCase();
      if (upperName.includes('4K') || upperName.includes('UHD') || upperName.includes('2160P')) {
        resolution = '4K';
      } else if (upperName.includes('FHD') || upperName.includes('1080P') || upperName.includes('1080I')) {
        resolution = '1080p';
      } else if (upperName.includes('HD') || upperName.includes('720P')) {
        resolution = '720p';
      } else if (upperName.includes('SD') || upperName.includes('480P') || upperName.includes('576P')) {
        resolution = '480p';
      }

      currentChannel = {
        id: `${playlistPrefix}-${counter}-${Date.now().toString(36)}`,
        number: counter,
        name: cleanChannelName(name),
        logo: tvgLogo || generatePlaceholderLogo(name),
        group: categorizeChannel(groupTitle, name),
        country: country || 'US',
        language: language || 'English',
        tvgId: tvgId || `${name.toLowerCase().replace(/\s+/g, '.')}`,
        resolution,
        isFavorite: false,
        isCustom: true,
        streamType: 'hls',
      };
      continue;
    }

    // Line is a URL
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('/api/')) {
      if (currentChannel) {
        currentChannel.url = line;
        channels.push(currentChannel as Channel);
        counter++;
        currentChannel = null;
      }
    }
  }

  return channels;
}

/**
 * Clean up channel names by removing ugly prefixes or bracketed noise
 */
function cleanChannelName(name: string): string {
  return name
    .replace(/^\[.*?\]\s*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligently categorize channel into standard groupings
 */
function categorizeChannel(group: string, name: string): string {
  const combined = `${group} ${name}`.toLowerCase();

  if (combined.includes('news') || combined.includes('info') || combined.includes('cnn') || combined.includes('bbc') || combined.includes('dw')) {
    return 'News';
  }
  if (combined.includes('sport') || combined.includes('espn') || combined.includes('football') || combined.includes('soccer') || combined.includes('racing') || combined.includes('nba')) {
    return 'Sports';
  }
  if (combined.includes('movie') || combined.includes('cinema') || combined.includes('film') || combined.includes('hbo') || combined.includes('vod')) {
    return 'Movies';
  }
  if (combined.includes('music') || combined.includes('mtv') || combined.includes('radio') || combined.includes('dance') || combined.includes('rock') || combined.includes('pop')) {
    return 'Music';
  }
  if (combined.includes('doc') || combined.includes('nat') || combined.includes('geo') || combined.includes('wild') || combined.includes('science') || combined.includes('space') || combined.includes('nasa')) {
    return 'Science';
  }
  if (combined.includes('tech') || combined.includes('game') || combined.includes('gaming') || combined.includes('esport')) {
    return 'Tech';
  }
  if (combined.includes('kid') || combined.includes('cartoon') || combined.includes('disney') || combined.includes('anime')) {
    return 'Kids';
  }

  return group && group !== 'General' ? group : 'Entertainment';
}

function generatePlaceholderLogo(name: string): string {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'TV')}&background=1e293b&color=38bdf8&size=128&bold=true`;
}

/**
 * Generate M3U playlist file content from channel list for export
 */
export function exportToM3U(channels: Channel[], playlistName = 'My IPTV Playlist'): string {
  let output = `#EXTM3U x-tvg-url="" tvg-shift=""\n#PLAYLIST:${playlistName}\n\n`;

  for (const ch of channels) {
    output += `#EXTINF:-1 tvg-id="${ch.tvgId || ''}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.group}" tvg-country="${ch.country || ''}" tvg-language="${ch.language || ''}",${ch.name}\n`;
    output += `${ch.url}\n\n`;
  }

  return output;
}
