// Tactical Web Audio API synthesizer for SIREN UA
// Does not rely on external MP3/WAV files, works 100% reliably in any browser

class TacticalAudioEngine {
  private ctx: AudioContext | null = null;
  private activeSirenOsc: OscillatorNode | null = null;
  private activeSirenGain: GainNode | null = null;
  private isSirenPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a tactical sonar radar ping
  public playRadarPing() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {
      // Audio context might be blocked if no user interaction yet
    }
  }

  // Play all-clear two-tone chime
  public playAllClearChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.42);
      });
    } catch {
      // Audio blocked
    }
  }

  // Start continuous air raid siren test
  public toggleSirenTest(): boolean {
    try {
      this.initCtx();
      if (!this.ctx) return false;

      if (this.isSirenPlaying) {
        this.stopSirenTest();
        return false;
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      
      // Siren frequency modulation (wailing between 440Hz and 880Hz)
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);

      // Create an LFO to modulate siren pitch
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.4, now); // ~2.5 second cycle
      lfoGain.gain.setValueAtTime(220, now); // swing +/- 220Hz

      lfo.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;
      this.isSirenPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopSirenTest() {
    try {
      if (this.activeSirenGain && this.ctx) {
        this.activeSirenGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        setTimeout(() => {
          this.activeSirenOsc?.stop();
          this.activeSirenOsc?.disconnect();
          this.activeSirenGain?.disconnect();
          this.activeSirenOsc = null;
          this.activeSirenGain = null;
          this.isSirenPlaying = false;
        }, 450);
      } else {
        this.isSirenPlaying = false;
      }
    } catch {
      this.isSirenPlaying = false;
    }
  }

  public getIsPlaying(): boolean {
    return this.isSirenPlaying;
  }
}

export const tacticalAudio = new TacticalAudioEngine();
