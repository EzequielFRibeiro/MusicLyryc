import React from 'react';
import { midiToNote } from '../utils/audio/pitchDetector';
import { NotationType, NoteInfo } from '../types';
import { playReferencePitch } from '../utils/audio/synth';
import { Volume2 } from 'lucide-react';

interface InteractivePianoProps {
  targetNote?: NoteInfo | null;
  sungNote?: NoteInfo | null;
  notation: NotationType;
  startMidi?: number; // Default C3 = 48
  endMidi?: number;   // Default C5 = 72
}

export const InteractivePiano: React.FC<InteractivePianoProps> = ({
  targetNote,
  sungNote,
  notation,
  startMidi = 48, // C3
  endMidi = 72,   // C5
}) => {
  // Generate keys array
  const keys: NoteInfo[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    keys.push(midiToNote(m));
  }

  const whiteKeys = keys.filter((k) => !k.note.includes('#'));

  const handleKeyClick = (note: NoteInfo) => {
    playReferencePitch(note.frequency, 1.2, 0.4);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          Teclado Guia (Clique na tecla para ouvir o tom)
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Nota Alvo
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Sua Voz
          </span>
        </div>
      </div>

      {/* Piano container */}
      <div className="relative h-32 w-full flex select-none overflow-x-auto pb-2 scrollbar-none">
        {whiteKeys.map((key) => {
          const isTarget = targetNote && targetNote.midiNumber === key.midiNumber;
          const isSung = sungNote && sungNote.midiNumber === key.midiNumber;

          return (
            <div
              key={key.midiNumber}
              onClick={() => handleKeyClick(key)}
              className={`relative flex-1 min-w-[28px] max-w-[42px] h-full rounded-b-md border border-slate-700/60 cursor-pointer transition-all flex flex-col justify-end pb-2 items-center text-[10px] font-bold ${
                isTarget && isSung
                  ? 'bg-gradient-to-b from-emerald-300 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-105 z-10'
                  : isTarget
                  ? 'bg-gradient-to-b from-amber-200 to-amber-400 text-slate-950 shadow-lg shadow-amber-400/40 z-10'
                  : isSung
                  ? 'bg-gradient-to-b from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-400/40 z-10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-300'
              }`}
            >
              <span className="truncate px-0.5 pointer-events-none">
                {notation === 'solfege' ? key.solfegeName.split(' ')[0] : key.note}
              </span>
              <span className="text-[8px] opacity-60 pointer-events-none">{key.octave}</span>
            </div>
          );
        })}

        {/* Black keys overlaid positioned relatively */}
        {keys.map((key) => {
          if (!key.note.includes('#')) return null;

          // Find position relative to white keys
          const whiteIndexBefore = whiteKeys.findIndex((wk) => wk.midiNumber === key.midiNumber - 1);
          if (whiteIndexBefore === -1) return null;

          const totalWhite = whiteKeys.length;
          const leftPercent = ((whiteIndexBefore + 0.62) / totalWhite) * 100;

          const isTarget = targetNote && targetNote.midiNumber === key.midiNumber;
          const isSung = sungNote && sungNote.midiNumber === key.midiNumber;

          return (
            <div
              key={key.midiNumber}
              onClick={() => handleKeyClick(key)}
              style={{ left: `${leftPercent}%` }}
              className={`absolute top-0 w-[20px] h-[60%] rounded-b-md z-20 cursor-pointer transition-all flex flex-col justify-end pb-1 items-center text-[8px] font-bold border border-slate-900 ${
                isTarget && isSung
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/50 scale-110'
                  : isTarget
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50'
                  : isSung
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 active:bg-slate-950'
              }`}
            >
              <span className="truncate pointer-events-none">#</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
