import { describe, it, expect } from "vitest";
import { determineTacticsMatchup, STYLE_LABELS } from "../tactics";

describe("STYLE_LABELS", () => {
  it("should have labels for all 5 styles", () => {
    const styles = ["possession", "counter_attack", "pressing", "balanced", "defensive"];
    styles.forEach((s) => {
      expect(STYLE_LABELS[s as keyof typeof STYLE_LABELS]).toBeTruthy();
    });
  });
});

describe("determineTacticsMatchup", () => {
  it("should detect possession countering defensive", () => {
    const result = determineTacticsMatchup("possession", "defensive");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
    expect(result.advantage).toBe(0.05);
    expect(result.description).toContain("主队");
    expect(result.description).toContain("控球渗透");
    expect(result.description).toContain("深度防守");
  });

  it("should detect counter_attack countering possession", () => {
    const result = determineTacticsMatchup("possession", "counter_attack");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("B");
    expect(result.description).toContain("客队");
    expect(result.description).toContain("防守反击");
  });

  it("should detect pressing countering counter_attack", () => {
    const result = determineTacticsMatchup("pressing", "counter_attack");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
  });

  it("should detect defensive countering pressing", () => {
    const result = determineTacticsMatchup("defensive", "pressing");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
  });

  it("should return no counter when balanced is involved", () => {
    const result = determineTacticsMatchup("balanced", "possession");
    expect(result.hasCounter).toBe(false);
    expect(result.counterTeam).toBe("none");
    expect(result.advantage).toBe(0);
  });

  it("should return no counter for same styles", () => {
    const result = determineTacticsMatchup("possession", "possession");
    expect(result.hasCounter).toBe(false);
    expect(result.advantage).toBe(0);
  });

  it("should return no counter for non-counter pairs", () => {
    const result = determineTacticsMatchup("possession", "pressing");
    expect(result.hasCounter).toBe(false);
  });
});