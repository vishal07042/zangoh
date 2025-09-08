const express = require("express");
const AgentConfig = require("../../models/agentConfig");

const router = express.Router();

// Get agent configurations
router.get("/", async (req, res, next) => {
	try {
		const {
			agentType,
			isActive,
			isDefault,
			createdBy,
			limit = 50,
			offset = 0,
			sortBy = "updatedAt",
			sortOrder = "desc",
		} = req.query;

		// Build filter query
		const filter = {};
		if (agentType) filter.agentType = agentType;
		if (isActive !== undefined) filter.isActive = isActive === "true";
		if (isDefault !== undefined) filter.isDefault = isDefault === "true";
		if (createdBy) filter.createdBy = createdBy;

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === "asc" ? 1 : -1;

		const items = await AgentConfig.find(filter)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email")
			.sort(sort)
			.limit(parseInt(limit))
			.skip(parseInt(offset));

		const totalCount = await AgentConfig.countDocuments(filter);

		res.json({
			items,
			totalCount,
			limit: parseInt(limit),
			offset: parseInt(offset),
		});
	} catch (e) {
		next(e);
	}
});

// Get single configuration
router.get("/:id", async (req, res, next) => {
	try {
		const doc = await AgentConfig.findById(req.params.id)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Configuration not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Create new agent configuration
router.post("/", async (req, res, next) => {
	try {
		const configData = {
			...req.body,
			usageCount: 0,
			successRate: 0,
			averageResponseTime: 0,
		};

		// If this is set as default, unset all other defaults of the same type
		if (configData.isDefault) {
			await AgentConfig.updateMany(
				{ agentType: configData.agentType, isDefault: true },
				{ isDefault: false }
			);
		}

		const doc = await AgentConfig.create(configData);

		const populatedDoc = await AgentConfig.findById(doc._id)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email");

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Update agent configuration
router.patch("/:id", async (req, res, next) => {
	try {
		const updateData = {
			...req.body,
			lastModifiedBy: req.body.lastModifiedBy,
		};

		// If this is set as default, unset all other defaults of the same type
		if (updateData.isDefault) {
			const config = await AgentConfig.findById(req.params.id);
			if (config) {
				await AgentConfig.updateMany(
					{
						agentType: config.agentType,
						isDefault: true,
						_id: { $ne: req.params.id },
					},
					{ isDefault: false }
				);
			}
		}

		const doc = await AgentConfig.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true }
		)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Configuration not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Delete agent configuration
router.delete("/:id", async (req, res, next) => {
	try {
		const doc = await AgentConfig.findById(req.params.id);

		if (!doc) {
			return res.status(404).json({ error: "Configuration not found" });
		}

		// Don't allow deletion of default configurations
		if (doc.isDefault) {
			return res.status(400).json({
				error: "Cannot delete default configuration. Set another configuration as default first.",
			});
		}

		await AgentConfig.findByIdAndDelete(req.params.id);

		res.json({ message: "Configuration deleted successfully" });
	} catch (e) {
		next(e);
	}
});

// Get configuration presets (built-in configurations)
router.get("/presets/list", async (req, res, next) => {
	try {
		const presets = [
			{
				id: "conservative",
				name: "Conservative",
				description:
					"Low risk, high accuracy responses with higher escalation threshold",
				config: {
					temperature: 0.3,
					topP: 0.8,
					maxTokens: 800,
					escalationThreshold: 80,
					capabilities: {
						decisionMaking: false,
						autonomy: false,
						learning: true,
						perception: true,
						refunds: false,
						technicalSupport: true,
						billing: false,
						generalInquiry: true,
					},
					customInstructions:
						"Be very careful and conservative in responses. Escalate when uncertain.",
				},
			},
			{
				id: "balanced",
				name: "Balanced",
				description:
					"Well-rounded configuration suitable for most use cases",
				config: {
					temperature: 0.7,
					topP: 0.9,
					maxTokens: 1000,
					escalationThreshold: 70,
					capabilities: {
						decisionMaking: true,
						autonomy: false,
						learning: true,
						perception: true,
						refunds: true,
						technicalSupport: true,
						billing: true,
						generalInquiry: true,
					},
					customInstructions:
						"Always be polite and helpful. Escalate complex issues to human supervisors.",
				},
			},
			{
				id: "creative",
				name: "Creative",
				description:
					"More flexible responses with creative problem-solving",
				config: {
					temperature: 1.2,
					topP: 0.95,
					maxTokens: 1200,
					escalationThreshold: 60,
					capabilities: {
						decisionMaking: true,
						autonomy: true,
						learning: true,
						perception: true,
						refunds: true,
						technicalSupport: true,
						billing: true,
						generalInquiry: true,
					},
					customInstructions:
						"Be creative and helpful in finding solutions. Take initiative when appropriate.",
				},
			},
		];

		res.json({ presets });
	} catch (e) {
		next(e);
	}
});

// Apply preset to create new configuration
router.post("/presets/:presetId/apply", async (req, res, next) => {
	try {
		const { presetId } = req.params;
		const { name, agentType = "customer_service", createdBy } = req.body;

		// Get preset configuration
		const presetsResponse = await new Promise((resolve) => {
			// Simulate getting presets (in real implementation, this would be from database or config file)
			const presets = [
				{
					id: "conservative",
					config: {
						temperature: 0.3,
						topP: 0.8,
						maxTokens: 800,
						escalationThreshold: 80,
						capabilities: {
							decisionMaking: false,
							autonomy: false,
							learning: true,
							perception: true,
							refunds: false,
							technicalSupport: true,
							billing: false,
							generalInquiry: true,
						},
					},
				},
				{
					id: "balanced",
					config: {
						temperature: 0.7,
						topP: 0.9,
						maxTokens: 1000,
						escalationThreshold: 70,
						capabilities: {
							decisionMaking: true,
							autonomy: false,
							learning: true,
							perception: true,
							refunds: true,
							technicalSupport: true,
							billing: true,
							generalInquiry: true,
						},
					},
				},
				{
					id: "creative",
					config: {
						temperature: 1.2,
						topP: 0.95,
						maxTokens: 1200,
						escalationThreshold: 60,
						capabilities: {
							decisionMaking: true,
							autonomy: true,
							learning: true,
							perception: true,
							refunds: true,
							technicalSupport: true,
							billing: true,
							generalInquiry: true,
						},
					},
				},
			];
			resolve(presets);
		});

		const preset = presetsResponse.find((p) => p.id === presetId);
		if (!preset) {
			return res.status(404).json({ error: "Preset not found" });
		}

		const configData = {
			name:
				name ||
				`${
					preset.id.charAt(0).toUpperCase() + preset.id.slice(1)
				} Configuration`,
			agentType,
			...preset.config,
			createdBy,
			isActive: true,
			isDefault: false,
		};

		const doc = await AgentConfig.create(configData);

		const populatedDoc = await AgentConfig.findById(doc._id).populate(
			"createdBy",
			"name email"
		);

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Clone existing configuration
router.post("/:id/clone", async (req, res, next) => {
	try {
		const { name, createdBy } = req.body;

		const originalConfig = await AgentConfig.findById(req.params.id);
		if (!originalConfig) {
			return res.status(404).json({ error: "Configuration not found" });
		}

		const cloneData = {
			...originalConfig.toObject(),
			name: name || `${originalConfig.name} (Copy)`,
			createdBy,
			lastModifiedBy: createdBy,
			isDefault: false,
			usageCount: 0,
			successRate: 0,
			averageResponseTime: 0,
		};

		delete cloneData._id;
		delete cloneData.createdAt;
		delete cloneData.updatedAt;

		const doc = await AgentConfig.create(cloneData);

		const populatedDoc = await AgentConfig.findById(doc._id)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email");

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Get configuration usage statistics
router.get("/:id/stats", async (req, res, next) => {
	try {
		const config = await AgentConfig.findById(req.params.id);
		if (!config) {
			return res.status(404).json({ error: "Configuration not found" });
		}

		// In a real implementation, you would query conversation/message data
		// For now, we'll return the stored statistics
		res.json({
			usageCount: config.usageCount,
			successRate: config.successRate,
			averageResponseTime: config.averageResponseTime,
			lastUsed: config.updatedAt,
		});
	} catch (e) {
		next(e);
	}
});

module.exports = router;
