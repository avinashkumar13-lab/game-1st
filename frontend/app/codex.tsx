// =============================================================================
// CODEX / INVENTORY / SKILLS / STATS — pause-menu style progression screen.
// =============================================================================

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Sprite } from "@/src/game/components/Sprite";
import { StatBar } from "@/src/game/components/StatBar";
import { theme } from "@/src/game/config/theme";
import { ITEMS } from "@/src/game/data/items";
import { SKILLS, XP_PER_LEVEL } from "@/src/game/data/skills";
import { CODEX } from "@/src/game/data/story/codex";
import { WEAPONS } from "@/src/game/data/weapons";
import { useGame } from "@/src/game/state/GameProvider";

type Tab = "inventory" | "codex" | "skills" | "stats";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "inventory", label: "Gear", icon: "briefcase" },
  { id: "codex", label: "Codex", icon: "book" },
  { id: "skills", label: "Skills", icon: "git-branch" },
  { id: "stats", label: "Stats", icon: "stats-chart" },
];

export default function Codex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<Tab>("inventory");

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#0A0710", "#160D1E"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable testID="codex-back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Codex & Inventory</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              testID={`tab-${t.id}`}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons name={t.icon as any} size={16} color={active ? "#0B0A12" : theme.colors.textDim} />
              <Text style={[styles.tabText, active && { color: "#0B0A12" }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "inventory" && <InventoryTab state={state} />}
        {tab === "codex" && <CodexTab unlocked={state.codex} />}
        {tab === "skills" && (
          <SkillsTab
            state={state}
            onUnlock={(id) => {
              dispatch({ type: "UNLOCK_SKILL", skillId: id });
              showToast(`${SKILLS[id]?.name ?? "Skill"} unlocked!`);
            }}
          />
        )}
        {tab === "stats" && <StatsTab state={state} />}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function InventoryTab({ state }: { state: ReturnType<typeof useGame>["state"] }) {
  const weapons = state.weapons;
  const items = state.inventory;
  return (
    <View>
      <Section title="Weapons">
        {weapons.length === 0 ? (
          <Empty text="No weapons yet." />
        ) : (
          weapons.map((w) => {
            const def = WEAPONS[w.id];
            if (!def) return null;
            return (
              <Row key={w.id} assetId={def.assetId} title={def.name} subtitle={def.description}>
                {w.ammo !== null ? <Text style={styles.tagAmmo}>{w.ammo}/{def.magazine}</Text> : <Text style={styles.tagMelee}>MELEE</Text>}
              </Row>
            );
          })
        )}
      </Section>
      <Section title="Items">
        {items.length === 0 ? (
          <Empty text="Your pack is empty." />
        ) : (
          items.map((it) => {
            const def = ITEMS[it.id];
            if (!def) return null;
            return (
              <Row key={it.id} assetId={def.assetId} title={def.name} subtitle={def.description}>
                <Text style={styles.tagQty}>×{it.qty}</Text>
              </Row>
            );
          })
        )}
      </Section>
    </View>
  );
}

function CodexTab({ unlocked }: { unlocked: string[] }) {
  const cats = ["Lore", "Bestiary", "Equipment"] as const;
  const entries = unlocked.map((id) => CODEX[id]).filter(Boolean);
  if (entries.length === 0) return <Empty text="No codex entries discovered yet. Keep playing to reveal the lore of Bhullok." />;
  return (
    <View>
      {cats.map((cat) => {
        const list = entries.filter((e) => e.category === cat);
        if (list.length === 0) return null;
        return (
          <Section key={cat} title={cat}>
            {list.map((e) => (
              <View key={e.id} style={styles.codexCard}>
                <Text style={styles.codexTitle}>{e.title}</Text>
                <Text style={styles.codexBody}>{e.body}</Text>
              </View>
            ))}
          </Section>
        );
      })}
    </View>
  );
}

function SkillsTab({ state, onUnlock }: { state: ReturnType<typeof useGame>["state"]; onUnlock: (id: string) => void }) {
  const branches = ["gun", "blade", "body"] as const;
  const branchName = { gun: "Gunplay", blade: "Blade", body: "Body" };
  return (
    <View>
      <View style={styles.pointsBar}>
        <Ionicons name="star" size={16} color={theme.colors.primary} />
        <Text style={styles.pointsText}>{state.player.skillPoints} skill point{state.player.skillPoints === 1 ? "" : "s"} available</Text>
      </View>
      {branches.map((br) => (
        <Section key={br} title={branchName[br]}>
          {Object.values(SKILLS)
            .filter((s) => s.branch === br)
            .map((s) => {
              const owned = state.player.unlockedSkills.includes(s.id);
              const reqOk = (s.requires ?? []).every((r) => state.player.unlockedSkills.includes(r));
              const affordable = state.player.skillPoints >= s.cost;
              const canUnlock = !owned && reqOk && affordable;
              return (
                <View key={s.id} style={styles.skillCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    <Text style={styles.skillDesc}>{s.description}</Text>
                    {!reqOk && <Text style={styles.skillReq}>Requires: {(s.requires ?? []).map((r) => SKILLS[r]?.name).join(", ")}</Text>}
                  </View>
                  {owned ? (
                    <View style={styles.ownedTag}>
                      <Ionicons name="checkmark" size={14} color={theme.colors.success} />
                      <Text style={styles.ownedText}>Owned</Text>
                    </View>
                  ) : (
                    <Pressable
                      testID={`unlock-${s.id}`}
                      disabled={!canUnlock}
                      onPress={() => onUnlock(s.id)}
                      style={[styles.unlockBtn, !canUnlock && { opacity: 0.4 }]}
                    >
                      <Text style={styles.unlockText}>Unlock ({s.cost})</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
        </Section>
      ))}
    </View>
  );
}

function StatsTab({ state }: { state: ReturnType<typeof useGame>["state"] }) {
  const xpNeeded = state.player.level * XP_PER_LEVEL;
  const rows = [
    { icon: "heart", label: "Max HP", value: state.player.maxHp },
    { icon: "ribbon", label: "Level", value: state.player.level },
    { icon: "skull", label: "Bats slain", value: state.stats.batsKilled },
    { icon: "flame", label: "Monsters slain", value: state.stats.monstersKilled },
    { icon: "trophy", label: "Boss defeated", value: state.stats.bossDefeated ? "Yes" : "No" },
    { icon: "refresh", label: "Deaths", value: state.stats.deaths },
    { icon: "flag", label: "Checkpoint", value: state.checkpointName },
  ];
  return (
    <View>
      <View style={styles.heroCard}>
        <Sprite assetId="char_player" x={34} y={34} size={52} />
        <View style={{ marginLeft: 44, flex: 1 }}>
          <Text style={styles.heroName}>Son of Yamraj</Text>
          <View style={{ marginTop: 8 }}>
            <StatBar value={state.player.hp} max={state.player.maxHp} color={theme.colors.hp} label="HP" showNumbers height={12} />
          </View>
          <View style={{ marginTop: 8 }}>
            <StatBar value={state.player.xp} max={xpNeeded} color={theme.colors.primary} label={`XP (Lv ${state.player.level})`} showNumbers height={8} />
          </View>
        </View>
      </View>
      <Section title="Record">
        {rows.map((r) => (
          <View key={r.label} style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name={r.icon as any} size={16} color={theme.colors.primary} />
              <Text style={styles.statLabel}>{r.label}</Text>
            </View>
            <Text style={styles.statValue}>{r.value}</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

function Row({ assetId, title, subtitle, children }: { assetId: string; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Sprite assetId={assetId} x={24} y={24} size={38} />
      </View>
      <View style={{ flex: 1, marginLeft: 6 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="cube-outline" size={26} color={theme.colors.textFaint} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0A0710" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 10 },
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
  tabs: { flexDirection: "row", paddingHorizontal: 14, gap: 8, marginBottom: 4 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: "#F0D27A" },
  tabText: { color: theme.colors.textDim, fontSize: 12, fontWeight: "800" },
  sectionTitle: { color: theme.colors.primary, fontSize: 13, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  rowIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  rowSub: { color: theme.colors.textDim, fontSize: 12, fontWeight: "500", marginTop: 2 },
  tagAmmo: { color: theme.colors.ammo, fontSize: 13, fontWeight: "800" },
  tagMelee: { color: theme.colors.primary, fontSize: 11, fontWeight: "800" },
  tagQty: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  codexCard: {
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  codexTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  codexBody: { color: theme.colors.textDim, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  pointsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primaryDim,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 18,
  },
  pointsText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 10,
  },
  skillName: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  skillDesc: { color: theme.colors.textDim, fontSize: 12, fontWeight: "500", marginTop: 2 },
  skillReq: { color: theme.colors.warn, fontSize: 11, fontWeight: "600", marginTop: 4 },
  unlockBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  unlockText: { color: "#0B0A12", fontSize: 12, fontWeight: "800" },
  ownedTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  ownedText: { color: theme.colors.success, fontSize: 12, fontWeight: "800" },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  heroName: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(28,25,48,0.6)",
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { color: theme.colors.textDim, fontSize: 14, fontWeight: "600" },
  statValue: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
  empty: { alignItems: "center", padding: 30, gap: 10 },
  emptyText: { color: theme.colors.textFaint, fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 19 },
});
