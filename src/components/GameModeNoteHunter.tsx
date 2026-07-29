import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DetectedPitch, GameDifficulty, NotationType, NoteInfo, VocalRange } from '../types';
import { GAME_LEVELS } from '../data/difficultyLevels';
import { PitchTuner } from './PitchTuner';
import { InteractivePiano } from './InteractivePiano';
import { playReferencePitch, playSuccessSfx, playLevelUpSfx } from '../utils/audio/synth';
import { midiToNote } from '../utils/audio/pitchDetector';
import { Play, SkipForward, Award, Flame, RefreshCw, Trophy, Zap, ChevronRight, Check } from 'lucide-react';

interface GameModeNoteHunterProps {
  pitch: DetectedPitch | null;
  notation: NotationType;
  vocalRange: VocalRange;
}

export const GameModeNoteHunter: React.FC<GameModeNoteHunterProps> = ({
  pitch,
  notation,
  vocalRange,
}) => {
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentLevel = GAME_LEVELS[levelIndex];

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [notesCompleted, setNotesCompleted] = useState<number>(0);

  const [targetNote, setTargetNote] = useState<NoteInfo | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [lastHitMessage, setLastHitMessage] = useState<string | null>(null);

  // Helper to pick next random target note according to level config & vocal range
  const generateNextTargetNote = useCallback(() => {
    const allowedLetters = currentLevel.allowedNotes;
    const octaves = currentLevel.octaves;

    // Pick random octave and letter
    const randOctave = octaves[Math.floor(Math.random() * octaves.length)];
    const randLetter = allowedLetters[Math.floor(Math.random() * allowedLetters.length)];

    // Convert to note
    const testMidiMap: Record<string, number> = {
      C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11
    };
    const midiVal = (randOctave + 1) * 12 + (testMidiMap[randLetter] ?? 0);
    const newNote = midiToNote(midiVal);

    // Ensure it doesn't match current target note identically
    if (targetNote && newNote.fullName === targetNote.fullName) {
      const altMidi = midiVal + (Math.random() > 0.5 ? 2 : -2);
      setTargetNote(midiToNote(altMidi));
    } else {
      setTargetNote(newNote);
    }

    setHoldProgress(0);
  }, [currentLevel, targetNote]);

  // Initial target note generation
  useEffect(() => {
    if (!targetNote) {
      generateNextTargetNote();
    }
  }, [generateNextTargetNote, targetNote]);

  // Audio play handler for reference pitch
  const handlePlayTargetSound = () => {
    if (targetNote) {
      playReferencePitch(targetNote.frequency, 1.2, 0.4);
    }
  };

  // Main game loop evaluating user singing pitch vs target note
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!targetNote || !pitch || pitch.isSilent) {
        // Slowly decay hold progress if silent
        setHoldProgress((prev) => Math.max(0, prev - deltaMs * 0.05));
        return;
      }

      const currentMidi = pitch.note.midiNumber;
      const targetMidi = targetNote.midiNumber;
      const cents = pitch.cents;

      // Pitch check: same note & within cent tolerance
      const isCorrect = currentMidi === targetMidi && Math.abs(cents) <= currentLevel.centTolerance;

      if (isCorrect) {
        const increment = (deltaMs / currentLevel.holdDurationMs) * 100;
        setHoldProgress((prev) => {
          const nextVal = prev + increment;
          if (nextVal >= 100) {
            // NOTE HIT COMPLETE!
            playSuccessSfx();

            // Calculate points & combo
            const newStreak = streak + 1;
            const pointsEarned = 100 * newStreak;
            setScore((s) => s + pointsEarned);
            setStreak(newStreak);
            setMaxStreak((m) => Math.max(m, newStreak));
            setNotesCompleted((n) => n + 1);

            // Toast feedback message
            setLastHitMessage(`Perfeito! +${pointsEarned} pts (Combo x${newStreak})`);
            setTimeout(() => setLastHitMessage(null), 2000);

            // Check level advancement condition (e.g., every 5 completed notes)
            if ((notesCompleted + 1) % 5 === 0 && levelIndex < GAME_LEVELS.length - 1) {
              playLevelUpSfx();
              setShowLevelUpModal(true);
            } else {
              generateNextTargetNote();
            }

            return 0;
          }
          return nextVal;
        });
      } else {
        // Slowly decay if singing wrong pitch
        setHoldProgress((prev) => Math.max(0, prev - deltaMs * 0.08));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [pitch, targetNote, currentLevel, streak, notesCompleted, levelIndex, generateNextTargetNote]);

  const handleLevelUpModalContinue = () => {
    setShowLevelUpModal(false);
    setLevelIndex((prev) => Math.min(GAME_LEVELS.length - 1, prev + 1));
    generateNextTargetNote();
  };

  const handleResetGame = () => {
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setNotesCompleted(0);
    generateNextTargetNote();
  };

  const targetNoteDisplay = targetNote
    ? notation === 'solfege'
      ? targetNote.solfegeName
      : targetNote.fullName
    : '--';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Level Header Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Level card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Dificuldade
            </div>
            <div className="text-base font-bold text-cyan-300 truncate">
              {currentLevel.name.split(':')[1] || currentLevel.name}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400">
            {currentLevel.level}
          </div>
        </div>

        {/* Score card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pontuação
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
              {score.toLocaleString()}
            </div>
          </div>
          <Trophy className="w-7 h-7 text-emerald-400/60" />
        </div>

        {/* Combo Streak card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Combo Atual
            </div>
            <div className="text-xl font-black text-amber-400 font-mono flex items-center gap-1">
              <span>x{streak}</span>
              {streak >= 3 && <Flame className="w-5 h-5 text-amber-500 animate-bounce" />}
            </div>
          </div>
          <Zap className="w-7 h-7 text-amber-400/60" />
        </div>

        {/* Notes Completed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Notas Acertadas
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono">
              {notesCompleted}
            </div>
          </div>
          <Award className="w-7 h-7 text-indigo-400/60" />
        </div>
      </div>

      {/* Main Game Pitch Target Challenge Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Toast hit notification banner */}
        {lastHitMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-xl shadow-emerald-500/30 animate-bounce flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>{lastHitMessage}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Target Note Hero Banner */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {/* Circular Hold Progress Ring */}
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-amber-400 transition-all duration-75"
                  strokeWidth="8"
                  strokeDasharray={351.8}
                  strokeDashoffset={351.8 - (351.8 * holdProgress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Note name inside circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ENCONTRE
                </span>
                <span className="text-2xl font-black text-amber-300 tracking-tight">
                  {targetNoteDisplay}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {targetNote ? `${targetNote.frequency.toFixed(1)} Hz` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-lg font-bold text-slate-100">
                Encontre a Altura da Nota
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Ouça a nota guia e cante no microfone sustentando a afinação até preencher o círculo!
              </p>
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                Tolerância de afinação: <span className="text-emerald-400 font-bold">±{currentLevel.centTolerance} cents</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayTargetSound}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Ouvir Nota Alvo</span>
            </button>

            <button
              onClick={generateNextTargetNote}
              title="Pular para outra nota"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
            >
              <SkipForward className="w-4 h-4 text-cyan-400" />
              <span>Pular Nota</span>
            </button>
          </div>
        </div>

        {/* Realtime Tuner Feedback */}
        <PitchTuner
          pitch={pitch}
          targetNote={targetNote}
          centTolerance={currentLevel.centTolerance}
          notation={notation}
        />
      </div>

      {/* Piano Keyboard Guide */}
      <InteractivePiano
        targetNote={targetNote}
        sungNote={pitch && !pitch.isSilent ? pitch.note : null}
        notation={notation}
      />

      {/* Difficulty Level Switcher Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Nível de Dificuldade</h3>
            <p className="text-xs text-slate-400">
              Conforme você acerta, o nível sobe automaticamente exigindo maior precisão vocal.
            </p>
          </div>
          <button
            onClick={handleResetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reiniciar Pontuação</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {GAME_LEVELS.map((lvl, index) => {
            const isActive = index === levelIndex;
            return (
              <button
                key={lvl.level}
                onClick={() => {
                  setLevelIndex(index);
                  generateNextTargetNote();
                }}
                className={`p-3 rounded-xl text-left border transition-all relative ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>Nível {lvl.level}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] font-medium text-slate-300 truncate">
                  {lvl.name.split(':')[1] || lvl.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  ±{lvl.centTolerance} cents | {lvl.allowedNotes.length} notas
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level Up Celebration Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 p-1 shadow-xl shadow-amber-400/30">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Parabéns! Nível Concluído!
              </h2>
              <p className="text-xs text-slate-300">
                Sua precisão vocal avançou! A dificuldade aumentou para o{' '}
                <span className="text-cyan-400 font-bold">
                  Nível {GAME_LEVELS[Math.min(GAME_LEVELS.length - 1, levelIndex + 1)].level}
                </span>.
              </p>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Pontuação Acumulada:</span>
                <span className="font-mono font-bold text-emerald-400">{score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Maior Combo:</span>
                <span className="font-mono font-bold text-amber-400">x{maxStreak}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nova Tolerância:</span>
                <span className="font-mono font-bold text-cyan-300">
                  ±{GAME_LEVELS[Math.min(GAME_LEVELS.length - 1, levelIndex + 1)].centTolerance} cents
                </span>
              </div>
            </div>

            <button
              onClick={handleLevelUpModalContinue}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span>Avançar para o Próximo Nível</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
