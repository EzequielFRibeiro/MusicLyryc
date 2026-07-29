import { DetectedPitch, NoteInfo } from '../../types';

// Musical constants
const NOTE_NAMES_LETTER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_SOLFEGE = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];

/**
 * Convert frequency (Hz) to detailed NoteInfo object
 */
export function frequencyToNote(freq: number): NoteInfo {
  if (freq <= 0 || !isFinite(freq)) {
    return {
      note: 'C',
      octave: 4,
      fullName: 'C4',
      solfegeName: 'Dó 4',
      frequency: 261.63,
      midiNumber: 60,
    };
  }

  // A4 = 440 Hz = MIDI note 69
  const midiExact = 12 * Math.log2(freq / 440) + 69;
  const midiNumber = Math.round(midiExact);
  const noteIndex = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;

  const letterName = NOTE_NAMES_LETTER[noteIndex];
  const solfegeName = NOTE_NAMES_SOLFEGE[noteIndex];
  const exactFreq = 440 * Math.pow(2, (midiNumber - 69) / 12);

  return {
    note: letterName,
    octave,
    fullName: `${letterName}${octave}`,
    solfegeName: `${solfegeName} ${octave}`,
    frequency: exactFreq,
    midiNumber,
  };
}

/**
 * Calculate cent offset between actual frequency and exact note frequency
 * Returns value between -50 and +50
 */
export function calculateCents(freq: number, noteFreq: number): number {
  if (freq <= 0 || noteFreq <= 0) return 0;
  return Math.round(1200 * Math.log2(freq / noteFreq));
}

/**
 * Convert MIDI note number to NoteInfo
 */
export function midiToNote(midiNumber: number): NoteInfo {
  const noteIndex = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const letterName = NOTE_NAMES_LETTER[noteIndex];
  const solfegeName = NOTE_NAMES_SOLFEGE[noteIndex];
  const exactFreq = 440 * Math.pow(2, (midiNumber - 69) / 12);

  return {
    note: letterName,
    octave,
    fullName: `${letterName}${octave}`,
    solfegeName: `${solfegeName} ${octave}`,
    frequency: exactFreq,
    midiNumber,
  };
}

/**
 * Autocorrelation algorithm for robust pitch detection in real-time singing voice
 */
export function autoCorrelate(
  buf: Float32Array,
  sampleRate: number,
  minVolume: number = 0.015
): DetectedPitch | null {
  const SIZE = buf.length;

  // 1. Calculate Root Mean Square (RMS) for signal energy/volume
  let sumSquare = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    sumSquare += val * val;
  }
  const rms = Math.sqrt(sumSquare / SIZE);

  // If signal is too quiet (silence/background noise), return silent state
  if (rms < minVolume) {
    const defaultNote = midiToNote(60);
    return {
      frequency: 0,
      note: defaultNote,
      cents: 0,
      clarity: 0,
      volume: rms,
      isSilent: true,
    };
  }

  // 2. Trim quiet padding at start and end of buffer
  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmedBuf = buf.slice(r1, r2);
  const trimmedSize = trimmedBuf.length;

  // 3. Autocorrelation calculation
  const c = new Float32Array(trimmedSize);
  for (let i = 0; i < trimmedSize; i++) {
    for (let j = 0; j < trimmedSize - i; j++) {
      c[i] = c[i] + trimmedBuf[j] * trimmedBuf[j + i];
    }
  }

  // Find first dip
  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  // Find maximum peak after first dip
  let maxValue = -1;
  let maxIndex = -1;
  for (let i = d; i < trimmedSize; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  let T0 = maxIndex;

  if (T0 <= 0 || c[0] <= 0) {
    const defaultNote = midiToNote(60);
    return {
      frequency: 0,
      note: defaultNote,
      cents: 0,
      clarity: 0,
      volume: rms,
      isSilent: true,
    };
  }

  // 4. Parabolic interpolation for sub-sample accuracy
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a !== 0) {
    T0 = T0 - b / (2 * a);
  }

  const pitchFreq = sampleRate / T0;
  const clarity = maxValue / c[0];

  // Restrict to human vocal range ~ 65Hz (C2) to 1200Hz (D6)
  if (pitchFreq < 60 || pitchFreq > 1300 || clarity < 0.3) {
    const defaultNote = midiToNote(60);
    return {
      frequency: 0,
      note: defaultNote,
      cents: 0,
      clarity: clarity,
      volume: rms,
      isSilent: true,
    };
  }

  const note = frequencyToNote(pitchFreq);
  const cents = calculateCents(pitchFreq, note.frequency);

  return {
    frequency: pitchFreq,
    note,
    cents,
    clarity,
    volume: rms,
    isSilent: false,
  };
}
