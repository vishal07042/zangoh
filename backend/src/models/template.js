const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		description: { type: String },
		category: {
			type: String,
			enum: [
				"greeting",
				"resolution",
				"escalation",
				"follow_up",
				"closing",
				"general",
			],
			default: "general",
		},

		// Template Content
		content: { type: String, required: true },
		variables: [
			{
				name: { type: String, required: true },
				description: { type: String },
				defaultValue: { type: String },
				required: { type: Boolean, default: false },
				type: {
					type: String,
					enum: ["text", "number", "date", "dropdown"],
					default: "text",
				},
				options: [{ type: String }], // For dropdown type
			},
		],

		// Usage Context
		useCase: {
			type: String,
			enum: [
				"customer_service",
				"sales",
				"support",
				"billing",
				"general",
			],
			default: "customer_service",
		},
		triggerKeywords: [{ type: String }],
		suggestedScenarios: [{ type: String }],

		// Template Configuration
		isActive: { type: Boolean, default: true },
		isPublic: { type: Boolean, default: false },
		requiresApproval: { type: Boolean, default: false },

		// Metadata
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		approvedAt: { type: Date },

		// Usage Statistics
		usageCount: { type: Number, default: 0 },
		successRate: { type: Number, default: 0 },
		lastUsedAt: { type: Date },

		// Tags for organization
		tags: [{ type: String }],

		// Template Version Control
		version: { type: String, default: "1.0" },
		previousVersions: [
			{
				version: { type: String },
				content: { type: String },
				modifiedAt: { type: Date },
				modifiedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			},
		],

		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

// Index for efficient queries
TemplateSchema.index({ category: 1, isActive: 1 });
TemplateSchema.index({ createdBy: 1 });
TemplateSchema.index({ useCase: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ triggerKeywords: 1 });

module.exports = mongoose.model("Template", TemplateSchema);
