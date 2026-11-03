import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dimension, DrawnStroke, GameMode, LevelData, PlayerState, StrokePoint } from './game/types.ts';
import { LEVELS } from './game/levels.ts';
import { GameRenderer } from './game/renderer.ts';
import {
  stepSimulation,
  updateErasers,
  updateInkDrops,
  updateMovingPlatforms,
  createDefaultPlayer,
  canSwitchDimension,
  InputState,
} from './game/physics.ts';
import { mirrorLevelHorizontally, oppositeDimension } from './game/dimensionRules.ts';
import { buildMirrorCollisionData, syncMirroredPlayer } from './game/mirrorMode.ts';
import { sound } from './game/audio.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHud } from './components/GameHud.tsx';
import { PauseModal, VictoryModal, GameOverModal } from './components/Modals.tsx';
import { TouchControls } from './components/TouchControls.tsx';

type GameScreen = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export default function App() {
  const [gameState, setGameState] = useState<GameScreen>('title');
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('shift_unlocked_lvl');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [highScores, setHighScores] = useState<Record<number, { stars: number; time: number }>>(() => {
    const saved = localStorage.getItem('shift_high_scores');
    return saved ? JSON.parse(saved) : {};
  });

  const [gameMode, setGameMode] = useState<GameMode>('contrast');
  const gameModeRef = useRef<GameMode>('contrast');
  gameModeRef.current = gameMode;
  const [contrastDimension, setContrastDimension] = useState<Dimension>('WHITE');

  // Mirror mode keeps the two reflected worlds visible side by side.
  const [activeStickman, setActiveStickman] = useState<'BLACK' | 'WHITE'>('BLACK');
  const [strokesCount, setStrokesCount] = useState<number>(0);

  // HUD state (throttled to avoid 60fps React re-renders)
  const [hudStars, setHudStars] = useState<number>(0);
  const [hudTotalStars, setHudTotalStars] = useState<number>(0);
  const [hudTime, setHudTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [deathReason, setDeathReason] = useState<string>('');

  // End of run stats snapshot for modals
  const [runStats, setRunStats] = useState({
    time: 0,
    stars: 0,
    shifts: 0,
  });

  // Canvas & Simulation references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Active level data deep copy ref
  const currentLevelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));
  const blackWorldLevelRef = useRef<LevelData>(mirrorLevelHorizontally(LEVELS[0]));

  // The two stickmen:
  // playerBlackRef: lives in WHITE world (Light mode, black stickman)
  // playerWhiteRef: lives in BLACK world (Dark mode, white stickman)
  const playerBlackRef = useRef<PlayerState>(createDefaultPlayer(80, 380, 'WHITE'));
  const playerWhiteRef = useRef<PlayerState>(createDefaultPlayer(80, 380, 'BLACK'));

  const activeStickmanRef = useRef<'BLACK' | 'WHITE'>('BLACK');
  activeStickmanRef.current = activeStickman;

  // Drawn bridges & lines
  const drawnStrokesRef = useRef<DrawnStroke[]>([]);
  const currentDrawingRef = useRef<{
    points: StrokePoint[];
    sourceDimension: Dimension;
    targetDimension: Dimension;
    color: string;
  } | null>(null);

  // Simulation counters & timers
  const simTimeRef = useRef<number>(0);
  const shiftsCountRef = useRef<number>(0);
  const lastHudUpdateRef = useRef<number>(0);
  const hitstopTimerRef = useRef<number>(0);
  const victoryTriggeredRef = useRef<boolean>(false);
  const gameOverTriggeredRef = useRef<boolean>(false);

  // Unified input hub
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    shiftPressed: false,
  });

  const gameStateRef = useRef<GameScreen>('title');
  gameStateRef.current = gameState;

  // Sync document.body.dataset.state
  useEffect(() => {
    const mapped =
      gameState === 'victory' || gameState === 'gameover' ? 'gameover' : gameState;
    document.body.dataset.state = mapped;
  }, [gameState]);

  // Load level into simulation refs
  const loadLevel = useCallback((levelIdx: number, mode: GameMode = gameModeRef.current) => {
    const safeIdx = Math.min(Math.max(0, levelIdx), LEVELS.length - 1);
    setCurrentLevelIdx(safeIdx);
    setGameMode(mode);
    gameModeRef.current = mode;
    const lvlCopy: LevelData = JSON.parse(JSON.stringify(LEVELS[safeIdx]));
    currentLevelRef.current = lvlCopy;
    const blackWorld = mirrorLevelHorizontally(lvlCopy);
    blackWorldLevelRef.current = blackWorld;

    playerBlackRef.current = createDefaultPlayer(lvlCopy.spawn.x, lvlCopy.spawn.y, lvlCopy.spawn.initialDimension);
    setContrastDimension(lvlCopy.spawn.initialDimension);
    playerWhiteRef.current = createDefaultPlayer(blackWorld.spawn.x, blackWorld.spawn.y, 'BLACK');
    playerWhiteRef.current.facing = 'left';
    playerWhiteRef.current.facing = 'left';

    drawnStrokesRef.current = [];
    currentDrawingRef.current = null;
    setStrokesCount(0);

    setActiveStickman('BLACK');
    activeStickmanRef.current = 'BLACK';
    victoryTriggeredRef.current = false;
    gameOverTriggeredRef.current = false;

    simTimeRef.current = 0;
    shiftsCountRef.current = 0;
    hitstopTimerRef.current = 0;

    setHudStars(0);
    setHudTotalStars(lvlCopy.stars.length);
    setHudTime(0);
    setDeathReason('');
  }, []);

  // Start game handler
  const startGame = useCallback((levelIdx?: number, mode: GameMode = gameModeRef.current) => {
    const idx = levelIdx !== undefined ? levelIdx : currentLevelIdx;
    loadLevel(idx, mode);
    setGameState('playing');
    inputRef.current = {
      left: false,
      right: false,
      jumpPressed: false,
      jumpHeld: false,
      shiftPressed: false,
    };
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [currentLevelIdx, loadLevel]);

  // Restart current level
  const restartLevel = useCallback(() => {
    loadLevel(currentLevelIdx);
    setGameState('playing');
    inputRef.current = {
      left: false,
      right: false,
      jumpPressed: false,
      jumpHeld: false,
      shiftPressed: false,
    };
  }, [currentLevelIdx, loadLevel]);

  // SHIFT changes the active phase in Contrast, or the controlled mirror-world in Mirror.
  const triggerDimensionShift = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const player = playerBlackRef.current;
    if (gameModeRef.current === 'contrast') {
      const nextDimension = oppositeDimension(player.currentDimension);
      if (!canSwitchDimension(
        player,
        nextDimension,
        currentLevelRef.current.platforms,
        currentLevelRef.current.spikes,
        currentLevelRef.current.erasers,
        currentLevelRef.current.inkDrops
      )) {
        rendererRef.current?.spawnParticles(
          player.x + player.w * 0.5,
          player.y + player.h * 0.5,
          8,
          'ink_splat',
          '#ef4444',
          player.currentDimension
        );
        return;
      }
      player.currentDimension = nextDimension;
      setContrastDimension(nextDimension);
      const visualController: 'BLACK' | 'WHITE' = nextDimension === 'WHITE' ? 'BLACK' : 'WHITE';
      setActiveStickman(visualController);
      activeStickmanRef.current = visualController;
    } else {
      const previous = activeStickmanRef.current;
      if (previous === 'BLACK') playerBlackRef.current.vx = 0;
      else playerWhiteRef.current.vx = 0;
      const nextActive: 'BLACK' | 'WHITE' = previous === 'BLACK' ? 'WHITE' : 'BLACK';
      setActiveStickman(nextActive);
      activeStickmanRef.current = nextActive;
    }

    sound.playShift();
    shiftsCountRef.current += 1;
    rendererRef.current?.triggerShift();
  }, []);

  // Clear drawn bridges
  const clearDrawnStrokes = useCallback(() => {
    drawnStrokesRef.current = [];
    setStrokesCount(0);
  }, []);

  // Advance to next level
  const nextLevel = useCallback(() => {
    if (currentLevelIdx < LEVELS.length - 1) {
      const nextIdx = currentLevelIdx + 1;
      setUnlockedLevel((prev) => {
        const updated = Math.max(prev, nextIdx);
        localStorage.setItem('shift_unlocked_lvl', String(updated));
        return updated;
      });
      loadLevel(nextIdx, gameModeRef.current);
      setGameState('playing');
    } else {
      setGameState('title');
    }
  }, [currentLevelIdx, loadLevel]);

  // Autostart query parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame(0);
    }
  }, [startGame]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Audio toggle
      if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
        return;
      }

      // Clear strokes quick key
      if (e.code === 'KeyC') {
        clearDrawnStrokes();
        return;
      }

      // Title screen quick start
      if (gameStateRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
          return;
        }
      }

      // Victory screen next level
      if (gameStateRef.current === 'victory') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          nextLevel();
          return;
        }
      }

      // Game Over retry
      if (gameStateRef.current === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR') {
          e.preventDefault();
          restartLevel();
          return;
        }
      }

      // Pause toggle
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
          return;
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
          return;
        }
      }

      // Restart quick key
      if (e.code === 'KeyR' && gameStateRef.current === 'playing') {
        restartLevel();
        return;
      }

      // Gameplay active inputs
      if (gameStateRef.current === 'playing') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          inputRef.current.left = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          inputRef.current.right = true;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
          if (!inputRef.current.jumpHeld) {
            inputRef.current.jumpPressed = true;
          }
          inputRef.current.jumpHeld = true;
        }
        // Dimension / Screen swap: Shift, KeyZ, KeyK, KeyE, KeyJ
        if (
          e.code === 'ShiftLeft' ||
          e.code === 'ShiftRight' ||
          e.code === 'KeyZ' ||
          e.code === 'KeyK' ||
          e.code === 'KeyE' ||
          e.code === 'KeyJ'
        ) {
          if (e.repeat) return;
          e.preventDefault();
          triggerDimensionShift();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        inputRef.current.jumpHeld = false;
      }
    };

    const onBlur = () => {
      inputRef.current = {
        left: false,
        right: false,
        jumpPressed: false,
        jumpHeld: false,
        shiftPressed: false,
      };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }, [startGame, restartLevel, nextLevel, triggerDimensionShift, clearDrawnStrokes]);

  // Touch control handlers
  const handleTouchStart = (action: 'left' | 'right' | 'jump' | 'shift') => {
    if (action === 'left') inputRef.current.left = true;
    if (action === 'right') inputRef.current.right = true;
    if (action === 'jump') {
      inputRef.current.jumpPressed = true;
      inputRef.current.jumpHeld = true;
    }
    if (action === 'shift') {
      triggerDimensionShift();
    }
  };

  const handleTouchEnd = (action: 'left' | 'right' | 'jump' | 'shift') => {
    if (action === 'left') inputRef.current.left = false;
    if (action === 'right') inputRef.current.right = false;
    if (action === 'jump') inputRef.current.jumpHeld = false;
  };

  // Canvas size ref
  const canvasSizeRef = useRef({ w: 960, h: 540, dpr: 1 });

  // Measure canvas size via ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width) || 960;
      const h = Math.round(rect.height) || 540;
      canvasSizeRef.current = { w, h, dpr };
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);
    window.addEventListener('resize', updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Interactive Drawing Handlers (Mouse / Touch)
  // "tambien deben dibujar ayudas para el otro pero su trazo es invisible en su mundo"
  const isDrawingRef = useRef<boolean>(false);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvasSizeRef.current.w;
    const py = ((e.clientY - rect.top) / rect.height) * canvasSizeRef.current.h;
    return { px, py };
  };

  const getWorldPoint = (px: number, py: number, dimension: Dimension) => {
    const renderer = rendererRef.current;
    if (!renderer) return null;
    const transform = gameModeRef.current === 'contrast'
      ? renderer.lastContrastTransform
      : dimension === 'WHITE' ? renderer.lastLeftTransform : renderer.lastRightTransform;
    const gx = (px - transform.viewportX - transform.offsetX) / transform.scale;
    const gy = (py - transform.offsetY) / transform.scale;
    const level = currentLevelRef.current;
    return {
      x: Math.max(0, Math.min(level.width, gx)),
      y: Math.max(0, Math.min(level.height, gy)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== 'playing') return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const { px, py } = coords;
    const sourceDimension: Dimension = gameModeRef.current === 'contrast'
      ? playerBlackRef.current.currentDimension
      : activeStickmanRef.current === 'BLACK' ? 'WHITE' : 'BLACK';
    if (gameModeRef.current === 'mirror') {
      const clickedDimension: Dimension = px < canvasSizeRef.current.w / 2 ? 'WHITE' : 'BLACK';
      if (clickedDimension !== sourceDimension) return;
    }
    const targetDimension = oppositeDimension(sourceDimension);
    const point = getWorldPoint(px, py, sourceDimension);
    if (!point) return;

    isDrawingRef.current = true;
    currentDrawingRef.current = {
      points: [point],
      sourceDimension,
      targetDimension,
      color: sourceDimension === 'WHITE' ? '#0f172a' : '#ffffff',
    };

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    const point = getWorldPoint(
      coords.px,
      coords.py,
      currentDrawingRef.current.sourceDimension
    );
    if (!point) return;
    const pts = currentDrawingRef.current.points;
    const lastPt = pts[pts.length - 1];
    const distSq = (point.x - lastPt.x) ** 2 + (point.y - lastPt.y) ** 2;

    if (distSq > 64) {
      pts.push(point);
      rendererRef.current?.spawnParticles(
        point.x,
        point.y,
        2,
        'drawn_sparkle',
        currentDrawingRef.current.color,
        currentDrawingRef.current.sourceDimension
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentDrawingRef.current && currentDrawingRef.current.points.length >= 2) {
      const newStroke: DrawnStroke = {
        id: `stroke_${Date.now()}_${Math.random()}`,
        points: currentDrawingRef.current.points,
        sourceDimension: currentDrawingRef.current.sourceDimension,
        targetDimension: currentDrawingRef.current.targetDimension,
        mirrorToTarget: gameModeRef.current === 'mirror',
        color: currentDrawingRef.current.color,
        createdAt: Date.now(),
      };

      // Keep up to 8 active bridges to keep memory clean
      drawnStrokesRef.current.push(newStroke);
      if (drawnStrokesRef.current.length > 8) {
        drawnStrokesRef.current.shift();
      }
      setStrokesCount(drawnStrokesRef.current.length);
      sound.playDraw();
    }
    currentDrawingRef.current = null;
  };

  // Main 60fps Canvas Simulation Loop
  useEffect(() => {
    rendererRef.current = new GameRenderer();
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop);

      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05);

      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { w: displayW, h: displayH, dpr } = canvasSizeRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      const level = currentLevelRef.current;
      const playerBlack = playerBlackRef.current;
      const playerWhite = playerWhiteRef.current;

      // Simulation Step (Only active during 'playing')
      if (gameStateRef.current === 'playing') {
        if (hitstopTimerRef.current > 0) {
          hitstopTimerRef.current -= dt;
        } else {
          simTimeRef.current += dt;

          let resultBlack: ReturnType<typeof stepSimulation>;
          let resultWhite: ReturnType<typeof stepSimulation>;

          if (gameModeRef.current === 'contrast') {
            // One shared stage: both color layers keep moving while one is hidden.
            updateMovingPlatforms(level.platforms, dt);
            updateErasers(level.erasers, dt);
            updateInkDrops(level.inkDrops, level.platforms, level.height, dt);
            resultBlack = stepSimulation(
              playerBlack, inputRef.current, level.platforms, level.spikes,
              level.erasers, level.inkDrops, level.stars, level.goal,
              level.width, level.height, dt, drawnStrokesRef.current
            );
            resultWhite = {
              player: playerWhite,
              didJump: false,
              didLand: false,
              didShift: false,
              clearedLevel: false,
              collectedStars: [],
            };
          } else {
            // Mirror mode is one movement state with a perfectly synchronized reflection.
            // Geometry from either reality constrains the shared route.
            updateMovingPlatforms(level.platforms, dt);
            updateErasers(level.erasers, dt);
            updateInkDrops(level.inkDrops, level.platforms, level.height, dt);

            const mirrorCollision = buildMirrorCollisionData(level, drawnStrokesRef.current);
            resultBlack = stepSimulation(
              playerBlack,
              inputRef.current,
              mirrorCollision.platforms,
              mirrorCollision.spikes,
              mirrorCollision.erasers,
              mirrorCollision.inkDrops,
              mirrorCollision.stars,
              level.goal,
              level.width,
              level.height,
              dt,
              mirrorCollision.strokes
            );
            resultWhite = {
              player: playerWhite,
              didJump: false,
              didLand: false,
              didShift: false,
              clearedLevel: resultBlack.clearedLevel,
              collectedStars: resultBlack.collectedStars,
            };

            // The right-hand character is a reflection, never an independently controlled actor.
            syncMirroredPlayer(playerBlack, playerWhite, level.width);
            const collectedIds = new Set(resultBlack.collectedStars);
            if (collectedIds.size > 0) {
              for (const star of level.stars) if (collectedIds.has(star.id)) star.collected = true;
            }
            blackWorldLevelRef.current = mirrorLevelHorizontally(level);
          }

                    // Audio triggers
          if (resultBlack.didJump || resultWhite.didJump) {
            sound.playJump();
            const jumpingPlayer = resultBlack.didJump ? playerBlack : playerWhite;
            renderer.spawnParticles(
              jumpingPlayer.x + jumpingPlayer.w * 0.5,
              jumpingPlayer.y + jumpingPlayer.h,
              6,
              jumpingPlayer.currentDimension === 'WHITE' ? 'pencil' : 'chalk',
              jumpingPlayer.currentDimension === 'WHITE' ? '#334155' : '#ffffff',
              jumpingPlayer.currentDimension
            );
          }

          if (resultBlack.didLand || resultWhite.didLand) {
            sound.playLand();
          }

          if (resultBlack.collectedStars.length > 0 || resultWhite.collectedStars.length > 0) {
            sound.playStar();
            const p = resultBlack.collectedStars.length > 0 ? playerBlack : playerWhite;
            renderer.spawnParticles(
              p.x + p.w * 0.5,
              p.y + p.h * 0.5,
              12,
              'star_spark',
              '#f59e0b',
              'ALL'
            );
          }

          // Player Death check
          const deadPlayer = gameModeRef.current === 'contrast'
            ? playerBlack
            : playerBlack.isDead ? playerBlack : playerWhite;
          if (deadPlayer.isDead && !gameOverTriggeredRef.current) {
            gameOverTriggeredRef.current = true;
            sound.playDeath(deadPlayer.deathReason);
            hitstopTimerRef.current = 0.08;
            renderer.cameraShake = 14;
            renderer.spawnParticles(
              deadPlayer.x + deadPlayer.w * 0.5,
              deadPlayer.y + deadPlayer.h * 0.5,
              24,
              'eraser_crumb',
              deadPlayer.currentDimension === 'WHITE' ? '#ef4444' : '#38bdf8',
              'ALL'
            );
            setDeathReason(
              `${gameModeRef.current === 'contrast' ? 'Jugador' : deadPlayer.currentDimension === 'WHITE' ? 'Stickman Negro' : 'Stickman Blanco'}: ${
                deadPlayer.deathReason || 'Eliminado'
              }`
            );
            setRunStats({
              time: simTimeRef.current,
              stars: level.stars.filter((s) => s.collected).length,
              shifts: shiftsCountRef.current,
            });
            setTimeout(() => {
              setGameState('gameover');
            }, 350);
          }

          // Contrast needs one arrival; Mirror keeps the cooperative double arrival.
          const hasWon = gameModeRef.current === 'contrast'
            ? resultBlack.clearedLevel
            : playerBlack.isAtGoal && playerWhite.isAtGoal;
          if (hasWon && !victoryTriggeredRef.current) {
            victoryTriggeredRef.current = true;
            sound.playVictory();
            renderer.spawnParticles(
              level.goal.x + level.goal.w * 0.5,
              level.goal.y + level.goal.h * 0.5,
              30,
              'star_spark',
              '#dc2626',
              'ALL'
            );
            const starsWon = level.stars.filter((s) => s.collected).length;
            setRunStats({
              time: simTimeRef.current,
              stars: starsWon,
              shifts: shiftsCountRef.current,
            });

            // Save High Score
            setHighScores((prev) => {
              const currentBest = prev[currentLevelIdx];
              if (
                !currentBest ||
                starsWon > currentBest.stars ||
                (starsWon === currentBest.stars && simTimeRef.current < currentBest.time)
              ) {
                const nextScores = {
                  ...prev,
                  [currentLevelIdx]: { stars: starsWon, time: simTimeRef.current },
                };
                localStorage.setItem('shift_high_scores', JSON.stringify(nextScores));
                return nextScores;
              }
              return prev;
            });

            setTimeout(() => {
              setGameState('victory');
            }, 300);
          }

          // Throttle React HUD updates to 5 times/sec
          if (currentTime - lastHudUpdateRef.current > 200) {
            lastHudUpdateRef.current = currentTime;
            setHudTime(simTimeRef.current);
            setHudStars(level.stars.filter((s) => s.collected).length);
          }
        }
      }

      // Reset one-shot edge triggers
      inputRef.current.jumpPressed = false;
      inputRef.current.shiftPressed = false;

      // Update renderer particles & shake
      renderer.update(dt);

      // Contrast is one full-screen stage; Mirror keeps both horizontally reflected realities.
      if (gameModeRef.current === 'contrast') {
        renderer.renderContrast(
          ctx, displayW, displayH, playerBlack, level,
          drawnStrokesRef.current, currentDrawingRef.current, currentTime / 1000
        );
      } else {
        renderer.renderDualWorld(
          ctx, displayW, displayH, playerBlack, playerWhite,
          activeStickmanRef.current, level, blackWorldLevelRef.current,
          drawnStrokesRef.current, currentDrawingRef.current, currentTime / 1000
        );
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentLevelIdx]);

  const currentLevel = currentLevelRef.current;
  const isLastLevel = currentLevelIdx === LEVELS.length - 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#101216] select-none flex items-center justify-center">
      {/* 60fps HTML5 Canvas Split-Screen Surface */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block touch-none cursor-crosshair"
      />

      {/* Screen: Title Screen */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-40">
          <TitleScreen
            onStart={startGame}
            unlockedLevel={unlockedLevel}
            highScores={highScores}
          />
        </div>
      )}

      {/* Playing HUD (Active during gameplay & pause) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHud
          levelTitle={currentLevel.title}
          levelSubtitle={currentLevel.subtitle}
          activeStickman={activeStickman}
          gameMode={gameMode}
          activeDimension={gameMode === 'contrast' ? contrastDimension : activeStickman === 'BLACK' ? 'WHITE' : 'BLACK'}
          starsCollected={hudStars}
          totalStars={hudTotalStars}
          timeSeconds={hudTime}
          strokesCount={strokesCount}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = sound.toggleMute();
            setIsMuted(muted);
          }}
          onRestart={restartLevel}
          onPause={() => setGameState('paused')}
          onShift={triggerDimensionShift}
          onClearStrokes={clearDrawnStrokes}
        />
      )}

      {/* Touch Controls (Mobile / Tablet) */}
      {gameState === 'playing' && (
        <TouchControls
          onInputStart={handleTouchStart}
          onInputEnd={handleTouchEnd}
        />
      )}

      {/* Modal: Pause */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={restartLevel}
          onTitle={() => setGameState('title')}
        />
      )}

      {/* Modal: Victory / Stage Clear */}
      {gameState === 'victory' && (
        <VictoryModal
          levelTitle={currentLevel.title}
          isLastLevel={isLastLevel}
          timeSeconds={runStats.time}
          starsCollected={runStats.stars}
          totalStars={hudTotalStars}
          shiftsUsed={runStats.shifts}
          onNextLevel={nextLevel}
          onReplay={restartLevel}
          onTitle={() => setGameState('title')}
        />
      )}

      {/* Modal: Game Over / Defeat */}
      {gameState === 'gameover' && (
        <GameOverModal
          levelTitle={currentLevel.title}
          deathReason={deathReason}
          onRetry={restartLevel}
          onTitle={() => setGameState('title')}
        />
      )}
    </div>
  );
}
