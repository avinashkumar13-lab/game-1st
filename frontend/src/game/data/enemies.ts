// =============================================================================
// ENEMY & BOSS DEFINITIONS (content data)
// -----------------------------------------------------------------------------
// Stats only. AI behaviour is selected by the `behavior` tag and implemented in
// scene update loops / systems, so you can retune difficulty here alone.
// =============================================================================

export type EnemyBehavior = "bat" | "melee" | "boss";

export interface EnemyDef {
  id: string;
  name: string;
  assetId: string;
  maxHp: number;
  contactDamage: number; // damage dealt to player on a landed hit
  speed: number; // px/sec
  size: number; // px diameter
  behavior: EnemyBehavior;
  xp: number;
  codexId?: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  bat: {
    id: "bat",
    name: "Bat Spawn",
    assetId: "enm_bat",
    maxHp: 20, // 2 pistol shots (10 dmg each)
    contactDamage: 10,
    speed: 78,
    size: 34,
    behavior: "bat",
    xp: 15,
    codexId: "codex_bat",
  },
  monster_human: {
    id: "monster_human",
    name: "Disguised Monster",
    assetId: "enm_monster",
    maxHp: 20, // 2 light knife hits (10 dmg each)
    contactDamage: 16,
    speed: 66,
    size: 46,
    behavior: "melee",
    xp: 30,
    codexId: "codex_monster",
  },
  bull_boss: {
    id: "bull_boss",
    name: "Bull-Headed Behemoth",
    assetId: "enm_bull",
    maxHp: 500,
    contactDamage: 20, // blocked = 5 (handled in boss scene)
    speed: 150,
    size: 104,
    behavior: "boss",
    xp: 300,
    codexId: "codex_bull",
  },
};

// Boss weak-spot damage table (leg / body / head). Head only reachable while
// the boss is staggered / recovering (see BossScene).
export const BOSS_HIT_ZONES = {
  leg: 10,
  body: 10,
  head: 50,
} as const;
