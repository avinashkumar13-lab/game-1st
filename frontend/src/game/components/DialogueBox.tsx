// =============================================================================
// DialogueBox — typewriter dialogue line with speaker + tap-to-advance.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";
import { DialogueLine } from "../data/story/types";

const TONE_COLOR: Record<string, string> = {
  narrator: theme.colors.textDim,
  hero: theme.colors.player,
  mother: "#E77FB3",
  father: theme.colors.primary,
  enemy: theme.colors.monster,
  boss: theme.colors.bull,
};

interface DialogueBoxProps {
  line: DialogueLine;
  index: number;
  total: number;
  onAdvanceReady?: (done: boolean) => void;
}

export function DialogueBox({ line, index, total }: DialogueBoxProps) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const caret = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setShown("");
    setDone(false);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    let i = 0;
    const text = line.text;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        if (timer.current) clearInterval(timer.current);
        setDone(true);
      }
    }, 18);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [line, fade]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(caret, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    if (done) loop.start();
    return () => loop.stop();
  }, [done, caret]);

  const tone = line.tone ?? "narrator";
  const color = TONE_COLOR[tone] ?? theme.colors.textDim;
  const isNarr = tone === "narrator";

  return (
    <Animated.View style={[styles.box, { opacity: fade }]} testID="dialogue-box">
      {line.speaker ? (
        <View style={[styles.speakerTag, { borderColor: color }]}>
          <Text style={[styles.speaker, { color }]}>{line.speaker}</Text>
        </View>
      ) : null}
      <Text
        testID="dialogue-text"
        style={[styles.text, isNarr && styles.narrText, { color: isNarr ? theme.colors.textDim : theme.colors.text }]}
      >
        {shown}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.count}>
          {index + 1}/{total}
        </Text>
        <Animated.View style={{ opacity: done ? caret : 0.35, flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.tapHint}>{done ? "tap to continue" : "tap to skip"}</Text>
          <Ionicons name="play" size={12} color={theme.colors.primary} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "rgba(14,12,22,0.94)",
    borderTopWidth: 2,
    borderColor: theme.colors.primaryDim,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 18,
    paddingBottom: 14,
    minHeight: 170,
  },
  speakerTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  speaker: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  text: { fontSize: 17, lineHeight: 25, fontWeight: "600" },
  narrText: { fontStyle: "italic", fontWeight: "500" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  count: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "700" },
  tapHint: { color: theme.colors.primary, fontSize: 12, fontWeight: "700", marginRight: 5 },
});
