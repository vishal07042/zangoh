const mongoose = require("mongoose");

const AgentConfigSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		agentType: {
			type: String,
			enum: ["customer_service", "sales", "support", "general"],
			default: "customer_service",
		},
		// AI Model Configuration
		temperature: { type: Number, min: 0, max: 2, default: 0.7 },
		topP: { type: Number, min: 0, max: 1, default: 0.9 },
		maxTokens: { type: Number, min: 1, max: 4000, default: 1000 },
		speed: { type: Number, min: 0, max: 100, default: 50 },
		personality: { type: Number, min: 0, max: 100, default: 50 },
		stability: { type: Number, min: 0, max: 100, default: 70 },

		// Capabilities
		capabilities: {
			decisionMaking: { type: Boolean, default: true },
			autonomy: { type: Boolean, default: false },
			learning: { type: Boolean, default: true },
			perception: { type: Boolean, default: true },
			refunds: { type: Boolean, default: true },
			technicalSupport: { type: Boolean, default: true },
			billing: { type: Boolean, default: true },
			generalInquiry: { type: Boolean, default: true },
		},

		// Knowledge Base Access
		knowledgeBaseAccess: {
			permissions: { type: Boolean, default: true },
			internalArticles: { type: Boolean, default: true },
			publicArticles: { type: Boolean, default: true },
		},

		// Escalation Configuration
		escalationThreshold: { type: Number, min: 0, max: 100, default: 70 },
		escalationTimeoutMinutes: {
			type: Number,
			min: 1,
			max: 60,
			default: 10,
		},
		autoEscalateKeywords: [{ type: String }],

		// Response Configuration
		responseTimeTargetSeconds: { type: Number, default: 30 },
		maxConversationLength: { type: Number, default: 50 },

		// Custom Instructions
		customInstructions: {
			type: String,
			default:
				"Always be polite and helpful. Escalate complex issues to human supervisors.",
		},
		systemPrompt: { type: String },

		// Metadata
		isActive: { type: Boolean, default: true },
		isDefault: { type: Boolean, default: false },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

		// Usage Statistics
		usageCount: { type: Number, default: 0 },
		successRate: { type: Number, default: 0 },
		averageResponseTime: { type: Number, default: 0 },

		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

// Index for efficient queries
AgentConfigSchema.index({ isActive: 1, isDefault: 1 });
AgentConfigSchema.index({ agentType: 1 });
AgentConfigSchema.index({ createdBy: 1 });

module.exports = mongoose.model("AgentConfig", AgentConfigSchema);
