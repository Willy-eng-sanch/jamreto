import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStickmanPose } from './stickmanRig.ts';
const idle={x:0,vx:0,vy:0,isGrounded:true,runCycle:0};
function numbers(v:unknown):number[]{
 if(typeof v==='number') return [v];
 if(Array.isArray(v)) return v.flatMap(numbers);
 if(v&&typeof v==='object') return Object.values(v).flatMap(numbers);
 return [];
}
test('idle pose creates two arms and two legs with finite pivots',()=>{
 const p=buildStickmanPose(idle,0);
 assert.equal(p.running,false); assert.equal(p.arms.length,2); assert.equal(p.legs.length,2);
 assert.ok(numbers(p).every(Number.isFinite));
});
test('running pose alternates limb positions over the gait cycle',()=>{
 const a=buildStickmanPose({...idle,vx:180,runCycle:Math.PI/2},0);
 const b=buildStickmanPose({...idle,vx:180,runCycle:Math.PI/2+Math.PI},0);
 assert.equal(a.running,true);
 assert.notEqual(a.legs[0].knee.x,b.legs[0].knee.x);
 assert.notEqual(a.arms[0].wrist.x,b.arms[0].wrist.x);
});
test('jump pose raises both hands above shoulders',()=>{
 const p=buildStickmanPose({...idle,isGrounded:false,vy:-300},1);
 assert.ok(p.arms.every(a=>a.wrist.y<a.shoulder.y));
 assert.ok(p.legs.every(l=>l.ankle.y<0));
});
test('fall pose extends both arms outward',()=>{
 const p=buildStickmanPose({...idle,isGrounded:false,vy:250},1);
 assert.ok(p.arms.every(a=>Math.abs(a.wrist.x)>=16));
 assert.ok(p.arms.every(a=>a.wrist.y>a.elbow.y));
});
test('malformed motion inputs cannot produce NaN or Infinity',()=>{
 const p=buildStickmanPose({x:NaN,vx:Infinity,vy:NaN,isGrounded:false,runCycle:NaN},NaN);
 assert.ok(numbers(p).every(Number.isFinite));
});
test('pose keeps shoulders above hips and feet at or above the anchor',()=>{
 const p=buildStickmanPose(idle,0);
 assert.ok(p.shoulderY<p.hipY); assert.ok(p.hipY<0);
 assert.ok(p.legs.every(l=>l.ankle.y<=0));
});
