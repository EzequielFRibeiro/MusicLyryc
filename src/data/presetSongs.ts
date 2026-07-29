import { PracticeSong } from '../types';
import { midiToNote } from '../utils/audio/pitchDetector';

function createNoteTrack(notesData: { midi: number; duration: number }[]): any[] {
  let currentTime = 0.5; // Start offset
  return notesData.map((item) => {
    const noteInfo = midiToNote(item.midi);
    const noteObj = {
      timeStart: Number(currentTime.toFixed(2)),
      duration: item.duration,
      midiNumber: item.midi,
      noteName: noteInfo.fullName,
      solfegeName: noteInfo.solfegeName,
      frequency: noteInfo.frequency,
    };
    currentTime += item.duration + 0.1; // brief gap between notes
    return noteObj;
  });
}

export const PRESET_SONGS: PracticeSong[] = [
  {
    id: 'escala-do-maior',
    title: 'Escala de Dó Maior (Aquecimento)',
    artist: 'Exercício Vocal',
    duration: 12,
    difficulty: 'Fácil',
    keySignature: 'Dó Maior',
    notes: createNoteTrack([
      { midi: 60, duration: 1.0 }, // C4 (Dó 4)
      { midi: 62, duration: 1.0 }, // D4 (Ré 4)
      { midi: 64, duration: 1.0 }, // E4 (Mi 4)
      { midi: 65, duration: 1.0 }, // F4 (Fá 4)
      { midi: 67, duration: 1.0 }, // G4 (Sol 4)
      { midi: 69, duration: 1.0 }, // A4 (Lá 4)
      { midi: 71, duration: 1.0 }, // B4 (Si 4)
      { midi: 72, duration: 1.5 }, // C5 (Dó 5)
      { midi: 71, duration: 1.0 }, // B4
      { midi: 69, duration: 1.0 }, // A4
      { midi: 67, duration: 1.0 }, // G4
      { midi: 65, duration: 1.0 }, // F4
      { midi: 64, duration: 1.0 }, // E4
      { midi: 62, duration: 1.0 }, // D4
      { midi: 60, duration: 1.8 }, // C4
    ]),
  },
  {
    id: 'asa-branca',
    title: 'Asa Branca (Tema Vocal)',
    artist: 'Luiz Gonzaga & Humberto Teixeira',
    duration: 16,
    difficulty: 'Médio',
    keySignature: 'Dó Maior',
    notes: createNoteTrack([
      { midi: 60, duration: 0.6 }, // Quando olhei
      { midi: 62, duration: 0.6 },
      { midi: 64, duration: 0.8 }, // a terra
      { midi: 67, duration: 0.8 }, // arden-
      { midi: 67, duration: 0.8 }, // do
      { midi: 64, duration: 0.8 }, // qual
      { midi: 65, duration: 0.8 }, // fo-
      { midi: 65, duration: 1.2 }, // guei-ra
      { midi: 60, duration: 0.6 }, // de
      { midi: 62, duration: 0.6 }, // São
      { midi: 64, duration: 0.8 }, // Jo-
      { midi: 67, duration: 0.8 }, // ão
      { midi: 67, duration: 0.8 },
      { midi: 65, duration: 0.8 },
      { midi: 64, duration: 1.4 },
    ]),
  },
  {
    id: 'parabens-pra-voce',
    title: 'Parabéns pra Você',
    artist: 'Tradicional',
    duration: 14,
    difficulty: 'Fácil',
    keySignature: 'Dó Maior',
    notes: createNoteTrack([
      { midi: 60, duration: 0.5 }, // Pa-
      { midi: 60, duration: 0.5 }, // ra-
      { midi: 62, duration: 0.8 }, // béns
      { midi: 60, duration: 0.8 }, // pra
      { midi: 65, duration: 0.8 }, // vo-
      { midi: 64, duration: 1.2 }, // cê
      { midi: 60, duration: 0.5 }, // nes-
      { midi: 60, duration: 0.5 }, // ta
      { midi: 62, duration: 0.8 }, // da-
      { midi: 60, duration: 0.8 }, // ta
      { midi: 67, duration: 0.8 }, // que-
      { midi: 65, duration: 1.2 }, // rida
    ]),
  },
  {
    id: 'ciranda-cirandinha',
    title: 'Ciranda Cirandinha',
    artist: 'Folclore Brasileiro',
    duration: 15,
    difficulty: 'Fácil',
    keySignature: 'Sol Maior',
    notes: createNoteTrack([
      { midi: 67, duration: 0.6 }, // Ci-
      { midi: 67, duration: 0.6 }, // ran-
      { midi: 69, duration: 0.6 }, // da
      { midi: 67, duration: 0.6 }, // ci-
      { midi: 65, duration: 0.6 }, // ran-
      { midi: 64, duration: 0.8 }, // di-
      { midi: 62, duration: 1.0 }, // nha
      { midi: 60, duration: 0.6 }, // va-
      { midi: 62, duration: 0.6 }, // mos
      { midi: 64, duration: 0.6 }, // to-
      { midi: 65, duration: 0.6 }, // dos
      { midi: 67, duration: 0.8 }, // ci-
      { midi: 67, duration: 0.8 }, // ran-
      { midi: 67, duration: 1.2 }, // dar
    ]),
  },
  {
    id: 'desafio-arpejos',
    title: 'Desafio de Arpejos e Saltos',
    artist: 'Técnica Vocal Avançada',
    duration: 15,
    difficulty: 'Difícil',
    keySignature: 'Dó Maior / Arpejo',
    notes: createNoteTrack([
      { midi: 60, duration: 0.8 }, // C4
      { midi: 64, duration: 0.8 }, // E4
      { midi: 67, duration: 0.8 }, // G4
      { midi: 72, duration: 1.2 }, // C5
      { midi: 67, duration: 0.8 }, // G4
      { midi: 64, duration: 0.8 }, // E4
      { midi: 60, duration: 1.2 }, // C4
      { midi: 62, duration: 0.8 }, // D4
      { midi: 66, duration: 0.8 }, // F#4
      { midi: 69, duration: 0.8 }, // A4
      { midi: 74, duration: 1.4 }, // D5
    ]),
  },
];
