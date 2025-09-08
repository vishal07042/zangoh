const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
	{
		customerId: { type: String, required: true, index: true },
		agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		status: { type: String, enum: ["open", "closed"], default: "open" },
		channel: { type: String, enum: ["chat", "voice"], default: "chat" },
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
