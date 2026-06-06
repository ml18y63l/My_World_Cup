// src/lib/__tests__/score.test.ts

import { describe, it, expect } from "vitest";
import { calculateOverallScore } from "../score";

describe("calculateOverallScore", () => {
  it("should calculate the arithmetic mean of 8 metrics", () => {
    const metrics = {
      attack: 80,
      defense: 80,
      control: 80,
      status: 80,
      experience: 80,
      place_kick: 80,
      superstar: 80,
      penalty: 80,
    };
    expect(calculateOverallScore(metrics)).toBe(80.0);
  });

  it("should round to one decimal place", () => {
    const metrics = {
      attack: 92,
      defense: 85,
      control: 88,
      status: 90,
      experience: 95,
      place_kick: 70,
      superstar: 80,
      penalty: 89,
    };
    // (92+85+88+90+95+70+80+89)/8 = 689/8 = 86.125 → 86.1
    expect(calculateOverallScore(metrics)).toBe(86.1);
  });

  it("should handle all max scores", () => {
    const metrics = {
      attack: 100,
      defense: 100,
      control: 100,
      status: 100,
      experience: 100,
      place_kick: 100,
      superstar: 100,
      penalty: 100,
    };
    expect(calculateOverallScore(metrics)).toBe(100.0);
  });
});
