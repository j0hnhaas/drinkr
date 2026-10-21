/**
 * drinkR's original R model, ported to TypeScript.
 * Source: shinylive_app/helper_functions.R (MIT, Rasmus Bååth 2014).
 * BAC mass fraction is multiplied by 1000 to display per mille (‰).
 * This is NOT a breath/blood test or a measure of fitness to drive.
 */
export type DistributionProfile = "male" | "female" | "unknown";

export interface Drink {
  id: string;
  type: string;
  volumeCl: number;
  abvPercent: number;
  at: number; // UTC epoch milliseconds
}
export interface Parameters {
  heightCm: number;
  weightKg: number;
  profile: DistributionProfile;
  absorptionHalfLifeMin: number;
  eliminationPermillePerHour: number;
}
export interface Point {
  timestamp: number;
  permille: number;
}

export const DEFAULT_PARAMETERS: Parameters = {
  heightCm: 170,
  weightKg: 82,
  profile: "unknown",
  absorptionHalfLifeMin: 12,
  eliminationPermillePerHour: 0.18
};

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function widmarkFactor(heightCm: number, weightKg: number, profile: DistributionProfile): number {
  const m = heightCm / 100;
  const female = clamp(0.31223 - 0.006446 * weightKg + 0.4466 * m, 0.44, 0.8);
  const male = clamp(0.31608 - 0.004821 * weightKg + 0.4632 * m, 0.60, 0.87);
  return profile === "female" ? female : profile === "male" ? male : (female + male) / 2;
}

/**
 * Returns one-minute integration points (with R-like sample semantics).
 * Historical R baseline: each minute's eliminated mass fraction increases by
 * min(uneliminated BAC at that minute, elimination rate per minute).
 */
export function simulate(drinks: Drink[], params: Parameters, now = Date.now()): Point[] {
  const minute = 60_000;
  if (!(Number.isFinite(now) && Number.isFinite(params.weightKg) && params.weightKg > 0
      && Number.isFinite(params.heightCm) && params.heightCm > 0
      && Number.isFinite(params.absorptionHalfLifeMin) && params.absorptionHalfLifeMin > 0
      && Number.isFinite(params.eliminationPermillePerHour) && params.eliminationPermillePerHour >= 0)) {
    throw new Error("Ungültige Modellparameter");
  }
  const valid = drinks.filter(d => Number.isFinite(d.at) &&
    Number.isFinite(d.volumeCl) && d.volumeCl > 0 &&
    Number.isFinite(d.abvPercent) && d.abvPercent >= 0 && d.abvPercent <= 100);
  const start = Math.floor(Math.min(now, ...valid.map(d => d.at)) / minute) * minute;
  // For empty input, show 12 hours; otherwise show at least the next 6 hours
  // and 24 hours after the final logged drink.
  const last = valid.length ? Math.max(...valid.map(d => d.at)) : now;
  const end = Math.ceil(Math.max(now + (valid.length ? 6 : 12) * 3_600_000,
    last + (valid.length ? 24 : 12) * 3_600_000) / minute) * minute;
  const r = widmarkFactor(params.heightCm, params.weightKg, params.profile);
  const absorbedHalfLifeMs = params.absorptionHalfLifeMin * minute;
  const eliminatePerMinute = params.eliminationPermillePerHour / 1000 / 60;
  let eliminated = 0; // BAC mass fraction
  const points: Point[] = [];
  const n = Math.round((end - start) / minute);
  for (let i = 0; i <= n; i++) {
    const t = start + i * minute;
    let alcoholKg = 0;
    for (const d of valid) {
      if (t < d.at) continue;
      const totalKg = (d.volumeCl / 100) * (d.abvPercent / 100) * 0.789;
      alcoholKg += totalKg * (1 - Math.exp(-(t - d.at) * Math.LN2 / absorbedHalfLifeMs));
    }
    const withoutElimination = alcoholKg / (r * params.weightKg);
    // R initializes elimination = 0 at first time point.
    if (i > 0) {
      const available = Math.max(0, withoutElimination - eliminated);
      eliminated += Math.min(available, eliminatePerMinute);
    }
    points.push({ timestamp: t, permille: Math.max(0, (withoutElimination - eliminated) * 1000) });
  }
  return points;
}

export function valueAt(points: Point[], at: number): number {
  if (!points.length) return 0;
  const index = Math.max(0, Math.min(points.length - 1,
    Math.floor((at - points[0].timestamp) / 60_000)));
  return points[index].permille;
}

export function displayedSeries(points: Point[], now: number) {
  // Keep render light on phones; include all transitions through 5-minute slices
  // and mark elapsed vs forecast with two complementary series.
  return points.filter((_, i) => i % 5 === 0 || i === points.length - 1)
    .map(p => ({
      time: p.timestamp,
      vergangen: p.timestamp <= now ? p.permille : null,
      prognose: p.timestamp >= now ? p.permille : null
    }));
}
