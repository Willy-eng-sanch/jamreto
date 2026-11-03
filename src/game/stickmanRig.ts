export interface RigPoint { x: number; y: number; }
export interface StickmanPoseInput {
  x: number; vx: number; vy: number; isGrounded: boolean; runCycle: number;
}
export interface StickmanPose {
  running: boolean; gait: number; bodyBob: number; shoulderY: number; hipY: number;
  arms: Array<{ side: -1 | 1; shoulder: RigPoint; elbow: RigPoint; wrist: RigPoint }>;
  legs: Array<{ side: -1 | 1; hip: RigPoint; knee: RigPoint; ankle: RigPoint }>;
}
const finite = (n: number): number => Number.isFinite(n) ? n : 0;

/** Pure procedural pose solver shared by the renderer and automated tests. */
export function buildStickmanPose(player: StickmanPoseInput, time: number): StickmanPose {
  const vx=finite(player.vx), vy=finite(player.vy), runCycle=finite(player.runCycle);
  const x=finite(player.x), t=finite(time), grounded=player.isGrounded;
  const running=grounded && Math.abs(vx)>10;
  const gait=running ? Math.sin(runCycle*1.2) : 0;
  const breathing=Math.sin(t*2.7+x*0.015)*0.45;
  const bodyBob=running ? Math.abs(gait)*1.1 : breathing;
  const shoulderY=-28-bodyBob, hipY=-11-bodyBob;
  const rising=!grounded && vy < -80, falling=!grounded && vy > 100;
  const arms=([-1,1] as const).map(side=>{
    const shoulder={x:side*3.5,y:shoulderY+5};
    const drive=running ? gait*side : Math.sin(t*1.8+side)*0.25;
    let elbow:RigPoint, wrist:RigPoint;
    if(rising){elbow={x:side*10,y:shoulderY-4};wrist={x:side*13,y:shoulderY-11};}
    else if(falling){elbow={x:side*12,y:shoulderY-1};wrist={x:side*16,y:shoulderY+2};}
    else {
      elbow={x:side*9.5+drive*1.5,y:shoulderY+8+Math.max(0,drive)*0.8};
      wrist={x:side*11.5+drive*2.5,y:shoulderY+16+Math.max(0,drive)*1.2};
    }
    return {side,shoulder,elbow,wrist};
  });
  const legs=([-1,1] as const).map(side=>{
    const drive=running ? -gait*side : 0;
    const hip={x:side*4.2,y:hipY};
    const knee=grounded
      ? {x:side*5+drive*2.7,y:-7-Math.max(0,drive)*1.7-bodyBob}
      : {x:side*6,y:-6-bodyBob};
    const ankle=grounded
      ? {x:side*5+drive*5.1,y:-Math.max(0,drive)*3.2}
      : {x:side*4.5,y:-3-bodyBob};
    return {side,hip,knee,ankle};
  });
  return {running,gait,bodyBob,shoulderY,hipY,arms,legs};
}
