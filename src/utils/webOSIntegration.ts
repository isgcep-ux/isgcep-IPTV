/**
 * LG webOS & Smart TV Platform Integration Utility
 * Supports LG webOS Magic Remote, D-Pad 4-way navigation, Color keys, Numeric dialer,
 * Back/Exit keys, and screen WakeLock.
 */

export interface WebOSDeviceInfo {
  isWebOS: boolean;
  isSmartTV: boolean;
  modelName: string;
  sdkVersion: string;
  screenResolution: string;
}

// LG webOS and Smart TV Standard Keycodes
export const TV_KEYCODES = {
  // Arrow & Navigation Keys
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  OK: 13,

  // Back / Exit Keys
  BACK: 461,          // LG webOS Return/Back key
  TIZEN_BACK: 10009,  // Samsung Tizen Return key
  ESCAPE: 27,         // Standard browser Esc / Back
  BACKSPACE: 8,

  // LG Magic Remote Color Keys
  RED: 403,           // ColorF0Red (Rehber / EPG)
  GREEN: 404,         // ColorF1Green (Türkçe Dizi & Film)
  YELLOW: 405,        // ColorF2Yellow (VOD / Netflix Hub)
  BLUE: 406,          // ColorF3Blue (Çoklu Ekran / Multi-view)

  // Media Playback Keys
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 179,
  STOP: 413,
  FAST_FORWARD: 417,
  REWIND: 412,
  TRACK_NEXT: 425,
  TRACK_PREV: 424,

  // Channel & Volume Control
  CHANNEL_UP: 427,
  CHANNEL_DOWN: 428,
  PAGE_UP: 33,
  PAGE_DOWN: 34,

  // Info & Guide Keys
  INFO: 457,
  GUIDE: 458,
  MENU: 18,
  TOOLS: 10135,

  // Numeric Keys 0-9
  NUM_0: 48,
  NUM_1: 49,
  NUM_2: 50,
  NUM_3: 51,
  NUM_4: 52,
  NUM_5: 53,
  NUM_6: 54,
  NUM_7: 55,
  NUM_8: 56,
  NUM_9: 57,

  // Numpad 0-9
  NUMPAD_0: 96,
  NUMPAD_1: 97,
  NUMPAD_2: 98,
  NUMPAD_3: 99,
  NUMPAD_4: 100,
  NUMPAD_5: 101,
  NUMPAD_6: 102,
  NUMPAD_7: 103,
  NUMPAD_8: 104,
  NUMPAD_9: 105,
};

/**
 * Detects if the current client is running on an LG webOS Smart TV
 */
export function detectWebOS(): WebOSDeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isWebOS: false,
      isSmartTV: false,
      modelName: 'Unknown',
      sdkVersion: '0',
      screenResolution: '1920x1080',
    };
  }

  const userAgent = navigator.userAgent || '';
  const isWebOS = /Web0S|webOS|SmartTV.*LG/i.test(userAgent) || !!(window as unknown as { PalmSystem?: unknown }).PalmSystem;
  const isSmartTV = isWebOS || /SmartTV|Tizen|Android TV|BRAVIA|NetCast|AppleTV|Roku/i.test(userAgent);

  let modelName = 'LG Smart TV';
  if (isWebOS) {
    const match = userAgent.match(/Web0S[;/]\s*v?([0-9.]+)/i) || userAgent.match(/webOS\/([0-9.]+)/i);
    modelName = match ? `LG webOS TV (v${match[1]})` : 'LG webOS Smart TV';
  } else if (isSmartTV) {
    modelName = 'Smart TV';
  } else {
    modelName = 'Web Browser / Desktop';
  }

  return {
    isWebOS,
    isSmartTV,
    modelName,
    sdkVersion: isWebOS ? 'webOS 6.0+' : 'Standard Web',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

/**
 * Screen WakeLock manager to prevent screen saver / sleep on LG TVs during streaming
 */
let wakeLockSentinel: unknown = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
      return true;
    }
  } catch (err) {
    console.debug('WakeLock not supported or disabled:', err);
  }
  return false;
}

export function releaseScreenWakeLock(): void {
  try {
    if (wakeLockSentinel && typeof (wakeLockSentinel as { release?: () => Promise<void> }).release === 'function') {
      (wakeLockSentinel as { release: () => Promise<void> }).release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.debug('Error releasing WakeLock:', err);
  }
}

/**
 * Spatial D-Pad navigation for remote controls
 * Allows moving focus between interactive items on screen using TV remote arrows
 */
export function navigateSpatialFocus(direction: 'up' | 'down' | 'left' | 'right'): boolean {
  const focusableSelector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href], input:not([disabled]), [data-tv-focusable="true"]';
  const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });

  if (elements.length === 0) return false;

  const activeElement = (document.activeElement as HTMLElement) || elements[0];
  const activeRect = activeElement.getBoundingClientRect();
  const activeCenter = {
    x: activeRect.left + activeRect.width / 2,
    y: activeRect.top + activeRect.height / 2,
  };

  let bestElement: HTMLElement | null = null;
  let bestDistance = Infinity;

  for (const el of elements) {
    if (el === activeElement) continue;

    const rect = el.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const dx = center.x - activeCenter.x;
    const dy = center.y - activeCenter.y;

    let isCandidate = false;
    let primaryWeight = 1;
    let secondaryWeight = 2;

    switch (direction) {
      case 'left':
        if (dx < -10) {
          isCandidate = true;
          primaryWeight = Math.abs(dx);
          secondaryWeight = Math.abs(dy);
        }
        break;
      case 'right':
        if (dx > 10) {
          isCandidate = true;
          primaryWeight = Math.abs(dx);
          secondaryWeight = Math.abs(dy);
        }
        break;
      case 'up':
        if (dy < -10) {
          isCandidate = true;
          primaryWeight = Math.abs(dy);
          secondaryWeight = Math.abs(dx);
        }
        break;
      case 'down':
        if (dy > 10) {
          isCandidate = true;
          primaryWeight = Math.abs(dy);
          secondaryWeight = Math.abs(dx);
        }
        break;
    }

    if (isCandidate) {
      // Score based on direction alignment
      const distance = primaryWeight * 1.2 + secondaryWeight * 2.5;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestElement = el;
      }
    }
  }

  if (bestElement) {
    bestElement.focus();
    bestElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    return true;
  }

  return false;
}
