import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BOX_HALF,
  CAT_R,
  FLOOR_Y,
  LEVELS,
  applySneeze,
  freshPhysics,
  gravityDirectionForBody,
  isBodyInGravityZone,
  nextLevel,
  stepPhysics,
} from "../src/physics.ts";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

function sneezeAtGravitySwitch(world, power = 0.55) {
  const zone = LEVELS[world.level].gravityZone;
  const dx = zone.switchX - world.cat.x;
  const dy = zone.switchY - world.cat.y;
  const distance = Math.hypot(dx, dy);
  return applySneeze(world, dx / distance, dy / distance, power);
}

function stepFrames(world, frames) {
  for (let frame = 0; frame < frames; frame += 1) stepPhysics(world, 1 / 60);
}

test("Level 16 follows Level 15 with a bounded gravity zone and reset state", () => {
  const world = freshPhysics(16);
  const zone = LEVELS[16].gravityZone;

  assert.ok(zone);
  assert.equal(nextLevel(15), 16);
  assert.equal(nextLevel(16), null);
  assert.deepEqual(world.cat, { x: 150, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 });
  assert.deepEqual(world.box, { x: 245, y: FLOOR_Y - BOX_HALF, vx: 0, vy: 0 });
  assert.equal(world.gravityReversed, false);
  assert.equal(world.gravitySwitchEverActivated, false);
  assert.ok(zone.height > zone.width, "the active area should read as a tall vertical zone");
  assert.equal(gravityDirectionForBody(world, world.cat), 1);
});

test("only an aimed sneeze near the switch toggles gravity", () => {
  const missed = freshPhysics(16);
  applySneeze(missed, 1, 0, 0.5);
  assert.equal(missed.gravityReversed, false);
  assert.equal(missed.gravitySwitchEverActivated, false);

  const world = freshPhysics(16);
  assert.equal(sneezeAtGravitySwitch(world), true);
  assert.equal(world.gravityReversed, true);
  assert.equal(world.gravitySwitchEverActivated, true);
  stepFrames(world, 80);
  assert.equal(sneezeAtGravitySwitch(world, 1), true);
  assert.equal(world.gravityReversed, false);
});

test("reversed gravity applies to the cat and movable box only inside the zone", () => {
  const world = freshPhysics(16);
  const zone = LEVELS[16].gravityZone;
  world.gravityReversed = true;
  world.gravitySwitchEverActivated = true;
  world.cat = { x: zone.x + 90, y: 390, vx: 0, vy: 0 };
  world.box = { x: zone.x + 170, y: 390, vx: 0, vy: 0 };

  assert.equal(isBodyInGravityZone(world, world.cat), true);
  assert.equal(isBodyInGravityZone(world, world.box), true);
  assert.equal(gravityDirectionForBody(world, world.cat), -1);
  assert.equal(gravityDirectionForBody(world, world.box), -1);
  stepPhysics(world, 1 / 60);
  assert.ok(world.cat.vy < 0);
  assert.ok(world.box.vy < 0);

  world.cat = { x: zone.x + zone.width + CAT_R + 2, y: 250, vx: 0, vy: 0 };
  assert.equal(isBodyInGravityZone(world, world.cat), false);
  assert.equal(gravityDirectionForBody(world, world.cat), 1);
  stepPhysics(world, 1 / 60);
  assert.ok(world.cat.vy > 0, "outside the zone gravity should immediately point down");
});

test("the cat and box settle against the ceiling while gravity is reversed", () => {
  const world = freshPhysics(16);
  const ceiling = LEVELS[16].obstacles[0];
  world.gravityReversed = true;
  world.gravitySwitchEverActivated = true;
  world.cat = { x: 175, y: 330, vx: 0, vy: 0 };
  world.box = { x: 235, y: 360, vx: 0, vy: 0 };

  stepFrames(world, 180);

  const underside = ceiling.y + ceiling.height;
  assert.ok(Math.abs(world.cat.y - CAT_R - underside) < 1.1);
  assert.ok(Math.abs(world.box.y - BOX_HALF - underside) < 1.1);
  assert.ok(Math.abs(world.cat.vy) < 1);
  assert.ok(Math.abs(world.box.vy) < 1);
});

test("the documented switch-ceiling-switch route clears Level 16", () => {
  const world = freshPhysics(16);
  const zone = LEVELS[16].gravityZone;

  assert.equal(sneezeAtGravitySwitch(world, 0.55), true);
  assert.equal(world.gravityReversed, true);
  for (let frame = 0; frame < 180 && world.cat.y > zone.y + 32; frame += 1) {
    stepPhysics(world, 1 / 60);
  }
  stepFrames(world, 30);
  assert.ok(world.cat.y <= zone.y + 32, `cat should reach the ceiling (cat=${JSON.stringify(world.cat)})`);

  assert.equal(sneezeAtGravitySwitch(world, 1), true);
  assert.equal(world.gravityReversed, false);
  for (let frame = 0; frame < 360 && world.goalHold < 0.6; frame += 1) {
    stepPhysics(world, 1 / 60);
  }

  assert.ok(world.goalHold >= 0.6, `gravity route should finish on the right cushion (cat=${JSON.stringify(world.cat)})`);
  assert.ok(world.cat.x >= LEVELS[16].goal.left && world.cat.x <= LEVELS[16].goal.right);
  assert.ok(world.cat.y >= LEVELS[16].goal.top && world.cat.y <= LEVELS[16].goal.bottom);
});

test("the cushion stays locked while gravity is still reversed", () => {
  const world = freshPhysics(16);
  const goal = LEVELS[16].goal;
  world.gravitySwitchEverActivated = true;
  world.gravityReversed = true;
  world.cat = {
    x: (goal.left + goal.right) / 2,
    y: (goal.top + goal.bottom) / 2,
    vx: 0,
    vy: 0,
  };
  stepFrames(world, 45);
  assert.equal(world.goalHold, 0);

  world.gravityReversed = false;
  world.cat = {
    x: (goal.left + goal.right) / 2,
    y: 280,
    vx: 0,
    vy: 0,
  };
  stepFrames(world, 45);
  assert.ok(world.goalHold >= 0.6);
});

test("restarting resets gravity direction, velocities, switch state, and clear timer", () => {
  const world = freshPhysics(16);
  assert.equal(sneezeAtGravitySwitch(world), true);
  stepFrames(world, 30);
  world.goalHold = 0.4;

  const restarted = freshPhysics(world.level);
  assert.equal(restarted.level, 16);
  assert.equal(restarted.gravityReversed, false);
  assert.equal(restarted.gravitySwitchEverActivated, false);
  assert.equal(restarted.cat.vx, 0);
  assert.equal(restarted.cat.vy, 0);
  assert.equal(restarted.box.vx, 0);
  assert.equal(restarted.box.vy, 0);
  assert.equal(restarted.goalHold, 0);
  assert.deepEqual(restarted, freshPhysics(16));
});

test("Level 16 keeps portrait pointer controls and clearly renders gravity state", () => {
  assert.match(appSource, /level === 16/);
  assert.match(appSource, /重力 ↑ 反転中/);
  assert.match(appSource, /反転は色付きエリアの中だけ/);
  assert.match(appSource, /つぎは重力反転エリアへ/);
  assert.match(appSource, /gravityZone/);
  assert.match(appSource, /onPointerDown=\{handlePointerDown\}/);
  assert.match(appSource, /onPointerMove=\{handlePointerMove\}/);
  assert.match(appSource, /onPointerUp=\{releaseAim\}/);
  assert.match(appSource, /className="stage-restart-button"[\s\S]*onClick=\{resetGame\}/);
  assert.match(styles, /min-width:\s*320px/);
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*16/);
});
