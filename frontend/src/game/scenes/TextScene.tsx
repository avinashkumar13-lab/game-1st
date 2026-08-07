// =============================================================================
// TextScene — full-screen fade-in title card ("12 Years Later", etc.)
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

interface TextSceneProps {
  title: string;
  subtitle?: string;
  onComplete: () => void;
}

export function TextScene({ title, subtitle, onComplete }: TextSceneProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const [canTap, setCanTap] = useState(false);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => setCanTap(true));
    const t = setTimeout(() => setCanTap(true), 1000);
    return () => clearTimeout(t);
  }, [fade]);

  return (
    <Pressable
      testID="text-scene"
      style={styles.wrap}
      onPress={() => {
        if (canTap) onComplete();
      }}
    >
      <Animated.View style={{ opacity: fade, alignItems: "center", paddingHorizontal: 32 }}>
        <View style={styles.rule} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.rule} />
      </Animated.View>
      {canTap && (
        <Text style={styles.hint} testID="text-scene-hint">
          tap to continue
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#050409", alignItems: "center", justifyContent: "center" },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1,
    marginVertical: 18,
  },
  subtitle: { color: theme.colors.primary, fontSize: 16, fontWeight: "700", marginBottom: 18, letterSpacing: 2, textTransform: "uppercase" },
  rule: { width: 60, height: 2, backgroundColor: theme.colors.primaryDim },
  hint: { position: "absolute", bottom: 60, color: theme.colors.textFaint, fontSize: 13, fontWeight: "600" },
});
