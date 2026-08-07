// =============================================================================
// MAPS & BACKDROPS (content data)
// -----------------------------------------------------------------------------
// Arena maps drive combat/explore scenes; backdrops drive dialogue framing.
// Props use normalized coords (0..1) so a map fits any screen size. Replace an
// arena = replace an entry; spawn logic reads bounds/props from here.
// =============================================================================

export interface ArenaProp {
  assetId: string;
  nx: number; // 0..1 across width
  ny: number; // 0..1 across height
  size?: number;
}

export interface ArenaMap {
  id: string;
  name: string;
  floor: string; // background tint
  grid: string; // subtle grid line color
  props: ArenaProp[];
}

export const MAPS: Record<string, ArenaMap> = {
  home_yard: {
    id: "home_yard",
    name: "Home — Back Yard",
    floor: "#12131C",
    grid: "#1E2030",
    props: [
      { assetId: "prop_home", nx: 0.5, ny: 0.12, size: 52 },
      { assetId: "prop_tree", nx: 0.16, ny: 0.72, size: 46 },
      { assetId: "prop_rock", nx: 0.84, ny: 0.6, size: 30 },
    ],
  },
  orchard: {
    id: "orchard",
    name: "The Old Orchard",
    floor: "#101A12",
    grid: "#182619",
    props: [{ assetId: "prop_rock", nx: 0.75, ny: 0.3, size: 26 }],
  },
  woods: {
    id: "woods",
    name: "Dark Woods",
    floor: "#0E1410",
    grid: "#17211A",
    props: [
      { assetId: "prop_tree", nx: 0.22, ny: 0.25, size: 40 },
      { assetId: "prop_tree", nx: 0.8, ny: 0.35, size: 40 },
      { assetId: "prop_tree", nx: 0.35, ny: 0.8, size: 40 },
    ],
  },
  camp: {
    id: "camp",
    name: "Monster Camp",
    floor: "#160F14",
    grid: "#241722",
    props: [
      { assetId: "prop_fire", nx: 0.5, ny: 0.5, size: 40 },
      { assetId: "prop_rock", nx: 0.2, ny: 0.28, size: 28 },
      { assetId: "prop_rock", nx: 0.82, ny: 0.72, size: 28 },
    ],
  },
  arena: {
    id: "arena",
    name: "Broken Clearing",
    floor: "#170F12",
    grid: "#271820",
    props: [
      { assetId: "prop_rock", nx: 0.12, ny: 0.2, size: 30 },
      { assetId: "prop_rock", nx: 0.88, ny: 0.24, size: 30 },
      { assetId: "prop_rock", nx: 0.5, ny: 0.86, size: 34 },
    ],
  },
};

export interface Backdrop {
  id: string;
  label: string;
  colors: [string, string];
}

export const BACKDROPS: Record<string, Backdrop> = {
  road: { id: "road", label: "A rain-slick road, midnight", colors: ["#0B0F1A", "#1A1020"] },
  bedroom: { id: "bedroom", label: "A small bedroom", colors: ["#12101C", "#241B2E"] },
  void: { id: "void", label: "A realm of endless dark", colors: ["#05040A", "#1B0F2A"] },
  passage: { id: "passage", label: "A hidden passage", colors: ["#0E0C16", "#2A2216"] },
  woods: { id: "woods", label: "The dark woods", colors: ["#0A100C", "#16241A"] },
  camp: { id: "camp", label: "A monster camp", colors: ["#140D12", "#2A1620"] },
  arena: { id: "arena", label: "A broken clearing", colors: ["#120A0E", "#2C1620"] },
  home_yard: { id: "home_yard", label: "The back yard", colors: ["#0C0D14", "#1B1D2A"] },
};
