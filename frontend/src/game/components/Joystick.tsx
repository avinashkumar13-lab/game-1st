// =============================================================================
// Joystick — thumb-drag virtual stick (PanResponder, no worklets).
// -----------------------------------------------------------------------------
// Reports a normalized {x,y} direction (magnitude 0..1) via onChange. The game
// loop reads the latest value from a ref, so onChange just writes that ref.
// =============================================================================

import React, { useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

import { theme } from "../config/theme";
import { Vec } from "../systems/vector";

interface JoystickProps {
  size?: number;
  onChange: (v: Vec) => void;
  testID?: string;
}

export function Joystick({ size = 128, onChange, testID }: JoystickProps) {
  const radius = size / 2;
  const knob = size * 0.42;
  const maxDist = radius - knob / 2;
  const [pos, setPos] = React.useState<Vec>({ x: 0, y: 0 });
  const posRef = useRef<Vec>({ x: 0, y: 0 });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        let dx = g.dx;
        let dy = g.dy;
        const mag = Math.hypot(dx, dy);
        if (mag > maxDist) {
          dx = (dx / mag) * maxDist;
          dy = (dy / mag) * maxDist;
        }
        posRef.current = { x: dx, y: dy };
        setPos({ x: dx, y: dy });
        onChange({ x: dx / maxDist, y: dy / maxDist });
      },
      onPanResponderRelease: () => {
        posRef.current = { x: 0, y: 0 };
        setPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        posRef.current = { x: 0, y: 0 };
        setPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      },
    }),
  ).current;

  return (
    <View
      testID={testID}
      style={[styles.base, { width: size, height: size, borderRadius: radius }]}
      {...responder.panHandlers}
    >
      <View style={styles.crossH} />
      <View style={styles.crossV} />
      <View
        style={[
          styles.knob,
          {
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            transform: [{ translateX: pos.x }, { translateY: pos.y }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(30,27,48,0.55)",
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    backgroundColor: theme.colors.player,
    borderWidth: 2,
    borderColor: "#BEE3FF",
  },
  crossH: { position: "absolute", width: "60%", height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  crossV: { position: "absolute", height: "60%", width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
});
