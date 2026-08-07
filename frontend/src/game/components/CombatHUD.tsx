// =============================================================================
// CombatHUD — top overlay for all combat/explore scenes.
// -----------------------------------------------------------------------------
// Sticky, safe-area aware. Shows objective + player HP + optional ammo + pause.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../config/theme";
import { StatBar } from "./StatBar";

interface CombatHUDProps {
  objective: string;
  hp: number;
  maxHp: number;
  ammo?: number | null;
  magazine?: number | null;
  progressLabel?: string; // e.g. "2 / 3"
  onPause?: () => void;
}

export function CombatHUD({
  objective,
  hp,
  maxHp,
  ammo,
  magazine,
  progressLabel,
  onPause,
}: CombatHUDProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.topRow}>
        <View style={styles.objectivePill}>
          <Ionicons name="flag" size={13} color={theme.colors.primary} />
          <Text style={styles.objectiveText} numberOfLines={1}>
            {objective}
          </Text>
          {progressLabel ? <Text style={styles.progress}>{progressLabel}</Text> : null}
        </View>
        {onPause && (
          <Pressable testID="pause-button" onPress={onPause} style={styles.pauseBtn} hitSlop={10}>
            <Ionicons name="pause" size={18} color={theme.colors.text} />
          </Pressable>
        )}
      </View>

      <View style={styles.bars}>
        <View style={{ flex: 1 }}>
          <StatBar
            testID="player-hp-bar"
            value={hp}
            max={maxHp}
            color={hp / maxHp > 0.5 ? theme.colors.hp : hp / maxHp > 0.25 ? theme.colors.hpMid : theme.colors.hpLow}
            label="HP"
            showNumbers
            height={12}
          />
        </View>
        {typeof ammo === "number" && (
          <View style={styles.ammoBox} testID="ammo-counter">
            <Ionicons name="ellipse" size={12} color={theme.colors.ammo} />
            <Text style={styles.ammoText}>
              {ammo}
              {magazine ? `/${magazine}` : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    zIndex: 50,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  objectivePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(20,18,33,0.82)",
    borderColor: theme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  objectiveText: { color: theme.colors.text, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  progress: { color: theme.colors.primary, fontSize: 13, fontWeight: "800", marginLeft: "auto" },
  pauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(20,18,33,0.82)",
    borderColor: theme.colors.borderSoft,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 10 },
  ammoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(20,18,33,0.82)",
    borderColor: theme.colors.ammo,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ammoText: { color: theme.colors.text, fontSize: 13, fontWeight: "800" },
});
