import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';

interface TouchControlsProps {
  onInputStart: (action: 'left' | 'right' | 'jump' | 'shift') => void;
  onInputEnd: (action: 'left' | 'right' | 'jump' | 'shift') => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInputStart,
  onInputEnd,
}) => {
  return (
    <div className="md:hidden absolute bottom-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between select-none">
      {/* Left/Right Directional Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('left');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('left');
          }}
          onMouseDown={() => onInputStart('left')}
          onMouseUp={() => onInputEnd('left')}
          className="w-13 h-13 rounded-full bg-slate-900/80 active:bg-slate-900 text-white flex items-center justify-center border-2 border-slate-700 shadow-lg active:scale-90 transition-transform"
          aria-label="Mover a la izquierda"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('right');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('right');
          }}
          onMouseDown={() => onInputStart('right')}
          onMouseUp={() => onInputEnd('right')}
          className="w-13 h-13 rounded-full bg-slate-900/80 active:bg-slate-900 text-white flex items-center justify-center border-2 border-slate-700 shadow-lg active:scale-90 transition-transform"
          aria-label="Mover a la derecha"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Jump & Dimension Shift Buttons */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* SHIFT Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('shift');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('shift');
          }}
          onMouseDown={() => onInputStart('shift')}
          onMouseUp={() => onInputEnd('shift')}
          className="w-14 h-14 rounded-full bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-xs flex flex-col items-center justify-center border-2 border-amber-600 shadow-xl active:scale-90 transition-transform"
          aria-label="Cambiar dimensión"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>SHIFT</span>
        </button>

        {/* Jump Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInputStart('jump');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInputEnd('jump');
          }}
          onMouseDown={() => onInputStart('jump')}
          onMouseUp={() => onInputEnd('jump')}
          className="w-14 h-14 rounded-full bg-slate-900/80 active:bg-slate-900 text-white flex items-center justify-center border-2 border-slate-700 shadow-lg active:scale-90 transition-transform"
          aria-label="Saltar"
        >
          <ArrowUp className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
