// =============================================================================
// StatBar — labelled progress bar (HP / boss HP / stagger / struggle meter).
// =============================================================================

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

interface StatBarProps {
  value: number;
  max: number;
  color: string;
  label?: string;
  showNumbers?: boolean;
  height?: number;
  trackColor?: string;
  testID?: string;
}

function StatBarBase({
  value,
  max,
  color,
  label,
  showNumbers,
  height = 12,
  trackColor = "rgba(0,0,0,0.45)",
  testID,
}: StatBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={styles.wrap} testID={testID}>
      {(label || showNumbers) && (
        <View style={styles.row}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showNumbers ? (
            <Text style={styles.num}>
              {Math.ceil(value)}/{max}
            </Text>
          ) : null}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
        <View
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            borderRadius: height / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export const StatBar = React.memo(StatBarBase);

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: theme.colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  num: { color: theme.colors.text, fontSize: 11, fontWeight: "800" },
  track: { width: "100%", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
});
