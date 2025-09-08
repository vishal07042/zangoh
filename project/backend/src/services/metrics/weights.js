// Composite score weights (sum to 1)
const DEFAULT_WEIGHTS = {
	technicalHealth: 0.35,
	aiQuality: 0.35,
	customerExperience: 0.3,
};

function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}

function computeCompositeScore(parts, weights = DEFAULT_WEIGHTS) {
	const th = clamp01(parts.technicalHealth ?? 0);
	const ai = clamp01(parts.aiQuality ?? 0);
	const cx = clamp01(parts.customerExperience ?? 0);
	return (
		th * weights.technicalHealth +
		ai * weights.aiQuality +
		cx * weights.customerExperience
	);
}

module.exports = { DEFAULT_WEIGHTS, computeCompositeScore, clamp01 };
