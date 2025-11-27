import { assertEquals } from "@std/assert";
import { calculateBallistics, type BallisticsInput } from "./main.ts";

Deno.test("calculates ballistics for 308 Win (metric)", () => {
  // 308 Win: ~823 m/s, 10.9g bullet
  const input: BallisticsInput = {
    muzzleVelocity: 823, // m/s (2700 fps)
    bulletWeight: 10.9, // grams (168 gr)
    ballisticCoefficient: 0.462,
    zeroRange: 91, // meters (~100 yds)
    targetDistance: 457, // meters (~500 yds)
    windSpeed: 4.5, // m/s (~10 mph)
    windAngle: 90,
    sightHeight: 38, // mm (1.5 in)
    temperature: 15, // celsius (~59F)
    altitude: 0,
  };

  const results = calculateBallistics(input);

  // Should have results at 25m increments
  assertEquals(results[0].distance, 0);
  assertEquals(results[0].velocity, 823);
  
  // Last result should be at target distance
  const last = results[results.length - 1];
  assertEquals(last.distance, 450); // Closest increment to 457
  
  // Velocity should decrease over distance
  assertEquals(last.velocity < 823, true);
  
  // Should have significant drop at 450m (positive = below line of sight)
  assertEquals(Math.abs(last.drop) > 100, true); // Should be more than 100mm drop
});

Deno.test("calculates wind drift (metric)", () => {
  const inputWithWind: BallisticsInput = {
    muzzleVelocity: 823, // m/s
    bulletWeight: 10.9, // grams
    ballisticCoefficient: 0.462,
    zeroRange: 91, // meters
    targetDistance: 274, // meters (~300 yds)
    windSpeed: 4.5, // m/s (~10 mph)
    windAngle: 90, // Full value crosswind
    sightHeight: 38, // mm
    temperature: 15, // celsius
    altitude: 0,
  };

  const inputNoWind: BallisticsInput = {
    ...inputWithWind,
    windSpeed: 0,
  };

  const withWind = calculateBallistics(inputWithWind);
  const noWind = calculateBallistics(inputNoWind);

  const lastWithWind = withWind[withWind.length - 1];
  const lastNoWind = noWind[noWind.length - 1];

  // Wind should cause drift (in mm)
  assertEquals(Math.abs(lastWithWind.windDrift) > 0, true);
  assertEquals(lastNoWind.windDrift, 0);
});
