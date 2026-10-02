import { useState, useEffect, useCallback } from "react";
import {
  isSoundEnabled,
  setSoundEnabled,
  toggleSound,
  playSuccessTone,
  playErrorTone,
  playInteractionTone,
  playTutorResponseTone,
  playCompletionTone,
} from "../services/soundEffects.ts";

export function useSoundEffects() {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === "boolean") {
        setSoundEnabledState(customEvent.detail.enabled);
      } else {
        setSoundEnabledState(isSoundEnabled());
      }
    };

    window.addEventListener("zana_sound_toggle", handleToggle);
    window.addEventListener("storage", handleToggle);

    return () => {
      window.removeEventListener("zana_sound_toggle", handleToggle);
      window.removeEventListener("storage", handleToggle);
    };
  }, []);

  const handleToggle = useCallback(() => {
    const next = toggleSound();
    setSoundEnabledState(next);
    return next;
  }, []);

  const handleSetSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundEnabledState(enabled);
  }, []);

  return {
    soundEnabled,
    toggleSound: handleToggle,
    setSoundEnabled: handleSetSound,
    playSuccess: playSuccessTone,
    playError: playErrorTone,
    playInteraction: playInteractionTone,
    playTutorResponse: playTutorResponseTone,
    playCompletion: playCompletionTone,
  };
}
