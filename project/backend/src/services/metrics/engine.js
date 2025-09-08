const Message = require("../../models/message");
const MetricSnapshot = require("../../models/metricSnapshot");
const { computeCompositeScore } = require("./weights");

async function computeWindowMetrics(conversationId, windowMs = 5 * 60 * 1000) {
	const now = new Date();
	const start = new Date(now.getTime() - windowMs);

	const messages = await Message.find({
		conversationId,
		createdAt: { $gte: start, $lte: now },
	})
		.sort({ createdAt: 1 })
		.lean();

	if (messages.length === 0) {
		return null;
	}

	const latencies = messages
		.map((m) => m.latencyMs || 0)
		.filter((x) => Number.isFinite(x));
	latencies.sort((a, b) => a - b);
	const p95 = latencies[Math.floor(0.95 * (latencies.length - 1))] || 0;

	const toxicityAvg = avg(messages.map((m) => m.toxicity ?? 0));
	const sentimentAvg = avg(messages.map((m) => m.polarity ?? 0));

	// Normalize to 0..1 for composite parts
	const technicalHealth = normalizeTechnical(p95);
	const aiQuality = 1 - clamp01(toxicityAvg); // lower toxicity => higher quality
	const customerExperience = clamp01((sentimentAvg + 1) / 2); // map [-1..1] -> [0..1]

	const compositeScore = computeCompositeScore({
		technicalHealth,
		aiQuality,
		customerExperience,
	});

	return {
		windowStart: start,
		windowEnd: now,
		metrics: {
			latencyP95: p95,
			toxicityAvg,
			sentimentAvg,
			aiQuality,
			customerExperience,
			technicalHealth,
			compositeScore,
		},
	};
}

async function persistSnapshot(conversationId, snapshot) {
	if (!snapshot) return null;
	const doc = await MetricSnapshot.create({ conversationId, ...snapshot });
	return doc;
}

function avg(arr) {
	if (!arr.length) return 0;
	return (
		arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / arr.length
	);
}

function clamp01(v) {
	return Math.max(0, Math.min(1, v));
}

function normalizeTechnical(p95) {
	// Example: <=200ms => 1.0, >=2000ms => 0.0 linear in-between
	const min = 200;
	const max = 2000;
	if (p95 <= min) return 1;
	if (p95 >= max) return 0;
	return 1 - (p95 - min) / (max - min);
}

module.exports = { computeWindowMetrics, persistSnapshot };
