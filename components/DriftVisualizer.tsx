import { useState, useEffect, useRef } from "react";
import type { ScopeAdjustmentData } from "./App.tsx";

interface DriftVisualizerProps {
	drop: number; // in mm
	windDrift: number; // in mm
	distance: number; // in meters
	unitSystem: "imperial" | "metric";
	onClose: () => void;
	onScopeAdjustment?: (data: ScopeAdjustmentData) => void;
}

const conv = {
	inToCm: 2.54,
	cmToIn: 0.3937,
	inToMm: 25.4,
	mmToIn: 0.03937,
	mToYds: 1.09361,
	ydsToM: 0.9144,
};

const targetPresets = {
	ipsc: {
		size: 18,
		name: "IPSC",
		shape: "rect" as const,
		width: 18,
		height: 30,
		gridLines: 6,
	},
	"nra-b8": {
		size: 5.5,
		name: "NRA B-8",
		shape: "circle" as const,
		gridLines: 5,
	},
	"steel-12": {
		size: 12,
		name: '12" Steel',
		shape: "circle" as const,
		gridLines: 6,
	},
	"steel-8": {
		size: 8,
		name: '8" Steel',
		shape: "circle" as const,
		gridLines: 4,
	},
	"deer-vitals": {
		size: 10,
		name: "Deer Vitals",
		shape: "circle" as const,
		gridLines: 5,
	},
	"elk-vitals": {
		size: 14,
		name: "Elk Vitals",
		shape: "circle" as const,
		gridLines: 7,
	},
};

export function DriftVisualizer({
	drop,
	windDrift,
	distance,
	unitSystem,
	onClose,
	onScopeAdjustment,
}: DriftVisualizerProps) {
	const [targetType, setTargetType] = useState<keyof typeof targetPresets>(
		"ipsc"
	);
	const [displayMode, setDisplayMode] = useState<"rings" | "grid">("rings");
	const targetVisualRef = useRef<HTMLDivElement>(null);
	const ringsRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const shapeRef = useRef<HTMLDivElement>(null);

	const isMetric = unitSystem === "metric";

	// Get target size in inches (internal unit)
	const preset = targetPresets[targetType];
	const targetSizeInches = preset.size;
	const targetSizeDisplay = isMetric
		? (targetSizeInches * conv.inToCm).toFixed(1)
		: targetSizeInches;

	// Convert drop/drift from mm to inches for calculation
	const dropInches = drop * conv.mmToIn;
	const driftInches = windDrift * conv.mmToIn;

	// Display values
	const dropDisplay = isMetric ? drop.toFixed(1) : dropInches.toFixed(1);
	const driftDisplay = isMetric ? windDrift.toFixed(1) : driftInches.toFixed(1);
	const distanceDisplay = isMetric
		? distance
		: Math.round(distance * conv.mToYds);

	// Check if impact is within target
	const impactRadius = Math.sqrt(
		dropInches * dropInches + driftInches * driftInches
	);
	const targetRadius = targetSizeInches / 2;
	const isOnTarget = impactRadius <= targetRadius;

	// For rectangular targets, check differently
	const isOnRectTarget = () => {
		if (preset.shape !== "rect" || !preset.width || !preset.height) {
			return isOnTarget;
		}
		return (
			Math.abs(driftInches) <= preset.width / 2 &&
			Math.abs(dropInches) <= preset.height / 2
		);
	};

	const actuallyOnTarget =
		preset.shape === "rect" ? isOnRectTarget() : isOnTarget;

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
				const pct = (i / ringCount) * 90;
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
				line.className =
					"target-grid-line h" + (i === gridLines / 2 ? " major" : "");
				line.style.top = i * spacing + "px";
				gridContainer.appendChild(line);
			}

			for (let i = 0; i <= gridLines; i++) {
				const line = document.createElement("div");
				line.className =
					"target-grid-line v" + (i === gridLines / 2 ? " major" : "");
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

	// Calculate shot marker position
	const getMarkerPosition = () => {
		const visualSize = 180;
		const centerX = visualSize / 2;
		const centerY = visualSize / 2;

		// The target (rings/shape) fills 90% of the visual container
		// So we need to scale the marker position to match
		const targetVisualDiameter = visualSize * 0.9; // 162px
		const pixelsPerInch = targetVisualDiameter / targetSizeInches;

		// Wind drift is horizontal (X), drop is vertical (Y)
		// Positive drift = bullet drifts right = marker goes right
		// Positive drop = bullet has dropped = marker goes DOWN (higher Y in screen coords)
		const markerX = centerX + driftInches * pixelsPerInch;
		const markerY = centerY + dropInches * pixelsPerInch; // Positive drop = lower on target

		// Clamp to visual bounds with some padding
		const padding = 6;
		return {
			x: Math.max(padding, Math.min(visualSize - padding, markerX)),
			y: Math.max(padding, Math.min(visualSize - padding, markerY)),
		};
	};

	// Recalculate marker position when target type changes
	const markerPos = getMarkerPosition();

	return (
		<>
			<div className="drift-overlay" onClick={onClose}></div>
			<div className="drift-visualizer" onClick={(e) => e.stopPropagation()}>
				<div className="drift-visualizer-header">
					<h4>
						Impact at {distanceDisplay} {isMetric ? "m" : "yds"}
					</h4>
					<button className="drift-close-btn" onClick={onClose}>
						×
					</button>
				</div>

			<div className="drift-controls">
				<div className="drift-control-group">
					<label>Target</label>
					<select
						value={targetType}
						onChange={(e) =>
							setTargetType(e.target.value as keyof typeof targetPresets)
						}
					>
						<option value="ipsc">IPSC (18"×30")</option>
						<option value="nra-b8">NRA B-8 (5.5")</option>
						<option value="steel-12">12" Steel</option>
						<option value="steel-8">8" Steel</option>
						<option value="deer-vitals">Deer Vitals (10")</option>
						<option value="elk-vitals">Elk Vitals (14")</option>
					</select>
				</div>
				<div className="drift-display-toggle">
					<button
						className={displayMode === "rings" ? "active" : ""}
						onClick={() => setDisplayMode("rings")}
					>
						Rings
					</button>
					<button
						className={displayMode === "grid" ? "active" : ""}
						onClick={() => setDisplayMode("grid")}
					>
						Grid
					</button>
				</div>
			</div>

			<div className="drift-target-wrapper">
				<div className="drift-target-visual" ref={targetVisualRef}>
					<div className="target-crosshair h"></div>
					<div className="target-crosshair v"></div>
					<div className="target-rings" ref={ringsRef}></div>
					<div
						className="target-grid"
						ref={gridRef}
						style={{ display: "none" }}
					></div>
					<div
						className="target-shape"
						ref={shapeRef}
						style={{ display: "none" }}
					></div>
					<div
						className={`drift-marker ${
							actuallyOnTarget ? "on-target" : "off-target"
						}`}
						style={{
							left: markerPos.x + "px",
							top: markerPos.y + "px",
						}}
					></div>
				</div>
				<div className="drift-target-label">
					{targetSizeDisplay}
					{isMetric ? "cm" : '"'} target
				</div>
			</div>

			<div className="drift-stats">
				<div className="drift-stat">
					<span className="drift-stat-label">Drop</span>
					<span
						className={`drift-stat-value ${
							Math.abs(drop) > 12.7 ? "negative" : "positive"
						}`}
					>
						{drop > 0 ? "+" : ""}
						{dropDisplay}
						{isMetric ? "mm" : '"'}
					</span>
				</div>
				<div className="drift-stat">
					<span className="drift-stat-label">Wind Drift</span>
					<span
						className={`drift-stat-value ${
							Math.abs(windDrift) > 12.7 ? "negative" : "positive"
						}`}
					>
						{windDrift > 0 ? "+" : ""}
						{driftDisplay}
						{isMetric ? "mm" : '"'}
					</span>
				</div>
			</div>

			<div className={`drift-verdict ${actuallyOnTarget ? "hit" : "miss"}`}>
				{actuallyOnTarget ? (
					<>
						<span className="verdict-icon">✓</span>
						<span>On Target</span>
					</>
				) : (
					<>
						<span className="verdict-icon">✗</span>
						<span>Off Target</span>
					</>
				)}
			</div>

			{onScopeAdjustment && (
				<button
					className="drift-scope-btn"
					onClick={() => {
						onScopeAdjustment({
							offsetX: windDrift,
							offsetY: -drop, // Negative because drop is down, but scope adjustment uses positive = high
							distance: distance,
						});
						onClose();
					}}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						width="14"
						height="14"
					>
						<circle cx="12" cy="12" r="10" />
						<circle cx="12" cy="12" r="3" />
						<line x1="12" y1="2" x2="12" y2="6" />
						<line x1="12" y1="18" x2="12" y2="22" />
						<line x1="2" y1="12" x2="6" y2="12" />
						<line x1="18" y1="12" x2="22" y2="12" />
					</svg>
					Get Scope Adjustment
				</button>
			)}
			</div>
		</>
	);
}
