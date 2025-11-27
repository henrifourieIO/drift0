import { useState } from "react";
import { Calculator } from "./Calculator.tsx";
import { ScopeAdjustment } from "./ScopeAdjustment.tsx";
import "./styles.css";

export interface ScopeAdjustmentData {
	offsetX: number; // horizontal offset in mm
	offsetY: number; // vertical offset in mm (negative = drop)
	distance: number; // distance in meters
}

export function App() {
	const [currentView, setCurrentView] = useState<"calculator" | "adjustment">(
		"calculator"
	);
	const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">(
		"imperial"
	);
	const [scopeAdjustmentData, setScopeAdjustmentData] = useState<ScopeAdjustmentData | null>(null);

	const handleScopeAdjustment = (data: ScopeAdjustmentData) => {
		setScopeAdjustmentData(data);
		setCurrentView("adjustment");
	};

	return (
		<div className="container">
			<div className="experimental-banner">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				<span>
					<strong>Experimental</strong> — This app is still a work in progress. Results may not be accurate.
				</span>
			</div>
			<header>
				<div className="logo">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<circle cx="12" cy="12" r="6" />
						<circle cx="12" cy="12" r="2" />
					</svg>
					<h1>Drift0</h1>
				</div>
				<nav className="nav-tabs">
					<button
						className={`nav-tab ${
							currentView === "calculator" ? "active" : ""
						}`}
						onClick={() => setCurrentView("calculator")}
					>
						Calculator
					</button>
					<button
						className={`nav-tab ${
							currentView === "adjustment" ? "active" : ""
						}`}
						onClick={() => setCurrentView("adjustment")}
					>
						Scope Adjustment
					</button>
				</nav>
				<div className="system-toggle">
					<button
						className={unitSystem === "imperial" ? "active" : ""}
						onClick={() => setUnitSystem("imperial")}
					>
						Imperial
					</button>
					<button
						className={unitSystem === "metric" ? "active" : ""}
						onClick={() => setUnitSystem("metric")}
					>
						Metric
					</button>
				</div>
			</header>

			{currentView === "calculator" && (
				<Calculator
					unitSystem={unitSystem}
					onUnitSystemChange={setUnitSystem}
					onScopeAdjustment={handleScopeAdjustment}
				/>
			)}
			{currentView === "adjustment" && (
				<ScopeAdjustment
					unitSystem={unitSystem}
					onUnitSystemChange={setUnitSystem}
					initialData={scopeAdjustmentData}
					onDataConsumed={() => setScopeAdjustmentData(null)}
				/>
			)}
		</div>
	);
}
