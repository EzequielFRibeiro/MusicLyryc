/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DetectedPitch, GameMode, NotationType, VocalRange } from './types';
import { autoCorrelate } from './utils/audio/pitchDetector';
import { Header } from './components/Header';
import { GameModeNoteHunter } from './components/GameModeNoteHunter';
import { GameModeSongPractice } from './components/GameModeSongPractice';
import { GameModeVocalRange } from './components/GameModeVocalRange';
import { GameModeTuner } from './components/GameModeTuner';
import { Mic, MicOff, AlertCircle, Sparkles, Volume2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('hunter');
  const [notation, setNotation] = useState<NotationType>('solfege');

  // Mic state & audio pitch detection
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<DetectedPitch | null>(null);

  // Vocal Range state
  const [vocalRange, setVocalRange] = useState<VocalRange>({
    lowestNote: null,
    highestNote: null,
    category: 'Não calibrado',
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Toggle Microphone
  const toggleMicrophone = useCallback(async () => {
    if (isMicActive) {
      // Stop mic stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsMicActive(false);
      setPitch(null);
    } else {
      setMicError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
        });

        mediaStreamRef.current = stream;

        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        source.connect(analyser);
        setIsMicActive(true);

        // Start continuous pitch detection loop
        const sampleBuffer = new Float32Array(analyser.fftSize);

        const detectLoop = () => {
          if (analyserRef.current && audioCtxRef.current) {
            analyserRef.current.getFloatTimeDomainData(sampleBuffer);
            const detected = autoCorrelate(sampleBuffer, audioCtxRef.current.sampleRate);
            setPitch(detected);
          }
          animFrameRef.current = requestAnimationFrame(detectLoop);
        };

        detectLoop();
      } catch (err) {
        console.error('Microphone access error:', err);
        setMicError('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
        setIsMicActive(false);
      }
    }
  }, [isMicActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        notation={notation}
        onToggleNotation={() => setNotation((prev) => (prev === 'solfege' ? 'letter' : 'solfege'))}
        isMicActive={isMicActive}
        onToggleMic={toggleMicrophone}
        vocalRange={vocalRange}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Mic Activation Prompt Banner if Mic is OFF */}
        {!isMicActive && (
          <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mic className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">
                Ative seu Microfone para Começar a Cantar
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O CantaPitch precisa do microfone para analisar sua voz em tempo real e fornecer feedback imediato de afinação.
              </p>
            </div>
            <button
              onClick={toggleMicrophone}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Mic className="w-4 h-4 fill-slate-950" />
              <span>Ligar Microfone Agora</span>
            </button>
          </div>
        )}

        {/* Mic Error Banner */}
        {micError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Active Game Mode View */}
        {currentMode === 'hunter' && (
          <GameModeNoteHunter
            pitch={pitch}
            notation={notation}
            vocalRange={vocalRange}
          />
        )}

        {currentMode === 'song' && (
          <GameModeSongPractice pitch={pitch} notation={notation} />
        )}

        {currentMode === 'range' && (
          <GameModeVocalRange
            pitch={pitch}
            notation={notation}
            vocalRange={vocalRange}
            onSaveVocalRange={setVocalRange}
          />
        )}

        {currentMode === 'tuner' && (
          <GameModeTuner pitch={pitch} notation={notation} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            CantaPitch © {new Date().getFullYear()} — Treino de Afinação Vocal com Análise de Microfone em Tempo Real.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Dó, Ré, Mi (Solfejo)</span>
            <span>•</span>
            <span>Algoritmo YIN / Autocorrelação</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
