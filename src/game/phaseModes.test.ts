import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSwitchDimension,
  createDefaultPlayer,
  stepSimulation,
} from './physics.ts';
import type { DrawnStroke } from './types.ts';

const emptyInput = {
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
  shiftPressed: false,
};

const farGoal = { id: 'far-goal', x: 900, y: 900, w: 30, h: 30 };

test('Contrast phase switch is rejected when the destination phase would overlap a solid wall', () => {
  const player = createDefaultPlayer(100, 100, 'WHITE');
  const blackWall = { id: 'black-wall', x: 110, y: 110, w: 60, h: 70, physicalIn: 'BLACK' as const };
  assert.equal(canSwitchDimension(player, 'BLACK', [blackWall], [], [], []), false);
  assert.equal(canSwitchDimension(player, 'WHITE', [blackWall], [], [], []), true);
});

test('Contrast strokes become solid in the opposite phase without horizontal mirroring', () => {
  const stroke: DrawnStroke = {
    id: 'same-coordinate-bridge',
    points: [{ x: 50, y: 200 }, { x: 250, y: 200 }],
    sourceDimension: 'WHITE',
    targetDimension: 'BLACK',
    mirrorToTarget: false,
    color: '#0f172a',
    createdAt: 1,
  };
  const player = createDefaultPlayer(100, 158, 'BLACK');
  player.vy = 50;
  const result = stepSimulation(
    player, emptyInput, [], [], [], [], [], farGoal,
    1000, 1000, 0.016, [stroke]
  );
  assert.equal(result.player.isGrounded, true);
  assert.equal(result.player.y, 160);
});

test('Mirror strokes keep the reflected horizontal projection', () => {
  const stroke: DrawnStroke = {
    id: 'mirrored-bridge',
    points: [{ x: 50, y: 200 }, { x: 250, y: 200 }],
    sourceDimension: 'WHITE',
    targetDimension: 'BLACK',
    mirrorToTarget: true,
    color: '#0f172a',
    createdAt: 1,
  };
  const player = createDefaultPlayer(100, 158, 'BLACK');
  player.vy = 50;
  const result = stepSimulation(
    player, emptyInput, [], [], [], [], [], farGoal,
    1000, 1000, 0.016, [stroke]
  );
  assert.equal(result.player.isGrounded, false);
});
