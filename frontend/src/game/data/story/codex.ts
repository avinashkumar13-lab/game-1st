// =============================================================================
// CODEX / LORE ENTRIES (content data)
// -----------------------------------------------------------------------------
// Unlocked via story `codex` grants and combat encounters. Rendered in the
// Codex screen. Pure content.
// =============================================================================

export interface CodexEntry {
  id: string;
  category: "Lore" | "Bestiary" | "Equipment";
  title: string;
  body: string;
}

export const CODEX: Record<string, CodexEntry> = {
  codex_ring: {
    id: "codex_ring",
    category: "Equipment",
    title: "Father's Ring",
    body: "A band of metal that never cools. It flares gold in the presence of demons and seems to pour strength into its wearer. Your mother's final gift.",
  },
  codex_bhullok: {
    id: "codex_bhullok",
    category: "Lore",
    title: "The World of Bhullok",
    body: "A realm where gods and demons share a single sky. The gods brought the demons across for sport — a bloody entertainment that never ends. Your father once ruled here.",
  },
  codex_knife: {
    id: "codex_knife",
    category: "Equipment",
    title: "The Ancient Knife",
    body: "A blade that drinks the light around it. Hidden away behind your bedroom wall with armor and forgotten weapons. It answers your grip as if it always knew you.",
  },
  codex_bat: {
    id: "codex_bat",
    category: "Bestiary",
    title: "Bat Spawn",
    body: "Small leather-winged scouts of the dark. 20 HP. Erratic, darting flight. Two clean shots put them down. They herald something worse.",
  },
  codex_monster: {
    id: "codex_monster",
    category: "Bestiary",
    title: "Disguised Monster",
    body: "Demons that wear human skin to lure the desperate. They telegraph their strikes — block or dodge, then answer with the blade. Two knife hits ends them.",
  },
  codex_bull: {
    id: "codex_bull",
    category: "Bestiary",
    title: "Bull-Headed Behemoth",
    body: "A servant of the five who cast down the old king. 500 HP. Charges, slams and combos. Its armored body shrugs off most blows — only when staggered is the skull exposed, and a strike there bites for 50.",
  },
};
