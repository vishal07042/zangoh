const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
	{
		level: {
			type: String,
			enum: ["info", "warning", "critical"],
			required: true,
		},
		severity: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		type: {
			type: String,
			enum: [
				"escalation",
				"timeout",
				"satisfaction",
				"anomaly",
				"system",
			],
			required: true,
		},
		title: { type: String, required: true },
		message: { type: String, required: true },
		description: { type: String },
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
		},
		customerName: { type: String },
		customerId: { type: String },
		agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		meta: { type: Object, default: {} },
		acknowledged: { type: Boolean, default: false },
		acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		acknowledgedAt: { type: Date },
		dismissed: { type: Boolean, default: false },
		dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		dismissedAt: { type: Date },
		resolved: { type: Boolean, default: false },
		resolvedAt: { type: Date },
		// Auto-expiry for certain alert types
		expiresAt: { type: Date },
		timestamp: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

// Index for efficient queries
AlertSchema.index({ conversationId: 1 });
AlertSchema.index({ acknowledged: 1, dismissed: 1 });
AlertSchema.index({ severity: 1, createdAt: -1 });
AlertSchema.index({ type: 1, createdAt: -1 });
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Alert", AlertSchema);
