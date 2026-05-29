export interface CarModel {
  id: number;
  model: string;
  min: number;
  variants: string[];
}

export interface TweakSettings {
  accent: string;
  headline: string;
  subtitle: string;
  campaignTag: string;
  salary: number;
  displayMode: "glow" | "flat";
  bgBlur: boolean;
}

export interface DashboardState {
  tweaks: TweakSettings;
  rows: CarModel[];
  logo: string | null;
  bg: string | null;
}

// Prepared for Supabase integration
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SavedSession {
  id: string;
  createdAt: string;
  state: DashboardState;
}
