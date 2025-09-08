const express = require("express");
const Template = require("../../models/template");

const router = express.Router();

// Get templates with filtering and pagination
router.get("/", async (req, res, next) => {
	try {
		const {
			category,
			useCase,
			isActive,
			isPublic,
			createdBy,
			tags,
			search,
			limit = 50,
			offset = 0,
			sortBy = "updatedAt",
			sortOrder = "desc",
		} = req.query;

		// Build filter query
		const filter = {};
		if (category) filter.category = category;
		if (useCase) filter.useCase = useCase;
		if (isActive !== undefined) filter.isActive = isActive === "true";
		if (isPublic !== undefined) filter.isPublic = isPublic === "true";
		if (createdBy) filter.createdBy = createdBy;
		if (tags) {
			const tagArray = tags.split(",").map((tag) => tag.trim());
			filter.tags = { $in: tagArray };
		}
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ content: { $regex: search, $options: "i" } },
			];
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === "asc" ? 1 : -1;

		const items = await Template.find(filter)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email")
			.populate("approvedBy", "name email")
			.sort(sort)
			.limit(parseInt(limit))
			.skip(parseInt(offset));

		const totalCount = await Template.countDocuments(filter);

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

// Get single template
router.get("/:id", async (req, res, next) => {
	try {
		const doc = await Template.findById(req.params.id)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email")
			.populate("approvedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Template not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Create new template
router.post("/", async (req, res, next) => {
	try {
		const templateData = {
			...req.body,
			usageCount: 0,
			successRate: 0,
			version: "1.0",
		};

		const doc = await Template.create(templateData);

		const populatedDoc = await Template.findById(doc._id).populate(
			"createdBy",
			"name email"
		);

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Update template
router.patch("/:id", async (req, res, next) => {
	try {
		const existingTemplate = await Template.findById(req.params.id);
		if (!existingTemplate) {
			return res.status(404).json({ error: "Template not found" });
		}

		// If content is being changed, save previous version
		const updateData = { ...req.body };
		if (req.body.content && req.body.content !== existingTemplate.content) {
			updateData.previousVersions =
				existingTemplate.previousVersions || [];
			updateData.previousVersions.push({
				version: existingTemplate.version,
				content: existingTemplate.content,
				modifiedAt: new Date(),
				modifiedBy: req.body.lastModifiedBy,
			});

			// Increment version
			const versionParts = existingTemplate.version.split(".");
			const minorVersion = parseInt(versionParts[1]) + 1;
			updateData.version = `${versionParts[0]}.${minorVersion}`;
		}

		const doc = await Template.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true }
		)
			.populate("createdBy", "name email")
			.populate("lastModifiedBy", "name email");

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Delete template
router.delete("/:id", async (req, res, next) => {
	try {
		const doc = await Template.findById(req.params.id);

		if (!doc) {
			return res.status(404).json({ error: "Template not found" });
		}

		await Template.findByIdAndDelete(req.params.id);

		res.json({ message: "Template deleted successfully" });
	} catch (e) {
		next(e);
	}
});

// Preview template with variables
router.post("/:id/preview", async (req, res, next) => {
	try {
		const { variables = {} } = req.body;

		const template = await Template.findById(req.params.id);
		if (!template) {
			return res.status(404).json({ error: "Template not found" });
		}

		// Replace variables in template content
		let processedContent = template.content;
		template.variables.forEach((variable) => {
			const value =
				variables[variable.name] ||
				variable.defaultValue ||
				`{{${variable.name}}}`;
			const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, "g");
			processedContent = processedContent.replace(regex, value);
		});

		res.json({
			template: {
				id: template._id,
				name: template.name,
				category: template.category,
				content: template.content,
			},
			processedContent,
			variables: template.variables,
		});
	} catch (e) {
		next(e);
	}
});

// Approve template
router.patch("/:id/approve", async (req, res, next) => {
	try {
		const { approvedBy } = req.body;

		const doc = await Template.findByIdAndUpdate(
			req.params.id,
			{
				approvedBy,
				approvedAt: new Date(),
				isActive: true,
			},
			{ new: true }
		).populate("approvedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Template not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Clone template
router.post("/:id/clone", async (req, res, next) => {
	try {
		const { name, createdBy } = req.body;

		const originalTemplate = await Template.findById(req.params.id);
		if (!originalTemplate) {
			return res.status(404).json({ error: "Template not found" });
		}

		const cloneData = {
			...originalTemplate.toObject(),
			name: name || `${originalTemplate.name} (Copy)`,
			createdBy,
			lastModifiedBy: createdBy,
			usageCount: 0,
			successRate: 0,
			version: "1.0",
			previousVersions: [],
			approvedBy: null,
			approvedAt: null,
			isActive: false, // Clones start as inactive
		};

		delete cloneData._id;
		delete cloneData.createdAt;
		delete cloneData.updatedAt;

		const doc = await Template.create(cloneData);

		const populatedDoc = await Template.findById(doc._id).populate(
			"createdBy",
			"name email"
		);

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Get template categories
router.get("/meta/categories", async (req, res, next) => {
	try {
		const categories = await Template.distinct("category");

		res.json({ categories });
	} catch (e) {
		next(e);
	}
});

// Get template usage statistics
router.get("/:id/stats", async (req, res, next) => {
	try {
		const template = await Template.findById(req.params.id);
		if (!template) {
			return res.status(404).json({ error: "Template not found" });
		}

		res.json({
			usageCount: template.usageCount,
			successRate: template.successRate,
			lastUsedAt: template.lastUsedAt,
			version: template.version,
			versionHistory: template.previousVersions.length,
		});
	} catch (e) {
		next(e);
	}
});

// Search templates by keywords
router.get("/search/keywords", async (req, res, next) => {
	try {
		const { keywords, useCase, limit = 10 } = req.query;

		if (!keywords) {
			return res
				.status(400)
				.json({ error: "Keywords parameter is required" });
		}

		const keywordArray = keywords
			.split(",")
			.map((k) => k.trim().toLowerCase());

		const filter = {
			isActive: true,
			triggerKeywords: { $in: keywordArray },
		};

		if (useCase) {
			filter.useCase = useCase;
		}

		const templates = await Template.find(filter)
			.populate("createdBy", "name email")
			.sort({ usageCount: -1 })
			.limit(parseInt(limit));

		res.json({ templates, matchedKeywords: keywordArray });
	} catch (e) {
		next(e);
	}
});

// Get popular templates
router.get("/popular/trending", async (req, res, next) => {
	try {
		const { limit = 10, timeRange = "30d" } = req.query;

		// Calculate time filter
		let timeFilter = {};
		switch (timeRange) {
			case "7d":
				timeFilter = {
					lastUsedAt: {
						$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "30d":
				timeFilter = {
					lastUsedAt: {
						$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			default:
				timeFilter = {};
		}

		const templates = await Template.find({
			isActive: true,
			...timeFilter,
		})
			.populate("createdBy", "name email")
			.sort({ usageCount: -1, successRate: -1 })
			.limit(parseInt(limit));

		res.json({ templates, timeRange });
	} catch (e) {
		next(e);
	}
});

module.exports = router;
