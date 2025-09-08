const express = require("express");
const Alert = require("../../models/alert");
const Conversation = require("../../models/conversation");

const router = express.Router();

// Get alerts with filtering and pagination
router.get("/", async (req, res, next) => {
	try {
		const {
			conversationId,
			type,
			severity,
			level,
			acknowledged,
			dismissed,
			limit = 200,
			offset = 0,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// Build filter query
		const filter = {};
		if (conversationId) filter.conversationId = conversationId;
		if (type) filter.type = type;
		if (severity) filter.severity = severity;
		if (level) filter.level = level;
		if (acknowledged !== undefined)
			filter.acknowledged = acknowledged === "true";
		if (dismissed !== undefined) filter.dismissed = dismissed === "true";

		// Default to non-dismissed alerts unless specifically requested
		if (dismissed === undefined) {
			filter.dismissed = { $ne: true };
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === "asc" ? 1 : -1;

		const items = await Alert.find(filter)
			.populate("conversationId", "customerName customerId status")
			.populate("agentId", "name email")
			.populate("supervisorId", "name email")
			.populate("acknowledgedBy", "name email")
			.populate("dismissedBy", "name email")
			.sort(sort)
			.limit(parseInt(limit))
			.skip(parseInt(offset));

		const totalCount = await Alert.countDocuments(filter);

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

// Create new alert
router.post("/", async (req, res, next) => {
	try {
		const alertData = {
			...req.body,
			timestamp: new Date(),
		};

		// Set expiry for certain alert types
		if (alertData.type === "timeout" || alertData.type === "system") {
			alertData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
		}

		const doc = await Alert.create(alertData);

		const populatedDoc = await Alert.findById(doc._id)
			.populate("conversationId", "customerName customerId status")
			.populate("agentId", "name email");

		// TODO: Emit WebSocket event
		// io.emit('newAlert', populatedDoc);

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Acknowledge alert
router.patch("/:id/acknowledge", async (req, res, next) => {
	try {
		const { acknowledgedBy } = req.body;

		const doc = await Alert.findByIdAndUpdate(
			req.params.id,
			{
				acknowledged: true,
				acknowledgedBy,
				acknowledgedAt: new Date(),
			},
			{ new: true }
		)
			.populate("conversationId", "customerName customerId status")
			.populate("acknowledgedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Alert not found" });
		}

		// TODO: Emit WebSocket event
		// io.emit('alertAcknowledged', doc);

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Dismiss alert
router.patch("/:id/dismiss", async (req, res, next) => {
	try {
		const { dismissedBy } = req.body;

		const doc = await Alert.findByIdAndUpdate(
			req.params.id,
			{
				dismissed: true,
				dismissedBy,
				dismissedAt: new Date(),
			},
			{ new: true }
		)
			.populate("conversationId", "customerName customerId status")
			.populate("dismissedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Alert not found" });
		}

		// TODO: Emit WebSocket event
		// io.emit('alertDismissed', doc);

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Resolve alert (for escalation alerts)
router.patch("/:id/resolve", async (req, res, next) => {
	try {
		const doc = await Alert.findByIdAndUpdate(
			req.params.id,
			{
				resolved: true,
				resolvedAt: new Date(),
			},
			{ new: true }
		).populate("conversationId", "customerName customerId status");

		if (!doc) {
			return res.status(404).json({ error: "Alert not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Get alert statistics
router.get("/stats", async (req, res, next) => {
	try {
		const { timeRange = "24h" } = req.query;

		// Calculate time filter
		let timeFilter = {};
		switch (timeRange) {
			case "1h":
				timeFilter = {
					createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
				};
				break;
			case "24h":
				timeFilter = {
					createdAt: {
						$gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "7d":
				timeFilter = {
					createdAt: {
						$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "30d":
				timeFilter = {
					createdAt: {
						$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			default:
				timeFilter = {};
		}

		// Aggregate statistics
		const [
			totalAlerts,
			byType,
			bySeverity,
			byLevel,
			acknowledged,
			dismissed,
			resolved,
		] = await Promise.all([
			// Total alerts
			Alert.countDocuments({ ...timeFilter, dismissed: { $ne: true } }),

			// By type
			Alert.aggregate([
				{ $match: { ...timeFilter, dismissed: { $ne: true } } },
				{ $group: { _id: "$type", count: { $sum: 1 } } },
			]),

			// By severity
			Alert.aggregate([
				{ $match: { ...timeFilter, dismissed: { $ne: true } } },
				{ $group: { _id: "$severity", count: { $sum: 1 } } },
			]),

			// By level
			Alert.aggregate([
				{ $match: { ...timeFilter, dismissed: { $ne: true } } },
				{ $group: { _id: "$level", count: { $sum: 1 } } },
			]),

			// Acknowledged
			Alert.countDocuments({
				...timeFilter,
				acknowledged: true,
				dismissed: { $ne: true },
			}),

			// Dismissed
			Alert.countDocuments({ ...timeFilter, dismissed: true }),

			// Resolved
			Alert.countDocuments({ ...timeFilter, resolved: true }),
		]);

		res.json({
			timeRange,
			totalAlerts,
			acknowledgedAlerts: acknowledged,
			dismissedAlerts: dismissed,
			resolvedAlerts: resolved,
			pendingAlerts: totalAlerts - acknowledged,
			breakdown: {
				byType: byType.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
				bySeverity: bySeverity.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
				byLevel: byLevel.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {}),
			},
		});
	} catch (e) {
		next(e);
	}
});

// Bulk dismiss alerts
router.patch("/bulk/dismiss", async (req, res, next) => {
	try {
		const { alertIds, dismissedBy } = req.body;

		if (!Array.isArray(alertIds) || alertIds.length === 0) {
			return res
				.status(400)
				.json({ error: "alertIds must be a non-empty array" });
		}

		const result = await Alert.updateMany(
			{ _id: { $in: alertIds } },
			{
				dismissed: true,
				dismissedBy,
				dismissedAt: new Date(),
			}
		);

		res.json({
			modifiedCount: result.modifiedCount,
			matchedCount: result.matchedCount,
		});
	} catch (e) {
		next(e);
	}
});

// Get single alert details
router.get("/:id", async (req, res, next) => {
	try {
		const doc = await Alert.findById(req.params.id)
			.populate(
				"conversationId",
				"customerName customerId status priority tags"
			)
			.populate("agentId", "name email")
			.populate("supervisorId", "name email")
			.populate("acknowledgedBy", "name email")
			.populate("dismissedBy", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Alert not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
