import { Dimension, DrawnStroke, Eraser, Goal, InkDrop, Platform, PlayerState, Rect, Spike, StarCollectible } from './types.ts';

export const GRAVITY = 1050;
export const MOVE_SPEED = 260;
export const ACCELERATION = 2000;
export const DECELERATION = 1800;
export const JUMP_VELOCITY = -500;
export const COYOTE_TIME = 0.15;
export const JUMP_BUFFER_TIME = 0.15;
export const MAX_FALL_SPEED = 650;

export function createDefaultPlayer(x: number, y: number, dimension: Dimension): PlayerState {
  return {
    x,
    y,
    w: 22,
    h: 40,
    vx: 0,
    vy: 0,
    isGrounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpsLeft: 2,
    maxJumps: 2,
    facing: 'right',
    currentDimension: dimension,
    isDead: false,
    runCycle: 0,
    squashX: 1,
    squashY: 1,
    shiftCooldown: 0,
    isAtGoal: false,
  };
}

export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function isPlatformPhysical(platform: Platform, currentDimension: Dimension): boolean {
  return platform.physicalIn === 'BOTH' || platform.physicalIn === currentDimension;
}

export function isHazardPhysical(hazard: { physicalIn: Dimension }, currentDimension: Dimension): boolean {
  return hazard.physicalIn === currentDimension;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  shiftPressed: boolean;
}

export function updateMovingPlatforms(platforms: Platform[], dt: number): void {
  for (const plat of platforms) {
    if (plat.type === 'moving' && plat.vx !== undefined && plat.minX !== undefined && plat.maxX !== undefined) {
      plat.x += plat.vx * dt;
      if (plat.x <= plat.minX) {
        plat.x = plat.minX;
        plat.vx = Math.abs(plat.vx);
      } else if (plat.x + plat.w >= plat.maxX) {
        plat.x = plat.maxX - plat.w;
        plat.vx = -Math.abs(plat.vx);
      }
    }
  }
}

export function updateErasers(erasers: Eraser[], dt: number): void {
  for (const eraser of erasers) {
    eraser.x += eraser.vx * dt;
    if (eraser.x <= eraser.minX) {
      eraser.x = eraser.minX;
      eraser.vx = Math.abs(eraser.vx);
    } else if (eraser.x + eraser.w >= eraser.maxX) {
      eraser.x = eraser.maxX - eraser.w;
      eraser.vx = -Math.abs(eraser.vx);
    }
  }
}

export function updateInkDrops(
  inkDrops: InkDrop[],
  platforms: Platform[],
  worldHeight: number,
  dt: number
): void {
  for (const drop of inkDrops) {
    if (drop.timer > 0) {
      drop.timer -= dt;
      if (drop.timer <= 0) {
        drop.y = drop.spawnY;
        drop.vy = 80;
      }
      continue;
    }

    drop.vy += GRAVITY * 0.7 * dt;
    drop.y += drop.vy * dt;

    // Check collision with platform in the drop's dimension or world bottom
    let hitFloor = drop.y > worldHeight + 20;
    if (!hitFloor) {
      for (const plat of platforms) {
        if (isPlatformPhysical(plat, drop.physicalIn)) {
          if (
            drop.x >= plat.x &&
            drop.x <= plat.x + plat.w &&
            drop.y >= plat.y &&
            drop.y <= plat.y + plat.h + 8
          ) {
            hitFloor = true;
            break;
          }
        }
      }
    }

    if (hitFloor) {
      drop.timer = drop.respawnTime;
      drop.y = -999;
    }
  }
}

export interface StepResult {
  player: PlayerState;
  didJump: boolean;
  didLand: boolean;
  didShift: boolean;
  clearedLevel: boolean;
  collectedStars: string[];
}

export function stepSimulation(
  player: PlayerState,
  inputs: InputState,
  platforms: Platform[],
  spikes: Spike[],
  erasers: Eraser[],
  inkDrops: InkDrop[],
  stars: StarCollectible[],
  goal: Goal,
  worldWidth: number,
  worldHeight: number,
  dt: number,
  drawnStrokes: DrawnStroke[] = []
): StepResult {
  let didJump = false;
  let didLand = false;
  let didShift = false;
  let clearedLevel = false;
  const collectedStars: string[] = [];

  if (player.isDead) {
    return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
  }

  // 1. Dimension shift input (instantaneous toggle, no cooldown block)
  if (inputs.shiftPressed) {
    player.currentDimension = player.currentDimension === 'WHITE' ? 'BLACK' : 'WHITE';
    didShift = true;
    player.shiftCooldown = 0.05;
  } else if (player.shiftCooldown > 0) {
    player.shiftCooldown -= dt;
  }

  // 2. Timers
  if (player.isGrounded) {
    player.coyoteTimer = COYOTE_TIME;
    player.jumpsLeft = player.maxJumps ?? 2;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (inputs.jumpPressed) {
    player.jumpBufferTimer = JUMP_BUFFER_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  // 3. Horizontal movement
  let targetVx = 0;
  if (inputs.left && !inputs.right) {
    targetVx = -MOVE_SPEED;
    player.facing = 'left';
  } else if (inputs.right && !inputs.left) {
    targetVx = MOVE_SPEED;
    player.facing = 'right';
  }

  if (targetVx !== 0) {
    if (Math.sign(player.vx) === Math.sign(targetVx) || player.vx === 0) {
      player.vx = moveTowards(player.vx, targetVx, ACCELERATION * dt);
    } else {
      player.vx = moveTowards(player.vx, targetVx, (ACCELERATION + DECELERATION) * dt);
    }
  } else {
    player.vx = moveTowards(player.vx, 0, DECELERATION * dt);
  }

  // Horizontal walk bob / cycle
  if (Math.abs(player.vx) > 10 && player.isGrounded) {
    player.runCycle += Math.abs(player.vx) * dt * 0.05;
  }

  // 4. Jump execution with Coyote time, Jump buffer & Double Jump
  const canGroundJump = player.coyoteTimer > 0;
  if (player.jumpBufferTimer > 0 && canGroundJump) {
    player.vy = JUMP_VELOCITY;
    player.isGrounded = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpsLeft = (player.maxJumps ?? 2) - 1;
    player.squashX = 0.82;
    player.squashY = 1.25;
    didJump = true;
  } else if (inputs.jumpPressed && (player.jumpsLeft ?? 0) > 0 && !canGroundJump) {
    // Air jump / Double Jump (guarantees impossible jumps are solvable!)
    player.vy = JUMP_VELOCITY * 0.94;
    player.isGrounded = false;
    player.jumpsLeft -= 1;
    player.jumpBufferTimer = 0;
    player.squashX = 0.84;
    player.squashY = 1.20;
    didJump = true;
  }

  // Variable jump height cut when releasing jump key
  if (!inputs.jumpHeld && player.vy < -80) {
    player.vy *= 0.50;
  }

  // 5. Apply Gravity
  player.vy += GRAVITY * dt;
  if (player.vy > MAX_FALL_SPEED) {
    player.vy = MAX_FALL_SPEED;
  }

  // 6. Horizontal Collision Resolution
  player.x += player.vx * dt;

  // Keep within world bounds horizontally
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.w > worldWidth) {
    player.x = worldWidth - player.w;
    player.vx = 0;
  }

  // Check horizontal platform collisions for active dimension
  for (const plat of platforms) {
    if (!isPlatformPhysical(plat, player.currentDimension)) continue;

    if (checkAABB(player, plat)) {
      if (player.vx > 0) {
        player.x = plat.x - player.w;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.w;
      }
      player.vx = 0;
    }
  }

  // 7. Vertical Collision Resolution
  const wasGrounded = player.isGrounded;
  player.isGrounded = false;
  player.y += player.vy * dt;

  for (const plat of platforms) {
    if (!isPlatformPhysical(plat, player.currentDimension)) continue;

    if (checkAABB(player, plat)) {
      if (player.vy > 0) {
        // Falling onto platform
        player.y = plat.y - player.h;
        player.vy = 0;
        player.isGrounded = true;
        if (!wasGrounded) {
          didLand = true;
          player.squashX = 1.22;
          player.squashY = 0.78;
        }
      } else if (player.vy < 0) {
        // Hitting ceiling
        player.y = plat.y + plat.h;
        player.vy = 0;
      }
    }
  }

  // Check collision with Drawn Strokes (Aids drawn by the other stickman!)
  for (const stroke of drawnStrokes) {
    if (stroke.targetDimension !== player.currentDimension) continue;
    const pts = stroke.points;
    if (!pts || pts.length < 2) continue;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const minX = Math.min(p1.x, p2.x) - 4;
      const maxX = Math.max(p1.x, p2.x) + 4;
      const playerFeetX = player.x + player.w * 0.5;

      if (playerFeetX >= minX && playerFeetX <= maxX) {
        const dx = p2.x - p1.x;
        const t = Math.abs(dx) > 0.001 ? (playerFeetX - p1.x) / dx : 0.5;
        const clampedT = Math.max(0, Math.min(1, t));
        const segY = p1.y + (p2.y - p1.y) * clampedT;

        const feetY = player.y + player.h;
        if (player.vy >= 0 && feetY >= segY - 14 && feetY <= segY + 16) {
          player.y = segY - player.h;
          player.vy = 0;
          player.isGrounded = true;
          player.coyoteTimer = COYOTE_TIME;
          player.jumpsLeft = player.maxJumps ?? 2;
          if (!wasGrounded) {
            didLand = true;
            player.squashX = 1.18;
            player.squashY = 0.82;
          }
        }
      }
    }
  }

  // Squash/stretch decay back to 1
  player.squashX += (1 - player.squashX) * Math.min(1, 16 * dt);
  player.squashY += (1 - player.squashY) * Math.min(1, 16 * dt);

  // 8. Hazard Collisions (Asymmetry Rule!)
  // In the active dimension, only hazards physical in this dimension can hurt the player.
  // In the opposite dimension, they are harmless mirages!

  // Spikes check
  for (const spike of spikes) {
    if (isHazardPhysical(spike, player.currentDimension)) {
      // Slightly inset hitbox for fairness
      const spikeHitbox: Rect = {
        x: spike.x + 3,
        y: spike.y + 4,
        w: spike.w - 6,
        h: spike.h - 5
      };
      if (checkAABB(player, spikeHitbox)) {
        player.isDead = true;
        player.deathReason = 'Púas de Garabato';
        return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
      }
    }
  }

  // Eraser check
  for (const eraser of erasers) {
    if (isHazardPhysical(eraser, player.currentDimension)) {
      const eraserHitbox: Rect = {
        x: eraser.x + 4,
        y: eraser.y + 2,
        w: eraser.w - 8,
        h: eraser.h - 4
      };
      if (checkAABB(player, eraserHitbox)) {
        player.isDead = true;
        player.deathReason = 'La Goma de Borrar';
        return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
      }
    }
  }

  // Ink drop check
  for (const drop of inkDrops) {
    if (drop.timer <= 0 && isHazardPhysical(drop, player.currentDimension)) {
      const dropBox: Rect = {
        x: drop.x - drop.radius * 0.75,
        y: drop.y - drop.radius * 0.75,
        w: drop.radius * 1.5,
        h: drop.radius * 1.5
      };
      if (checkAABB(player, dropBox)) {
        player.isDead = true;
        player.deathReason = 'Gota de Tinta';
        return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
      }
    }
  }

  // Abyss check (falling off the notebook page bottom)
  if (player.y > worldHeight + 60) {
    player.isDead = true;
    player.deathReason = 'Caída al Vacío';
    return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
  }

  // 9. Collectibles check
  for (const star of stars) {
    if (!star.collected) {
      if (star.dimension === 'ANY' || star.dimension === player.currentDimension) {
        if (checkAABB(player, star)) {
          star.collected = true;
          collectedStars.push(star.id);
        }
      }
    }
  }

  // 10. Goal check
  if (checkAABB(player, goal)) {
    clearedLevel = true;
  }

  return { player, didJump, didLand, didShift, clearedLevel, collectedStars };
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}
