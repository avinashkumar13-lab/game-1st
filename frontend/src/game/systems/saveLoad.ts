// =============================================================================
// SAVE / LOAD SYSTEM
// -----------------------------------------------------------------------------
// Persists the full game session to device storage via the shared storage util.
// The util only stores primitives, so we serialize the state object to a JSON
// string ourselves. Checkpoint-based autosave is triggered from GameProvider.
// =============================================================================

import { storage } from "@/src/utils/storage";
import { GameState } from "../state/gameTypes";

const SAVE_KEY = "bhullok_save_v1";

export async function saveGame(state: GameState): Promise<boolean> {
  return storage.setItem(SAVE_KEY, JSON.stringify(state));
}

export async function loadGame(): Promise<GameState | null> {
  const raw = await storage.getItem<string>(SAVE_KEY, "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export async function hasSave(): Promise<boolean> {
  const raw = await storage.getItem<string>(SAVE_KEY, "");
  return !!raw;
}

export async function clearSave(): Promise<boolean> {
  return storage.removeItem(SAVE_KEY);
}
