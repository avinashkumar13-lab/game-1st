// =============================================================================
// EndScene — chapter completion screen with a run summary.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../config/theme";
import { useGame } from "../state/GameProvider";

interface EndSceneProps {
  title: string;
  subtitle?: string;
  onReturn: () => void;
}

export function EndScene({ title, subtitle, onReturn }: EndSceneProps) {
  const { state } = useGame();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, [fade]);

  const rows = [
    { icon: "skull", label: "Bats slain", value: state.stats.batsKilled },
    { icon: "flame", label: "Monsters slain", value: state.stats.monstersKilled },
    { icon: "trophy", label: "Behemoth felled", value: state.stats.bossDefeated ? "Yes" : "No" },
    { icon: "refresh", label: "Deaths", value: state.stats.deaths },
    { icon: "book", label: "Codex entries", value: state.codex.length },
  ];

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#0A0710", "#2C1620"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.content, { opacity: fade, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.rule} />
        <Text style={styles.badge}>Chapter Complete</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.rule} />

        <View style={styles.card}>
          {rows.map((r) => (
            <View key={r.label} style={styles.statRow}>
              <View style={styles.statLeft}>
                <Ionicons name={r.icon as any} size={16} color={theme.colors.primary} />
                <Text style={styles.statLabel}>{r.label}</Text>
              </View>
              <Text style={styles.statValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.teaser}>The name Yamraj echoes on. To be continued…</Text>

        <Pressable testID="return-menu-button" onPress={onReturn} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="home" size={18} color="#0B0A12" />
          <Text style={styles.btnText}>Return to Menu</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#050409" },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 26, justifyContent: "center" },
  rule: { width: 70, height: 2, backgroundColor: theme.colors.primaryDim, marginVertical: 14 },
  badge: { color: theme.colors.primary, fontSize: 13, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase" },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: "800", textAlign: "center", marginTop: 6 },
  subtitle: { color: theme.colors.textDim, fontSize: 15, fontWeight: "600", marginTop: 6, fontStyle: "italic" },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(20,18,33,0.7)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginTop: 10,
    gap: 12,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { color: theme.colors.textDim, fontSize: 14, fontWeight: "600" },
  statValue: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  teaser: { color: theme.colors.textFaint, fontSize: 13, fontStyle: "italic", marginTop: 20, textAlign: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginTop: 24,
    minWidth: 220,
  },
  btnText: { color: "#0B0A12", fontSize: 16, fontWeight: "800" },
});
