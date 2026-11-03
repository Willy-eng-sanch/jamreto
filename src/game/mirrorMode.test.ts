import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMirrorCollisionData, getNextActiveStickman, syncMirroredPlayer } from './mirrorMode.ts';
import { createDefaultPlayer, stepSimulation } from './physics.ts';
import type { DrawnStroke, LevelData } from './types.ts';

function makeLevel(): LevelData {
  return {
    id: 1, title: 'Mirror test', subtitle: '', description: '',
    width: 500, height: 300,
    spawn: { x: 40, y: 200, initialDimension: 'WHITE' },
    goal: { id: 'goal', x: 450, y: 200, w: 30, h: 50 },
    platforms: [
      { id: 'floor', x: 0, y: 250, w: 500, h: 50, physicalIn: 'BOTH' },
      { id: 'white-wall', x: 100, y: 180, w: 25, h: 70, physicalIn: 'WHITE' },
      { id: 'black-wall', x: 300, y: 180, w: 25, h: 70, physicalIn: 'BLACK' },
    ],
    spikes: [
      { id: 'white-spike', x: 150, y: 225, w: 30, h: 25, physicalIn: 'WHITE' },
      { id: 'black-spike', x: 350, y: 225, w: 30, h: 25, physicalIn: 'BLACK' },
    ],
    erasers: [
      { id: 'white-eraser', x: 180, y: 200, w: 30, h: 30, vx: 0, minX: 180, maxX: 220, physicalIn: 'WHITE' },
      { id: 'black-eraser', x: 380, y: 200, w: 30, h: 30, vx: 0, minX: 380, maxX: 420, physicalIn: 'BLACK' },
    ],
    inkDrops: [
      { id: 'white-drop', x: 230, y: 210, radius: 8, vy: 0, physicalIn: 'WHITE', spawnY: 210, respawnTime: 1, timer: 0 },
      { id: 'black-drop', x: 260, y: 210, radius: 8, vy: 0, physicalIn: 'BLACK', spawnY: 210, respawnTime: 1, timer: 0 },
    ],
    stars: [
      { id: 'white-star', x: 80, y: 180, w: 10, h: 10, dimension: 'WHITE', collected: false },
      { id: 'black-star', x: 320, y: 180, w: 10, h: 10, dimension: 'BLACK', collected: false },
    ],
  };
}

test('mirror player remains an exact horizontal and vertical reflection', () => {
  const source = createDefaultPlayer(120, 90, 'WHITE');
  const mirror = createDefaultPlayer(0, 0, 'BLACK');
  source.vx = 160;
  source.vy = -220;
  source.facing = 'right';
  source.jumpsLeft = 1;
  source.isGrounded = false;
  syncMirroredPlayer(source, mirror, 500);
  assert.equal(mirror.x, 358);
  assert.equal(mirror.y, source.y);
  assert.equal(mirror.vx, -source.vx);
  assert.equal(mirror.vy, source.vy);
  assert.equal(mirror.facing, 'left');
  assert.equal(mirror.jumpsLeft, source.jumpsLeft);
});

test('mirror collision data combines obstacles from both realities', () => {
  const data = buildMirrorCollisionData(makeLevel(), []);
  assert.deepEqual(data.platforms.map((platform) => platform.id), ['floor']);
  assert.ok(data.platforms.every((platform) => platform.physicalIn === 'BOTH'));
  assert.ok(data.spikes.every((spike) => spike.physicalIn === 'WHITE'));
  assert.ok(data.erasers.every((eraser) => eraser.physicalIn === 'WHITE'));
  assert.ok(data.inkDrops.every((drop) => drop.physicalIn === 'WHITE'));
  assert.ok(data.stars.every((star) => star.dimension === 'ANY'));
});

test('phase-exclusive walls and platforms never block the shared mirror route', () => {
  const level = makeLevel();
  const data = buildMirrorCollisionData(level, []);
  const player = createDefaultPlayer(90, 190, 'WHITE');
  const startingX = player.x;
  player.vx = 260;
  const result = stepSimulation(
    player, { left: false, right: true, jumpPressed: false, jumpHeld: false, shiftPressed: false },
    data.platforms, [], [], [], [], { id: 'far-goal', x: 480, y: 0, w: 10, h: 10 },
    level.width, level.height, 0.016, []
  );
  assert.equal(result.player.x > startingX, true);
  assert.equal(data.platforms.some((platform) => platform.id === 'white-wall' || platform.id === 'black-wall'), false);
});

test('BLACK-side traces are projected back into the canonical shared route', () => {
  const stroke: DrawnStroke = {
    id: 'black-trace',
    points: [{ x: 50, y: 180 }, { x: 150, y: 180 }],
    sourceDimension: 'BLACK', targetDimension: 'WHITE', mirrorToTarget: true,
    color: '#fff', createdAt: 1,
  };
  const data = buildMirrorCollisionData(makeLevel(), [stroke]);
  assert.equal(data.strokes[0].targetDimension, 'WHITE');
  assert.equal(data.strokes[0].mirrorToTarget, true);
});

test('a BLACK-side drawing supports the mirrored player at its reflected coordinates', () => {
  const stroke: DrawnStroke = {
    id: 'black-side-bridge',
    points: [{ x: 350, y: 180 }, { x: 450, y: 180 }],
    sourceDimension: 'BLACK', targetDimension: 'WHITE', mirrorToTarget: true,
    color: '#fff', createdAt: 1,
  };
  const level = makeLevel();
  const data = buildMirrorCollisionData(level, [stroke]);
  const player = createDefaultPlayer(90, 138, 'WHITE');
  player.vy = 50;
  const result = stepSimulation(
    player, { left: false, right: false, jumpPressed: false, jumpHeld: false, shiftPressed: false },
    [], [], [], [], [], { id: 'far-goal', x: 480, y: 0, w: 10, h: 10 },
    level.width, level.height, 0.016, data.strokes
  );
  assert.equal(result.player.isGrounded, true);
  assert.equal(result.player.y, 140);
});

test('a hazard from either reality is included in shared collision physics', () => {
  const level = makeLevel();
  const data = buildMirrorCollisionData(level, []);
  const player = createDefaultPlayer(342, 190, 'WHITE');
  const result = stepSimulation(
    player, { left: false, right: false, jumpPressed: false, jumpHeld: false, shiftPressed: false },
    data.platforms, data.spikes, data.erasers, data.inkDrops, data.stars,
    { id: 'far-goal', x: 480, y: 0, w: 10, h: 10 },
    level.width, level.height, 0.016, data.strokes
  );
  assert.equal(result.player.isDead, true);
  assert.equal(result.player.deathReason, 'Púas de Garabato');
});

test('a WHITE-side drawing supports the shared route without reflecting its canonical X coordinates', () => {
  const stroke: DrawnStroke = {
    id: 'white-side-bridge',
    points: [{ x: 50, y: 180 }, { x: 150, y: 180 }],
    sourceDimension: 'WHITE', targetDimension: 'BLACK', mirrorToTarget: false,
    color: '#111', createdAt: 1,
  };
  const level = makeLevel();
  const data = buildMirrorCollisionData(level, [stroke]);
  const player = createDefaultPlayer(90, 138, 'WHITE');
  player.vy = 50;
  const result = stepSimulation(
    player, { left: false, right: false, jumpPressed: false, jumpHeld: false, shiftPressed: false },
    [], [], [], [], [], { id: 'far-goal', x: 480, y: 0, w: 10, h: 10 },
    level.width, level.height, 0.016, data.strokes
  );
  assert.equal(result.player.isGrounded, true);
  assert.equal(result.player.y, 140);
});

test('a gap without a projected bridge leaves the shared player unsupported', () => {
  const level = makeLevel();
  const data = buildMirrorCollisionData(level, []);
  const player = createDefaultPlayer(90, 138, 'WHITE');
  player.vy = 50;
  const result = stepSimulation(
    player, { left: false, right: false, jumpPressed: false, jumpHeld: false, shiftPressed: false },
    [], [], [], [], [], { id: 'far-goal', x: 480, y: 0, w: 10, h: 10 },
    level.width, level.height, 0.016, data.strokes
  );
  assert.equal(result.player.isGrounded, false);
  assert.ok(result.player.y > 138);
});

test('SHIFT toggles the selected drawing reality without mutating movement state', () => {
  const source = createDefaultPlayer(120, 90, 'WHITE');
  source.vx = 160;
  source.vy = -220;
  const before = { ...source };

  assert.equal(getNextActiveStickman('BLACK'), 'WHITE');
  assert.equal(getNextActiveStickman('WHITE'), 'BLACK');
  assert.deepEqual(source, before);
});
