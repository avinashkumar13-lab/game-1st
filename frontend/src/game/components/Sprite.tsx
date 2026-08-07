// =============================================================================
// Sprite — renders any registry asset as a placeholder.
// -----------------------------------------------------------------------------
// *** Swap point #2 *** — when real art arrives, branch here on an `image`
// field in the PlaceholderAsset and render <Image> instead of the shape.
// Every entity in the game funnels through this one component.
// =============================================================================

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { getAsset } from "../assets/registry";
import { theme } from "../config/theme";

interface SpriteProps {
  assetId: string;
  x: number;
  y: number;
  size: number;
  facing?: number; // radians; draws a direction nub if provided
  hpRatio?: number; // 0..1 draws a mini hp bar above
  dim?: boolean;
  flash?: boolean; // hit flash (white/red)
  highlight?: string; // outline color (e.g. lock / stagger)
  opacity?: number;
  zIndex?: number;
}

function SpriteBase({
  assetId,
  x,
  y,
  size,
  facing,
  hpRatio,
  dim,
  flash,
  highlight,
  opacity = 1,
  zIndex,
}: SpriteProps) {
  const a = getAsset(assetId);
  const iconSize = Math.round(size * 0.5);
  const borderRadius = a.shape === "circle" ? size / 2 : a.shape === "diamond" ? 6 : 8;
  const rotate = a.shape === "diamond" ? "45deg" : "0deg";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity: dim ? opacity * 0.5 : opacity,
          zIndex,
        },
      ]}
    >
      {typeof hpRatio === "number" && (
        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${Math.max(0, Math.min(1, hpRatio)) * 100}%`,
                backgroundColor:
                  hpRatio > 0.5 ? theme.colors.hp : hpRatio > 0.25 ? theme.colors.hpMid : theme.colors.hpLow,
              },
            ]}
          />
        </View>
      )}

      {highlight && (
        <View
          style={[
            styles.ring,
            { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2, borderColor: highlight },
          ]}
        />
      )}

      <View
        style={[
          styles.body,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: flash ? "#FFFFFF" : a.color,
            borderColor: a.accent,
            transform: [{ rotate }],
          },
        ]}
      >
        <View style={{ transform: [{ rotate: a.shape === "diamond" ? "-45deg" : "0deg" }] }}>
          {a.icon ? (
            a.iconFamily === "ion" ? (
              <Ionicons name={a.icon as any} size={iconSize} color={flash ? a.color : "#FFFFFF"} />
            ) : (
              <MaterialCommunityIcons name={a.icon as any} size={iconSize} color={flash ? a.color : "#FFFFFF"} />
            )
          ) : a.label ? (
            <Text style={[styles.label, { fontSize: Math.max(9, size * 0.24), color: flash ? a.color : "#FFFFFF" }]}>
              {a.label}
            </Text>
          ) : null}
        </View>
      </View>

      {typeof facing === "number" && (
        <View
          style={[
            styles.nub,
            {
              left: size / 2 - 4 + Math.cos(facing) * (size / 2),
              top: size / 2 - 4 + Math.sin(facing) * (size / 2),
              backgroundColor: a.accent,
            },
          ]}
        />
      )}
    </View>
  );
}

export const Sprite = React.memo(SpriteBase);

const styles = StyleSheet.create({
  wrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  body: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "800", letterSpacing: 0.5 },
  ring: { position: "absolute", borderWidth: 2 },
  hpTrack: {
    position: "absolute",
    top: -10,
    width: "90%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  hpFill: { height: "100%", borderRadius: 2 },
  nub: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
});
