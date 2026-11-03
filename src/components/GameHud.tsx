import React from 'react';
import { Dimension, GameMode } from '../game/types.ts';
import { Volume2, VolumeX, Pause, RotateCcw, Sparkles, PenTool, Eraser, ArrowLeftRight } from 'lucide-react';

interface GameHudProps {
  levelTitle: string;
  levelSubtitle: string;
  activeStickman: 'BLACK' | 'WHITE';
  gameMode: GameMode;
  activeDimension: Dimension;
  starsCollected: number;
  totalStars: number;
  timeSeconds: number;
  strokesCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
  onShift: () => void;
  onClearStrokes: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  levelTitle,
  levelSubtitle,
  activeStickman,
  gameMode,
  activeDimension,
  starsCollected,
  totalStars,
  timeSeconds,
  strokesCount,
  isMuted,
  onToggleMute,
  onRestart,
  onPause,
  onShift,
  onClearStrokes,
}) => {
  const isBlackStickman = activeStickman === 'BLACK';
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.floor(timeSeconds % 60);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-20">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Level Details & Current Active Control */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-tight px-2.5 py-1 rounded shadow-sm border bg-slate-900/90 text-white border-slate-700">
              {levelTitle.toUpperCase()}
            </span>
          </div>
          <span className="font-mono text-[11px] sm:text-xs text-slate-300 tracking-wide max-w-sm sm:max-w-md truncate bg-slate-900/60 px-2 py-0.5 rounded">
            {levelSubtitle}
          </span>
        </div>

        {/* Center: Interactive Dimension & Screen Swap Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={onShift}
            tabIndex={-1}
            className="pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xs font-bold border-2 transition-all cursor-pointer shadow-lg active:scale-95 bg-slate-900 text-white border-cyan-400 hover:bg-slate-800"
            title={gameMode === 'contrast' ? 'Alternar fase clara/oscura [SHIFT o Z]' : 'Cambiar la realidad seleccionada para dibujar [SHIFT o Z]'}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {gameMode === 'contrast'
                ? activeDimension === 'WHITE' ? 'CONTRASTE · FASE CLARA' : 'CONTRASTE · FASE OSCURA'
                : isBlackStickman ? 'ESPEJO · TRAZAR EN BLANCO' : 'ESPEJO · TRAZAR EN NEGRO'}
            </span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-slate-800 border-slate-700 text-cyan-300">
              SHIFT
            </kbd>
          </button>
          <span className="text-[10px] font-mono mt-1 text-slate-300 bg-slate-900/70 px-2 py-0.5 rounded">
            {gameMode === 'contrast' ? 'Un personaje · dos fases' : 'Un jugador · reflejo sincronizado'}
          </span>
        </div>

        {/* Right: Stars, Drawing Tools, Time, and Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* Drawing info & Clear button */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1 rounded border border-slate-700 font-mono text-xs font-bold shadow-sm">
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-300">
              Puentes: <span className="text-white">{strokesCount}</span>
            </span>
            {strokesCount > 0 && (
              <button
                onClick={onClearStrokes}
                tabIndex={-1}
                className="pointer-events-auto ml-1 p-1 rounded bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-colors"
                title="Borrar trazos dibujados [Tecla C]"
                aria-label="Borrar trazos"
              >
                <Eraser className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Star counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700 font-mono text-xs font-bold shadow-sm bg-slate-900/90 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">
              {starsCollected}/{totalStars}
            </span>
          </div>

          {/* Timer */}
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded border border-slate-700 font-mono text-xs font-bold tabular-nums shadow-sm bg-slate-900/90 text-slate-200">
            {formattedTime}
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              onClick={onRestart}
              tabIndex={-1}
              className="p-1.5 rounded border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              title="Reiniciar nivel [R]"
              aria-label="Reiniciar nivel"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              tabIndex={-1}
              className="p-1.5 rounded border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              title="Alternar sonido [M]"
              aria-label="Silenciar sonido"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              tabIndex={-1}
              className="p-1.5 rounded border border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              title="Pausar juego [Escape o P]"
              aria-label="Pausar juego"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="flex items-center justify-between font-mono text-[11px] pb-1">
        <span className="px-2.5 py-1 rounded text-slate-300 bg-slate-900/80 border border-slate-800 shadow-sm">
          [A/D] Mover · [W/Espacio] Doble Salto · [SHIFT] {gameMode === 'contrast' ? 'Alternar fase' : 'Alternar mundo/personaje'} · ✏️ <strong>Arrastra para trazar</strong>
        </span>
        <span className="hidden md:inline px-2.5 py-1 rounded font-bold text-cyan-300 bg-slate-900/80 border border-slate-800 shadow-sm">
          {gameMode === 'contrast' ? 'Lo visible es intangible; lo invisible es sólido' : 'Atiende ambos lados · un solo movimiento'}
        </span>
      </div>
    </div>
  );
};
