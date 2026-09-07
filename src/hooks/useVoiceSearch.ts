import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionResultItem;
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
};

export interface UseVoiceSearchOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceSearch(options?: UseVoiceSearchOptions) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setErrorMessage(t('voiceNotSupported'));
      optionsRef.current?.onError?.(t('voiceNotSupported'));
      return;
    }

    setErrorMessage(null);
    setTranscript('');
    setInterimText('');

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_LOCALE_MAP[language] || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let finalResult = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalResult += res[0].transcript;
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (finalResult) {
          const cleanedText = finalResult.trim();
          setTranscript(cleanedText);
          setInterimText('');
          optionsRef.current?.onResult?.(cleanedText, true);
        } else if (currentInterim) {
          setInterimText(currentInterim);
          optionsRef.current?.onResult?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech Recognition Error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage(t('voicePermissionDenied'));
          optionsRef.current?.onError?.(t('voicePermissionDenied'));
        } else if (event.error === 'no-speech') {
          // User stayed silent, gentle timeout
          setErrorMessage(null);
        } else {
          setErrorMessage(event.error);
          optionsRef.current?.onError?.(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error('Failed to initialize speech recognition', err);
      const msg = err instanceof Error ? err.message : t('voiceNotSupported');
      setErrorMessage(msg);
      optionsRef.current?.onError?.(msg);
      setIsListening(false);
    }
  }, [language, t]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimText,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setErrorMessage(null),
  };
}
