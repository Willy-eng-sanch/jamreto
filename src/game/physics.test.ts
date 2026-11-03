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
import { Eraser, Goal, Platform, PlayerState, Spike, StarCollectible } from './types.ts';

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
  const stroke = {
    id: 's1',
    points: [{ x: 50, y: 200 }, { x: 250, y: 200 }],
    targetDimension: 'WHITE' as const,
    color: '#000',
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

