import type { StrokePoint } from './types.ts';

export const MAX_INK = 100;
export const INITIAL_INK = 80;
export const INK_PER_WORLD_UNIT = 0.5;
export const INK_PER_STAR = 30;
export const MIN_STROKE_SAMPLE_DISTANCE = 8;

export interface InkSegmentResult {
  point: StrokePoint;
  inkSpent: number;
  inkRemaining: number;
}

/**
 * Charges ink by the distance actually drawn. When the reserve runs out,
 * the returned point is clamped to the furthest affordable position.
 */
export function consumeInkForSegment(
  from: StrokePoint,
  to: StrokePoint,
  inkAvailable: number
): InkSegmentResult | null {
  if (!Number.isFinite(inkAvailable) || inkAvailable <= 0) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < MIN_STROKE_SAMPLE_DISTANCE) return null;

  const affordableDistance = Math.min(distance, inkAvailable / INK_PER_WORLD_UNIT);
  if (affordableDistance <= 0) return null;

  const ratio = affordableDistance / distance;
  const inkSpent = Math.min(inkAvailable, affordableDistance * INK_PER_WORLD_UNIT);

  return {
    point: {
      x: from.x + dx * ratio,
      y: from.y + dy * ratio,
    },
    inkSpent,
    inkRemaining: Math.max(0, inkAvailable - inkSpent),
  };
}

export function restoreInk(currentInk: number, amount = INK_PER_STAR): number {
  if (!Number.isFinite(currentInk) || !Number.isFinite(amount)) return currentInk;
  return Math.min(MAX_INK, Math.max(0, currentInk) + Math.max(0, amount));
}
