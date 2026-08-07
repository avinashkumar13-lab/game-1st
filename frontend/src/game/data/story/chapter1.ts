// =============================================================================
// CHAPTER 1 — "The Ring of Yamraj"
// -----------------------------------------------------------------------------
// The entire chapter authored as data. Reorder / edit / extend to change the
// story without touching a single system or scene file.
// =============================================================================

import { Chapter } from "./types";

export const CHAPTER_1: Chapter = {
  id: "chapter_1",
  title: "The Ring of Yamraj",
  nodes: [
    // -- Prologue -----------------------------------------------------------
    {
      kind: "dialogue",
      id: "prologue",
      bgId: "road",
      title: "Prologue",
      lines: [
        { tone: "narrator", text: "Rain hammered the windshield. You were seven, half-asleep against the window." },
        { tone: "mother", speaker: "Mother", text: "Almost home, my love. Close your eyes." },
        { tone: "narrator", text: "Headlights. A horn that never stopped. The world turned over." },
        { tone: "narrator", text: "When the spinning ended, the car was on its roof and she was reaching for your hand." },
        { tone: "mother", speaker: "Mother", text: "Listen to me... I never told you about your father, because he was not from this world." },
        { tone: "mother", speaker: "Mother", text: "Take this ring. When the dark comes for you... it will remember." },
        { tone: "narrator", text: "Her hand went still. The sirens came too late." },
      ],
    },
    {
      kind: "grant",
      id: "grant_ring",
      items: [{ id: "ring", qty: 1 }],
      codex: ["codex_ring"],
      toast: "Received: Father's Ring",
    },
    { kind: "text", id: "twelve_years", title: "12 Years Later" },

    // -- Chapter 1 opening --------------------------------------------------
    {
      kind: "dialogue",
      id: "ch1_intro",
      bgId: "bedroom",
      title: "Chapter 1",
      lines: [
        { tone: "narrator", text: "Seventeen now. School by day, the noodle shop by night. Her things still fill the closet you never open." },
        { tone: "narrator", text: "Tonight you opened it. A small box slid out and split apart on the floor." },
        { tone: "hero", speaker: "You", text: "...The ring. I forgot she even kept this." },
        { tone: "narrator", text: "You slid it on. The metal was warm — far warmer than it should be." },
      ],
    },
    {
      kind: "dialogue",
      id: "vision",
      bgId: "void",
      lines: [
        { tone: "narrator", text: "The room fell away into a cold, endless dark." },
        { tone: "father", speaker: "???", text: "My son. So you finally wear it." },
        { tone: "father", speaker: "The Figure", text: "Five stood against me. A realm of endless night. Remember their faces." },
        { tone: "narrator", text: "Five silhouettes. A throne of bone. Then the vision shattered like glass." },
      ],
    },
    {
      kind: "dialogue",
      id: "invasion",
      bgId: "bedroom",
      lines: [
        { tone: "narrator", text: "Morning. Wrong sounds — leather wings scraping the ceiling." },
        { tone: "narrator", text: "Small bat-like things dropped from the shadows, teeth bared." },
        { tone: "narrator", text: "The ring flared gold. Something inside it woke and poured strength into your arm." },
        { tone: "father", speaker: "Father", text: "Bhullok — the world I ruled. A sky shared by gods and demons alike." },
        { tone: "father", speaker: "Father", text: "The gods dragged the demons here for sport. You are bound to that world, whether you will it or not." },
        { tone: "father", speaker: "Father", text: "They have found you. Take the pistol on the desk. Fight, my son." },
      ],
    },
    {
      kind: "grant",
      id: "grant_pistol",
      weapons: ["pistol"],
      codex: ["codex_bhullok"],
      toast: "Equipped: Old Pistol (8 rounds)",
    },

    // -- First battle: the bats --------------------------------------------
    { kind: "checkpoint", id: "cp_home", name: "Home — First Battle" },
    {
      kind: "combat",
      id: "fight_bats",
      mode: "gun",
      mapId: "home_yard",
      objective: "Defeat 3 bat spawns",
      spawns: [{ enemyId: "bat", count: 3 }],
      codex: ["codex_bat"],
    },
    {
      kind: "dialogue",
      id: "after_bats",
      bgId: "home_yard",
      lines: [
        { tone: "narrator", text: "The wings fell silent. Your hands would not stop shaking." },
        { tone: "hero", speaker: "You", text: "I need to eat something. There's still fruit on the old tree out back." },
      ],
    },
    {
      kind: "explore",
      id: "get_fruit",
      mapId: "orchard",
      objective: "Collect fruit, then return home",
      interactions: [
        {
          id: "tree",
          assetId: "prop_tree",
          label: "Fruit Tree",
          nx: 0.5,
          ny: 0.28,
          grantItem: { id: "fruit", qty: 2 },
          setFlag: "got_fruit",
          dialogue: "You shake the branch. Two fruit drop into your hands.",
        },
        {
          id: "home",
          assetId: "prop_home",
          label: "Return Home",
          nx: 0.5,
          ny: 0.85,
          requiresFlag: "got_fruit",
          lockedHint: "Grab the fruit first.",
          completesScene: true,
        },
      ],
    },
    {
      kind: "dialogue",
      id: "eat_sleep",
      bgId: "bedroom",
      lines: [
        { tone: "narrator", text: "You ate under a bruised sky and locked every window twice." },
        { tone: "narrator", text: "Sleep took you like a stone dropped down a well." },
      ],
    },
    {
      kind: "grant",
      id: "heal_sleep",
      heal: "full",
      toast: "Rested. HP fully restored.",
    },
    { kind: "checkpoint", id: "cp_night", name: "After the First Night" },

    // -- Secret passage -----------------------------------------------------
    {
      kind: "dialogue",
      id: "passage",
      bgId: "passage",
      lines: [
        { tone: "narrator", text: "A draft you had never felt before. Behind the closet, the wall simply... gave way." },
        { tone: "narrator", text: "Racks of ancient weapons. Dented armor. And a knife that seemed to drink the light around it." },
        { tone: "hero", speaker: "You", text: "This one... it feels like it's already mine." },
      ],
    },
    {
      kind: "grant",
      id: "grant_knife",
      weapons: ["ancient_knife"],
      items: [{ id: "armor", qty: 1 }],
      codex: ["codex_knife"],
      toast: "Received: Ancient Knife & Armor",
    },
    {
      kind: "dialogue",
      id: "scarce",
      bgId: "bedroom",
      lines: [
        { tone: "narrator", text: "Days bled together. The shops stayed shuttered; the cupboards ran dry." },
        { tone: "hero", speaker: "You", text: "I can't sit here and starve. There has to be food out in the woods." },
      ],
    },
    {
      kind: "explore",
      id: "search_food",
      mapId: "woods",
      objective: "Search the woods for food",
      interactions: [
        {
          id: "figures",
          assetId: "prop_fire",
          label: "A campfire ahead",
          nx: 0.5,
          ny: 0.32,
          completesScene: true,
        },
      ],
    },

    // -- Capture ------------------------------------------------------------
    {
      kind: "dialogue",
      id: "capture",
      bgId: "woods",
      lines: [
        { tone: "narrator", text: "Five travelers around a low fire. Kind faces. Open hands." },
        { tone: "enemy", speaker: "Stranger", text: "Come, come. You look half-starved, boy. Sit with us." },
        { tone: "narrator", text: "Their smiles split too wide. Skin peeled back to something grey and grinning." },
        { tone: "enemy", speaker: "Monster", text: "Fresh meat walked right into camp. Bind him — tight." },
        { tone: "narrator", text: "Ropes bit into your wrists before you could run." },
      ],
    },
    { kind: "checkpoint", id: "cp_captured", name: "Captured" },
    {
      kind: "minigame",
      id: "escape",
      variant: "escape",
      mapId: "camp",
      duration: 10,
      objective: "Break free! Tap FIRE rapidly for 10 seconds",
    },
    {
      kind: "dialogue",
      id: "broke_free",
      bgId: "camp",
      lines: [
        { tone: "narrator", text: "The ring seared white. The ropes snapped like burnt thread." },
        { tone: "enemy", speaker: "Monster", text: "It bleeds the old light! Kill it before it wakes fully!" },
        { tone: "hero", speaker: "You", text: "Come on, then. All five of you." },
      ],
    },
    { kind: "checkpoint", id: "cp_ambush", name: "The Ambush" },
    {
      kind: "melee",
      id: "fight_monsters",
      mapId: "camp",
      objective: "Defeat all 5 monsters",
      spawns: [{ enemyId: "monster_human", count: 5 }],
      codex: ["codex_monster"],
    },
    {
      kind: "dialogue",
      id: "found_food",
      bgId: "camp",
      lines: [
        { tone: "narrator", text: "The last of them dissolved into ash and a smell like burnt hair." },
        { tone: "narrator", text: "You found their stores — dried meat, roots, water. Enough to live." },
        { tone: "hero", speaker: "You", text: "Finally. Just give me one minute to breathe." },
      ],
    },
    {
      kind: "grant",
      id: "heal_food",
      items: [{ id: "rations", qty: 2 }],
      heal: "full",
      toast: "Found rations. HP fully restored.",
    },
    { kind: "checkpoint", id: "cp_boss", name: "Before the Beast" },

    // -- Boss ---------------------------------------------------------------
    {
      kind: "dialogue",
      id: "boss_intro",
      bgId: "arena",
      lines: [
        { tone: "narrator", text: "The ground shook mid-bite. Trees folded aside like reeds." },
        { tone: "narrator", text: "A mountain of muscle stepped through — a bull's skull for a face, eyes like buried coals." },
        { tone: "boss", speaker: "Bull-Headed Behemoth", text: "That ring. That KNIFE. You reek of the old king." },
        { tone: "boss", speaker: "Bull-Headed Behemoth", text: "I'll grind you into the same dirt he left you in." },
      ],
    },
    {
      kind: "boss",
      id: "fight_boss",
      mapId: "arena",
      objective: "Defeat the Bull-Headed Behemoth",
      bossId: "bull_boss",
      codex: ["codex_bull"],
    },

    // -- Ending -------------------------------------------------------------
    {
      kind: "dialogue",
      id: "boss_end",
      bgId: "arena",
      lines: [
        { tone: "narrator", text: "The behemoth crashed to one knee, breath dragging like a bellows." },
        { tone: "boss", speaker: "Bull-Headed Behemoth", text: "Wait... that blade in your hand..." },
        { tone: "boss", speaker: "Bull-Headed Behemoth", text: "That weapon belonged to your father. To Yamraj." },
        { tone: "narrator", text: "The name landed heavier than any blow the beast had thrown." },
      ],
    },
    { kind: "end", id: "chapter_complete", title: "Chapter 1 Complete", subtitle: "The Ring of Yamraj" },
  ],
};
