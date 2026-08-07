// =============================================================================
// BossScene — Bull-Headed Behemoth. Charge / Area / Combo / Normal patterns,
// stagger system, and weak-spot (head) damage when vulnerable.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { ArenaFloor } from "../components/ArenaFloor";
import { CombatHUD } from "../components/CombatHUD";
import { Joystick } from "../components/Joystick";
import { SceneOverlay } from "../components/SceneOverlay";
import { Sprite } from "../components/Sprite";
import { StatBar } from "../components/StatBar";
import { theme } from "../config/theme";
import { BOSS_HIT_ZONES, ENEMIES } from "../data/enemies";
import { MAPS } from "../data/maps";
import { WEAPONS } from "../data/weapons";
import { useGameLoop } from "../hooks/useGameLoop";
import { useGame } from "../state/GameProvider";
import { inMeleeArc } from "../systems/combat";
import { angleTo, clamp, dist, rand, Vec } from "../systems/vector";

const PLAYER_SIZE = 42;
const PLAYER_SPEED = 175;
const DODGE_SPEED = 500;
const DODGE_TIME = 0.32;
const DODGE_CD = 0.6;
const COUNTER_WINDOW = 0.34;
const BLOCK_DMG = 5; // blocked boss hit
const HIT_DMG = 20; // unblocked boss hit
const STAGGER_MAX = 100;
const STAGGER_DUR = 3.2;

type BState = "idle" | "tele_charge" | "charge" | "tele_area" | "area" | "tele_combo" | "combo" | "tele_normal" | "normal" | "recover" | "stagger";

interface BossSceneProps {
  mapId: string;
  objective: string;
  bossId: string;
  codex?: string[];
  onComplete: () => void;
  onDeath: () => void;
  onPause: () => void;
  paused: boolean;
}

export function BossScene({ mapId, objective, bossId, codex, onComplete, onDeath, onPause, paused }: BossSceneProps) {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const map = MAPS[mapId] ?? MAPS.arena;
  const weapon = WEAPONS.ancient_knife;
  const def = ENEMIES[bossId] ?? ENEMIES.bull_boss;

  const dims = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const input = useRef<Vec>({ x: 0, y: 0 });

  const player = useRef({
    x: 0,
    y: 0,
    facing: -Math.PI / 2,
    hp: state.player.hp,
    dodge: 0,
    dodgeCd: 0,
    blocking: false,
    blockTimer: 99,
    attackCd: 0,
    swing: 0,
    swingHeavy: false,
    dodgeDirX: 0,
    dodgeDirY: -1,
  });

  const boss = useRef({
    x: 0,
    y: 0,
    hp: def.maxHp,
    state: "idle" as BState,
    timer: 1.2,
    vulnerable: false,
    stagger: 0,
    flash: 0,
    dirX: 0,
    dirY: 1,
    areaR: 0,
    areaMax: 190,
    combo: 0,
    hitDone: false,
    facing: Math.PI / 2,
  });

  const popups = useRef<{ id: number; x: number; y: number; text: string; color: string; life: number }[]>([]);
  const finished = useRef(false);
  const uid = useRef(1);
  const [, force] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const addPopup = (x: number, y: number, text: string, color: string) => {
    popups.current.push({ id: uid.current++, x, y, text, color, life: 0.9 });
  };

  const setup = (w: number, h: number) => {
    dims.current = { w, h };
    player.current.x = w / 2;
    player.current.y = h * 0.78;
    boss.current.x = w / 2;
    boss.current.y = h * 0.28;
    setReady(true);
  };

  const win = () => {
    finished.current = true;
    dispatch({ type: "SET_PLAYER_HP", hp: player.current.hp });
    dispatch({ type: "GAIN_XP", amount: def.xp });
    dispatch({ type: "SET_BOSS_DEFEATED" });
    if (codex?.length) dispatch({ type: "UNLOCK_CODEX", ids: codex });
    setResult("win");
  };
  const lose = () => {
    finished.current = true;
    setResult("lose");
  };

  const addStagger = (amt: number) => {
    const b = boss.current;
    if (b.state === "stagger") return;
    b.stagger = clamp(b.stagger + amt, 0, STAGGER_MAX);
    if (b.stagger >= STAGGER_MAX) {
      b.stagger = 0;
      b.state = "stagger";
      b.timer = STAGGER_DUR;
      b.vulnerable = true;
      b.hitDone = false;
      setWarning(null);
      addPopup(b.x, b.y - def.size / 2 - 10, "STAGGERED!", theme.colors.stagger);
    }
  };

  const bossHitPlayer = (raw: number, tag: string) => {
    const p = player.current;
    if (p.dodge > 0) {
      addPopup(p.x, p.y - 26, "DODGE", theme.colors.ammo);
      addStagger(18); // perfect dodge rewards stagger
      return;
    }
    if (p.blocking && p.blockTimer <= COUNTER_WINDOW) {
      addPopup(p.x, p.y - 26, "PARRY!", theme.colors.stagger);
      addStagger(40);
      return;
    }
    if (p.blocking) {
      p.hp = Math.max(0, p.hp - BLOCK_DMG);
      addPopup(p.x, p.y - 26, `-${BLOCK_DMG}`, theme.colors.block);
    } else {
      p.hp = Math.max(0, p.hp - raw);
      addPopup(p.x, p.y - 26, `-${raw}`, theme.colors.danger);
    }
    if (p.hp <= 0) lose();
  };

  useGameLoop((dt) => {
    if (!ready || finished.current || paused) return;
    const { w, h } = dims.current;
    const p = player.current;
    const b = boss.current;

    // player timers
    if (p.attackCd > 0) p.attackCd -= dt;
    if (p.dodgeCd > 0) p.dodgeCd -= dt;
    if (p.swing > 0) p.swing -= dt;
    if (b.flash > 0) b.flash -= dt;
    if (p.blocking) p.blockTimer += dt;

    // player movement
    const inp = input.current;
    const mag = Math.hypot(inp.x, inp.y);
    if (p.dodge > 0) {
      p.dodge -= dt;
      p.x = clamp(p.x + p.dodgeDirX * DODGE_SPEED * dt, PLAYER_SIZE / 2, w - PLAYER_SIZE / 2);
      p.y = clamp(p.y + p.dodgeDirY * DODGE_SPEED * dt, PLAYER_SIZE / 2, h - PLAYER_SIZE / 2);
    } else if (!p.blocking && mag > 0.15) {
      p.x = clamp(p.x + inp.x * PLAYER_SPEED * dt, PLAYER_SIZE / 2, w - PLAYER_SIZE / 2);
      p.y = clamp(p.y + inp.y * PLAYER_SPEED * dt, PLAYER_SIZE / 2, h - PLAYER_SIZE / 2);
      p.facing = Math.atan2(inp.y, inp.x);
    } else if (mag <= 0.15) {
      p.facing = angleTo(p.x, p.y, b.x, b.y);
    }

    b.facing = angleTo(b.x, b.y, p.x, p.y);
    b.timer -= dt;

    // -------- Boss state machine --------
    switch (b.state) {
      case "idle": {
        b.vulnerable = false;
        // drift slowly toward player
        const a = angleTo(b.x, b.y, p.x, p.y);
        b.x = clamp(b.x + Math.cos(a) * def.speed * 0.18 * dt, def.size / 2, w - def.size / 2);
        b.y = clamp(b.y + Math.sin(a) * def.speed * 0.18 * dt, def.size / 2, h - def.size / 2);
        if (b.timer <= 0) {
          const roll = Math.random();
          const near = dist(b.x, b.y, p.x, p.y) < 150;
          if (roll < 0.32) {
            b.state = "tele_charge";
            b.timer = 0.7;
            setWarning("CHARGE INCOMING — dodge sideways!");
          } else if (roll < 0.6) {
            b.state = "tele_area";
            b.timer = 0.85;
            b.areaR = 0;
            setWarning("SLAM — get out of the ring!");
          } else if (roll < 0.82 || near) {
            b.state = "tele_combo";
            b.timer = 0.55;
            b.combo = 0;
            setWarning("COMBO — block or dodge each hit!");
          } else {
            b.state = "tele_normal";
            b.timer = 0.6;
            setWarning("Swipe — block it.");
          }
        }
        break;
      }

      case "tele_charge":
        if (b.timer <= 0) {
          const a = angleTo(b.x, b.y, p.x, p.y);
          b.dirX = Math.cos(a);
          b.dirY = Math.sin(a);
          b.state = "charge";
          b.timer = 0.55;
          b.hitDone = false;
        }
        break;
      case "charge": {
        b.x = clamp(b.x + b.dirX * def.speed * 2.4 * dt, def.size / 2, w - def.size / 2);
        b.y = clamp(b.y + b.dirY * def.speed * 2.4 * dt, def.size / 2, h - def.size / 2);
        if (!b.hitDone && dist(b.x, b.y, p.x, p.y) < def.size / 2 + PLAYER_SIZE / 2) {
          b.hitDone = true;
          bossHitPlayer(HIT_DMG, "charge");
          if (finished.current) return;
        }
        if (b.timer <= 0) {
          b.state = "recover";
          b.timer = 1.6;
          b.vulnerable = true; // head exposed after a charge
          setWarning("Head exposed — STRIKE!");
        }
        break;
      }

      case "tele_area":
        b.areaR = (1 - Math.max(0, b.timer) / 0.85) * b.areaMax;
        if (b.timer <= 0) {
          b.state = "area";
          b.timer = 0.2;
          b.hitDone = false;
        }
        break;
      case "area":
        if (!b.hitDone) {
          b.hitDone = true;
          if (dist(b.x, b.y, p.x, p.y) <= b.areaMax) bossHitPlayer(HIT_DMG, "area");
          if (finished.current) return;
        }
        if (b.timer <= 0) {
          b.areaR = 0;
          b.state = "recover";
          b.timer = 0.9;
          setWarning(null);
        }
        break;

      case "tele_combo":
        if (b.timer <= 0) {
          b.state = "combo";
          b.timer = 0.3;
          b.hitDone = false;
        }
        break;
      case "combo": {
        // lunge toward player between swipes
        const a = angleTo(b.x, b.y, p.x, p.y);
        b.x = clamp(b.x + Math.cos(a) * def.speed * 0.9 * dt, def.size / 2, w - def.size / 2);
        b.y = clamp(b.y + Math.sin(a) * def.speed * 0.9 * dt, def.size / 2, h - def.size / 2);
        if (!b.hitDone && b.timer <= 0.14) {
          b.hitDone = true;
          if (dist(b.x, b.y, p.x, p.y) < def.size / 2 + PLAYER_SIZE / 2 + 14) bossHitPlayer(HIT_DMG, "combo");
          if (finished.current) return;
        }
        if (b.timer <= 0) {
          b.combo += 1;
          if (b.combo >= 3) {
            b.state = "recover";
            b.timer = 1.1;
            setWarning(null);
          } else {
            b.state = "combo";
            b.timer = 0.34;
            b.hitDone = false;
          }
        }
        break;
      }

      case "tele_normal":
        if (b.timer <= 0) {
          b.state = "normal";
          b.timer = 0.18;
          b.hitDone = false;
        }
        break;
      case "normal":
        if (!b.hitDone) {
          b.hitDone = true;
          if (dist(b.x, b.y, p.x, p.y) < def.size / 2 + PLAYER_SIZE / 2 + 18) bossHitPlayer(HIT_DMG, "normal");
          if (finished.current) return;
        }
        if (b.timer <= 0) {
          b.state = "recover";
          b.timer = 0.9;
          setWarning(null);
        }
        break;

      case "recover":
        if (b.timer <= 0) {
          b.state = "idle";
          b.timer = rand(0.7, 1.4);
          b.vulnerable = false;
          setWarning(null);
        }
        break;

      case "stagger":
        b.vulnerable = true;
        if (b.timer <= 0) {
          b.state = "idle";
          b.timer = 0.8;
          b.vulnerable = false;
        }
        break;
    }

    popups.current = popups.current.filter((pp) => (pp.life -= dt) > 0);
    for (const pp of popups.current) pp.y -= dt * 22;

    force((n) => (n + 1) % 1000000);
  }, paused || !ready || result !== null);

  const attack = (heavy: boolean) => {
    const p = player.current;
    const b = boss.current;
    if (finished.current || paused || p.attackCd > 0 || p.dodge > 0) return;
    p.attackCd = heavy ? weapon.heavyCooldown ?? 0.7 : weapon.lightCooldown ?? 0.34;
    p.swing = 0.18;
    p.swingHeavy = heavy;
    const range = (weapon.range ?? 74) + def.size / 2 + (heavy ? 10 : 0);
    if (inMeleeArc(p.x, p.y, p.facing, b.x, b.y, range, Math.PI / 1.6)) {
      const zone: "head" | "body" = b.vulnerable ? "head" : "body";
      const dmg = BOSS_HIT_ZONES[zone];
      b.hp = Math.max(0, b.hp - dmg);
      b.flash = 0.12;
      addPopup(b.x + rand(-18, 18), b.y - def.size / 2, `-${dmg}${zone === "head" ? " HEAD!" : ""}`, zone === "head" ? theme.colors.danger : theme.colors.text);
      addStagger(heavy ? 12 : 7);
      if (b.hp <= 0) return win();
    } else {
      addPopup(p.x + Math.cos(p.facing) * 40, p.y + Math.sin(p.facing) * 40, "miss", theme.colors.textFaint);
    }
  };

  const doDodge = () => {
    const p = player.current;
    if (p.dodge > 0 || p.dodgeCd > 0) return;
    const inp = input.current;
    const mag = Math.hypot(inp.x, inp.y);
    if (mag > 0.15) {
      p.dodgeDirX = inp.x / mag;
      p.dodgeDirY = inp.y / mag;
    } else {
      p.dodgeDirX = Math.cos(p.facing + Math.PI);
      p.dodgeDirY = Math.sin(p.facing + Math.PI);
    }
    p.dodge = DODGE_TIME;
    p.dodgeCd = DODGE_CD;
  };

  const setBlock = (held: boolean) => {
    const p = player.current;
    if (held && !p.blocking) p.blockTimer = 0;
    p.blocking = held;
  };

  const p = player.current;
  const b = boss.current;
  const swingLen = weapon.range ?? 74;
  const telegraphing = b.state.startsWith("tele_") || b.state === "charge" || b.state === "combo" || b.state === "normal" || b.state === "area";

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#120A0E", "#241016"]} style={StyleSheet.absoluteFill} />
      <View style={styles.field} onLayout={(e) => { if (!ready) setup(e.nativeEvent.layout.width, e.nativeEvent.layout.height); }}>
        <ArenaFloor map={map} width={dims.current.w} height={dims.current.h} />

        {/* area telegraph ring */}
        {ready && (b.state === "tele_area" || b.state === "area") && b.areaR > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: b.x - b.areaMax,
              top: b.y - b.areaMax,
              width: b.areaMax * 2,
              height: b.areaMax * 2,
              borderRadius: b.areaMax,
              borderWidth: 3,
              borderColor: theme.colors.danger,
              backgroundColor: "rgba(226,59,78,0.12)",
              opacity: b.state === "area" ? 0.9 : b.areaR / b.areaMax,
            }}
          />
        )}

        {/* charge telegraph line */}
        {ready && b.state === "tele_charge" && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: b.x,
              top: b.y - 2,
              width: 320,
              height: 4,
              backgroundColor: theme.colors.danger,
              opacity: 0.7,
              transform: [{ rotateZ: `${(b.facing * 180) / Math.PI}deg` }],
              transformOrigin: "left center",
            }}
          />
        )}

        {ready && (
          <Sprite
            assetId="enm_bull"
            x={b.x}
            y={b.y}
            size={def.size}
            hpRatio={undefined}
            flash={b.flash > 0}
            highlight={b.vulnerable ? theme.colors.stagger : telegraphing ? theme.colors.danger : undefined}
          />
        )}
        {ready && b.vulnerable && (
          <View pointerEvents="none" style={[styles.weakTag, { left: b.x - 26, top: b.y - def.size / 2 - 26 }]}>
            <Text style={styles.weakText}>HEAD</Text>
          </View>
        )}

        {/* swing arc */}
        {ready && p.swing > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: p.x,
              top: p.y - 3,
              width: swingLen,
              height: 6,
              borderRadius: 3,
              backgroundColor: p.swingHeavy ? theme.colors.primary : "#DCE6FF",
              opacity: p.swing / 0.18,
              transform: [{ rotateZ: `${(p.facing * 180) / Math.PI}deg` }],
              transformOrigin: "left center",
            }}
          />
        )}

        {ready && (
          <Sprite
            assetId="char_player"
            x={p.x}
            y={p.y}
            size={PLAYER_SIZE}
            facing={p.facing}
            opacity={p.dodge > 0 ? 0.55 : 1}
            highlight={p.blocking ? theme.colors.block : undefined}
          />
        )}

        {popups.current.map((pp) => (
          <Text
            key={pp.id}
            pointerEvents="none"
            style={[styles.popup, { left: pp.x - 40, top: pp.y - 10, color: pp.color, opacity: pp.life / 0.9 }]}
          >
            {pp.text}
          </Text>
        ))}
      </View>

      <CombatHUD objective={objective} hp={p.hp} maxHp={state.player.maxHp} onPause={onPause} />

      {/* boss bars */}
      <View style={[styles.bossBars, { top: insets.top + 74 }]} pointerEvents="none">
        <View style={styles.bossNameRow}>
          <Ionicons name="skull" size={14} color={theme.colors.bull} />
          <Text style={styles.bossName}>{def.name}</Text>
        </View>
        <StatBar testID="boss-hp-bar" value={b.hp} max={def.maxHp} color={theme.colors.bull} height={14} showNumbers />
        <View style={{ height: 6 }} />
        <StatBar testID="stagger-bar" value={b.stagger} max={STAGGER_MAX} color={theme.colors.stagger} height={7} label="Stagger" />
      </View>

      {warning && !result && (
        <View style={styles.warnBanner} pointerEvents="none">
          <Text style={styles.warnText}>{warning}</Text>
        </View>
      )}

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Joystick testID="boss-joystick" onChange={(v) => (input.current = v)} />
        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <ActionButton testID="block-button" icon="shield" iconFamily="ion" label="Block/Parry" color={theme.colors.block} size={58} onHoldChange={setBlock} />
            <ActionButton testID="dodge-button" icon="footsteps" iconFamily="ion" label="Dodge" color={theme.colors.text} size={58} onPress={doDodge} />
          </View>
          <View style={styles.actionCol}>
            <ActionButton testID="heavy-button" icon="flash" iconFamily="ion" label="Heavy" color={theme.colors.primary} size={64} onPress={() => attack(true)} />
            <ActionButton testID="light-button" icon="knife" iconFamily="mci" label="Light" color="#DCE6FF" size={82} onPress={() => attack(false)} />
          </View>
        </View>
      </View>

      <SceneOverlay
        visible={result === "win"}
        icon="trophy"
        iconColor={theme.colors.primary}
        title="The Behemoth Falls"
        subtitle="It crashes to one knee, breath ragged…"
        buttons={[{ label: "Continue", icon: "arrow-forward", onPress: onComplete, testID: "win-continue-button" }]}
      />
      <SceneOverlay
        visible={result === "lose"}
        icon="skull"
        iconColor={theme.colors.danger}
        title="You Died"
        subtitle="The beast was too much. Respawning before the fight…"
        buttons={[{ label: "Respawn", icon: "refresh", onPress: onDeath, variant: "danger", testID: "respawn-button" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  field: { flex: 1, overflow: "hidden" },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 6 },
  actionCol: { alignItems: "center", gap: 12 },
  popup: { position: "absolute", fontSize: 15, fontWeight: "800", width: 80, textAlign: "center" },
  bossBars: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: "rgba(14,10,16,0.7)",
    borderRadius: theme.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.dangerDim,
  },
  bossNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  bossName: { color: theme.colors.text, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  weakTag: { position: "absolute", backgroundColor: theme.colors.stagger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  weakText: { color: "#0B0A12", fontSize: 10, fontWeight: "800" },
  warnBanner: {
    position: "absolute",
    top: "42%",
    alignSelf: "center",
    backgroundColor: "rgba(226,59,78,0.16)",
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  warnText: { color: theme.colors.danger, fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
});
