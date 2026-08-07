// =============================================================================
// SCENE SELECT (dev tool) — jump straight into any story beat with a ready
// loadout. Invaluable for iterating on gameplay without replaying the story.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/game/config/theme";
import { CHAPTER_1 } from "@/src/game/data/story/chapter1";
import { useGame } from "@/src/game/state/GameProvider";

const NODES = CHAPTER_1.nodes;
const idx = (id: string) => NODES.findIndex((n) => n.id === id);

const JUMPS: { id: string; label: string; hint: string; icon: string }[] = [
  { id: "prologue", label: "Prologue", hint: "The crash · mother's ring", icon: "car" },
  { id: "vision", label: "The Vision", hint: "Father · five figures", icon: "eye" },
  { id: "fight_bats", label: "Bat Fight (Gun)", hint: "Pistol · auto-lock · 3 bats", icon: "bug" },
  { id: "get_fruit", label: "Collect Fruit (Explore)", hint: "Move · interact · return home", icon: "leaf" },
  { id: "passage", label: "Secret Passage", hint: "Ancient knife & armor", icon: "cube" },
  { id: "search_food", label: "Search Woods (Explore)", hint: "Leads to capture", icon: "trail-sign" },
  { id: "escape", label: "Escape Mini-Game", hint: "Mash to break free · 10s", icon: "flame" },
  { id: "fight_monsters", label: "Knife Fight", hint: "Light/heavy · block · parry · 5 foes", icon: "flash" },
  { id: "boss_intro", label: "Boss Intro", hint: "The Behemoth appears", icon: "skull" },
  { id: "fight_boss", label: "Boss Fight", hint: "500 HP · patterns · weak spots", icon: "trophy" },
  { id: "chapter_complete", label: "Ending", hint: "Chapter complete screen", icon: "ribbon" },
];

export default function SceneSelect() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dispatch } = useGame();

  const jump = (id: string) => {
    const i = idx(id);
    if (i < 0) return;
    dispatch({ type: "RESET" });
    dispatch({ type: "GRANT", weapons: ["pistol", "ancient_knife"], items: [{ id: "ring", qty: 1 }] });
    dispatch({ type: "SET_CHECKPOINT", index: i, name: "Dev Jump" });
    dispatch({ type: "GOTO", index: i });
    router.push("/game");
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#0A0710", "#160D1E"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable testID="scenes-back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Scene Select</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.note}>Dev tool · jumps to a beat with pistol + knife equipped and full HP.</Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 10 }} showsVerticalScrollIndicator={false}>
        {JUMPS.map((j) => (
          <Pressable
            key={j.id}
            testID={`jump-${j.id}`}
            onPress={() => jump(j.id)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
          >
            <View style={styles.icon}>
              <Ionicons name={j.icon as any} size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{j.label}</Text>
              <Text style={styles.hint}>{j.hint}</Text>
            </View>
            <Ionicons name="play" size={18} color={theme.colors.textFaint} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0A0710" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(28,25,48,0.7)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  note: { color: theme.colors.textFaint, fontSize: 12, fontWeight: "500", textAlign: "center", paddingHorizontal: 24, marginBottom: 6 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  hint: { color: theme.colors.textDim, fontSize: 12, fontWeight: "500", marginTop: 2 },
});
