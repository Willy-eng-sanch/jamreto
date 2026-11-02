import React from 'react';
import { Play, RotateCcw, Home, Sparkles, Clock, Skull, ArrowRight } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 pointer-events-auto backdrop-blur-none">
      <div className="relative bg-[#fcfbf7] border-3 border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl text-center font-mono text-slate-800">
        {/* Paper tape styling */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-100/90 border border-amber-200 -rotate-1 shadow-xs" />

        <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-2 mb-1">
          CUADERNO EN PAUSA
        </h3>
        <p className="text-xs text-slate-600 mb-6">
          Respira hondo y visualiza el mapa mental del boceto.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current text-amber-400" />
            <span>REANUDAR [ESC / P]</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-400 text-slate-800 text-xs font-bold rounded cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REINICIAR PÁGINA [R]</span>
          </button>
          <button
            onClick={onTitle}
            className="flex items-center justify-center gap-2 py-2 px-4 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Volver a Portada</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  levelTitle: string;
  isLastLevel: boolean;
  timeSeconds: number;
  starsCollected: number;
  totalStars: number;
  shiftsUsed: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelTitle,
  isLastLevel,
  timeSeconds,
  starsCollected,
  totalStars,
  shiftsUsed,
  onNextLevel,
  onReplay,
  onTitle,
}) => {
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.floor(timeSeconds % 60);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 pointer-events-auto backdrop-blur-none">
      <div className="relative bg-[#fcfbf7] border-3 border-slate-900 rounded-lg p-6 max-w-md w-full shadow-2xl text-center font-mono text-slate-800">
        {/* Teacher Ink Stamp in top right */}
        <div className="absolute -top-5 -right-3 rotate-12 border-2 border-red-600 rounded-full px-3 py-1 bg-red-50 text-red-600 text-xs font-black tracking-wider shadow-md">
          ★ APROBADO 10/10 ★
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
          {isLastLevel ? '¡CUADERNO COMPLETADO!' : '¡PÁGINA SUPERADA!'}
        </h3>
        <p className="text-xs text-slate-600 mb-5 font-medium">{levelTitle}</p>

        {/* Mastery Metric Tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="p-3 bg-white border border-slate-300 rounded shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-1">
              <Clock className="w-3 h-3 text-slate-600" />
              <span>TIEMPO</span>
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
              {formattedTime}
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-300 rounded shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>ESTRELLAS</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-600 tabular-nums">
              {starsCollected} / {totalStars}
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-300 rounded shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span>SHIFTS</span>
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
              {shiftsUsed}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          {!isLastLevel ? (
            <button
              data-start="true"
              onClick={onNextLevel}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <span>SIGUIENTE PÁGINA [ESPACIO]</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          ) : (
            <button
              data-start="true"
              onClick={onTitle}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <span>¡ENHORABUENA! VOLVER AL MENÚ</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={onReplay}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repetir Página [R]</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={onTitle}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Índice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  levelTitle: string;
  deathReason?: string;
  onRetry: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  levelTitle,
  deathReason,
  onRetry,
  onTitle,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 pointer-events-auto backdrop-blur-none">
      <div className="relative bg-[#fcfbf7] border-3 border-slate-900 rounded-lg p-6 max-w-sm w-full shadow-2xl text-center font-mono text-slate-800">
        {/* Pencil Scribble Crossout Badge */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-3 py-1 rounded text-xs font-black tracking-wider shadow-sm flex items-center gap-1.5">
          <Skull className="w-3.5 h-3.5" />
          <span>¡HAS SIDO BORRADO!</span>
        </div>

        <h3 className="text-lg font-black text-slate-900 mt-3 mb-1">
          TRAZO ELIMINADO
        </h3>
        <p className="text-xs text-rose-600 font-bold mb-4">
          Causa: {deathReason || 'Peligro Inadvertido'}
        </p>

        <p className="text-[11px] text-slate-600 mb-6 leading-relaxed">
          Recuerda: Si estás en el mundo blanco, las trampas letales son <strong>invisibles</strong>. Cambia con [SHIFT] para inspeccionar el boceto antes de moverte.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            data-start="true"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-95 shadow-md"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>REINTENTAR [R o ESPACIO]</span>
          </button>
          <button
            onClick={onTitle}
            className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Volver a Portada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
