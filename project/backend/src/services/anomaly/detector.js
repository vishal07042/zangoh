// Simple EWMA and Z-score detectors for anomaly strings

function ewma(current, prev, alpha = 0.3) {
	if (prev === undefined || prev === null) return current;
	return alpha * current + (1 - alpha) * prev;
}

function zScore(value, mean, std) {
	if (!std || std === 0) return 0;
	return (value - mean) / std;
}

function detectAnomalies(snapshotHistory, latest) {
	const anomalies = [];

	// Technical latency spike using z-score on latencyP95
	const latencies = snapshotHistory
		.map((s) => s.metrics.latencyP95)
		.slice(-20);
	if (latencies.length >= 5) {
		const mean = avg(latencies);
		const std = Math.sqrt(avg(latencies.map((x) => Math.pow(x - mean, 2))));
		const z = zScore(latest.metrics.latencyP95, mean, std);
		if (z > 2.5) anomalies.push("latency_spike");
	}

	// Quality drop if composite drops sharply versus EWMA
	const composites = snapshotHistory
		.map((s) => s.metrics.compositeScore)
		.slice(-20);
	if (composites.length) {
		let m = composites[0];
		for (let i = 1; i < composites.length; i++) m = ewma(composites[i], m);
		const expected = ewma(latest.metrics.compositeScore, m);
		if (expected - latest.metrics.compositeScore > 0.2)
			anomalies.push("quality_drop");
	}

	// Toxicity threshold
	if (latest.metrics.toxicityAvg > 0.4) anomalies.push("high_toxicity");

	return anomalies;
}

function avg(arr) {
	if (!arr.length) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = { detectAnomalies };
