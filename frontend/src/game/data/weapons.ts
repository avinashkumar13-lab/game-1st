// =============================================================================
// WEAPON DEFINITIONS (content data — swap/extend freely)
// -----------------------------------------------------------------------------
// Pure data. Combat systems read numbers from here; they never hardcode stats.
// Add a new weapon = add an entry. No logic change required.
// =============================================================================

export type WeaponType = "gun" | "melee";

export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  assetId: string;
  description: string;

  // gun
  magazine?: number;
  bulletDamage?: number;
  lockRange?: number; // px radius within which auto-lock engages
  fireCooldown?: number; // seconds between shots

  // melee
  lightDamage?: number;
  heavyDamage?: number;
  range?: number; // px reach
  lightCooldown?: number;
  heavyCooldown?: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: {
    id: "pistol",
    name: "Old Pistol",
    type: "gun",
    assetId: "wpn_pistol",
    description: "8-round sidearm. Auto-locks onto the nearest close threat.",
    magazine: 8,
    bulletDamage: 10,
    lockRange: 240,
    fireCooldown: 0.32,
  },
  ancient_knife: {
    id: "ancient_knife",
    name: "Ancient Knife",
    type: "melee",
    assetId: "wpn_knife",
    description: "A blade that drinks the light. Light & heavy strikes.",
    lightDamage: 10,
    heavyDamage: 25,
    range: 74,
    lightCooldown: 0.34,
    heavyCooldown: 0.7,
  },
};
