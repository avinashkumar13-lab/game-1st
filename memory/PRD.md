# PRD — BHULLOK (Chapter 1): Story-Driven Action RPG Framework

## Original Problem Statement
Build a third-person action RPG inspired by Assassin's Creed Unity (exploration/combat) and
Black Myth: Wukong (boss fights). Focus on **gameplay systems, not graphics**. Every visual
asset (characters, animations, enemies, weapons, maps, buildings, terrain, UI, SFX, music) must
be **modular and replaceable** without touching gameplay code. Placeholders for all visuals.
Full Chapter 1 story (prologue crash → ring → bats → fruit → secret passage → capture → escape
→ knife fight → bull boss → "Yamraj" reveal). Systems required: story quests, dialogue,
checkpoints, save/load, inventory, weapons, enemy AI, boss AI, health, damage, combos, dodge,
block, auto-lock targeting, future skill tree, future multiplayer, future map expansion.

## Platform / Architecture
- **Expo (SDK 54) + React Native** mobile app. 2D **top-down** rendering with placeholder shapes
  (Expo Go / real-device friendly; no native 3D engine).
- **Offline / local**: progress saved on-device via storage util. No backend, no auth, no API keys.
- Custom `requestAnimationFrame` game loop (`useGameLoop`) + mutable world refs + per-frame render tick.

### Decoupling (the core requirement)
- `src/game/assets/registry.ts` — **single visual swap point**. Every entity references an asset ID;
  the registry maps IDs → placeholder descriptors (shape/color/icon/label). Swap art here + in `Sprite.tsx`.
- `src/game/data/*` — pure content: `weapons`, `enemies`, `items`, `maps` (+ backdrops), `skills`,
  `story/types`, `story/chapter1` (the whole chapter as data), `story/codex`.
- `src/game/systems/*` — pure logic: `vector`, `combat` (arc/lock/zone/block), `saveLoad`.
- `src/game/state/*` — `gameTypes` (reducer + actions) & `GameProvider` (context, toast, checkpoint autosave).
- `src/game/scenes/*` — Text, Dialogue, GunCombat, MeleeCombat, Boss, EscapeMinigame, Explore, End.
- `src/game/GameHost.tsx` — walks the story graph and mounts the right scene (story-quest engine).
- Screens: `app/index.tsx` (menu), `app/game.tsx` (host), `app/codex.tsx` (gear/codex/skills/stats),
  `app/scenes.tsx` (dev Scene Select).

## User Personas
- **Solo mobile player** wanting a story-driven action RPG with real combat depth.
- **The developer (owner)** who will later replace all art/maps/characters and expand chapters/skills
  without rewriting gameplay — served by the data/registry split and the Scene Select dev tool.

## Core Requirements (static)
- Modular, swappable assets; gameplay decoupled from presentation.
- Full Chapter 1 narrative with checkpoints, save/load, inventory, dialogue.
- Gun combat (auto-lock, 8-round pistol, dodge), knife combat (light/heavy/block/parry/dodge),
  boss battle (patterns, stagger, weak-spot head damage), escape mini-game, exploration.

## Implemented (2026-06 / iteration 1) — VERIFIED PASS
- Main menu (New Game / Continue / Codex / Scene Select / How to Play) + dark mythic theme.
- Story engine + full Chapter 1 (dialogue, text cards, checkpoints, grants, ending summary).
- Checkpoint autosave + Continue (device-persistent).
- Gun combat: auto-lock targeting, shooting, ammo/reload, dodge, bat AI, kill tracking, win/lose.
- Explore: joystick movement + contextual interactions (collect fruit / reach markers / triggers).
- Escape mini-game: mash-to-fill struggle meter vs decay for 10s, success/fail.
- Knife melee: light/heavy/combos, dodge i-frames, block chip, timing parry → stagger, monster AI.
- Boss: charge/area/combo/normal patterns, telegraphs, stagger meter, head weak-spot (50) when
  vulnerable vs body (10), block (5)/dodge, boss HP + stagger bars.
- Inventory + Codex (lore/bestiary/equipment) + Skill tree (data-driven, unlockable w/ XP) + Stats.
- HUD, toasts, pause (resume/quit), damage popups.
- Dev **Scene Select** to jump into any beat with a loadout.

## Prioritized Backlog
### P1
- Audio layer (SFX/music) wired through a swappable sound registry (currently placeholder-only).
- Persist mid-scene state / manual save slots; settings (SFX, difficulty).
- Richer explore maps (multiple rooms, doors, NPC dialogue triggers).
### P2 (future support already scaffolded)
- Skill tree UI effects fully applied in combat (hooks exist: aim range, fire rate, parry window, HP, i-frames).
- Multiplayer (co-op) — requires backend/session layer.
- Chapter 2+ and map expansion (just add new `Chapter` data + assets).
- Real art/sprite-sheet + animation swap via `AssetRegistry`/`Sprite`.

## Next Tasks
- Add sound design layer (modular). Add settings screen. Expand explore content. Apply skill effects live.
