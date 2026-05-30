import type { CarModel, TweakSettings } from "./types";

export const ACCENT_COLORS = [
  "#7CFF6B",
  "#00E5FF",
  "#FFD166",
  "#FF5C8A",
  "#A78BFA",
];

export const TWEAK_DEFAULTS: TweakSettings = {
  accent: "#7CFF6B",
  headline: "KERETA YANG SESUAI IKUT GAJI",
  subtitle: "Jom semak kelayakan anda",
  campaignTag: "REBATE BULAN MEI",
  salary: 2600,
  displayMode: "glow",
  bgBlur: true,
};

export const DEFAULT_ROWS: CarModel[] = [
  { id: 1, model: "AXIA",  min: 1500, variants: ["E (MT)", "G", "X", "SE", "AV"] },
  { id: 2, model: "BEZZA", min: 1800, variants: ["1.0 G (MT)", "1.0 G", "1.3 X", "1.3 AV"] },
  { id: 3, model: "MYVI",  min: 2200, variants: ["1.3 G", "1.5 X", "1.5 H", "1.5 AV"] },
  { id: 4, model: "ALZA",  min: 2600, variants: ["1.5 X", "1.5 H"] },
  { id: 5, model: "ATIVA", min: 2800, variants: ["1.0 X", "1.0 H"] },
  { id: 6, model: "ARUZ",  min: 3000, variants: ["1.5 X"] },
];

export const STORAGE_KEYS = {
  TWEAKS: "lc:tweaks",
  ROWS: "lc:rows",
  LOGO: "lc:logo",
  BG: "lc:bg",
  ADMIN_WIDTH: "lc:adminWidth",
  DISPLAY_ORDER: "lc:displayOrder",
  SYNC_ORDER: "lc:syncOrder",
} as const;
