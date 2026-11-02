import {
  Dimension,
  DrawnStroke,
  Eraser,
  Goal,
  InkDrop,
  Particle,
  Platform,
  PlayerState,
  Spike,
  StarCollectible,
  StrokePoint,
} from './types.ts';
import { buildStickmanPose } from './stickmanRig.ts';

const MAX_PARTICLES = 200;

type HanddrawnSpriteName =
  | 'orb'
  | 'triangle'
  | 'stars'
  | 'lightbulb'
  | 'horizontalLine'
  | 'torsoPlate'
  | 'torsoLink'
  | 'upperArm'
  | 'lowerArm'
  | 'upperLeg'
  | 'lowerLeg'
  | 'joint'
  | 'foot'
  | 'hand';

const HANDDRAWN_SPRITE_TILE_SIZE = 64;
const HANDDRAWN_SPRITES: Record<HanddrawnSpriteName, { col: number; row: number }> = {
  orb: { col: 0, row: 0 },
  triangle: { col: 4, row: 1 },
  stars: { col: 2, row: 2 },
  lightbulb: { col: 3, row: 2 },
  horizontalLine: { col: 4, row: 3 },
  // Provisional anatomy mapping based on the author's separated parts:
  // sphere=head, triangular plate=chest, tapered plate=abdomen,
  // duplicated capsules=limb segments, washer=joint, hand=hand, wedge=foot.
  torsoLink: { col: 1, row: 0 },
  torsoPlate: { col: 2, row: 0 },
  upperArm: { col: 3, row: 0 },
  lowerArm: { col: 4, row: 0 },
  upperLeg: { col: 0, row: 1 },
  lowerLeg: { col: 1, row: 1 },
  joint: { col: 3, row: 1 },
  foot: { col: 4, row: 1 },
  hand: { col: 0, row: 2 },
};

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  viewportY: number;
  viewportH: number;
  viewportW: number;
}

export class GameRenderer {
  private particles: Particle[] = [];
  private handdrawnAtlas: HTMLImageElement | null = null;
  private particleIndex = 0;
  public cameraShake = 0;
  private swapAnimProgress = 0; // 0 to 1 smooth flip
  private targetSwapAnim = 0;
  public lastTopTransform: ViewportTransform = { scale: 1, offsetX: 0, offsetY: 0, viewportY: 0, viewportH: 270, viewportW: 960 };
  public lastBottomTransform: ViewportTransform = { scale: 1, offsetX: 0, offsetY: 0, viewportY: 270, viewportH: 270, viewportW: 960 };

  constructor() {
    const atlas = new Image();
    atlas.src = '/assets/sprites/handdrawn-atlas.png';
    this.handdrawnAtlas = atlas;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#000',
        dimension: 'ALL',
        type: 'pencil',
      });
    }
  }

  private drawHanddrawnSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HanddrawnSpriteName,
    x: number,
    y: number,
    width: number,
    height: number,
    dimension: Dimension,
    rotation = 0
  ): boolean {
    const atlas = this.handdrawnAtlas;
    if (!atlas || !atlas.complete || atlas.naturalWidth === 0) return false;

    const frame = HANDDRAWN_SPRITES[sprite];
    const tile = HANDDRAWN_SPRITE_TILE_SIZE;

    ctx.save();
    ctx.filter = dimension === 'BLACK' ? 'invert(1)' : 'none';
    if (rotation !== 0) {
      ctx.translate(x + width * 0.5, y + height * 0.5);
      ctx.rotate(rotation);
      ctx.drawImage(
        atlas,
        frame.col * tile,
        frame.row * tile,
        tile,
        tile,
        -width * 0.5,
        -height * 0.5,
        width,
        height
      );
    } else {
      ctx.drawImage(
        atlas,
        frame.col * tile,
        frame.row * tile,
        tile,
        tile,
        x,
        y,
        width,
        height
      );
    }
    ctx.restore();
    return true;
  }

  public triggerShift(isSwapped: boolean): void {
    this.targetSwapAnim = isSwapped ? 1 : 0;
    this.cameraShake = Math.max(this.cameraShake, 7);
  }

  public spawnParticles(
    x: number,
    y: number,
    count: number,
    type: Particle['type'],
    color: string,
    dimension: Dimension | 'ALL'
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleIndex];
      this.particleIndex = (this.particleIndex + 1) % MAX_PARTICLES;

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.maxLife = 0.3 + Math.random() * 0.45;
      p.life = p.maxLife;
      p.size = 2 + Math.random() * 3.5;
      p.color = color;
      p.dimension = dimension;
      p.type = type;
    }
  }

  public update(dt: number): void {
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - 18 * dt);
    }

    // Smooth swap animation transition
    const diff = this.targetSwapAnim - this.swapAnimProgress;
    if (Math.abs(diff) > 0.001) {
      this.swapAnimProgress += diff * Math.min(1, 12 * dt);
    } else {
      this.swapAnimProgress = this.targetSwapAnim;
    }

    // Update particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt;
      }
    }
  }

  /**
   * Main render call for the dual vertical split screen.
   */
  public renderDualWorld(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    levelW: number,
    levelH: number,
    playerBlack: PlayerState,
    playerWhite: PlayerState,
    activeStickman: 'BLACK' | 'WHITE',
    isScreenSwapped: boolean,
    platforms: Platform[],
    spikes: Spike[],
    erasers: Eraser[],
    inkDrops: InkDrop[],
    stars: StarCollectible[],
    goal: Goal,
    levelTitle: string,
    drawnStrokes: DrawnStroke[],
    currentDrawing: { points: StrokePoint[]; targetDimension: Dimension; color: string } | null,
    time: number
  ): { topTransform: ViewportTransform; bottomTransform: ViewportTransform } {
    ctx.save();

    // Camera shake translation
    if (this.cameraShake > 0) {
      const shakeMag = this.cameraShake * this.cameraShake * 0.12;
      const ox = (Math.random() * 2 - 1) * shakeMag;
      const oy = (Math.random() * 2 - 1) * shakeMag;
      ctx.translate(ox, oy);
    }

    const halfH = canvasH / 2;

    // Smooth interpolation of swap: t = 0 means normal (Top: White, Bottom: Black)
    // t = 1 means swapped (Top: Black, Bottom: White)
    const t = this.swapAnimProgress;

    // Viewport geometry
    // Normal:
    // Light World (WHITE) is at Y = 0 (offset by t * halfH)
    // Dark World (BLACK) is at Y = halfH (offset by -t * halfH)
    const whiteViewportY = t * halfH;
    const blackViewportY = (1 - t) * halfH;

    // Compute transforms to fit level in each half viewport
    const scale = Math.min(canvasW / levelW, halfH / levelH);
    const offsetX = (canvasW - levelW * scale) * 0.5;
    const offsetY = (halfH - levelH * scale) * 0.5;

    // 1. Render Light World (Fondo Blanco, Stickman Negro)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, whiteViewportY, canvasW, halfH);
    ctx.clip();
    ctx.translate(offsetX, whiteViewportY + offsetY);
    ctx.scale(scale, scale);

    this.renderSingleWorld(
      ctx,
      levelW,
      levelH,
      'WHITE',
      playerBlack,
      playerWhite,
      activeStickman === 'BLACK',
      platforms,
      spikes,
      erasers,
      inkDrops,
      stars,
      goal,
      drawnStrokes,
      time
    );
    ctx.restore();

    // 2. Render Dark World (Fondo Negro, Stickman Blanco)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, blackViewportY, canvasW, halfH);
    ctx.clip();
    ctx.translate(offsetX, blackViewportY + offsetY);
    ctx.scale(scale, scale);

    this.renderSingleWorld(
      ctx,
      levelW,
      levelH,
      'BLACK',
      playerWhite,
      playerBlack,
      activeStickman === 'WHITE',
      platforms,
      spikes,
      erasers,
      inkDrops,
      stars,
      goal,
      drawnStrokes,
      time
    );
    ctx.restore();

    // 3. Render any currently active drawing stroke preview
    if (currentDrawing && currentDrawing.points.length > 0) {
      // Find which viewport the stroke is being drawn into
      // Note: stroke targetDimension is the beneficiary world; so it was drawn in the OPPOSITE world!
      const drawnInWorld: Dimension = currentDrawing.targetDimension === 'WHITE' ? 'BLACK' : 'WHITE';
      const vpY = drawnInWorld === 'WHITE' ? whiteViewportY : blackViewportY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, vpY, canvasW, halfH);
      ctx.clip();
      ctx.translate(offsetX, vpY + offsetY);
      ctx.scale(scale, scale);

      // Draw faint ink trail while actively drawing
      ctx.strokeStyle = drawnInWorld === 'WHITE' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      const pts = currentDrawing.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Pen nib / chalk dust cursor at last point
      const lastPt = pts[pts.length - 1];
      ctx.fillStyle = drawnInWorld === 'WHITE' ? '#0f172a' : '#ffffff';
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 4. Render Center Divider (Notebook Spine / Binding & Shift Prompt)
    const seamY = halfH;
    ctx.save();
    // Spine band
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, seamY - 5, canvasW, 10);

    // Glowing border lines on seam
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, seamY - 5);
    ctx.lineTo(canvasW, seamY - 5);
    ctx.stroke();

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, seamY + 5);
    ctx.lineTo(canvasW, seamY + 5);
    ctx.stroke();

    // Center pill indicator for swap
    const badgeW = 220;
    const badgeH = 26;
    const badgeX = (canvasW - badgeW) / 2;
    const badgeY = seamY - badgeH / 2;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⇅ [SHIFT] INTERCAMBIAR MITADES', canvasW / 2, seamY);

    ctx.restore();

    ctx.restore();

    const topVpY = 0;
    const botVpY = halfH;

    this.lastTopTransform = {
      scale,
      offsetX,
      offsetY,
      viewportY: topVpY,
      viewportH: halfH,
      viewportW: canvasW,
    };

    this.lastBottomTransform = {
      scale,
      offsetX,
      offsetY,
      viewportY: botVpY,
      viewportH: halfH,
      viewportW: canvasW,
    };

    return {
      topTransform: this.lastTopTransform,
      bottomTransform: this.lastBottomTransform,
    };
  }

  /**
   * Renders a single world (either WHITE Light world or BLACK Dark world).
   */
  private renderSingleWorld(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    worldDimension: Dimension,
    residentPlayer: PlayerState,
    otherPlayer: PlayerState,
    isActiveStickman: boolean,
    platforms: Platform[],
    spikes: Spike[],
    erasers: Eraser[],
    inkDrops: InkDrop[],
    stars: StarCollectible[],
    goal: Goal,
    drawnStrokes: DrawnStroke[],
    time: number
  ): void {
    const isWhite = worldDimension === 'WHITE';

    // 1. Background
    this.drawWorldBackground(ctx, width, height, isWhite, time);

    // 2. Platforms
    this.renderPlatforms(ctx, platforms, worldDimension, time);

    // 3. Drawn Strokes (Bridges drawn by the other stickman!)
    this.renderDrawnStrokes(ctx, drawnStrokes, worldDimension);

    // 4. Hazards (Asymmetry + Cross-Vision Rules)
    this.renderHazards(ctx, spikes, erasers, inkDrops, worldDimension, time);

    // 5. Collectibles & Goal
    this.renderStars(ctx, stars, worldDimension, time);
    this.renderGoal(ctx, goal, isWhite, time);

    // 6. Ghost of the other stickman (faint pencil/chalk trace so you see where your partner is)
    this.renderGhostPlayer(ctx, otherPlayer, isWhite);

    // 7. Resident Stickman
    this.renderStickman(ctx, residentPlayer, isWhite, isActiveStickman, time);

    // 8. Particles
    this.renderParticles(ctx, worldDimension);

    // 9. World Watermark Header
    ctx.save();
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'right';
    if (isWhite) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillText('MUNDO BLANCO · STICKMAN NEGRO', width - 20, 24);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('MUNDO NEGRO · STICKMAN BLANCO', width - 20, 24);
    }
    ctx.restore();
  }

  private drawWorldBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isWhite: boolean,
    time: number
  ): void {
    if (isWhite) {
      // Creamy sketchbook paper
      ctx.fillStyle = '#f9f8f3';
      ctx.fillRect(0, 0, width, height);

      // Light blue sketchbook grid
      ctx.strokeStyle = '#e2e7ec';
      ctx.lineWidth = 1;
      const gridSize = 24;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Red vertical school margin
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(48, height);
      ctx.stroke();

      // Binder holes
      ctx.fillStyle = '#e2e8f0';
      for (let y = 20; y < height; y += 45) {
        ctx.beginPath();
        ctx.ellipse(16, y, 6, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // Blackboard / Void paper
      ctx.fillStyle = '#101216';
      ctx.fillRect(0, 0, width, height);

      // Faint glowing chalk grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      const gridSize = 24;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Cyan glowing margin line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(48, height);
      ctx.stroke();

      // Ambient void drifting specks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 15; i++) {
        const px = (i * 149.3 + time * 18) % width;
        const py = (i * 87.7 + Math.sin(time + i) * 16 + time * 6) % height;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
    }
  }

  private renderPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: Platform[],
    worldDimension: Dimension,
    time: number
  ): void {
    const isWhite = worldDimension === 'WHITE';

    for (const plat of platforms) {
      const isSolidHere = plat.physicalIn === 'BOTH' || plat.physicalIn === worldDimension;
      if (!isSolidHere) {
        // Intangible in this world: draw faint dashed line so player knows where platforms are
        ctx.save();
        ctx.strokeStyle = isWhite ? 'rgba(30, 41, 59, 0.18)' : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        ctx.restore();
        continue;
      }

      ctx.save();
      if (isWhite) {
        // Solid graphite platform
        ctx.strokeStyle = '#1e293b';
        ctx.fillStyle = 'rgba(30, 41, 59, 0.12)';
        ctx.lineWidth = 2.5;

        if (plat.type === 'scribble_wall') {
          this.drawScribbleBlock(ctx, plat.x, plat.y, plat.w, plat.h, '#1e293b');
        } else {
          this.drawRulerPlatform(ctx, plat.x, plat.y, plat.w, plat.h, '#1e293b');
        }
      } else {
        // Glowing white chalk platform
        ctx.strokeStyle = '#f8fafc';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 2.5;

        if (plat.type === 'scribble_wall') {
          this.drawScribbleBlock(ctx, plat.x, plat.y, plat.w, plat.h, '#f8fafc');
        } else {
          this.drawRulerPlatform(ctx, plat.x, plat.y, plat.w, plat.h, '#f8fafc');
        }
      }
      ctx.restore();
    }
  }

  /**
   * Drawn Strokes:
   * "tambien deben dibujar ayudas para el otro pero su trazo es invisible en su mundo"
   * If targetDimension === worldDimension, it IS visible and physical here!
   * If targetDimension !== worldDimension, it was drawn here and is INVISIBLE here!
   */
  private renderDrawnStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: DrawnStroke[],
    worldDimension: Dimension
  ): void {
    const isWhite = worldDimension === 'WHITE';

    for (const stroke of strokes) {
      // Invisible in creator's world! Only visible in target world!
      if (stroke.targetDimension !== worldDimension) {
        continue;
      }

      const pts = stroke.points;
      if (!pts || pts.length < 2) continue;

      ctx.save();
      if (isWhite) {
        // Graphite pencil bridge
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(15, 23, 42, 0.3)';
        ctx.shadowBlur = 4;
      } else {
        // Radiant glowing chalk bridge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Hand-drawn sketch tick accents along the bridge
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isWhite ? '#475569' : '#94a3b8';
      for (let i = 0; i < pts.length - 1; i += 2) {
        const p = pts[i];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 2);
        ctx.lineTo(p.x + 2, p.y + 4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Hazards:
   * Rule:
   * "los obstaculos del negro los ve el blanco y viceverza pero el que los ve no puede interactuar con ellos
   * y los q no lo ven si tiene el objeto fisico pero de el mismo color del fondo para q no lo vea"
   */
  private renderHazards(
    ctx: CanvasRenderingContext2D,
    spikes: Spike[],
    erasers: Eraser[],
    inkDrops: InkDrop[],
    worldDimension: Dimension,
    time: number
  ): void {
    const isWhite = worldDimension === 'WHITE';
    const bgColor = isWhite ? '#f9f8f3' : '#101216';

    // 1. Spikes
    for (const spike of spikes) {
      const isDeadlyHere = spike.physicalIn === worldDimension;

      ctx.save();
      if (isDeadlyHere) {
        // PHYSICAL in this world, but drawn SAME COLOR AS BACKGROUND so the stickman cannot see it!
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = bgColor;
        ctx.lineWidth = 1;
        this.drawSpikeShape(ctx, spike.x, spike.y, spike.w, spike.h, time);
      } else {
        // MIRAGE from the other world: completely visible to warn you, but intangible!
        ctx.strokeStyle = isWhite ? '#0f172a' : '#ffffff';
        ctx.fillStyle = isWhite ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2.2;

        const spikeCount = Math.max(1, Math.floor(spike.w / 20));
        const spikeStep = spike.w / spikeCount;
        let spritesReady = true;
        for (let i = 0; i < spikeCount; i++) {
          const centerX = spike.x + i * spikeStep + spikeStep * 0.5;
          const centerY = spike.y + spike.h * 0.5;
          const drawn = this.drawHanddrawnSprite(
            ctx,
            'triangle',
            centerX - spike.h * 0.5,
            centerY - spikeStep * 0.5,
            spike.h,
            spikeStep,
            worldDimension,
            -Math.PI * 0.5
          );
          if (!drawn) spritesReady = false;
        }
        if (!spritesReady) {
          this.drawSpikeShape(ctx, spike.x, spike.y, spike.w, spike.h, time);
        }

        // Warning cue on the visible mirage
        ctx.fillStyle = isWhite ? '#ef4444' : '#f87171';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.fillText('⚠', spike.x + spike.w * 0.5 - 4, spike.y - 4);
      }
      ctx.restore();
    }

    // 2. Erasers
    for (const eraser of erasers) {
      const isDeadlyHere = eraser.physicalIn === worldDimension;

      ctx.save();
      if (isDeadlyHere) {
        // Camouflaged with background
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = bgColor;
        ctx.fillRect(eraser.x, eraser.y, eraser.w, eraser.h);
      } else {
        // Visible mirage
        ctx.translate(eraser.x, eraser.y);
        const ew = eraser.w;
        const eh = eraser.h;

        if (isWhite) {
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(0, 0, ew * 0.6, eh);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(ew * 0.6, 0, ew * 0.4, eh);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, ew, eh);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 11px ui-monospace, monospace';
          ctx.fillText('4B', 6, eh * 0.65);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(0, 0, ew, eh);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, ew, eh);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px ui-monospace, monospace';
          ctx.fillText('GOMA', 6, eh * 0.65);
        }
      }
      ctx.restore();
    }

    // 3. Ink Drops
    for (const drop of inkDrops) {
      const isDeadlyHere = drop.physicalIn === worldDimension;

      // Nib
      ctx.save();
      const nibColor = isWhite ? '#1e293b' : '#94a3b8';
      ctx.fillStyle = nibColor;
      ctx.fillRect(drop.x - 3, drop.spawnY - 14, 6, 14);

      if (drop.timer <= 0) {
        if (isDeadlyHere) {
          // Invisible / same color as background
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Visible mirage drop uses the hand-drawn orb; keep the vector
          // fallback for the brief period before the atlas finishes loading.
          const orbSize = drop.radius * 3;
          const drawn = this.drawHanddrawnSprite(
            ctx,
            'orb',
            drop.x - orbSize * 0.5,
            drop.y - orbSize * 0.5,
            orbSize,
            orbSize,
            worldDimension
          );
          if (!drawn) {
            ctx.fillStyle = isWhite ? '#0f172a' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isWhite ? '#334155' : '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  }

  private drawSpikeShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    time: number
  ): void {
    const count = Math.max(2, Math.floor(w / 12));
    const step = w / count;

    ctx.beginPath();
    ctx.moveTo(x, y + h);

    for (let i = 0; i < count; i++) {
      const peakX = x + i * step + step * 0.5;
      const peakY = y + Math.sin(time * 5 + i) * 1.5;
      const baseX = x + (i + 1) * step;
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(baseX, y + h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawRulerPlatform(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + w, y + 4);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let tx = x + 10; tx < x + w - 5; tx += 12) {
      ctx.moveTo(tx, y + 4);
      ctx.lineTo(tx, y + 10);
    }
    ctx.stroke();

    const platformDimension: Dimension = color === '#f8fafc' ? 'BLACK' : 'WHITE';
    this.drawHanddrawnSprite(
      ctx,
      'horizontalLine',
      x,
      y - 3,
      w,
      9,
      platformDimension
    );
  }

  private drawScribbleBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let cy = y + 4;
    while (cy < y + h - 4) {
      ctx.moveTo(x + 4, cy);
      ctx.lineTo(x + w - 4, cy + 3);
      ctx.lineTo(x + 4, cy + 7);
      cy += 9;
    }
    ctx.stroke();
  }

  private renderStars(
    ctx: CanvasRenderingContext2D,
    stars: StarCollectible[],
    dimension: Dimension,
    time: number
  ): void {
    for (const star of stars) {
      if (star.collected) continue;

      ctx.save();
      const cx = star.x + star.w * 0.5;
      const cy = star.y + star.h * 0.5 + Math.sin(time * 3 + star.x) * 3;
      const spriteSize = Math.max(star.w, star.h) * 1.9;

      const drawn = this.drawHanddrawnSprite(
        ctx,
        'stars',
        cx - spriteSize * 0.5,
        cy - spriteSize * 0.5,
        spriteSize,
        spriteSize,
        dimension
      );

      if (!drawn) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        this.drawStarShape(ctx, cx, cy, 5, star.w * 0.5, star.w * 0.22);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawStarShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  private renderGoal(
    ctx: CanvasRenderingContext2D,
    goal: Goal,
    isWhite: boolean,
    time: number
  ): void {
    ctx.save();
    const cx = goal.x + goal.w * 0.5;
    const cy = goal.y + goal.h * 0.5;
    const dimension: Dimension = isWhite ? 'WHITE' : 'BLACK';

    const stampColor = isWhite ? '#dc2626' : '#f87171';
    ctx.strokeStyle = stampColor;
    ctx.fillStyle = isWhite ? 'rgba(220, 38, 38, 0.08)' : 'rgba(248, 113, 113, 0.15)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(cx, cy, goal.w * 0.52, goal.h * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, goal.w * 0.42, goal.h * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const iconWidth = goal.w * 0.92;
    const iconHeight = goal.h * 0.78;
    const drawn = this.drawHanddrawnSprite(
      ctx,
      'lightbulb',
      cx - iconWidth * 0.5,
      cy - iconHeight * 0.53,
      iconWidth,
      iconHeight,
      dimension
    );

    ctx.fillStyle = stampColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (drawn) {
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.fillText('META', cx, goal.y + goal.h - 3);
    } else {
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.fillText('10/10', cx, cy - 8);
      ctx.font = 'bold 8px ui-monospace, monospace';
      ctx.fillText('SELLO', cx, cy + 6);
    }

    ctx.restore();
  }

  /**
   * Faint ghost outline of the partner stickman so you can see where they are
   */
  private drawRigSegment(
    ctx: CanvasRenderingContext2D,
    sprite: HanddrawnSpriteName,
    start: { x: number; y: number },
    end: { x: number; y: number },
    dimension: Dimension,
    sourceAngle = -Math.PI / 4
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) return;

    // The authored links are drawn diagonally inside their 64x64 cells.
    // Rotate that artwork so its two drawn pin-holes meet the rig pivots.
    const size = length / 0.82;
    const centerX = (start.x + end.x) * 0.5;
    const centerY = (start.y + end.y) * 0.5;
    const targetAngle = Math.atan2(dy, dx);

    this.drawHanddrawnSprite(
      ctx,
      sprite,
      centerX - size * 0.5,
      centerY - size * 0.5,
      size,
      size,
      dimension,
      targetAngle - sourceAngle
    );
  }

  private drawRigJoint(
    ctx: CanvasRenderingContext2D,
    point: { x: number; y: number },
    dimension: Dimension,
    size = 5
  ): void {
    this.drawHanddrawnSprite(
      ctx,
      'joint',
      point.x - size * 0.5,
      point.y - size * 0.5,
      size,
      size,
      dimension
    );
  }

  /**
   * Draws the author's character as an articulated puppet.
   * The pose is calculated from velocity, grounded state and runCycle;
   * no frame-by-frame action drawings are required.
   */
  private renderArticulatedStickman(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    dimension: Dimension,
    time: number,
    opacity: number,
    isActiveStickman: boolean
  ): boolean {
    const atlas = this.handdrawnAtlas;
    if (!atlas || !atlas.complete || atlas.naturalWidth === 0) return false;

    ctx.save();
    ctx.globalAlpha *= opacity;

    const anchorX = player.x + player.w * 0.5;
    const anchorY = player.y + player.h;
    ctx.translate(anchorX, anchorY);
    ctx.scale(player.squashX || 1, player.squashY || 1);

    // Mirror the complete puppet to face the movement direction.
    if (player.facing === 'left') ctx.scale(-1, 1);

    if (dimension === 'BLACK') {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 3;
    }

    const pose = buildStickmanPose(player, time);
    const { running, gait, bodyBob, shoulderY, hipY } = pose;
    const leftArm = pose.arms[0];
    const rightArm = pose.arms[1];
    const legs = pose.legs;

    // Legs are drawn behind the torso.
    for (const leg of legs) {
      this.drawRigSegment(ctx, 'upperLeg', leg.hip, leg.knee, dimension);
      this.drawRigSegment(ctx, 'lowerLeg', leg.knee, leg.ankle, dimension, Math.PI / 2);
      const footWidth = 9;
      const footHeight = 7;
      this.drawHanddrawnSprite(
        ctx,
        'foot',
        leg.ankle.x - footWidth * 0.5,
        leg.ankle.y - footHeight * 0.55,
        footWidth,
        footHeight,
        dimension,
        running ? gait * leg.side * 0.16 : 0
      );
      this.drawRigJoint(ctx, leg.hip, dimension, 3.8);
      this.drawRigJoint(ctx, leg.knee, dimension, 3.8);
      this.drawRigJoint(ctx, leg.ankle, dimension, 3.4);
    }

    // Arms, forearms, and the two hand sprites.
    for (const arm of [leftArm, rightArm]) {
      this.drawRigSegment(ctx, 'upperArm', arm.shoulder, arm.elbow, dimension);
      this.drawRigSegment(ctx, 'lowerArm', arm.elbow, arm.wrist, dimension);
      const handAngle = Math.atan2(
        arm.wrist.y - arm.elbow.y,
        arm.wrist.x - arm.elbow.x
      );
      this.drawHanddrawnSprite(
        ctx,
        'hand',
        arm.wrist.x - 3.7,
        arm.wrist.y - 4.5,
        6.4,
        8,
        dimension,
        handAngle - Math.PI / 2
      );
      this.drawRigJoint(ctx, arm.shoulder, dimension, 3.6);
      this.drawRigJoint(ctx, arm.elbow, dimension, 3.7);
      this.drawRigJoint(ctx, arm.wrist, dimension, 3.4);
    }

    // Chest, abdomen and spherical head.
    this.drawHanddrawnSprite(
      ctx,
      'torsoPlate',
      -9.5,
      shoulderY - 1,
      19,
      15,
      dimension
    );
    this.drawHanddrawnSprite(
      ctx,
      'torsoLink',
      -5.3,
      hipY - 8.5,
      10.6,
      13,
      dimension
    );
    this.drawRigJoint(ctx, { x: 0, y: hipY }, dimension, 3.8);

    const headY = shoulderY - 10;
    this.drawHanddrawnSprite(
      ctx,
      'orb',
      -7,
      headY - 7,
      14,
      14,
      dimension
    );

    // A tiny eye gives facing feedback while retaining the hand-drawn head.
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = dimension === 'WHITE' ? '#ffffff' : '#101216';
    ctx.beginPath();
    ctx.arc(3.1, headY - 1, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isActiveStickman) {
      ctx.save();
      const crownY = headY - 10 + Math.sin(time * 6) * 1.5;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, crownY + 2);
      ctx.lineTo(-5, crownY - 2);
      ctx.lineTo(-2, crownY);
      ctx.lineTo(0, crownY - 4);
      ctx.lineTo(2, crownY);
      ctx.lineTo(5, crownY - 2);
      ctx.lineTo(5, crownY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const ringAlpha = 0.5 + Math.sin(time * 8) * 0.3;
      ctx.strokeStyle = dimension === 'WHITE'
        ? `rgba(15, 23, 42, ${ringAlpha})`
        : `rgba(56, 189, 248, ${ringAlpha})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(0, 1, 13, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    return true;
  }

  private renderGhostPlayer(
    ctx: CanvasRenderingContext2D,
    otherPlayer: PlayerState,
    isWhiteWorld: boolean
  ): void {
    if (this.renderArticulatedStickman(
      ctx,
      otherPlayer,
      isWhiteWorld ? 'WHITE' : 'BLACK',
      0,
      0.28,
      false
    )) return;

    ctx.save();
    const px = otherPlayer.x + otherPlayer.w * 0.5;
    const py = otherPlayer.y + otherPlayer.h;
    ctx.translate(px, py);

    ctx.strokeStyle = isWhiteWorld ? 'rgba(30, 41, 59, 0.25)' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    const hipY = -18;
    const headY = -36;

    // Head
    ctx.beginPath();
    ctx.arc(0, headY, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, headY + 6);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-4, 0);
    ctx.moveTo(0, hipY);
    ctx.lineTo(4, 0);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Stickman rendering with animated limbs, run cycles, and active controller crown
   */
  private renderStickman(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    isWhiteWorld: boolean,
    isActiveStickman: boolean,
    time: number
  ): void {
    if (this.renderArticulatedStickman(
      ctx,
      player,
      isWhiteWorld ? 'WHITE' : 'BLACK',
      time,
      1,
      isActiveStickman
    )) return;

    ctx.save();
    const px = player.x + player.w * 0.5;
    const py = player.y + player.h;

    ctx.translate(px, py);
    ctx.scale(player.squashX, player.squashY);

    const facingRight = player.facing === 'right';
    const dir = facingRight ? 1 : -1;

    // In White World: Dark Graphite Stickman
    // In Black World: Radiant White Chalk Stickman
    const strokeColor = isWhiteWorld ? '#090a0f' : '#ffffff';
    const fillColor = isWhiteWorld ? '#090a0f' : '#ffffff';

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (!isWhiteWorld) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 8;
    }

    const runAngle = Math.sin(player.runCycle * 1.2) * 0.6;
    const bodyBob = Math.abs(Math.sin(player.runCycle * 1.2)) * 3;

    const hipY = -18 - bodyBob;
    const headY = -36 - bodyBob;

    // Head
    ctx.beginPath();
    ctx.arc(0, headY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye direction
    ctx.fillStyle = isWhiteWorld ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.arc(dir * 2.5, headY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(0, headY + 6);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    if (player.isGrounded) {
      if (Math.abs(player.vx) > 10) {
        ctx.moveTo(0, headY + 10);
        ctx.lineTo(-Math.sin(runAngle) * 9, headY + 18);
        ctx.moveTo(0, headY + 10);
        ctx.lineTo(Math.sin(runAngle) * 9, headY + 18);
      } else {
        ctx.moveTo(0, headY + 10);
        ctx.lineTo(dir * 5, headY + 18);
        ctx.moveTo(0, headY + 10);
        ctx.lineTo(-dir * 4, headY + 18);
      }
    } else {
      // Arms raised while jumping
      ctx.moveTo(0, headY + 10);
      ctx.lineTo(-7 * dir, headY + 2);
      ctx.moveTo(0, headY + 10);
      ctx.lineTo(7 * dir, headY + 2);
    }
    ctx.stroke();

    // Legs
    if (player.isGrounded) {
      if (Math.abs(player.vx) > 10) {
        ctx.beginPath();
        ctx.moveTo(0, hipY);
        ctx.lineTo(Math.sin(runAngle) * 12, hipY + 10);
        ctx.lineTo(Math.sin(runAngle) * 12 + dir * 3, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, hipY);
        ctx.lineTo(-Math.sin(runAngle) * 12, hipY + 10);
        ctx.lineTo(-Math.sin(runAngle) * 12 - dir * 2, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, hipY);
        ctx.lineTo(-4, 0);
        ctx.moveTo(0, hipY);
        ctx.lineTo(4, 0);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(0, hipY);
      ctx.lineTo(-6 * dir, hipY + 8);
      ctx.lineTo(-2 * dir, hipY + 15);
      ctx.moveTo(0, hipY);
      ctx.lineTo(6 * dir, hipY + 7);
      ctx.lineTo(8 * dir, hipY + 14);
      ctx.stroke();
    }

    // Active Stickman Halo / Crown indicator
    if (isActiveStickman) {
      ctx.save();
      const crownY = headY - 12 + Math.sin(time * 6) * 2;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;

      // Crown shape
      ctx.beginPath();
      ctx.moveTo(-7, crownY + 3);
      ctx.lineTo(-7, crownY - 3);
      ctx.lineTo(-3, crownY);
      ctx.lineTo(0, crownY - 5);
      ctx.lineTo(3, crownY);
      ctx.lineTo(7, crownY - 3);
      ctx.lineTo(7, crownY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pulsing control ring under feet
      const ringAlpha = 0.5 + Math.sin(time * 8) * 0.3;
      ctx.strokeStyle = isWhiteWorld ? `rgba(15, 23, 42, ${ringAlpha})` : `rgba(56, 189, 248, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D, currentDimension: Dimension): void {
    ctx.save();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
      if (p.dimension !== 'ALL' && p.dimension !== currentDimension) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
