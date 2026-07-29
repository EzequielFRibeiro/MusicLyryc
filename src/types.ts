export type GameMode = 'hunter' | 'song' | 'range' | 'tuner';

export type NotationType = 'solfege' | 'letter'; // 'solfege' = Dó, Ré, Mi; 'letter' = C, D, E

export interface NoteInfo {
  note: string;         // e.g. "C", "C#", "D"
  octave: number;       // e.g. 4
  fullName: string;     // e.g. "C4"
  solfegeName: string;  // e.g. "Dó 4", "Dó# 4"
  frequency: number;    // e.g. 261.63
  midiNumber: number;   // e.g. 60 for C4
}

export interface DetectedPitch {
  frequency: number;    // Hz
  note: NoteInfo;       // Closest note
  cents: number;        // -50 to +50 cents
  clarity: number;      // 0 to 1 confidence signal
  volume: number;       // RMS volume 0 to 1
  isSilent: boolean;
}

export interface VocalRange {
  lowestNote: NoteInfo | null;
  highestNote: NoteInfo | null;
  category: 'Baixo' | 'Barítono' | 'Tenor' | 'Contralto' | 'Mezzo-Soprano' | 'Soprano' | 'Não calibrado';
}

export interface GameDifficulty {
  level: number;
  name: string;
  description: string;
  allowedNotes: string[]; // Note names e.g. ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  octaves: number[];      // e.g. [3, 4]
  centTolerance: number;  // Cents margin (e.g. 35 for easy, 15 for hard)
  holdDurationMs: number; // Duration required to sustain pitch (e.g. 1000ms)
  timeLimitSec: number;   // Time limit per note in challenge
  includeAccidentals: boolean;
}

export interface SongNote {
  timeStart: number; // in seconds
  duration: number;  // in seconds
  midiNumber: number;
  noteName: string;
  solfegeName: string;
  frequency: number;
}

export interface PracticeSong {
  id: string;
  title: string;
  artist: string;
  audioUrl?: string;     // Optional data URL or blob URL
  duration: number;      // in seconds
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  keySignature: string;  // e.g. "Dó Maior"
  notes: SongNote[];     // Timestamped note sequence
  isCustom?: boolean;
}

export interface PerformanceResult {
  songTitle: string;
  totalNotes: number;
  hitNotes: number;
  accuracyPercentage: number;
  maxCombo: number;
  pitchStabilityScore: number;
  rating: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
  points: number;
}
