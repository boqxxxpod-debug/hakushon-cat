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

function sneezeAtValve(world, power = 0.5) {
  const elevator = LEVELS[world.level].waterElevator;
  const dx = elevator.valveX - world.cat.x;
  const dy = elevator.valveY - world.cat.y;
  const distance = Math.hypot(dx, dy);
  return applySneeze(world, dx / distance, dy / distance, power);
}

function stepFrames(world, frames) {
  for (let frame = 0; frame < frames; frame += 1) stepPhysics(world, 1 / 60);
}

test("Level 15 starts with the cat on a low bounded float and follows Level 14", () => {
  const world = freshPhysics(15);
  const elevator = LEVELS[15].waterElevator;

  assert.ok(elevator);
  assert.equal(nextLevel(14), 15);
  assert.equal(nextLevel(15), 16);
  assert.equal(nextLevel(16), null);
  assert.deepEqual(world.cat, { x: 160, y: 475, vx: 0, vy: 0 });
  assert.equal(world.waterSurfaceY, elevator.lowWaterY);
  assert.equal(world.waterPlatformY, elevator.lowWaterY);
  assert.equal(world.waterFilling, false);
  assert.equal(world.waterValveEverActivated, false);
  assert.ok(elevator.highWaterY < elevator.lowWaterY);
  assert.ok(elevator.lowWaterY + elevator.platformHeight <= FLOOR_Y);
});

test("only a close sneeze aimed at the valve toggles filling and draining", () => {
  const missed = freshPhysics(15);
  assert.equal(applySneeze(missed, 1, 0, 0.5), false);
  assert.equal(missed.waterFilling, false);
  assert.equal(missed.waterValveEverActivated, false);

  const world = freshPhysics(15);
  assert.equal(sneezeAtValve(world), true);
  assert.equal(world.waterFilling, true);
  assert.equal(world.waterValveEverActivated, true);
  assert.equal(sneezeAtValve(world), true);
  assert.equal(world.waterFilling, false);
});

test("water moves at a fixed rate, clamps at both ends, and reverses on the valve", () => {
  const world = freshPhysics(15);
  const elevator = LEVELS[15].waterElevator;
  assert.equal(sneezeAtValve(world), true);

  stepFrames(world, 30);
  assert.ok(Math.abs(world.waterSurfaceY - (elevator.lowWaterY - elevator.waterSpeed * 0.5)) < 0.01);
  assert.equal(world.waterPlatformY, world.waterSurfaceY);

  stepFrames(world, 240);
  assert.equal(world.waterSurfaceY, elevator.highWaterY);
  assert.equal(world.waterPlatformY, elevator.highWaterY);
  stepFrames(world, 60);
  assert.equal(world.waterSurfaceY, elevator.highWaterY, "filling stops at the upper limit");

  assert.equal(applySneeze(world, 1, 0, 0.5), false);
  stepFrames(world, 40);
  assert.ok(world.cat.x < 160, "a neutral shot can move the cat closer to the valve while it rides the high float");
  assert.equal(sneezeAtValve(world), true);
  stepFrames(world, 30);
  assert.ok(Math.abs(world.waterSurfaceY - (elevator.highWaterY + elevator.waterSpeed * 0.5)) < 0.01);
  stepFrames(world, 240);
  assert.equal(world.waterSurfaceY, elevator.lowWaterY);
  assert.equal(world.waterPlatformY, elevator.lowWaterY);
  stepFrames(world, 60);
  assert.equal(world.waterSurfaceY, elevator.lowWaterY, "draining stops at the lower limit");
});

test("the float carries a standing cat and an airborne cat keeps normal gravity", () => {
  const elevator = LEVELS[15].waterElevator;
  const riding = freshPhysics(15);
  riding.waterFilling = true;
  stepFrames(riding, 30);
  assert.ok(Math.abs(riding.cat.y + CAT_R - riding.waterPlatformY) < 1);
  assert.ok(riding.cat.y < LEVELS[15].cat.y);

  const detached = freshPhysics(15);
  detached.waterFilling = true;
  detached.cat = { x: 300, y: 180, vx: 0, vy: 0 };
  stepFrames(detached, 30);
  assert.ok(Math.abs(detached.waterPlatformY - (elevator.lowWaterY - elevator.waterSpeed * 0.5)) < 0.01);
  assert.ok(detached.cat.y > 180, "gravity still moves a cat that is away from the float");
  assert.ok(detached.cat.y < WORLD_H);
});

test("the documented valve, rising-float, and right-high-ground route clears Level 15", () => {
  const world = freshPhysics(15);
  const elevator = LEVELS[15].waterElevator;
  assert.equal(sneezeAtValve(world), true);
  stepFrames(world, 240);

  assert.equal(world.waterSurfaceY, elevator.highWaterY);
  assert.equal(world.waterValveEverActivated, true);
  assert.ok(Math.abs(world.cat.y + CAT_R - world.waterPlatformY) < 1);
  assert.ok(world.cat.x > LEVELS[15].cat.x, "the recoil from the valve sneeze leaves room to launch right");

  assert.equal(applySneeze(world, -0.8, 0.6, 1), false);
  for (let frame = 0; frame < 360 && world.goalHold < 0.6; frame += 1) stepPhysics(world, 1 / 60);

  assert.ok(world.goalHold >= 0.6, `the high route should clear the cushion (cat=${JSON.stringify(world.cat)})`);
  assert.ok(world.cat.x >= LEVELS[15].goal.left && world.cat.x <= LEVELS[15].goal.right);
  assert.ok(world.cat.y >= LEVELS[15].goal.top && world.cat.y <= LEVELS[15].goal.bottom);
  assert.ok(world.cat.x >= 0 && world.cat.x < 360);
  assert.ok(world.cat.y >= 0 && world.cat.y < WORLD_H);
});

test("the cushion stays locked until the valve has raised water to the top", () => {
  const world = freshPhysics(15);
  const goal = LEVELS[15].goal;
  world.cat = { x: (goal.left + goal.right) / 2, y: 361, vx: 0, vy: 0 };
  stepFrames(world, 60);
  assert.equal(world.goalHold, 0);

  world.waterValveEverActivated = true;
  world.waterSurfaceY = LEVELS[15].waterElevator.highWaterY;
  world.waterPlatformY = world.waterSurfaceY;
  world.waterFilling = true;
  world.cat = { x: (goal.left + goal.right) / 2, y: 361, vx: 0, vy: 0 };
  stepFrames(world, 60);
  assert.ok(world.goalHold >= 0.6);
});

test("restarting resets the water level, valve direction, velocities, and clear timer", () => {
  const world = freshPhysics(15);
  assert.equal(sneezeAtValve(world), true);
  stepFrames(world, 30);
  world.cat.vx = 320;
  world.goalHold = 0.4;

  const restarted = freshPhysics(world.level);
  assert.equal(restarted.level, 15);
  assert.equal(restarted.waterSurfaceY, LEVELS[15].waterElevator.initialWaterY);
  assert.equal(restarted.waterPlatformY, LEVELS[15].waterElevator.initialWaterY);
  assert.equal(restarted.waterFilling, false);
  assert.equal(restarted.waterValveEverActivated, false);
  assert.equal(restarted.goalHold, 0);
  assert.deepEqual(restarted, freshPhysics(15));
});

test("Level 15 keeps portrait touch controls, restart, visible water, and progression guidance", () => {
  assert.match(appSource, /className="game-stage" aria-label={`ハクション・キャット Level \$\{level\}`}/);
  assert.match(appSource, /level === 15[\s\S]*?バルブ/);
  assert.match(appSource, /水位MAX！/);
  assert.match(appSource, /つぎは水位エレベーターへ/);
  assert.match(appSource, /waterSurfaceY/);
  assert.match(appSource, /waterPlatformY/);
  assert.match(appSource, /onPointerDown=\{handlePointerDown\}/);
  assert.match(appSource, /onPointerMove=\{handlePointerMove\}/);
  assert.match(appSource, /onPointerUp=\{releaseAim\}/);
  assert.match(appSource, /className="stage-restart-button"[\s\S]*onClick=\{resetGame\}/);
  assert.match(styles, /min-width:\s*320px/);
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*16/);
});
