const mongoose = require("mongoose");

const MetricSnapshotSchema = new mongoose.Schema(
	{
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
			index: true,
		},
		windowStart: { type: Date, required: true },
		windowEnd: { type: Date, required: true },
		metrics: {
			latencyP95: Number,
			toxicityAvg: Number,
			sentimentAvg: Number,
			aiQuality: Number,
			customerExperience: Number,
			technicalHealth: Number,
			compositeScore: Number,
		},
		anomalies: [{ type: String }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("MetricSnapshot", MetricSnapshotSchema);
