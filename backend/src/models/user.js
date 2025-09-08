const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, index: true, unique: true },
		role: {
			type: String,
			enum: ["agent", "supervisor", "admin"],
			default: "agent",
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
