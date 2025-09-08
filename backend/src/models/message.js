const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
	{
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
			index: true,
		},
		senderType: {
			type: String,
			enum: ["agent", "customer", "ai", "supervisor"],
			required: true,
		},
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: function () {
				return this.senderType !== "customer";
			},
		},
		senderName: { type: String },
		text: { type: String, default: "" },
		sentAt: { type: Date, default: () => new Date() },
		latencyMs: { type: Number, default: 0 },
		toxicity: { type: Number, min: 0, max: 1, default: 0 },
		polarity: { type: Number, min: -1, max: 1, default: 0 },
		entities: { type: [String], default: [] },
		// Message metadata
		isInternal: { type: Boolean, default: false }, // For supervisor notes
		templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
		takeoverMessage: { type: Boolean, default: false }, // Marks when supervisor takes over
		returnToAIMessage: { type: Boolean, default: false }, // Marks when returning to AI
		confidence: { type: Number, min: 0, max: 1 }, // AI confidence score
		responseTime: { type: Number }, // Time to respond to previous message
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

// Index for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderType: 1, createdAt: -1 });
MessageSchema.index({ takeoverMessage: 1 });

module.exports = mongoose.model("Message", MessageSchema);
