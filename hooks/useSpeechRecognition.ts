import { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---

interface ISpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: { transcript: string };
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: ISpeechRecognitionResult;
  };
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
}

interface IWindowShim {
  SpeechRecognition?: { new (): ISpeechRecognition };
  webkitSpeechRecognition?: { new (): ISpeechRecognition };
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

/**
 * Custom hook for consuming the Web Speech API.
 * Provides browser support checks, lifecycle management, and transcript state.
 *
 * @returns {UseSpeechRecognitionReturn}
 */
export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowShim;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);


  useEffect(() => {
    if (!isSupported) return;

    const win = window as unknown as IWindowShim;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) return;

    const instance = new SpeechConstructor();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'id-ID';

    instance.onstart = () => setIsListening(true);
    instance.onend = () => setIsListening(false);
    
    instance.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error('SpeechRecognition error:', event.error);
      setError(event.error);
      setIsListening(false);
    };

    instance.onresult = (event: ISpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognitionRef.current = instance;

    return () => {
      instance.stop();
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
};