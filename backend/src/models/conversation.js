const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
	{
		customerId: { type: String, required: true, index: true },
		customerName: { type: String, required: true },
		customerAvatar: { type: String, default: "/ellipse-1.png" },
		customerEmail: { type: String },
		customerAddress: { type: String },
		agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		status: {
			type: String,
			enum: ["active", "waiting", "resolved", "escalated", "closed"],
			default: "active",
		},
		channel: {
			type: String,
			enum: ["chat", "voice", "email"],
			default: "chat",
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high", "critical"],
			default: "medium",
		},
		isControlledBySupervisor: { type: Boolean, default: false },
		takeoverTimestamp: { type: Date },
		takeoverNotes: { type: String },
		tags: [{ type: String }],
		lastMessageAt: { type: Date, default: Date.now },
		responseTime: { type: Number, default: 0 }, // in seconds
		satisfactionScore: { type: Number, min: 1, max: 5 },
		escalationReason: { type: String },
		metadata: { type: Object, default: {} },
		// Metrics
		messageCount: { type: Number, default: 0 },
		averageResponseTime: { type: Number, default: 0 },
		totalResponseTime: { type: Number, default: 0 },
		waitingTime: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

// Index for efficient queries
ConversationSchema.index({ status: 1, updatedAt: -1 });
ConversationSchema.index({ isControlledBySupervisor: 1 });
ConversationSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
