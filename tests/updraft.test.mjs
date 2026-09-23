import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CAT_R,
  FLOOR_Y,
  LEFT_WALL,
  LEVELS,
  RIGHT_WALL,
  WORLD_H,
  applySneeze,
  freshPhysics,
  nextLevel,
  stepPhysics,
} from "../src/physics.ts";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

function sneezeToward(world, targetX, targetY, power = 1) {
  const dx = targetX - world.cat.x;
  const dy = targetY - world.cat.y;
  const distance = Math.hypot(dx, dy);
  return applySneeze(world, dx / distance, dy / distance, power);
}

test("Level 12 defines a bounded updraft shaft, blower, exit, and raised cushion", () => {
  const level = LEVELS[12];
  const world = freshPhysics(12);

  assert.equal(nextLevel(11), 12);
  assert.equal(nextLevel(12), 13);
  assert.deepEqual(world.cat, { x: 300, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 });
  assert.deepEqual(level.goal, { left: 72, right: 150, top: 316, bottom: 342 });
  assert.deepEqual(level.updraft, {
    x: 172,
    y: 165,
    width: 84,
    height: 355,
    blowerX: 280,
    blowerY: 460,
    duration: 4,
    liftAcceleration: 1850,
  });
  assert.equal(world.updraftTimeRemaining, 0);
  assert.equal(world.updraftEverActivated, false);
  assert.ok(level.obstacles.some((obstacle) => obstacle.y === 367), "the cushion has a solid landing surface");
});

test("the blower starts a four-second updraft only when a sneeze is aimed at it", () => {
  const missed = freshPhysics(12);
  assert.equal(applySneeze(missed, 1, 0, 1), false);
  assert.equal(missed.updraftTimeRemaining, 0);
  assert.equal(missed.updraftEverActivated, false);

  const world = freshPhysics(12);
  assert.equal(sneezeToward(world, 280, 460), true);
  assert.equal(world.updraftTimeRemaining, 4);
  assert.equal(world.updraftEverActivated, true);

  stepPhysics(world, 0.5);
  assert.equal(world.updraftTimeRemaining, 3.5);
});

test("the lift applies only inside the active shaft and stops when its timer expires", () => {
  const inside = freshPhysics(12);
  inside.updraftEverActivated = true;
  inside.updraftTimeRemaining = 2;
  inside.cat = { x: 214, y: 300, vx: 0, vy: 0 };
  stepPhysics(inside, 1 / 60);
  assert.ok(inside.cat.y < 300);
  assert.ok(inside.cat.vy < 0);

  const outside = freshPhysics(12);
  outside.updraftEverActivated = true;
  outside.updraftTimeRemaining = 2;
  outside.cat = { x: 300, y: 300, vx: 0, vy: 0 };
  stepPhysics(outside, 1 / 60);
  assert.ok(outside.cat.y > 300);
  assert.ok(outside.cat.vy > 0);

  const expired = freshPhysics(12);
  expired.updraftEverActivated = true;
  expired.updraftTimeRemaining = 0.01;
  expired.cat = { x: 214, y: 300, vx: 0, vy: 0 };
  stepPhysics(expired, 0.1);
  assert.equal(expired.updraftTimeRemaining, 0);
  assert.ok(expired.cat.y > 300);
  assert.ok(expired.cat.vy > 0);
});

test("the shaft ceiling keeps the cat inside the visible canvas", () => {
  const world = freshPhysics(12);
  world.updraftTimeRemaining = 4;
  world.cat = { x: 214, y: 200, vx: 0, vy: -2000 };

  stepPhysics(world, 0.05);

  assert.equal(world.cat.y, LEVELS[12].updraft.y + CAT_R);
  assert.ok(world.cat.y >= 0 && world.cat.y < WORLD_H);
});

test("the documented three-sneeze route clears Level 12 without leaving the screen", () => {
  const world = freshPhysics(12);
  const updraft = LEVELS[12].updraft;
  const positions = [];

  assert.equal(sneezeToward(world, updraft.blowerX, updraft.blowerY), true);
  for (let frame = 0; frame < 36; frame += 1) stepPhysics(world, 1 / 60);

  applySneeze(world, 1, 0, 1);
  let exitShotTaken = false;
  let highestPoint = world.cat.y;
  for (let frame = 0; frame < 360 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
    const elapsedSinceEntryShot = (frame + 1) / 60;
    highestPoint = Math.min(highestPoint, world.cat.y);
    positions.push({ ...world.cat });

    if (
      !exitShotTaken &&
      elapsedSinceEntryShot >= 0.6 &&
      world.cat.y >= 325 &&
      world.cat.y <= 355 &&
      world.cat.x > updraft.x &&
      world.cat.x < updraft.x + updraft.width
    ) {
      applySneeze(world, 1, 0, 0.25);
      exitShotTaken = true;
    }
  }

  assert.equal(exitShotTaken, true, "the cat reaches the shaft exit after the aim cooldown");
  assert.ok(highestPoint < 320, "the updraft carries the cat to the exit height");
  assert.ok(world.goalHold >= 0.6, "the cat lands and rests on the cushion");
  assert.ok(world.cat.x >= LEVELS[12].goal.left && world.cat.x <= LEVELS[12].goal.right);
  assert.ok(world.cat.y >= LEVELS[12].goal.top && world.cat.y <= LEVELS[12].goal.bottom);
  assert.ok(positions.every((cat) => (
    cat.x >= LEFT_WALL + CAT_R &&
    cat.x <= RIGHT_WALL - CAT_R &&
    cat.y >= 0 &&
    cat.y < WORLD_H
  )));
});

test("restart clears the blower timer and activation state while retaining Level 12", () => {
  const world = freshPhysics(12);
  sneezeToward(world, LEVELS[12].updraft.blowerX, LEVELS[12].updraft.blowerY);
  world.cat.vx = 430;
  world.goalHold = 0.3;

  const restarted = freshPhysics(world.level);

  assert.equal(restarted.level, 12);
  assert.equal(restarted.updraftTimeRemaining, 0);
  assert.equal(restarted.updraftEverActivated, false);
  assert.equal(restarted.goalHold, 0);
  assert.deepEqual(restarted, freshPhysics(12));
});

test("Level 12 shows the updraft controls, countdown, progression, and retains pointer aiming", () => {
  const pointerDownStart = appSource.indexOf("const handlePointerDown =");
  const pointerMoveStart = appSource.indexOf("const handlePointerMove =", pointerDownStart);
  const pointerDown = appSource.slice(pointerDownStart, pointerMoveStart);
  const releaseStart = appSource.indexOf("const releaseAim =", pointerMoveStart);
  const releaseEnd = appSource.indexOf("return (", releaseStart);
  const releaseAim = appSource.slice(releaseStart, releaseEnd);

  assert.match(appSource, /上昇気流 \$\{world\.updraftTimeRemaining\.toFixed\(1\)\}秒/);
  assert.match(appSource, /上昇気流の通り道/);
  assert.match(appSource, /送風機/);
  assert.match(appSource, /送風機ON/);
  assert.match(appSource, /右へくしゃみ → 左の出口へ/);
  assert.match(appSource, /level === 11[\s\S]*つぎは上昇気流シャフトへ/);
  assert.match(appSource, /level === 12[\s\S]*全レベル クリア！/);
  assert.match(pointerDown, /event\.currentTarget\.setPointerCapture\(event\.pointerId\)/);
  assert.doesNotMatch(pointerDown, /updraftTimeRemaining/);
  assert.match(releaseAim, /applySneeze\(physicsRef\.current, dirX, dirY, power\)/);
  assert.match(styles, /min-width:\s*320px/);
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*16/);
});
