import React from 'react';
import { DetectedPitch, NotationType } from '../types';
import { PitchTuner } from './PitchTuner';
import { InteractivePiano } from './InteractivePiano';
import { Volume2, Activity, Zap } from 'lucide-react';

interface GameModeTunerProps {
  pitch: DetectedPitch | null;
  notation: NotationType;
}

export const GameModeTuner: React.FC<GameModeTunerProps> = ({ pitch, notation }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Afinador Livre & Monitor de Voz
            </h2>
            <p className="text-xs text-slate-400">
              Cante qualquer nota no microfone para analisar sua frequência exata e afinação em tempo real.
            </p>
          </div>
        </div>

        {/* Big Pitch Tuner */}
        <PitchTuner pitch={pitch} notation={notation} centTolerance={20} />
      </div>

      {/* Piano Keyboard Guide */}
      <InteractivePiano
        sungNote={pitch && !pitch.isSilent ? pitch.note : null}
        notation={notation}
      />
    </div>
  );
};
