import { Dimension, DrawnStroke, LevelData, Rect, StrokePoint } from './types.ts';

export function oppositeDimension(dimension: Dimension): Dimension {
  return dimension === 'WHITE' ? 'BLACK' : 'WHITE';
}

export function isStrokeVisibleInDimension(stroke: DrawnStroke, dimension: Dimension): boolean {
  return stroke.sourceDimension === dimension;
}

export function isStrokeSolidInDimension(stroke: DrawnStroke, dimension: Dimension): boolean {
  return stroke.targetDimension === dimension;
}

export function mirrorPointHorizontally(point: StrokePoint, worldWidth: number): StrokePoint {
  return { x: worldWidth - point.x, y: point.y };
}

export function projectStrokeHorizontally(points: StrokePoint[], worldWidth: number): StrokePoint[] {
  return points.map((point) => mirrorPointHorizontally(point, worldWidth));
}

function mirrorRect<T extends Rect>(rect: T, worldWidth: number): T {
  return { ...rect, x: worldWidth - rect.x - rect.w };
}

/** Mirror the complete level so its route runs from the right edge toward the shared center. */
export function mirrorLevelHorizontally(level: LevelData): LevelData {
  const width = level.width;
  return {
    ...level,
    spawn: { ...level.spawn, x: width - level.spawn.x - 22, initialDimension: 'BLACK' },
    goal: mirrorRect(level.goal, width),
    platforms: level.platforms.map((platform) => ({
      ...platform,
      x: width - platform.x - platform.w,
      ...(platform.vx === undefined ? {} : { vx: -platform.vx }),
      ...(platform.minX === undefined || platform.maxX === undefined
        ? {}
        : { minX: width - platform.maxX, maxX: width - platform.minX }),
    })),
    spikes: level.spikes.map((spike) => mirrorRect(spike, width)),
    erasers: level.erasers.map((eraser) => ({
      ...eraser,
      x: width - eraser.x - eraser.w,
      vx: -eraser.vx,
      minX: width - eraser.maxX,
      maxX: width - eraser.minX,
    })),
    inkDrops: level.inkDrops.map((drop) => ({ ...drop, x: width - drop.x })),
    stars: level.stars.map((star) => ({
      ...mirrorRect(star, width),
      dimension: star.dimension === 'ANY' ? 'ANY' : oppositeDimension(star.dimension),
    })),
  };
}
