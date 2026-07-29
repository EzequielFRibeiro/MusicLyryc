import React, { useState, useEffect } from 'react';
import { DetectedPitch, NotationType, NoteInfo, VocalRange } from '../types';
import { PitchTuner } from './PitchTuner';
import { playSuccessSfx } from '../utils/audio/synth';
import { Sparkles, ArrowDownCircle, ArrowUpCircle, CheckCircle2, RefreshCw, Award } from 'lucide-react';

interface GameModeVocalRangeProps {
  pitch: DetectedPitch | null;
  notation: NotationType;
  vocalRange: VocalRange;
  onSaveVocalRange: (range: VocalRange) => void;
}

export const GameModeVocalRange: React.FC<GameModeVocalRangeProps> = ({
  pitch,
  notation,
  vocalRange,
  onSaveVocalRange,
}) => {
  const [step, setStep] = useState<'lowest' | 'highest' | 'complete'>('lowest');
  const [tempLowest, setTempLowest] = useState<NoteInfo | null>(vocalRange.lowestNote);
  const [tempHighest, setTempHighest] = useState<NoteInfo | null>(vocalRange.highestNote);
  const [holdCountMs, setHoldCountMs] = useState<number>(0);

  // Calibration voice pitch detector effect
  useEffect(() => {
    if (step === 'complete' || !pitch || pitch.isSilent) {
      setHoldCountMs(0);
      return;
    }

    const currentNote = pitch.note;

    if (step === 'lowest') {
      if (!tempLowest || currentNote.midiNumber < tempLowest.midiNumber) {
        setTempLowest(currentNote);
      }
      setHoldCountMs((prev) => {
        const next = prev + 50;
        if (next >= 1200) {
          playSuccessSfx();
          setStep('highest');
          return 0;
        }
        return next;
      });
    } else if (step === 'highest') {
      if (!tempHighest || currentNote.midiNumber > tempHighest.midiNumber) {
        setTempHighest(currentNote);
      }
      setHoldCountMs((prev) => {
        const next = prev + 50;
        if (next >= 1200) {
          playSuccessSfx();

          // Calculate vocal category
          const lowMidi = tempLowest ? tempLowest.midiNumber : currentNote.midiNumber;
          const highMidi = currentNote.midiNumber;

          let category: VocalRange['category'] = 'Barítono';
          if (highMidi >= 72) {
            // C5+
            category = highMidi >= 80 ? 'Soprano' : 'Mezzo-Soprano';
          } else if (highMidi >= 67) {
            category = lowMidi <= 48 ? 'Barítono' : 'Tenor';
          } else {
            category = lowMidi <= 45 ? 'Baixo' : 'Contralto';
          }

          const finalRange: VocalRange = {
            lowestNote: tempLowest ?? currentNote,
            highestNote: tempHighest ?? currentNote,
            category,
          };

          onSaveVocalRange(finalRange);
          setStep('complete');
          return 0;
        }
        return next;
      });
    }
  }, [pitch, step, tempLowest, tempHighest, onSaveVocalRange]);

  const handleRestartCalibration = () => {
    setStep('lowest');
    setTempLowest(null);
    setTempHighest(null);
    setHoldCountMs(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header instructions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Calibração de Alcance Vocal (Tessitura)
            </h2>
            <p className="text-xs text-slate-400">
              Descubra a nota mais grave e a nota mais aguda que você consegue cantar confortavelmente!
            </p>
          </div>
        </div>

        {/* Calibration Progress Steps */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              step === 'lowest'
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                : tempLowest
                ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <div className="text-xs font-bold">1. Nota Grave</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {tempLowest
                ? notation === 'solfege'
                  ? tempLowest.solfegeName
                  : tempLowest.fullName
                : 'Aguardando...'}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              step === 'highest'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : tempHighest
                ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
            <div className="text-xs font-bold">2. Nota Aguda</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {tempHighest
                ? notation === 'solfege'
                  ? tempHighest.solfegeName
                  : tempHighest.fullName
                : 'Aguardando...'}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              step === 'complete'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Award className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <div className="text-xs font-bold">3. Classificação</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {step === 'complete' ? vocalRange.category : 'Pendente'}
            </div>
          </div>
        </div>
      </div>

      {/* Active step instructions card */}
      {step === 'lowest' && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ArrowDownCircle className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-300">
              Cante a sua nota mais GRAVE
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Cante num tom bem baixo e confortável e sustentado por 1,5 segundos.
            </p>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-amber-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, (holdCountMs / 1200) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {step === 'highest' && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ArrowUpCircle className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-cyan-300">
              Agora cante a sua nota mais AGUDA
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Suba a voz sem forçar e sustentando a nota aguda por 1,5 segundos.
            </p>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, (holdCountMs / 1200) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-1 shadow-2xl shadow-emerald-500/30">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">
              Voz Calibrada com Sucesso!
            </h3>
            <p className="text-xs text-slate-300">
              Sua tessitura vocal foi identificada como{' '}
              <span className="text-emerald-300 font-bold text-sm">
                {vocalRange.category}
              </span>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Nota Mais Grave:</span>
              <span className="text-amber-400 font-mono font-bold text-base">
                {vocalRange.lowestNote
                  ? notation === 'solfege'
                    ? vocalRange.lowestNote.solfegeName
                    : vocalRange.lowestNote.fullName
                  : '--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Nota Mais Aguda:</span>
              <span className="text-cyan-300 font-mono font-bold text-base">
                {vocalRange.highestNote
                  ? notation === 'solfege'
                    ? vocalRange.highestNote.solfegeName
                    : vocalRange.highestNote.fullName
                  : '--'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRestartCalibration}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Refazer Calibração Vocal</span>
          </button>
        </div>
      )}

      {/* Realtime Pitch Tuner */}
      <PitchTuner pitch={pitch} notation={notation} centTolerance={25} />
    </div>
  );
};
