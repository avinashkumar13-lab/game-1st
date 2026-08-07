// =============================================================================
// ASSET REGISTRY  —  *** THE SINGLE SWAP POINT FOR ALL VISUALS ***
// -----------------------------------------------------------------------------
// Every character, enemy, weapon, item, prop and tile the game can render is
// described here as a lightweight "placeholder" descriptor (shape + color +
// optional vector icon + label).
//
// To ship real art later you ONLY touch this file + Sprite.tsx:
//   1. Add an `image` / `sprite` field to a PlaceholderAsset entry below.
//   2. Teach Sprite.tsx to prefer `image` over the shape/color fallback.
// No gameplay / scene / system code references colors or shapes directly — they
// only reference asset IDs. That keeps logic and presentation fully decoupled.
// =============================================================================

import { theme } from "../config/theme";

export type IconFamily = "ion" | "mci";
export type ShapeKind = "circle" | "square" | "diamond";

export interface PlaceholderAsset {
  id: string;
  label: string; // short text drawn on the placeholder (e.g. "BAT")
  color: string;
  accent: string; // border / outline color
  shape: ShapeKind;
  icon?: string;
  iconFamily?: IconFamily;
  // FUTURE: `image?: ImageSourcePropType` / `sprite?: SpriteSheetRef`
}

const c = theme.colors;

export const AssetRegistry: Record<string, PlaceholderAsset> = {
  // --- Characters ---
  char_player: {
    id: "char_player",
    label: "",
    color: c.player,
    accent: "#BEE3FF",
    shape: "circle",
    icon: "person",
    iconFamily: "ion",
  },

  // --- Enemies ---
  enm_bat: {
    id: "enm_bat",
    label: "",
    color: c.bat,
    accent: "#C4B5FD",
    shape: "diamond",
    icon: "bug",
    iconFamily: "ion",
  },
  enm_monster: {
    id: "enm_monster",
    label: "M",
    color: c.monster,
    accent: "#FBC7A4",
    shape: "square",
  },
  enm_bull: {
    id: "enm_bull",
    label: "BULL",
    color: c.bull,
    accent: "#F1A6AF",
    shape: "square",
    icon: "skull",
    iconFamily: "ion",
  },

  // --- Weapons ---
  wpn_pistol: {
    id: "wpn_pistol",
    label: "Pistol",
    color: "#2C3E57",
    accent: c.ammo,
    shape: "square",
    icon: "pistol",
    iconFamily: "mci",
  },
  wpn_knife: {
    id: "wpn_knife",
    label: "Knife",
    color: "#3A2C57",
    accent: c.primary,
    shape: "square",
    icon: "knife",
    iconFamily: "mci",
  },

  // --- Items ---
  itm_ring: {
    id: "itm_ring",
    label: "Ring",
    color: "#3A2C1A",
    accent: c.primary,
    shape: "circle",
    icon: "ring",
    iconFamily: "mci",
  },
  itm_fruit: {
    id: "itm_fruit",
    label: "Fruit",
    color: "#2E4A2E",
    accent: c.success,
    shape: "circle",
    icon: "food-apple",
    iconFamily: "mci",
  },
  itm_food: {
    id: "itm_food",
    label: "Food",
    color: "#4A3A22",
    accent: c.warn,
    shape: "square",
    icon: "food-drumstick",
    iconFamily: "mci",
  },
  itm_armor: {
    id: "itm_armor",
    label: "Armor",
    color: "#2C3540",
    accent: c.ammo,
    shape: "square",
    icon: "shield-half-full",
    iconFamily: "mci",
  },

  // --- Props / world objects ---
  prop_tree: {
    id: "prop_tree",
    label: "",
    color: c.prop,
    accent: "#7CBF8E",
    shape: "circle",
    icon: "pine-tree",
    iconFamily: "mci",
  },
  prop_home: {
    id: "prop_home",
    label: "",
    color: "#3A3357",
    accent: c.primary,
    shape: "square",
    icon: "home",
    iconFamily: "ion",
  },
  prop_fire: {
    id: "prop_fire",
    label: "",
    color: "#4A2C1A",
    accent: c.warn,
    shape: "circle",
    icon: "flame",
    iconFamily: "ion",
  },
  prop_rock: {
    id: "prop_rock",
    label: "",
    color: "#3A3548",
    accent: "#565070",
    shape: "diamond",
  },
  prop_figure: {
    id: "prop_figure",
    label: "?",
    color: "#2E2A40",
    accent: c.danger,
    shape: "circle",
    icon: "help",
    iconFamily: "ion",
  },
};

export function getAsset(id: string): PlaceholderAsset {
  return (
    AssetRegistry[id] ?? {
      id,
      label: "?",
      color: theme.colors.neutral,
      accent: theme.colors.border,
      shape: "square",
    }
  );
}
