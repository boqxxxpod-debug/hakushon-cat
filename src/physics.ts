export const WORLD_W = 360;
export const WORLD_H = 640;
export const FLOOR_Y = 545;
export const LEFT_WALL = 18;
export const RIGHT_WALL = 342;
export const CAT_R = 25;
export const BOX_HALF = 21;
export const MAX_AIM_DISTANCE = 120;

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
  box: Pick<Body, "x" | "y">;
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
  box: Body;
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
    box: { x: 148, y: FLOOR_Y - BOX_HALF },
    goal: { left: 245, right: 333, top: 486, bottom: 522 },
    obstacles: [{ x: 194, y: FLOOR_Y - 106, width: 34, height: 106 }],
    hint: "箱を動かし 壁をこえよう！",
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
    box: { ...definition.box, vx: 0, vy: 0 },
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

export function powerForDistance(distance: number) {
  return clamp(distance / MAX_AIM_DISTANCE, 0.25, 1);
}

export function sneezeVelocity(dirX: number, dirY: number, power: number) {
  return {
    vx: -dirX * (320 + 210 * power),
    vy: -dirY * (260 + 160 * power),
  };
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
