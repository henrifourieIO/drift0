import { useState, useEffect, useRef } from "react";
import type { BallisticsResult } from "../main.ts";
import { DriftVisualizer } from "./DriftVisualizer.tsx";
import type { ScopeAdjustmentData } from "./App.tsx";

interface CalculatorProps {
	unitSystem: "imperial" | "metric";
	onUnitSystemChange: (system: "imperial" | "metric") => void;
	onScopeAdjustment?: (data: ScopeAdjustmentData) => void;
}

interface BallisticsInput {
	muzzleVelocity: number;
	bulletWeight: number;
	ballisticCoefficient: number;
	zeroRange: number;
	targetDistance: number;
	windSpeed: number;
	windAngle: number;
	sightHeight: number;
	temperature: number;
	altitude: number;
}

const conv = {
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
	mmToIn: 0.03937,
};

function fToC(f: number) {
	return ((f - 32) * 5) / 9;
}
function cToF(c: number) {
	return (c * 9) / 5 + 32;
}

const presets = {
	"556": {
		muzzleVelocity: 3100,
		bulletWeight: 62,
		ballisticCoefficient: 0.307,
	},
	"762x39": {
		muzzleVelocity: 2350,
		bulletWeight: 123,
		ballisticCoefficient: 0.3,
	},
	"243": { muzzleVelocity: 3025, bulletWeight: 105, ballisticCoefficient: 0.5 },
	"270": {
		muzzleVelocity: 2950,
		bulletWeight: 150,
		ballisticCoefficient: 0.496,
	},
	"308": {
		muzzleVelocity: 2700,
		bulletWeight: 168,
		ballisticCoefficient: 0.462,
	},
	"762x54r": {
		muzzleVelocity: 2580,
		bulletWeight: 174,
		ballisticCoefficient: 0.4,
	},
	"3006": {
		muzzleVelocity: 2750,
		bulletWeight: 175,
		ballisticCoefficient: 0.505,
	},
	"6.5cm": {
		muzzleVelocity: 2700,
		bulletWeight: 140,
		ballisticCoefficient: 0.61,
	},
	"6.5prc": {
		muzzleVelocity: 2900,
		bulletWeight: 143,
		ballisticCoefficient: 0.625,
	},
	"300wm": {
		muzzleVelocity: 2950,
		bulletWeight: 190,
		ballisticCoefficient: 0.533,
	},
	"300prc": {
		muzzleVelocity: 2880,
		bulletWeight: 225,
		ballisticCoefficient: 0.691,
	},
	"338lm": {
		muzzleVelocity: 2750,
		bulletWeight: 300,
		ballisticCoefficient: 0.768,
	},
	"375ct": {
		muzzleVelocity: 2850,
		bulletWeight: 350,
		ballisticCoefficient: 0.945,
	},
	"50bmg": {
		muzzleVelocity: 2800,
		bulletWeight: 750,
		ballisticCoefficient: 1.05,
	},
};

export function Calculator({
	unitSystem,
	onUnitSystemChange,
	onScopeAdjustment,
}: CalculatorProps) {
	const [muzzleVelocity, setMuzzleVelocity] = useState(2700);
	const [bulletWeight, setBulletWeight] = useState(168);
	const [ballisticCoefficient, setBallisticCoefficient] = useState(0.462);
	const [zeroRange, setZeroRange] = useState(100);
	const [sightHeight, setSightHeight] = useState(1.5);
	const [targetDistance, setTargetDistance] = useState(1000);
	const [windSpeed, setWindSpeed] = useState(10);
	const [windAngle, setWindAngle] = useState(90);
	const [temperature, setTemperature] = useState(59);
	const [altitude, setAltitude] = useState(0);
	const [results, setResults] = useState<BallisticsResult[] | null>(null);
	const [currentUnit, setCurrentUnit] = useState<"moa" | "mil">("moa");
	const [isCalculating, setIsCalculating] = useState(false);
	const [activeVisualizerRow, setActiveVisualizerRow] = useState<number | null>(
		null
	);
	const prevUnitSystemRef = useRef<"imperial" | "metric">(unitSystem);

	const loadPreset = (name: keyof typeof presets) => {
		const preset = presets[name];
		if (preset) {
			let vel = preset.muzzleVelocity;
			let weight = preset.bulletWeight;
			if (unitSystem === "metric") {
				vel = Math.round(vel * conv.fpsToMs);
				weight = Number((weight * conv.grToG).toFixed(1));
			}
			setMuzzleVelocity(vel);
			setBulletWeight(weight);
			setBallisticCoefficient(preset.ballisticCoefficient);
		}
	};

	const calculate = async () => {
		setIsCalculating(true);
		try {
			// Convert to metric for API
			let vel = muzzleVelocity;
			let weight = bulletWeight;
			let zero = zeroRange;
			let sight = sightHeight;
			let dist = targetDistance;
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

			const input: BallisticsInput = {
				muzzleVelocity: vel,
				bulletWeight: weight,
				ballisticCoefficient,
				zeroRange: zero,
				targetDistance: dist,
				windSpeed: wind,
				windAngle,
				sightHeight: sight,
				temperature: temp,
				altitude: alt,
			};

			const res = await fetch("/api/calculate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
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

	// Convert values when unit system changes
	useEffect(() => {
		if (prevUnitSystemRef.current === unitSystem) return;

		const fromSystem = prevUnitSystemRef.current;
		const toSystem = unitSystem;

		if (toSystem === "metric") {
			setMuzzleVelocity((v) => Math.round(v * conv.fpsToMs));
			setBulletWeight((w) => Number((w * conv.grToG).toFixed(1)));
			setZeroRange((z) => Math.round(z * conv.ydsToM));
			setSightHeight((s) => Number((s * conv.inToMm).toFixed(0)));
			setTargetDistance((d) => Math.round(d * conv.ydsToM));
			setWindSpeed((w) => Number((w * conv.mphToMs).toFixed(1)));
			setTemperature((t) => Math.round(fToC(t)));
			setAltitude((a) => Math.round(a * conv.ftToM));
		} else {
			setMuzzleVelocity((v) => Math.round(v * conv.msToFps));
			setBulletWeight((w) => Number((w * conv.gToGr).toFixed(0)));
			setZeroRange((z) => Math.round(z * conv.mToYds));
			setSightHeight((s) => Number((s * conv.mmToIn).toFixed(1)));
			setTargetDistance((d) => Math.round(d * conv.mToYds));
			setWindSpeed((w) => Number((w * conv.msToMph).toFixed(0)));
			setTemperature((t) => Math.round(cToF(t)));
			setAltitude((a) => Math.round(a * conv.mToFt));
		}

		prevUnitSystemRef.current = unitSystem;
	}, [unitSystem]);

	// Initial calculation on mount
	useEffect(() => {
		calculate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Close visualizer when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (
				!target.closest(".drift-visualizer") &&
				!target.closest(".clickable-row")
			) {
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

	const displayDist = (d: number) =>
		isMetric ? d : Math.round(d * conv.mToYds);
	const displayVel = (v: number) =>
		isMetric ? v : Math.round(v * conv.msToFps);
	const displayEnergy = (e: number) =>
		isMetric ? e : Math.round(e * conv.jToFtlb);
	const displayDrop = (d: number) =>
		isMetric ? d : Number((d * conv.mmToIn).toFixed(1));

	return (
		<div className="grid">
			<div className="sidebar">
				<div className="card">
					<h3 className="card-title">Cartridge</h3>

					<div className="presets">
						<button className="preset-btn" onClick={() => loadPreset("556")}>
							5.56 NATO
						</button>
						<button className="preset-btn" onClick={() => loadPreset("762x39")}>
							7.62x39
						</button>
						<button className="preset-btn" onClick={() => loadPreset("308")}>
							308 Win
						</button>
						<button
							className="preset-btn"
							onClick={() => loadPreset("762x54r")}
						>
							7.62x54R
						</button>
						<button className="preset-btn" onClick={() => loadPreset("6.5cm")}>
							6.5 Creedmoor
						</button>
						<button className="preset-btn" onClick={() => loadPreset("6.5prc")}>
							6.5 PRC
						</button>
						<button className="preset-btn" onClick={() => loadPreset("243")}>
							243 Win
						</button>
						<button className="preset-btn" onClick={() => loadPreset("270")}>
							270 Win
						</button>
						<button className="preset-btn" onClick={() => loadPreset("3006")}>
							30-06
						</button>
						<button className="preset-btn" onClick={() => loadPreset("300wm")}>
							300 Win Mag
						</button>
						<button className="preset-btn" onClick={() => loadPreset("300prc")}>
							300 PRC
						</button>
						<button className="preset-btn" onClick={() => loadPreset("338lm")}>
							338 Lapua
						</button>
						<button className="preset-btn" onClick={() => loadPreset("375ct")}>
							375 CheyTac
						</button>
						<button className="preset-btn" onClick={() => loadPreset("50bmg")}>
							50 BMG
						</button>
					</div>

					<div className="form-grid">
						<div className="form-group">
							<label>
								Muzzle Velocity{" "}
								<span className="label-hint">({isMetric ? "m/s" : "fps"})</span>
							</label>
							<input
								type="number"
								value={muzzleVelocity}
								onChange={(e) => setMuzzleVelocity(Number(e.target.value))}
								step="10"
							/>
						</div>
						<div className="form-group">
							<label>
								Bullet Weight{" "}
								<span className="label-hint">({isMetric ? "g" : "gr"})</span>
							</label>
							<input
								type="number"
								value={bulletWeight}
								onChange={(e) => setBulletWeight(Number(e.target.value))}
								step="1"
							/>
						</div>
						<div className="form-group full">
							<label>
								Ballistic Coefficient <span className="label-hint">(G1)</span>
							</label>
							<input
								type="number"
								value={ballisticCoefficient}
								onChange={(e) =>
									setBallisticCoefficient(Number(e.target.value))
								}
								step="0.001"
							/>
						</div>
					</div>

					<div className="divider"></div>

					<h3 className="card-title">Rifle Setup</h3>
					<div className="form-grid">
						<div className="form-group">
							<label>
								Zero Range{" "}
								<span className="label-hint">({isMetric ? "m" : "yds"})</span>
							</label>
							<input
								type="number"
								value={zeroRange}
								onChange={(e) => setZeroRange(Number(e.target.value))}
								step="25"
							/>
						</div>
						<div className="form-group">
							<label>
								Sight Height{" "}
								<span className="label-hint">({isMetric ? "mm" : "in"})</span>
							</label>
							<input
								type="number"
								value={sightHeight}
								onChange={(e) => setSightHeight(Number(e.target.value))}
								step="0.1"
							/>
						</div>
						<div className="form-group full">
							<label>
								Target Distance{" "}
								<span className="label-hint">({isMetric ? "m" : "yds"})</span>
							</label>
							<input
								type="number"
								value={targetDistance}
								onChange={(e) => setTargetDistance(Number(e.target.value))}
								step="50"
							/>
						</div>
					</div>

					<div className="divider"></div>

					<h3 className="card-title">Environment</h3>
					<div className="form-grid">
						<div className="form-group">
							<label>
								Wind Speed{" "}
								<span className="label-hint">({isMetric ? "m/s" : "mph"})</span>
							</label>
							<input
								type="number"
								value={windSpeed}
								onChange={(e) => setWindSpeed(Number(e.target.value))}
								step="1"
							/>
						</div>
						<div className="form-group">
							<label>
								Wind Angle <span className="label-hint">(deg)</span>
							</label>
							<input
								type="number"
								value={windAngle}
								onChange={(e) => setWindAngle(Number(e.target.value))}
								step="15"
							/>
						</div>
						<div className="form-group">
							<label>
								Temperature{" "}
								<span className="label-hint">({isMetric ? "°C" : "°F"})</span>
							</label>
							<input
								type="number"
								value={temperature}
								onChange={(e) => setTemperature(Number(e.target.value))}
								step="5"
							/>
						</div>
						<div className="form-group">
							<label>
								Altitude{" "}
								<span className="label-hint">({isMetric ? "m" : "ft"})</span>
							</label>
							<input
								type="number"
								value={altitude}
								onChange={(e) => setAltitude(Number(e.target.value))}
								step="500"
							/>
						</div>
					</div>

					<div className="divider"></div>

					<button onClick={calculate} disabled={isCalculating}>
						{isCalculating ? "Calculating..." : "Calculate Trajectory"}
					</button>
				</div>
			</div>

			<div className="main">
				<div className="card">
					<div className="results-header">
						<h2>Trajectory Table</h2>
						<div className="unit-toggle">
							<button
								className={currentUnit === "moa" ? "active" : ""}
								onClick={() => setCurrentUnit("moa")}
							>
								MOA
							</button>
							<button
								className={currentUnit === "mil" ? "active" : ""}
								onClick={() => setCurrentUnit("mil")}
							>
								MIL
							</button>
						</div>
					</div>

					<div id="results">
						{!results || results.length === 0 ? (
							<div className="empty-state">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
								<p>
									Enter your parameters and click Calculate to view the
									trajectory
								</p>
							</div>
						) : (
							<>
								<div className="summary-grid">
									<div className="summary-card">
										<div className="label">Max Range</div>
										<div className="value">
											{displayDist(results[results.length - 1].distance)}{" "}
											{distLabel}
										</div>
									</div>
									<div className="summary-card">
										<div className="label">Final Velocity</div>
										<div className="value">
											{displayVel(results[results.length - 1].velocity)}{" "}
											{velLabel}
										</div>
									</div>
									<div className="summary-card">
										<div className="label">Final Energy</div>
										<div className="value">
											{displayEnergy(results[results.length - 1].energy)}{" "}
											{energyLabel}
										</div>
									</div>
									<div className="summary-card">
										<div className="label">Time of Flight</div>
										<div className="value">
											{results[results.length - 1].timeOfFlight}s
										</div>
									</div>
								</div>
								<div className="table-wrapper">
									<table>
										<thead>
											<tr>
												<th>Distance</th>
												<th>Velocity</th>
												<th>Energy</th>
												<th>
													Drop<span className="table-hint">(click row)</span>
												</th>
												<th>Wind</th>
												<th>TOF</th>
												<th>{currentUnit.toUpperCase()}</th>
											</tr>
										</thead>
										<tbody>
											{results.map((r, index) => {
												const drop = displayDrop(r.drop);
												const drift = displayDrop(r.windDrift);
												const isZero =
													Math.abs(r.drop) < 0.5 &&
													r.distance > 0 &&
													r.distance <= 150;
												const dropClass =
													r.drop > 0.5
														? "negative"
														: r.drop < -0.5
														? "negative"
														: "positive";
												const windClass = r.windDrift > 0 ? "negative" : "";
												const correction =
													currentUnit === "moa" ? r.moa : r.mil;
												const isActive = activeVisualizerRow === index;

												return (
													<tr
														key={r.distance}
														className={`clickable-row ${
															isZero ? "highlight-row" : ""
														} ${isActive ? "row-active" : ""}`}
														onClick={() =>
															setActiveVisualizerRow(isActive ? null : index)
														}
													>
														<td>
															{displayDist(r.distance)} {distLabel}
														</td>
														<td>
															{displayVel(r.velocity)} {velLabel}
														</td>
														<td>
															{displayEnergy(r.energy)} {energyLabel}
														</td>
														<td
															className={dropClass}
															style={{ position: "relative" }}
														>
															{drop > 0 ? "+" : ""}
															{drop}
															{dropLabel}
															{isActive && (
																<DriftVisualizer
																	drop={r.drop}
																	windDrift={r.windDrift}
																	distance={r.distance}
																	unitSystem={unitSystem}
																	onClose={() => setActiveVisualizerRow(null)}
																	onScopeAdjustment={onScopeAdjustment}
																/>
															)}
														</td>
														<td className={windClass}>
															{drift > 0 ? "+" : ""}
															{drift}
															{dropLabel}
														</td>
														<td>{r.timeOfFlight}s</td>
														<td>
															{correction > 0 ? "+" : ""}
															{correction}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
