// app.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// components/App.tsx
import { useState as useState4 } from "react";

// components/Calculator.tsx
import { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";

// components/DriftVisualizer.tsx
import { useState, useEffect, useRef } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var conv = {
  inToCm: 2.54,
  cmToIn: 0.3937,
  inToMm: 25.4,
  mmToIn: 0.03937,
  mToYds: 1.09361,
  ydsToM: 0.9144
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
  "deer-vitals": {
    size: 10,
    name: "Deer Vitals",
    shape: "circle",
    gridLines: 5
  },
  "elk-vitals": {
    size: 14,
    name: "Elk Vitals",
    shape: "circle",
    gridLines: 7
  }
};
function DriftVisualizer({
  drop,
  windDrift,
  distance,
  unitSystem,
  onClose,
  onScopeAdjustment
}) {
  const [targetType, setTargetType] = useState(
    "ipsc"
  );
  const [displayMode, setDisplayMode] = useState("rings");
  const targetVisualRef = useRef(null);
  const ringsRef = useRef(null);
  const gridRef = useRef(null);
  const shapeRef = useRef(null);
  const isMetric = unitSystem === "metric";
  const preset = targetPresets[targetType];
  const targetSizeInches = preset.size;
  const targetSizeDisplay = isMetric ? (targetSizeInches * conv.inToCm).toFixed(1) : targetSizeInches;
  const dropInches = drop * conv.mmToIn;
  const driftInches = windDrift * conv.mmToIn;
  const dropDisplay = isMetric ? drop.toFixed(1) : dropInches.toFixed(1);
  const driftDisplay = isMetric ? windDrift.toFixed(1) : driftInches.toFixed(1);
  const distanceDisplay = isMetric ? distance : Math.round(distance * conv.mToYds);
  const impactRadius = Math.sqrt(
    dropInches * dropInches + driftInches * driftInches
  );
  const targetRadius = targetSizeInches / 2;
  const isOnTarget = impactRadius <= targetRadius;
  const isOnRectTarget = () => {
    if (preset.shape !== "rect" || !preset.width || !preset.height) {
      return isOnTarget;
    }
    return Math.abs(driftInches) <= preset.width / 2 && Math.abs(dropInches) <= preset.height / 2;
  };
  const actuallyOnTarget = preset.shape === "rect" ? isOnRectTarget() : isOnTarget;
  useEffect(() => {
    updateTargetVisual();
  }, [targetType, displayMode]);
  const updateTargetVisual = () => {
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
      const visualSize = 180;
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
  const getMarkerPosition = () => {
    const visualSize = 180;
    const centerX = visualSize / 2;
    const centerY = visualSize / 2;
    const targetVisualDiameter = visualSize * 0.9;
    const pixelsPerInch = targetVisualDiameter / targetSizeInches;
    const markerX = centerX + driftInches * pixelsPerInch;
    const markerY = centerY + dropInches * pixelsPerInch;
    const padding = 6;
    return {
      x: Math.max(padding, Math.min(visualSize - padding, markerX)),
      y: Math.max(padding, Math.min(visualSize - padding, markerY))
    };
  };
  const markerPos = getMarkerPosition();
  return /* @__PURE__ */ jsxs("div", { className: "drift-visualizer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "drift-visualizer-header", children: [
      /* @__PURE__ */ jsxs("h4", { children: [
        "Impact at ",
        distanceDisplay,
        " ",
        isMetric ? "m" : "yds"
      ] }),
      /* @__PURE__ */ jsx("button", { className: "drift-close-btn", onClick: onClose, children: "\xD7" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "drift-controls", children: [
      /* @__PURE__ */ jsxs("div", { className: "drift-control-group", children: [
        /* @__PURE__ */ jsx("label", { children: "Target" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: targetType,
            onChange: (e) => setTargetType(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "ipsc", children: 'IPSC (18"\xD730")' }),
              /* @__PURE__ */ jsx("option", { value: "nra-b8", children: 'NRA B-8 (5.5")' }),
              /* @__PURE__ */ jsx("option", { value: "steel-12", children: '12" Steel' }),
              /* @__PURE__ */ jsx("option", { value: "steel-8", children: '8" Steel' }),
              /* @__PURE__ */ jsx("option", { value: "deer-vitals", children: 'Deer Vitals (10")' }),
              /* @__PURE__ */ jsx("option", { value: "elk-vitals", children: 'Elk Vitals (14")' })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "drift-display-toggle", children: [
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
    /* @__PURE__ */ jsxs("div", { className: "drift-target-wrapper", children: [
      /* @__PURE__ */ jsxs("div", { className: "drift-target-visual", ref: targetVisualRef, children: [
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
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "drift-target-label", children: [
        targetSizeDisplay,
        isMetric ? "cm" : '"',
        " target"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "drift-stats", children: [
      /* @__PURE__ */ jsxs("div", { className: "drift-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "drift-stat-label", children: "Drop" }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: `drift-stat-value ${Math.abs(drop) > 12.7 ? "negative" : "positive"}`,
            children: [
              drop > 0 ? "+" : "",
              dropDisplay,
              isMetric ? "mm" : '"'
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "drift-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "drift-stat-label", children: "Wind Drift" }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: `drift-stat-value ${Math.abs(windDrift) > 12.7 ? "negative" : "positive"}`,
            children: [
              windDrift > 0 ? "+" : "",
              driftDisplay,
              isMetric ? "mm" : '"'
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `drift-verdict ${actuallyOnTarget ? "hit" : "miss"}`, children: actuallyOnTarget ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("span", { className: "verdict-icon", children: "\u2713" }),
      /* @__PURE__ */ jsx("span", { children: "On Target" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("span", { className: "verdict-icon", children: "\u2717" }),
      /* @__PURE__ */ jsx("span", { children: "Off Target" })
    ] }) }),
    onScopeAdjustment && /* @__PURE__ */ jsxs(
      "button",
      {
        className: "drift-scope-btn",
        onClick: () => {
          onScopeAdjustment({
            offsetX: windDrift,
            offsetY: -drop,
            // Negative because drop is down, but scope adjustment uses positive = high
            distance
          });
          onClose();
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
              width: "14",
              height: "14",
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
  ] });
}

// components/Calculator.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var conv2 = {
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
function Calculator({
  unitSystem,
  onUnitSystemChange,
  onScopeAdjustment
}) {
  const [muzzleVelocity, setMuzzleVelocity] = useState2(2700);
  const [bulletWeight, setBulletWeight] = useState2(168);
  const [ballisticCoefficient, setBallisticCoefficient] = useState2(0.462);
  const [zeroRange, setZeroRange] = useState2(100);
  const [sightHeight, setSightHeight] = useState2(1.5);
  const [targetDistance, setTargetDistance] = useState2(1e3);
  const [windSpeed, setWindSpeed] = useState2(10);
  const [windAngle, setWindAngle] = useState2(90);
  const [temperature, setTemperature] = useState2(59);
  const [altitude, setAltitude] = useState2(0);
  const [results, setResults] = useState2(null);
  const [currentUnit, setCurrentUnit] = useState2("moa");
  const [isCalculating, setIsCalculating] = useState2(false);
  const [activeVisualizerRow, setActiveVisualizerRow] = useState2(
    null
  );
  const prevUnitSystemRef = useRef2(unitSystem);
  const loadPreset = (name) => {
    const preset = presets[name];
    if (preset) {
      let vel = preset.muzzleVelocity;
      let weight = preset.bulletWeight;
      if (unitSystem === "metric") {
        vel = Math.round(vel * conv2.fpsToMs);
        weight = Number((weight * conv2.grToG).toFixed(1));
      }
      setMuzzleVelocity(vel);
      setBulletWeight(weight);
      setBallisticCoefficient(preset.ballisticCoefficient);
    }
  };
  const calculate = async () => {
    setIsCalculating(true);
    try {
      let vel = muzzleVelocity;
      let weight = bulletWeight;
      let zero = zeroRange;
      let sight = sightHeight;
      let dist = targetDistance;
      let wind = windSpeed;
      let temp = temperature;
      let alt = altitude;
      if (unitSystem === "imperial") {
        vel = vel * conv2.fpsToMs;
        weight = weight * conv2.grToG;
        zero = zero * conv2.ydsToM;
        sight = sight * conv2.inToMm;
        dist = dist * conv2.ydsToM;
        wind = wind * conv2.mphToMs;
        temp = fToC(temp);
        alt = alt * conv2.ftToM;
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
  useEffect2(() => {
    if (prevUnitSystemRef.current === unitSystem) return;
    const fromSystem = prevUnitSystemRef.current;
    const toSystem = unitSystem;
    if (toSystem === "metric") {
      setMuzzleVelocity((v) => Math.round(v * conv2.fpsToMs));
      setBulletWeight((w) => Number((w * conv2.grToG).toFixed(1)));
      setZeroRange((z) => Math.round(z * conv2.ydsToM));
      setSightHeight((s) => Number((s * conv2.inToMm).toFixed(0)));
      setTargetDistance((d) => Math.round(d * conv2.ydsToM));
      setWindSpeed((w) => Number((w * conv2.mphToMs).toFixed(1)));
      setTemperature((t) => Math.round(fToC(t)));
      setAltitude((a) => Math.round(a * conv2.ftToM));
    } else {
      setMuzzleVelocity((v) => Math.round(v * conv2.msToFps));
      setBulletWeight((w) => Number((w * conv2.gToGr).toFixed(0)));
      setZeroRange((z) => Math.round(z * conv2.mToYds));
      setSightHeight((s) => Number((s * conv2.mmToIn).toFixed(1)));
      setTargetDistance((d) => Math.round(d * conv2.mToYds));
      setWindSpeed((w) => Number((w * conv2.msToMph).toFixed(0)));
      setTemperature((t) => Math.round(cToF(t)));
      setAltitude((a) => Math.round(a * conv2.mToFt));
    }
    prevUnitSystemRef.current = unitSystem;
  }, [unitSystem]);
  useEffect2(() => {
    calculate();
  }, []);
  useEffect2(() => {
    const handleClickOutside = (e) => {
      const target = e.target;
      if (!target.closest(".drift-visualizer") && !target.closest(".clickable-row")) {
        setActiveVisualizerRow(null);
      }
    };
    if (activeVisualizerRow !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeVisualizerRow]);
  const isMetric = unitSystem === "metric";
  const distLabel = isMetric ? "m" : "yds";
  const velLabel = isMetric ? "m/s" : "fps";
  const energyLabel = isMetric ? "J" : "ft-lb";
  const dropLabel = isMetric ? "mm" : '"';
  const displayDist = (d) => isMetric ? d : Math.round(d * conv2.mToYds);
  const displayVel = (v) => isMetric ? v : Math.round(v * conv2.msToFps);
  const displayEnergy = (e) => isMetric ? e : Math.round(e * conv2.jToFtlb);
  const displayDrop = (d) => isMetric ? d : Number((d * conv2.mmToIn).toFixed(1));
  return /* @__PURE__ */ jsxs2("div", { className: "grid", children: [
    /* @__PURE__ */ jsx2("div", { className: "sidebar", children: /* @__PURE__ */ jsxs2("div", { className: "card", children: [
      /* @__PURE__ */ jsx2("h3", { className: "card-title", children: "Cartridge" }),
      /* @__PURE__ */ jsxs2("div", { className: "presets", children: [
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("556"), children: "5.56 NATO" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("762x39"), children: "7.62x39" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("308"), children: "308 Win" }),
        /* @__PURE__ */ jsx2(
          "button",
          {
            className: "preset-btn",
            onClick: () => loadPreset("762x54r"),
            children: "7.62x54R"
          }
        ),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("6.5cm"), children: "6.5 Creedmoor" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("6.5prc"), children: "6.5 PRC" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("243"), children: "243 Win" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("270"), children: "270 Win" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("3006"), children: "30-06" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("300wm"), children: "300 Win Mag" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("300prc"), children: "300 PRC" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("338lm"), children: "338 Lapua" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("375ct"), children: "375 CheyTac" }),
        /* @__PURE__ */ jsx2("button", { className: "preset-btn", onClick: () => loadPreset("50bmg"), children: "50 BMG" })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Muzzle Velocity",
            " ",
            /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m/s" : "fps",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: muzzleVelocity,
              onChange: (e) => setMuzzleVelocity(Number(e.target.value)),
              step: "10"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Bullet Weight",
            " ",
            /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
              "(",
              isMetric ? "g" : "gr",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: bulletWeight,
              onChange: (e) => setBulletWeight(Number(e.target.value)),
              step: "1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group full", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Ballistic Coefficient ",
            /* @__PURE__ */ jsx2("span", { className: "label-hint", children: "(G1)" })
          ] }),
          /* @__PURE__ */ jsx2(
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
      /* @__PURE__ */ jsx2("div", { className: "divider" }),
      /* @__PURE__ */ jsx2("h3", { className: "card-title", children: "Rifle Setup" }),
      /* @__PURE__ */ jsxs2("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Zero Range",
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
              value: zeroRange,
              onChange: (e) => setZeroRange(Number(e.target.value)),
              step: "25"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Sight Height",
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
              value: sightHeight,
              onChange: (e) => setSightHeight(Number(e.target.value)),
              step: "0.1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group full", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Target Distance",
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
              value: targetDistance,
              onChange: (e) => setTargetDistance(Number(e.target.value)),
              step: "50"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "divider" }),
      /* @__PURE__ */ jsx2("h3", { className: "card-title", children: "Environment" }),
      /* @__PURE__ */ jsxs2("div", { className: "form-grid", children: [
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Wind Speed",
            " ",
            /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m/s" : "mph",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: windSpeed,
              onChange: (e) => setWindSpeed(Number(e.target.value)),
              step: "1"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Wind Angle ",
            /* @__PURE__ */ jsx2("span", { className: "label-hint", children: "(deg)" })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: windAngle,
              onChange: (e) => setWindAngle(Number(e.target.value)),
              step: "15"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Temperature",
            " ",
            /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
              "(",
              isMetric ? "\xB0C" : "\xB0F",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: temperature,
              onChange: (e) => setTemperature(Number(e.target.value)),
              step: "5"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "form-group", children: [
          /* @__PURE__ */ jsxs2("label", { children: [
            "Altitude",
            " ",
            /* @__PURE__ */ jsxs2("span", { className: "label-hint", children: [
              "(",
              isMetric ? "m" : "ft",
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx2(
            "input",
            {
              type: "number",
              value: altitude,
              onChange: (e) => setAltitude(Number(e.target.value)),
              step: "500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "divider" }),
      /* @__PURE__ */ jsx2("button", { onClick: calculate, disabled: isCalculating, children: isCalculating ? "Calculating..." : "Calculate Trajectory" })
    ] }) }),
    /* @__PURE__ */ jsx2("div", { className: "main", children: /* @__PURE__ */ jsxs2("div", { className: "card", children: [
      /* @__PURE__ */ jsxs2("div", { className: "results-header", children: [
        /* @__PURE__ */ jsx2("h2", { children: "Trajectory Table" }),
        /* @__PURE__ */ jsxs2("div", { className: "unit-toggle", children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: currentUnit === "moa" ? "active" : "",
              onClick: () => setCurrentUnit("moa"),
              children: "MOA"
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              className: currentUnit === "mil" ? "active" : "",
              onClick: () => setCurrentUnit("mil"),
              children: "MIL"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx2("div", { id: "results", children: !results || results.length === 0 ? /* @__PURE__ */ jsxs2("div", { className: "empty-state", children: [
        /* @__PURE__ */ jsxs2(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ jsx2("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
              /* @__PURE__ */ jsx2("circle", { cx: "12", cy: "12", r: "3" })
            ]
          }
        ),
        /* @__PURE__ */ jsx2("p", { children: "Enter your parameters and click Calculate to view the trajectory" })
      ] }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
        /* @__PURE__ */ jsxs2("div", { className: "summary-grid", children: [
          /* @__PURE__ */ jsxs2("div", { className: "summary-card", children: [
            /* @__PURE__ */ jsx2("div", { className: "label", children: "Max Range" }),
            /* @__PURE__ */ jsxs2("div", { className: "value", children: [
              displayDist(results[results.length - 1].distance),
              " ",
              distLabel
            ] })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "summary-card", children: [
            /* @__PURE__ */ jsx2("div", { className: "label", children: "Final Velocity" }),
            /* @__PURE__ */ jsxs2("div", { className: "value", children: [
              displayVel(results[results.length - 1].velocity),
              " ",
              velLabel
            ] })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "summary-card", children: [
            /* @__PURE__ */ jsx2("div", { className: "label", children: "Final Energy" }),
            /* @__PURE__ */ jsxs2("div", { className: "value", children: [
              displayEnergy(results[results.length - 1].energy),
              " ",
              energyLabel
            ] })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "summary-card", children: [
            /* @__PURE__ */ jsx2("div", { className: "label", children: "Time of Flight" }),
            /* @__PURE__ */ jsxs2("div", { className: "value", children: [
              results[results.length - 1].timeOfFlight,
              "s"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx2("div", { className: "table-wrapper", children: /* @__PURE__ */ jsxs2("table", { children: [
          /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
            /* @__PURE__ */ jsx2("th", { children: "Distance" }),
            /* @__PURE__ */ jsx2("th", { children: "Velocity" }),
            /* @__PURE__ */ jsx2("th", { children: "Energy" }),
            /* @__PURE__ */ jsxs2("th", { children: [
              "Drop",
              /* @__PURE__ */ jsx2("span", { className: "table-hint", children: "(click row)" })
            ] }),
            /* @__PURE__ */ jsx2("th", { children: "Wind" }),
            /* @__PURE__ */ jsx2("th", { children: "TOF" }),
            /* @__PURE__ */ jsx2("th", { children: currentUnit.toUpperCase() })
          ] }) }),
          /* @__PURE__ */ jsx2("tbody", { children: results.map((r, index) => {
            const drop = displayDrop(r.drop);
            const drift = displayDrop(r.windDrift);
            const isZero = Math.abs(r.drop) < 0.5 && r.distance > 0 && r.distance <= 150;
            const dropClass = r.drop > 0.5 ? "negative" : r.drop < -0.5 ? "negative" : "positive";
            const windClass = r.windDrift > 0 ? "negative" : "";
            const correction = currentUnit === "moa" ? r.moa : r.mil;
            const isActive = activeVisualizerRow === index;
            return /* @__PURE__ */ jsxs2(
              "tr",
              {
                className: `clickable-row ${isZero ? "highlight-row" : ""} ${isActive ? "row-active" : ""}`,
                onClick: () => setActiveVisualizerRow(isActive ? null : index),
                children: [
                  /* @__PURE__ */ jsxs2("td", { children: [
                    displayDist(r.distance),
                    " ",
                    distLabel
                  ] }),
                  /* @__PURE__ */ jsxs2("td", { children: [
                    displayVel(r.velocity),
                    " ",
                    velLabel
                  ] }),
                  /* @__PURE__ */ jsxs2("td", { children: [
                    displayEnergy(r.energy),
                    " ",
                    energyLabel
                  ] }),
                  /* @__PURE__ */ jsxs2(
                    "td",
                    {
                      className: dropClass,
                      style: { position: "relative" },
                      children: [
                        drop > 0 ? "+" : "",
                        drop,
                        dropLabel,
                        isActive && /* @__PURE__ */ jsx2(
                          DriftVisualizer,
                          {
                            drop: r.drop,
                            windDrift: r.windDrift,
                            distance: r.distance,
                            unitSystem,
                            onClose: () => setActiveVisualizerRow(null),
                            onScopeAdjustment
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs2("td", { className: windClass, children: [
                    drift > 0 ? "+" : "",
                    drift,
                    dropLabel
                  ] }),
                  /* @__PURE__ */ jsxs2("td", { children: [
                    r.timeOfFlight,
                    "s"
                  ] }),
                  /* @__PURE__ */ jsxs2("td", { children: [
                    correction > 0 ? "+" : "",
                    correction
                  ] })
                ]
              },
              r.distance
            );
          }) })
        ] }) })
      ] }) })
    ] }) })
  ] });
}

// components/ScopeAdjustment.tsx
import { useState as useState3, useEffect as useEffect3, useRef as useRef3 } from "react";
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var conv3 = {
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
  const [targetType, setTargetType] = useState3(
    "ipsc"
  );
  const [targetSize, setTargetSize] = useState3(18);
  const [distance, setDistance] = useState3(100);
  const [clickValue, setClickValue] = useState3("0.25moa");
  const [offsetX, setOffsetX] = useState3(0);
  const [offsetY, setOffsetY] = useState3(0);
  const [displayMode, setDisplayMode] = useState3("rings");
  const [shotMarkerVisible, setShotMarkerVisible] = useState3(false);
  const [shotMarkerPos, setShotMarkerPos] = useState3({ x: 0, y: 0 });
  const targetVisualRef = useRef3(null);
  const ringsRef = useRef3(null);
  const gridRef = useRef3(null);
  const shapeRef = useRef3(null);
  const isMetric = unitSystem === "metric";
  useEffect3(() => {
    if (initialData) {
      if (isMetric) {
        setOffsetX(Number(initialData.offsetX.toFixed(1)));
        setOffsetY(Number(initialData.offsetY.toFixed(1)));
        setDistance(Math.round(initialData.distance));
      } else {
        setOffsetX(Number((initialData.offsetX * conv3.mmToIn).toFixed(1)));
        setOffsetY(Number((initialData.offsetY * conv3.mmToIn).toFixed(1)));
        setDistance(Math.round(initialData.distance * conv3.mToYds));
      }
      setShotMarkerVisible(true);
      onDataConsumed?.();
    }
  }, [initialData]);
  useEffect3(() => {
    const preset = targetPresets2[targetType];
    let size = preset.size;
    if (isMetric) {
      size = Number((size * conv3.inToCm).toFixed(1));
    }
    setTargetSize(size);
    updateTargetVisual();
  }, [targetType, unitSystem, displayMode]);
  useEffect3(() => {
    updateTargetVisual();
  }, [displayMode]);
  useEffect3(() => {
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
      targetSizeInches = targetSize * conv3.cmToIn;
    }
    const pixelsPerInch = rect.width / targetSizeInches;
    const offsetXInches = (x - centerX) / pixelsPerInch;
    const offsetYInches = -(y - centerY) / pixelsPerInch;
    setShotMarkerPos({ x, y });
    setShotMarkerVisible(true);
    let dispX = offsetXInches;
    let dispY = offsetYInches;
    if (isMetric) {
      dispX = offsetXInches * conv3.inToMm;
      dispY = offsetYInches * conv3.inToMm;
    }
    setOffsetX(Number(dispX.toFixed(1)));
    setOffsetY(Number(dispY.toFixed(1)));
  };
  const updateShotFromInputs = () => {
    let offsetXInches = offsetX;
    let offsetYInches = offsetY;
    if (isMetric) {
      offsetXInches = offsetX * conv3.mmToIn;
      offsetYInches = offsetY * conv3.mmToIn;
    }
    const visual = targetVisualRef.current;
    if (!visual) return;
    let targetSizeInches = targetSize;
    if (isMetric) {
      targetSizeInches = targetSize * conv3.cmToIn;
    }
    const pixelsPerInch = visual.offsetWidth / targetSizeInches;
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
      offsetXInches = offsetX * conv3.mmToIn;
      offsetYInches = offsetY * conv3.mmToIn;
    }
    let distanceYards = distance;
    if (isMetric) {
      distanceYards = distance * conv3.mToYds;
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
      return /* @__PURE__ */ jsx3(
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
    return /* @__PURE__ */ jsxs3(Fragment3, { children: [
      /* @__PURE__ */ jsxs3("div", { className: "adjustment-grid", children: [
        /* @__PURE__ */ jsxs3("div", { className: "adjustment-item", children: [
          /* @__PURE__ */ jsx3("div", { className: "arrow", children: horizArrow }),
          /* @__PURE__ */ jsxs3("div", { className: "direction", children: [
            "Windage (",
            horizDir,
            ")"
          ] }),
          /* @__PURE__ */ jsx3("div", { className: "value", children: absClicksX }),
          /* @__PURE__ */ jsx3("div", { className: "unit", children: "clicks" })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "adjustment-item", children: [
          /* @__PURE__ */ jsx3("div", { className: "arrow", children: vertArrow }),
          /* @__PURE__ */ jsxs3("div", { className: "direction", children: [
            "Elevation (",
            vertDir,
            ")"
          ] }),
          /* @__PURE__ */ jsx3("div", { className: "value", children: absClicksY }),
          /* @__PURE__ */ jsx3("div", { className: "unit", children: "clicks" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "click-info", children: [
        /* @__PURE__ */ jsxs3("strong", { children: [
          Math.abs(moaX).toFixed(1),
          " MOA"
        ] }),
        " ",
        horizDir.toLowerCase(),
        " \xB7",
        /* @__PURE__ */ jsxs3("strong", { children: [
          " ",
          Math.abs(moaY).toFixed(1),
          " MOA"
        ] }),
        " ",
        vertDir.toLowerCase(),
        /* @__PURE__ */ jsx3("br", {}),
        /* @__PURE__ */ jsxs3("span", { style: { color: "var(--muted)" }, children: [
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
  return /* @__PURE__ */ jsxs3("div", { className: "card", children: [
    /* @__PURE__ */ jsx3("h2", { className: "card-title", children: "Scope Adjustment" }),
    /* @__PURE__ */ jsx3(
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
    /* @__PURE__ */ jsxs3("div", { className: "target-container", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsxs3("div", { className: "display-toggle", children: [
          /* @__PURE__ */ jsx3(
            "button",
            {
              className: displayMode === "rings" ? "active" : "",
              onClick: () => setDisplayMode("rings"),
              children: "Rings"
            }
          ),
          /* @__PURE__ */ jsx3(
            "button",
            {
              className: displayMode === "grid" ? "active" : "",
              onClick: () => setDisplayMode("grid"),
              children: "Grid"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs3(
          "div",
          {
            className: "target-visual",
            ref: targetVisualRef,
            onClick: handleTargetClick,
            children: [
              /* @__PURE__ */ jsx3("div", { className: "target-crosshair h" }),
              /* @__PURE__ */ jsx3("div", { className: "target-crosshair v" }),
              /* @__PURE__ */ jsx3("div", { className: "target-rings", ref: ringsRef }),
              /* @__PURE__ */ jsx3(
                "div",
                {
                  className: "target-grid",
                  ref: gridRef,
                  style: { display: "none" }
                }
              ),
              /* @__PURE__ */ jsx3(
                "div",
                {
                  className: "target-shape",
                  ref: shapeRef,
                  style: { display: "none" }
                }
              ),
              shotMarkerVisible && /* @__PURE__ */ jsx3(
                "div",
                {
                  className: "shot-marker",
                  style: {
                    left: shotMarkerPos.x + "px",
                    top: shotMarkerPos.y + "px"
                  }
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "target-form", children: [
        /* @__PURE__ */ jsxs3("div", { className: "form-grid", children: [
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsx3("label", { children: "Target Type" }),
            /* @__PURE__ */ jsxs3(
              "select",
              {
                value: targetType,
                onChange: (e) => setTargetType(e.target.value),
                children: [
                  /* @__PURE__ */ jsx3("option", { value: "ipsc", children: 'IPSC/USPSA (18" \xD7 30")' }),
                  /* @__PURE__ */ jsx3("option", { value: "nra-b8", children: 'NRA B-8 (5.5" ring)' }),
                  /* @__PURE__ */ jsx3("option", { value: "moa-grid", children: "1 MOA Grid" }),
                  /* @__PURE__ */ jsx3("option", { value: "steel-12", children: '12" Steel' }),
                  /* @__PURE__ */ jsx3("option", { value: "steel-8", children: '8" Steel' }),
                  /* @__PURE__ */ jsx3("option", { value: "custom", children: "Custom Size" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs3("label", { children: [
              "Shot Distance",
              " ",
              /* @__PURE__ */ jsxs3("span", { className: "label-hint", children: [
                "(",
                isMetric ? "m" : "yds",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                value: distance,
                onChange: (e) => setDistance(Number(e.target.value)),
                step: "25"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs3("label", { children: [
              "Target Size",
              " ",
              /* @__PURE__ */ jsxs3("span", { className: "label-hint", children: [
                "(",
                isMetric ? "cm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                value: targetSize,
                onChange: (e) => setTargetSize(Number(e.target.value)),
                step: "1"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsx3("label", { children: "Click Value" }),
            /* @__PURE__ */ jsxs3(
              "select",
              {
                value: clickValue,
                onChange: (e) => setClickValue(e.target.value),
                children: [
                  /* @__PURE__ */ jsx3("option", { value: "0.25moa", children: "1/4 MOA" }),
                  /* @__PURE__ */ jsx3("option", { value: "0.5moa", children: "1/2 MOA" }),
                  /* @__PURE__ */ jsx3("option", { value: "1moa", children: "1 MOA" }),
                  /* @__PURE__ */ jsx3("option", { value: "0.1mil", children: "0.1 MIL" }),
                  /* @__PURE__ */ jsx3("option", { value: "0.2mil", children: "0.2 MIL" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs3("label", { children: [
              "Horizontal Offset",
              " ",
              /* @__PURE__ */ jsxs3("span", { className: "label-hint", children: [
                "(",
                isMetric ? "mm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                value: offsetX,
                onChange: (e) => setOffsetX(Number(e.target.value)),
                step: "0.1"
              }
            ),
            /* @__PURE__ */ jsx3("p", { className: "help-text", children: "+ Right, \u2212 Left" })
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "form-group", children: [
            /* @__PURE__ */ jsxs3("label", { children: [
              "Vertical Offset",
              " ",
              /* @__PURE__ */ jsxs3("span", { className: "label-hint", children: [
                "(",
                isMetric ? "mm" : "in",
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                value: offsetY,
                onChange: (e) => setOffsetY(Number(e.target.value)),
                step: "0.1"
              }
            ),
            /* @__PURE__ */ jsx3("p", { className: "help-text", children: "+ High, \u2212 Low" })
          ] })
        ] }),
        /* @__PURE__ */ jsx3(
          "div",
          {
            className: `adjustment-result ${Math.abs(offsetX) > 0.01 || Math.abs(offsetY) > 0.01 ? "has-adjustment" : ""}`,
            children: Math.abs(offsetX) < 0.01 && Math.abs(offsetY) < 0.01 ? /* @__PURE__ */ jsx3(
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
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function App() {
  const [currentView, setCurrentView] = useState4(
    "calculator"
  );
  const [unitSystem, setUnitSystem] = useState4(
    "imperial"
  );
  const [scopeAdjustmentData, setScopeAdjustmentData] = useState4(null);
  const handleScopeAdjustment = (data) => {
    setScopeAdjustmentData(data);
    setCurrentView("adjustment");
  };
  return /* @__PURE__ */ jsxs4("div", { className: "container", children: [
    /* @__PURE__ */ jsxs4("div", { className: "experimental-banner", children: [
      /* @__PURE__ */ jsxs4(
        "svg",
        {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            /* @__PURE__ */ jsx4("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
            /* @__PURE__ */ jsx4("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
            /* @__PURE__ */ jsx4("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs4("span", { children: [
        /* @__PURE__ */ jsx4("strong", { children: "Experimental" }),
        " \u2014 This app is still a work in progress. Results may not be accurate."
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("header", { children: [
      /* @__PURE__ */ jsxs4("div", { className: "logo", children: [
        /* @__PURE__ */ jsxs4(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "6" }),
              /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "2" })
            ]
          }
        ),
        /* @__PURE__ */ jsx4("h1", { children: "Drift" })
      ] }),
      /* @__PURE__ */ jsxs4("nav", { className: "nav-tabs", children: [
        /* @__PURE__ */ jsx4(
          "button",
          {
            className: `nav-tab ${currentView === "calculator" ? "active" : ""}`,
            onClick: () => setCurrentView("calculator"),
            children: "Calculator"
          }
        ),
        /* @__PURE__ */ jsx4(
          "button",
          {
            className: `nav-tab ${currentView === "adjustment" ? "active" : ""}`,
            onClick: () => setCurrentView("adjustment"),
            children: "Scope Adjustment"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "system-toggle", children: [
        /* @__PURE__ */ jsx4(
          "button",
          {
            className: unitSystem === "imperial" ? "active" : "",
            onClick: () => setUnitSystem("imperial"),
            children: "Imperial"
          }
        ),
        /* @__PURE__ */ jsx4(
          "button",
          {
            className: unitSystem === "metric" ? "active" : "",
            onClick: () => setUnitSystem("metric"),
            children: "Metric"
          }
        )
      ] })
    ] }),
    currentView === "calculator" && /* @__PURE__ */ jsx4(
      Calculator,
      {
        unitSystem,
        onUnitSystemChange: setUnitSystem,
        onScopeAdjustment: handleScopeAdjustment
      }
    ),
    currentView === "adjustment" && /* @__PURE__ */ jsx4(
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
import { jsx as jsx5 } from "react/jsx-runtime";
var rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
var root = createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsx5(StrictMode, { children: /* @__PURE__ */ jsx5(App, {}) })
);
