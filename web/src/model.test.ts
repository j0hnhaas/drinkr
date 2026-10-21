import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS, simulate, valueAt, widmarkFactor } from "./model";

const now = Date.parse("2026-10-21T18:00:00Z");
const beer = { id: "b1", type: "Bier", volumeCl: 33, abvPercent: 5, at: now };

describe("drinkR original Widmark BAC model", () => {
  it("uses Seidl limits for distributions", () => {
    expect(widmarkFactor(170, 82, "male")).toBeCloseTo(0.7086, 3);
    expect(widmarkFactor(170, 82, "female")).toBeCloseTo(0.543, 2);
    const mean = (widmarkFactor(170, 82, "male") + widmarkFactor(170, 82, "female")) / 2;
    expect(widmarkFactor(170, 82, "unknown")).toBeCloseTo(mean, 8);
  });
  it("shows zero when nothing was consumed", () => {
    expect(simulate([], DEFAULT_PARAMETERS, now).every(p => p.permille === 0)).toBe(true);
  });
  it("has no instantaneous absorption at the time of consumption", () => {
    const points = simulate([beer], DEFAULT_PARAMETERS, now);
    expect(valueAt(points, now)).toBe(0);
    expect(valueAt(points, now + 60_000)).toBeGreaterThan(0);
  });
  it("converts % BAC to per mille, preserving the R one-minute model", () => {
    // One 33 cl 5% beer contains 0.0130185 kg pure alcohol.
    // After 12 minutes, half is absorbed; with an elimination rate
    // of 0.18 permille/hour, 0.036 permille have been subtracted in 12 steps.
    const r = widmarkFactor(170, 82, "unknown");
    const expected = (0.33 * 0.05 * 0.789 * 0.5 / (r * 82)) * 1000 - 12 * 0.18 / 60;
    expect(valueAt(simulate([beer], DEFAULT_PARAMETERS, now), now + 12 * 60_000))
      .toBeCloseTo(expected, 6);
  });
  it("respects timestamps and does not display negative BAC", () => {
    const later = { ...beer, at: now + 3_600_000 };
    const points = simulate([later], DEFAULT_PARAMETERS, now);
    expect(valueAt(points, now)).toBe(0);
    expect(points.every(p => p.permille >= 0)).toBe(true);
  });
});
