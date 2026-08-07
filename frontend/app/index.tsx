// =============================================================================
// MAIN MENU — title, New Game / Continue / Codex / How to Play.
// =============================================================================

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SceneOverlay } from "@/src/game/components/SceneOverlay";
import { theme } from "@/src/game/config/theme";
import { CHAPTER_1 } from "@/src/game/data/story/chapter1";
import { clearSave, useGame } from "@/src/game/state/GameProvider";
import { hasSave } from "@/src/game/systems/saveLoad";

export default function Menu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { newGame, continueGame } = useGame();
  const [saveExists, setSaveExists] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const exists = await hasSave();
        if (active) setSaveExists(exists);
      })();
      fade.setValue(0);
      slide.setValue(20);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
      return () => {
        active = false;
      };
    }, [fade, slide]),
  );

  const startNew = async () => {
    await clearSave();
    newGame();
    setConfirmNew(false);
    router.push("/game");
  };

  const onNewGamePress = () => {
    if (saveExists) setConfirmNew(true);
    else startNew();
  };

  const onContinue = async () => {
    const ok = await continueGame();
    if (ok) router.push("/game");
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#0A0710", "#160D1E", "#2A0F18"]} style={StyleSheet.absoluteFill} />

      {/* decorative glyphs */}
      <View style={styles.glyphs} pointerEvents="none">
        <MaterialCommunityIcons name="ring" size={220} color="rgba(212,168,44,0.05)" style={{ position: "absolute", top: 40, right: -50 }} />
        <Ionicons name="skull" size={180} color="rgba(178,58,72,0.05)" style={{ position: "absolute", bottom: 120, left: -30 }} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30, opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>An Action RPG · Chapter 1</Text>
          <Text style={styles.title}>BHULLOK</Text>
          <View style={styles.titleRule} />
          <Text style={styles.subtitle}>{CHAPTER_1.title}</Text>
        </View>

        <View style={styles.menu}>
          {saveExists && (
            <MenuButton
              testID="continue-button"
              icon="play"
              label="Continue"
              hint="Resume from your last checkpoint"
              primary
              onPress={onContinue}
            />
          )}
          <MenuButton testID="new-game-button" icon="sparkles" label="New Game" hint="Start from the prologue" primary={!saveExists} onPress={onNewGamePress} />
          <MenuButton testID="codex-button" icon="book" label="Codex & Inventory" hint="Lore, gear, skills" onPress={() => router.push("/codex")} />
          <MenuButton testID="scenes-button" icon="flask" label="Scene Select" hint="Jump to any beat (dev)" onPress={() => router.push("/scenes")} />
          <MenuButton testID="help-button" icon="game-controller" label="How to Play" hint="Controls & combat" onPress={() => setShowHelp(true)} />
        </View>

        <Text style={styles.footer}>Placeholder art · gameplay-first framework</Text>
      </Animated.View>

      <SceneOverlay
        visible={confirmNew}
        icon="warning"
        iconColor={theme.colors.warn}
        title="Start a New Game?"
        subtitle="This will erase your saved progress and begin from the prologue."
        buttons={[
          { label: "Erase & Start", icon: "sparkles", onPress: startNew, variant: "danger", testID: "confirm-new-button" },
          { label: "Cancel", onPress: () => setConfirmNew(false), variant: "ghost", testID: "cancel-new-button" },
        ]}
      />

      <HowToPlay visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  );
}

function MenuButton({
  icon,
  label,
  hint,
  primary,
  onPress,
  testID,
}: {
  icon: string;
  label: string;
  hint: string;
  primary?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.mBtn, primary && styles.mBtnPrimary, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
    >
      <View style={[styles.mIcon, primary && styles.mIconPrimary]}>
        <Ionicons name={icon as any} size={20} color={primary ? "#0B0A12" : theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.mLabel, primary && { color: "#0B0A12" }]}>{label}</Text>
        <Text style={[styles.mHint, primary && { color: "rgba(11,10,18,0.7)" }]}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={primary ? "#0B0A12" : theme.colors.textFaint} />
    </Pressable>
  );
}

function HowToPlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const rows: { icon: string; fam: "ion" | "mci"; text: string }[] = [
    { icon: "move", fam: "ion", text: "Left stick — move your hero around the arena" },
    { icon: "pistol", fam: "mci", text: "Fire — auto-locks the nearest close enemy; tap to shoot" },
    { icon: "knife", fam: "mci", text: "Light / Heavy — knife strikes; heavy hits harder & staggers" },
    { icon: "shield", fam: "ion", text: "Block / Parry — hold to block; tap just before a hit to parry" },
    { icon: "footsteps", fam: "ion", text: "Dodge — quick dash with brief invincibility" },
    { icon: "skull", fam: "ion", text: "Bosses — dodge attacks to stagger them, then strike the HEAD" },
  ];
  if (!visible) return null;
  return (
    <View style={styles.helpBackdrop} testID="help-overlay">
      <View style={styles.helpPanel}>
        <View style={styles.helpHeader}>
          <Ionicons name="game-controller" size={22} color={theme.colors.primary} />
          <Text style={styles.helpTitle}>How to Play</Text>
        </View>
        <View style={{ gap: 14, marginTop: 16 }}>
          {rows.map((r, i) => (
            <View key={i} style={styles.helpRow}>
              <View style={styles.helpIcon}>
                {r.fam === "ion" ? (
                  <Ionicons name={r.icon as any} size={18} color={theme.colors.primary} />
                ) : (
                  <MaterialCommunityIcons name={r.icon as any} size={18} color={theme.colors.primary} />
                )}
              </View>
              <Text style={styles.helpText}>{r.text}</Text>
            </View>
          ))}
        </View>
        <Pressable testID="help-close-button" onPress={onClose} style={({ pressed }) => [styles.helpClose, pressed && { opacity: 0.85 }]}>
          <Ionicons name="checkmark" size={18} color="#0B0A12" />
          <Text style={styles.helpCloseText}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0A0710" },
  glyphs: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, paddingHorizontal: 26, justifyContent: "space-between" },
  titleBlock: { alignItems: "flex-start", marginTop: 10 },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase" },
  title: { color: theme.colors.text, fontSize: 58, fontWeight: "800", letterSpacing: 2, marginTop: 6 },
  titleRule: { width: 90, height: 3, backgroundColor: theme.colors.primary, marginTop: 8, marginBottom: 12 },
  subtitle: { color: theme.colors.textDim, fontSize: 17, fontWeight: "600", fontStyle: "italic" },
  menu: { gap: 12 },
  mBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(28,25,48,0.7)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 16,
  },
  mBtnPrimary: { backgroundColor: theme.colors.primary, borderColor: "#F0D27A" },
  mIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryDim,
  },
  mIconPrimary: { backgroundColor: "rgba(11,10,18,0.18)", borderColor: "rgba(11,10,18,0.25)" },
  mLabel: { color: theme.colors.text, fontSize: 17, fontWeight: "800" },
  mHint: { color: theme.colors.textDim, fontSize: 12, fontWeight: "500", marginTop: 2 },
  footer: { color: theme.colors.textFaint, fontSize: 11, textAlign: "center", fontWeight: "500" },
  helpBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 300,
  },
  helpPanel: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 22,
  },
  helpHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  helpTitle: { color: theme.colors.text, fontSize: 20, fontWeight: "800" },
  helpRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: { color: theme.colors.textDim, fontSize: 13, fontWeight: "600", flex: 1, lineHeight: 18 },
  helpClose: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: 22,
  },
  helpCloseText: { color: "#0B0A12", fontSize: 15, fontWeight: "800" },
});
