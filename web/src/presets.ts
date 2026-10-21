export interface Preset {
  id: string;
  label: string;
  volumeCl: number;
  abvPercent: number;
  emoji: string;
}

export const PRESETS: Preset[] = [
  { id: "beer", label: "Bier", volumeCl: 33, abvPercent: 5, emoji: "🍺" },
  { id: "wine", label: "Wein", volumeCl: 15, abvPercent: 12, emoji: "🍷" },
  { id: "longdrink", label: "Longdrink", volumeCl: 25, abvPercent: 5, emoji: "🍹" },
  { id: "cocktail", label: "Cocktail", volumeCl: 15, abvPercent: 16, emoji: "🍸" },
  { id: "shot", label: "Schnaps", volumeCl: 4, abvPercent: 40, emoji: "🥃" },
  { id: "eggnog", label: "Eierpunsch", volumeCl: 30, abvPercent: 8, emoji: "🥛" }
];
