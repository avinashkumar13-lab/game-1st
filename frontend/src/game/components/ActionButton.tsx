// =============================================================================
// ActionButton — circular combat button (tap or hold).
// -----------------------------------------------------------------------------
// onPress: discrete tap (shoot / attack / dodge). onHoldChange(true/false):
// held state (block / move-assist). badge: ammo count. disabled + cooldown.
// =============================================================================

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

interface ActionButtonProps {
  icon: string;
  iconFamily?: "ion" | "mci";
  label?: string;
  color?: string;
  size?: number;
  badge?: string | number;
  disabled?: boolean;
  active?: boolean; // held/engaged (e.g. blocking)
  onPress?: () => void;
  onHoldChange?: (held: boolean) => void;
  testID?: string;
}

export function ActionButton({
  icon,
  iconFamily = "ion",
  label,
  color = theme.colors.primary,
  size = 72,
  badge,
  disabled,
  active,
  onPress,
  onHoldChange,
  testID,
}: ActionButtonProps) {
  const Icon = iconFamily === "ion" ? Ionicons : MaterialCommunityIcons;

  return (
    <View style={styles.wrap}>
      <Pressable
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => onHoldChange?.(true)}
        onPressOut={() => onHoldChange?.(false)}
        style={({ pressed }) => [
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            backgroundColor: active ? color : pressed ? `${color}44` : "rgba(28,25,48,0.7)",
            opacity: disabled ? 0.35 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Icon name={icon as any} size={Math.round(size * 0.44)} color={active ? "#0B0A12" : color} />
        {badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </Pressable>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  btn: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.4,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: theme.colors.bg,
    borderWidth: 1.5,
    borderColor: theme.colors.ammo,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: theme.colors.ammo, fontSize: 11, fontWeight: "800" },
});
