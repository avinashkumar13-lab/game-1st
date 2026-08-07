// =============================================================================
// ArenaFloor — renders a map's floor tint, subtle grid, and decorative props.
// Purely cosmetic; sits behind all entities. Reads from MAPS data.
// =============================================================================

import React from "react";
import { StyleSheet, View } from "react-native";

import { ArenaMap } from "../data/maps";
import { Sprite } from "./Sprite";

interface ArenaFloorProps {
  map: ArenaMap;
  width: number;
  height: number;
}

const GRID = 6;

function ArenaFloorBase({ map, width, height }: ArenaFloorProps) {
  if (width <= 0 || height <= 0) return <View style={[StyleSheet.absoluteFill, { backgroundColor: map.floor }]} />;
  const cols = GRID;
  const rows = Math.max(1, Math.round((height / width) * GRID));
  const cw = width / cols;
  const rh = height / rows;

  const lines: React.ReactNode[] = [];
  for (let i = 1; i < cols; i++) {
    lines.push(<View key={`v${i}`} style={[styles.line, { left: i * cw, top: 0, width: 1, height, backgroundColor: map.grid }]} />);
  }
  for (let j = 1; j < rows; j++) {
    lines.push(<View key={`h${j}`} style={[styles.line, { top: j * rh, left: 0, height: 1, width, backgroundColor: map.grid }]} />);
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: map.floor }]} pointerEvents="none">
      {lines}
      {map.props.map((p, idx) => (
        <Sprite key={idx} assetId={p.assetId} x={p.nx * width} y={p.ny * height} size={p.size ?? 32} opacity={0.85} />
      ))}
    </View>
  );
}

export const ArenaFloor = React.memo(ArenaFloorBase);

const styles = StyleSheet.create({
  line: { position: "absolute" },
});
