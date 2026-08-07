// =============================================================================
// SKILL TREE SCAFFOLD (future progression support)
// -----------------------------------------------------------------------------
// Data-only definition of a branching skill tree. The reducer already tracks
// `xp`, `level`, `skillPoints`, and `unlockedSkills`, so wiring a full skill UI
// later requires no engine changes — just render these nodes + call UNLOCK_SKILL.
// =============================================================================

export type SkillBranch = "gun" | "blade" | "body";

export interface SkillDef {
  id: string;
  branch: SkillBranch;
  name: string;
  description: string;
  cost: number;
  requires?: string[]; // prerequisite skill ids
}

export const SKILLS: Record<string, SkillDef> = {
  steady_aim: {
    id: "steady_aim",
    branch: "gun",
    name: "Steady Aim",
    description: "Auto-lock range +25%.",
    cost: 1,
  },
  quick_hands: {
    id: "quick_hands",
    branch: "gun",
    name: "Quick Hands",
    description: "Faster fire rate.",
    cost: 1,
    requires: ["steady_aim"],
  },
  keen_edge: {
    id: "keen_edge",
    branch: "blade",
    name: "Keen Edge",
    description: "Light attack damage +5.",
    cost: 1,
  },
  perfect_parry: {
    id: "perfect_parry",
    branch: "blade",
    name: "Perfect Parry",
    description: "Wider counter window.",
    cost: 1,
    requires: ["keen_edge"],
  },
  iron_lungs: {
    id: "iron_lungs",
    branch: "body",
    name: "Iron Lungs",
    description: "Max HP +25.",
    cost: 1,
  },
  cat_reflex: {
    id: "cat_reflex",
    branch: "body",
    name: "Cat Reflex",
    description: "Longer dodge i-frames.",
    cost: 1,
    requires: ["iron_lungs"],
  },
};

export const XP_PER_LEVEL = 100;
