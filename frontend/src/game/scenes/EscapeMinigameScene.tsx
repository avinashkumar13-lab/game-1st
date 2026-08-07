// =============================================================================
// EscapeMinigameScene — mash FIRE to break the ropes before the meter empties.
// Success = keep the struggle meter alive for `duration` seconds.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CombatHUD } from "../components/CombatHUD";
import { SceneOverlay } from "../components/SceneOverlay";
import { Sprite } from "../components/Sprite";
import { StatBar } from "../components/StatBar";
import { theme } from "../config/theme";
import { useGameLoop } from "../hooks/useGameLoop";
import { useGame } from "../state/GameProvider";
import { clamp } from "../systems/vector";

const TAP_GAIN = 7;
const DECAY = 15; // per second
const START = 45;

interface EscapeSceneProps {
  duration: number;
  objective: string;
  onComplete: () => void;
  onDeath: () => void;
  onPause: () => void;
  paused: boolean;
}

export function EscapeMinigameScene({ duration, objective, onComplete, onDeath, onPause, paused }: EscapeSceneProps) {
  const { state } = useGame();
  const insets = useSafeAreaInsets();

  const meter = useRef(START);
  const elapsed = useRef(0);
  const shake = useRef(0);
  const done = useRef(false);
  const [meterView, setMeterView] = useState(START);
  const [timeView, setTimeView] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  useGameLoop((dt) => {
    if (done.current || paused) return;
    meter.current = clamp(meter.current - DECAY * dt, 0, 100);
    elapsed.current += dt;
    shake.current += dt * 30;
    setMeterView(meter.current);
    setTimeView(elapsed.current);

    if (meter.current <= 0) {
      done.current = true;
      setResult("lose");
    } else if (elapsed.current >= duration) {
      done.current = true;
      setResult("win");
    }
  }, paused || result !== null);

  const tap = () => {
    if (done.current || paused) return;
    meter.current = clamp(meter.current + TAP_GAIN, 0, 100);
    setMeterView(meter.current);
  };

  const shakeX = Math.sin(shake.current) * (result ? 0 : 6);
  const timeLeft = Math.max(0, duration - timeView);
  const meterColor = meterView > 55 ? theme.colors.hp : meterView > 25 ? theme.colors.hpMid : theme.colors.hpLow;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#140D12", "#2A1620"]} style={StyleSheet.absoluteFill} />

      <View style={styles.stage}>
        <View style={{ transform: [{ translateX: shakeX }] }}>
          <View style={styles.ropeRing}>
            <Sprite assetId="char_player" x={70} y={70} size={64} />
          </View>
        </View>
        <View style={styles.timerRow}>
          <Ionicons name="time" size={16} color={theme.colors.primary} />
          <Text style={styles.timer}>{timeLeft.toFixed(1)}s</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <StatBar testID="struggle-meter" value={meterView} max={100} color={meterColor} label="STRUGGLE — don't let it empty!" height={16} />
        <View style={{ height: 12 }} />
        <StatBar value={timeView} max={duration} color={theme.colors.primary} label="Freedom" height={10} />
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          testID="escape-tap-button"
          onPress={tap}
          style={({ pressed }) => [styles.mashBtn, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
        >
          <Ionicons name="flame" size={40} color="#0B0A12" />
          <Text style={styles.mashText}>TAP!</Text>
        </Pressable>
        <Text style={styles.hint}>Mash rapidly to break free</Text>
      </View>

      <CombatHUD objective={objective} hp={state.player.hp} maxHp={state.player.maxHp} onPause={onPause} />

      <SceneOverlay
        visible={result === "win"}
        icon="flash"
        iconColor={theme.colors.success}
        title="Broke Free!"
        subtitle="The ropes snapped like burnt thread."
        buttons={[{ label: "Continue", icon: "arrow-forward", onPress: onComplete, testID: "escape-continue-button" }]}
      />
      <SceneOverlay
        visible={result === "lose"}
        icon="skull"
        iconColor={theme.colors.danger}
        title="You Failed to Escape"
        subtitle="The monsters closed in. Respawning at checkpoint…"
        buttons={[{ label: "Retry", icon: "refresh", onPress: onDeath, variant: "danger", testID: "escape-retry-button" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  ropeRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "#6B4A2A",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timer: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  panel: { paddingHorizontal: 26, paddingBottom: 10 },
  controls: { alignItems: "center", paddingBottom: 30 },
  mashBtn: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: theme.colors.primary,
    borderWidth: 4,
    borderColor: "#F0D27A",
    alignItems: "center",
    justifyContent: "center",
  },
  mashText: { color: "#0B0A12", fontSize: 20, fontWeight: "800", marginTop: 2 },
  hint: { color: theme.colors.textDim, fontSize: 13, fontWeight: "600", marginTop: 12 },
});
