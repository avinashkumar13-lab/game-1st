// =============================================================================
// COMBAT SYSTEM HELPERS  (pure logic, no React)
// -----------------------------------------------------------------------------
// Reusable resolution helpers shared by every combat scene. Scenes own their
// per-frame loops; these functions answer "did it hit / how much damage".
// =============================================================================

import { WeaponDef } from "../data/weapons";
import { angleDiff, angleTo, dist } from "./vector";

export type HitZone = "leg" | "body" | "head";

// Is a target within a melee arc in front of the attacker?
export function inMeleeArc(
  ax: number,
  ay: number,
  facing: number,
  tx: number,
  ty: number,
  range: number,
  halfArc: number = Math.PI / 2, // 90° each side by default = generous
): boolean {
  const d = dist(ax, ay, tx, ty);
  if (d > range) return false;
  const a = angleTo(ax, ay, tx, ty);
  return Math.abs(angleDiff(a, facing)) <= halfArc;
}

export function meleeDamage(weapon: WeaponDef, heavy: boolean): number {
  if (heavy) return weapon.heavyDamage ?? weapon.lightDamage ?? 10;
  return weapon.lightDamage ?? 10;
}

// Find nearest target within lock range (auto-lock targeting).
export function acquireLock(
  ax: number,
  ay: number,
  targets: { id: string; x: number; y: number; hp: number }[],
  range: number,
): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    if (t.hp <= 0) continue;
    const d = dist(ax, ay, t.x, t.y);
    if (d <= range && d < bestD) {
      bestD = d;
      best = t.id;
    }
  }
  return best;
}

// Damage taken by the player from an enemy hit, considering block state.
export function damageAfterBlock(raw: number, blocking: boolean, blockValue: number): number {
  return blocking ? blockValue : raw;
}
