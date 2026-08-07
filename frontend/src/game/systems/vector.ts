// =============================================================================
// VECTOR / MATH HELPERS  (pure, no React)
// =============================================================================

export interface Vec {
  x: number;
  y: number;
}

export const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(ax - bx, ay - by);

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function normalize(x: number, y: number): Vec {
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
}

// Angle in radians from (ax,ay) -> (bx,by)
export const angleTo = (ax: number, ay: number, bx: number, by: number): number =>
  Math.atan2(by - ay, bx - ax);

// Smallest signed difference between two angles (radians)
export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const randInt = (min: number, max: number): number =>
  Math.floor(rand(min, max + 1));
