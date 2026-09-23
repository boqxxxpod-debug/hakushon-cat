export const WORLD_W = 360;
export const WORLD_H = 640;
export const FLOOR_Y = 545;
export const LEFT_WALL = 18;
export const RIGHT_WALL = 342;
export const CAT_R = 25;
export const BOX_HALF = 21;
export const BALLOON_R = 18;
export const MAX_AIM_DISTANCE = 120;
export const CAT_GROUND_FRICTION = 1500;
export const CAT_ICE_FRICTION = 90;
export const ROPE_SNEEZE_SCALE = 0.45;

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IceZone = {
  x: number;
  width: number;
};

export type SpringPad = {
  x: number;
  width: number;
  launchVelocity: number;
};

export type PressureSwitch = {
  x: number;
  width: number;
};

export type Gate = Obstacle & {
  switchIndex: number;
};

export type Seesaw = {
  x: number;
  y: number;
  width: number;
  thickness: number;
  maxAngle: number;
  angularSpeed: number;
};

export type BreakableWall = Obstacle & {
  durability: number;
  minImpact: number;
};

export type MovingPlatform = Obstacle & {
  axis: "x" | "y";
  distance: number;
  period: number;
  phase: number;
};

export type Rope = {
  anchorX: number;
  anchorY: number;
  length: number;
  grabRadius: number;
};

export type Updraft = {
  x: number;
  y: number;
  width: number;
  height: number;
  blowerX: number;
  blowerY: number;
  duration: number;
  liftAcceleration: number;
};

export type WeightedLift = {
  platformX: number;
  platformWidth: number;
  platformHeight: number;
  platformTopY: number;
  platformBottomY: number;
  basketX: number;
  basketWidth: number;
  basketHeight: number;
  basketBaseYAtBottom: number;
  basketWallWidth: number;
  liftSpeed: number;
};

export type RatchetLift = {
  platformX: number;
  platformWidth: number;
  platformHeight: number;
  /** Fixed stops ordered from the uppermost position to the lowest. */
  platformStops: number[];
  handleX: number;
  handleY: number;
  handleRadius: number;
};

export type WaterElevator = {
  tankX: number;
  tankWidth: number;
  tankBottomY: number;
  platformX: number;
  platformWidth: number;
  platformHeight: number;
  highWaterY: number;
  lowWaterY: number;
  initialWaterY: number;
  waterSpeed: number;
  valveX: number;
  valveY: number;
  valveRadius: number;
};

export type LevelDefinition = {
  id: LevelId;
  cat: Pick<Body, "x" | "y">;
  box: Pick<Body, "x" | "y"> | null;
  balloon: Pick<Body, "x" | "y"> | null;
  goal: { left: number; right: number; top: number; bottom: number };
  obstacles: Obstacle[];
  iceZones: IceZone[];
  springs: SpringPad[];
  switches: PressureSwitch[];
  gates: Gate[];
  seesaws: Seesaw[];
  breakableWalls: BreakableWall[];
  movingPlatforms: MovingPlatform[];
  ropes: Rope[];
  updraft?: Updraft;
  weightedLift?: WeightedLift;
  ratchetLift?: RatchetLift;
  waterElevator?: WaterElevator;
  hint: string;
};

export type PlayStatus = "playing" | "won" | "failed";

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type PhysicsState = {
  level: LevelId;
  cat: Body;
  box: Body | null;
  balloon: Body | null;
  balloonCleared: boolean;
  obstacles: Obstacle[];
  iceZones: IceZone[];
  springs: SpringPad[];
  springArmed: boolean[];
  switches: PressureSwitch[];
  switchOn: boolean[];
  gates: Gate[];
  gateOpen: boolean[];
  seesaws: Seesaw[];
  seesawAngles: number[];
  breakableWalls: BreakableWall[];
  wallHealth: number[];
  wallBroken: boolean[];
  movingPlatforms: MovingPlatform[];
  platformTime: number;
  platformPositions: Obstacle[];
  platformContacts: boolean[];
  ropes: Rope[];
  ropeAngles: number[];
  ropeAngularVelocities: number[];
  ropeAttached: number | null;
  ropeGrabCooldown: number;
  ropeEverGrabbed: boolean;
  updraftTimeRemaining: number;
  updraftEverActivated: boolean;
  liftPlatformY: number;
  liftBoxLoaded: boolean;
  liftEverLoaded: boolean;
  ratchetPlatformY: number;
  ratchetStage: number;
  ratchetDirection: -1 | 1;
  ratchetEverActivated: boolean;
  waterSurfaceY: number;
  waterPlatformY: number;
  waterFilling: boolean;
  waterValveEverActivated: boolean;
  goalHold: number;
};

export type AimState = {
  active: boolean;
  pointerId: number;
  x: number;
  y: number;
};

export type SneezeState = {
  age: number;
  dirX: number;
  dirY: number;
  power: number;
};

export const LEVELS: Record<LevelId, LevelDefinition> = {
  1: {
    id: 1,
    cat: { x: 285, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: null,
    goal: { left: 48, right: 148, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "右へ2回、反動で左へ！",
  },
  2: {
    id: 2,
    cat: { x: 250, y: FLOOR_Y - CAT_R },
    box: { x: 175, y: FLOOR_Y - BOX_HALF },
    balloon: null,
    goal: { left: 128, right: 166, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "箱を左へ → 右下へ！",
  },
  3: {
    id: 3,
    cat: { x: 285, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: null,
    goal: { left: 48, right: 112, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [{ x: 112, width: 213 }],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "氷の上はツルツル！",
  },
  4: {
    id: 4,
    cat: { x: 70, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: null,
    goal: { left: 238, right: 326, top: 350, bottom: 382 },
    obstacles: [{ x: 220, y: 405, width: 112, height: 140 }],
    iceZones: [],
    springs: [{ x: 135, width: 65, launchVelocity: 760 }],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "バネに乗って高い足場へ！",
  },
  5: {
    id: 5,
    cat: { x: 250, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: { x: 175, y: FLOOR_Y - BALLOON_R - 2 },
    goal: { left: 120, right: 166, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "弱い風で風船をどかそう！",
  },
  6: {
    id: 6,
    cat: { x: 250, y: FLOOR_Y - CAT_R },
    box: { x: 175, y: FLOOR_Y - BOX_HALF },
    balloon: null,
    goal: { left: 128, right: 166, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [{ x: 26, width: 65 }],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "箱を置いてスイッチON！",
  },
  7: {
    id: 7,
    cat: { x: 250, y: FLOOR_Y - CAT_R },
    box: { x: 175, y: FLOOR_Y - BOX_HALF },
    balloon: null,
    goal: { left: 128, right: 166, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [{ x: 26, width: 65 }],
    gates: [{ x: 207, y: 145, width: 14, height: 400, switchIndex: 0 }],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "スイッチでゲートOPEN！",
  },
  8: {
    id: 8,
    cat: { x: 317, y: FLOOR_Y - CAT_R },
    box: { x: 180, y: 461 },
    balloon: null,
    goal: { left: 250, right: 326, top: 395, bottom: 450 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [{
      x: 170,
      y: 490,
      width: 260,
      thickness: 16,
      maxAngle: 0.25,
      angularSpeed: 1.8,
    }],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    hint: "箱でシーソーを傾けよう！",
  },
  9: {
    id: 9,
    cat: { x: 50, y: FLOOR_Y - CAT_R },
    box: { x: 125, y: FLOOR_Y - BOX_HALF },
    balloon: null,
    goal: { left: 207, right: 252, top: 486, bottom: 522 },
    obstacles: [],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [{
      x: 165,
      y: 145,
      width: 16,
      height: 400,
      durability: 100,
      minImpact: 330,
    }],
    movingPlatforms: [],
    ropes: [],
    hint: "箱を加速して壁を壊せ！",
  },
  10: {
    id: 10,
    cat: { x: 80, y: 455 },
    box: null,
    balloon: null,
    goal: { left: 289, right: 331, top: 405, bottom: 433 },
    obstacles: [{ x: 280, y: 455, width: 62, height: 90 }],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [{
      x: 110,
      y: 480,
      width: 90,
      height: 14,
      axis: "x",
      distance: 75,
      period: 4,
      phase: -Math.PI / 2,
    }],
    ropes: [],
    hint: "右端でタイミングよく飛ぼう！",
  },
  11: {
    id: 11,
    cat: { x: 60, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: null,
    goal: { left: 284, right: 330, top: 440, bottom: 468 },
    obstacles: [{ x: 274, y: 490, width: 68, height: 55 }],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [{
      anchorX: 170,
      anchorY: 105,
      length: 365,
      grabRadius: 38,
    }],
    hint: "ロープで右の足場へ！",
  },
  12: {
    id: 12,
    cat: { x: 300, y: FLOOR_Y - CAT_R },
    box: null,
    balloon: null,
    goal: { left: 72, right: 150, top: 316, bottom: 342 },
    obstacles: [
      { x: 158, y: 165, width: 14, height: 116 },
      { x: 158, y: 380, width: 14, height: 140 },
      { x: 256, y: 165, width: 14, height: 282 },
      { x: 44, y: 367, width: 114, height: 20 },
    ],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    updraft: {
      x: 172,
      y: 165,
      width: 84,
      height: 355,
      blowerX: 280,
      blowerY: 460,
      duration: 4,
      liftAcceleration: 1850,
    },
    hint: "送風機で上昇気流を起こせ！",
  },
  13: {
    id: 13,
    cat: { x: 92, y: 425 },
    box: { x: 100, y: 339 },
    balloon: null,
    goal: { left: 160, right: 235, top: 245, bottom: 270 },
    obstacles: [
      { x: 80, y: 360, width: 55, height: 14 },
      { x: 150, y: 285, width: 178, height: 14 },
    ],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    weightedLift: {
      platformX: 40,
      platformWidth: 110,
      platformHeight: 14,
      platformTopY: 285,
      platformBottomY: 450,
      basketX: 135,
      basketWidth: 110,
      basketHeight: 16,
      basketBaseYAtBottom: 360,
      basketWallWidth: 8,
      liftSpeed: 70,
    },
    hint: "箱をおもりカゴへ運べ！",
  },
  14: {
    id: 14,
    cat: { x: 110, y: 420 },
    box: null,
    balloon: null,
    goal: { left: 224, right: 318, top: 344, bottom: 369 },
    obstacles: [
      { x: 190, y: 325, width: 14, height: 55 },
      { x: 205, y: 380, width: 137, height: 18 },
    ],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    ratchetLift: {
      platformX: 50,
      platformWidth: 120,
      platformHeight: 14,
      platformStops: [325, 365, 405, 445],
      handleX: 110,
      handleY: 477,
      handleRadius: 24,
    },
    hint: "ハンドルで一段ずつ！",
  },
  15: {
    id: 15,
    cat: { x: 160, y: 475 },
    box: null,
    balloon: null,
    goal: { left: 279, right: 333, top: 348, bottom: 374 },
    obstacles: [
      { x: 58, y: 362, width: 16, height: FLOOR_Y - 362 },
      { x: 246, y: 362, width: 16, height: FLOOR_Y - 362 },
      { x: 262, y: 386, width: 80, height: FLOOR_Y - 386 },
    ],
    iceZones: [],
    springs: [],
    switches: [],
    gates: [],
    seesaws: [],
    breakableWalls: [],
    movingPlatforms: [],
    ropes: [],
    waterElevator: {
      tankX: 74,
      tankWidth: 172,
      tankBottomY: FLOOR_Y,
      platformX: 74,
      platformWidth: 172,
      platformHeight: 14,
      highWaterY: 365,
      lowWaterY: 500,
      initialWaterY: 500,
      waterSpeed: 80,
      valveX: 92,
      valveY: 460,
      valveRadius: 24,
    },
    hint: "バルブで水位を上げよう！",
  },
};

export function nextLevel(level: LevelId): LevelId | null {
  if (level === 1) return 2;
  if (level === 2) return 3;
  if (level === 3) return 4;
  if (level === 4) return 5;
  if (level === 5) return 6;
  if (level === 6) return 7;
  if (level === 7) return 8;
  if (level === 8) return 9;
  if (level === 9) return 10;
  if (level === 10) return 11;
  if (level === 11) return 12;
  if (level === 12) return 13;
  if (level === 13) return 14;
  if (level === 14) return 15;
  return null;
}

export function movingPlatformPosition(platform: MovingPlatform, time: number): Obstacle {
  const offset = Math.sin((time / platform.period) * Math.PI * 2 + platform.phase)
    * platform.distance;
  return {
    x: platform.axis === "x" ? platform.x + offset : platform.x,
    y: platform.axis === "y" ? platform.y + offset : platform.y,
    width: platform.width,
    height: platform.height,
  };
}

export function ropeEndPosition(world: PhysicsState, index: number) {
  const rope = world.ropes[index];
  if (!rope) return null;
  const angle = world.ropeAngles[index] ?? 0;
  return {
    x: rope.anchorX + Math.sin(angle) * rope.length,
    y: rope.anchorY + Math.cos(angle) * rope.length,
  };
}

export function freshPhysics(level: LevelId = 1): PhysicsState {
  const definition = LEVELS[level];
  const ratchetLift = definition.ratchetLift;
  const ratchetStage = ratchetLift ? ratchetLift.platformStops.length - 1 : 0;
  const waterElevator = definition.waterElevator;
  return {
    level,
    cat: { ...definition.cat, vx: 0, vy: 0 },
    box: definition.box ? { ...definition.box, vx: 0, vy: 0 } : null,
    balloon: definition.balloon ? { ...definition.balloon, vx: 0, vy: 0 } : null,
    balloonCleared: false,
    obstacles: definition.obstacles.map((obstacle) => ({ ...obstacle })),
    iceZones: definition.iceZones.map((zone) => ({ ...zone })),
    springs: definition.springs.map((spring) => ({ ...spring })),
    springArmed: definition.springs.map(() => true),
    switches: definition.switches.map((pressureSwitch) => ({ ...pressureSwitch })),
    switchOn: definition.switches.map(() => false),
    gates: definition.gates.map((gate) => ({ ...gate })),
    gateOpen: definition.gates.map(() => false),
    seesaws: definition.seesaws.map((seesaw) => ({ ...seesaw })),
    seesawAngles: definition.seesaws.map(() => 0),
    breakableWalls: definition.breakableWalls.map((wall) => ({ ...wall })),
    wallHealth: definition.breakableWalls.map((wall) => wall.durability),
    wallBroken: definition.breakableWalls.map(() => false),
    movingPlatforms: definition.movingPlatforms.map((platform) => ({ ...platform })),
    platformTime: 0,
    platformPositions: definition.movingPlatforms.map(
      (platform) => movingPlatformPosition(platform, 0),
    ),
    platformContacts: definition.movingPlatforms.map(() => false),
    ropes: definition.ropes.map((rope) => ({ ...rope })),
    ropeAngles: definition.ropes.map(() => 0),
    ropeAngularVelocities: definition.ropes.map(() => 0),
    ropeAttached: null,
    ropeGrabCooldown: 0,
    ropeEverGrabbed: false,
    updraftTimeRemaining: 0,
    updraftEverActivated: false,
    liftPlatformY: definition.weightedLift?.platformBottomY ?? 0,
    liftBoxLoaded: false,
    liftEverLoaded: false,
    ratchetPlatformY: ratchetLift?.platformStops[ratchetStage] ?? 0,
    ratchetStage,
    ratchetDirection: -1,
    ratchetEverActivated: false,
    waterSurfaceY: waterElevator?.initialWaterY ?? 0,
    waterPlatformY: waterElevator?.initialWaterY ?? 0,
    waterFilling: false,
    waterValveEverActivated: false,
    goalHold: 0,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function approach(value: number, target: number, amount: number) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

export function applyGroundFriction(velocityX: number, dt: number) {
  return approach(velocityX, 0, CAT_GROUND_FRICTION * dt);
}

export function applyIceFriction(velocityX: number, dt: number) {
  return approach(velocityX, 0, CAT_ICE_FRICTION * dt);
}

export function powerForDistance(distance: number) {
  return clamp(distance / MAX_AIM_DISTANCE, 0.25, 1);
}

export function sneezeVelocity(dirX: number, dirY: number, power: number) {
  return {
    vx: -dirX * (320 + 210 * power),
    vy: -dirY * (260 + 160 * power),
  };
}

function activateRatchetLift(world: PhysicsState, dirX: number, dirY: number) {
  const lift = LEVELS[world.level].ratchetLift;
  if (!lift || lift.platformStops.length < 2) return false;

  const toHandleX = lift.handleX - world.cat.x;
  const toHandleY = lift.handleY - world.cat.y;
  const handleDistance = Math.hypot(toHandleX, toHandleY);
  const coneDot = handleDistance > 0
    ? (toHandleX * dirX + toHandleY * dirY) / handleDistance
    : -1;
  if (handleDistance >= 180 || coneDot < 0.86) return false;

  const currentStage = clamp(world.ratchetStage, 0, lift.platformStops.length - 1);
  const currentPlatform = {
    x: lift.platformX,
    y: world.ratchetPlatformY,
    width: lift.platformWidth,
    height: lift.platformHeight,
  };
  const catRides = bodyStandingOnPlatform(world.cat, CAT_R, currentPlatform);
  let direction = world.ratchetDirection;
  let nextStage = currentStage + direction;
  if (nextStage < 0 || nextStage >= lift.platformStops.length) {
    direction = direction === -1 ? 1 : -1;
    nextStage = currentStage + direction;
  }

  const nextPlatformY = lift.platformStops[nextStage];
  if (nextPlatformY === undefined) return false;
  if (catRides) world.cat.y += nextPlatformY - world.ratchetPlatformY;
  world.ratchetStage = nextStage;
  world.ratchetPlatformY = nextPlatformY;
  world.ratchetDirection = nextStage === 0
    ? 1
    : nextStage === lift.platformStops.length - 1
      ? -1
      : direction;
  world.ratchetEverActivated = true;
  return true;
}

function activateWaterValve(world: PhysicsState, dirX: number, dirY: number) {
  const elevator = LEVELS[world.level].waterElevator;
  if (!elevator) return false;

  const toValveX = elevator.valveX - world.cat.x;
  const toValveY = elevator.valveY - world.cat.y;
  const distance = Math.hypot(toValveX, toValveY);
  const coneDot = distance > 0
    ? (toValveX * dirX + toValveY * dirY) / distance
    : -1;
  if (distance >= 145 || coneDot < 0.86) return false;

  world.waterFilling = !world.waterFilling;
  world.waterValveEverActivated = true;
  return true;
}

export function applySneeze(
  world: PhysicsState,
  dirX: number,
  dirY: number,
  power: number,
) {
  const velocity = sneezeVelocity(dirX, dirY, power);
  const ratchetActivated = activateRatchetLift(world, dirX, dirY);
  const waterValveActivated = activateWaterValve(world, dirX, dirY);
  const recoilScale = world.ropeAttached === null ? 1 : ROPE_SNEEZE_SCALE;
  world.cat.vx += velocity.vx * recoilScale;
  world.cat.vy += velocity.vy * recoilScale;

  let movedObject = false;
  const box = world.box;
  if (box) {
    const toBoxX = box.x - world.cat.x;
    const toBoxY = box.y - world.cat.y;
    const boxDistance = Math.hypot(toBoxX, toBoxY);
    const coneDot = boxDistance > 0
      ? (toBoxX * dirX + toBoxY * dirY) / boxDistance
      : -1;
    if (boxDistance < 155 && coneDot > 0.82) {
      box.vx += dirX * (230 + 220 * power);
      box.vy += dirY * (130 + 130 * power) - 50 * power;
      movedObject = true;
    }
  }

  const balloon = world.balloon;
  if (balloon) {
    const toBalloonX = balloon.x - world.cat.x;
    const toBalloonY = balloon.y - world.cat.y;
    const balloonDistance = Math.hypot(toBalloonX, toBalloonY);
    const coneDot = balloonDistance > 0
      ? (toBalloonX * dirX + toBalloonY * dirY) / balloonDistance
      : -1;
    if (balloonDistance < 180 && coneDot > 0.76) {
      balloon.vx += dirX * (430 + 520 * power);
      balloon.vy += dirY * (330 + 420 * power) - 120 * power;
      movedObject = true;
    }
  }

  const updraft = LEVELS[world.level].updraft;
  if (updraft) {
    const toBlowerX = updraft.blowerX - world.cat.x;
    const toBlowerY = updraft.blowerY - world.cat.y;
    const blowerDistance = Math.hypot(toBlowerX, toBlowerY);
    const coneDot = blowerDistance > 0
      ? (toBlowerX * dirX + toBlowerY * dirY) / blowerDistance
      : -1;
    if (blowerDistance < 180 && coneDot >= 0.86) {
      world.updraftTimeRemaining = updraft.duration;
      world.updraftEverActivated = true;
      movedObject = true;
    }
  }

  return movedObject || ratchetActivated || waterValveActivated;
}

function collideWithFloorAndWalls(
  body: Body,
  radius: number,
  friction: number,
  dt: number,
) {
  const onFloor = body.y >= FLOOR_Y - radius - 0.5;
  if (body.y > FLOOR_Y - radius) {
    body.y = FLOOR_Y - radius;
    if (body.vy > 0) body.vy *= -0.15;
    if (Math.abs(body.vy) < 28) body.vy = 0;
  }
  if (body.x < LEFT_WALL + radius) {
    body.x = LEFT_WALL + radius;
    if (body.vx < 0) body.vx *= -0.18;
  }
  if (body.x > RIGHT_WALL - radius) {
    body.x = RIGHT_WALL - radius;
    if (body.vx > 0) body.vx *= -0.18;
  }
  if (onFloor) body.vx = approach(body.vx, 0, friction * dt);
}

function resolveCatBox(world: PhysicsState) {
  const box = world.box;
  if (!box) return;

  const cat = world.cat;
  const nearestX = clamp(cat.x, box.x - BOX_HALF, box.x + BOX_HALF);
  const nearestY = clamp(cat.y, box.y - BOX_HALF, box.y + BOX_HALF);
  let dx = cat.x - nearestX;
  let dy = cat.y - nearestY;
  let distance = Math.hypot(dx, dy);
  if (distance >= CAT_R) return;
  if (distance < 0.001) {
    dx = cat.x < box.x ? -1 : 1;
    dy = 0;
    distance = 1;
  }
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = CAT_R - distance;
  cat.x += nx * overlap * 0.62;
  cat.y += ny * overlap * 0.62;
  box.x -= nx * overlap * 0.38;
  box.y -= ny * overlap * 0.38;
  const relative = (cat.vx - box.vx) * nx + (cat.vy - box.vy) * ny;
  if (relative < 0) {
    const impulse = -relative * 0.58;
    cat.vx += nx * impulse;
    cat.vy += ny * impulse;
    box.vx -= nx * impulse * 0.85;
    box.vy -= ny * impulse * 0.85;
  }
}

function resolveCatBalloon(world: PhysicsState) {
  const balloon = world.balloon;
  if (!balloon) return;
  const dx = world.cat.x - balloon.x;
  const dy = world.cat.y - balloon.y;
  const minDistance = CAT_R + BALLOON_R;
  const distance = Math.hypot(dx, dy);
  if (distance >= minDistance || distance < 0.001) return;
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;
  world.cat.x += nx * overlap * 0.2;
  world.cat.y += ny * overlap * 0.2;
  balloon.x -= nx * overlap * 0.8;
  balloon.y -= ny * overlap * 0.8;
  const relative = (world.cat.vx - balloon.vx) * nx + (world.cat.vy - balloon.vy) * ny;
  if (relative < 0) {
    const impulse = -relative * 0.45;
    world.cat.vx += nx * impulse * 0.25;
    world.cat.vy += ny * impulse * 0.25;
    balloon.vx -= nx * impulse * 1.5;
    balloon.vy -= ny * impulse * 1.5;
  }
}

function stepBalloon(world: PhysicsState, dt: number) {
  const balloon = world.balloon;
  if (!balloon) return;
  balloon.vy -= 26 * dt;
  balloon.vx *= Math.pow(0.97, dt * 60);
  balloon.vy *= Math.pow(0.985, dt * 60);
  balloon.x += balloon.vx * dt;
  balloon.y += balloon.vy * dt;

  const minX = LEFT_WALL + BALLOON_R;
  const maxX = RIGHT_WALL - BALLOON_R;
  const minY = 145 + BALLOON_R;
  const maxY = FLOOR_Y - BALLOON_R;
  if (balloon.x < minX) {
    balloon.x = minX;
    if (balloon.vx < 0) balloon.vx *= -0.28;
  }
  if (balloon.x > maxX) {
    balloon.x = maxX;
    if (balloon.vx > 0) balloon.vx *= -0.28;
  }
  if (balloon.y < minY) {
    balloon.y = minY;
    if (balloon.vy < 0) balloon.vy *= -0.2;
  }
  if (balloon.y > maxY) {
    balloon.y = maxY;
    if (balloon.vy > 0) balloon.vy *= -0.2;
  }
  if (balloon.x <= 100) world.balloonCleared = true;
}

function resolveBodyObstacle(body: Body, radius: number, obstacle: Obstacle) {
  const nearestX = clamp(body.x, obstacle.x, obstacle.x + obstacle.width);
  const nearestY = clamp(body.y, obstacle.y, obstacle.y + obstacle.height);
  let dx = body.x - nearestX;
  let dy = body.y - nearestY;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return false;
  if (distance < 0.001) {
    const left = Math.abs(body.x - obstacle.x);
    const right = Math.abs(obstacle.x + obstacle.width - body.x);
    dx = left < right ? -1 : 1;
    dy = 0;
  } else {
    dx /= distance;
    dy /= distance;
  }
  const overlap = radius - distance;
  body.x += dx * overlap;
  body.y += dy * overlap;
  const intoSurface = body.vx * dx + body.vy * dy;
  if (intoSurface < 0) {
    body.vx -= intoSurface * dx * 1.18;
    body.vy -= intoSurface * dy * 1.18;
  }
  return dy < -0.7;
}

function obstacleImpactSpeed(body: Body, radius: number, obstacle: Obstacle) {
  const nearestX = clamp(body.x, obstacle.x, obstacle.x + obstacle.width);
  const nearestY = clamp(body.y, obstacle.y, obstacle.y + obstacle.height);
  let dx = body.x - nearestX;
  let dy = body.y - nearestY;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return 0;
  if (distance < 0.001) {
    const left = Math.abs(body.x - obstacle.x);
    const right = Math.abs(obstacle.x + obstacle.width - body.x);
    dx = left < right ? -1 : 1;
    dy = 0;
  } else {
    dx /= distance;
    dy /= distance;
  }
  return Math.max(0, -(body.vx * dx + body.vy * dy));
}

function stepSprings(world: PhysicsState) {
  world.springs.forEach((spring, index) => {
    const touching = (
      world.cat.x >= spring.x - CAT_R * 0.35 &&
      world.cat.x <= spring.x + spring.width + CAT_R * 0.35 &&
      world.cat.y >= FLOOR_Y - CAT_R - 1
    );

    if (touching && world.springArmed[index]) {
      world.cat.y = FLOOR_Y - CAT_R - 2;
      world.cat.vy = -spring.launchVelocity;
      world.springArmed[index] = false;
    } else if (!touching) {
      world.springArmed[index] = true;
    }
  });
}

function stepSwitches(world: PhysicsState) {
  const box = world.box;
  world.switchOn = world.switches.map((pressureSwitch) => (
    box !== null &&
    box.x >= pressureSwitch.x &&
    box.x <= pressureSwitch.x + pressureSwitch.width &&
    box.y >= FLOOR_Y - BOX_HALF - 0.5 &&
    Math.hypot(box.vx, box.vy) < 28
  ));
}

function stepGates(world: PhysicsState) {
  world.gateOpen = world.gates.map(
    (gate) => world.switchOn[gate.switchIndex] === true,
  );

  world.gates.forEach((gate, index) => {
    if (world.gateOpen[index]) return;
    resolveBodyObstacle(world.cat, CAT_R, gate);
    if (world.box) resolveBodyObstacle(world.box, BOX_HALF, gate);
  });
}

function stepBreakableWalls(world: PhysicsState) {
  world.breakableWalls.forEach((wall, index) => {
    if (world.wallBroken[index]) return;

    resolveBodyObstacle(world.cat, CAT_R, wall);
    if (!world.box) return;

    const impactSpeed = obstacleImpactSpeed(world.box, BOX_HALF, wall);
    if (impactSpeed >= wall.minImpact) {
      const damage = impactSpeed - wall.minImpact + 30;
      world.wallHealth[index] = Math.max(0, world.wallHealth[index] - damage);
      if (world.wallHealth[index] <= 0) {
        world.wallBroken[index] = true;
        return;
      }
    }
    resolveBodyObstacle(world.box, BOX_HALF, wall);
  });
}

function seesawLocalPosition(body: Body, seesaw: Seesaw, angle: number) {
  const dx = body.x - seesaw.x;
  const dy = body.y - seesaw.y;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: dx * cosine + dy * sine,
    y: -dx * sine + dy * cosine,
  };
}

function isLoadingSeesaw(
  body: Body,
  radius: number,
  seesaw: Seesaw,
  angle: number,
) {
  const local = seesawLocalPosition(body, seesaw, angle);
  const surfaceY = -seesaw.thickness / 2;
  return (
    Math.abs(local.x) <= seesaw.width / 2 + radius * 0.65 &&
    local.y >= surfaceY - radius - 14 &&
    local.y <= surfaceY + radius + 12
  );
}

function resolveBodySeesaw(
  body: Body,
  radius: number,
  seesaw: Seesaw,
  angle: number,
  friction: number,
  dt: number,
) {
  const local = seesawLocalPosition(body, seesaw, angle);
  const surfaceY = -seesaw.thickness / 2;
  if (
    Math.abs(local.x) > seesaw.width / 2 + radius * 0.35 ||
    local.y + radius <= surfaceY ||
    local.y > surfaceY + radius + 16
  ) return false;

  const correctedY = surfaceY - radius;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  body.x = seesaw.x + local.x * cosine - correctedY * sine;
  body.y = seesaw.y + local.x * sine + correctedY * cosine;

  const normalX = sine;
  const normalY = -cosine;
  const intoSurface = body.vx * normalX + body.vy * normalY;
  if (intoSurface < 0) {
    body.vx -= intoSurface * normalX * 1.08;
    body.vy -= intoSurface * normalY * 1.08;
  }
  const tangentX = cosine;
  const tangentY = sine;
  const tangentSpeed = body.vx * tangentX + body.vy * tangentY;
  const slowedTangent = approach(tangentSpeed, 0, friction * dt);
  const tangentReduction = tangentSpeed - slowedTangent;
  body.vx -= tangentX * tangentReduction;
  body.vy -= tangentY * tangentReduction;
  return true;
}

function stepSeesaws(world: PhysicsState, dt: number) {
  world.seesaws.forEach((seesaw, index) => {
    const currentAngle = world.seesawAngles[index];
    let loadMoment = 0;
    if (isLoadingSeesaw(world.cat, CAT_R, seesaw, currentAngle)) {
      const local = seesawLocalPosition(world.cat, seesaw, currentAngle);
      loadMoment += local.x / (seesaw.width / 2);
    }
    if (world.box && isLoadingSeesaw(world.box, BOX_HALF, seesaw, currentAngle)) {
      const local = seesawLocalPosition(world.box, seesaw, currentAngle);
      loadMoment += (local.x / (seesaw.width / 2)) * 2;
    }

    const targetAngle = clamp(loadMoment, -1, 1) * seesaw.maxAngle;
    const angle = approach(currentAngle, targetAngle, seesaw.angularSpeed * dt);
    world.seesawAngles[index] = angle;
    resolveBodySeesaw(world.cat, CAT_R, seesaw, angle, 520, dt);
    if (world.box) resolveBodySeesaw(world.box, BOX_HALF, seesaw, angle, 80, dt);
  });
}

export function isSeesawReady(world: PhysicsState) {
  if (world.level !== 8) return true;
  const seesaw = world.seesaws[0];
  const angle = world.seesawAngles[0] ?? 0;
  return world.box !== null && angle <= -0.12 && world.box.x <= seesaw.x - 35;
}

function bodyStandingOnPlatform(body: Body, radius: number, platform: Obstacle) {
  return (
    body.vy >= -20 &&
    Math.abs(body.y + radius - platform.y) <= 3 &&
    body.x >= platform.x - radius * 0.35 &&
    body.x <= platform.x + platform.width + radius * 0.35
  );
}

function weightedLiftBasketBaseY(lift: WeightedLift, platformY: number) {
  return lift.basketBaseYAtBottom + (lift.platformBottomY - platformY);
}

function moveWeightedLiftAndCarry(world: PhysicsState, dt: number) {
  const lift = LEVELS[world.level].weightedLift;
  if (!lift) return;

  const previousPlatform = {
    x: lift.platformX,
    y: world.liftPlatformY,
    width: lift.platformWidth,
    height: lift.platformHeight,
  };
  const previousBasketBaseY = weightedLiftBasketBaseY(lift, world.liftPlatformY);
  const catRides = bodyStandingOnPlatform(world.cat, CAT_R, previousPlatform);
  const boxRides = Boolean(
    world.box &&
    world.liftBoxLoaded &&
    Math.abs(world.box.y + BOX_HALF - previousBasketBaseY) <= 4 &&
    Math.abs(world.box.vy) <= 30,
  );
  const targetY = world.liftBoxLoaded ? lift.platformTopY : lift.platformBottomY;
  world.liftPlatformY = approach(world.liftPlatformY, targetY, lift.liftSpeed * dt);

  const platformDelta = world.liftPlatformY - previousPlatform.y;
  if (catRides) world.cat.y += platformDelta;
  if (boxRides && world.box) world.box.y -= platformDelta;
}

function stepWeightedLift(world: PhysicsState, dt: number) {
  const lift = LEVELS[world.level].weightedLift;
  if (!lift) return;

  const platform = {
    x: lift.platformX,
    y: world.liftPlatformY,
    width: lift.platformWidth,
    height: lift.platformHeight,
  };
  const catOnPlatform = resolveBodyObstacle(world.cat, CAT_R, platform);
  if (catOnPlatform) world.cat.vx = approach(world.cat.vx, 0, 420 * dt);

  const box = world.box;
  if (!box) return;

  const basketBaseY = weightedLiftBasketBaseY(lift, world.liftPlatformY);
  const base = {
    x: lift.basketX,
    y: basketBaseY,
    width: lift.basketWidth,
    height: 10,
  };
  const rightWall = {
    x: lift.basketX + lift.basketWidth - lift.basketWallWidth,
    y: basketBaseY - lift.basketHeight,
    width: lift.basketWallWidth,
    height: lift.basketHeight,
  };
  resolveBodyObstacle(box, BOX_HALF, rightWall);
  const boxOnBasket = resolveBodyObstacle(box, BOX_HALF, base);
  const rightWallInnerEdge = rightWall.x - BOX_HALF;
  const insideBasket = (
    box.x >= lift.basketX + BOX_HALF &&
    box.x <= rightWallInnerEdge &&
    box.y + BOX_HALF >= basketBaseY - lift.basketHeight - 3 &&
    box.y - BOX_HALF <= basketBaseY + 3
  );

  if (world.liftBoxLoaded && !insideBasket) {
    world.liftBoxLoaded = false;
  }

  if (
    !world.liftBoxLoaded &&
    insideBasket &&
    (boxOnBasket || (box.vy >= -20 && Math.abs(box.y + BOX_HALF - basketBaseY) <= 3))
  ) {
    world.liftBoxLoaded = true;
    world.liftEverLoaded = true;
    box.x = (lift.basketX + BOX_HALF + rightWallInnerEdge) / 2;
    box.y = basketBaseY - BOX_HALF;
    box.vx = 0;
    box.vy = 0;
  }

  if (world.liftBoxLoaded && insideBasket) {
    if (box.y + BOX_HALF >= basketBaseY - 3 && box.vy > 0) {
      box.y = basketBaseY - BOX_HALF;
      box.vy = 0;
      box.vx = approach(box.vx, 0, 820 * dt);
    }
  }
}

function stepRatchetLift(world: PhysicsState, dt: number) {
  const lift = LEVELS[world.level].ratchetLift;
  if (!lift) return;

  const platform = {
    x: lift.platformX,
    y: world.ratchetPlatformY,
    width: lift.platformWidth,
    height: lift.platformHeight,
  };
  const catOnPlatform = resolveBodyObstacle(world.cat, CAT_R, platform);
  if (catOnPlatform) world.cat.vx = approach(world.cat.vx, 0, 420 * dt);
  if (world.box) resolveBodyObstacle(world.box, BOX_HALF, platform);
}

function moveWaterElevatorAndCarry(world: PhysicsState, dt: number) {
  const elevator = LEVELS[world.level].waterElevator;
  if (!elevator) return;

  const previousPlatform = {
    x: elevator.platformX,
    y: world.waterPlatformY,
    width: elevator.platformWidth,
    height: elevator.platformHeight,
  };
  const catRides = bodyStandingOnPlatform(world.cat, CAT_R, previousPlatform);
  const targetY = world.waterFilling ? elevator.highWaterY : elevator.lowWaterY;
  world.waterSurfaceY = approach(world.waterSurfaceY, targetY, elevator.waterSpeed * dt);
  world.waterPlatformY = world.waterSurfaceY;

  if (catRides) world.cat.y += world.waterPlatformY - previousPlatform.y;
}

function stepWaterElevator(world: PhysicsState, dt: number) {
  const elevator = LEVELS[world.level].waterElevator;
  if (!elevator) return;

  const platform = {
    x: elevator.platformX,
    y: world.waterPlatformY,
    width: elevator.platformWidth,
    height: elevator.platformHeight,
  };
  const catOnPlatform = resolveBodyObstacle(world.cat, CAT_R, platform);
  if (catOnPlatform) {
    world.cat.vx = applyGroundFriction(world.cat.vx, dt);
    world.cat.vy = Math.min(world.cat.vy, 0);
  }
}

function movePlatformsAndCarry(world: PhysicsState, dt: number) {
  const previousPositions = world.platformPositions;
  const catRides = previousPositions.map(
    (platform) => bodyStandingOnPlatform(world.cat, CAT_R, platform),
  );
  const boxRides = previousPositions.map(
    (platform) => world.box !== null && bodyStandingOnPlatform(world.box, BOX_HALF, platform),
  );

  world.platformTime += dt;
  world.platformPositions = world.movingPlatforms.map(
    (platform) => movingPlatformPosition(platform, world.platformTime),
  );

  world.platformPositions.forEach((platform, index) => {
    const previous = previousPositions[index];
    const dx = platform.x - previous.x;
    const dy = platform.y - previous.y;
    if (catRides[index]) {
      world.cat.x += dx;
      world.cat.y += dy;
    }
    if (boxRides[index] && world.box) {
      world.box.x += dx;
      world.box.y += dy;
    }
  });
}

function stepMovingPlatforms(world: PhysicsState, dt: number) {
  world.platformContacts = world.platformPositions.map((platform) => {
    const catOnTop = resolveBodyObstacle(world.cat, CAT_R, platform);
    if (catOnTop) world.cat.vx = approach(world.cat.vx, 0, 420 * dt);
    if (world.box) resolveBodyObstacle(world.box, BOX_HALF, platform);
    return catOnTop;
  });
}

function attachToRope(world: PhysicsState, index: number) {
  const rope = world.ropes[index];
  if (!rope) return false;

  const dx = world.cat.x - rope.anchorX;
  const dy = world.cat.y - rope.anchorY;
  const distance = Math.hypot(dx, dy);
  const angle = distance > 0.001 ? Math.atan2(dx, dy) : 0;
  const tangentX = Math.cos(angle);
  const tangentY = -Math.sin(angle);
  const tangentSpeed = (world.cat.vx * tangentX + world.cat.vy * tangentY) * 0.55;

  world.ropeAngles[index] = angle;
  world.ropeAngularVelocities[index] = tangentSpeed / rope.length;
  world.ropeAttached = index;
  world.ropeEverGrabbed = true;
  world.cat.x = rope.anchorX + Math.sin(angle) * rope.length;
  world.cat.y = rope.anchorY + Math.cos(angle) * rope.length;
  world.cat.vx = tangentX * tangentSpeed;
  world.cat.vy = tangentY * tangentSpeed;
  return true;
}

function constrainCatToRope(world: PhysicsState, index: number) {
  const rope = world.ropes[index];
  if (!rope) {
    world.ropeAttached = null;
    return;
  }

  const dx = world.cat.x - rope.anchorX;
  const dy = world.cat.y - rope.anchorY;
  const minAngle = Math.asin(clamp((LEFT_WALL + CAT_R - rope.anchorX) / rope.length, -1, 1));
  const maxAngle = Math.asin(clamp((RIGHT_WALL - CAT_R - rope.anchorX) / rope.length, -1, 1));
  const angle = clamp(Math.atan2(dx, dy), minAngle, maxAngle);
  const tangentX = Math.cos(angle);
  const tangentY = -Math.sin(angle);
  const tangentSpeed = world.cat.vx * tangentX + world.cat.vy * tangentY;

  world.ropeAngles[index] = angle;
  world.ropeAngularVelocities[index] = tangentSpeed / rope.length;
  world.cat.x = rope.anchorX + Math.sin(angle) * rope.length;
  world.cat.y = rope.anchorY + Math.cos(angle) * rope.length;
  world.cat.vx = tangentX * tangentSpeed;
  world.cat.vy = tangentY * tangentSpeed;
}

function stepRopes(world: PhysicsState, dt: number) {
  world.ropeGrabCooldown = Math.max(0, world.ropeGrabCooldown - dt);

  world.ropes.forEach((rope, index) => {
    if (world.ropeAttached === index) return;
    let angle = world.ropeAngles[index] ?? 0;
    let angularVelocity = world.ropeAngularVelocities[index] ?? 0;
    angularVelocity += -(1180 / rope.length) * Math.sin(angle) * dt;
    angularVelocity *= Math.pow(0.992, dt * 60);
    angle += angularVelocity * dt;
    world.ropeAngles[index] = angle;
    world.ropeAngularVelocities[index] = angularVelocity;
  });

  if (world.ropeAttached !== null) {
    constrainCatToRope(world, world.ropeAttached);
    return;
  }
  if (world.ropeGrabCooldown > 0) return;

  for (let index = 0; index < world.ropes.length; index += 1) {
    const rope = world.ropes[index];
    const end = ropeEndPosition(world, index);
    if (!end) continue;
    if (Math.hypot(world.cat.x - end.x, world.cat.y - end.y) <= rope.grabRadius) {
      attachToRope(world, index);
      return;
    }
  }
}

export function releaseRope(world: PhysicsState) {
  if (world.ropeAttached === null) return false;
  const index = world.ropeAttached;
  const rope = world.ropes[index];
  const angle = world.ropeAngles[index] ?? 0;
  const tangentX = Math.cos(angle);
  const tangentY = -Math.sin(angle);
  const tangentSpeed = world.cat.vx * tangentX + world.cat.vy * tangentY;
  if (rope) world.ropeAngularVelocities[index] = tangentSpeed / rope.length;
  world.ropeAttached = null;
  world.ropeGrabCooldown = 0.9;
  return true;
}

export function stepPhysics(world: PhysicsState, dt: number) {
  movePlatformsAndCarry(world, dt);
  moveWeightedLiftAndCarry(world, dt);
  moveWaterElevatorAndCarry(world, dt);
  world.updraftTimeRemaining = Math.max(0, world.updraftTimeRemaining - dt);
  const updraft = LEVELS[world.level].updraft;
  const catInUpdraft = Boolean(
    updraft &&
    world.updraftTimeRemaining > 0 &&
    world.cat.x >= updraft.x &&
    world.cat.x <= updraft.x + updraft.width &&
    world.cat.y >= updraft.y &&
    world.cat.y <= updraft.y + updraft.height
  );
  const bodies = world.box ? [world.cat, world.box] : [world.cat];
  for (const body of bodies) {
    const lift = body === world.cat && catInUpdraft && updraft
      ? updraft.liftAcceleration
      : 0;
    body.vy += (1180 - lift) * dt;
    body.vx *= Math.pow(0.99, dt * 60);
    body.vy *= Math.pow(0.997, dt * 60);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }

  if (updraft && world.cat.y < updraft.y + CAT_R) {
    world.cat.y = updraft.y + CAT_R;
    if (world.cat.vy < 0) world.cat.vy = 0;
  }

  collideWithFloorAndWalls(world.cat, CAT_R, 0, dt);
  if (world.cat.y >= FLOOR_Y - CAT_R - 0.5) {
    const onIce = world.iceZones.some(
      (zone) => world.cat.x >= zone.x && world.cat.x <= zone.x + zone.width,
    );
    world.cat.vx = onIce
      ? applyIceFriction(world.cat.vx, dt)
      : applyGroundFriction(world.cat.vx, dt);
  }

  if (world.box) {
    collideWithFloorAndWalls(world.box, BOX_HALF, 520, dt);
    resolveCatBox(world);
  }
  stepBalloon(world, dt);
  resolveCatBalloon(world);

  let catOnPlatform = false;
  for (const obstacle of world.obstacles) {
    catOnPlatform = resolveBodyObstacle(world.cat, CAT_R, obstacle) || catOnPlatform;
    if (world.box) resolveBodyObstacle(world.box, BOX_HALF, obstacle);
  }
  if (catOnPlatform) world.cat.vx = applyGroundFriction(world.cat.vx, dt);

  stepSprings(world);
  stepSwitches(world);
  stepGates(world);
  stepBreakableWalls(world);
  stepSeesaws(world, dt);
  stepMovingPlatforms(world, dt);
  stepWeightedLift(world, dt);
  stepRatchetLift(world, dt);
  stepWaterElevator(world, dt);
  stepRopes(world, dt);

  const goalUnlocked = (
    (world.level !== 5 || world.balloonCleared) &&
    (world.level !== 6 || world.switchOn.every(Boolean)) &&
    (world.level !== 9 || world.wallBroken.every(Boolean)) &&
    (world.level !== 11 || (world.ropeEverGrabbed && world.ropeAttached === null)) &&
    (world.level !== 12 || world.updraftEverActivated) &&
    (world.level !== 13 || (
      world.liftBoxLoaded &&
      world.liftPlatformY <= LEVELS[13].weightedLift!.platformTopY + 0.5
    )) &&
    (world.level !== 14 || (
      world.ratchetEverActivated &&
      world.ratchetStage === 0
    )) &&
    (world.level !== 15 || (
      world.waterValveEverActivated &&
      world.waterSurfaceY <= LEVELS[15].waterElevator!.highWaterY + 0.5
    )) &&
    isSeesawReady(world)
  );
  const restingOnCushion = goalUnlocked && isRestingOnCushion(world.cat, world.level);
  world.goalHold = restingOnCushion ? world.goalHold + dt : 0;
}

export function isRestingOnCushion(cat: Body, level: LevelId = 1) {
  const speed = Math.hypot(cat.vx, cat.vy);
  const goal = LEVELS[level].goal;
  return (
    cat.x >= goal.left &&
    cat.x <= goal.right &&
    cat.y >= goal.top &&
    cat.y <= goal.bottom &&
    speed < 42
  );
}
