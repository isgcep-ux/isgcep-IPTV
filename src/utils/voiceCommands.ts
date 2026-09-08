import { Channel } from '../types';

export interface VoiceCommandResult {
  type: 'switch_channel' | 'channel_not_found' | 'navigate_channel' | 'search';
  targetChannel?: Channel;
  navigationDirection?: 'next' | 'prev';
  query?: string;
  feedbackText: string;
  recognizedText: string;
}

// Multi-language words mapping to digits
const NUMBER_WORDS: Record<string, number> = {
  // English
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,

  // Turkish
  sıfır: 0,
  bir: 1,
  iki: 2,
  üç: 3,
  uc: 3,
  dört: 4,
  dort: 4,
  beş: 5,
  bes: 5,
  altı: 6,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,

  // German
  null: 0,
  eins: 1,
  ein: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  funf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,

  // Spanish
  cero: 0,
  uno: 1,
  un: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,

  // French
  zéro: 0,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
};

// Generic or category words that should be treated as search rather than channel switches
const GENERIC_SEARCH_TERMS = new Set([
  'movies', 'movie', 'film', 'filmler', 'series', 'dizi', 'diziler',
  'news', 'haber', 'haberler', 'sports', 'sport', 'spor', 'music', 'müzik',
  'comedy', 'action', 'komedi', 'aksiyon', 'nature', 'doğa', 'belgesel',
  'documentary', 'cinema', 'sinema', 'all', 'tümü', 'favorites', 'favoriler',
  'kids', 'çocuk', 'cocuk', 'trailer', 'fragman', 'live', 'canlı', 'canli'
]);

/**
 * Normalizes text for uniform comparison: lowercased, diacritics normalized, extra whitespace stripped.
 */
export function normalizeVoiceText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Replaces spoken number words with digits (e.g. "channel five" -> "channel 5")
 */
export function normalizeNumberWords(text: string): string {
  const words = text.split(/\s+/);
  const mapped = words.map((w) => {
    const clean = normalizeVoiceText(w);
    if (NUMBER_WORDS[clean] !== undefined) {
      return String(NUMBER_WORDS[clean]);
    }
    return w;
  });
  return mapped.join(' ');
}

/**
 * Finds the closest channel match by name or ID.
 */
export function findChannelByName(query: string, channels: Channel[]): Channel | null {
  const cleanQuery = normalizeVoiceText(query);
  if (!cleanQuery) return null;

  // 1. Exact match
  const exact = channels.find((c) => normalizeVoiceText(c.name) === cleanQuery);
  if (exact) return exact;

  // 2. Starts with query (e.g., query "bbc" -> "BBC World News HD")
  const startsWith = channels.find((c) => normalizeVoiceText(c.name).startsWith(cleanQuery));
  if (startsWith) return startsWith;

  // 3. Exact word match in channel name (e.g. word "bbc" in "BBC News" or "Star" in "Star TV")
  const wordMatch = channels.find((c) => {
    const words = normalizeVoiceText(c.name).split(/\s+/);
    return words.includes(cleanQuery);
  });
  if (wordMatch) return wordMatch;

  // 4. tvgId or id match (e.g., tvgId "BBCNews.uk" contains "bbc")
  const idMatch = channels.find((c) => {
    const cleanId = normalizeVoiceText(c.id);
    const cleanTvg = normalizeVoiceText(c.tvgId || '');
    return cleanId.includes(cleanQuery) || cleanTvg.includes(cleanQuery);
  });
  if (idMatch) return idMatch;

  // 5. Substring inclusion if query is at least 3 characters long
  if (cleanQuery.length >= 3) {
    const containsMatch = channels.find((c) => normalizeVoiceText(c.name).includes(cleanQuery));
    if (containsMatch) return containsMatch;
  }

  return null;
}

/**
 * Parses a voice speech transcript into an actionable command (channel switch, next/prev, or search).
 */
export function parseVoiceCommand(
  rawTranscript: string,
  channels: Channel[],
  activeChannel?: Channel | null
): VoiceCommandResult {
  const trimmed = rawTranscript.trim();
  if (!trimmed) {
    return {
      type: 'search',
      query: '',
      feedbackText: '',
      recognizedText: '',
    };
  }

  // Convert spelled-out numbers like "five" to "5", "beş" to "5"
  const normalizedWithDigits = normalizeNumberWords(trimmed);
  const normalized = normalizeVoiceText(normalizedWithDigits);

  // ── 1. Next / Previous Channel Commands ──
  const nextPatterns = [
    'next channel', 'next', 'sonraki kanal', 'sonraki', 'ileriki kanal', 'nachster kanal',
    'siguiente canal', 'siguiente', 'chaine suivante', 'suivante'
  ];
  if (nextPatterns.some((p) => normalized.includes(p))) {
    return {
      type: 'navigate_channel',
      navigationDirection: 'next',
      feedbackText: 'Next Channel',
      recognizedText: trimmed,
    };
  }

  const prevPatterns = [
    'previous channel', 'prev channel', 'previous', 'onceki kanal', 'onceki', 'geri kanal',
    'vorheriger kanal', 'canal anterior', 'anterior', 'chaine precedente', 'precedente'
  ];
  if (prevPatterns.some((p) => normalized.includes(p))) {
    return {
      type: 'navigate_channel',
      navigationDirection: 'prev',
      feedbackText: 'Previous Channel',
      recognizedText: trimmed,
    };
  }

  // ── 2. Direct Channel Number Tuning (e.g. "5", "Channel 5", "Kanal 12", "Switch to channel 5") ──

  // Pattern A: Just a pure number spoken (e.g. "5" or "102")
  const pureNumberMatch = normalized.match(/^(\d{1,4})$/);
  if (pureNumberMatch) {
    const channelNum = parseInt(pureNumberMatch[1], 10);
    const target = channels.find((c) => c.number === channelNum);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Ch. ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: String(channelNum),
      feedbackText: `Channel ${channelNum} not found`,
      recognizedText: trimmed,
    };
  }

  // Pattern B: Prefix with channel word + number (e.g. "channel 5", "kanal 10", "canal 5", "chaîne 4", "no 5", "number 5")
  const channelPrefixNumMatch = normalized.match(
    /(?:switch to|change to|go to|tune to|play|open|watch|select|turn to)?\s*(?:channel|kanal|canal|chaine|ch|sender|station|number|numero|nummer|no)\s*[:#-]?\s*(\d{1,4})/
  );
  if (channelPrefixNumMatch) {
    const channelNum = parseInt(channelPrefixNumMatch[1], 10);
    const target = channels.find((c) => c.number === channelNum);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Ch. ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: String(channelNum),
      feedbackText: `Channel ${channelNum} not found`,
      recognizedText: trimmed,
    };
  }

  // Pattern C: Turkish ordinal / suffix patterns (e.g. "5'e geç", "5'i aç", "5 inci kanal", "5. kanal")
  const turkishNumMatch = normalized.match(
    /(\d{1,4})\s*(?:'e|'a|'ye|'ya|'i|'ı|'ü|'u|\. kanal|\.kanal|inci|inci kanal|ıncı|ıncı kanal|üncü|üncü kanal|uncu|uncu kanal)?\s*(?:gec|ac|izle|oynat|git)?$/
  );
  if (turkishNumMatch && (normalized.includes('gec') || normalized.includes('ac') || normalized.includes('kanal') || normalized.includes('izle'))) {
    const channelNum = parseInt(turkishNumMatch[1], 10);
    const target = channels.find((c) => c.number === channelNum);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Kanal ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: String(channelNum),
      feedbackText: `Kanal ${channelNum} bulunamadı`,
      recognizedText: trimmed,
    };
  }

  // ── 3. Explicit Channel Name Switch Commands (e.g. "Switch to BBC", "Play Bloomberg", "BBC'ye geç", "TRT 1 aç") ──

  // English prefixes: "switch to ...", "change to ...", "go to ...", "tune to ...", "play ...", "open ...", "watch ...", "turn to ..."
  const englishSwitchMatch = normalized.match(
    /^(?:switch to|change to|go to|tune to|play|open|watch|select|turn to|put on)\s+(?:channel\s+)?(.+)$/
  );
  if (englishSwitchMatch) {
    const candidateName = englishSwitchMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Ch. ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `Channel "${candidateName}" not found`,
      recognizedText: trimmed,
    };
  }

  // Turkish switch patterns:
  // "BBC'ye geç", "TRT 1 aç", "ATV'yi aç", "Show TV izle", "kanala geç BBC"
  const turkishPrefixMatch = normalized.match(/^(?:kanala gec|kanala git|kanal ac)\s+(.+)$/);
  if (turkishPrefixMatch) {
    const candidateName = turkishPrefixMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Kanal ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `"${candidateName}" kanalı bulunamadı`,
      recognizedText: trimmed,
    };
  }

  const turkishSuffixMatch = normalized.match(/^(.+?)(?:\s*(?:'e|'a|'ye|'ya|'i|'ı|'ü|'u)|\s+(?:e|a|ye|ya|i|u|ü))?\s+(?:gec|ac|izle|oynat)$/);
  if (turkishSuffixMatch) {
    const candidateName = turkishSuffixMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Kanal ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `"${candidateName}" kanalı bulunamadı`,
      recognizedText: trimmed,
    };
  }

  // German switch patterns: "schalte auf ...", "wechsle zu ...", "öffne ...", "spiele ..."
  const germanSwitchMatch = normalized.match(/^(?:schalte auf|schalte zu|wechsle zu|gehe zu|offne|spiele)\s+(?:kanal\s+)?(.+)$/);
  if (germanSwitchMatch) {
    const candidateName = germanSwitchMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Kanal ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `Sender "${candidateName}" nicht gefunden`,
      recognizedText: trimmed,
    };
  }

  // Spanish switch patterns: "cambiar a ...", "poner ...", "ir a ...", "abrir ..."
  const spanishSwitchMatch = normalized.match(/^(?:cambiar a|cambiar al canal|poner|ir a|ir al canal|abrir|reproducir)\s+(?:canal\s+)?(.+)$/);
  if (spanishSwitchMatch) {
    const candidateName = spanishSwitchMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Canal ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `Canal "${candidateName}" no encontrado`,
      recognizedText: trimmed,
    };
  }

  // French switch patterns: "passer à ...", "mettre ...", "aller à ...", "ouvrir ..."
  const frenchSwitchMatch = normalized.match(/^(?:passer a|passer sur|mettre|aller a|aller sur|ouvrir)\s+(?:la chaine\s+)?(.+)$/);
  if (frenchSwitchMatch) {
    const candidateName = frenchSwitchMatch[1].trim();
    const target = findChannelByName(candidateName, channels);
    if (target) {
      return {
        type: 'switch_channel',
        targetChannel: target,
        feedbackText: `${target.name} (Chaîne ${target.number})`,
        recognizedText: trimmed,
      };
    }
    return {
      type: 'channel_not_found',
      query: candidateName,
      feedbackText: `Chaîne "${candidateName}" non trouvée`,
      recognizedText: trimmed,
    };
  }

  // ── 4. Direct Channel Name Utterance (e.g. user simply says "BBC", "TRT 1", "Bloomberg", "Sky News") ──
  // Check if it is not an explicit generic search term (e.g. "movies", "spor")
  if (!GENERIC_SEARCH_TERMS.has(normalized)) {
    const directChannelMatch = findChannelByName(normalized, channels);
    if (directChannelMatch) {
      return {
        type: 'switch_channel',
        targetChannel: directChannelMatch,
        feedbackText: `${directChannelMatch.name} (Ch. ${directChannelMatch.number})`,
        recognizedText: trimmed,
      };
    }
  }

  // ── 5. Default Fallback: Search ──
  // Strip common "search for" prefixes if present
  let cleanSearchQuery = trimmed;
  const searchPrefix = trimmed.match(/^(?:search for|search|arama|ara|bul|suche nach|suche|buscar|chercher)\s+(.+)$/i);
  if (searchPrefix) {
    cleanSearchQuery = searchPrefix[1];
  }

  return {
    type: 'search',
    query: cleanSearchQuery,
    feedbackText: `Search: "${cleanSearchQuery}"`,
    recognizedText: trimmed,
  };
}
