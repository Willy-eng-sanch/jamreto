import {
  Dimension,
  DrawnStroke,
  LevelData,
  PlayerState,
} from './types.ts';

export interface MirrorCollisionData {
  platforms: LevelData['platforms'];
  spikes: LevelData['spikes'];
  erasers: LevelData['erasers'];
  inkDrops: LevelData['inkDrops'];
  stars: LevelData['stars'];
  strokes: DrawnStroke[];
}

/** Keep the second avatar at the exact horizontal reflection of the first. */
export function syncMirroredPlayer(source: PlayerState, mirror: PlayerState, worldWidth: number): void {
  mirror.x = worldWidth - source.x - mirror.w;
  mirror.y = source.y;
  mirror.vx = -source.vx;
  mirror.vy = source.vy;
  mirror.isGrounded = source.isGrounded;
  mirror.coyoteTimer = source.coyoteTimer;
  mirror.jumpBufferTimer = source.jumpBufferTimer;
  mirror.jumpsLeft = source.jumpsLeft;
  mirror.maxJumps = source.maxJumps;
  mirror.facing = source.facing === 'left' ? 'right' : 'left';
  mirror.currentDimension = 'BLACK';
  mirror.isDead = source.isDead;
  mirror.deathReason = source.deathReason;
  mirror.runCycle = source.runCycle;
  mirror.squashX = source.squashX;
  mirror.squashY = source.squashY;
  mirror.shiftCooldown = source.shiftCooldown;
  mirror.isAtGoal = source.isAtGoal;
}

/**
 * Build one canonical collision set for the mirrored pair. Obstacles from
 * either reality constrain the shared route; their visual presentation stays
 * phase-specific in the renderer.
 */
export function buildMirrorCollisionData(level: LevelData, strokes: DrawnStroke[]): MirrorCollisionData {
  return {
    // Only shared terrain blocks the paired movement. Phase-exclusive walls/platforms
    // are omitted so one side can never stop while its reflection keeps moving.
    platforms: level.platforms
      .filter((platform) => platform.physicalIn === 'BOTH')
      .map((platform) => ({ ...platform, physicalIn: 'BOTH' as const })),
    spikes: level.spikes.map((spike) => ({ ...spike, physicalIn: 'WHITE' as const })),
    erasers: level.erasers.map((eraser) => ({ ...eraser, physicalIn: 'WHITE' as const })),
    inkDrops: level.inkDrops.map((drop) => ({ ...drop, physicalIn: 'WHITE' as const })),
    // Each collectible exists in both reflected views; the pair shares collection state.
    stars: level.stars.map((star) => ({ ...star, dimension: 'ANY' as const })),
    // Left-side strokes stay at their X; right-side strokes are mapped back to left coordinates.
    strokes: strokes.map((stroke) => ({
      ...stroke,
      sourceDimension: 'BLACK' as Dimension,
      targetDimension: 'WHITE' as Dimension,
      mirrorToTarget: stroke.sourceDimension === 'BLACK',
    })),
  };
}
