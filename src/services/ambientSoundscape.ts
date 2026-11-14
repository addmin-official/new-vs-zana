/**
 * ZANA Procedural Ambient Soundscape Engine (دەنگی ژینگە و تەرکیزی ئەلیکترۆنی)
 *
 * Uses the Web Audio API to procedurally generate soothing background audio
 * for deep study focus without external mp3 dependencies:
 * - Rain (بارانی دارستان): Filtered pink noise with gentle random droplet variation
 * - Library (کتێبخانەی بێدەنگ): Warm brown noise for deep focus (eliminates background chatter)
 * - Waves (شەپۆلی ئارامی دەریا): Low-frequency noise with slow rhythmic swell (LFO wave modulation)
 * - Cafe (کافێتریای فێربوون): Layered acoustic warmth with soft diffuse resonance
 */

export type AmbientSoundType = "rain" | "library" | "waves" | "cafe";

interface ChannelNodes {
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
  filter: BiquadFilterNode | null;
  lfo?: OscillatorNode | null;
  lfoGain?: GainNode | null;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;

const channels: Record<AmbientSoundType, ChannelNodes> = {
  rain: { source: null, gain: null, filter: null },
  library: { source: null, gain: null, filter: null },
  waves: { source: null, gain: null, filter: null, lfo: null, lfoGain: null },
  cafe: { source: null, gain: null, filter: null },
};

const currentVolumes: Record<AmbientSoundType, number> = {
  rain: 60,
  library: 40,
  waves: 30,
  cafe: 20,
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

/**
 * Generates a 5-second loopable noise buffer
 */
function createNoiseBuffer(ctx: AudioContext, type: "white" | "pink" | "brown"): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferLength = sampleRate * 5; // 5 seconds of seamless noise
  const buffer = ctx.createBuffer(2, bufferLength, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    if (type === "white") {
      for (let i = 0; i < bufferLength; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === "brown") {
      let lastOut = 0.0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // Gain scaling for warmth
      }
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
  }

  return buffer;
}

/**
 * Initializes and starts all ambient soundscape generators
 */
export async function startAmbientSoundscape(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (isPlaying) return true;

    // Master Gain
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // 1. Rain Channel (Pink noise + Bandpass/Lowpass)
    const rainBuffer = createNoiseBuffer(ctx, "pink");
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.setValueAtTime(1400, ctx.currentTime);

    const rainGain = ctx.createGain();
    const rainVol = (currentVolumes.rain / 100) * 0.35;
    rainGain.gain.setValueAtTime(rainVol, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);
    rainSource.start(0);

    channels.rain = { source: rainSource, gain: rainGain, filter: rainFilter };

    // 2. Library Channel (Deep Brown Noise for concentration)
    const libBuffer = createNoiseBuffer(ctx, "brown");
    const libSource = ctx.createBufferSource();
    libSource.buffer = libBuffer;
    libSource.loop = true;

    const libFilter = ctx.createBiquadFilter();
    libFilter.type = "lowpass";
    libFilter.frequency.setValueAtTime(320, ctx.currentTime);

    const libGain = ctx.createGain();
    const libVol = (currentVolumes.library / 100) * 0.45;
    libGain.gain.setValueAtTime(libVol, ctx.currentTime);

    libSource.connect(libFilter);
    libFilter.connect(libGain);
    libGain.connect(masterGain);
    libSource.start(0);

    channels.library = { source: libSource, gain: libGain, filter: libFilter };

    // 3. Waves Channel (Brown noise + slow 0.1Hz LFO swell)
    const waveBuffer = createNoiseBuffer(ctx, "brown");
    const waveSource = ctx.createBufferSource();
    waveSource.buffer = waveBuffer;
    waveSource.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = "lowpass";
    waveFilter.frequency.setValueAtTime(450, ctx.currentTime);

    const waveGain = ctx.createGain();
    const waveBaseVol = (currentVolumes.waves / 100) * 0.4;
    waveGain.gain.setValueAtTime(waveBaseVol, ctx.currentTime);

    // LFO for rhythmic ocean swell (period ~10s = 0.1Hz)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(waveBaseVol * 0.7, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    lfo.start(0);

    waveSource.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(masterGain);
    waveSource.start(0);

    channels.waves = {
      source: waveSource,
      gain: waveGain,
      filter: waveFilter,
      lfo,
      lfoGain,
    };

    // 4. Cafe Channel (Layered pink noise + acoustic room frequency)
    const cafeBuffer = createNoiseBuffer(ctx, "pink");
    const cafeSource = ctx.createBufferSource();
    cafeSource.buffer = cafeBuffer;
    cafeSource.loop = true;

    const cafeFilter = ctx.createBiquadFilter();
    cafeFilter.type = "bandpass";
    cafeFilter.frequency.setValueAtTime(800, ctx.currentTime);
    cafeFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    const cafeGain = ctx.createGain();
    const cafeVol = (currentVolumes.cafe / 100) * 0.25;
    cafeGain.gain.setValueAtTime(cafeVol, ctx.currentTime);

    cafeSource.connect(cafeFilter);
    cafeFilter.connect(cafeGain);
    cafeGain.connect(masterGain);
    cafeSource.start(0);

    channels.cafe = { source: cafeSource, gain: cafeGain, filter: cafeFilter };

    isPlaying = true;
    return true;
  } catch (err) {
    console.warn("Failed to initialize ambient soundscape:", err);
    return false;
  }
}

/**
 * Stops all ambient soundscape generators
 */
export function stopAmbientSoundscape(): void {
  try {
    (Object.keys(channels) as AmbientSoundType[]).forEach((key) => {
      const ch = channels[key];
      if (ch.source) {
        try {
          ch.source.stop();
          ch.source.disconnect();
        } catch {
          // ignore
        }
        ch.source = null;
      }
      if (ch.lfo) {
        try {
          ch.lfo.stop();
          ch.lfo.disconnect();
        } catch {
          // ignore
        }
        ch.lfo = null;
      }
    });

    if (masterGain) {
      masterGain.disconnect();
      masterGain = null;
    }

    isPlaying = false;
  } catch (err) {
    console.warn("Failed to stop ambient soundscape:", err);
  }
}

/**
 * Dynamically updates the volume of a single channel (0 to 100)
 */
export function setAmbientChannelVolume(type: AmbientSoundType, volumePercent: number): void {
  currentVolumes[type] = Math.max(0, Math.min(100, volumePercent));

  if (!isPlaying || !audioCtx) return;

  const ch = channels[type];
  if (ch.gain) {
    const scale = type === "rain" ? 0.35 : type === "library" ? 0.45 : type === "waves" ? 0.4 : 0.25;
    const targetGain = (currentVolumes[type] / 100) * scale;
    try {
      ch.gain.gain.cancelScheduledValues(audioCtx.currentTime);
      ch.gain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.1);
    } catch {
      ch.gain.gain.value = targetGain;
    }

    if (ch.lfoGain) {
      ch.lfoGain.gain.value = targetGain * 0.7;
    }
  }
}

/**
 * Checks whether ambient sound is currently playing
 */
export function isAmbientSoundscapePlaying(): boolean {
  return isPlaying;
}
