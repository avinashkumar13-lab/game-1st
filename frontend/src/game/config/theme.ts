// =============================================================================
// THEME / DESIGN TOKENS
// -----------------------------------------------------------------------------
// Central palette + spacing for the whole game. Change these to reskin the
// entire UI. Nothing here touches gameplay logic — pure presentation tokens.
// =============================================================================

export const theme = {
  colors: {
    bg: "#0B0A12",
    bgAlt: "#141221",
    surface: "#1C1930",
    surfaceAlt: "#262138",
    border: "#3A3357",
    borderSoft: "#2A2540",

    text: "#EDE9F5",
    textDim: "#9E97BE",
    textFaint: "#6C6690",

    primary: "#D4A82C", // mythic gold
    primaryDim: "#8A6E1B",
    primarySoft: "rgba(212,168,44,0.15)",

    danger: "#E23B4E",
    dangerDim: "#7D1F2A",
    success: "#37D67A",
    warn: "#F0B429",

    hp: "#37D67A",
    hpMid: "#F0B429",
    hpLow: "#E23B4E",
    ammo: "#4FA3FF",
    stagger: "#F0B429",
    block: "#4FA3FF",

    overlay: "rgba(6,5,12,0.88)",
    scrim: "rgba(6,5,12,0.55)",

    // --- placeholder entity palette (swap freely) ---
    player: "#4FA3FF",
    bat: "#8B5CF6",
    monster: "#E2683B",
    bull: "#B23A48",
    prop: "#4A7C59",
    neutral: "#5A5478",
  },

  spacing: (n: number) => n * 8,

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 999,
  },

  font: {
    // Swap here to change the whole game's typography.
    body: undefined as string | undefined,
    weightBold: "800" as const,
    weightSemi: "700" as const,
  },
} as const;

export type Theme = typeof theme;
