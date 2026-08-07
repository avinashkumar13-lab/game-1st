// =============================================================================
// DialogueScene — story + cutscene delivery. Tap to advance lines.
// =============================================================================

import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../config/theme";
import { DialogueBox } from "../components/DialogueBox";
import { BACKDROPS } from "../data/maps";
import { DialogueLine } from "../data/story/types";

interface DialogueSceneProps {
  bgId: string;
  title?: string;
  lines: DialogueLine[];
  onComplete: () => void;
}

export function DialogueScene({ bgId, title, lines, onComplete }: DialogueSceneProps) {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const bg = BACKDROPS[bgId] ?? { label: "", colors: [theme.colors.bg, theme.colors.bgAlt] as [string, string] };
  const line = lines[idx];

  const advance = () => {
    if (idx < lines.length - 1) setIdx((i) => i + 1);
    else onComplete();
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={bg.colors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Pressable style={styles.tapLayer} onPress={advance} testID="dialogue-advance">
        <View style={[styles.header, { paddingTop: insets.top + 14 }]} pointerEvents="none">
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.bgTag}>
            <Text style={styles.bgLabel}>{bg.label}</Text>
          </View>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom }]}>
          <DialogueBox line={line} index={idx} total={lines.length} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  tapLayer: { flex: 1, justifyContent: "space-between" },
  header: { paddingHorizontal: 18, alignItems: "center" },
  title: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  bgTag: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bgLabel: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "600", fontStyle: "italic" },
  bottom: { width: "100%" },
});
