const Alert = require("../../models/alert");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");

// Simple EWMA and Z-score detectors for anomaly detection

function ewma(current, prev, alpha = 0.3) {
	if (prev === undefined || prev === null) return current;
	return alpha * current + (1 - alpha) * prev;
}

function zScore(value, mean, std) {
	if (!std || std === 0) return 0;
	return (value - mean) / std;
}

function avg(arr) {
	if (!arr.length) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function standardDeviation(arr) {
	if (arr.length < 2) return 0;
	const mean = avg(arr);
	return Math.sqrt(avg(arr.map((x) => Math.pow(x - mean, 2))));
}

/**
 * Detect anomalies in conversation metrics and patterns
 * @param {Array} snapshotHistory - Historical metric snapshots
 * @param {Object} latest - Latest metric snapshot
 * @returns {Array} List of detected anomalies
 */
function detectAnomalies(snapshotHistory, latest) {
	const anomalies = [];

	// Technical latency spike using z-score on latencyP95
	const latencies = snapshotHistory
		.map((s) => s.metrics?.latencyP95 || 0)
		.filter((l) => l > 0)
		.slice(-20);

	if (latencies.length >= 5 && latest.metrics?.latencyP95) {
		const mean = avg(latencies);
		const std = standardDeviation(latencies);
		const z = zScore(latest.metrics.latencyP95, mean, std);
		if (z > 2.5) {
			anomalies.push({
				type: "latency_spike",
				description: `Response latency spiked to ${
					latest.metrics.latencyP95
				}ms (${z.toFixed(2)} standard deviations above normal)`,
				severity: z > 4 ? "high" : "medium",
				value: latest.metrics.latencyP95,
				threshold: mean + 2.5 * std,
			});
		}
	}

	// Quality drop if composite drops sharply versus EWMA
	const composites = snapshotHistory
		.map((s) => s.metrics?.compositeScore || 0)
		.filter((c) => c > 0)
		.slice(-20);

	if (composites.length && latest.metrics?.compositeScore) {
		let expectedScore = composites[0];
		for (let i = 1; i < composites.length; i++) {
			expectedScore = ewma(composites[i], expectedScore);
		}

		const qualityDrop = expectedScore - latest.metrics.compositeScore;
		if (qualityDrop > 0.2) {
			anomalies.push({
				type: "quality_drop",
				description: `AI quality score dropped by ${(
					qualityDrop * 100
				).toFixed(1)}% below expected level`,
				severity: qualityDrop > 0.4 ? "high" : "medium",
				value: latest.metrics.compositeScore,
				expected: expectedScore,
			});
		}
	}

	// Toxicity threshold
	if (latest.metrics?.toxicityAvg > 0.4) {
		anomalies.push({
			type: "high_toxicity",
			description: `High toxicity detected in conversation (${(
				latest.metrics.toxicityAvg * 100
			).toFixed(1)}%)`,
			severity: latest.metrics.toxicityAvg > 0.7 ? "high" : "medium",
			value: latest.metrics.toxicityAvg,
			threshold: 0.4,
		});
	}

	// Negative sentiment pattern
	if (latest.metrics?.sentimentAvg < -0.6) {
		anomalies.push({
			type: "negative_sentiment",
			description: `Consistently negative sentiment detected (${latest.metrics.sentimentAvg.toFixed(
				2
			)})`,
			severity: latest.metrics.sentimentAvg < -0.8 ? "high" : "medium",
			value: latest.metrics.sentimentAvg,
			threshold: -0.6,
		});
	}

	// Response time degradation
	const responseTimes = snapshotHistory
		.map((s) => s.metrics?.averageResponseTime || 0)
		.filter((rt) => rt > 0)
		.slice(-10);

	if (responseTimes.length >= 3 && latest.metrics?.averageResponseTime) {
		const recentAvg = avg(responseTimes.slice(-3));
		const olderAvg = avg(responseTimes.slice(0, -3));

		if (
			recentAvg > olderAvg * 2 &&
			latest.metrics.averageResponseTime > 120000
		) {
			// 2 minutes
			anomalies.push({
				type: "response_time_degradation",
				description: `Response times have degraded significantly (${(
					latest.metrics.averageResponseTime / 1000
				).toFixed(1)}s)`,
				severity: "medium",
				value: latest.metrics.averageResponseTime,
				threshold: 120000,
			});
		}
	}

	return anomalies;
}

/**
 * Analyze conversation patterns for problematic behaviors
 * @param {String} conversationId - The conversation ID to analyze
 * @returns {Array} List of detected conversation anomalies
 */
async function analyzeConversationPatterns(conversationId) {
	try {
		const conversation = await Conversation.findById(conversationId);
		if (!conversation) return [];

		const messages = await Message.find({ conversationId })
			.sort({ createdAt: 1 })
			.limit(100);

		const anomalies = [];

		// Check for excessive back-and-forth without resolution
		if (messages.length > 20 && conversation.status === "active") {
			anomalies.push({
				type: "excessive_interaction",
				description: `Conversation has ${messages.length} messages without resolution`,
				severity: messages.length > 30 ? "high" : "medium",
				value: messages.length,
				threshold: 20,
			});
		}

		// Check for rapid message bursts (potential frustration)
		const customerMessages = messages.filter(
			(m) => m.senderType === "customer"
		);
		if (customerMessages.length >= 3) {
			for (let i = 2; i < customerMessages.length; i++) {
				const timeDiff1 =
					customerMessages[i - 1].createdAt -
					customerMessages[i - 2].createdAt;
				const timeDiff2 =
					customerMessages[i].createdAt -
					customerMessages[i - 1].createdAt;

				// If customer sent 3 messages within 2 minutes
				if (timeDiff1 < 60000 && timeDiff2 < 60000) {
					anomalies.push({
						type: "customer_frustration",
						description:
							"Customer sent multiple rapid messages, indicating possible frustration",
						severity: "medium",
						value: 3,
						threshold: 2,
					});
					break;
				}
			}
		}

		// Check for AI confidence drops
		const aiMessages = messages.filter(
			(m) => m.senderType === "ai" && m.confidence
		);
		if (aiMessages.length >= 3) {
			const recentConfidence = aiMessages
				.slice(-3)
				.map((m) => m.confidence);
			const avgConfidence = avg(recentConfidence);

			if (avgConfidence < 0.5) {
				anomalies.push({
					type: "low_ai_confidence",
					description: `AI confidence has dropped to ${(
						avgConfidence * 100
					).toFixed(1)}%`,
					severity: avgConfidence < 0.3 ? "high" : "medium",
					value: avgConfidence,
					threshold: 0.5,
				});
			}
		}

		// Check for long response delays
		const aiResponseTimes = messages
			.filter((m) => m.responseTime && m.responseTime > 0)
			.map((m) => m.responseTime);

		if (aiResponseTimes.length > 0) {
			const maxResponseTime = Math.max(...aiResponseTimes);
			if (maxResponseTime > 300000) {
				// 5 minutes
				anomalies.push({
					type: "delayed_response",
					description: `AI took ${(
						maxResponseTime /
						1000 /
						60
					).toFixed(1)} minutes to respond`,
					severity: maxResponseTime > 600000 ? "high" : "medium",
					value: maxResponseTime,
					threshold: 300000,
				});
			}
		}

		return anomalies;
	} catch (error) {
		console.error("Error analyzing conversation patterns:", error);
		return [];
	}
}

/**
 * Create alerts for detected anomalies
 * @param {String} conversationId - The conversation ID
 * @param {Array} anomalies - List of detected anomalies
 * @param {String} source - Source of detection ('metrics' or 'conversation')
 */
async function createAnomalyAlerts(
	conversationId,
	anomalies,
	source = "system"
) {
	try {
		const conversation = conversationId
			? await Conversation.findById(conversationId)
			: null;

		for (const anomaly of anomalies) {
			const alertData = {
				level: anomaly.severity === "high" ? "critical" : "warning",
				severity: anomaly.severity,
				type: "anomaly",
				title: getAnomalyTitle(anomaly.type),
				message: anomaly.description,
				conversationId: conversationId,
				customerName: conversation?.customerName,
				customerId: conversation?.customerId,
				agentId: conversation?.agentId,
				meta: {
					anomalyType: anomaly.type,
					value: anomaly.value,
					threshold: anomaly.threshold,
					expected: anomaly.expected,
					source: source,
					detectedAt: new Date(),
				},
				// Set expiry for low-severity anomalies
				expiresAt:
					anomaly.severity === "low"
						? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
						: undefined,
			};

			await Alert.create(alertData);
		}

		return anomalies.length;
	} catch (error) {
		console.error("Error creating anomaly alerts:", error);
		return 0;
	}
}

/**
 * Get human-readable title for anomaly type
 * @param {String} anomalyType - The type of anomaly
 * @returns {String} Human-readable title
 */
function getAnomalyTitle(anomalyType) {
	const titles = {
		latency_spike: "Response Latency Spike",
		quality_drop: "AI Quality Degradation",
		high_toxicity: "High Toxicity Detected",
		negative_sentiment: "Negative Sentiment Pattern",
		response_time_degradation: "Response Time Degradation",
		excessive_interaction: "Excessive Conversation Length",
		customer_frustration: "Customer Frustration Detected",
		low_ai_confidence: "Low AI Confidence",
		delayed_response: "Delayed AI Response",
	};

	return titles[anomalyType] || "System Anomaly Detected";
}

/**
 * Run comprehensive anomaly detection for a conversation
 * @param {String} conversationId - The conversation ID to analyze
 * @param {Array} metricHistory - Historical metrics for the conversation
 * @param {Object} latestMetrics - Latest metrics snapshot
 * @returns {Object} Detection results
 */
async function runAnomalyDetection(
	conversationId,
	metricHistory = [],
	latestMetrics = null
) {
	try {
		const results = {
			conversationId,
			timestamp: new Date(),
			metricsAnomalies: [],
			conversationAnomalies: [],
			totalAnomalies: 0,
			alertsCreated: 0,
		};

		// Detect metrics-based anomalies
		if (latestMetrics && metricHistory.length > 0) {
			results.metricsAnomalies = detectAnomalies(
				metricHistory,
				latestMetrics
			);
		}

		// Detect conversation pattern anomalies
		if (conversationId) {
			results.conversationAnomalies = await analyzeConversationPatterns(
				conversationId
			);
		}

		// Combine all anomalies
		const allAnomalies = [
			...results.metricsAnomalies,
			...results.conversationAnomalies,
		];
		results.totalAnomalies = allAnomalies.length;

		// Create alerts for detected anomalies
		if (allAnomalies.length > 0) {
			results.alertsCreated = await createAnomalyAlerts(
				conversationId,
				allAnomalies,
				"anomaly_detection"
			);
		}

		return results;
	} catch (error) {
		console.error("Error in anomaly detection:", error);
		return {
			conversationId,
			timestamp: new Date(),
			error: error.message,
			metricsAnomalies: [],
			conversationAnomalies: [],
			totalAnomalies: 0,
			alertsCreated: 0,
		};
	}
}

module.exports = {
	detectAnomalies,
	analyzeConversationPatterns,
	createAnomalyAlerts,
	runAnomalyDetection,
};
