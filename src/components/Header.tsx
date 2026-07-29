import React from 'react';
import { GameMode, NotationType, VocalRange } from '../types';
import { Mic, MicOff, Music, Target, Activity, Settings2, Sparkles, Volume2 } from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  notation: NotationType;
  onToggleNotation: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  vocalRange: VocalRange;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  notation,
  onToggleNotation,
  isMicActive,
  onToggleMic,
  vocalRange,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent tracking-tight">
              CantaPitch
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Treino de Afinação Vocal & Jogo de Notas
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectMode('hunter')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentMode === 'hunter'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Jogo de Alturas</span>
          </button>

          <button
            onClick={() => onSelectMode('song')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentMode === 'song'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Praticar com Música</span>
          </button>

          <button
            onClick={() => onSelectMode('range')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentMode === 'range'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Alcance Vocal</span>
          </button>

          <button
            onClick={() => onSelectMode('tuner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentMode === 'tuner'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Afinador Livre</span>
          </button>
        </nav>

        {/* Right tools: Mic toggle & Notation toggle */}
        <div className="flex items-center gap-2.5">
          {/* Vocal Range Badge if calibrated */}
          {vocalRange.lowestNote && vocalRange.highestNote && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Voz:</span>
              <span className="font-semibold text-emerald-300">{vocalRange.category}</span>
              <span className="text-slate-500">({vocalRange.lowestNote.fullName}–{vocalRange.highestNote.fullName})</span>
            </div>
          )}

          {/* Notation format button */}
          <button
            onClick={onToggleNotation}
            title="Alternar Nomenclatura das Notas (Dó/Ré/Mi vs C/D/E)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{notation === 'solfege' ? 'Dó, Ré, Mi' : 'C, D, E'}</span>
          </button>

          {/* Mic Button */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isMicActive
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10'
                : 'bg-rose-500/10 border-rose-500/50 text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            {isMicActive ? (
              <>
                <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Microfone Ativo</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-rose-400" />
                <span>Ligar Microfone</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
