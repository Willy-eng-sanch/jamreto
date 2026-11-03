import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from './levels.ts';

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

test('each campaign level has unique object identifiers', () => {
  for (const level of LEVELS) {
    const ids = [
      level.goal.id,
      ...level.platforms.map((item) => item.id),
      ...level.spikes.map((item) => item.id),
      ...level.erasers.map((item) => item.id),
      ...level.inkDrops.map((item) => item.id),
      ...level.stars.map((item) => item.id),
    ];
    assert.equal(new Set(ids).size, ids.length, `Level ${level.id} contains duplicate object IDs`);
  }
});

test('collectibles do not overlap static spikes in either reality', () => {
  for (const level of LEVELS) {
    for (const star of level.stars) {
      for (const spike of level.spikes) {
        assert.equal(
          overlaps(star, spike),
          false,
          `Level ${level.id}: collectible ${star.id} overlaps spike ${spike.id}`
        );
      }
    }
  }
});
