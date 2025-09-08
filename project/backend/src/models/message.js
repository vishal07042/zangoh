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
			enum: ["agent", "customer", "ai"],
			required: true,
		},
		text: { type: String, default: "" },
		sentAt: { type: Date, default: () => new Date() },
		latencyMs: { type: Number, default: 0 },
		toxicity: { type: Number, min: 0, max: 1, default: 0 },
		polarity: { type: Number, min: -1, max: 1, default: 0 },
		entities: { type: [String], default: [] },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
