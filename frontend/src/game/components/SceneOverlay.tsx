// =============================================================================
// SceneOverlay — centered modal panel for pause / victory / defeat states.
// Mounted at the top of a scene (above the tab/controls) so nothing overlaps.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

export interface OverlayButton {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  testID?: string;
}

interface SceneOverlayProps {
  visible: boolean;
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  buttons: OverlayButton[];
}

export function SceneOverlay({ visible, icon, iconColor, title, subtitle, buttons }: SceneOverlayProps) {
  if (!visible) return null;
  return (
    <View style={styles.backdrop} testID="scene-overlay">
      <View style={styles.panel}>
        {icon ? (
          <View style={[styles.iconBubble, { borderColor: iconColor ?? theme.colors.primary }]}>
            <Ionicons name={icon as any} size={34} color={iconColor ?? theme.colors.primary} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.buttons}>
          {buttons.map((b, i) => (
            <Pressable
              key={i}
              testID={b.testID}
              onPress={b.onPress}
              style={({ pressed }) => [
                styles.btn,
                b.variant === "ghost" && styles.btnGhost,
                b.variant === "danger" && styles.btnDanger,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              {b.icon ? (
                <Ionicons
                  name={b.icon as any}
                  size={18}
                  color={b.variant === "primary" || !b.variant ? "#0B0A12" : theme.colors.text}
                />
              ) : null}
              <Text
                style={[
                  styles.btnText,
                  { color: b.variant === "primary" || !b.variant ? "#0B0A12" : theme.colors.text },
                ]}
              >
                {b.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: "center",
  },
  iconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { color: theme.colors.textDim, fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 8, lineHeight: 20 },
  buttons: { width: "100%", marginTop: 22, gap: 10 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
  },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.border },
  btnDanger: { backgroundColor: theme.colors.dangerDim, borderWidth: 1, borderColor: theme.colors.danger },
  btnText: { fontSize: 15, fontWeight: "800" },
});
