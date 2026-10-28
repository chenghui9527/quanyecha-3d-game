export class Audio {
  constructor() { this.enabled = true; this.context = null; this.musicClock = 0; this.noteIndex = 0; }
  unlock() { try { this.context ||= new (window.AudioContext || window.webkitAudioContext)(); this.context.resume(); } catch { this.enabled = false; } }
  tone(frequency, duration = 0.12, type = 'sine', volume = 0.035, endFrequency) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(now + duration + 0.02);
  }
  tearNoise(duration, volume, frequency) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * (0.4 + 0.6 * Math.abs(Math.sin(t * 155)));
    }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(), now = ctx.currentTime;
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.setValueAtTime(frequency, now); filter.Q.value = 0.65;
    filter.frequency.exponentialRampToValueAtTime(frequency * 0.4, now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + 0.003); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination); source.start(); source.stop(now + duration);
  }
  play(name) {
    const sounds = { hit: [150, 0.1, 'triangle', 0.05, 55], slash: [380, 0.11, 'triangle', 0.024, 90], arrow: [880, 0.11, 'sine', 0.035, 330], skill: [440, 0.35, 'triangle', 0.04, 1100], jump: [180, 0.12, 'sine', 0.025, 330], hurt: [140, 0.2, 'sawtooth', 0.02, 65], dodge: [230, 0.1, 'sine', 0.02, 90], switch: [520, 0.18, 'sine', 0.04, 820], pickup: [880, 0.25, 'sine', 0.035, 1320], checkpoint: [660, 0.65, 'sine', 0.04, 990], heal: [440, 0.7, 'sine', 0.04, 880] };
    Object.assign(sounds, { crow: [230, 0.2, 'sawtooth', 0.014, 130], spider: [175, 0.12, 'triangle', 0.018, 80], hornet: [310, 0.25, 'sawtooth', 0.012, 390], harpy: [140, 0.3, 'triangle', 0.022, 65], rat: [960, 0.1, 'sine', 0.017, 470] });
    Object.assign(sounds, { crawler: [190, 0.15, 'sawtooth', 0.014, 90], maw: [125, 0.22, 'triangle', 0.02, 60], manyeye: [220, 0.16, 'triangle', 0.017, 105], eyeball: [340, 0.18, 'sine', 0.018, 170], beetle: [155, 0.12, 'square', 0.012, 75], tongue: [400, 0.13, 'triangle', 0.016, 120] });
    Object.assign(sounds, { wingface: [260, 0.18, 'sawtooth', 0.014, 110], humpneck: [105, 0.22, 'triangle', 0.02, 55], cyclops: [180, 0.16, 'triangle', 0.018, 75], skullwhisker: [235, 0.14, 'sawtooth', 0.012, 85] });
    Object.assign(sounds, { clawReturn: [470, 0.11, 'triangle', 0.026, 120], clawHeavy: [260, 0.17, 'triangle', 0.04, 65], upper: [160, 0.19, 'triangle', 0.035, 620], plunge: [540, 0.2, 'triangle', 0.025, 95], slam: [115, 0.22, 'triangle', 0.065, 35], bloodCast: [710, 0.24, 'triangle', 0.037, 155], bloodHit: [260, 0.09, 'triangle', 0.025, 75] });
    if (name === 'sankon') {
      this.tone(720, 0.11, 'triangle', 0.028, 170); this.tearNoise(0.14, 0.045, 1800);
    } else if (name === 'clawTear') {
      this.tone(310, 0.07, 'sawtooth', 0.016, 80); this.tearNoise(0.10, 0.04, 2400);
    } else if (name === 'sankonSlam') {
      this.tone(118, 0.20, 'triangle', 0.055, 36);
      this.tone(230, 0.09, 'sawtooth', 0.012, 65);
    } else if (sounds[name]) this.tone(...sounds[name]);
  }
  update(dt, playing) {
    if (!playing || !this.enabled) return;
    this.musicClock -= dt;
    if (this.musicClock <= 0) {
      this.musicClock = 0.72;
      const notes = [220, 0, 261.63, 329.63, 0, 392, 329.63, 293.66, 261.63, 0, 220, 196, 0, 261.63, 293.66, 0];
      const note = notes[this.noteIndex++ % notes.length]; if (note) this.tone(note, 1.1, 'sine', 0.009);
    }
  }
}
