// =============================================================================
// GunCombatScene — pistol vs bats. Auto-lock targeting, move / shoot / dodge.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { ArenaFloor } from "../components/ArenaFloor";
import { CombatHUD } from "../components/CombatHUD";
import { Joystick } from "../components/Joystick";
import { SceneOverlay } from "../components/SceneOverlay";
import { Sprite } from "../components/Sprite";
import { theme } from "../config/theme";
import { ENEMIES } from "../data/enemies";
import { MAPS } from "../data/maps";
import { WEAPONS } from "../data/weapons";
import { useGameLoop } from "../hooks/useGameLoop";
import { useGame } from "../state/GameProvider";
import { acquireLock } from "../systems/combat";
import { angleTo, clamp, dist, rand, Vec } from "../systems/vector";

const PLAYER_SIZE = 40;
const PLAYER_SPEED = 175;
const DODGE_SPEED = 460;
const DODGE_TIME = 0.28;
const DODGE_CD = 0.7;
const RELOAD_TIME = 1.3;

interface Bat {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  heading: number;
  wander: number;
  attackCd: number;
  flash: number;
}
interface Tracer {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
}
interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface GunSceneProps {
  mapId: string;
  objective: string;
  spawns: { enemyId: string; count: number }[];
  codex?: string[];
  onComplete: () => void;
  onDeath: () => void;
  onPause: () => void;
  paused: boolean;
}

export function GunCombatScene({ mapId, objective, spawns, codex, onComplete, onDeath, onPause, paused }: GunSceneProps) {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const map = MAPS[mapId] ?? MAPS.home_yard;
  const weapon = WEAPONS.pistol;
  const totalToKill = spawns.reduce((s, sp) => s + sp.count, 0);

  const dims = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const input = useRef<Vec>({ x: 0, y: 0 });
  const player = useRef({ x: 0, y: 0, facing: -Math.PI / 2, hp: state.player.hp, dodge: 0, dodgeCd: 0, dodgeDir: { x: 0, y: -1 } });
  const bats = useRef<Bat[]>([]);
  const tracers = useRef<Tracer[]>([]);
  const popups = useRef<Popup[]>([]);
  const ammo = useRef<number>(weapon.magazine ?? 8);
  const reload = useRef(0);
  const fireCd = useRef(0);
  const killed = useRef(0);
  const lockId = useRef<string | null>(null);
  const finished = useRef(false);
  const uid = useRef(1);
  const [, force] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const addPopup = (x: number, y: number, text: string, color: string) => {
    popups.current.push({ id: uid.current++, x, y, text, color, life: 0.8 });
  };

  const setup = (w: number, h: number) => {
    dims.current = { w, h };
    player.current.x = w / 2;
    player.current.y = h * 0.72;
    const list: Bat[] = [];
    spawns.forEach((sp) => {
      const def = ENEMIES[sp.enemyId];
      for (let i = 0; i < sp.count; i++) {
        list.push({
          id: `bat_${uid.current++}`,
          x: rand(w * 0.15, w * 0.85),
          y: rand(h * 0.12, h * 0.4),
          hp: def.maxHp,
          maxHp: def.maxHp,
          heading: rand(0, Math.PI * 2),
          wander: rand(0.4, 1.2),
          attackCd: rand(0.6, 1.6),
          flash: 0,
        });
      }
    });
    bats.current = list;
    setReady(true);
  };

  const win = () => {
    finished.current = true;
    let xp = 0;
    spawns.forEach((sp) => (xp += (ENEMIES[sp.enemyId]?.xp ?? 0) * sp.count));
    dispatch({ type: "SET_PLAYER_HP", hp: player.current.hp });
    dispatch({ type: "GAIN_XP", amount: xp });
    for (let i = 0; i < totalToKill; i++) dispatch({ type: "ADD_KILL", kind: "bat" });
    if (codex?.length) dispatch({ type: "UNLOCK_CODEX", ids: codex });
    setResult("win");
  };

  const lose = () => {
    finished.current = true;
    setResult("lose");
  };

  useGameLoop((dt) => {
    if (!ready || finished.current || paused) return;
    const { w, h } = dims.current;
    const p = player.current;

    // timers
    if (fireCd.current > 0) fireCd.current -= dt;
    if (p.dodgeCd > 0) p.dodgeCd -= dt;
    if (reload.current > 0) {
      reload.current -= dt;
      if (reload.current <= 0) ammo.current = weapon.magazine ?? 8;
    }

    // movement
    const inp = input.current;
    const mag = Math.hypot(inp.x, inp.y);
    if (p.dodge > 0) {
      p.dodge -= dt;
      p.x = clamp(p.x + p.dodgeDir.x * DODGE_SPEED * dt, PLAYER_SIZE / 2, w - PLAYER_SIZE / 2);
      p.y = clamp(p.y + p.dodgeDir.y * DODGE_SPEED * dt, PLAYER_SIZE / 2, h - PLAYER_SIZE / 2);
    } else if (mag > 0.15) {
      p.x = clamp(p.x + inp.x * PLAYER_SPEED * dt, PLAYER_SIZE / 2, w - PLAYER_SIZE / 2);
      p.y = clamp(p.y + inp.y * PLAYER_SPEED * dt, PLAYER_SIZE / 2, h - PLAYER_SIZE / 2);
      p.facing = Math.atan2(inp.y, inp.x);
    }

    // auto-lock nearest bat, face it when idle
    const live = bats.current.filter((b) => b.hp > 0);
    lockId.current = acquireLock(p.x, p.y, live, weapon.lockRange ?? 240);
    if (lockId.current && mag <= 0.15) {
      const t = bats.current.find((b) => b.id === lockId.current);
      if (t) p.facing = angleTo(p.x, p.y, t.x, t.y);
    }

    // bats AI
    const def = ENEMIES.bat;
    for (const b of bats.current) {
      if (b.hp <= 0) continue;
      if (b.flash > 0) b.flash -= dt;
      b.wander -= dt;
      if (b.wander <= 0) {
        b.wander = rand(0.4, 1.1);
        const toP = angleTo(b.x, b.y, p.x, p.y);
        b.heading = Math.random() < 0.45 ? toP + rand(-0.5, 0.5) : rand(0, Math.PI * 2);
      }
      b.x += Math.cos(b.heading) * def.speed * dt;
      b.y += Math.sin(b.heading) * def.speed * dt;
      if (b.x < 18 || b.x > w - 18) {
        b.heading = Math.PI - b.heading;
        b.x = clamp(b.x, 18, w - 18);
      }
      if (b.y < 18 || b.y > h - 18) {
        b.heading = -b.heading;
        b.y = clamp(b.y, 18, h - 18);
      }
      b.attackCd -= dt;
      const d = dist(b.x, b.y, p.x, p.y);
      if (d < PLAYER_SIZE / 2 + def.size / 2 + 4 && b.attackCd <= 0 && p.dodge <= 0) {
        b.attackCd = 1.3;
        p.hp = Math.max(0, p.hp - def.contactDamage);
        addPopup(p.x, p.y - 24, `-${def.contactDamage}`, theme.colors.danger);
        if (p.hp <= 0) {
          lose();
          return;
        }
      }
    }

    // tracers & popups decay
    tracers.current = tracers.current.filter((t) => (t.life -= dt) > 0);
    popups.current = popups.current.filter((pp) => (pp.life -= dt) > 0);
    for (const pp of popups.current) pp.y -= dt * 26;

    force((n) => (n + 1) % 1000000);
  }, paused || !ready || result !== null);

  const shoot = () => {
    if (finished.current || paused) return;
    if (reload.current > 0 || fireCd.current > 0) return;
    if (ammo.current <= 0) return;
    const p = player.current;
    const t = bats.current.find((b) => b.id === lockId.current && b.hp > 0);
    if (!t) return;
    ammo.current -= 1;
    fireCd.current = weapon.fireCooldown ?? 0.32;
    tracers.current.push({ id: uid.current++, x1: p.x, y1: p.y, x2: t.x, y2: t.y, life: 0.12 });
    t.hp -= weapon.bulletDamage ?? 10;
    t.flash = 0.12;
    addPopup(t.x, t.y - 20, `-${weapon.bulletDamage ?? 10}`, theme.colors.ammo);
    if (t.hp <= 0) {
      killed.current += 1;
      if (killed.current >= totalToKill) win();
    }
  };

  const doReload = () => {
    if (reload.current > 0 || ammo.current >= (weapon.magazine ?? 8)) return;
    reload.current = RELOAD_TIME;
  };

  const doDodge = () => {
    const p = player.current;
    if (p.dodge > 0 || p.dodgeCd > 0) return;
    const inp = input.current;
    const mag = Math.hypot(inp.x, inp.y);
    p.dodgeDir = mag > 0.15 ? { x: inp.x / mag, y: inp.y / mag } : { x: Math.cos(p.facing), y: Math.sin(p.facing) };
    p.dodge = DODGE_TIME;
    p.dodgeCd = DODGE_CD;
  };

  const p = player.current;
  const lockedBat = bats.current.find((b) => b.id === lockId.current && b.hp > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.field} onLayout={(e) => { if (!ready) setup(e.nativeEvent.layout.width, e.nativeEvent.layout.height); }}>
        <ArenaFloor map={map} width={dims.current.w} height={dims.current.h} />

        {/* tracers */}
        {tracers.current.map((t) => {
          const len = dist(t.x1, t.y1, t.x2, t.y2);
          const ang = (Math.atan2(t.y2 - t.y1, t.x2 - t.x1) * 180) / Math.PI;
          return (
            <View
              key={t.id}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: t.x1,
                top: t.y1 - 1,
                width: len,
                height: 2,
                backgroundColor: theme.colors.ammo,
                opacity: t.life / 0.12,
                transform: [{ translateX: 0 }, { rotateZ: `${ang}deg` }],
                transformOrigin: "left center",
              }}
            />
          );
        })}

        {ready &&
          bats.current.map((b) =>
            b.hp > 0 ? (
              <Sprite
                key={b.id}
                assetId="enm_bat"
                x={b.x}
                y={b.y}
                size={ENEMIES.bat.size}
                hpRatio={b.hp / b.maxHp}
                flash={b.flash > 0}
                highlight={b.id === lockId.current ? theme.colors.danger : undefined}
              />
            ) : null,
          )}

        {/* crosshair on lock */}
        {ready && lockedBat && (
          <View pointerEvents="none" style={[styles.crosshair, { left: lockedBat.x - 16, top: lockedBat.y - 16 }]}>
            <Ionicons name="scan" size={32} color={theme.colors.danger} />
          </View>
        )}

        {ready && <Sprite assetId="char_player" x={p.x} y={p.y} size={PLAYER_SIZE} facing={p.facing} opacity={p.dodge > 0 ? 0.6 : 1} />}

        {/* damage popups */}
        {popups.current.map((pp) => (
          <Text
            key={pp.id}
            pointerEvents="none"
            style={[styles.popup, { left: pp.x - 20, top: pp.y - 10, color: pp.color, opacity: pp.life / 0.8 }]}
          >
            {pp.text}
          </Text>
        ))}
      </View>

      <CombatHUD
        objective={objective}
        hp={p.hp}
        maxHp={state.player.maxHp}
        ammo={ammo.current}
        magazine={weapon.magazine}
        progressLabel={`${killed.current} / ${totalToKill}`}
        onPause={onPause}
      />

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Joystick testID="gun-joystick" onChange={(v) => (input.current = v)} />
        <View style={styles.actions}>
          <ActionButton testID="dodge-button" icon="footsteps" iconFamily="ion" label="Dodge" color={theme.colors.text} size={60} onPress={doDodge} />
          {ammo.current <= 0 || reload.current > 0 ? (
            <ActionButton
              testID="reload-button"
              icon="reload"
              iconFamily="ion"
              label={reload.current > 0 ? "…" : "Reload"}
              color={theme.colors.warn}
              size={72}
              onPress={doReload}
              disabled={reload.current > 0}
            />
          ) : (
            <ActionButton
              testID="fire-button"
              icon="pistol"
              iconFamily="mci"
              label="Fire"
              color={theme.colors.ammo}
              size={84}
              badge={ammo.current}
              onPress={shoot}
              disabled={!lockedBat}
            />
          )}
        </View>
      </View>

      <SceneOverlay
        visible={result === "win"}
        icon="checkmark-circle"
        iconColor={theme.colors.success}
        title="Threat Cleared"
        subtitle="The bats fall silent."
        buttons={[{ label: "Continue", icon: "arrow-forward", onPress: onComplete, testID: "win-continue-button" }]}
      />
      <SceneOverlay
        visible={result === "lose"}
        icon="skull"
        iconColor={theme.colors.danger}
        title="You Died"
        subtitle="Respawning at the last checkpoint…"
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
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginBottom: 6 },
  crosshair: { position: "absolute" },
  popup: { position: "absolute", fontSize: 15, fontWeight: "800", width: 40, textAlign: "center" },
});
