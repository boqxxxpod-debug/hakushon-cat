import assert from "node:assert/strict";
import test from "node:test";
import {
  BOX_HALF,
  CAT_R,
  FLOOR_Y,
  LEVELS,
  MAX_AIM_DISTANCE,
  applyGroundFriction,
  freshPhysics,
  isRestingOnCushion,
  nextLevel,
  powerForDistance,
  sneezeVelocity,
  stepPhysics,
} from "../src/physics.ts";

test("ground friction stops maximum horizontal recoil within about 0.35 seconds", () => {
  let velocity = 530;
  let elapsed = 0;

  while (velocity > 0 && elapsed < 1) {
    velocity = applyGroundFriction(velocity, 1 / 60);
    elapsed += 1 / 60;
  }

  assert.equal(velocity, 0);
  assert.ok(elapsed >= 0.3 && elapsed <= 0.4);
  assert.equal(applyGroundFriction(-100, 1 / 60), -75);
});

test("freshPhysics creates the intended level-one layout", () => {
  const world = freshPhysics();

  assert.deepEqual(world.cat, { x: 225, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 });
  assert.deepEqual(world.box, { x: 292, y: FLOOR_Y - BOX_HALF, vx: 0, vy: 0 });
  assert.deepEqual(LEVELS[1].goal, { left: 43, right: 143, top: 486, bottom: 522 });
  assert.equal(LEVELS[1].hint, "右へ くしゃみ！");
  assert.equal(world.level, 1);
  assert.deepEqual(world.obstacles, []);
  assert.equal(world.goalHold, 0);
});

test("level two is a deterministic low-wall practice layout without a box", () => {
  const first = freshPhysics(2);
  const second = freshPhysics(2);

  assert.deepEqual(first, second);
  assert.equal(first.level, 2);
  assert.notDeepEqual(first.cat, freshPhysics(1).cat);
  assert.equal(first.box, null);
  assert.equal(first.obstacles.length, 1);
  assert.equal(first.obstacles[0].height, 30);
  assert.ok(LEVELS[2].goal.right - LEVELS[2].goal.left > LEVELS[1].goal.right - LEVELS[1].goal.left);
});

test("level two clears in one recoil across the accepted angle and power tolerance", () => {
  const angles = [37, 41, 45, 49, 53];
  const powers = [0.9, 0.95, 1];

  for (const angle of angles) {
    for (const power of powers) {
      const world = freshPhysics(2);
      const radians = (angle * Math.PI) / 180;
      const velocity = sneezeVelocity(-Math.cos(radians), Math.sin(radians), power);
      world.cat.vx = velocity.vx;
      world.cat.vy = velocity.vy;

      for (let frame = 0; frame < 240 && world.goalHold < 0.6; frame += 1) {
        stepPhysics(world, 1 / 60);
      }

      assert.ok(
        world.goalHold >= 0.6,
        `expected one-shot clear at ${angle} degrees and ${Math.round(power * 100)}% power`,
      );
    }
  }
});

test("level progression stops after level two and restart preserves the current level", () => {
  assert.equal(nextLevel(1), 2);
  assert.equal(nextLevel(2), null);
  assert.deepEqual(freshPhysics(nextLevel(1)), freshPhysics(2));
  assert.deepEqual(freshPhysics(2), freshPhysics(2));
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
  assert.equal(isRestingOnCushion({ x: 285, y: 520, vx: 2, vy: 1 }, 2), true);
  assert.equal(isRestingOnCushion({ x: 92, y: 520, vx: 2, vy: 1 }, 2), false);
  assert.ok(LEVELS[2].goal.left > LEVELS[1].goal.right);
});
