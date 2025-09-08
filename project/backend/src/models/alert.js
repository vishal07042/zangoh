const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
	{
		level: {
			type: String,
			enum: ["info", "warning", "critical"],
			required: true,
		},
		type: { type: String, required: true },
		message: { type: String, required: true },
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Conversation",
		},
		meta: { type: Object, default: {} },
		acknowledged: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
