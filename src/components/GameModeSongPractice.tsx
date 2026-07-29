import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DetectedPitch, NotationType, PerformanceResult, PracticeSong } from '../types';
import { PRESET_SONGS } from '../data/presetSongs';
import { SongUploader } from './SongUploader';
import { PitchTuner } from './PitchTuner';
import { midiToNote } from '../utils/audio/pitchDetector';
import { playReferencePitch } from '../utils/audio/synth';
import { Play, Pause, RotateCcw, Volume2, Award, Music, Sparkles, Sliders, CheckCircle2, ChevronRight, Mic } from 'lucide-react';

interface GameModeSongPracticeProps {
  pitch: DetectedPitch | null;
  notation: NotationType;
}

export const GameModeSongPractice: React.FC<GameModeSongPracticeProps> = ({
  pitch,
  notation,
}) => {
  const [songs, setSongs] = useState<PracticeSong[]>(PRESET_SONGS);
  const [selectedSong, setSelectedSong] = useState<PracticeSong>(PRESET_SONGS[0]);
  const [transposition, setTransposition] = useState<number>(0); // Semitones -6 to +6

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);

  // Score & Performance Tracking
  const [hitsCount, setHitsCount] = useState<number>(0);
  const [totalEvaluated, setTotalEvaluated] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [scorePoints, setScorePoints] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [performanceResult, setPerformanceResult] = useState<PerformanceResult | null>(null);

  // Voice pitch history buffer for canvas drawing [ { time: number, midi: number } ]
  const voiceHistoryRef = useRef<{ time: number; midi: number }[]>([]);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Transposed song notes
  const transposedNotes = selectedSong.notes.map((n) => {
    const shiftedMidi = n.midiNumber + transposition;
    const info = midiToNote(shiftedMidi);
    return {
      ...n,
      midiNumber: shiftedMidi,
      noteName: info.fullName,
      solfegeName: info.solfegeName,
      frequency: info.frequency,
    };
  });

  // Handle custom audio import
  const handleCustomSongImported = (newSong: PracticeSong) => {
    setSongs((prev) => [newSong, ...prev]);
    setSelectedSong(newSong);
    setTransposition(0);
    handleRestart();
  };

  // Restart playback & score
  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHitsCount(0);
    setTotalEvaluated(0);
    setCombo(0);
    setMaxCombo(0);
    setScorePoints(0);
    setShowResultModal(false);
    voiceHistoryRef.current = [];
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (!isPlaying) {
      // If start playing
      if (currentTime >= selectedSong.duration) {
        handleRestart();
      }
      setIsPlaying(true);
      if (audioRef.current && selectedSong.audioUrl) {
        audioRef.current.volume = volume;
        audioRef.current.play();
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // Main animation timer loop for song time progression & voice pitch evaluation
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();

    const loop = (stamp: number) => {
      const deltaSec = (stamp - lastStamp) / 1000;
      lastStamp = stamp;

      if (isPlaying) {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + deltaSec;

          // Record current sung voice pitch history if mic active & not silent
          if (pitch && !pitch.isSilent) {
            voiceHistoryRef.current.push({
              time: nextTime,
              midi: pitch.note.midiNumber,
            });
          }

          // Evaluate accuracy against active target note at nextTime
          const activeNote = transposedNotes.find(
            (n) => nextTime >= n.timeStart && nextTime <= n.timeStart + n.duration
          );

          if (activeNote) {
            setTotalEvaluated((t) => t + 1);

            if (pitch && !pitch.isSilent) {
              const isMatch =
                pitch.note.midiNumber === activeNote.midiNumber &&
                Math.abs(pitch.cents) <= 30;

              if (isMatch) {
                setHitsCount((h) => h + 1);
                setCombo((c) => {
                  const newC = c + 1;
                  setMaxCombo((m) => Math.max(m, newC));
                  return newC;
                });
                setScorePoints((s) => s + 15 * (combo + 1));
              } else {
                setCombo(0);
              }
            } else {
              setCombo(0);
            }
          }

          // Check if song reached end
          if (nextTime >= selectedSong.duration) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();

            // Calculate final performance stats
            const totalEvalCount = Math.max(1, totalEvaluated);
            const acc = Math.min(100, Math.round((hitsCount / totalEvalCount) * 100));

            let rating: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
            if (acc >= 95) rating = 'S+';
            else if (acc >= 88) rating = 'S';
            else if (acc >= 78) rating = 'A';
            else if (acc >= 65) rating = 'B';
            else if (acc >= 50) rating = 'C';
            else rating = 'D';

            setPerformanceResult({
              songTitle: selectedSong.title,
              totalNotes: transposedNotes.length,
              hitNotes: Math.round((hitsCount / totalEvalCount) * transposedNotes.length),
              accuracyPercentage: acc,
              maxCombo,
              pitchStabilityScore: Math.round(acc * 0.95),
              rating,
              points: scorePoints,
            });

            setShowResultModal(true);
            return selectedSong.duration;
          }

          return nextTime;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, pitch, transposedNotes, selectedSong.duration, totalEvaluated, hitsCount, combo, maxCombo, scorePoints]);

  // Canvas Drawing Loop (60 FPS SingStar/Karaoke pitch contour visualizer)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Grid lines for MIDI pitches (Range: MIDI 48 C3 to MIDI 76 E5)
    const minMidi = 48;
    const maxMidi = 76;
    const midiRange = maxMidi - minMidi;

    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;

    for (let m = minMidi; m <= maxMidi; m += 2) {
      const y = height - ((m - minMidi) / midiRange) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      const nInfo = midiToNote(m);
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(notation === 'solfege' ? nInfo.solfegeName : nInfo.fullName, 8, y - 4);
    }

    // Playhead line at 25% width
    const playheadX = width * 0.25;
    ctx.strokeStyle = '#06b6d4'; // cyan-500
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Time scaling: 6 seconds visible on screen
    const timeSpan = 6;
    const pxPerSec = width / timeSpan;

    // 1. Draw Target Note Blocks
    transposedNotes.forEach((note) => {
      // Calculate X relative to currentTime and playheadX
      const noteX = playheadX + (note.timeStart - currentTime) * pxPerSec;
      const noteW = note.duration * pxPerSec;

      if (noteX + noteW > 0 && noteX < width) {
        const noteY = height - ((note.midiNumber - minMidi) / midiRange) * height - 12;
        const noteH = 24;

        const isCurrentActive = currentTime >= note.timeStart && currentTime <= note.timeStart + note.duration;

        // Draw note block
        ctx.fillStyle = isCurrentActive ? '#f59e0b' : '#38bdf8'; // amber-500 vs sky-400
        ctx.shadowColor = isCurrentActive ? '#f59e0b' : '#0284c7';
        ctx.shadowBlur = isCurrentActive ? 16 : 6;

        ctx.beginPath();
        ctx.roundRect(noteX, noteY, noteW, noteH, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Text inside block
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(notation === 'solfege' ? note.solfegeName : note.fullName, noteX + 6, noteY + 16);
      }
    });

    // 2. Draw User Voice Pitch Curve
    const voiceHistory = voiceHistoryRef.current;
    if (voiceHistory.length > 1) {
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = 4;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < voiceHistory.length; i++) {
        const point = voiceHistory[i];
        const ptX = playheadX + (point.time - currentTime) * pxPerSec;
        const ptY = height - ((point.midi - minMidi) / midiRange) * height;

        if (ptX >= 0 && ptX <= width) {
          if (!started) {
            ctx.moveTo(ptX, ptY);
            started = true;
          } else {
            ctx.lineTo(ptX, ptY);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [currentTime, transposedNotes, notation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Audio volume update
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Find active note currently playing
  const activeTargetNote = transposedNotes.find(
    (n) => currentTime >= n.timeStart && currentTime <= n.timeStart + n.duration
  );

  const accuracyPct = totalEvaluated > 0 ? Math.round((hitsCount / totalEvaluated) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden HTML audio element for audio track playback */}
      {selectedSong.audioUrl && (
        <audio ref={audioRef} src={selectedSong.audioUrl} preload="auto" />
      )}

      {/* Import Custom Song Section */}
      <SongUploader onSongImported={handleCustomSongImported} />

      {/* Song Selector & Transposition Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {selectedSong.title}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedSong.artist} • Tom: {selectedSong.keySignature}
              </p>
            </div>
          </div>

          {/* Key Transposition Control (Tom +/-) */}
          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400 ml-1" />
            <span className="text-xs font-semibold text-slate-300">Tom da Música:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTransposition((t) => Math.max(-6, t - 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-mono font-bold text-xs text-cyan-300">
                {transposition > 0 ? `+${transposition}` : transposition} semit
              </span>
              <button
                onClick={() => setTransposition((t) => Math.min(6, t + 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Preset Songs Picker Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {songs.map((song) => {
            const isSel = song.id === selectedSong.id;
            return (
              <button
                key={song.id}
                onClick={() => {
                  setSelectedSong(song);
                  setTransposition(0);
                  handleRestart();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  isSel
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{song.title}</span>
                {song.isCustom && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold">
                    Custom
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Karaoke Scrolling Pitch Canvas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-4">
        {/* Live score overlay stats */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Award className="w-4 h-4" />
              <span>Precisão Vocal: {accuracyPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Combo: x{combo}</span>
            </div>
          </div>

          <div className="text-slate-400 font-mono">
            {currentTime.toFixed(1)}s / {selectedSong.duration.toFixed(1)}s
          </div>
        </div>

        {/* Scrolling Canvas Pitch Chart */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={850}
            height={260}
            className="w-full h-[260px] block"
          />
        </div>

        {/* Player Transport Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pausar Treino' : 'Iniciar Treino Vocal'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Reiniciar música"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Volume Áudio:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Pitch Tuner Indicator */}
      <PitchTuner
        pitch={pitch}
        targetNote={activeTargetNote ? midiToNote(activeTargetNote.midiNumber) : null}
        centTolerance={30}
        notation={notation}
      />

      {/* Performance Result Summary Modal */}
      {showResultModal && performanceResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-1 shadow-2xl shadow-indigo-500/30">
              <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {performanceResult.rating}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Classificação
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">
                Resultado da Performance Vocal
              </h2>
              <p className="text-xs text-slate-400">{performanceResult.songTitle}</p>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Precisão de Afinação:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {performanceResult.accuracyPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Maior Combo Vocal:</span>
                <span className="font-mono font-bold text-amber-400">
                  x{performanceResult.maxCombo}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estabilidade de Voz:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {performanceResult.pitchStabilityScore}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Pontuação Final:</span>
                <span className="font-mono font-black text-indigo-400 text-sm">
                  {performanceResult.points.toLocaleString()} pts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
