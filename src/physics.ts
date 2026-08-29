export const WORLD_W = 360;
export const WORLD_H = 640;
export const FLOOR_Y = 545;
export const LEFT_WALL = 18;
export const RIGHT_WALL = 342;
export const CAT_R = 25;
export const BOX_HALF = 21;
export const MAX_AIM_DISTANCE = 120;

export type PlayStatus = "playing" | "won" | "failed";

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type PhysicsState = {
  cat: Body;
  box: Body;
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

export function freshPhysics(): PhysicsState {
  return {
    cat: { x: 225, y: FLOOR_Y - CAT_R, vx: 0, vy: 0 },
    box: { x: 292, y: FLOOR_Y - BOX_HALF, vx: 0, vy: 0 },
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

export function isRestingOnCushion(cat: Body) {
  const speed = Math.hypot(cat.vx, cat.vy);
  return (
    cat.x >= 43 &&
    cat.x <= 143 &&
    cat.y >= 486 &&
    cat.y <= 522 &&
    speed < 42
  );
}
