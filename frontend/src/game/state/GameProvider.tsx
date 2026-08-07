// =============================================================================
// GAME PROVIDER  — global session context + toast + checkpoint autosave
// =============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../config/theme";
import { clearSave, loadGame, saveGame } from "../systems/saveLoad";
import { GameAction, GameState, INITIAL_STATE, gameReducer } from "./gameTypes";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  showToast: (msg: string) => void;
  newGame: () => void;
  continueGame: () => Promise<boolean>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastAnim.setValue(0);
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start(
          () => setToast(null),
        );
      }, 2200);
    },
    [toastAnim],
  );

  const newGame = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const continueGame = useCallback(async (): Promise<boolean> => {
    const saved = await loadGame();
    if (saved) {
      dispatch({ type: "LOAD_STATE", state: saved });
      return true;
    }
    return false;
  }, []);

  // Checkpoint-based autosave: persist whenever we reach a new checkpoint or
  // complete the chapter.
  useEffect(() => {
    if (state.checkpointIndex > 0 || state.chapterComplete) {
      saveGame(state);
    }
  }, [state.checkpointIndex, state.chapterComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear a stale save when a brand-new game starts from index 0.
  const startedFreshRef = useRef(false);
  useEffect(() => {
    if (state.storyIndex === 0 && state.checkpointIndex === 0 && !startedFreshRef.current) {
      startedFreshRef.current = true;
    }
  }, [state.storyIndex, state.checkpointIndex]);

  const value = useMemo<GameContextValue>(
    () => ({ state, dispatch, showToast, newGame, continueGame }),
    [state, showToast, newGame, continueGame],
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      {toast !== null && (
        <View pointerEvents="none" style={[styles.toastWrap, { top: insets.top + 12 }]}>
          <Animated.View
            testID="game-toast"
            style={[
              styles.toast,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        </View>
      )}
    </GameContext.Provider>
  );
}

// Exposed so screens (menu) can wipe a save without importing systems directly.
export { clearSave };

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxWidth: "90%",
  },
  toastText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
