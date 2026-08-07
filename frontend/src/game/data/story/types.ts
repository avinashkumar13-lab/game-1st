// =============================================================================
// STORY SCRIPTING TYPES
// -----------------------------------------------------------------------------
// A chapter is an ordered list of StoryNodes. The GameHost walks the list; each
// node's `kind` picks a scene/handler. This is the "story quest + dialogue +
// trigger" engine — adding chapters/quests = adding node arrays. No new code.
// =============================================================================

export interface DialogueLine {
  speaker?: string;
  text: string;
  tone?: "narrator" | "hero" | "mother" | "father" | "enemy" | "boss";
}

export interface ExploreInteraction {
  id: string;
  assetId: string;
  label: string;
  nx: number;
  ny: number;
  grantItem?: { id: string; qty: number };
  setFlag?: string;
  requiresFlag?: string; // can't trigger until this flag is set
  lockedHint?: string;
  dialogue?: string; // one-liner shown on interact
  completesScene?: boolean; // triggering this ends the explore beat
}

export interface GrantPayload {
  weapons?: string[];
  items?: { id: string; qty: number }[];
  flags?: string[];
  codex?: string[];
  heal?: number | "full";
  toast?: string;
}

export type StoryNode =
  | { kind: "text"; id: string; title: string; subtitle?: string }
  | {
      kind: "dialogue";
      id: string;
      bgId: string;
      title?: string;
      lines: DialogueLine[];
    }
  | { kind: "checkpoint"; id: string; name: string }
  | ({ kind: "grant"; id: string } & GrantPayload)
  | {
      kind: "combat";
      id: string;
      mode: "gun";
      mapId: string;
      objective: string;
      spawns: { enemyId: string; count: number }[];
      codex?: string[];
    }
  | {
      kind: "melee";
      id: string;
      mapId: string;
      objective: string;
      spawns: { enemyId: string; count: number }[];
      codex?: string[];
    }
  | {
      kind: "boss";
      id: string;
      mapId: string;
      objective: string;
      bossId: string;
      codex?: string[];
    }
  | {
      kind: "minigame";
      id: string;
      variant: "escape";
      mapId: string;
      duration: number;
      objective: string;
    }
  | {
      kind: "explore";
      id: string;
      mapId: string;
      objective: string;
      interactions: ExploreInteraction[];
    }
  | { kind: "end"; id: string; title: string; subtitle?: string };

export interface Chapter {
  id: string;
  title: string;
  nodes: StoryNode[];
}
