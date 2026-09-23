import assert from "node:assert/strict";
import test from "node:test";
import {
  BOX_HALF,
  BALLOON_R,
  CAT_R,
  FLOOR_Y,
  LEFT_WALL,
  RIGHT_WALL,
  LEVELS,
  MAX_AIM_DISTANCE,
  applySneeze,
  applyGroundFriction,
  applyIceFriction,
  freshPhysics,
  isSeesawReady,
  isRestingOnCushion,
  movingPlatformPosition,
  nextLevel,
  powerForDistance,
  releaseRope,
  ropeEndPosition,
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

test("level four spring launches once per contact and rearms after exit", () => {
  const world = freshPhysics(4);
  const spring = world.springs[0];
  world.cat.x = spring.x + spring.width / 2;

  stepPhysics(world, 1 / 60);
  const firstLaunchVelocity = world.cat.vy;
  assert.ok(firstLaunchVelocity < -700);
  assert.equal(world.springArmed[0], false);

  stepPhysics(world, 1 / 60);
  assert.ok(world.cat.vy > firstLaunchVelocity, "gravity should act without a second launch");

  world.cat.x = spring.x - 60;
  stepPhysics(world, 1 / 60);
  assert.equal(world.springArmed[0], true);

  world.cat.x = spring.x + spring.width / 2;
  world.cat.y = FLOOR_Y - CAT_R;
  world.cat.vy = 0;
  stepPhysics(world, 1 / 60);
  assert.ok(world.cat.vy < -700, "a new contact should launch again");
});

test("level four uses its spring to reach the raised cushion", () => {
  const world = freshPhysics(4);

  assert.equal(world.box, null);
  assert.deepEqual(world.springs, [{ x: 135, width: 65, launchVelocity: 760 }]);
  assert.deepEqual(world.obstacles, [{ x: 220, y: 405, width: 112, height: 140 }]);

  applySneeze(world, -1, 0, 1);
  for (let frame = 0; frame < 600 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6, "the spring route should end on the raised cushion");
});

test("level progression reaches level sixteen and restart preserves the current level", () => {
  assert.equal(nextLevel(1), 2);
  assert.equal(nextLevel(2), 3);
  assert.equal(nextLevel(3), 4);
  assert.equal(nextLevel(4), 5);
  assert.equal(nextLevel(5), 6);
  assert.equal(nextLevel(6), 7);
  assert.equal(nextLevel(7), 8);
  assert.equal(nextLevel(8), 9);
  assert.equal(nextLevel(9), 10);
  assert.equal(nextLevel(10), 11);
  assert.equal(nextLevel(11), 12);
  assert.equal(nextLevel(12), 13);
  assert.equal(nextLevel(13), 14);
  assert.equal(nextLevel(14), 15);
  assert.equal(nextLevel(15), 16);
  assert.equal(nextLevel(16), null);
  assert.deepEqual(freshPhysics(nextLevel(1)), freshPhysics(2));
  assert.deepEqual(freshPhysics(nextLevel(2)), freshPhysics(3));
  assert.deepEqual(freshPhysics(nextLevel(3)), freshPhysics(4));
  assert.deepEqual(freshPhysics(nextLevel(4)), freshPhysics(5));
  assert.deepEqual(freshPhysics(nextLevel(5)), freshPhysics(6));
  assert.deepEqual(freshPhysics(nextLevel(6)), freshPhysics(7));
  assert.deepEqual(freshPhysics(nextLevel(7)), freshPhysics(8));
  assert.deepEqual(freshPhysics(nextLevel(8)), freshPhysics(9));
  assert.deepEqual(freshPhysics(nextLevel(9)), freshPhysics(10));
  assert.deepEqual(freshPhysics(nextLevel(10)), freshPhysics(11));
  assert.deepEqual(freshPhysics(nextLevel(11)), freshPhysics(12));
  assert.deepEqual(freshPhysics(nextLevel(12)), freshPhysics(13));
  assert.deepEqual(freshPhysics(nextLevel(13)), freshPhysics(14));
  assert.deepEqual(freshPhysics(nextLevel(14)), freshPhysics(15));
  assert.deepEqual(freshPhysics(nextLevel(15)), freshPhysics(16));
  assert.deepEqual(freshPhysics(2), freshPhysics(2));
  assert.deepEqual(freshPhysics(3), freshPhysics(3));
  assert.deepEqual(freshPhysics(4), freshPhysics(4));
  assert.deepEqual(freshPhysics(5), freshPhysics(5));
  assert.deepEqual(freshPhysics(6), freshPhysics(6));
  assert.deepEqual(freshPhysics(7), freshPhysics(7));
  assert.deepEqual(freshPhysics(8), freshPhysics(8));
  assert.deepEqual(freshPhysics(9), freshPhysics(9));
  assert.deepEqual(freshPhysics(10), freshPhysics(10));
  assert.deepEqual(freshPhysics(11), freshPhysics(11));
  assert.deepEqual(freshPhysics(12), freshPhysics(12));
  assert.deepEqual(freshPhysics(13), freshPhysics(13));
  assert.deepEqual(freshPhysics(14), freshPhysics(14));
  assert.deepEqual(freshPhysics(15), freshPhysics(15));
  assert.deepEqual(freshPhysics(16), freshPhysics(16));
});

test("level five balloon responds farther than a box to the same wind", () => {
  const boxWorld = freshPhysics(2);
  const balloonWorld = freshPhysics(5);
  const boxStart = boxWorld.box.x;
  const balloonStart = balloonWorld.balloon.x;

  applySneeze(boxWorld, -1, 0, 0.4);
  applySneeze(balloonWorld, -1, 0, 0.4);
  for (let frame = 0; frame < 8; frame += 1) {
    stepPhysics(boxWorld, 1 / 60);
    stepPhysics(balloonWorld, 1 / 60);
  }

  assert.ok(balloonStart - balloonWorld.balloon.x > (boxStart - boxWorld.box.x) * 1.8);
  assert.ok(balloonWorld.balloon.y < FLOOR_Y - BALLOON_R, "the balloon should start floating upward");
});

test("level five keeps the goal locked until the balloon is cleared", () => {
  const world = freshPhysics(5);
  world.balloon.x = 280;
  world.cat = { x: 145, y: 520, vx: 0, vy: 0 };

  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.goalHold, 0);

  world.balloonCleared = true;
  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(world.goalHold >= 0.6);
});

test("level five has a verified light-puff and return solution", () => {
  const world = freshPhysics(5);
  applySneeze(world, -1, 0, 0.4);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.balloonCleared, true);
  assert.ok(world.balloon.x >= LEFT_WALL + BALLOON_R);
  assert.ok(world.balloon.x <= RIGHT_WALL - BALLOON_R);

  const radians = (45 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
});

test("level six switch turns on only while the stopped box rests on it", () => {
  const world = freshPhysics(6);

  assert.deepEqual(world.switches, [{ x: 26, width: 65 }]);
  assert.deepEqual(world.switchOn, [false]);

  applySneeze(world, -1, 0, 1);
  stepPhysics(world, 1 / 60);
  assert.equal(world.switchOn[0], false, "a moving box must not press the switch yet");

  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.switchOn[0], true);

  world.box.x = 175;
  world.box.vx = 0;
  world.box.vy = 0;
  stepPhysics(world, 1 / 60);
  assert.equal(world.switchOn[0], false, "the switch must release when the box leaves");
});

test("level six keeps the cushion locked until the switch is on", () => {
  const world = freshPhysics(6);
  world.cat = { x: 145, y: 520, vx: 0, vy: 0 };

  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.goalHold, 0);

  world.box.x = 50;
  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.switchOn[0], true);
  assert.ok(world.goalHold >= 0.6);
});

test("level six has a verified switch-and-return solution", () => {
  const world = freshPhysics(6);
  applySneeze(world, -1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.switchOn[0], true);

  const radians = (45 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
});

test("level seven closed gate blocks both the cat and box", () => {
  const catWorld = freshPhysics(7);
  const gate = catWorld.gates[0];
  const radians = (45 * Math.PI) / 180;

  assert.deepEqual(gate, { x: 207, y: 145, width: 14, height: 400, switchIndex: 0 });
  assert.deepEqual(catWorld.gateOpen, [false]);

  applySneeze(catWorld, Math.cos(radians), Math.sin(radians), 0.95);
  for (let frame = 0; frame < 300; frame += 1) stepPhysics(catWorld, 1 / 60);
  assert.equal(catWorld.goalHold, 0, "the baseline return shot must not cross a closed gate");
  assert.ok(catWorld.cat.x >= gate.x + gate.width + CAT_R - 0.01);

  const boxWorld = freshPhysics(7);
  boxWorld.cat.x = 310;
  boxWorld.box.x = 270;
  boxWorld.box.vx = -500;
  for (let frame = 0; frame < 90; frame += 1) stepPhysics(boxWorld, 1 / 60);
  assert.ok(boxWorld.box.x >= gate.x + gate.width + BOX_HALF - 0.01);
});

test("level seven gate follows its pressure switch and resets closed", () => {
  const world = freshPhysics(7);
  applySneeze(world, -1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.switchOn[0], true);
  assert.equal(world.gateOpen[0], true);

  world.box.x = 175;
  world.box.vx = 0;
  world.box.vy = 0;
  stepPhysics(world, 1 / 60);
  assert.equal(world.switchOn[0], false);
  assert.equal(world.gateOpen[0], false);
  assert.deepEqual(freshPhysics(7).gateOpen, [false]);
});

test("level seven has a verified open-gate-and-return solution", () => {
  const world = freshPhysics(7);
  applySneeze(world, -1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.gateOpen[0], true);

  const radians = (45 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
  assert.equal(world.gateOpen[0], true);
});

test("level eight seesaw angle follows load position smoothly within its limit", () => {
  const left = freshPhysics(8);
  const right = freshPhysics(8);
  left.box.x = 80;
  right.box.x = 260;

  stepPhysics(left, 1 / 60);
  stepPhysics(right, 1 / 60);
  assert.ok(left.seesawAngles[0] < 0);
  assert.ok(right.seesawAngles[0] > 0);
  assert.ok(Math.abs(left.seesawAngles[0]) <= 0.03 + Number.EPSILON);
  assert.ok(Math.abs(right.seesawAngles[0]) <= 0.03 + Number.EPSILON);

  for (let frame = 0; frame < 60; frame += 1) {
    stepPhysics(left, 1 / 60);
    stepPhysics(right, 1 / 60);
  }
  assert.ok(left.seesawAngles[0] >= -left.seesaws[0].maxAngle);
  assert.ok(right.seesawAngles[0] <= right.seesaws[0].maxAngle);
  assert.ok(left.seesawAngles[0] < -0.12);
  assert.ok(right.seesawAngles[0] > 0.12);

  left.box = null;
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(left, 1 / 60);
  assert.ok(Math.abs(left.seesawAngles[0]) < 0.001, "an unloaded seesaw should return to center");
});

test("level eight seesaw supports both cat and box on its surface", () => {
  const world = freshPhysics(8);
  world.box = null;
  world.cat = { x: 170, y: 350, vx: 0, vy: 0 };

  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(Math.abs(world.cat.y - 457) < 0.5);
  assert.ok(Math.abs(world.cat.vy) < 10);

  const boxWorld = freshPhysics(8);
  for (let frame = 0; frame < 30; frame += 1) stepPhysics(boxWorld, 1 / 60);
  assert.ok(boxWorld.box.y < FLOOR_Y - BOX_HALF - 20);
});

test("level eight requires the box on the low side before the raised goal works", () => {
  const world = freshPhysics(8);
  const radians = (80 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.35);
  for (let frame = 0; frame < 300; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(isSeesawReady(world), false);
  assert.equal(world.goalHold, 0);
});

test("level eight has a verified counterweight-and-landing solution", () => {
  const world = freshPhysics(8);
  applySneeze(world, -1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(isSeesawReady(world), true);
  assert.ok(world.seesawAngles[0] <= -0.12);

  const radians = (80 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.35);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
  assert.ok(world.cat.y < FLOOR_Y - CAT_R - 50);
});

test("level nine wall ignores weak wind and cat-only contact", () => {
  const weakWind = freshPhysics(9);
  applySneeze(weakWind, 1, 0, 0.6);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(weakWind, 1 / 60);
  assert.equal(weakWind.wallHealth[0], weakWind.breakableWalls[0].durability);
  assert.equal(weakWind.wallBroken[0], false);

  const catOnly = freshPhysics(9);
  catOnly.box = null;
  catOnly.cat = { x: 130, y: 520, vx: 400, vy: 0 };
  for (let frame = 0; frame < 30; frame += 1) stepPhysics(catOnly, 1 / 60);
  assert.equal(catOnly.wallHealth[0], catOnly.breakableWalls[0].durability);
  assert.equal(catOnly.wallBroken[0], false);
  assert.ok(catOnly.cat.x <= catOnly.breakableWalls[0].x - CAT_R + 0.01);
});

test("level nine wall accumulates high-speed box damage and resets fully", () => {
  const world = freshPhysics(9);
  applySneeze(world, 1, 0, 0.8);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.ok(world.wallHealth[0] > 0);
  assert.ok(world.wallHealth[0] < world.breakableWalls[0].durability);
  assert.equal(world.wallBroken[0], false);

  applySneeze(world, 1, 0, 0.8);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.wallHealth[0], 0);
  assert.equal(world.wallBroken[0], true);

  const reset = freshPhysics(9);
  assert.equal(reset.wallHealth[0], reset.breakableWalls[0].durability);
  assert.equal(reset.wallBroken[0], false);
});

test("level nine has a verified smash-and-return solution", () => {
  const world = freshPhysics(9);
  applySneeze(world, 1, 0, 1);
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.wallBroken[0], true);
  assert.equal(world.wallHealth[0], 0);

  const radians = (145 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.95);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
  assert.ok(world.cat.x > world.breakableWalls[0].x + world.breakableWalls[0].width);
});

test("level ten platform follows a deterministic fixed-range cycle", () => {
  const platform = LEVELS[10].movingPlatforms[0];
  assert.deepEqual(movingPlatformPosition(platform, 0), {
    x: 35,
    y: 480,
    width: 90,
    height: 14,
  });
  assert.ok(Math.abs(movingPlatformPosition(platform, 1).x - 110) < 0.001);
  assert.ok(Math.abs(movingPlatformPosition(platform, 2).x - 185) < 0.001);
  assert.ok(Math.abs(movingPlatformPosition(platform, 3).x - 110) < 0.001);
  assert.ok(Math.abs(movingPlatformPosition(platform, 4).x - 35) < 0.001);

  for (let sample = 0; sample <= 80; sample += 1) {
    const position = movingPlatformPosition(platform, sample / 10);
    assert.ok(position.x >= platform.x - platform.distance - 0.001);
    assert.ok(position.x <= platform.x + platform.distance + 0.001);
  }
});

test("level ten platform carries the cat until the cat jumps away", () => {
  const world = freshPhysics(10);
  const initialOffset = world.cat.x - world.platformPositions[0].x;

  for (let frame = 0; frame < 110; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(world.platformContacts[0]);
  assert.ok(Math.abs(world.cat.x - world.platformPositions[0].x - initialOffset) < 0.01);
  assert.ok(Math.abs(world.cat.y - 455) < 0.01);

  const radians = (130 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.35);
  stepPhysics(world, 1 / 60);
  assert.equal(world.platformContacts[0], false);
  const offsetAfterJump = world.cat.x - world.platformPositions[0].x;
  for (let frame = 0; frame < 12; frame += 1) stepPhysics(world, 1 / 60);
  assert.notEqual(world.cat.x - world.platformPositions[0].x, offsetAfterJump);
});

test("level ten early departure misses the final cushion", () => {
  const world = freshPhysics(10);
  const radians = (130 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.35);
  for (let frame = 0; frame < 300; frame += 1) stepPhysics(world, 1 / 60);

  assert.equal(world.goalHold, 0);
  assert.ok(world.cat.x < LEVELS[10].goal.left);
});

test("level ten has a verified timed platform departure", () => {
  const world = freshPhysics(10);
  for (let frame = 0; frame < 110; frame += 1) stepPhysics(world, 1 / 60);

  assert.ok(world.platformPositions[0].x > 175);
  assert.ok(world.platformContacts[0]);

  const radians = (130 * Math.PI) / 180;
  applySneeze(world, Math.cos(radians), Math.sin(radians), 0.35);
  for (let frame = 0; frame < 300 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6);
  assert.equal(world.platformContacts[0], false);
});

test("level eleven automatically grabs the rope and keeps its fixed length", () => {
  const world = freshPhysics(11);
  const rope = world.ropes[0];
  const initialEnd = ropeEndPosition(world, 0);

  assert.deepEqual(initialEnd, {
    x: rope.anchorX,
    y: rope.anchorY + rope.length,
  });
  assert.equal(world.ropeAttached, null);
  assert.equal(world.ropeEverGrabbed, false);

  world.cat = { x: initialEnd.x - 8, y: initialEnd.y, vx: 260, vy: 0 };
  stepPhysics(world, 1 / 60);

  assert.equal(world.ropeAttached, 0);
  assert.equal(world.ropeEverGrabbed, true);
  for (let frame = 0; frame < 120; frame += 1) {
    stepPhysics(world, 1 / 60);
    const distance = Math.hypot(
      world.cat.x - rope.anchorX,
      world.cat.y - rope.anchorY,
    );
    assert.ok(Math.abs(distance - rope.length) < 0.001);
  }
});

test("level eleven sneeze accelerates the swing and release preserves momentum", () => {
  const world = freshPhysics(11);
  const rope = world.ropes[0];
  world.cat = {
    x: rope.anchorX,
    y: rope.anchorY + rope.length,
    vx: 0,
    vy: 0,
  };
  stepPhysics(world, 1 / 60);
  assert.equal(world.ropeAttached, 0);

  applySneeze(world, -1, 0, 0.4);
  for (let frame = 0; frame < 20; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(world.cat.x > rope.anchorX + 45);
  assert.ok(world.ropeAngularVelocities[0] > 0);

  const velocityBeforeRelease = { vx: world.cat.vx, vy: world.cat.vy };
  assert.equal(releaseRope(world), true);
  assert.equal(world.ropeAttached, null);
  assert.ok(Math.abs(world.cat.vx - velocityBeforeRelease.vx) < 0.001);
  assert.ok(Math.abs(world.cat.vy - velocityBeforeRelease.vy) < 0.001);
  stepPhysics(world, 1 / 60);
  assert.equal(world.ropeAttached, null, "release cooldown must prevent an immediate re-grab");

  const reset = freshPhysics(11);
  assert.equal(reset.ropeAttached, null);
  assert.equal(reset.ropeEverGrabbed, false);
  assert.deepEqual(reset.ropeAngles, [0]);
  assert.deepEqual(reset.ropeAngularVelocities, [0]);
});

test("level eleven has a verified grab, boosted swing, release, and landing", () => {
  for (const launchAngle of [115, 120, 125]) {
    const world = freshPhysics(11);
    const launchRadians = (launchAngle * Math.PI) / 180;
    applySneeze(world, Math.cos(launchRadians), Math.sin(launchRadians), 1);

    let caughtAt = -1;
    let boosted = false;
    let released = false;
    for (let frame = 0; frame < 360 && world.goalHold < 0.6; frame += 1) {
      stepPhysics(world, 1 / 60);
      assert.ok(world.cat.x <= RIGHT_WALL - CAT_R + 0.001);
      if (world.ropeAttached !== null && caughtAt < 0) caughtAt = frame;
      if (caughtAt >= 0 && !boosted && frame - caughtAt >= 24) {
        applySneeze(world, -1, 0, 1);
        boosted = true;
      }
      if (
        boosted &&
        !released &&
        world.ropeAttached !== null &&
        world.cat.x > 303 &&
        Math.abs(world.cat.vx) < 50
      ) {
        released = releaseRope(world);
      }
    }

    assert.ok(caughtAt >= 0, `the ${launchAngle} degree shot should meet the rope end`);
    assert.equal(boosted, true);
    assert.equal(released, true);
    assert.equal(world.ropeAttached, null);
    assert.ok(world.goalHold >= 0.6, `expected clear from ${launchAngle} degrees`);
    assert.ok(world.cat.y < FLOOR_Y - CAT_R - 30);
  }
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
  assert.equal(isRestingOnCushion({ x: 280, y: 380, vx: 2, vy: 1 }, 4), true);
  assert.equal(isRestingOnCushion({ x: 145, y: 520, vx: 2, vy: 1 }, 5), true);
  assert.equal(isRestingOnCushion({ x: 145, y: 520, vx: 2, vy: 1 }, 6), true);
  assert.equal(isRestingOnCushion({ x: 145, y: 520, vx: 2, vy: 1 }, 7), true);
  assert.equal(isRestingOnCushion({ x: 280, y: 425, vx: 2, vy: 1 }, 8), true);
  assert.equal(isRestingOnCushion({ x: 220, y: 520, vx: 2, vy: 1 }, 9), true);
  assert.equal(isRestingOnCushion({ x: 305, y: 430, vx: 2, vy: 1 }, 10), true);
  assert.equal(isRestingOnCushion({ x: 305, y: 465, vx: 2, vy: 1 }, 11), true);
  assert.ok(LEVELS[4].goal.bottom < LEVELS[3].goal.bottom);
});
