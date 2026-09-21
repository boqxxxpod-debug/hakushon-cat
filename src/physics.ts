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

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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
    hint: "箱を加速して壁を壊せ！",
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
  return null;
}

export function freshPhysics(level: LevelId = 1): PhysicsState {
  const definition = LEVELS[level];
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

export function applySneeze(
  world: PhysicsState,
  dirX: number,
  dirY: number,
  power: number,
) {
  const velocity = sneezeVelocity(dirX, dirY, power);
  world.cat.vx += velocity.vx;
  world.cat.vy += velocity.vy;

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

  return movedObject;
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

export function stepPhysics(world: PhysicsState, dt: number) {
  const bodies = world.box ? [world.cat, world.box] : [world.cat];
  for (const body of bodies) {
    body.vy += 1180 * dt;
    body.vx *= Math.pow(0.99, dt * 60);
    body.vy *= Math.pow(0.997, dt * 60);
    body.x += body.vx * dt;
    body.y += body.vy * dt;
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

  const goalUnlocked = (
    (world.level !== 5 || world.balloonCleared) &&
    (world.level !== 6 || world.switchOn.every(Boolean)) &&
    (world.level !== 9 || world.wallBroken.every(Boolean)) &&
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
