import React, { useState } from 'react';
import { Play, Volume2, VolumeX, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { LEVELS } from '../game/levels.ts';
import { sound } from '../game/audio.ts';
import { GameMode } from '../game/types.ts';

interface TitleScreenProps {
  onStart: (levelIdx?: number, mode?: GameMode) => void;
  unlockedLevel: number;
  highScores: Record<number, { stars: number; time: number }>;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  unlockedLevel,
  highScores,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>('contrast');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showHowTo, setShowHowTo] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 select-none overflow-hidden bg-[#f9f8f3]">
      {/* Notebook ruled grid pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Red margin line */}
      <div className="absolute left-12 top-0 bottom-0 w-[2px] bg-red-400 opacity-60 pointer-events-none" />

      {/* Top Bar with Audio & Tutorial */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-slate-700 font-mono text-xs tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
          <span>POLAR SHIFT // EXPERIMENTO DE DOS REALIDADES</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHowTo(!showHowTo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-400/80 bg-white/80 hover:bg-white text-slate-800 text-xs font-mono shadow-sm transition-all"
            title="Cómo jugar"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Reglas</span>
          </button>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded border border-slate-400/80 bg-white/80 hover:bg-white text-slate-800 text-xs font-mono shadow-sm transition-all"
            title={isMuted ? 'Activar sonido [M]' : 'Silenciar sonido [M]'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Centerpiece: Inline SVG Title Lockup & Dual Protagonist Art */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl">
        {/* Bespoke Title SVG */}
        <div className="mb-2">
          <svg viewBox="0 0 520 110" className="w-[360px] sm:w-[520px] h-auto drop-shadow-md">
            <defs>
              <filter id="pencilWobble">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
              </filter>
            </defs>
            {/* Background dual tone split */}
            <rect x="10" y="10" width="250" height="90" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <rect x="260" y="10" width="250" height="90" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />
            {/* Split dividing seam */}
            <line x1="260" y1="10" x2="260" y2="100" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 3" />

            {/* Left side: POLAR in graphite */}
            <text
              x="135"
              y="68"
              textAnchor="middle"
              fill="#0f172a"
              fontFamily="Space Mono, monospace"
              fontWeight="900"
              fontSize="36"
              letterSpacing="1"
            >
              POLAR
            </text>
            {/* Right side: SHIFT in glowing chalk */}
            <text
              x="385"
              y="68"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Space Mono, monospace"
              fontWeight="900"
              fontSize="36"
              letterSpacing="1"
            >
              SHIFT
            </text>
            {/* Hand-drawn underline */}
            <path d="M 30 84 Q 260 88 490 84" stroke="#e11d48" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Subtitle in notebook handwriting font */}
        <h2 className="text-xl sm:text-2xl text-slate-800 font-bold tracking-tight mb-2 font-mono">
          TRAZO &amp; VACÍO
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-mono max-w-lg mb-6 leading-relaxed">
          &ldquo;Lo que puede matarte es invisible, y lo que puedes ver no te puede tocar.&rdquo;
        </p>

        {/* Selectable rulesets: both remain available as distinct game modes. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mb-5">
          <button
            onClick={() => setSelectedMode('contrast')}
            className={`text-left p-3 rounded border-2 transition-all ${selectedMode === 'contrast' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-300 bg-white/80 text-slate-700 hover:border-slate-500'}`}
          >
            <span className="block font-mono text-xs font-black tracking-wider">MODO CONTRASTE</span>
            <span className={`block text-[11px] mt-1 leading-relaxed ${selectedMode === 'contrast' ? 'text-slate-200' : 'text-slate-500'}`}>Un nivel y un personaje. SHIFT alterna la fase; los peligros de la fase activa se camuflan.</span>
          </button>
          <button
            onClick={() => setSelectedMode('mirror')}
            className={`text-left p-3 rounded border-2 transition-all ${selectedMode === 'mirror' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-300 bg-white/80 text-slate-700 hover:border-slate-500'}`}
          >
            <span className="block font-mono text-xs font-black tracking-wider">MODO ESPEJO</span>
            <span className={`block text-[11px] mt-1 leading-relaxed ${selectedMode === 'mirror' ? 'text-slate-200' : 'text-slate-500'}`}>Un jugador y su reflejo comparten movimiento. SHIFT elige desde cuál realidad puedes dibujar.</span>
          </button>
        </div>

        {/* Start Game CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            data-start="true"
            onClick={() => onStart(selectedLevel, selectedMode)}
            className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono text-base font-bold rounded shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-slate-900"
          >
            <Play className="w-5 h-5 fill-current text-amber-400" />
            <span>COMENZAR AVENTURA</span>
          </button>
        </div>

        {/* Level Selector Drawer */}
        <div className="mt-8 w-full max-w-xl bg-white/80 backdrop-blur-none border-2 border-dashed border-slate-300 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>SELECCIÓN DE PÁGINAS (6 NIVELES):</span>
            </span>
            <span className="text-slate-500">Desbloqueado: {unlockedLevel + 1} / {LEVELS.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEVELS.map((lvl, idx) => {
              const isUnlocked = idx <= unlockedLevel;
              const isSelected = selectedLevel === idx;
              const score = highScores[idx];

              return (
                <button
                  key={lvl.id}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedLevel(idx)}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-100 ring-2 ring-slate-900 shadow-sm'
                      : isUnlocked
                      ? 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                      : 'border-slate-200 bg-slate-100 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Pág. {lvl.id}
                    </span>
                    {score && score.stars > 0 && (
                      <span className="flex items-center text-[10px] text-amber-600 font-mono font-bold">
                        ★ {score.stars}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-sans font-medium text-slate-600 truncate w-full mt-0.5">
                    {lvl.title.split(': ')[1] || lvl.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Hint Line */}
      <footer className="relative z-10 w-full text-center pb-2">
        <p className="font-mono text-xs text-slate-500 tracking-wide">
          A / D Mover · W / Espacio Saltar · <strong className="text-slate-800">SHIFT</strong> {selectedMode === 'contrast' ? 'Cambiar fase' : 'Elegir realidad para dibujar'} · ✏️ Dibujar · R Reiniciar
        </p>
      </footer>

      {/* Rules & Tutorial Modal */}
      {showHowTo && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-[#fefdfb] border-2 border-slate-900 rounded p-6 max-w-lg w-full shadow-2xl relative font-mono text-slate-800">
            {/* Taped paper corners effect */}
            <div className="w-16 h-4 bg-amber-200/80 -rotate-3 absolute -top-2 left-6 border border-amber-300 shadow-xs" />
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{selectedMode === 'contrast' ? 'MANUAL · MODO CONTRASTE' : 'MANUAL · MODO ESPEJO'}</span>
            </h3>
            <ul className="text-xs space-y-2.5 text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">1.</span>
                <span><strong>{selectedMode === 'contrast' ? 'Un único escenario:' : 'Pantalla dividida:'}</strong> {selectedMode === 'contrast' ? 'El mismo nivel alterna entre fase clara y oscura. El personaje cambia de color para contrastar con el fondo.' : 'Las dos realidades se muestran a la vez, reflejadas horizontalmente. Un único jugador y su reflejo hacen los mismos movimientos.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">2.</span>
                <span><strong>Regla de peligros:</strong> {selectedMode === 'contrast' ? 'Los peligros de la fase activa son invisibles y letales; los de la fase opuesta se ven y son intangibles.' : 'Los peligros de ambas realidades se combinan en una sola ruta mortal. Las plataformas exclusivas no bloquean el movimiento sincronizado.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">3.</span>
                <span><strong>Tecla [SHIFT]:</strong> {selectedMode === 'contrast' ? 'Cambia entre fase clara y oscura. El cambio se bloquea si la nueva fase te superpone con geometría sólida o un peligro.' : 'Cambia la realidad seleccionada para dibujar; no altera el movimiento ni detiene al reflejo.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">4.</span>
                <span><strong>Dibujar ✏️:</strong> {selectedMode === 'contrast' ? 'Haz clic y arrastra para crear un trazo visible e intangible en su fase de origen; al cambiar de fase se vuelve invisible y sólido.' : 'Dibuja desde la realidad seleccionada: el trazo queda visible e intangible allí y se proyecta horizontalmente, invisible y sólido, en la vista opuesta.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">5.</span>
                <span><strong>Doble Salto:</strong> Después del salto inicial, puedes volver a saltar una vez en el aire.</span>
              </li>
            </ul>
            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHowTo(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 cursor-pointer"
              >
                ¡ENTENDIDO! CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
