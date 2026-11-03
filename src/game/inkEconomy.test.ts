import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_INK,
  INK_PER_WORLD_UNIT,
  INK_PER_STAR,
  MAX_INK,
  consumeInkForSegment,
  restoreInk,
} from './inkEconomy.ts';

test('a drawing spends ink in proportion to its world-space length', () => {
  const segment = consumeInkForSegment(
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    80
  );
  assert.ok(segment);
  assert.equal(segment.inkSpent, 100 * INK_PER_WORLD_UNIT);
  assert.equal(segment.inkRemaining, 30);
  assert.deepEqual(segment.point, { x: 100, y: 0 });
});

test('a long pointer movement stops exactly where the ink reserve runs out', () => {
  const segment = consumeInkForSegment(
    { x: 10, y: 20 },
    { x: 410, y: 20 },
    40
  );
  assert.ok(segment);
  assert.equal(segment.inkSpent, 40);
  assert.equal(segment.inkRemaining, 0);
  assert.equal(segment.point.x, 90);
});

test('drawing cannot continue when the reserve is empty', () => {
  assert.equal(
    consumeInkForSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 0),
    null
  );
});

test('tiny pointer movements are accumulated instead of charging tiny fragments', () => {
  assert.equal(
    consumeInkForSegment({ x: 0, y: 0 }, { x: 7, y: 0 }, INITIAL_INK),
    null
  );
});

test('collecting a star restores ink but never exceeds the capacity', () => {
  assert.equal(restoreInk(20), 20 + INK_PER_STAR);
  assert.equal(restoreInk(90), MAX_INK);
});

test('restoring ink never creates a negative or over-capacity reserve', () => {
  assert.equal(restoreInk(-10), INK_PER_STAR);
  assert.equal(restoreInk(40, -20), 40);
});
