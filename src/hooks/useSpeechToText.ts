import { useState, useEffect, useRef, useCallback } from "react";

// SpeechRecognition interfaces for cross-browser Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechToTextOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechToText(options?: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognitionClass));
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      const err = "وێبگەڕەکەت پشتگیری لە تۆمارکردنی دەنگ (Speech Recognition) ناکات. تکایە Google Chrome یان Edge بەکاربهێنە.";
      setError(err);
      options?.onError?.(err);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Prefer Kurdish (Sorani/Central Kurdish), fallback to Arabic/English if needed
      recognition.lang = "ckb";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTrans = "";
        let interimTrans = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            finalTrans += text + " ";
          } else {
            interimTrans += text;
          }
        }

        if (finalTrans) {
          setTranscript((prev) => {
            const next = (prev ? prev.trim() + " " : "") + finalTrans.trim();
            options?.onResult?.(next, true);
            return next;
          });
        }

        setInterimTranscript(interimTrans);
        if (interimTrans && !finalTrans) {
          options?.onResult?.(interimTrans, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("[SpeechRecognition Error]", event.error);
        if (event.error === "not-allowed") {
          const err = "ڕێگە بە مایکرۆفۆن نەدراوە. تکایە لە ڕێکخستنی براوسەرەکەت مۆڵەتی مایکرۆفۆن بە زانا بدە.";
          setError(err);
          options?.onError?.(err);
        } else if (event.error === "language-not-supported") {
          // If ckb language code is not supported by engine, gracefully switch to Arabic/auto
          try {
            recognition.lang = "ar-IQ";
            recognition.start();
            return;
          } catch {
            setError("زمانی دەنگی دیاریکراو پشتگیری نەکراوە.");
          }
        } else if (event.error !== "no-speech") {
          setError(`هەڵەی تۆمارکردنی دەنگ: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("[startListening error]", e);
      setIsListening(false);
      setError("کێشەیەک ڕوویدا لە دەستپێکردنی مایکرۆفۆن.");
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current.abort();
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}
