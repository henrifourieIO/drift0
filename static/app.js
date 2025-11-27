// app.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// components/App.tsx
import { useState as useState3, useEffect as useEffect3 } from "react";

// components/Calculator.tsx
import { useState, useEffect, useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var STORAGE_KEY = "drift-calculator-values";
var conv = {
  fpsToMs: 0.3048,
  msToFps: 3.28084,
  ydsToM: 0.9144,
  mToYds: 1.09361,
  grToG: 0.0648,
  gToGr: 15.4324,
  ftlbToJ: 1.3558,
  jToFtlb: 0.7376,
  inToCm: 2.54,
  cmToIn: 0.3937,
  mphToMs: 0.44704,
  msToMph: 2.23694,
  ftToM: 0.3048,
  mToFt: 3.28084,
  inToMm: 25.4,
  mmToIn: 0.03937
};
function fToC(f) {
  return (f - 32) * 5 / 9;
}
function cToF(c) {
  return c * 9 / 5 + 32;
}
var presets = {
  "556": {
    muzzleVelocity: 3100,
    bulletWeight: 62,
    ballisticCoefficient: 0.307
  },
  "762x39": {
    muzzleVelocity: 2350,
    bulletWeight: 123,
    ballisticCoefficient: 0.3
  },
  "243": { muzzleVelocity: 3025, bulletWeight: 105, ballisticCoefficient: 0.5 },
  "270": {
    muzzleVelocity: 2950,
    bulletWeight: 150,
    ballisticCoefficient: 0.496
  },
  "308": {
    muzzleVelocity: 2700,
    bulletWeight: 168,
    ballisticCoefficient: 0.462
  },
  "762x54r": {
    muzzleVelocity: 2580,
    bulletWeight: 174,
    ballisticCoefficient: 0.4
  },
  "3006": {
    muzzleVelocity: 2750,
    bulletWeight: 175,
    ballisticCoefficient: 0.505
  },
  "6.5cm": {
    muzzleVelocity: 2700,
    bulletWeight: 140,
    ballisticCoefficient: 0.61
  },
  "6.5prc": {
    muzzleVelocity: 2900,
    bulletWeight: 143,
    ballisticCoefficient: 0.625
  },
  "300wm": {
    muzzleVelocity: 2950,
    bulletWeight: 190,
    ballisticCoefficient: 0.533
  },
  "300prc": {
    muzzleVelocity: 2880,
    bulletWeight: 225,
    ballisticCoefficient: 0.691
  },
  "338lm": {
    muzzleVelocity: 2750,
    bulletWeight: 300,
    ballisticCoefficient: 0.768
  },
  "375ct": {
    muzzleVelocity: 2850,
    bulletWeight: 350,
    ballisticCoefficient: 0.945
  },
  "50bmg": {
    muzzleVelocity: 2800,
    bulletWeight: 750,
    ballisticCoefficient: 1.05
  }
};
var targetPresets = {
  ipsc: {
    size: 18,
    name: "IPSC",
    shape: "rect",
    width: 18,
    height: 30,
    gridLines: 6
  },
  "nra-b8": {
    size: 5.5,
    name: "NRA B-8",
    shape: "circle",
    gridLines: 5
  },
  "moa-grid": {
    size: 10,
    name: "1 MOA Grid",
    shape: "square",
    gridLines: 10
  },
  "steel-12": {
    size: 12,
    name: '12" Steel',
    shape: "circle",
    gridLines: 6
  },
  "steel-8": {
    size: 8,
    name: '8" Steel',
    shape: "circle",
    gridLines: 4
  },
  custom: {
    size: 18,
    name: "Custom",
    shape: "square",
    gridLines: 6
  }
};
function loadSavedValues() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
  }
  return null;
}
function Calculator({
  unitSystem,
  onUnitSystemChange,
  onScopeAdjustment
}) {
  const saved = loadSavedValues();
  const [muzzleVelocity, setMuzzleVelocity] = useState(
    saved?.muzzleVelocity ?? 2700
  );
  const [bulletWeight, setBulletWeight] = useState(saved?.bulletWeight ?? 168);
  const [ballisticCoefficient, setBallisticCoefficient] = useState(
    saved?.ballisticCoefficient ?? 0.462
  );
  const [zeroRange, setZeroRange] = useState(saved?.zeroRange ?? 100);
  const [sightHeight, setSightHeight] = useState(saved?.sightHeight ?? 1.5);
  const [targetDistance, setTargetDistance] = useState(
    saved?.targetDistance ?? 1e3
  );
  const [shootingDistance, setShootingDistance] = useState(
    saved?.shootingDistance ?? 500
  );
  const [windSpeed, setWindSpeed] = useState(saved?.windSpeed ?? 10);
  const [windAngle, setWindAngle] = useState(saved?.windAngle ?? 90);
  const [temperature, setTemperature] = useState(saved?.temperature ?? 59);
  const [altitude, setAltitude] = useState(saved?.altitude ?? 0);
  const [results, setResults] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(
    saved?.currentUnit ?? "moa"
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [targetType, setTargetType] = useState(
    saved?.targetType ?? "ipsc"
  );
  const [displayMode, setDisplayMode] = useState(
    saved?.displayMode ?? "rings"
  );
  const [selectedPreset, setSelectedPreset] = useState(
    saved?.selectedPreset ?? ""
  );
  const ringsRef = useRef(null);
  const gridRef = useRef(null);
  const shapeRef = useRef(null);
  const prevUnitSystemRef = useRef(unitSystem);
  const calculateTimeoutRef = useRef(
    null
  );
  const loadPreset = (name) => {
    const preset2 = presets[name];
    if (preset2) {
      let vel = preset2.muzzleVelocity;
      let weight = preset2.bulletWeight;
      if (unitSystem === "metric") {
        vel = Math.round(vel * conv.fpsToMs);
        weight = Number((weight * conv.grToG).toFixed(1));
      }
      setMuzzleVelocity(vel);
      setBulletWeight(weight);
      setBallisticCoefficient(preset2.ballisticCoefficient);
      setSelectedPreset(name);
    }
  };
  const calculate = async () => {
    setIsCalculating(true);
    try {
      let vel = muzzleVelocity;
      let weight = bulletWeight;
      let zero = zeroRange;
      let sight = sightHeight;
      let dist = Math.max(targetDistance, shootingDistance);
      let wind = windSpeed;
      let temp = temperature;
      let alt = altitude;
      if (unitSystem === "imperial") {
        vel = vel * conv.fpsToMs;
        weight = weight * conv.grToG;
        zero = zero * conv.ydsToM;
        sight = sight * conv.inToMm;
        dist = dist * conv.ydsToM;
        wind = wind * conv.mphToMs;
        temp = fToC(temp);
        alt = alt * conv.ftToM;
      }
      const input = {
        muzzleVelocity: vel,
        bulletWeight: weight,
        ballisticCoefficient,
        zeroRange: zero,
        targetDistance: dist,
        windSpeed: wind,
        windAngle,
        sightHeight: sight,
        temperature: temp,
        altitude: alt
      };
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCalculating(false);
    }
  };
  useEffect(() => {
    if (prevUnitSystemRef.current === unitSystem) return;
    const toSystem = unitSystem;
    if (toSystem === "metric") {
      setMuzzleVelocity((v) => Math.round(v * conv.fpsToMs));
      setBulletWeight((w) => Number((w * conv.grToG).toFixed(1)));
      setZeroRange((z) => Math.round(z * conv.ydsToM));
      setSightHeight((s) => Number((s * conv.inToMm).toFixed(0)));
      setTargetDistance((d) => Math.round(d * conv.ydsToM));
      setShootingDistance((d) => Math.round(d * conv.ydsToM));
      setWindSpeed((w) => Number((w * conv.mphToMs).toFixed(1)));
      setTemperature((t) => Math.round(fToC(t)));
      setAltitude((a) => Math.round(a * conv.ftToM));
    } else {
      setMuzzleVelocity((v) => Math.round(v * conv.msToFps));
      setBulletWeight((w) => Number((w * conv.gToGr).toFixed(0)));
      setZeroRange((z) => Math.round(z * conv.mToYds));
      setSightHeight((s) => Number((s * conv.mmToIn).toFixed(1)));
      setTargetDistance((d) => Math.round(d * conv.mToYds));
      setShootingDistance((d) => Math.round(d * conv.mToYds));
      setWindSpeed((w) => Number((w * conv.msToMph).toFixed(0)));
      setTemperature((t) => Math.round(cToF(t)));
      setAltitude((a) => Math.round(a * conv.mToFt));
    }
    prevUnitSystemRef.current = unitSystem;
  }, [unitSystem]);
  useEffect(() => {
    const values = {
      muzzleVelocity,
      bulletWeight,
      ballisticCoefficient,
      zeroRange,
      sightHeight,
      targetDistance,
      shootingDistance,
      windSpeed,
      windAngle,
      temperature,
      altitude,
      currentUnit,
      targetType,
      displayMode,
      selectedPreset
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [
    muzzleVelocity,
    bulletWeight,
    ballisticCoefficient,
    zeroRange,
    sightHeight,
    targetDistance,
    shootingDistance,
    windSpeed,
    windAngle,
    temperature,
    altitude,
    currentUnit,
    targetType,
    displayMode,
    selectedPreset
  ]);
  useEffect(() => {
    if (calculateTimeoutRef.current) {
      clearTimeout(calculateTimeoutRef.current);
    }
    calculateTimeoutRef.current = setTimeout(() => {
      calculate();
    }, 300);
    return () => {
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current);
      }
    };
  }, [
    muzzleVelocity,
    bulletWeight,
    ballisticCoefficient,
    zeroRange,
    sightHeight,
    targetDistance,
    shootingDistance,
    windSpeed,
    windAngle,
    temperature,
    altitude,
    unitSystem
  ]);
  useEffect(() => {
    updateTargetVisual();
  }, [targetType, displayMode, results]);
  const updateTargetVisual = () => {
    const ringsContainer = ringsRef.current;
    const gridContainer = gridRef.current;
    const shapeEl = shapeRef.current;
    if (!ringsContainer || !gridContainer || !shapeEl) return;
    const preset2 = targetPresets[targetType];
    ringsContainer.innerHTML = "";
    gridContainer.innerHTML = "";
    shapeEl.style.display = "none";
    if (displayMode === "rings") {
      ringsContainer.style.display = "flex";
      gridContainer.style.display = "none";
      const ringCount = preset2.gridLines || 4;
      for (let i = 1; i <= ringCount; i++) {
        const ring = document.createElement("div");
        ring.className = "target-ring";
        const pct = i / ringCount * 90;
        ring.style.width = pct + "%";
        ring.style.height = pct + "%";
        ringsContainer.appendChild(ring);
      }
    } else {
      ringsContainer.style.display = "none";
      gridContainer.style.display = "block";
      const gridLines = preset2.gridLines || 6;
      const visualSize = 220;
      const spacing = visualSize / gridLines;
      for (let i = 0; i <= gridLines; i++) {
        const line = document.createElement("div");
        line.className = "target-grid-line h" + (i === gridLines / 2 ? " major" : "");
        line.style.top = i * spacing + "px";
        gridContainer.appendChild(line);
      }
      for (let i = 0; i <= gridLines; i++) {
        const line = document.createElement("div");
        line.className = "target-grid-line v" + (i === gridLines / 2 ? " major" : "");
        line.style.left = i * spacing + "px";
        gridContainer.appendChild(line);
      }
      shapeEl.style.display = "block";
      shapeEl.className = "target-shape";
      if (preset2.shape === "circle") {
        shapeEl.classList.add("circle");
        shapeEl.style.width = "80%";
        shapeEl.style.height = "80%";
      } else if (preset2.shape === "rect" && preset2.width && preset2.height) {
        const aspect = preset2.height / preset2.width;
        if (aspect > 1) {
          shapeEl.style.height = "90%";
          shapeEl.style.width = 90 / aspect + "%";
        } else {
          shapeEl.style.width = "90%";
          shapeEl.style.height = 90 * aspect + "%";
        }
      } else {
        shapeEl.style.width = "80%";
        shapeEl.style.height = "80%";
      }
    }
  };
  const isMetric = unitSystem === "metric";
  const distLabel = isMetric ? "m" : "yds";
  const velLabel = isMetric ? "m/s" : "fps";
  const energyLabel = isMetric ? "J" : "ft-lb";
  const dropLabel = isMetric ? "mm" : '"';
  const displayDist = (d) => isMetric ? d : Math.round(d * conv.mToYds);
  const displayVel = (v) => isMetric ? v : Math.round(v * conv.msToFps);
  const displayEnergy = (e) => isMetric ? e : Math.round(e * conv.jToFtlb);
  const displayDrop = (d) => isMetric ? d : Number((d * conv.mmToIn).toFixed(1));
  const getShootingResult = () => {
    if (!results || results.length === 0) return null;
    const shootingDistMeters = isMetric ? shootingDistance : shootingDistance * conv.ydsToM;
    let closest = results[0];
    let minDiff = Math.abs(results[0].distance - shootingDistMeters);
    for (const r of results) {
      const diff = Math.abs(r.distance - shootingDistMeters);
      if (diff < minDiff) {
        minDiff = diff;
        closest = r;
      }
    }
    return closest;
  };
  const shootingResult = getShootingResult();
  const preset = targetPresets[targetType];
  const targetSizeInches = preset.size;
  const targetSizeDisplay = isMetric ? (targetSizeInches * conv.inToCm).toFixed(1) : targetSizeInches;
  const calculateZoomScale = () => {
    if (!shootingResult) return 1;
    const dropInches = shootingResult.drop * conv.mmToIn;
    const driftInches = shootingResult.windDrift * conv.mmToIn;
    const targetRadius = targetSizeInches / 2;
    const maxOffset = Math.max(Math.abs(dropInches), Math.abs(driftInches));
    if (maxOffset <= targetRadius) {
      return 1;
    }
    const requiredRadius = maxOffset * 1.2;
    return targetRadius / requiredRadius;
  };
  const zoomScale = calculateZoomScale();
  const getMarkerPosition = () => {
    if (!shootingResult) return { x: 110, y: 110 };
    const visualSize = 220;
    const centerX = visualSize / 2;
    const centerY = visualSize / 2;
    const dropInches = shootingResult.drop * conv.mmToIn;
    const driftInches = shootingResult.windDrift * conv.mmToIn;
    const targetVisualDiameter = visualSize * 0.9;
    const effectiveTargetSize = targetSizeInches / zoomScale;
    const pixelsPerInch = targetVisualDiameter / effectiveTargetSize;
    const markerX = centerX + driftInches * pixelsPerInch;
    const markerY = centerY + dropInches * pixelsPerInch;
    return {
      x: markerX,
      y: markerY
    };
  };
  const markerPos = getMarkerPosition();
  const isOnTarget = () => {
    if (!shootingResult) return false;
    const dropInches = shootingResult.drop * conv.mmToIn;
    const driftInches = shootingResult.windDrift * conv.mmToIn;
    if (preset.shape === "rect" && preset.width && preset.height) {
      return Math.abs(driftInches) <= preset.width / 2 && Math.abs(dropInches) <= preset.height / 2;
    }
    const impactRadius = Math.sqrt(
      dropInches * dropInches + driftInches * driftInches
    );
    const targetRadius = targetSizeInches / 2;
    return impactRadius <= targetRadius;
  };
  const actuallyOnTarget = isOnTarget();
  return /* @__PURE__ */ jsxs("div", { className: "grid", children: [
    /* @__PURE__ */ jsx("div", { className: "sidebar", children: /* @__PURE__ */ jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsx("h3", { className: "card-title", children: "Cartridge" }),
      /* @__PURE__ */ jsxs("div", { className: "form-group full", children: [
        /* @__PURE__ */ jsx("label", { children: "Preset" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: selectedPreset,
            onChange: (e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
              }
            },
            children: [
              /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select a cartridge..." }),
              /* @__PURE__ */ jsx("option", { value: "556", children: "5.56 NATO" }),
              /* @__PURE__ */ jsx("option", { value: "762x39", children: "7.62x39" }),
              /* @__PURE__ */ jsx("option", { value: "308", children: "308 Win" }),
              /* @__PURE__ */ jsx("option", { value: "762x54r", children: "7.62x54R" }),
              /* @__PURE__ */ jsx("option", { value: "6.5cm", children: "6.5 Creedmoor" }),
              /* @__PURE__ */ jsx("option", { value: "6.5prc", children: "6.5 PRC" }),
              /* @__PURE__ */ jsx("option", { value: "243", children: "243 Win" }),
              /* @__PURE__ */ jsx("option", { value: "270", children: "270 Win" }),
              /* @__PURE__ */ jsx("option", { value: "3006", children: "30-06" }),
              /* @__PURE__ */ jsx("option", { value: "300wm", children: "300 Win Mag" }),
              /* @__PURE__ */ jsx("option", { value: "300prc", children: "300 PRC" }),
              /* @__PURE__ */ jsx("option", { value: "338lm", children: "338 Lapua" }),
              /* @__PURE__ */ jsx("option", { value: "375ct", children: "375 CheyTac" }),
              /* @__PURE__ */ jsx("option", { value: "50bmg", children: "50 BMG" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Muzzle Velocity",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m/s" : "fps",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: muzzleVelocity,
              onChange: (e) => setMuzzleVelocity(Number(e.target.value)),
              step: "10"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Bullet Weight",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "g" : "gr",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: bulletWeight,
              onChange: (e) => setBulletWeight(Number(e.target.value)),
              step: "1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group full", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Ballistic Coefficient ",
            /* @__PURE__ */ jsx("span", { className: "label-hint", children: "(G1)" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: ballisticCoefficient,
              onChange: (e) => setBallisticCoefficient(Number(e.target.value)),
              step: "0.001"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divider" }),
      /* @__PURE__ */ jsx("h3", { className: "card-title", children: "Rifle Setup" }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Zero Range",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m" : "yds",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: zeroRange,
              onChange: (e) => setZeroRange(Number(e.target.value)),
              step: "25"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Sight Height",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "mm" : "in",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: sightHeight,
              onChange: (e) => setSightHeight(Number(e.target.value)),
              step: "0.1"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divider" }),
      /* @__PURE__ */ jsx("h3", { className: "card-title", children: "Environment" }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Wind Speed",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m/s" : "mph",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: windSpeed,
              onChange: (e) => setWindSpeed(Number(e.target.value)),
              step: "1",
              min: "0"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Wind Angle ",
            /* @__PURE__ */ jsx("span", { className: "label-hint", children: "(deg)" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: windAngle,
              onChange: (e) => setWindAngle(Number(e.target.value)),
              step: "15",
              min: "0",
              max: "360"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "wind-direction-indicator", children: [
        /* @__PURE__ */ jsxs("div", { className: "wind-compass", children: [
          /* @__PURE__ */ jsxs("div", { className: "compass-ring", children: [
            /* @__PURE__ */ jsx("span", { className: "compass-label top", children: "0\xB0" }),
            /* @__PURE__ */ jsx("span", { className: "compass-label right", children: "90\xB0" }),
            /* @__PURE__ */ jsx("span", { className: "compass-label bottom", children: "180\xB0" }),
            /* @__PURE__ */ jsx("span", { className: "compass-label left", children: "270\xB0" })
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "wind-arrow",
              style: {
                transform: `rotate(${windAngle + 180}deg)`
              },
              children: /* @__PURE__ */ jsx(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  width: "20",
                  height: "20",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M12 2L8 10h8L12 2zM12 22V10",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      fill: "none"
                    }
                  )
                }
              )
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "shooter-icon", children: /* @__PURE__ */ jsxs(
            "svg",
            {
              viewBox: "0 0 24 24",
              fill: "currentColor",
              width: "16",
              height: "16",
              children: [
                /* @__PURE__ */ jsx("circle", { cx: "12", cy: "8", r: "4" }),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M12 12v8M8 16h8",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    fill: "none"
                  }
                )
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "wind-effect-labels", children: (() => {
          const angleRad = windAngle * Math.PI / 180;
          const headwindComponent = Math.cos(angleRad);
          const crosswindComponent = Math.abs(Math.sin(angleRad));
          const effects = [];
          if (Math.abs(headwindComponent) > 0.1) {
            if (headwindComponent > 0) {
              effects.push(
                /* @__PURE__ */ jsxs("span", { className: "wind-effect hindering", children: [
                  /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", width: "12", height: "12", children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M8 3v10M4 7l4-4 4 4",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      fill: "none"
                    }
                  ) }),
                  "Headwind (",
                  Math.round(Math.abs(headwindComponent) * 100),
                  "%) \u2014 slows bullet, more drop"
                ] }, "head")
              );
            } else {
              effects.push(
                /* @__PURE__ */ jsxs("span", { className: "wind-effect assisting", children: [
                  /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", width: "12", height: "12", children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: "M8 13V3M4 9l4 4 4-4",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      fill: "none"
                    }
                  ) }),
                  "Tailwind (",
                  Math.round(Math.abs(headwindComponent) * 100),
                  "%) \u2014 assists bullet, less drop"
                ] }, "tail")
              );
            }
          }
          if (crosswindComponent > 0.1) {
            const direction = Math.sin(angleRad) > 0 ? "right" : "left";
            effects.push(
              /* @__PURE__ */ jsxs("span", { className: "wind-effect crosswind", children: [
                /* @__PURE__ */ jsx("svg", { viewBox: "0 0 16 16", width: "12", height: "12", children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M3 8h10M9 4l4 4-4 4",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    fill: "none"
                  }
                ) }),
                "Crosswind (",
                Math.round(crosswindComponent * 100),
                "%) \u2014 drifts ",
                direction
              ] }, "cross")
            );
          }
          if (effects.length === 0) {
            effects.push(
              /* @__PURE__ */ jsx("span", { className: "wind-effect neutral", children: "No significant wind effect" }, "none")
            );
          }
          return effects;
        })() })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Temperature",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "\xB0C" : "\xB0F",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: temperature,
              onChange: (e) => setTemperature(Number(e.target.value)),
              step: "5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Altitude",
            " ",
            /* @__PURE__ */ jsxs("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m" : "ft",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: altitude,
              onChange: (e) => setAltitude(Number(e.target.value)),
              step: "500"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "main", children: /* @__PURE__ */ jsxs("div", { className: "card shot-calculator", children: [
      /* @__PURE__ */ jsxs("div", { className: "shot-header", children: [
        /* @__PURE__ */ jsxs("div", { className: "shot-distance-input", children: [
          /* @__PURE__ */ jsx("label", { children: "Shooting Distance" }),
          /* @__PURE__ */ jsxs("div", { className: "distance-input-wrapper", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: shootingDistance,
                onChange: (e) => setShootingDistance(Number(e.target.value)),
                step: isMetric ? 25 : 25,
                min: 0,
                max: 999999999
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "distance-unit", children: distLabel })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "unit-toggle", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: currentUnit === "moa" ? "active" : "",
              onClick: () => setCurrentUnit("moa"),
              children: "MOA"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: currentUnit === "mil" ? "active" : "",
              onClick: () => setCurrentUnit("mil"),
              children: "MIL"
            }
          )
        ] })
      ] }),
      !results || results.length === 0 || !shootingResult ? /* @__PURE__ */ jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ jsxs(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ jsx("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
              /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { children: isCalculating ? "Calculating trajectory..." : "Enter your parameters to view the trajectory" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "shot-result-layout", children: [
        /* @__PURE__ */ jsxs("div", { className: "target-section", children: [
          /* @__PURE__ */ jsxs("div", { className: "target-controls", children: [
            /* @__PURE__ */ jsxs("div", { className: "target-select", children: [
              /* @__PURE__ */ jsx("label", { children: "Target" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: targetType,
                  onChange: (e) => setTargetType(
                    e.target.value
                  ),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "ipsc", children: 'IPSC (18"\xD730")' }),
                    /* @__PURE__ */ jsx("option", { value: "nra-b8", children: 'NRA B-8 (5.5")' }),
                    /* @__PURE__ */ jsx("option", { value: "moa-grid", children: '1 MOA Grid (10")' }),
                    /* @__PURE__ */ jsx("option", { value: "steel-12", children: '12" Steel' }),
                    /* @__PURE__ */ jsx("option", { value: "steel-8", children: '8" Steel' }),
                    /* @__PURE__ */ jsx("option", { value: "custom", children: 'Custom (18")' })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "display-mode-toggle", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: displayMode === "rings" ? "active" : "",
                  onClick: () => setDisplayMode("rings"),
                  children: "Rings"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: displayMode === "grid" ? "active" : "",
                  onClick: () => setDisplayMode("grid"),
                  children: "Grid"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "inline-target-visual", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "target-content",
                style: {
                  transform: `scale(${zoomScale})`,
                  transition: "transform 0.3s ease-out"
                },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "target-crosshair h" }),
                  /* @__PURE__ */ jsx("div", { className: "target-crosshair v" }),
                  /* @__PURE__ */ jsx("div", { className: "target-rings", ref: ringsRef }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "target-grid",
                      ref: gridRef,
                      style: { display: "none" }
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "target-shape",
                      ref: shapeRef,
                      style: { display: "none" }
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `drift-marker ${actuallyOnTarget ? "on-target" : "off-target"}`,
                style: {
                  left: markerPos.x + "px",
                  top: markerPos.y + "px"
                }
              }
            ),
            zoomScale < 1 && /* @__PURE__ */ jsxs("div", { className: "zoom-indicator", children: [
              Math.round(zoomScale * 100),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "target-size-label", children: [
            targetSizeDisplay,
            isMetric ? "cm" : '"',
            " target"
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `shot-verdict ${actuallyOnTarget ? "hit" : "miss"}`,
              children: actuallyOnTarget ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "verdict-icon", children: "\u2713" }),
                /* @__PURE__ */ jsx("span", { children: "On Target" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "verdict-icon", children: "\u2717" }),
                /* @__PURE__ */ jsx("span", { children: "Off Target" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ballistics-section", children: [
          /* @__PURE__ */ jsxs("div", { className: "shot-stats-grid", children: [
            /* @__PURE__ */ jsxs("div", { className: "shot-stat primary", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Drop" }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `stat-value ${Math.abs(shootingResult.drop) > 12.7 ? "negative" : "positive"}`,
                  children: [
                    shootingResult.drop > 0 ? "+" : "",
                    displayDrop(shootingResult.drop),
                    dropLabel
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "shot-stat primary", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Wind Drift" }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `stat-value ${Math.abs(shootingResult.windDrift) > 12.7 ? "negative" : "positive"}`,
                  children: [
                    shootingResult.windDrift > 0 ? "+" : "",
                    displayDrop(shootingResult.windDrift),
                    dropLabel
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "shot-stat", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Correction" }),
              /* @__PURE__ */ jsxs("div", { className: "stat-value accent", children: [
                (currentUnit === "moa" ? shootingResult.moa : shootingResult.mil) > 0 ? "+" : "",
                currentUnit === "moa" ? shootingResult.moa : shootingResult.mil,
                " ",
                currentUnit.toUpperCase()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "shot-stat", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Time of Flight" }),
              /* @__PURE__ */ jsxs("div", { className: "stat-value", children: [
                shootingResult.timeOfFlight,
                "s"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "shot-stat", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Velocity" }),
              /* @__PURE__ */ jsxs("div", { className: "stat-value", children: [
                displayVel(shootingResult.velocity),
                " ",
                velLabel
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "shot-stat", children: [
              /* @__PURE__ */ jsx("div", { className: "stat-label", children: "Energy" }),
              /* @__PURE__ */ jsxs("div", { className: "stat-value", children: [
                displayEnergy(shootingResult.energy),
                " ",
                energyLabel
              ] })
            ] })
          ] }),
          onScopeAdjustment && /* @__PURE__ */ jsxs(
            "button",
            {
              className: "scope-adjust-btn",
              onClick: () => {
                onScopeAdjustment({
                  offsetX: shootingResult.windDrift,
                  offsetY: -shootingResult.drop,
                  distance: shootingResult.distance
                });
              },
              children: [
                /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    width: "16",
                    height: "16",
                    children: [
                      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
                      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" }),
                      /* @__PURE__ */ jsx("line", { x1: "12", y1: "2", x2: "12", y2: "6" }),
                      /* @__PURE__ */ jsx("line", { x1: "12", y1: "18", x2: "12", y2: "22" }),
                      /* @__PURE__ */ jsx("line", { x1: "2", y1: "12", x2: "6", y2: "12" }),
                      /* @__PURE__ */ jsx("line", { x1: "18", y1: "12", x2: "22", y2: "12" })
                    ]
                  }
                ),
                "Get Scope Adjustment"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}

// components/ScopeAdjustment.tsx
import { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var conv2 = {
  inToCm: 2.54,
  cmToIn: 0.3937,
  inToMm: 25.4,
  mmToIn: 0.03937,
  mToYds: 1.09361,
  ydsToM: 0.9144
};
var targetPresets2 = {
  ipsc: {
    size: 18,
    name: "IPSC",
    shape: "rect",
    width: 18,
    height: 30,
    gridLines: 6
  },
  "nra-b8": { size: 5.5, name: "NRA B-8", shape: "circle", gridLines: 5 },
  "moa-grid": { size: 10, name: "1 MOA Grid", shape: "square", gridLines: 10 },
  "steel-12": { size: 12, name: '12" Steel', shape: "circle", gridLines: 6 },
  "steel-8": { size: 8, name: '8" Steel', shape: "circle", gridLines: 4 },
  custom: { size: 18, name: "Custom", shape: "square", gridLines: 6 }
};
function ScopeAdjustment({
  unitSystem,
  initialData,
  onDataConsumed
}) {
  const [targetType, setTargetType] = useState2(
    "ipsc"
  );
  const [targetSize, setTargetSize] = useState2(18);
  const [distance, setDistance] = useState2(100);
  const [clickValue, setClickValue] = useState2("0.25moa");
  const [offsetX, setOffsetX] = useState2(0);
  const [offsetY, setOffsetY] = useState2(0);
  const [displayMode, setDisplayMode] = useState2("rings");
  const [shotMarkerVisible, setShotMarkerVisible] = useState2(false);
  const [shotMarkerPos, setShotMarkerPos] = useState2({ x: 0, y: 0 });
  const targetVisualRef = useRef2(null);
  const ringsRef = useRef2(null);
  const gridRef = useRef2(null);
  const shapeRef = useRef2(null);
  const isMetric = unitSystem === "metric";
  useEffect2(() => {
    if (initialData) {
      if (isMetric) {
        setOffsetX(Number(initialData.offsetX.toFixed(1)));
        setOffsetY(Number(initialData.offsetY.toFixed(1)));
        setDistance(Math.round(initialData.distance));
      } else {
        setOffsetX(Number((initialData.offsetX * conv2.mmToIn).toFixed(1)));
        setOffsetY(Number((initialData.offsetY * conv2.mmToIn).toFixed(1)));
        setDistance(Math.round(initialData.distance * conv2.mToYds));
      }
      setShotMarkerVisible(true);
      onDataConsumed?.();
    }
  }, [initialData]);
  useEffect2(() => {
    const preset = targetPresets2[targetType];
    let size = preset.size;
    if (isMetric) {
      size = Number((size * conv2.inToCm).toFixed(1));
    }
    setTargetSize(size);
    updateTargetVisual();
  }, [targetType, unitSystem, displayMode]);
  useEffect2(() => {
    updateTargetVisual();
  }, [displayMode]);
  useEffect2(() => {
    updateShotFromInputs();
  }, [offsetX, offsetY, targetSize, distance, unitSystem]);
  const updateTargetVisual = () => {
    const preset = targetPresets2[targetType];
    const ringsContainer = ringsRef.current;
    const gridContainer = gridRef.current;
    const shapeEl = shapeRef.current;
    if (!ringsContainer || !gridContainer || !shapeEl) return;
    ringsContainer.innerHTML = "";
    gridContainer.innerHTML = "";
    shapeEl.style.display = "none";
    if (displayMode === "rings") {
      ringsContainer.style.display = "flex";
      gridContainer.style.display = "none";
      const ringCount = preset.gridLines || 4;
      for (let i = 1; i <= ringCount; i++) {
        const ring = document.createElement("div");
        ring.className = "target-ring";
        const pct = i / ringCount * 90;
        ring.style.width = pct + "%";
        ring.style.height = pct + "%";
        ringsContainer.appendChild(ring);
      }
    } else {
      ringsContainer.style.display = "none";
      gridContainer.style.display = "block";
      const gridLines = preset.gridLines || 6;
      const visualSize = 200;
      const spacing = visualSize / gridLines;
      for (let i = 0; i <= gridLines; i++) {
        const line = document.createElement("div");
        line.className = "target-grid-line h" + (i === gridLines / 2 ? " major" : "");
        line.style.top = i * spacing + "px";
        gridContainer.appendChild(line);
      }
      for (let i = 0; i <= gridLines; i++) {
        const line = document.createElement("div");
        line.className = "target-grid-line v" + (i === gridLines / 2 ? " major" : "");
        line.style.left = i * spacing + "px";
        gridContainer.appendChild(line);
      }
      shapeEl.style.display = "block";
      shapeEl.className = "target-shape";
      if (preset.shape === "circle") {
        shapeEl.classList.add("circle");
        shapeEl.style.width = "80%";
        shapeEl.style.height = "80%";
      } else if (preset.shape === "rect" && preset.width && preset.height) {
        const aspect = preset.height / preset.width;
        if (aspect > 1) {
          shapeEl.style.height = "90%";
          shapeEl.style.width = 90 / aspect + "%";
        } else {
          shapeEl.style.width = "90%";
          shapeEl.style.height = 90 * aspect + "%";
        }
      } else {
        shapeEl.style.width = "80%";
        shapeEl.style.height = "80%";
      }
    }
  };
  const handleTargetClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    let targetSizeInches = targetSize;
    if (isMetric) {
      targetSizeInches = targetSize * conv2.cmToIn;
    }
    const pixelsPerInch = rect.width / targetSizeInches;
    const offsetXInches = (x - centerX) / pixelsPerInch;
    const offsetYInches = -(y - centerY) / pixelsPerInch;
    setShotMarkerPos({ x, y });
    setShotMarkerVisible(true);
    let dispX = offsetXInches;
    let dispY = offsetYInches;
    if (isMetric) {
      dispX = offsetXInches * conv2.inToMm;
      dispY = offsetYInches * conv2.inToMm;
    }
    setOffsetX(Number(dispX.toFixed(1)));
    setOffsetY(Number(dispY.toFixed(1)));
  };
  const calculateZoomScale = () => {
    let offsetXInches = offsetX;
    let offsetYInches = offsetY;
    if (isMetric) {
      offsetXInches = offsetX * conv2.mmToIn;
      offsetYInches = offsetY * conv2.mmToIn;
    }
    let targetSizeInches = targetSize;
    if (isMetric) {
      targetSizeInches = targetSize * conv2.cmToIn;
    }
    const targetRadius = targetSizeInches / 2;
    const maxOffset = Math.max(
      Math.abs(offsetXInches),
      Math.abs(offsetYInches)
    );
    if (maxOffset <= targetRadius) {
      return 1;
    }
    const requiredRadius = maxOffset * 1.2;
    return targetRadius / requiredRadius;
  };
  const zoomScale = calculateZoomScale();
  const updateShotFromInputs = () => {
    let offsetXInches = offsetX;
    let offsetYInches = offsetY;
    if (isMetric) {
      offsetXInches = offsetX * conv2.mmToIn;
      offsetYInches = offsetY * conv2.mmToIn;
    }
    const visual = targetVisualRef.current;
    if (!visual) return;
    let targetSizeInches = targetSize;
    if (isMetric) {
      targetSizeInches = targetSize * conv2.cmToIn;
    }
    const effectiveTargetSize = targetSizeInches / zoomScale;
    const pixelsPerInch = visual.offsetWidth / effectiveTargetSize;
    const centerX = visual.offsetWidth / 2;
    const centerY = visual.offsetHeight / 2;
    const markerX = centerX + offsetXInches * pixelsPerInch;
    const markerY = centerY - offsetYInches * pixelsPerInch;
    setShotMarkerPos({ x: markerX, y: markerY });
    setShotMarkerVisible(Math.abs(offsetX) > 0.01 || Math.abs(offsetY) > 0.01);
  };
  const calculateAdjustment = () => {
    let offsetXInches = offsetX;
    let offsetYInches = offsetY;
    if (isMetric) {
      offsetXInches = offsetX * conv2.mmToIn;
      offsetYInches = offsetY * conv2.mmToIn;
    }
    let distanceYards = distance;
    if (isMetric) {
      distanceYards = distance * conv2.mToYds;
    }
    const moaPerInchAt100 = 1 / 1.047;
    const milPerInchAt100 = 1 / 3.6;
    const distanceFactor = 100 / distanceYards;
    const moaX = offsetXInches * moaPerInchAt100 * distanceFactor;
    const moaY = offsetYInches * moaPerInchAt100 * distanceFactor;
    const milX = offsetXInches * milPerInchAt100 * distanceFactor;
    const milY = offsetYInches * milPerInchAt100 * distanceFactor;
    let clicksX, clicksY, clickUnit;
    if (clickValue.includes("moa")) {
      const clickMoa = parseFloat(clickValue);
      clicksX = Math.round(moaX / clickMoa);
      clicksY = Math.round(moaY / clickMoa);
      clickUnit = clickValue.replace(/[0-9.]/g, "").toUpperCase();
    } else {
      const clickMil = parseFloat(clickValue);
      clicksX = Math.round(milX / clickMil);
      clicksY = Math.round(milY / clickMil);
      clickUnit = "MIL";
    }
    const horizDir = offsetXInches > 0 ? "Left" : "Right";
    const vertDir = offsetYInches > 0 ? "Down" : "Up";
    const horizArrow = offsetXInches > 0 ? "\u2190" : "\u2192";
    const vertArrow = offsetYInches > 0 ? "\u2193" : "\u2191";
    const absClicksX = Math.abs(clicksX);
    const absClicksY = Math.abs(clicksY);
    if (absClicksX === 0 && absClicksY === 0) {
      return /* @__PURE__ */ jsx2(
        "div",
        {
          style: {
            textAlign: "center",
            color: "var(--success)",
            fontSize: "0.875rem"
          },
          children: "\u2713 Shot is centered - no adjustment needed"
        }
      );
    }
    return /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsxs2("div", { className: "adjustment-grid", children: [
        /* @__PURE__ */ jsxs2("div", { className: "adjustment-item", children: [
          /* @__PURE__ */ jsx2("div", { className: "arrow", children: horizArrow }),
          /* @__PURE__ */ jsxs2("div", { className: "direction", children: [
            "Windage (",
            horizDir,
            ")"
          ] }),
          /* @__PURE__ */ jsx2("div", { className: "value", children: absClicksX }),
          /* @__PURE__ */ jsx2("div", { className: "unit", children: "clicks" })
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "adjustment-item", children: [
          /* @__PURE__ */ jsx2("div", { className: "arrow", children: vertArrow }),
          /* @__PURE__ */ jsxs2("div", { className: "direction", children: [
            "Elevation (",
            vertDir,
            ")"
          ] }),
          /* @__PURE__ */ jsx2("div", { className: "value", children: absClicksY }),
          /* @__PURE__ */ jsx2("div", { className: "unit", children: "clicks" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "click-info", children: [
        /* @__PURE__ */ jsxs2("strong", { children: [
          Math.abs(moaX).toFixed(1),
          " MOA"
        ] }),
        " ",
        horizDir.toLowerCase(),
        " \xB7",
        /* @__PURE__ */ jsxs2("strong", { children: [
          " ",
          Math.abs(moaY).toFixed(1),
          " MOA"
        ] }),
        " ",
        vertDir.toLowerCase(),
        /* @__PURE__ */ jsx2("br", {}),
        /* @__PURE__ */ jsxs2("span", { style: { color: "var(--muted)" }, children: [
          Math.abs(milX).toFixed(2),
          " MIL ",
          horizDir.toLowerCase(),
          " \xB7",
          " ",
          Math.abs(milY).toFixed(2),
          " MIL ",
          vertDir.toLowerCase()
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs2("div", { className: "card", children: [
    /* @__PURE__ */ jsx2("h2", { className: "card-title", children: "Scope Adjustment" }),
    /* @__PURE__ */ jsx2(
      "p",
      {
        style: {
          fontSize: "0.8125rem",
          color: "var(--muted-foreground)",
          margin: "0 0 1.25rem 0"
        },
        children: "Click on the target where your shot landed to calculate scope adjustments."
      }
    ),
    /* @__PURE__ */ jsxs2("div", { className: "target-container", children: [
      /* @__PURE__ */ jsxs2("div", { className: "target-wrapper", children: [
        /* @__PURE__ */ jsxs2("div", { className: "display-toggle", children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: displayMode === "rings" ? "active" : "",
              onClick: () => setDisplayMode("rings"),
              children: "Rings"
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: displayMode === "grid" ? "active" : "",
              onClick: () => setDisplayMode("grid"),
              children: "Grid"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2(
          "div",
          {
            className: "target-visual",
            ref: targetVisualRef,
            onClick: handleTargetClick,
            children: [
              /* @__PURE__ */ jsxs2(
                "div",
                {
                  className: "target-content",
                  style: {
                    transform: `scale(${zoomScale})`,
                    transition: "transform 0.3s ease-out"
                  },
                  children: [
                    /* @__PURE__ */ jsx2("div", { className: "target-crosshair h" }),
                    /* @__PURE__ */ jsx2("div", { className: "target-crosshair v" }),
                    /* @__PURE__ */ jsx2("div", { className: "target-rings", ref: ringsRef }),
                    /* @__PURE__ */ jsx2(
                      "div",
                      {
                        className: "target-grid",
                        ref: gridRef,
                        style: { display: "none" }
                      }
                    ),
                    /* @__PURE__ */ jsx2(
                      "div",
                      {
                        className: "target-shape",
                        ref: shapeRef,
                        style: { display: "none" }
                      }
                    )
                  ]
                }
              ),
              shotMarkerVisible && /* @__PURE__ */ jsx2(
                "div",
                {
                  className: "shot-marker",
                  style: {
                    left: shotMarkerPos.x + "px",
                    top: shotMarkerPos.y + "px"
                  }
                }
              ),
              zoomScale < 1 && /* @__PURE__ */ jsxs2("div", { className: "zoom-indicator", children: [
                Math.round(zoomScale * 100),
                "%"
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "target-form", children: [
        /* @__PURE__ */ jsxs2("div", { className: "form-grid", children: [
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsx2("label", { children: "Target Type" }),
            /* @__PURE__ */ jsxs2(
              "select",
              {
                value: targetType,
                onChange: (e) => setTargetType(e.target.value),
                children: [
                  /* @__PURE__ */ jsx2("option", { value: "ipsc", children: 'IPSC/USPSA (18" \xD7 30")' }),
                  /* @__PURE__ */ jsx2("option", { value: "nra-b8", children: 'NRA B-8 (5.5" ring)' }),
                  /* @__PURE__ */ jsx2("option", { value: "moa-grid", children: "1 MOA Grid" }),
                  /* @__PURE__ */ jsx2("option", { value: "steel-12", children: '12" Steel' }),
                  /* @__PURE__ */ jsx2("option", { value: "steel-8", children: '8" Steel' }),
                  /* @__PURE__ */ jsx2("option", { value: "custom", children: "Custom Size" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs2("label", { children: [
              "Shot Distance",
              " ",
              /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
                "(",
                isMetric ? "m" : "yds",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx2(
              "input",
              {
                type: "number",
                value: distance,
                onChange: (e) => setDistance(Number(e.target.value)),
                step: "25"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs2("label", { children: [
              "Target Size",
              " ",
              /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
                "(",
                isMetric ? "cm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx2(
              "input",
              {
                type: "number",
                value: targetSize,
                onChange: (e) => setTargetSize(Number(e.target.value)),
                step: "1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsx2("label", { children: "Click Value" }),
            /* @__PURE__ */ jsxs2(
              "select",
              {
                value: clickValue,
                onChange: (e) => setClickValue(e.target.value),
                children: [
                  /* @__PURE__ */ jsx2("option", { value: "0.25moa", children: "1/4 MOA" }),
                  /* @__PURE__ */ jsx2("option", { value: "0.5moa", children: "1/2 MOA" }),
                  /* @__PURE__ */ jsx2("option", { value: "1moa", children: "1 MOA" }),
                  /* @__PURE__ */ jsx2("option", { value: "0.1mil", children: "0.1 MIL" }),
                  /* @__PURE__ */ jsx2("option", { value: "0.2mil", children: "0.2 MIL" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs2("label", { children: [
              "Horizontal Offset",
              " ",
              /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
                "(",
                isMetric ? "mm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx2(
              "input",
              {
                type: "number",
                value: offsetX,
                onChange: (e) => setOffsetX(Number(e.target.value)),
                step: "0.1"
              }
            ),
            /* @__PURE__ */ jsx2("p", { className: "help-text", children: "+ Right, \u2212 Left" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs2("label", { children: [
              "Vertical Offset",
              " ",
              /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
                "(",
                isMetric ? "mm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx2(
              "input",
              {
                type: "number",
                value: offsetY,
                onChange: (e) => setOffsetY(Number(e.target.value)),
                step: "0.1"
              }
            ),
            /* @__PURE__ */ jsx2("p", { className: "help-text", children: "+ High, \u2212 Low" })
          ] })
        ] }),
        /* @__PURE__ */ jsx2(
          "div",
          {
            className: `adjustment-result ${Math.abs(offsetX) > 0.01 || Math.abs(offsetY) > 0.01 ? "has-adjustment" : ""}`,
            children: Math.abs(offsetX) < 0.01 && Math.abs(offsetY) < 0.01 ? /* @__PURE__ */ jsx2(
              "div",
              {
                style: {
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: "0.875rem"
                },
                children: "Click on target or enter offset values to see adjustments"
              }
            ) : calculateAdjustment()
          }
        )
      ] })
    ] })
  ] });
}

// components/App.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var APP_STORAGE_KEY = "drift-app-preferences";
function loadAppPreferences() {
  try {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
  }
  return null;
}
function App() {
  const saved = loadAppPreferences();
  const [currentView, setCurrentView] = useState3(
    saved?.currentView ?? "calculator"
  );
  const [unitSystem, setUnitSystem] = useState3(
    saved?.unitSystem ?? "imperial"
  );
  const [scopeAdjustmentData, setScopeAdjustmentData] = useState3(null);
  useEffect3(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
      currentView,
      unitSystem
    }));
  }, [currentView, unitSystem]);
  const handleScopeAdjustment = (data) => {
    setScopeAdjustmentData(data);
    setCurrentView("adjustment");
  };
  return /* @__PURE__ */ jsxs3("div", { className: "container", children: [
    /* @__PURE__ */ jsxs3("div", { className: "experimental-banner", children: [
      /* @__PURE__ */ jsxs3(
        "svg",
        {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            /* @__PURE__ */ jsx3("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
            /* @__PURE__ */ jsx3("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
            /* @__PURE__ */ jsx3("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs3("span", { children: [
        /* @__PURE__ */ jsx3("strong", { children: "Experimental" }),
        " \u2014 This app is still a work in progress. Results may not be accurate."
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("header", { children: [
      /* @__PURE__ */ jsxs3("div", { className: "logo", children: [
        /* @__PURE__ */ jsxs3(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "6" }),
              /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "2" })
            ]
          }
        ),
        /* @__PURE__ */ jsx3("h1", { children: "Drift0" })
      ] }),
      /* @__PURE__ */ jsxs3("nav", { className: "nav-tabs", children: [
        /* @__PURE__ */ jsx3(
          "button",
          {
            className: `nav-tab ${currentView === "calculator" ? "active" : ""}`,
            onClick: () => setCurrentView("calculator"),
            children: "Calculator"
          }
        ),
        /* @__PURE__ */ jsx3(
          "button",
          {
            className: `nav-tab ${currentView === "adjustment" ? "active" : ""}`,
            onClick: () => setCurrentView("adjustment"),
            children: "Scope Adjustment"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "system-toggle", children: [
        /* @__PURE__ */ jsx3(
          "button",
          {
            className: unitSystem === "imperial" ? "active" : "",
            onClick: () => setUnitSystem("imperial"),
            children: "Imperial"
          }
        ),
        /* @__PURE__ */ jsx3(
          "button",
          {
            className: unitSystem === "metric" ? "active" : "",
            onClick: () => setUnitSystem("metric"),
            children: "Metric"
          }
        )
      ] })
    ] }),
    currentView === "calculator" && /* @__PURE__ */ jsx3(
      Calculator,
      {
        unitSystem,
        onUnitSystemChange: setUnitSystem,
        onScopeAdjustment: handleScopeAdjustment
      }
    ),
    currentView === "adjustment" && /* @__PURE__ */ jsx3(
      ScopeAdjustment,
      {
        unitSystem,
        onUnitSystemChange: setUnitSystem,
        initialData: scopeAdjustmentData,
        onDataConsumed: () => setScopeAdjustmentData(null)
      }
    )
  ] });
}

// app.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
var rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
var root = createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsx4(StrictMode, { children: /* @__PURE__ */ jsx4(App, {}) })
);
