import React from 'react';
import { DetectedPitch, NotationType, NoteInfo } from '../types';
import { Volume2, CheckCircle2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface PitchTunerProps {
  pitch: DetectedPitch | null;
  targetNote?: NoteInfo | null;
  centTolerance?: number;
  notation: NotationType;
  className?: string;
}

export const PitchTuner: React.FC<PitchTunerProps> = ({
  pitch,
  targetNote,
  centTolerance = 25,
  notation,
  className = '',
}) => {
  const isSilent = !pitch || pitch.isSilent;
  const cents = pitch ? pitch.cents : 0;
  const currentNote = pitch ? pitch.note : null;

  // Check if user pitch matches target note
  const isCorrectNote =
    targetNote &&
    currentNote &&
    currentNote.fullName === targetNote.fullName &&
    Math.abs(cents) <= centTolerance;

  const isFlat =
    targetNote &&
    currentNote &&
    (currentNote.midiNumber < targetNote.midiNumber ||
      (currentNote.fullName === targetNote.fullName && cents < -centTolerance));

  const isSharp =
    targetNote &&
    currentNote &&
    (currentNote.midiNumber > targetNote.midiNumber ||
      (currentNote.fullName === targetNote.fullName && cents > centTolerance));

  // Determine needle position percentage (0% = -50 cents, 50% = 0 cents, 100% = +50 cents)
  const needlePercent = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  // Display note title
  const noteNameDisplay = currentNote
    ? notation === 'solfege'
      ? currentNote.solfegeName
      : currentNote.fullName
    : '--';

  const targetNameDisplay = targetNote
    ? notation === 'solfege'
      ? targetNote.solfegeName
      : targetNote.fullName
    : null;

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl ${className}`}
    >
      {/* Background glow effects based on accuracy */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isCorrectNote
            ? 'bg-emerald-500/10 opacity-100'
            : isFlat || isSharp
            ? 'bg-amber-500/5 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Top note display panel */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl tracking-tight transition-all duration-200 border shadow-inner ${
              isSilent
                ? 'bg-slate-950 border-slate-800 text-slate-500'
                : isCorrectNote
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/20 scale-105'
                : 'bg-indigo-500/10 border-indigo-500/30 text-cyan-300'
            }`}
          >
            {isSilent ? '?' : noteNameDisplay}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sua Nota Cantada
            </div>
            <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <span>{isSilent ? 'Aguardando voz...' : `${pitch?.frequency.toFixed(1)} Hz`}</span>
              {!isSilent && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    Math.abs(cents) <= centTolerance
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : cents < 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {cents > 0 ? `+${cents} cents` : `${cents} cents`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target Note Badge */}
        {targetNameDisplay && (
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nota Alvo
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono tracking-tight flex items-center gap-1.5 justify-end">
              <span>{targetNameDisplay}</span>
              <span className="text-xs font-normal text-slate-400">({targetNote.frequency.toFixed(1)} Hz)</span>
            </div>
          </div>
        )}
      </div>

      {/* Tuner Gauge Dial */}
      <div className="relative z-10 my-4">
        {/* Scale labels */}
        <div className="flex justify-between text-[11px] font-bold text-slate-500 px-2 mb-2 font-mono">
          <span className="text-amber-400/80">-50 (Grave/Flat)</span>
          <span className="text-slate-400">-25</span>
          <span className="text-emerald-400 font-bold">0 (Afinação)</span>
          <span className="text-slate-400">+25</span>
          <span className="text-rose-400/80">+50 (Agudo/Sharp)</span>
        </div>

        {/* Meter track */}
        <div className="h-4 bg-slate-950 rounded-full p-0.5 border border-slate-800 relative overflow-hidden shadow-inner flex items-center">
          {/* Target tolerance zone highlight */}
          <div
            className="absolute h-full bg-emerald-500/20 border-x border-emerald-500/40 rounded"
            style={{
              left: `${((50 - centTolerance) / 100) * 100}%`,
              width: `${((centTolerance * 2) / 100) * 100}%`,
            }}
          />

          {/* Center alignment tick */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400/60 z-10" />

          {/* Moving Needle indicator */}
          {!isSilent && (
            <div
              className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full transition-all duration-75 shadow-lg z-20 ${
                isCorrectNote
                  ? 'bg-emerald-400 shadow-emerald-400/80 scale-125'
                  : cents < 0
                  ? 'bg-amber-400 shadow-amber-400/80'
                  : 'bg-rose-400 shadow-rose-400/80'
              }`}
              style={{ left: `${needlePercent}%` }}
            />
          )}
        </div>
      </div>

      {/* Dynamic Voice Feedback Status Banner */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold relative z-10">
        <div className="flex items-center gap-2">
          {isSilent ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Volume2 className="w-4 h-4 text-slate-500 animate-pulse" />
              <span>Cante em direção ao microfone...</span>
            </div>
          ) : isCorrectNote ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Afinação Perfeita! Sustente a nota!</span>
            </div>
          ) : isFlat ? (
            <div className="flex items-center gap-1.5 text-amber-400">
              <ArrowUpCircle className="w-4 h-4 text-amber-400" />
              <span>Suba a voz! (Sua afinação está abaixo)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400">
              <ArrowDownCircle className="w-4 h-4 text-rose-400" />
              <span>Abaixe a voz! (Sua afinação está acima)</span>
            </div>
          )}
        </div>

        {/* Volume & signal meter */}
        {!isSilent && pitch && (
          <div className="flex items-center gap-2 text-slate-500">
            <span>Sinal:</span>
            <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, pitch.volume * 400)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
