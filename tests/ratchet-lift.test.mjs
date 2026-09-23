import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CAT_R,
  FLOOR_Y,
  LEVELS,
  WORLD_H,
  applySneeze,
  freshPhysics,
  nextLevel,
  stepPhysics,
} from "../src/physics.ts";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

function sneezeAtHandle(world, power = 0.5) {
  const lift = LEVELS[world.level].ratchetLift;
  const dx = lift.handleX - world.cat.x;
  const dy = lift.handleY - world.cat.y;
  const distance = Math.hypot(dx, dy);
  return applySneeze(world, dx / distance, dy / distance, power);
}

function settleOnPlatform(world, maxFrames = 180) {
  for (let frame = 0; frame < maxFrames; frame += 1) {
    stepPhysics(world, 1 / 60);
    if (
      Math.abs(world.cat.y + CAT_R - world.ratchetPlatformY) < 1.5 &&
      Math.abs(world.cat.vy) < 12 &&
      Math.abs(world.cat.vx) < 12
    ) return true;
  }
  return false;
}

test("Level 14 starts at the lower stop and follows Level 13", () => {
  const world = freshPhysics(14);
  const lift = LEVELS[14].ratchetLift;

  assert.ok(lift);
  assert.equal(nextLevel(13), 14);
  assert.equal(nextLevel(14), 15);
  assert.equal(nextLevel(15), null);
  assert.deepEqual(lift.platformStops, [325, 365, 405, 445]);
  assert.deepEqual(world.cat, { x: 110, y: 420, vx: 0, vy: 0 });
  assert.equal(world.ratchetStage, lift.platformStops.length - 1);
  assert.equal(world.ratchetPlatformY, lift.platformStops.at(-1));
  assert.equal(world.ratchetDirection, -1);
  assert.equal(world.ratchetEverActivated, false);
});

test("one sneeze at the handle advances exactly one stop and carries a standing cat", () => {
  const world = freshPhysics(14);
  const lift = LEVELS[14].ratchetLift;
  const previousCatY = world.cat.y;

  assert.equal(sneezeAtHandle(world), true);
  assert.equal(world.ratchetStage, 2);
  assert.equal(world.ratchetPlatformY, lift.platformStops[2]);
  assert.equal(world.ratchetDirection, -1);
  assert.equal(world.ratchetEverActivated, true);
  assert.equal(world.cat.y, previousCatY - 40);

  const activatedStage = world.ratchetStage;
  for (let frame = 0; frame < 120; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.ratchetStage, activatedStage, "contact and elapsed frames do not repeat the ratchet action");
});

test("the handle requires a sneeze aimed at it", () => {
  const world = freshPhysics(14);

  assert.equal(applySneeze(world, 1, 0, 0.5), false);
  assert.equal(world.ratchetStage, 3);
  assert.equal(world.ratchetPlatformY, LEVELS[14].ratchetLift.platformStops[3]);
  assert.equal(world.ratchetEverActivated, false);
});

test("each handle sneeze advances one stop, reverses at both ends, and stays bounded", () => {
  const world = freshPhysics(14);
  const lift = LEVELS[14].ratchetLift;
  const stages = [];

  for (const expectedStage of [2, 1, 0, 1, 2, 3, 2]) {
    world.cat = {
      x: lift.handleX,
      y: world.ratchetPlatformY - CAT_R,
      vx: 0,
      vy: 0,
    };
    assert.equal(sneezeAtHandle(world), true);
    assert.equal(world.ratchetStage, expectedStage);
    assert.equal(world.ratchetPlatformY, lift.platformStops[expectedStage]);
    if (expectedStage === 0) assert.equal(world.ratchetDirection, 1, "the top stop changes the next step to downward");
    if (expectedStage === lift.platformStops.length - 1) assert.equal(world.ratchetDirection, -1, "the bottom stop changes the next step to upward");
    assert.ok(world.ratchetStage >= 0 && world.ratchetStage < lift.platformStops.length);
    assert.ok(world.ratchetPlatformY >= lift.platformStops[0]);
    assert.ok(world.ratchetPlatformY <= lift.platformStops[lift.platformStops.length - 1]);
    stages.push(world.ratchetStage);
  }

  assert.deepEqual(stages, [2, 1, 0, 1, 2, 3, 2]);
});

test("a cat away from the lift is not carried and resumes normal gravity", () => {
  const world = freshPhysics(14);
  world.cat = { x: 165, y: 310, vx: 0, vy: 0 };
  const previousY = world.cat.y;

  assert.equal(sneezeAtHandle(world), true);
  assert.equal(world.ratchetStage, 2);
  assert.equal(world.cat.y, previousY, "an airborne cat is not teleported with the platform");

  const falling = freshPhysics(14);
  falling.cat = { x: 280, y: 200, vx: 0, vy: 0 };
  stepPhysics(falling, 1 / 60);
  assert.ok(falling.cat.y > 200, "gravity continues after the cat leaves the elevator");
});

test("the cushion stays locked until the ratchet reaches its top stop", () => {
  const world = freshPhysics(14);
  world.cat = { x: 270, y: 355, vx: 0, vy: 0 };

  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.goalHold, 0);

  world.ratchetStage = 0;
  world.ratchetPlatformY = LEVELS[14].ratchetLift.platformStops[0];
  world.ratchetEverActivated = true;
  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(world.goalHold >= 0.6);
});

test("the documented three-step route clears Level 14", () => {
  const world = freshPhysics(14);
  const positions = [];

  for (const expectedStage of [2, 1, 0]) {
    assert.equal(sneezeAtHandle(world), true);
    assert.equal(world.ratchetStage, expectedStage);
    assert.ok(settleOnPlatform(world), "the cat can return to the current locked stop");
  }

  assert.equal(world.ratchetEverActivated, true);
  assert.equal(world.ratchetPlatformY, LEVELS[14].ratchetLift.platformStops[0]);
  assert.equal(applySneeze(world, -0.75, 0.66, 0.25), false);
  for (let frame = 0; frame < 180 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
    positions.push({ ...world.cat });
  }

  assert.ok(world.goalHold >= 0.6);
  assert.ok(world.cat.x >= LEVELS[14].goal.left && world.cat.x <= LEVELS[14].goal.right);
  assert.ok(world.cat.y >= LEVELS[14].goal.top && world.cat.y <= LEVELS[14].goal.bottom);
  assert.ok(positions.every((cat) => cat.x >= 0 && cat.x < 360 && cat.y >= 0 && cat.y < WORLD_H));
  assert.ok(positions.every((cat) => cat.y + CAT_R < FLOOR_Y + CAT_R));
});

test("restarting restores every ratchet field, velocity, and clear timer", () => {
  const world = freshPhysics(14);
  sneezeAtHandle(world);
  world.cat.vx = 400;
  world.goalHold = 0.4;

  const restarted = freshPhysics(world.level);

  assert.equal(restarted.level, 14);
  assert.equal(restarted.ratchetStage, 3);
  assert.equal(restarted.ratchetPlatformY, LEVELS[14].ratchetLift.platformStops[3]);
  assert.equal(restarted.ratchetDirection, -1);
  assert.equal(restarted.ratchetEverActivated, false);
  assert.equal(restarted.goalHold, 0);
  assert.deepEqual(restarted, freshPhysics(14));
});

test("Level 14 retains portrait sizing, pointer aiming, restart, and clear progression", () => {
  assert.match(appSource, /className="game-stage" aria-label={`ハクション・キャット Level \$\{level\}`}/);
  assert.match(appSource, /level === 14[\s\S]*?ハンドル/);
  assert.match(appSource, /つぎはラチェット式昇降台へ/);
  assert.match(appSource, /全レベル クリア！/);
  assert.match(appSource, /onPointerDown=\{handlePointerDown\}/);
  assert.match(appSource, /onPointerMove=\{handlePointerMove\}/);
  assert.match(appSource, /onPointerUp=\{releaseAim\}/);
  assert.match(appSource, /className="stage-restart-button"[\s\S]*onClick=\{resetGame\}/);
  assert.match(styles, /min-width:\s*320px/);
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*16/);
});
