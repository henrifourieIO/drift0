import { serveFile } from "jsr:@std/http/file-server";

// Ballistics calculation functions - ALL METRIC UNITS
interface BallisticsInput {
  muzzleVelocity: number; // m/s
  bulletWeight: number; // grams
  ballisticCoefficient: number; // G1 BC
  zeroRange: number; // meters
  targetDistance: number; // meters
  windSpeed: number; // m/s
  windAngle: number; // degrees (0 = headwind, 90 = full value from right)
  sightHeight: number; // mm
  temperature: number; // celsius
  altitude: number; // meters
}

interface BallisticsResult {
  distance: number; // meters
  velocity: number; // m/s
  energy: number; // joules
  drop: number; // mm
  windDrift: number; // mm
  timeOfFlight: number; // seconds
  moa: number;
  mil: number;
}

function calculateAtmosphericDensity(tempC: number, altitudeM: number): number {
  // Standard atmospheric model (metric)
  const tempKelvin = tempC + 273.15;
  // Convert altitude to feet for pressure calculation, then back
  const altitudeFt = altitudeM * 3.28084;
  const pressure = 29.92 * Math.pow(1 - (0.0000068756 * altitudeFt), 5.2559);
  const standardDensity = 1.225; // kg/m³ at sea level, 15°C
  const standardTempK = 288.15; // 15°C in Kelvin
  return standardDensity * (pressure / 29.92) * (standardTempK / tempKelvin);
}

function calculateBallistics(input: BallisticsInput): BallisticsResult[] {
  const results: BallisticsResult[] = [];
  const {
    muzzleVelocity,
    bulletWeight,
    ballisticCoefficient,
    zeroRange,
    targetDistance,
    windSpeed,
    windAngle,
    sightHeight,
    temperature,
    altitude,
  } = input;

  // Convert sight height from mm to meters for internal calcs
  const sightHeightM = sightHeight / 1000;

  // Atmospheric correction
  const atmDensity = calculateAtmosphericDensity(temperature, altitude);
  const standardDensity = 1.225; // kg/m³
  const densityRatio = atmDensity / standardDensity;
  const correctedBC = ballisticCoefficient / densityRatio;

  // Constants
  const gravity = 9.81; // m/s²

  // BC drag constant (converted for metric: original was 166000 for yards/fps)
  // 166000 * 0.9144 (yards to meters) * 0.3048² (fps² to m/s²) ≈ 14000
  const bcDragConstant = 14000;

  // Calculate for each 25m increment up to target distance
  const increment = targetDistance <= 300 ? 25 : 50;

  // First pass: find zero angle
  let tempVel = muzzleVelocity;
  let tempTime = 0;
  let tempDrop = 0;

  for (let d = 0; d <= zeroRange; d++) {
    const dt = 1 / tempVel; // time for 1 meter
    const dragDecel = (tempVel * tempVel) / (correctedBC * bcDragConstant);
    tempVel -= dragDecel * dt;
    tempTime += dt;
    tempDrop += 0.5 * gravity * dt * dt + gravity * tempTime * dt;
  }

  // Zero angle in radians
  const zeroAngle = Math.atan((tempDrop + sightHeightM) / zeroRange);

  // Wind components - windSpeed is already in m/s
  const windAngleRad = (windAngle * Math.PI) / 180;
  const crossWind = windSpeed * Math.sin(windAngleRad); // Lateral drift
  // Headwind component: positive = headwind (slows bullet), negative = tailwind (assists bullet)
  // At 0°: cos(0) = 1 → full headwind (wind from target toward shooter)
  // At 180°: cos(180) = -1 → full tailwind (wind from shooter toward target)
  const headWindComponent = windSpeed * Math.cos(windAngleRad);

  // Second pass: calculate trajectory
  for (let d = 0; d <= targetDistance; d += increment) {
    if (d === 0) {
      // Energy in Joules: 0.5 * mass(kg) * velocity²
      const massKg = bulletWeight / 1000;
      const energy = 0.5 * massKg * muzzleVelocity * muzzleVelocity;
      results.push({
        distance: 0,
        velocity: Math.round(muzzleVelocity),
        energy: Math.round(energy),
        drop: Math.round(-sightHeight), // mm
        windDrift: 0,
        timeOfFlight: 0,
        moa: 0,
        mil: 0,
      });
      continue;
    }

    // Simulate trajectory to this distance
    let simVel = muzzleVelocity;
    let simTime = 0;
    let simDrop = 0;

    for (let meter = 0; meter < d; meter++) {
      const dt = 1 / simVel;
      // Calculate drag using relative velocity (bullet velocity relative to air mass)
      // Headwind increases relative velocity → more drag
      // Tailwind decreases relative velocity → less drag
      const relativeVel = simVel + headWindComponent;
      const dragDecel = (relativeVel * relativeVel) / (correctedBC * bcDragConstant);
      simVel -= dragDecel * dt;
      simTime += dt;
      simDrop += 0.5 * gravity * dt * dt + gravity * simTime * dt;
    }

    // Wind drift calculation (lag time method)
    // Lag = actual flight time - ideal flight time (if bullet maintained muzzle velocity)
    const lag = simTime - (d / muzzleVelocity);
    const simDrift = crossWind * lag; // meters

    // Apply zero angle correction
    const trajectoryRise = Math.tan(zeroAngle) * d; // meters
    const dropFromSight = simDrop - trajectoryRise + sightHeightM; // meters
    const dropMm = dropFromSight * 1000; // convert to mm
    const driftMm = simDrift * 1000; // convert to mm

    // Calculate energy in Joules
    const massKg = bulletWeight / 1000;
    const energy = 0.5 * massKg * simVel * simVel;

    // Calculate MOA and MIL (angular measurements)
    // MOA = arctan(drop/distance) * 3438 (minutes in a radian)
    // MIL = arctan(drop/distance) * 1000 (milliradians)
    const angleRad = dropFromSight / d;
    const moa = angleRad * 3438;
    const mil = angleRad * 1000;

    results.push({
      distance: d,
      velocity: Math.round(simVel),
      energy: Math.round(energy),
      drop: Math.round(dropMm),
      windDrift: Math.round(driftMm),
      timeOfFlight: Number(simTime.toFixed(3)),
      moa: Number(moa.toFixed(1)),
      mil: Number(mil.toFixed(1)),
    });
  }

  return results;
}

// HTTP Server
const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Security headers for all responses
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  // API endpoint
  if (path === "/api/calculate" && req.method === "POST") {
    try {
      const input: BallisticsInput = await req.json();
      const results = calculateBallistics(input);
      return new Response(JSON.stringify(results), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          ...securityHeaders,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...securityHeaders,
        },
      });
    }
  }

  // Serve CSS
  if (path === "/styles.css") {
    const response = await serveFile(req, "./components/styles.css");
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  }

  // Serve built JS bundle
  if (path === "/app.js") {
    const response = await serveFile(req, "./static/app.js");
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  }

  // Serve static files
  if (path === "/" || path === "/index.html") {
    const response = await serveFile(req, "./static/index.html");
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-cache");
    Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  }

  // Health check endpoint for container orchestration
  if (path === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  }

  // 404 for everything else
  return new Response("Not Found", { status: 404, headers: securityHeaders });
};

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT")) || 8080;
  console.log(`🎯 Drift Ballistics Calculator running at http://localhost:${port}`);
  Deno.serve({ port }, handler);
}

export { calculateBallistics, type BallisticsInput, type BallisticsResult };
