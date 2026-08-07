// =============================================================================
// MeleeCombatScene — Ancient Knife vs disguised monsters.
// Light / Heavy attacks, Dodge (i-frames), Block, and timing-based Counter.
// =============================================================================

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
import { inMeleeArc } from "../systems/combat";
import { angleTo, clamp, dist, rand, Vec } from "../systems/vector";

const PLAYER_SIZE = 42;
const PLAYER_SPEED = 168;
const DODGE_SPEED = 470;
const DODGE_TIME = 0.3;
const DODGE_CD = 0.65;
const COUNTER_WINDOW = 0.32; // press block just before a strike lands = parry
const BLOCK_CHIP = 4;
const MAX_ATTACKERS = 2;

type MState = "approach" | "windup" | "strike" | "recover" | "stagger";
interface Monster {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: MState;
  timer: number;
  flash: number;
  attacking: boolean;
}
interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface MeleeSceneProps {
  mapId: string;
  objective: string;
  spawns: { enemyId: string; count: number }[];
  codex?: string[];
  onComplete: () => void;
  onDeath: () => void;
  onPause: () => void;
  paused: boolean;
}

export function MeleeCombatScene({ mapId, objective, spawns, codex, onComplete, onDeath, onPause, paused }: MeleeSceneProps) {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const map = MAPS[mapId] ?? MAPS.camp;
  const weapon = WEAPONS.ancient_knife;
  const def = ENEMIES.monster_human;
  const totalToKill = spawns.reduce((s, sp) => s + sp.count, 0);

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
  const monsters = useRef<Monster[]>([]);
  const popups = useRef<Popup[]>([]);
  const killed = useRef(0);
  const finished = useRef(false);
  const uid = useRef(1);
  const [, force] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const addPopup = (x: number, y: number, text: string, color: string) => {
    popups.current.push({ id: uid.current++, x, y, text, color, life: 0.85 });
  };

  const setup = (w: number, h: number) => {
    dims.current = { w, h };
    player.current.x = w / 2;
    player.current.y = h * 0.72;
    const list: Monster[] = [];
    for (let i = 0; i < totalToKill; i++) {
      const ang = (i / totalToKill) * Math.PI * 2;
      list.push({
        id: `m_${uid.current++}`,
        x: clamp(w / 2 + Math.cos(ang) * w * 0.38, 40, w - 40),
        y: clamp(h * 0.32 + Math.sin(ang) * h * 0.18, 40, h - 40),
        hp: def.maxHp,
        maxHp: def.maxHp,
        state: "approach",
        timer: rand(0.2, 1.2),
        flash: 0,
        attacking: false,
      });
    }
    monsters.current = list;
    setReady(true);
  };

  const win = () => {
    finished.current = true;
    dispatch({ type: "SET_PLAYER_HP", hp: player.current.hp });
    dispatch({ type: "GAIN_XP", amount: def.xp * totalToKill });
    for (let i = 0; i < totalToKill; i++) dispatch({ type: "ADD_KILL", kind: "monster" });
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

    if (p.attackCd > 0) p.attackCd -= dt;
    if (p.dodgeCd > 0) p.dodgeCd -= dt;
    if (p.swing > 0) p.swing -= dt;
    if (p.blocking) p.blockTimer += dt;

    // movement
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
    }

    const live = monsters.current.filter((m) => m.hp > 0);
    // auto-face nearest when idle
    if (mag <= 0.15 && live.length) {
      let nearest = live[0];
      let nd = Infinity;
      for (const m of live) {
        const d = dist(p.x, p.y, m.x, m.y);
        if (d < nd) {
          nd = d;
          nearest = m;
        }
      }
      p.facing = angleTo(p.x, p.y, nearest.x, nearest.y);
    }

    // limit simultaneous attackers
    let attackers = live.filter((m) => m.attacking).length;

    for (const m of monsters.current) {
      if (m.hp <= 0) continue;
      if (m.flash > 0) m.flash -= dt;
      m.timer -= dt;
      const d = dist(m.x, m.y, p.x, p.y);
      const reach = PLAYER_SIZE / 2 + def.size / 2 + 10;

      if (m.state === "stagger") {
        if (m.timer <= 0) {
          m.state = "recover";
          m.timer = 0.4;
        }
        continue;
      }

      if (m.state === "approach") {
        m.attacking = false;
        if (d > reach) {
          const a = angleTo(m.x, m.y, p.x, p.y);
          m.x += Math.cos(a) * def.speed * dt;
          m.y += Math.sin(a) * def.speed * dt;
        } else if (m.timer <= 0 && attackers < MAX_ATTACKERS) {
          m.state = "windup";
          m.timer = 0.55;
          m.attacking = true;
          attackers += 1;
        }
      } else if (m.state === "windup") {
        if (m.timer <= 0) {
          m.state = "strike";
          m.timer = 0.16;
          // resolve strike
          if (d < reach + 8) {
            if (p.dodge > 0) {
              addPopup(p.x, p.y - 26, "DODGE", theme.colors.ammo);
            } else if (p.blocking && p.blockTimer <= COUNTER_WINDOW) {
              // PARRY / counter
              m.state = "stagger";
              m.timer = 1.4;
              m.hp -= 12;
              m.flash = 0.15;
              addPopup(m.x, m.y - 26, "PARRY!", theme.colors.stagger);
              if (m.hp <= 0) {
                killed.current += 1;
                if (killed.current >= totalToKill) return win();
              }
            } else if (p.blocking) {
              p.hp = Math.max(0, p.hp - BLOCK_CHIP);
              addPopup(p.x, p.y - 26, `-${BLOCK_CHIP}`, theme.colors.block);
            } else {
              p.hp = Math.max(0, p.hp - def.contactDamage);
              addPopup(p.x, p.y - 26, `-${def.contactDamage}`, theme.colors.danger);
              if (p.hp <= 0) return lose();
            }
          }
        }
      } else if (m.state === "strike") {
        if (m.timer <= 0) {
          m.state = "recover";
          m.timer = 0.7;
        }
      } else if (m.state === "recover") {
        m.attacking = false;
        if (m.timer <= 0) {
          m.state = "approach";
          m.timer = rand(0.4, 1.2);
        }
      }
    }

    popups.current = popups.current.filter((pp) => (pp.life -= dt) > 0);
    for (const pp of popups.current) pp.y -= dt * 24;

    force((n) => (n + 1) % 1000000);
  }, paused || !ready || result !== null);

  const attack = (heavy: boolean) => {
    const p = player.current;
    if (finished.current || paused || p.attackCd > 0 || p.dodge > 0) return;
    p.attackCd = heavy ? (weapon.heavyCooldown ?? 0.7) : (weapon.lightCooldown ?? 0.34);
    p.swing = 0.18;
    p.swingHeavy = heavy;
    const dmg = heavy ? weapon.heavyDamage ?? 25 : weapon.lightDamage ?? 10;
    const range = (weapon.range ?? 74) + (heavy ? 8 : 0);
    let hitAny = false;
    for (const m of monsters.current) {
      if (m.hp <= 0) continue;
      if (inMeleeArc(p.x, p.y, p.facing, m.x, m.y, range)) {
        const bonus = m.state === "stagger" ? Math.round(dmg * 0.5) : 0;
        const total = dmg + bonus;
        m.hp -= total;
        m.flash = 0.14;
        addPopup(m.x, m.y - 24, `-${total}`, bonus ? theme.colors.stagger : theme.colors.text);
        hitAny = true;
        if (m.hp <= 0) {
          killed.current += 1;
          if (killed.current >= totalToKill) return win();
        }
      }
    }
    if (!hitAny) addPopup(p.x + Math.cos(p.facing) * 40, p.y + Math.sin(p.facing) * 40, "miss", theme.colors.textFaint);
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
      p.dodgeDirX = Math.cos(p.facing);
      p.dodgeDirY = Math.sin(p.facing);
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
  const swingLen = weapon.range ?? 74;

  return (
    <View style={styles.wrap}>
      <View style={styles.field} onLayout={(e) => { if (!ready) setup(e.nativeEvent.layout.width, e.nativeEvent.layout.height); }}>
        <ArenaFloor map={map} width={dims.current.w} height={dims.current.h} />

        {ready &&
          monsters.current.map((m) =>
            m.hp > 0 ? (
              <Sprite
                key={m.id}
                assetId="enm_monster"
                x={m.x}
                y={m.y}
                size={def.size}
                hpRatio={m.hp / m.maxHp}
                flash={m.flash > 0}
                highlight={
                  m.state === "stagger"
                    ? theme.colors.stagger
                    : m.state === "windup"
                      ? theme.colors.warn
                      : m.state === "strike"
                        ? theme.colors.danger
                        : undefined
                }
              />
            ) : null,
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
            style={[styles.popup, { left: pp.x - 24, top: pp.y - 10, color: pp.color, opacity: pp.life / 0.85 }]}
          >
            {pp.text}
          </Text>
        ))}
      </View>

      <CombatHUD
        objective={objective}
        hp={p.hp}
        maxHp={state.player.maxHp}
        progressLabel={`${killed.current} / ${totalToKill}`}
        onPause={onPause}
      />

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Joystick testID="melee-joystick" onChange={(v) => (input.current = v)} />
        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <ActionButton testID="block-button" icon="shield" iconFamily="ion" label="Block/Parry" color={theme.colors.block} size={60} onHoldChange={setBlock} />
            <ActionButton testID="dodge-button" icon="footsteps" iconFamily="ion" label="Dodge" color={theme.colors.text} size={60} onPress={doDodge} />
          </View>
          <View style={styles.actionCol}>
            <ActionButton testID="heavy-button" icon="flash" iconFamily="ion" label="Heavy" color={theme.colors.primary} size={66} onPress={() => attack(true)} />
            <ActionButton testID="light-button" icon="knife" iconFamily="mci" label="Light" color="#DCE6FF" size={84} onPress={() => attack(false)} />
          </View>
        </View>
      </View>

      <SceneOverlay
        visible={result === "win"}
        icon="checkmark-circle"
        iconColor={theme.colors.success}
        title="Ambush Survived"
        subtitle="The disguised monsters are ash."
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
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 6 },
  actionCol: { alignItems: "center", gap: 12 },
  popup: { position: "absolute", fontSize: 15, fontWeight: "800", width: 48, textAlign: "center" },
});
