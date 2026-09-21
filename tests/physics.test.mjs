import assert from "node:assert/strict";
import test from "node:test";
import {
  BOX_HALF,
  CAT_R,
  FLOOR_Y,
  LEFT_WALL,
  LEVELS,
  MAX_AIM_DISTANCE,
  applySneeze,
  applyGroundFriction,
  applyIceFriction,
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

  assert.deepEqual(world.cat, { x: 285, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 });
  assert.equal(world.box, null);
  assert.deepEqual(LEVELS[1].goal, { left: 48, right: 148, top: 486, bottom: 522 });
  assert.equal(LEVELS[1].hint, "右へ2回、反動で左へ！");
  assert.equal(world.level, 1);
  assert.deepEqual(world.obstacles, []);
  assert.equal(world.goalHold, 0);
});

test("level one teaches recoil with two safe horizontal sneezes", () => {
  const world = freshPhysics(1);

  applySneeze(world, 1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.ok(world.cat.x > LEVELS[1].goal.right, "one sneeze should stop before the cushion");
  assert.ok(world.goalHold < 0.6, "one sneeze must not clear the level");

  applySneeze(world, 1, 0, 1);
  for (let frame = 0; frame < 180 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6, "the second sneeze should reach the wide cushion");
  assert.ok(world.cat.x >= LEFT_WALL + CAT_R);
});

test("level two is a deterministic box-pushing layout", () => {
  const first = freshPhysics(2);
  const second = freshPhysics(2);

  assert.deepEqual(first, second);
  assert.equal(first.level, 2);
  assert.notDeepEqual(first.cat, freshPhysics(1).cat);
  assert.deepEqual(first.box, { x: 175, y: FLOOR_Y - BOX_HALF, vx: 0, vy: 0 });
  assert.deepEqual(first.obstacles, []);
  assert.ok(first.box.x > LEVELS[2].goal.left);
});

test("level two pushes the box and cat apart before a tolerant return shot", () => {
  const angles = [37, 41, 45, 49, 53];
  const powers = [0.9, 0.95, 1];

  for (const angle of angles) {
    for (const power of powers) {
      const world = freshPhysics(2);
      const startingCatX = world.cat.x;
      const startingBoxX = world.box.x;
      const boxReceivedWind = applySneeze(world, -1, 0, 1);

      assert.equal(boxReceivedWind, true);
      for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

      assert.ok(world.cat.x > startingCatX, "the recoil should move the cat right");
      assert.ok(world.box.x < startingBoxX, "the wind should push the box left");
      assert.ok(world.box.x <= 100, "the first shot should clear the cushion");

      const radians = (angle * Math.PI) / 180;
      applySneeze(world, Math.cos(radians), Math.sin(radians), power);

      for (let frame = 0; frame < 240 && world.goalHold < 0.6; frame += 1) {
        stepPhysics(world, 1 / 60);
      }

      assert.ok(
        world.goalHold >= 0.6,
        `expected Level 2 clear at ${angle} degrees and ${Math.round(power * 100)}% power`,
      );
    }
  }
});

test("level two cannot return to the cushion before moving its box", () => {
  const world = freshPhysics(2);
  const radians = (45 * Math.PI) / 180;
  const boxReceivedWind = applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);

  assert.equal(boxReceivedWind, false);
  for (let frame = 0; frame < 240; frame += 1) stepPhysics(world, 1 / 60);

  assert.ok(world.goalHold < 0.6);
});

test("ice preserves much more horizontal speed than the normal floor", () => {
  let normalVelocity = 400;
  let iceVelocity = 400;

  for (let frame = 0; frame < 18; frame += 1) {
    normalVelocity = applyGroundFriction(normalVelocity, 1 / 60);
    iceVelocity = applyIceFriction(iceVelocity, 1 / 60);
  }

  assert.equal(normalVelocity, 0);
  assert.ok(iceVelocity > 350);
});

test("level three has a visible ice run and a verified sliding solution", () => {
  const world = freshPhysics(3);

  assert.equal(world.box, null);
  assert.deepEqual(world.obstacles, []);
  assert.deepEqual(world.iceZones, [{ x: 112, width: 213 }]);

  applySneeze(world, 1, 0, 1);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6, "the cat should slide off the ice and stop on the cushion");
});

test("level four pushes the box and cat in opposite directions before a tolerant return shot", () => {
  const secondShotAngles = [37, 41, 45, 49, 53];
  const secondShotPowers = [0.9, 0.95, 1];

  for (const angle of secondShotAngles) {
    for (const power of secondShotPowers) {
      const world = freshPhysics(4);
      const startingCatX = world.cat.x;
      const startingBoxX = world.box.x;
      const boxReceivedWind = applySneeze(world, -1, 0, 1);

      assert.equal(boxReceivedWind, true);
      for (let frame = 0; frame < 120; frame += 1) {
        stepPhysics(world, 1 / 60);
      }

      assert.ok(world.cat.x > startingCatX, "the recoil should move the cat right");
      assert.ok(world.box.x < startingBoxX, "the wind should push the box left");
      assert.ok(world.box.x <= 100, "the first shot should clear the cushion");

      const radians = (angle * Math.PI) / 180;
      applySneeze(world, Math.cos(radians), Math.sin(radians), power);

      for (let frame = 0; frame < 240 && world.goalHold < 0.6; frame += 1) {
        stepPhysics(world, 1 / 60);
      }

      assert.ok(
        world.goalHold >= 0.6,
        `expected Level 4 clear at ${angle} degrees and ${Math.round(power * 100)}% power`,
      );
    }
  }
});

test("level four cannot use its baseline return shot before moving the box", () => {
  const world = freshPhysics(4);
  const radians = (45 * Math.PI) / 180;
  const boxReceivedWind = applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);

  assert.equal(boxReceivedWind, false, "the box starts behind the return-shot wind");
  for (let frame = 0; frame < 240; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold < 0.6);
});

test("level progression stops after level four and restart preserves the current level", () => {
  assert.equal(nextLevel(1), 2);
  assert.equal(nextLevel(2), 3);
  assert.equal(nextLevel(3), 4);
  assert.equal(nextLevel(4), null);
  assert.deepEqual(freshPhysics(nextLevel(1)), freshPhysics(2));
  assert.deepEqual(freshPhysics(nextLevel(2)), freshPhysics(3));
  assert.deepEqual(freshPhysics(nextLevel(3)), freshPhysics(4));
  assert.deepEqual(freshPhysics(2), freshPhysics(2));
  assert.deepEqual(freshPhysics(3), freshPhysics(3));
  assert.deepEqual(freshPhysics(4), freshPhysics(4));
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
  assert.equal(isRestingOnCushion({ x: 145, y: 520, vx: 2, vy: 1 }, 2), true);
  assert.equal(isRestingOnCushion({ x: 92, y: 520, vx: 2, vy: 1 }, 2), false);
  assert.equal(isRestingOnCushion({ x: 80, y: 520, vx: 2, vy: 1 }, 3), true);
  assert.equal(isRestingOnCushion({ x: 245, y: 520, vx: 2, vy: 1 }, 3), false);
  assert.ok(LEVELS[2].box.x > LEVELS[2].goal.left);
  assert.ok(LEVELS[3].goal.right <= LEVELS[3].iceZones[0].x);
  assert.ok(LEVELS[4].box.x > LEVELS[4].goal.left);
});
