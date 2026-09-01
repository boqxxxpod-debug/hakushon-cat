export const WORLD_W = 360;
export const WORLD_H = 640;
export const FLOOR_Y = 545;
export const LEFT_WALL = 18;
export const RIGHT_WALL = 342;
export const CAT_R = 25;
export const BOX_HALF = 21;
export const MAX_AIM_DISTANCE = 120;
export const CAT_GROUND_FRICTION = 1500;

export type LevelId = 1 | 2;

export type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LevelDefinition = {
  id: LevelId;
  cat: Pick<Body, "x" | "y">;
  box: Pick<Body, "x" | "y"> | null;
  goal: { left: number; right: number; top: number; bottom: number };
  obstacles: Obstacle[];
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
  obstacles: Obstacle[];
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
    cat: { x: 225, y: FLOOR_Y - CAT_R },
    box: { x: 292, y: FLOOR_Y - BOX_HALF },
    goal: { left: 43, right: 143, top: 486, bottom: 522 },
    obstacles: [],
    hint: "右へ くしゃみ！",
  },
  2: {
    id: 2,
    cat: { x: 82, y: FLOOR_Y - CAT_R },
    box: null,
    goal: { left: 218, right: 333, top: 486, bottom: 522 },
    obstacles: [{ x: 185, y: FLOOR_Y - 30, width: 24, height: 30 }],
    hint: "左下へ長くドラッグ！",
  },
};

export function nextLevel(level: LevelId): LevelId | null {
  return level === 1 ? 2 : null;
}

export function freshPhysics(level: LevelId = 1): PhysicsState {
  const definition = LEVELS[level];
  return {
    level,
    cat: { ...definition.cat, vx: 0, vy: 0 },
    box: definition.box ? { ...definition.box, vx: 0, vy: 0 } : null,
    obstacles: definition.obstacles.map((obstacle) => ({ ...obstacle })),
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

export function powerForDistance(distance: number) {
  return clamp(distance / MAX_AIM_DISTANCE, 0.25, 1);
}

export function sneezeVelocity(dirX: number, dirY: number, power: number) {
  return {
    vx: -dirX * (320 + 210 * power),
    vy: -dirY * (260 + 160 * power),
  };
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

function resolveBodyObstacle(body: Body, radius: number, obstacle: Obstacle) {
  const nearestX = clamp(body.x, obstacle.x, obstacle.x + obstacle.width);
  const nearestY = clamp(body.y, obstacle.y, obstacle.y + obstacle.height);
  let dx = body.x - nearestX;
  let dy = body.y - nearestY;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return;
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
    world.cat.vx = applyGroundFriction(world.cat.vx, dt);
  }

  if (world.box) {
    collideWithFloorAndWalls(world.box, BOX_HALF, 520, dt);
    resolveCatBox(world);
  }

  for (const obstacle of world.obstacles) {
    resolveBodyObstacle(world.cat, CAT_R, obstacle);
    if (world.box) resolveBodyObstacle(world.box, BOX_HALF, obstacle);
  }

  const restingOnCushion = isRestingOnCushion(world.cat, world.level);
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
