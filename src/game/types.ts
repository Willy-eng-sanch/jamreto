export type Dimension = 'WHITE' | 'BLACK';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  id: string;
  physicalIn: 'WHITE' | 'BLACK' | 'BOTH';
  type?: 'stroke' | 'scribble_wall' | 'moving';
  vx?: number;
  minX?: number;
  maxX?: number;
  label?: string;
}

export interface Spike extends Rect {
  id: string;
  physicalIn: 'WHITE' | 'BLACK' | 'BOTH';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface Eraser extends Rect {
  id: string;
  physicalIn: 'WHITE' | 'BLACK';
  vx: number;
  minX: number;
  maxX: number;
}

export interface InkDrop {
  id: string;
  x: number;
  y: number;
  radius: number;
  vy: number;
  physicalIn: 'WHITE' | 'BLACK';
  spawnY: number;
  respawnTime: number;
  timer: number;
}

export interface StarCollectible extends Rect {
  id: string;
  dimension: 'WHITE' | 'BLACK' | 'ANY';
  collected: boolean;
}

export interface Goal extends Rect {
  id: string;
  label?: string;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  spawn: { x: number; y: number; initialDimension: Dimension };
  goal: Goal;
  platforms: Platform[];
  spikes: Spike[];
  erasers: Eraser[];
  inkDrops: InkDrop[];
  stars: StarCollectible[];
  width: number;
  height: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawnStroke {
  id: string;
  points: StrokePoint[];
  targetDimension: Dimension; // 'WHITE' or 'BLACK'. Solid and visible in targetDimension; invisible in the creator's world!
  color: string;
  createdAt: number;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpsLeft: number;
  maxJumps: number;
  facing: 'left' | 'right';
  currentDimension: Dimension;
  isDead: boolean;
  deathReason?: string;
  runCycle: number;
  squashX: number;
  squashY: number;
  shiftCooldown: number;
  isAtGoal?: boolean;
}

export interface DualGameState {
  blackStickman: PlayerState;
  whiteStickman: PlayerState;
  activeStickman: 'BLACK' | 'WHITE';
  isScreenSwapped: boolean; // false: Top = Light, Bottom = Dark; true: Top = Dark, Bottom = Light
  swapTransition: number; // 0 to 1
  drawnStrokes: DrawnStroke[];
  inkLeft: number; // 0 to 100
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  dimension: Dimension | 'ALL';
  type: 'pencil' | 'chalk' | 'eraser_crumb' | 'ink_splat' | 'star_spark' | 'drawn_sparkle';
}

export interface GameStats {
  levelIdx: number;
  deaths: number;
  shifts: number;
  timeSeconds: number;
  starsCollected: number;
  totalStars: number;
}

