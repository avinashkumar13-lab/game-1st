// =============================================================================
// ITEM DEFINITIONS (content data)
// =============================================================================

export type ItemType = "food" | "quest" | "armor" | "ring";

export interface ItemDef {
  id: string;
  name: string;
  assetId: string;
  type: ItemType;
  description: string;
  heal?: number; // for food; special value -1 means "full heal"
  usable?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  ring: {
    id: "ring",
    name: "Father's Ring",
    assetId: "itm_ring",
    type: "ring",
    description: "A warm band of unknown metal. It answers when the dark comes.",
    usable: false,
  },
  fruit: {
    id: "fruit",
    name: "Tree Fruit",
    assetId: "itm_fruit",
    type: "food",
    description: "Bruised but edible. Restores 40 HP.",
    heal: 40,
    usable: true,
  },
  rations: {
    id: "rations",
    name: "Scavenged Rations",
    assetId: "itm_food",
    type: "food",
    description: "Dried meat and roots. Restores 60 HP.",
    heal: 60,
    usable: true,
  },
  armor: {
    id: "armor",
    name: "Ancient Armor",
    assetId: "itm_armor",
    type: "armor",
    description: "Dented plate from a forgotten war. Feels protective.",
    usable: false,
  },
};
