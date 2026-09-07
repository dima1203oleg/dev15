// Web Audio API realistic Siren Synthesizer for SirenUA

let audioCtx: AudioContext | null = null;
let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let lfoNode: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlayingSiren = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function startSirenSound(volume: number = 70): void {
  try {
    if (isPlayingSiren) return;
    const ctx = getAudioContext();

    // Master gain
    gainNode = ctx.createGain();
    const targetGain = Math.max(0.01, (volume / 100) * 0.4);
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + 1.2);

    // Filter to simulate outdoor acoustic megaphone resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 2.5;

    // Distortion wave shaper for realistic horn raspiness
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
    }
    distortion.curve = curve;

    // Dual main oscillators (detuned for acoustic chorus effect)
    sirenOsc1 = ctx.createOscillator();
    sirenOsc2 = ctx.createOscillator();
    sirenOsc1.type = 'sawtooth';
    sirenOsc2.type = 'triangle';
    sirenOsc1.frequency.value = 440;
    sirenOsc2.frequency.value = 442;

    // Low Frequency Oscillator (LFO) for authentic rising/falling air siren curve (approx 0.25 Hz = 4s cycle)
    lfoNode = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfoNode.type = 'sine';
    lfoNode.frequency.value = 0.22; // ~4.5 seconds sweep cycle
    lfoGain.gain.value = 140; // Sweeps from 300Hz to 580Hz

    lfoNode.connect(lfoGain);
    lfoGain.connect(sirenOsc1.frequency);
    lfoGain.connect(sirenOsc2.frequency);

    sirenOsc1.connect(distortion);
    sirenOsc2.connect(distortion);
    distortion.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    lfoNode.start(now);
    sirenOsc1.start(now);
    sirenOsc2.start(now);

    isPlayingSiren = true;
  } catch (err) {
    console.warn('Unable to play siren sound:', err);
  }
}

export function stopSirenSound(): void {
  try {
    if (!isPlayingSiren || !audioCtx || !gainNode) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    setTimeout(() => {
      try {
        sirenOsc1?.stop();
        sirenOsc2?.stop();
        lfoNode?.stop();
        sirenOsc1?.disconnect();
        sirenOsc2?.disconnect();
        lfoNode?.disconnect();
      } catch {
        // ignore cleanup errors
      }
      sirenOsc1 = null;
      sirenOsc2 = null;
      lfoNode = null;
      isPlayingSiren = false;
    }, 850);
  } catch (err) {
    console.warn('Error stopping siren:', err);
    isPlayingSiren = false;
  }
}

export function playAllClearSound(volume: number = 70): void {
  try {
    const ctx = getAudioContext();
    const targetGain = Math.max(0.01, (volume / 100) * 0.35);

    // Harmonic chime notes (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.18);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + index * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.18 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.18);
      osc.stop(ctx.currentTime + index * 0.18 + 1.3);
    });
  } catch (err) {
    console.warn('Unable to play all-clear chime:', err);
  }
}

export function speakAlertNotification(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function playWebAudioSound(type: 'ping' | 'alert' | 'click' = 'ping'): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // ignore
  }
}

export function getIsSirenPlaying(): boolean {
  return isPlayingSiren;
}
