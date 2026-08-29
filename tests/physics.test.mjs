import assert from "node:assert/strict";
import test from "node:test";
import {
  CAT_R,
  FLOOR_Y,
  MAX_AIM_DISTANCE,
  freshPhysics,
  isRestingOnCushion,
  powerForDistance,
  sneezeVelocity,
} from "../src/physics.ts";

test("freshPhysics creates the intended level-one layout", () => {
  const world = freshPhysics();

  assert.deepEqual(world.cat, { x: 225, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 });
  assert.equal(world.box.x, 292);
  assert.equal(world.goalHold, 0);
});

test("power is clamped between minimum and maximum", () => {
  assert.equal(powerForDistance(0), 0.25);
  assert.equal(powerForDistance(MAX_AIM_DISTANCE / 2), 0.5);
  assert.equal(powerForDistance(MAX_AIM_DISTANCE * 2), 1);
});

test("sneeze recoil moves the cat opposite to the aim", () => {
  const rightward = sneezeVelocity(1, 0, 1);
  const upward = sneezeVelocity(0, -1, 0.5);

  assert.ok(rightward.vx < 0);
  assert.equal(Math.abs(rightward.vy), 0);
  assert.equal(Math.abs(upward.vx), 0);
  assert.ok(upward.vy > 0);
});

test("the cushion accepts only a slow cat inside its goal bounds", () => {
  assert.equal(isRestingOnCushion({ x: 92, y: 520, vx: 2, vy: 1 }), true);
  assert.equal(isRestingOnCushion({ x: 160, y: 520, vx: 0, vy: 0 }), false);
  assert.equal(isRestingOnCushion({ x: 92, y: 520, vx: 43, vy: 0 }), false);
});
