// =============================================================================
// ExploreScene — free top-down movement + interaction markers.
// Drives "collect fruit / return home" and "search the woods" story beats.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArenaFloor } from "../components/ArenaFloor";
import { CombatHUD } from "../components/CombatHUD";
import { Joystick } from "../components/Joystick";
import { Sprite } from "../components/Sprite";
import { theme } from "../config/theme";
import { MAPS } from "../data/maps";
import { ExploreInteraction } from "../data/story/types";
import { useGameLoop } from "../hooks/useGameLoop";
import { useGame } from "../state/GameProvider";
import { clamp, dist, Vec } from "../systems/vector";

const PLAYER_SIZE = 40;
const MOVE_SPEED = 165;
const INTERACT_RANGE = 62;

interface ExploreSceneProps {
  mapId: string;
  objective: string;
  interactions: ExploreInteraction[];
  onComplete: () => void;
  onPause: () => void;
  paused: boolean;
}

interface Marker extends ExploreInteraction {
  x: number;
  y: number;
  done: boolean;
}

export function ExploreScene({ mapId, objective, interactions, onComplete, onPause, paused }: ExploreSceneProps) {
  const { dispatch, showToast, state } = useGame();
  const insets = useSafeAreaInsets();
  const map = MAPS[mapId] ?? MAPS.home_yard;

  const dims = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const input = useRef<Vec>({ x: 0, y: 0 });
  const player = useRef({ x: 0, y: 0 });
  const markers = useRef<Marker[]>([]);
  const localFlags = useRef<Record<string, boolean>>({ ...state.flags });
  const finished = useRef(false);
  const [, force] = useState(0);
  const [nearId, setNearId] = useState<string | null>(null);

  const setup = (w: number, h: number) => {
    dims.current = { w, h };
    player.current = { x: w / 2, y: h * 0.7 };
    markers.current = interactions.map((it) => ({ ...it, x: it.nx * w, y: it.ny * h, done: false }));
    setReady(true);
  };

  useGameLoop((dt) => {
    if (!ready || finished.current || paused) return;
    const { w, h } = dims.current;
    const inp = input.current;
    const mag = Math.hypot(inp.x, inp.y);
    if (mag > 0.15) {
      player.current.x = clamp(player.current.x + inp.x * MOVE_SPEED * dt, PLAYER_SIZE / 2, w - PLAYER_SIZE / 2);
      player.current.y = clamp(player.current.y + inp.y * MOVE_SPEED * dt, PLAYER_SIZE / 2, h - PLAYER_SIZE / 2);
    }
    // nearest not-done marker
    let near: Marker | null = null;
    let bestD = INTERACT_RANGE;
    for (const m of markers.current) {
      if (m.done) continue;
      const d = dist(player.current.x, player.current.y, m.x, m.y);
      if (d < bestD) {
        bestD = d;
        near = m;
      }
    }
    if ((near?.id ?? null) !== nearId) setNearId(near?.id ?? null);
    force((n) => (n + 1) % 1000000);
  }, paused || !ready);

  const interact = () => {
    const m = markers.current.find((mk) => mk.id === nearId);
    if (!m || m.done) return;
    if (m.requiresFlag && !localFlags.current[m.requiresFlag]) {
      showToast(m.lockedHint ?? "You can't do that yet.");
      return;
    }
    if (m.grantItem) dispatch({ type: "GRANT", items: [m.grantItem] });
    if (m.setFlag) {
      localFlags.current[m.setFlag] = true;
      dispatch({ type: "GRANT", flags: [m.setFlag] });
    }
    if (m.dialogue) showToast(m.dialogue);
    m.done = true;
    setNearId(null);
    if (m.completesScene) {
      finished.current = true;
      setReady(false);
      onComplete();
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.field} onLayout={(e) => { if (!ready) setup(e.nativeEvent.layout.width, e.nativeEvent.layout.height); }}>
        <ArenaFloor map={map} width={dims.current.w} height={dims.current.h} />

        {ready &&
          markers.current.map((m) => (
            <View key={m.id}>
              <Sprite
                assetId={m.assetId}
                x={m.x}
                y={m.y}
                size={44}
                dim={m.done}
                highlight={nearId === m.id ? theme.colors.primary : undefined}
              />
              {!m.done && (
                <View style={[styles.markerLabel, { left: m.x - 60, top: m.y + 26 }]} pointerEvents="none">
                  <Text style={styles.markerLabelText}>{m.label}</Text>
                </View>
              )}
            </View>
          ))}

        {ready && <Sprite assetId="char_player" x={player.current.x} y={player.current.y} size={PLAYER_SIZE} />}
      </View>

      <CombatHUD objective={objective} hp={state.player.hp} maxHp={state.player.maxHp} onPause={onPause} />

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Joystick testID="explore-joystick" onChange={(v) => (input.current = v)} />
        <Pressable
          testID="interact-button"
          disabled={!nearId}
          onPress={interact}
          style={({ pressed }) => [
            styles.interactBtn,
            { opacity: nearId ? (pressed ? 0.85 : 1) : 0.35, transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <Ionicons name="hand-left" size={26} color="#0B0A12" />
          <Text style={styles.interactText}>Interact</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  field: { flex: 1, overflow: "hidden" },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  interactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 40,
  },
  interactText: { color: "#0B0A12", fontSize: 15, fontWeight: "800" },
  markerLabel: { position: "absolute", width: 120, alignItems: "center" },
  markerLabelText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
});
