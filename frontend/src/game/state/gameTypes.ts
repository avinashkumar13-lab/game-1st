// =============================================================================
// GAME STATE TYPES + REDUCER  (session state; persisted at checkpoints)
// =============================================================================

import { ITEMS } from "../data/items";
import { SKILLS, XP_PER_LEVEL } from "../data/skills";
import { WEAPONS } from "../data/weapons";

export interface WeaponInstance {
  id: string;
  ammo: number | null; // null for melee weapons
}

export interface InvEntry {
  id: string;
  qty: number;
}

export interface GameState {
  player: {
    hp: number;
    maxHp: number;
    xp: number;
    level: number;
    skillPoints: number;
    unlockedSkills: string[];
  };
  weapons: WeaponInstance[];
  equippedWeaponId: string | null;
  inventory: InvEntry[];
  storyIndex: number;
  checkpointIndex: number;
  checkpointName: string;
  flags: Record<string, boolean>;
  codex: string[];
  stats: {
    batsKilled: number;
    monstersKilled: number;
    deaths: number;
    bossDefeated: boolean;
  };
  chapterComplete: boolean;
}

export const INITIAL_STATE: GameState = {
  player: { hp: 100, maxHp: 100, xp: 0, level: 1, skillPoints: 0, unlockedSkills: [] },
  weapons: [],
  equippedWeaponId: null,
  inventory: [],
  storyIndex: 0,
  checkpointIndex: 0,
  checkpointName: "Prologue",
  flags: {},
  codex: [],
  stats: { batsKilled: 0, monstersKilled: 0, deaths: 0, bossDefeated: false },
  chapterComplete: false,
};

export type GameAction =
  | { type: "RESET" }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "ADVANCE" }
  | { type: "GOTO"; index: number }
  | { type: "SET_CHECKPOINT"; index: number; name: string }
  | { type: "RESPAWN" }
  | {
      type: "GRANT";
      weapons?: string[];
      items?: { id: string; qty: number }[];
      flags?: string[];
      codex?: string[];
      heal?: number | "full";
    }
  | { type: "SET_PLAYER_HP"; hp: number }
  | { type: "HEAL"; amount: number }
  | { type: "USE_ITEM"; itemId: string }
  | { type: "EQUIP_WEAPON"; weaponId: string }
  | { type: "SET_AMMO"; weaponId: string; ammo: number }
  | { type: "ADD_KILL"; kind: "bat" | "monster" }
  | { type: "SET_BOSS_DEFEATED" }
  | { type: "GAIN_XP"; amount: number }
  | { type: "UNLOCK_SKILL"; skillId: string }
  | { type: "UNLOCK_CODEX"; ids: string[] }
  | { type: "CHAPTER_COMPLETE" };

function mergeCodex(existing: string[], add?: string[]): string[] {
  if (!add?.length) return existing;
  const set = new Set(existing);
  add.forEach((id) => set.add(id));
  return Array.from(set);
}

function applyXp(player: GameState["player"], amount: number): GameState["player"] {
  let xp = player.xp + amount;
  let level = player.level;
  let skillPoints = player.skillPoints;
  let maxHp = player.maxHp;
  while (xp >= level * XP_PER_LEVEL) {
    xp -= level * XP_PER_LEVEL;
    level += 1;
    skillPoints += 1;
    maxHp += 10; // gentle growth
  }
  return { ...player, xp, level, skillPoints, maxHp };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return { ...INITIAL_STATE, player: { ...INITIAL_STATE.player }, weapons: [], inventory: [], flags: {}, codex: [], stats: { ...INITIAL_STATE.stats } };

    case "LOAD_STATE":
      return action.state;

    case "ADVANCE":
      return { ...state, storyIndex: state.storyIndex + 1 };

    case "GOTO":
      return { ...state, storyIndex: action.index };

    case "SET_CHECKPOINT":
      return { ...state, checkpointIndex: action.index, checkpointName: action.name };

    case "RESPAWN": {
      const weapons = state.weapons.map((w) => {
        const def = WEAPONS[w.id];
        return def?.type === "gun" ? { ...w, ammo: def.magazine ?? w.ammo } : { ...w };
      });
      return {
        ...state,
        storyIndex: state.checkpointIndex,
        player: { ...state.player, hp: state.player.maxHp },
        weapons,
        stats: { ...state.stats, deaths: state.stats.deaths + 1 },
      };
    }

    case "GRANT": {
      let weapons = state.weapons.map((w) => ({ ...w }));
      let equippedWeaponId = state.equippedWeaponId;
      (action.weapons ?? []).forEach((wid) => {
        if (!weapons.find((w) => w.id === wid)) {
          const def = WEAPONS[wid];
          weapons.push({ id: wid, ammo: def?.type === "gun" ? def.magazine ?? 0 : null });
          if (!equippedWeaponId) equippedWeaponId = wid;
        }
      });

      const inventory = state.inventory.map((i) => ({ ...i }));
      (action.items ?? []).forEach((it) => {
        const ex = inventory.find((i) => i.id === it.id);
        if (ex) ex.qty += it.qty;
        else inventory.push({ ...it });
      });

      const flags = { ...state.flags };
      (action.flags ?? []).forEach((f) => (flags[f] = true));

      let hp = state.player.hp;
      if (action.heal === "full") hp = state.player.maxHp;
      else if (typeof action.heal === "number") hp = Math.min(state.player.maxHp, hp + action.heal);

      return {
        ...state,
        weapons,
        equippedWeaponId,
        inventory,
        flags,
        codex: mergeCodex(state.codex, action.codex),
        player: { ...state.player, hp },
      };
    }

    case "SET_PLAYER_HP":
      return { ...state, player: { ...state.player, hp: Math.max(0, Math.min(state.player.maxHp, action.hp)) } };

    case "HEAL":
      return { ...state, player: { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + action.amount) } };

    case "USE_ITEM": {
      const def = ITEMS[action.itemId];
      if (!def) return state;
      const inventory = state.inventory
        .map((i) => (i.id === action.itemId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0);
      let hp = state.player.hp;
      if (def.type === "food" && def.heal) {
        hp = def.heal === -1 ? state.player.maxHp : Math.min(state.player.maxHp, hp + def.heal);
      }
      return { ...state, inventory, player: { ...state.player, hp } };
    }

    case "EQUIP_WEAPON":
      return { ...state, equippedWeaponId: action.weaponId };

    case "SET_AMMO":
      return {
        ...state,
        weapons: state.weapons.map((w) => (w.id === action.weaponId ? { ...w, ammo: action.ammo } : w)),
      };

    case "ADD_KILL":
      return {
        ...state,
        stats: {
          ...state.stats,
          batsKilled: state.stats.batsKilled + (action.kind === "bat" ? 1 : 0),
          monstersKilled: state.stats.monstersKilled + (action.kind === "monster" ? 1 : 0),
        },
      };

    case "SET_BOSS_DEFEATED":
      return { ...state, stats: { ...state.stats, bossDefeated: true } };

    case "GAIN_XP":
      return { ...state, player: applyXp(state.player, action.amount) };

    case "UNLOCK_SKILL": {
      const def = SKILLS[action.skillId];
      if (!def || state.player.unlockedSkills.includes(action.skillId)) return state;
      if (state.player.skillPoints < def.cost) return state;
      const reqOk = (def.requires ?? []).every((r) => state.player.unlockedSkills.includes(r));
      if (!reqOk) return state;
      let maxHp = state.player.maxHp;
      if (action.skillId === "iron_lungs") maxHp += 25;
      return {
        ...state,
        player: {
          ...state.player,
          maxHp,
          skillPoints: state.player.skillPoints - def.cost,
          unlockedSkills: [...state.player.unlockedSkills, action.skillId],
        },
      };
    }

    case "UNLOCK_CODEX":
      return { ...state, codex: mergeCodex(state.codex, action.ids) };

    case "CHAPTER_COMPLETE":
      return { ...state, chapterComplete: true };

    default:
      return state;
  }
}
