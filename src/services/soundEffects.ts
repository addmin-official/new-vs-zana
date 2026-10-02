/**
 * ZANA Subtle Audio Feedback Service (دەنگی کارلێکی زیرەک)
 *
 * Uses the Web Audio API to synthesize gentle, non-intrusive sound effects
 * for educational feedback:
 * - Success tone: subtle ascending harmonic chime (encouraging, calm)
 * - Error tone: soft descending dual tone (gentle, constructive, non-punishing)
 * - Interaction tone: soft tactile tap/pop (sending prompts, selecting options)
 * - Tutor response tone: pleasant double bell when AI response arrives
 * - Completion tone: joyful arpeggio when assessment is finished
 *
 * Features:
 * - 100% offline, zero audio file downloads or network latency
 * - Safe for headless/Node/test environments (graceful no-op)
 * - Auto-resumes suspended AudioContext on user interaction
 * - Global mute/unmute state persisted in localStorage
 */

const SOUND_STORAGE_KEY = "zana_sound_enabled";

// In-memory audio context singleton
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Checks whether audio feedback is enabled.
 * Defaults to true if not set.
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.localStorage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return false;
    const saved = storage.getItem(SOUND_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

/**
 * Updates the audio feedback preference and notifies listeners.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const storage = window.localStorage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (storage) {
      storage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
    }
    if (typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("zana_sound_toggle", { detail: { enabled } })
      );
    }
  } catch {
    // Ignore storage quota/security errors
  }
}

/**
 * Toggles sound enabled state and returns new value.
 */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  return next;
}

/**
 * Helper to create an envelope-controlled tone
 */
function playTone({
  frequency,
  type = "sine",
  duration = 0.2,
  startTimeOffset = 0,
  startGain = 0.08,
  endGain = 0.0001,
  targetFrequency,
}: {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  startTimeOffset?: number;
  startGain?: number;
  endGain?: number;
  targetFrequency?: number;
}) {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime + startTimeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (targetFrequency && targetFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(targetFrequency, now + duration);
    }

    // Soft attack & exponential release envelope to avoid clicks
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(startGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(endGain, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    // Graceful silence on any Web Audio anomaly
  }
}

/**
 * 1. Subtle Success Tone
 * A soft, warm two-note harmonic major chime (F5 -> A5)
 * Conveying positive reinforcement without being startling.
 */
export function playSuccessTone(): void {
  if (!isSoundEnabled()) return;
  // First note: F5 (698.46 Hz)
  playTone({
    frequency: 698.46,
    type: "sine",
    duration: 0.16,
    startTimeOffset: 0,
    startGain: 0.09,
  });
  // Second note: A5 (880.00 Hz)
  playTone({
    frequency: 880.0,
    type: "sine",
    duration: 0.24,
    startTimeOffset: 0.08,
    startGain: 0.1,
  });
}

/**
 * 2. Subtle Error Tone
 * A gentle, constructive low dual-tone (F4 -> D4)
 * Soft and polite so the student feels guided rather than punished.
 */
export function playErrorTone(): void {
  if (!isSoundEnabled()) return;
  // First note: F4 (349.23 Hz)
  playTone({
    frequency: 349.23,
    type: "triangle",
    duration: 0.12,
    startTimeOffset: 0,
    startGain: 0.07,
  });
  // Second note: D4 (293.66 Hz)
  playTone({
    frequency: 293.66,
    type: "triangle",
    duration: 0.18,
    startTimeOffset: 0.08,
    startGain: 0.06,
  });
}

/**
 * 3. Subtle Interaction Tone
 * A faint, tactile tap sound for sending a question or selecting options.
 */
export function playInteractionTone(): void {
  if (!isSoundEnabled()) return;
  playTone({
    frequency: 720,
    targetFrequency: 360,
    type: "sine",
    duration: 0.045,
    startTimeOffset: 0,
    startGain: 0.04,
  });
}

/**
 * 4. Subtle Tutor Response Tone
 * A welcoming, calm double bell tone when the AI Tutor's explanation arrives.
 */
export function playTutorResponseTone(): void {
  if (!isSoundEnabled()) return;
  // Soft high note: E5 (659.25 Hz)
  playTone({
    frequency: 659.25,
    type: "sine",
    duration: 0.18,
    startTimeOffset: 0,
    startGain: 0.07,
  });
  // Harmonizing second note: B5 (987.77 Hz)
  playTone({
    frequency: 987.77,
    type: "sine",
    duration: 0.26,
    startTimeOffset: 0.09,
    startGain: 0.08,
  });
}

/**
 * 5. Assessment / Module Completion Tone
 * A joyful, inspiring arpeggio (C5 -> E5 -> G5 -> C6) celebrating completion.
 */
export function playCompletionTone(): void {
  if (!isSoundEnabled()) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    playTone({
      frequency: freq,
      type: "sine",
      duration: 0.22,
      startTimeOffset: idx * 0.07,
      startGain: 0.08,
    });
  });
}
