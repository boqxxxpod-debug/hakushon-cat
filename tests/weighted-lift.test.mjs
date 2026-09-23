import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BOX_HALF,
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

function loadBoxIntoBasket(world) {
  const pushedBox = applySneeze(world, 0.56, -0.83, 1);
  for (let frame = 0; frame < 90 && !world.liftBoxLoaded; frame += 1) {
    stepPhysics(world, 1 / 60);
  }
  return pushedBox;
}

function basketBaseY(world) {
  const lift = LEVELS[13].weightedLift;
  return lift.basketBaseYAtBottom + (lift.platformBottomY - world.liftPlatformY);
}

test("Level 13 starts with the cat on a bounded lift and the box beside its basket", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;

  assert.ok(lift);
  assert.equal(nextLevel(12), 13);
  assert.equal(nextLevel(13), 14);
  assert.equal(nextLevel(14), 15);
  assert.equal(nextLevel(15), null);
  assert.deepEqual(world.cat, { x: 92, y: 425, vx: 0, vy: 0 });
  assert.deepEqual(world.box, { x: 100, y: 339, vx: 0, vy: 0 });
  assert.deepEqual(LEVELS[13].goal, { left: 160, right: 235, top: 245, bottom: 270 });
  assert.equal(world.liftPlatformY, lift.platformBottomY);
  assert.equal(world.liftBoxLoaded, false);
  assert.equal(world.liftEverLoaded, false);
  assert.equal(basketBaseY(world), lift.basketBaseYAtBottom);
});

test("pushing the box into the basket carries it down and lifts the cat to safe endpoints", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;
  const startingCatY = world.cat.y;
  const startingBasketY = basketBaseY(world);

  assert.equal(loadBoxIntoBasket(world), true);
  assert.equal(world.liftBoxLoaded, true);
  assert.equal(world.liftEverLoaded, true);
  assert.ok(world.box.x >= lift.basketX + BOX_HALF);
  assert.ok(Math.abs(world.box.y + BOX_HALF - basketBaseY(world)) < 1);

  for (let frame = 0; frame < 300 && world.liftPlatformY > lift.platformTopY + 0.5; frame += 1) {
    stepPhysics(world, 1 / 60);
    const currentBasketY = basketBaseY(world);
    assert.ok(world.liftPlatformY >= lift.platformTopY);
    assert.ok(world.liftPlatformY <= lift.platformBottomY);
    assert.ok(currentBasketY >= startingBasketY);
    assert.ok(currentBasketY + 10 <= FLOOR_Y);
    assert.ok(world.cat.x >= 0 && world.cat.x < 360);
    assert.ok(world.cat.y >= 0 && world.cat.y < WORLD_H);
    assert.ok(world.box.x >= 0 && world.box.x < 360);
    assert.ok(world.box.y >= 0 && world.box.y < WORLD_H);
  }

  assert.ok(world.liftPlatformY <= lift.platformTopY + 0.5);
  assert.ok(world.liftPlatformY < lift.platformBottomY);
  assert.ok(basketBaseY(world) > startingBasketY);
  assert.ok(Math.abs(world.cat.y - (world.liftPlatformY - CAT_R)) < 1);
  assert.ok(Math.abs(world.box.y + BOX_HALF - basketBaseY(world)) < 1);
});

test("removing the box unloads the basket and reverses the lift", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;
  assert.equal(loadBoxIntoBasket(world), true);
  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.liftBoxLoaded, true);

  const dx = world.box.x - world.cat.x;
  const dy = world.box.y - world.cat.y;
  const distance = Math.hypot(dx, dy);
  assert.ok(distance < 155, "the box can still be reached while the lift starts to rise");
  const aimAngle = Math.atan2(dy, dx) - (34 * Math.PI) / 180;
  assert.equal(applySneeze(world, Math.cos(aimAngle), Math.sin(aimAngle), 1), true);

  for (let frame = 0; frame < 30 && world.liftBoxLoaded; frame += 1) {
    stepPhysics(world, 1 / 60);
  }
  assert.equal(world.liftBoxLoaded, false);
  assert.equal(world.liftEverLoaded, true);
  const platformAtRelease = world.liftPlatformY;
  for (let frame = 0; frame < 12; frame += 1) stepPhysics(world, 1 / 60);
  assert.ok(world.liftPlatformY > platformAtRelease);
  assert.ok(world.liftPlatformY <= lift.platformBottomY);
});

test("the cat rides the moving platform and falls normally after leaving it", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;
  assert.equal(loadBoxIntoBasket(world), true);

  const platformBeforeRide = world.liftPlatformY;
  const catBeforeRide = world.cat.y;
  stepPhysics(world, 1 / 60);
  assert.ok(world.liftPlatformY < platformBeforeRide);
  assert.ok(world.cat.y < catBeforeRide);
  assert.ok(Math.abs(
    (platformBeforeRide - world.liftPlatformY) - (catBeforeRide - world.cat.y),
  ) < 1);

  world.cat.x = lift.platformX + lift.platformWidth + CAT_R + 5;
  world.cat.y = world.liftPlatformY - CAT_R;
  world.cat.vx = 0;
  world.cat.vy = 0;
  const catBeforeFalling = world.cat.y;
  stepPhysics(world, 1 / 60);

  assert.ok(world.cat.y > catBeforeFalling, "gravity should act when the cat is no longer over the platform");
});

test("the cushion stays locked until the loaded lift reaches its upper stop", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;
  assert.equal(loadBoxIntoBasket(world), true);
  world.cat = { x: 190, y: 260, vx: 0, vy: 0 };

  for (let frame = 0; frame < 60; frame += 1) stepPhysics(world, 1 / 60);
  assert.equal(world.goalHold, 0);

  for (let frame = 0; frame < 300 && world.liftPlatformY > lift.platformTopY + 0.5; frame += 1) {
    stepPhysics(world, 1 / 60);
  }
  for (let frame = 0; frame < 45 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }
  assert.ok(world.liftBoxLoaded);
  assert.ok(world.liftPlatformY <= lift.platformTopY + 0.5);
  assert.ok(world.goalHold >= 0.6);
});

test("the documented two-sneeze route places the box and clears Level 13", () => {
  const world = freshPhysics(13);
  const lift = LEVELS[13].weightedLift;
  const positions = [];

  assert.equal(loadBoxIntoBasket(world), true);
  for (let frame = 0; frame < 300 && world.liftPlatformY > lift.platformTopY + 0.5; frame += 1) {
    stepPhysics(world, 1 / 60);
    positions.push({ cat: { ...world.cat }, box: { ...world.box } });
  }
  assert.ok(world.liftBoxLoaded);
  assert.ok(world.liftPlatformY <= lift.platformTopY + 0.5);

  applySneeze(world, -0.6, 0.8, 1);
  for (let frame = 0; frame < 180 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
    positions.push({ cat: { ...world.cat }, box: { ...world.box } });
  }

  assert.ok(world.goalHold >= 0.6);
  assert.ok(world.liftBoxLoaded);
  assert.ok(world.cat.x >= LEVELS[13].goal.left && world.cat.x <= LEVELS[13].goal.right);
  assert.ok(world.cat.y >= LEVELS[13].goal.top && world.cat.y <= LEVELS[13].goal.bottom);
  assert.ok(positions.every(({ cat, box }) => (
    cat.x >= 0 && cat.x < 360 && cat.y >= 0 && cat.y < WORLD_H &&
    box.x >= 0 && box.x < 360 && box.y >= 0 && box.y < WORLD_H
  )));
});

test("restart restores the basket, platform, box, cat, and clear timer for Level 13", () => {
  const world = freshPhysics(13);
  assert.equal(loadBoxIntoBasket(world), true);
  for (let frame = 0; frame < 50; frame += 1) stepPhysics(world, 1 / 60);
  world.cat.vx = 400;
  world.goalHold = 0.4;

  const restarted = freshPhysics(world.level);

  assert.equal(restarted.level, 13);
  assert.equal(restarted.liftPlatformY, LEVELS[13].weightedLift.platformBottomY);
  assert.equal(restarted.liftBoxLoaded, false);
  assert.equal(restarted.liftEverLoaded, false);
  assert.equal(restarted.goalHold, 0);
  assert.deepEqual(restarted, freshPhysics(13));
});

test("the canvas keeps the existing touch-safe portrait and pointer input for the new level", () => {
  assert.match(appSource, /className="game-stage" aria-label={`ハクション・キャット Level \$\{level\}`}/);
  assert.match(appSource, /onPointerDown={handlePointerDown}/);
  assert.match(appSource, /onPointerMove={handlePointerMove}/);
  assert.match(appSource, /onPointerUp={releaseAim}/);
  assert.match(appSource, /className="stage-restart-button"[\s\S]*onClick={resetGame}/);
  assert.match(styles, /min-width:\s*320px/);
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*16/);
});
