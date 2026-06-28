/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Achievement } from './types';

// Ambient soundtracks
export interface AmbientTrack {
  id: string;
  name: string;
  icon: string;
  url: string; // synthesis audio/wav or base64 or custom audio synth
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: 'white_noise', name: 'White Noise', icon: 'Radio', url: 'white' },
  { id: 'rain', name: 'Heavy Rain', icon: 'CloudRain', url: 'rain' },
  { id: 'forest', name: 'Mystic Forest', icon: 'Trees', url: 'forest' },
  { id: 'ocean', name: 'Ocean Waves', icon: 'Waves', url: 'ocean' },
  { id: 'cafe', name: 'Parisian Cafe', icon: 'Coffee', url: 'cafe' },
  { id: 'piano', name: 'Gentle Piano', icon: 'Music', url: 'piano' },
  { id: 'alpha_waves', name: 'Alpha Focus Beats', icon: 'Brain', url: 'alpha' },
  { id: 'beta_waves', name: 'Beta Concentration Beats', icon: 'Zap', url: 'beta' },
  { id: 'theta_waves', name: 'Theta Chill Beats', icon: 'Smile', url: 'theta' }
];

// Motivational Quotes
export const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "You don't have to be perfect to be amazing.", author: "Anonymous" },
  { text: "Your limit is only your imagination.", author: "Anonymous" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" }
];

// Default Achievements list
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first study session of any length.',
    unlocked: false,
    icon: 'CheckCircle',
    xpReward: 50
  },
  {
    id: 'pomodoro_master',
    title: 'Pomodoro Novice',
    description: 'Complete a classic 25-minute study session.',
    unlocked: false,
    icon: 'Timer',
    xpReward: 100
  },
  {
    id: 'deep_diver',
    title: 'Deep Diver',
    description: 'Complete a massive 50+ minute deep work study session.',
    unlocked: false,
    icon: 'Zap',
    xpReward: 150
  },
  {
    id: 'consistency_king',
    title: 'Consistency Builder',
    description: 'Maintain a 3-day study streak.',
    unlocked: false,
    icon: 'Flame',
    xpReward: 250
  },
  {
    id: 'goal_slayer',
    title: 'Goal Slayer',
    description: 'Complete 5 planning tasks.',
    unlocked: false,
    icon: 'Trophy',
    xpReward: 200
  },
  {
    id: 'scholar',
    title: 'Golden Scholar',
    description: 'Accumulate a total of 5 hours of study.',
    unlocked: false,
    icon: 'BookOpen',
    xpReward: 400
  }
];

// Format seconds into HH:MM:SS or MM:SS
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

// Convert hours decimal into formatted text (e.g. 1.5h -> "1h 30m")
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Custom web audio ambient synthesizer to play sound without external static asset dependencies!
// Keeps app extremely robust and standalone in container environments
export class WebAudioAmbientSynth {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private type: string = '';
  private gainNode: GainNode | null = null;

  constructor() {}

  start(type: string, volume: number = 0.5) {
    this.stop();
    this.type = type;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      if (type === 'white_noise') {
        // Synthesizing pure White Noise
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(this.gainNode);
        whiteNoise.start();
        this.nodes.push(whiteNoise);
      } else if (type === 'rain') {
        // Rain sounds: Lowpassed pinkish noise with random crackles/drops
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink filter approximation
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // scale
          b6 = white * 0.115926;
        }
        const pinkNoise = this.ctx.createBufferSource();
        pinkNoise.buffer = noiseBuffer;
        pinkNoise.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(800, this.ctx.currentTime);

        pinkNoise.connect(lowpass);
        lowpass.connect(this.gainNode);
        pinkNoise.start();
        this.nodes.push(pinkNoise);
      } else if (type === 'forest' || type === 'ocean') {
        // Ocean waves: LFO on a resonant lowpass filter with noise
        const bufferSize = 4 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(type === 'ocean' ? 0.12 : 0.4, this.ctx.currentTime); // Wave rolling speed

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        noise.connect(filter);
        filter.connect(this.gainNode);

        lfo.start();
        noise.start();
        this.nodes.push(noise, lfo);
      } else if (type === 'cafe') {
        // Cafe chatter hum: Multi-frequency low-toned drone notes combined
        const freqs = [110, 147, 220, 165, 98];
        freqs.forEach(freq => {
          if (!this.ctx || !this.gainNode) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          // Subtle detune LFO
          const detuneLfo = this.ctx.createOscillator();
          detuneLfo.type = 'sine';
          detuneLfo.frequency.setValueAtTime(0.5 + Math.random(), this.ctx.currentTime);
          const detuneLfoGain = this.ctx.createGain();
          detuneLfoGain.gain.setValueAtTime(5, this.ctx.currentTime);

          detuneLfo.connect(detuneLfoGain);
          detuneLfoGain.connect(osc.detune);

          osc.connect(this.gainNode);
          osc.start();
          detuneLfo.start();
          this.nodes.push(osc, detuneLfo);
        });
      } else if (type === 'piano') {
        // Gentle Piano: Repeating minor-seventh soft chords
        const chordNotes = [261.63, 329.63, 392.00, 493.88]; // Cmaj7 notes
        let chordIndex = 0;
        
        const schedulePianoNote = () => {
          if (!this.ctx || !this.gainNode || this.type !== 'piano') return;
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          
          osc.type = 'triangle';
          // Play notes in arpeggio
          const note = chordNotes[chordIndex % chordNotes.length];
          osc.frequency.setValueAtTime(note, this.ctx.currentTime);
          
          noteGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, this.ctx.currentTime);

          osc.connect(filter);
          filter.connect(noteGain);
          noteGain.connect(this.gainNode);
          
          osc.start();
          osc.stop(this.ctx.currentTime + 2.6);
          chordIndex++;
          
          // trigger next key in 1.8 seconds
          setTimeout(schedulePianoNote, 1800);
        };
        schedulePianoNote();
      } else if (type === 'alpha_waves' || type === 'beta_waves' || type === 'theta_waves') {
        let baseFreq = 200;
        let diffFreq = 10; // Alpha: 10Hz
        if (type === 'beta_waves') {
          baseFreq = 250;
          diffFreq = 15; // Beta: 15Hz
        } else if (type === 'theta_waves') {
          baseFreq = 150;
          diffFreq = 6; // Theta: 6Hz
        }

        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();
        
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(baseFreq + diffFreq, this.ctx.currentTime);

        const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        if (panL && panR) {
          panL.pan.setValueAtTime(-1, this.ctx.currentTime);
          panR.pan.setValueAtTime(1, this.ctx.currentTime);

          oscL.connect(panL);
          panL.connect(this.gainNode);
          
          oscR.connect(panR);
          panR.connect(this.gainNode);
          
          this.nodes.push(oscL, oscR, panL, panR);
        } else {
          oscL.connect(this.gainNode);
          oscR.connect(this.gainNode);
          this.nodes.push(oscL, oscR);
        }

        oscL.start();
        oscR.start();
      }
    } catch (e) {
      console.warn("Could not start Synthesizer context:", e);
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stop() {
    this.nodes.forEach(node => {
      try {
        (node as any).stop();
      } catch (e) {}
    });
    this.nodes = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.gainNode = null;
    this.type = '';
  }
}

// Synthesis of Alarm Audio frequencies (creates premium notification bells / buzzers natively)
export function playAlarmSound(style: 'digital' | 'analog' | 'bell' | 'forest_bird' | 'gentle_piano', volume: number = 0.5) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.connect(ctx.destination);

    if (style === 'digital') {
      // Classic rapid double beep
      const freqs = [880, 880, 880, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);
        
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.2 + 0.12);
        
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.start(ctx.currentTime + idx * 0.2);
        osc.stop(ctx.currentTime + idx * 0.2 + 0.15);
      });
    } else if (style === 'bell') {
      // Elegant crystal bell resonance
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6 overtone
      
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.15, ctx.currentTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(noteGain);
      noteGain.connect(gainNode);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gainNode);

      osc.start();
      overtone.start();
      osc.stop(ctx.currentTime + 2.1);
      overtone.stop(ctx.currentTime + 1.3);
    } else if (style === 'forest_bird' || style === 'gentle_piano') {
      // Soft ambient alert melody
      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = style === 'forest_bird' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.25);

        // Pitch sweeps for a bird-chirp feel
        if (style === 'forest_bird') {
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + idx * 0.25 + 0.15);
        }

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.25);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.25 + 0.5);

        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.start(ctx.currentTime + idx * 0.25);
        osc.stop(ctx.currentTime + idx * 0.25 + 0.6);
      });
    } else {
      // Analog classic ringing alarm bell
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(16, ctx.currentTime); // rapid tremolo

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc.connect(filter);
      filter.connect(gainNode);

      osc.start();
      lfo.start();
      osc.stop(ctx.currentTime + 1.2);
      lfo.stop(ctx.currentTime + 1.2);
    }
  } catch (e) {
    console.warn("Could not play alarm synth:", e);
  }
}
