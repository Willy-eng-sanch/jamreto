import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAABB,
  isPlatformPhysical,
  isHazardPhysical,
  stepSimulation,
  updateErasers,
  InputState,
} from './physics.ts';
import { DrawnStroke, Eraser, Goal, LevelData, Platform, PlayerState, Spike, StarCollectible } from './types.ts';
import { isStrokeSolidInDimension, isStrokeVisibleInDimension, mirrorPointHorizontally, mirrorLevelHorizontally, oppositeDimension, projectStrokeHorizontally } from './dimensionRules.ts';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    x: 100,
    y: 100,
    w: 24,
    h: 42,
    vx: 0,
    vy: 0,
    isGrounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpsLeft: 2,
    maxJumps: 2,
    facing: 'right',
    currentDimension: 'WHITE',
    isDead: false,
    runCycle: 0,
    squashX: 1,
    squashY: 1,
    shiftCooldown: 0,
    ...overrides,
  };
}

const emptyInput: InputState = {
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
  shiftPressed: false,
};

test('drawing is visible and non-solid in its source world, invisible and solid in its target world', () => {
  const stroke: DrawnStroke = {
    id: 'mirror-rule',
    points: [{ x: 100, y: 180 }, { x: 300, y: 220 }],
    sourceDimension: 'WHITE',
    targetDimension: 'BLACK',
    color: '#111111',
    createdAt: 1,
  };
  assert.equal(isStrokeVisibleInDimension(stroke, 'WHITE'), true);
  assert.equal(isStrokeSolidInDimension(stroke, 'WHITE'), false);
  assert.equal(isStrokeVisibleInDimension(stroke, 'BLACK'), false);
  assert.equal(isStrokeSolidInDimension(stroke, 'BLACK'), true);
  assert.equal(oppositeDimension('WHITE'), 'BLACK');
  assert.equal(oppositeDimension('BLACK'), 'WHITE');
});

test('stroke projection reflects coordinates so a left-to-right drawing becomes right-to-left', () => {
  const projected = projectStrokeHorizontally([{ x: 100, y: 200 }, { x: 300, y: 240 }], 1000);
  assert.deepEqual(projected, [{ x: 900, y: 200 }, { x: 700, y: 240 }]);
  assert.ok(projected[0].x > projected[1].x);
  assert.deepEqual(mirrorPointHorizontally({ x: 0, y: 12 }, 1000), { x: 1000, y: 12 });
});

test('right-hand world mirrors spawn, central goal, platforms, hazards and moving direction', () => {
  const level: LevelData = {
    id: 1, title: 'Test', subtitle: '', description: '',
    width: 200, height: 120,
    spawn: { x: 20, y: 40, initialDimension: 'WHITE' },
    goal: { id: 'goal', x: 160, y: 40, w: 40, h: 40 },
    platforms: [{ id: 'moving', x: 30, y: 80, w: 40, h: 10, physicalIn: 'BOTH', type: 'moving', vx: 10, minX: 10, maxX: 100 }],
    spikes: [{ id: 'spike', x: 50, y: 90, w: 10, h: 10, physicalIn: 'WHITE' }],
    erasers: [{ id: 'eraser', x: 20, y: 50, w: 10, h: 10, vx: 5, minX: 10, maxX: 80, physicalIn: 'BLACK' }],
    inkDrops: [{ id: 'drop', x: 60, y: 5, radius: 4, vy: 20, physicalIn: 'BLACK', spawnY: 5, respawnTime: 1, timer: 0 }],
    stars: [{ id: 'star', x: 90, y: 60, w: 10, h: 10, dimension: 'BLACK', collected: false }],
  };
  const black = mirrorLevelHorizontally(level);
  assert.equal(black.spawn.x, 158);
  assert.equal(black.goal.x, 0);
  assert.equal(black.platforms[0].x, 130);
  assert.equal(black.platforms[0].vx, -10);
  assert.equal(black.platforms[0].minX, 100);
  assert.equal(black.platforms[0].maxX, 190);
  assert.equal(black.spikes[0].x, 140);
  assert.equal(black.erasers[0].x, 170);
  assert.equal(black.erasers[0].vx, -5);
  assert.equal(black.erasers[0].minX, 120);
  assert.equal(black.erasers[0].maxX, 190);
  assert.equal(black.inkDrops[0].x, 140);
  assert.equal(black.stars[0].x, 100);
  assert.equal(black.stars[0].dimension, 'WHITE');
});

test('a character reaching the central goal is frozen until the other arrives', () => {
  const goal: Goal = { id: 'g', x: 100, y: 100, w: 30, h: 30 };
  const player = createMockPlayer({ x: 105, y: 100, isGrounded: true });
  const reached = stepSimulation(player, emptyInput, [], [], [], [], [], goal, 300, 300, 0.016);
  assert.equal(reached.clearedLevel, true);
  assert.equal(reached.player.isAtGoal, true);
  const frozenX = reached.player.x;
  const moved = stepSimulation(
    reached.player,
    { ...emptyInput, right: true, jumpPressed: true },
    [], [], [], [], [], goal, 300, 300, 0.5
  );
  assert.equal(moved.player.x, frozenX);
  assert.equal(moved.player.vx, 0);
  assert.equal(moved.player.isAtGoal, true);
});

test('inactive character does not advance physics while the other world is controlled', () => {
  const player = createMockPlayer({ x: 120, y: 140, vx: 90, vy: 180, isGrounded: false });
  const before = { ...player };
  const result = stepSimulation(
    player,
    { ...emptyInput, right: true, jumpPressed: true },
    [], [], [], [], [],
    { id: 'goal', x: 900, y: 900, w: 30, h: 30 },
    1000, 1000, 0.25, [], false
  );
  assert.equal(result.player, player);
  assert.deepEqual(result.player, before);
  assert.equal(result.didJump, false);
  assert.equal(result.didLand, false);
});

test('only the active world advances its own moving platforms', () => {
  const platforms: Platform[] = [
    { id: 'white', x: 10, y: 100, w: 20, h: 10, physicalIn: 'WHITE', type: 'moving', vx: 30, minX: 0, maxX: 100 },
    { id: 'black', x: 10, y: 120, w: 20, h: 10, physicalIn: 'BLACK', type: 'moving', vx: 30, minX: 0, maxX: 100 },
    { id: 'both', x: 10, y: 140, w: 20, h: 10, physicalIn: 'BOTH', type: 'moving', vx: 30, minX: 0, maxX: 100 },
  ];
  updateMovingPlatforms(platforms, 1, 'WHITE');
  assert.equal(platforms[0].x, 40);
  assert.equal(platforms[1].x, 10);
  assert.equal(platforms[2].x, 40);
});

test('checkAABB correctly detects overlapping and non-overlapping bounding boxes', () => {
  const boxA = { x: 0, y: 0, w: 20, h: 20 };
  const boxB = { x: 10, y: 10, w: 20, h: 20 };
  const boxC = { x: 50, y: 50, w: 20, h: 20 };

  assert.equal(checkAABB(boxA, boxB), true, 'Boxes A and B should overlap');
  assert.equal(checkAABB(boxA, boxC), false, 'Boxes A and C should not overlap');
});

test('Asymmetry rule: platforms are only solid in their designated dimension', () => {
  const whitePlatform: Platform = { id: 'p1', x: 0, y: 100, w: 100, h: 20, physicalIn: 'WHITE' };
  const blackPlatform: Platform = { id: 'p2', x: 0, y: 100, w: 100, h: 20, physicalIn: 'BLACK' };
  const bothPlatform: Platform = { id: 'p3', x: 0, y: 100, w: 100, h: 20, physicalIn: 'BOTH' };

  assert.equal(isPlatformPhysical(whitePlatform, 'WHITE'), true);
  assert.equal(isPlatformPhysical(whitePlatform, 'BLACK'), false);

  assert.equal(isPlatformPhysical(blackPlatform, 'WHITE'), false);
  assert.equal(isPlatformPhysical(blackPlatform, 'BLACK'), true);

  assert.equal(isPlatformPhysical(bothPlatform, 'WHITE'), true);
  assert.equal(isPlatformPhysical(bothPlatform, 'BLACK'), true);
});

test('Asymmetry rule: hazards kill player ONLY in their physical dimension, otherwise intangible mirage', () => {
  const spike: Spike = { id: 's1', x: 100, y: 100, w: 24, h: 24, physicalIn: 'WHITE' };
  const goal: Goal = { id: 'goal', x: 900, y: 900, w: 30, h: 30 };

  // Case 1: Player is in WHITE dimension and touches WHITE spike -> DEAD!
  const playerInWhite = createMockPlayer({ x: 100, y: 100, currentDimension: 'WHITE' });
  const result1 = stepSimulation(
    playerInWhite,
    emptyInput,
    [],
    [spike],
    [],
    [],
    [],
    goal,
    1000,
    1000,
    0.016
  );
  assert.equal(result1.player.isDead, true);
  assert.equal(result1.player.deathReason, 'Púas de Garabato');

  // Case 2: Player shifts to BLACK dimension and stands in the EXACT SAME spot -> ALIVE! (Intangible mirage!)
  const playerInBlack = createMockPlayer({ x: 100, y: 100, currentDimension: 'BLACK' });
  const result2 = stepSimulation(
    playerInBlack,
    emptyInput,
    [],
    [spike],
    [],
    [],
    [],
    goal,
    1000,
    1000,
    0.016
  );
  assert.equal(result2.player.isDead, false, 'White spike must be harmless in Black dimension');
});

test('Dimension shift toggles between WHITE and BLACK instantly with no delay', () => {
  const player = createMockPlayer({ currentDimension: 'WHITE' });
  const goal: Goal = { id: 'goal', x: 900, y: 900, w: 30, h: 30 };

  const shiftInput: InputState = { ...emptyInput, shiftPressed: true };
  const result = stepSimulation(player, shiftInput, [], [], [], [], [], goal, 1000, 1000, 0.016);

  assert.equal(result.didShift, true);
  assert.equal(result.player.currentDimension, 'BLACK');

  // Second shift flips back to WHITE
  const resultAgain = stepSimulation(result.player, shiftInput, [], [], [], [], [], goal, 1000, 1000, 0.016);
  assert.equal(resultAgain.player.currentDimension, 'WHITE');
});

test('Jump buffering and landing on platform', () => {
  const platform: Platform = { id: 'floor', x: 0, y: 200, w: 500, h: 40, physicalIn: 'WHITE' };
  const goal: Goal = { id: 'goal', x: 900, y: 900, w: 30, h: 30 };
  const player = createMockPlayer({ x: 100, y: 158, vy: 50, currentDimension: 'WHITE' });

  const result = stepSimulation(player, emptyInput, [platform], [], [], [], [], goal, 1000, 1000, 0.016);

  assert.equal(result.player.isGrounded, true);
  assert.equal(result.didLand, true);
  assert.equal(result.player.y, 158); // 200 - player.h (42)
});

test('Eraser patrols and inverts direction upon hitting bounds', () => {
  const erasers: Eraser[] = [
    { id: 'e1', x: 50, y: 100, w: 30, h: 20, vx: 100, minX: 40, maxX: 100, physicalIn: 'WHITE' }
  ];

  // Move right until hitting maxX
  updateErasers(erasers, 0.6); // 50 + 60 = 110, exceeds 100 - 30 = 70
  assert.equal(erasers[0].x, 70);
  assert.ok(erasers[0].vx < 0, 'Velocity should invert to negative');
});

test('Goal clear condition triggers when player reaches goal rect', () => {
  const goal: Goal = { id: 'g', x: 300, y: 300, w: 30, h: 30 };
  const player = createMockPlayer({ x: 305, y: 305, currentDimension: 'WHITE' });

  const result = stepSimulation(player, emptyInput, [], [], [], [], [], goal, 1000, 1000, 0.016);
  assert.equal(result.clearedLevel, true);
});

test('Double jump allows second jump in midair to conquer impossible gaps', () => {
  const goal: Goal = { id: 'g', x: 900, y: 900, w: 30, h: 30 };
  // Player is in midair (not grounded, coyoteTimer = 0, jumpsLeft = 1)
  const player = createMockPlayer({
    x: 100,
    y: 100,
    isGrounded: false,
    coyoteTimer: 0,
    jumpsLeft: 1,
    vy: 100,
    currentDimension: 'WHITE'
  });
  const jumpInput: InputState = { ...emptyInput, jumpPressed: true, jumpHeld: true };
  const result = stepSimulation(player, jumpInput, [], [], [], [], [], goal, 1000, 1000, 0.016);

  assert.equal(result.didJump, true);
  assert.ok(result.player.vy < 0, 'Velocity should become upward after double jump');
  assert.equal(result.player.jumpsLeft, 0);
});

test('Stickman can land and stand on drawn strokes designated for their dimension', () => {
  const goal: Goal = { id: 'g', x: 900, y: 900, w: 30, h: 30 };
  const stroke: DrawnStroke = {
    id: 's1',
    // Origin is BLACK; projection into WHITE mirrors these points to x=50..250.
    points: [{ x: 950, y: 200 }, { x: 750, y: 200 }],
    sourceDimension: 'BLACK',
    targetDimension: 'WHITE',
    color: '#ffffff',
    createdAt: Date.now()
  };

  // Player falling towards stroke at x=100, y=156 (feet at y+42 = 198, close to 200)
  const player = createMockPlayer({
    x: 100,
    y: 156,
    vy: 60,
    currentDimension: 'WHITE'
  });

  const result = stepSimulation(player, emptyInput, [], [], [], [], [], goal, 1000, 1000, 0.016, [stroke]);

  assert.equal(result.player.isGrounded, true);
  assert.equal(result.didLand, true);
  assert.equal(result.player.y, 200 - 42);
});

