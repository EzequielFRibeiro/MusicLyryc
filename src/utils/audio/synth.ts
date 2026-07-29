let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a smooth reference pitch (piano/vocal synth guide tone)
 */
export function playReferencePitch(frequency: number, durationSec: number = 1.2, volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Main oscillator (sine for fundamental tone)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);

    // Warm harmonic oscillator (triangle at soft volume)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency, now);

    // Sub harmonic for depth
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency / 2, now);

    // Master envelope gain node
    const gainNode = ctx.createGain();
    
    // Envelope (ADSR)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.08); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.3); // Decay
    gainNode.gain.setValueAtTime(volume * 0.7, now + Math.max(0.3, durationSec - 0.2));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec); // Release

    // Lowpass filter to smooth harsh high frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(2400, frequency * 4), now);

    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(ctx.destination);

    // Start & stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
    osc3.stop(now + durationSec + 0.05);
  } catch (err) {
    console.warn('Error playing reference pitch:', err);
  }
}

/**
 * Play a success sound effect (arpeggio tone)
 */
export function playSuccessSfx() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
    });
  } catch (err) {
    console.warn('Error playing sfx:', err);
  }
}

/**
 * Play a level-up triumph sound effect
 */
export function playLevelUpSfx() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.00], // C4 major
      [349.23, 440.00, 523.25], // F4 major
      [392.00, 493.88, 587.33], // G4 major
      [523.25, 659.25, 783.99, 1046.50] // C5 major flourish
    ];

    chords.forEach((chord, step) => {
      const stepTime = now + step * 0.15;
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.15, stepTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + (step === 3 ? 0.8 : 0.25));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + (step === 3 ? 0.85 : 0.28));
      });
    });
  } catch (err) {
    console.warn('Error playing level up sfx:', err);
  }
}
