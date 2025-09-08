const Message = require("../../models/message");
const Conversation = require("../../models/conversation");
const MetricSnapshot = require("../../models/metricSnapshot");
const Alert = require("../../models/alert");
const { computeCompositeScore } = require("./weights");
const { runAnomalyDetection } = require("../anomaly/detector");

/**
 * Calculate comprehensive metrics for a conversation window
 * @param {String} conversationId - The conversation ID
 * @param {Number} windowMs - Time window in milliseconds (default: 5 minutes)
 * @returns {Object|null} Computed metrics or null if no data
 */
async function computeWindowMetrics(conversationId, windowMs = 5 * 60 * 1000) {
	const now = new Date();
	const start = new Date(now.getTime() - windowMs);

	// Get conversation data
	const conversation = await Conversation.findById(conversationId).lean();
	if (!conversation) return null;

	// Get messages in the window
	const messages = await Message.find({
		conversationId,
		createdAt: { $gte: start, $lte: now },
	})
		.sort({ createdAt: 1 })
		.lean();

	if (messages.length === 0) {
		return null;
	}

	// Calculate latency metrics
	const latencies = messages
		.map((m) => m.latencyMs || 0)
		.filter((x) => Number.isFinite(x) && x > 0);
	latencies.sort((a, b) => a - b);

	const latencyP95 =
		latencies.length > 0
			? latencies[Math.floor(0.95 * (latencies.length - 1))] || 0
			: 0;

	// Response time metrics
	const responseTimes = messages
		.map((m) => m.responseTime)
		.filter((rt) => rt && rt > 0);

	const responseTimeMetrics = {
		average: avg(responseTimes),
		median: median(responseTimes),
		max: Math.max(...responseTimes, 0),
		min: Math.min(...responseTimes.filter((rt) => rt > 0), 0) || 0,
	};

	// Sentiment and quality metrics
	const toxicityAvg = avg(messages.map((m) => m.toxicity ?? 0));
	const sentimentAvg = avg(messages.map((m) => m.polarity ?? 0));

	// Message breakdown
	const messageBreakdown = {
		total: messages.length,
		ai: messages.filter((m) => m.senderType === "ai").length,
		customer: messages.filter((m) => m.senderType === "customer").length,
		supervisor: messages.filter((m) => m.senderType === "supervisor")
			.length,
	};

	// Supervisor intervention metrics
	const supervisorMetrics = {
		isTakenOver: conversation.isControlledBySupervisor || false,
		takeoverCount: messages.filter((m) => m.takeoverMessage).length,
		returnToAICount: messages.filter((m) => m.returnToAIMessage).length,
		supervisorActiveTime: calculateSupervisorActiveTime(messages),
	};

	// AI confidence metrics
	const aiMessages = messages.filter(
		(m) => m.senderType === "ai" && m.confidence
	);
	const aiConfidenceAvg =
		aiMessages.length > 0 ? avg(aiMessages.map((m) => m.confidence)) : null;

	// Customer satisfaction (if available)
	const customerSatisfactionScore = conversation.satisfactionScore || null;

	// Normalize metrics to 0..1 for composite scoring
	const technicalHealth = normalizeTechnical(latencyP95);
	const aiQuality = calculateAIQuality(toxicityAvg, aiConfidenceAvg);
	const customerExperience = calculateCustomerExperience(
		sentimentAvg,
		responseTimeMetrics.average
	);

	// Calculate composite score
	const compositeScore = computeCompositeScore({
		technicalHealth,
		aiQuality,
		customerExperience,
	});

	// Resolution and escalation rates (for this window)
	const resolutionRate = conversation.status === "resolved" ? 100 : 0;
	const escalationRate = conversation.status === "escalated" ? 100 : 0;

	return {
		snapshotType: "real_time",
		conversationId,
		agentId: conversation.agentId,
		windowStart: start,
		windowEnd: now,
		metrics: {
			// Response Time Metrics
			latencyP95,
			averageResponseTime: responseTimeMetrics.average,
			medianResponseTime: responseTimeMetrics.median,
			maxResponseTime: responseTimeMetrics.max,
			minResponseTime: responseTimeMetrics.min,

			// Sentiment & Quality Metrics
			toxicityAvg,
			sentimentAvg,
			aiQuality,
			customerExperience,
			customerSatisfactionScore,

			// Operational Metrics
			technicalHealth,
			compositeScore,
			resolutionRate,
			escalationRate,
			firstCallResolutionRate:
				conversation.messageCount <= 5 &&
				conversation.status === "resolved"
					? 100
					: 0,

			// Conversation Metrics
			activeConversations: conversation.status === "active" ? 1 : 0,
			totalConversations: 1,
			resolvedConversations: conversation.status === "resolved" ? 1 : 0,
			escalatedConversations: conversation.status === "escalated" ? 1 : 0,
			abandonedConversations: 0, // Would need additional logic to determine abandonment

			// Message Metrics
			totalMessages: messageBreakdown.total,
			aiMessages: messageBreakdown.ai,
			supervisorMessages: messageBreakdown.supervisor,
			customerMessages: messageBreakdown.customer,

			// Supervisor Intervention Metrics
			takeoverCount: supervisorMetrics.takeoverCount,
			takeoverRate: supervisorMetrics.takeoverCount > 0 ? 100 : 0,
			averageHandoffTime: calculateAverageHandoffTime(messages),
			supervisorActiveTime: supervisorMetrics.supervisorActiveTime,

			// AI Performance
			aiConfidenceAvg: aiConfidenceAvg || 0,
		},

		// Calculate trends (requires historical data)
		trends: {
			performanceDirection: "stable", // Would need historical comparison
			changePercentage: 0,
			comparedToLastPeriod: false,
		},

		calculatedAt: now,
		dataQuality:
			messages.length >= 3
				? "high"
				: messages.length >= 1
				? "medium"
				: "low",
		sampleSize: messages.length,
	};
}

/**
 * Calculate aggregated metrics for dashboard
 * @param {String} timeRange - Time range (1h, 24h, 7d, 30d)
 * @returns {Object} Aggregated metrics
 */
async function calculateDashboardMetrics(timeRange = "24h") {
	// Calculate time filter
	let timeFilter = {};
	switch (timeRange) {
		case "1h":
			timeFilter = {
				updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
			};
			break;
		case "24h":
			timeFilter = {
				updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
			};
			break;
		case "7d":
			timeFilter = {
				updatedAt: {
					$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				},
			};
			break;
		case "30d":
			timeFilter = {
				updatedAt: {
					$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				},
			};
			break;
		default:
			timeFilter = {};
	}

	// Get conversation aggregates
	const conversationStats = await Conversation.aggregate([
		{ $match: timeFilter },
		{
			$group: {
				_id: null,
				activeCount: {
					$sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
				},
				resolvedCount: {
					$sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
				},
				escalatedCount: {
					$sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] },
				},
				supervisorControlledCount: {
					$sum: {
						$cond: [
							{ $eq: ["$isControlledBySupervisor", true] },
							1,
							0,
						],
					},
				},
				totalCount: { $sum: 1 },
				averageResponseTime: { $avg: "$averageResponseTime" },
				averageCSAT: { $avg: "$satisfactionScore" },
			},
		},
	]);

	// Get message response times
	const messageStats = await Message.aggregate([
		{ $match: { ...timeFilter, responseTime: { $exists: true, $gt: 0 } } },
		{
			$group: {
				_id: null,
				totalMessages: { $sum: 1 },
				averageResponseTime: { $avg: "$responseTime" },
				minResponseTime: { $min: "$responseTime" },
				maxResponseTime: { $max: "$responseTime" },
			},
		},
	]);

	// Get alert counts
	const alertStats = await Alert.aggregate([
		{ $match: { ...timeFilter, dismissed: { $ne: true } } },
		{
			$group: {
				_id: "$severity",
				count: { $sum: 1 },
			},
		},
	]);

	const stats = conversationStats[0] || {};
	const msgStats = messageStats[0] || {};

	// Calculate derived metrics
	const resolutionRate =
		stats.totalCount > 0
			? (stats.resolvedCount / stats.totalCount) * 100
			: 0;
	const escalationRate =
		stats.totalCount > 0
			? (stats.escalatedCount / stats.totalCount) * 100
			: 0;
	const supervisorTakeoverRate =
		stats.totalCount > 0
			? (stats.supervisorControlledCount / stats.totalCount) * 100
			: 0;

	// Alert breakdown
	const alertBreakdown = alertStats.reduce(
		(acc, alert) => {
			acc[alert._id] = alert.count;
			return acc;
		},
		{ high: 0, medium: 0, low: 0 }
	);

	return {
		timeRange,
		timestamp: new Date(),
		conversations: {
			active: stats.activeCount || 0,
			resolved: stats.resolvedCount || 0,
			escalated: stats.escalatedCount || 0,
			supervisorControlled: stats.supervisorControlledCount || 0,
			total: stats.totalCount || 0,
			resolutionRate: Math.round(resolutionRate * 100) / 100,
			escalationRate: Math.round(escalationRate * 100) / 100,
			supervisorTakeoverRate:
				Math.round(supervisorTakeoverRate * 100) / 100,
		},
		responseTime: {
			average: Math.round((msgStats.averageResponseTime || 0) / 1000), // Convert to seconds
			min: Math.round((msgStats.minResponseTime || 0) / 1000),
			max: Math.round((msgStats.maxResponseTime || 0) / 1000),
			target: 30, // 30 seconds target
		},
		csat: {
			score: Math.round((stats.averageCSAT || 0) * 10) / 10,
			target: 4.0,
			trend: "stable", // Would need historical comparison
		},
		alerts: {
			total: Object.values(alertBreakdown).reduce((a, b) => a + b, 0),
			breakdown: alertBreakdown,
		},
	};
}

/**
 * Persist a metric snapshot to the database
 * @param {String} conversationId - The conversation ID
 * @param {Object} snapshot - The metric snapshot data
 * @returns {Object|null} The created snapshot document
 */
async function persistSnapshot(conversationId, snapshot) {
	if (!snapshot) return null;

	try {
		const doc = await MetricSnapshot.create({
			conversationId,
			...snapshot,
			calculatedAt: new Date(),
		});
		return doc;
	} catch (error) {
		console.error("Error persisting snapshot:", error);
		return null;
	}
}

/**
 * Create periodic metric snapshots for all active conversations
 * @param {String} snapshotType - Type of snapshot (hourly, daily, etc.)
 * @returns {Object} Processing results
 */
async function createPeriodicSnapshots(snapshotType = "hourly") {
	try {
		const activeConversations = await Conversation.find({
			status: { $in: ["active", "waiting"] },
		})
			.select("_id")
			.lean();

		const results = {
			snapshotType,
			timestamp: new Date(),
			processed: 0,
			successful: 0,
			failed: 0,
			anomaliesDetected: 0,
		};

		for (const conv of activeConversations) {
			results.processed++;

			try {
				// Calculate metrics for the conversation
				const windowMs =
					snapshotType === "hourly"
						? 60 * 60 * 1000
						: 24 * 60 * 60 * 1000;
				const snapshot = await computeWindowMetrics(conv._id, windowMs);

				if (snapshot) {
					// Persist snapshot
					snapshot.snapshotType = snapshotType;
					await persistSnapshot(conv._id, snapshot);

					// Run anomaly detection
					const history = await MetricSnapshot.find({
						conversationId: conv._id,
						snapshotType,
					})
						.sort({ windowStart: -1 })
						.limit(20)
						.lean();

					const anomalyResults = await runAnomalyDetection(
						conv._id,
						history,
						snapshot
					);
					results.anomaliesDetected += anomalyResults.totalAnomalies;

					results.successful++;
				}
			} catch (error) {
				console.error(
					`Error processing conversation ${conv._id}:`,
					error
				);
				results.failed++;
			}
		}

		return results;
	} catch (error) {
		console.error("Error in createPeriodicSnapshots:", error);
		return {
			snapshotType,
			timestamp: new Date(),
			error: error.message,
			processed: 0,
			successful: 0,
			failed: 0,
			anomaliesDetected: 0,
		};
	}
}

// Helper functions

function avg(arr) {
	if (!arr.length) return 0;
	return (
		arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / arr.length
	);
}

function median(arr) {
	if (!arr.length) return 0;
	const sorted = arr.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
	if (sorted.length === 0) return 0;
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[mid - 1] + sorted[mid]) / 2
		: sorted[mid];
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

function calculateAIQuality(toxicityAvg, confidenceAvg) {
	// Combine toxicity (inverted) and confidence for AI quality score
	const toxicityScore = 1 - clamp01(toxicityAvg); // Lower toxicity = higher score
	const confidenceScore =
		confidenceAvg !== null ? clamp01(confidenceAvg) : 0.5; // Default neutral if no data

	// Weighted combination: toxicity more important than confidence
	return toxicityScore * 0.7 + confidenceScore * 0.3;
}

function calculateCustomerExperience(sentimentAvg, avgResponseTime) {
	// Combine sentiment and response time for customer experience score
	const sentimentScore = clamp01((sentimentAvg + 1) / 2); // Map [-1..1] to [0..1]
	const responseTimeScore = avgResponseTime
		? Math.max(0, 1 - avgResponseTime / 120000)
		: 1; // Penalize if > 2 minutes

	// Weighted combination
	return sentimentScore * 0.6 + responseTimeScore * 0.4;
}

function calculateSupervisorActiveTime(messages) {
	// Calculate total time supervisor was actively engaged
	const supervisorMessages = messages.filter(
		(m) => m.senderType === "supervisor"
	);
	if (supervisorMessages.length === 0) return 0;

	const firstSupervisorMessage = supervisorMessages[0].createdAt;
	const lastSupervisorMessage =
		supervisorMessages[supervisorMessages.length - 1].createdAt;

	return lastSupervisorMessage.getTime() - firstSupervisorMessage.getTime();
}

function calculateAverageHandoffTime(messages) {
	// Calculate average time between takeover and return to AI
	const takeoverMessages = messages.filter((m) => m.takeoverMessage);
	const returnMessages = messages.filter((m) => m.returnToAIMessage);

	if (takeoverMessages.length === 0 || returnMessages.length === 0) return 0;

	let totalHandoffTime = 0;
	let handoffCount = 0;

	for (const takeover of takeoverMessages) {
		const nextReturn = returnMessages.find(
			(r) => r.createdAt > takeover.createdAt
		);
		if (nextReturn) {
			totalHandoffTime +=
				nextReturn.createdAt.getTime() - takeover.createdAt.getTime();
			handoffCount++;
		}
	}

	return handoffCount > 0 ? totalHandoffTime / handoffCount : 0;
}

module.exports = {
	computeWindowMetrics,
	calculateDashboardMetrics,
	persistSnapshot,
	createPeriodicSnapshots,
};
