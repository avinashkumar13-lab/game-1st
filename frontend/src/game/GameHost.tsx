// =============================================================================
// GameHost — walks the chapter's story graph and mounts the right scene.
// -----------------------------------------------------------------------------
// This is the single place story flow is wired. Adding/replacing scenes or
// chapters never touches individual scene internals.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { SceneOverlay } from "./components/SceneOverlay";
import { theme } from "./config/theme";
import { CHAPTER_1 } from "./data/story/chapter1";
import { BossScene } from "./scenes/BossScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { EndScene } from "./scenes/EndScene";
import { EscapeMinigameScene } from "./scenes/EscapeMinigameScene";
import { ExploreScene } from "./scenes/ExploreScene";
import { GunCombatScene } from "./scenes/GunCombatScene";
import { MeleeCombatScene } from "./scenes/MeleeCombatScene";
import { TextScene } from "./scenes/TextScene";
import { useGame } from "./state/GameProvider";

const NODES = CHAPTER_1.nodes;

export function GameHost() {
  const { state, dispatch, showToast } = useGame();
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const node = NODES[state.storyIndex];

  // Auto-process non-interactive nodes (checkpoints & grants).
  useEffect(() => {
    const n = NODES[state.storyIndex];
    if (!n) return;
    if (n.kind === "checkpoint") {
      const isNew = state.checkpointIndex !== state.storyIndex;
      dispatch({ type: "SET_CHECKPOINT", index: state.storyIndex, name: n.name });
      if (isNew) showToast(`Checkpoint — ${n.name}`);
      dispatch({ type: "ADVANCE" });
    } else if (n.kind === "grant") {
      dispatch({
        type: "GRANT",
        weapons: n.weapons,
        items: n.items,
        flags: n.flags,
        codex: n.codex,
        heal: n.heal,
      });
      if (n.toast) showToast(n.toast);
      dispatch({ type: "ADVANCE" });
    }
  }, [state.storyIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un-pause whenever the active node changes.
  useEffect(() => {
    setPaused(false);
  }, [state.storyIndex]);

  // Mark chapter complete when the end node is reached.
  useEffect(() => {
    if (node?.kind === "end") dispatch({ type: "CHAPTER_COMPLETE" });
  }, [node?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const onComplete = () => dispatch({ type: "ADVANCE" });
  const onDeath = () => {
    showToast("You fell. Returning to the last checkpoint.");
    dispatch({ type: "RESPAWN" });
    setPaused(false);
  };
  const onPause = () => setPaused((v) => !v);
  const quitToMenu = () => router.replace("/");

  const combatKey = `${node?.id ?? "none"}:${state.stats.deaths}`;

  let scene: React.ReactNode;
  if (!node) {
    scene = <Loading />;
  } else {
    switch (node.kind) {
      case "text":
        scene = <TextScene key={node.id} title={node.title} subtitle={node.subtitle} onComplete={onComplete} />;
        break;
      case "dialogue":
        scene = <DialogueScene key={node.id} bgId={node.bgId} title={node.title} lines={node.lines} onComplete={onComplete} />;
        break;
      case "explore":
        scene = (
          <ExploreScene
            key={combatKey}
            mapId={node.mapId}
            objective={node.objective}
            interactions={node.interactions}
            onComplete={onComplete}
            onPause={onPause}
            paused={paused}
          />
        );
        break;
      case "combat":
        scene = (
          <GunCombatScene
            key={combatKey}
            mapId={node.mapId}
            objective={node.objective}
            spawns={node.spawns}
            codex={node.codex}
            onComplete={onComplete}
            onDeath={onDeath}
            onPause={onPause}
            paused={paused}
          />
        );
        break;
      case "melee":
        scene = (
          <MeleeCombatScene
            key={combatKey}
            mapId={node.mapId}
            objective={node.objective}
            spawns={node.spawns}
            codex={node.codex}
            onComplete={onComplete}
            onDeath={onDeath}
            onPause={onPause}
            paused={paused}
          />
        );
        break;
      case "boss":
        scene = (
          <BossScene
            key={combatKey}
            mapId={node.mapId}
            objective={node.objective}
            bossId={node.bossId}
            codex={node.codex}
            onComplete={onComplete}
            onDeath={onDeath}
            onPause={onPause}
            paused={paused}
          />
        );
        break;
      case "minigame":
        scene = (
          <EscapeMinigameScene
            key={combatKey}
            duration={node.duration}
            objective={node.objective}
            onComplete={onComplete}
            onDeath={onDeath}
            onPause={onPause}
            paused={paused}
          />
        );
        break;
      case "end":
        scene = <EndScene key={node.id} title={node.title} subtitle={node.subtitle} onReturn={quitToMenu} />;
        break;
      default:
        scene = <Loading />;
    }
  }

  return (
    <View style={styles.wrap}>
      {scene}
      <SceneOverlay
        visible={paused}
        icon="pause"
        title="Paused"
        subtitle={node && "objective" in node ? (node as any).objective : undefined}
        buttons={[
          { label: "Resume", icon: "play", onPress: () => setPaused(false), testID: "resume-button" },
          { label: "Quit to Menu", icon: "home", onPress: quitToMenu, variant: "ghost", testID: "quit-button" },
        ]}
      />
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.primary} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
        <Ionicons name="skull" size={16} color={theme.colors.textFaint} />
        <Text style={styles.loadingText}>Bhullok stirs…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  loadingText: { color: theme.colors.textFaint, fontSize: 14, fontWeight: "600" },
});
