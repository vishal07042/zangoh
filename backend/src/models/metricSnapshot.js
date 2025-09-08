const mongoose = require("mongoose");

const MetricSnapshotSchema = new mongoose.Schema(
	{
		// Snapshot Configuration
		snapshotType: {
			type: String,
			enum: ["hourly", "daily", "weekly", "monthly", "real_time"],
			default: "hourly",
		},
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
			index: true,
		},
		agentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			index: true,
		},
		windowStart: { type: Date, required: true },
		windowEnd: { type: Date, required: true },

		// Core Metrics
		metrics: {
			// Response Time Metrics
			latencyP95: Number,
			averageResponseTime: { type: Number, default: 0 },
			medianResponseTime: { type: Number, default: 0 },
			maxResponseTime: { type: Number, default: 0 },
			minResponseTime: { type: Number, default: 0 },

			// Sentiment & Quality Metrics
			toxicityAvg: Number,
			sentimentAvg: Number,
			aiQuality: Number,
			customerExperience: Number,
			customerSatisfactionScore: { type: Number, min: 1, max: 5 },

			// Operational Metrics
			technicalHealth: Number,
			compositeScore: Number,
			resolutionRate: { type: Number, default: 0 },
			escalationRate: { type: Number, default: 0 },
			firstCallResolutionRate: { type: Number, default: 0 },

			// Conversation Metrics
			activeConversations: { type: Number, default: 0 },
			totalConversations: { type: Number, default: 0 },
			resolvedConversations: { type: Number, default: 0 },
			escalatedConversations: { type: Number, default: 0 },
			abandonedConversations: { type: Number, default: 0 },

			// Message Metrics
			totalMessages: { type: Number, default: 0 },
			aiMessages: { type: Number, default: 0 },
			supervisorMessages: { type: Number, default: 0 },
			customerMessages: { type: Number, default: 0 },

			// Supervisor Intervention Metrics
			takeoverCount: { type: Number, default: 0 },
			takeoverRate: { type: Number, default: 0 },
			averageHandoffTime: { type: Number, default: 0 },
			supervisorActiveTime: { type: Number, default: 0 },
		},

		// Anomalies and Alerts
		anomalies: [
			{
				type: { type: String },
				description: { type: String },
				severity: { type: String, enum: ["low", "medium", "high"] },
				detectedAt: { type: Date, default: Date.now },
			},
		],
		alertCount: { type: Number, default: 0 },
		criticalAlertCount: { type: Number, default: 0 },

		// Performance Trends
		trends: {
			performanceDirection: {
				type: String,
				enum: ["improving", "declining", "stable", "unknown"],
				default: "unknown",
			},
			changePercentage: { type: Number, default: 0 },
			comparedToLastPeriod: { type: Boolean, default: false },
		},

		// Metadata
		calculatedAt: { type: Date, default: Date.now },
		dataQuality: {
			type: String,
			enum: ["high", "medium", "low"],
			default: "high",
		},
		sampleSize: { type: Number, default: 0 },
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

// Indexes for efficient queries
MetricSnapshotSchema.index({ snapshotType: 1, windowStart: -1 });
MetricSnapshotSchema.index({ conversationId: 1, windowStart: -1 });
MetricSnapshotSchema.index({ agentId: 1, windowStart: -1 });
MetricSnapshotSchema.index({ windowStart: 1, windowEnd: 1 });

module.exports = mongoose.model("MetricSnapshot", MetricSnapshotSchema);
