const express = require("express");
const MetricSnapshot = require("../../models/metricSnapshot");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");
const Alert = require("../../models/alert");

const router = express.Router();

// Get metric snapshots
router.get("/snapshots", async (req, res, next) => {
	try {
		const {
			conversationId,
			agentId,
			snapshotType,
			startDate,
			endDate,
			limit = 100,
		} = req.query;

		const filter = {};
		if (conversationId) filter.conversationId = conversationId;
		if (agentId) filter.agentId = agentId;
		if (snapshotType) filter.snapshotType = snapshotType;

		if (startDate || endDate) {
			filter.windowStart = {};
			if (startDate) filter.windowStart.$gte = new Date(startDate);
			if (endDate) filter.windowStart.$lte = new Date(endDate);
		}

		const items = await MetricSnapshot.find(filter)
			.populate("conversationId", "customerName status")
			.populate("agentId", "name email")
			.sort({ windowStart: -1 })
			.limit(parseInt(limit));

		res.json({ items });
	} catch (e) {
		next(e);
	}
});

// Get dashboard metrics (real-time overview)
router.get("/dashboard", async (req, res, next) => {
	try {
		const { timeRange = "24h" } = req.query;

		// Calculate time filter
		let timeFilter = {};
		switch (timeRange) {
			case "1h":
				timeFilter = {
					updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
				};
				break;
			case "24h":
				timeFilter = {
					updatedAt: {
						$gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "7d":
				timeFilter = {
					updatedAt: {
						$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			default:
				timeFilter = {};
		}

		// Get current metrics
		const [conversations, messages, alerts] = await Promise.all([
			// Conversation metrics
			Conversation.aggregate([
				{ $match: timeFilter },
				{
					$group: {
						_id: null,
						activeCount: {
							$sum: {
								$cond: [{ $eq: ["$status", "active"] }, 1, 0],
							},
						},
						resolvedCount: {
							$sum: {
								$cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
							},
						},
						escalatedCount: {
							$sum: {
								$cond: [
									{ $eq: ["$status", "escalated"] },
									1,
									0,
								],
							},
						},
						supervisorControlledCount: {
							$sum: {
								$cond: [
									{
										$eq: [
											"$isControlledBySupervisor",
											true,
										],
									},
									1,
									0,
								],
							},
						},
						totalCount: { $sum: 1 },
						averageResponseTime: { $avg: "$averageResponseTime" },
						averageCSAT: { $avg: "$satisfactionScore" },
					},
				},
			]),

			// Message metrics
			Message.aggregate([
				{
					$match: {
						...timeFilter,
						responseTime: { $exists: true, $gt: 0 },
					},
				},
				{
					$group: {
						_id: null,
						totalMessages: { $sum: 1 },
						averageResponseTime: { $avg: "$responseTime" },
						medianResponseTime: {
							$percentile: {
								input: "$responseTime",
								p: [0.5],
								method: "approximate",
							},
						},
					},
				},
			]),

			// Alert metrics
			Alert.aggregate([
				{ $match: { ...timeFilter, dismissed: { $ne: true } } },
				{
					$group: {
						_id: "$severity",
						count: { $sum: 1 },
					},
				},
			]),
		]);

		const conversationStats = conversations[0] || {
			activeCount: 0,
			resolvedCount: 0,
			escalatedCount: 0,
			supervisorControlledCount: 0,
			totalCount: 0,
			averageResponseTime: 0,
			averageCSAT: 0,
		};

		const messageStats = messages[0] || {
			totalMessages: 0,
			averageResponseTime: 0,
			medianResponseTime: [0],
		};

		// Calculate derived metrics
		const resolutionRate =
			conversationStats.totalCount > 0
				? (conversationStats.resolvedCount /
						conversationStats.totalCount) *
				  100
				: 0;

		const escalationRate =
			conversationStats.totalCount > 0
				? (conversationStats.escalatedCount /
						conversationStats.totalCount) *
				  100
				: 0;

		// Alert breakdown
		const alertBreakdown = alerts.reduce(
			(acc, alert) => {
				acc[alert._id] = alert.count;
				return acc;
			},
			{ high: 0, medium: 0, low: 0 }
		);

		res.json({
			timeRange,
			conversations: {
				active: conversationStats.activeCount,
				resolved: conversationStats.resolvedCount,
				escalated: conversationStats.escalatedCount,
				supervisorControlled:
					conversationStats.supervisorControlledCount,
				total: conversationStats.totalCount,
				resolutionRate: Math.round(resolutionRate * 100) / 100,
				escalationRate: Math.round(escalationRate * 100) / 100,
			},
			responseTime: {
				average: Math.round(
					(messageStats.averageResponseTime || 0) / 1000
				), // Convert to seconds
				median: Math.round(
					(messageStats.medianResponseTime?.[0] || 0) / 1000
				),
				target: 30, // 30 seconds target
			},
			csat: {
				score:
					Math.round((conversationStats.averageCSAT || 0) * 10) / 10,
				target: 4.0,
			},
			alerts: {
				total: Object.values(alertBreakdown).reduce((a, b) => a + b, 0),
				breakdown: alertBreakdown,
			},
		});
	} catch (e) {
		next(e);
	}
});

// Get historical trend data for charts
router.get("/trends", async (req, res, next) => {
	try {
		const {
			metric = "csat", // csat, responseTime, escalationRate, resolutionRate
			period = "24h", // 24h, 7d, 30d
			granularity = "hourly", // hourly, daily
		} = req.query;

		// Calculate time range and grouping
		let timeRange, groupBy;
		switch (period) {
			case "24h":
				timeRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
				groupBy =
					granularity === "hourly"
						? {
								year: "$year",
								month: "$month",
								day: "$dayOfMonth",
								hour: "$hour",
						  }
						: {
								year: "$year",
								month: "$month",
								day: "$dayOfMonth",
						  };
				break;
			case "7d":
				timeRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
				groupBy = {
					year: "$year",
					month: "$month",
					day: "$dayOfMonth",
				};
				break;
			case "30d":
				timeRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
				groupBy = {
					year: "$year",
					month: "$month",
					day: "$dayOfMonth",
				};
				break;
			default:
				timeRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
				groupBy = {
					year: "$year",
					month: "$month",
					day: "$dayOfMonth",
					hour: "$hour",
				};
		}

		let pipeline = [];
		let collection = Conversation;

		// Build aggregation pipeline based on metric
		switch (metric) {
			case "csat":
				pipeline = [
					{
						$match: {
							updatedAt: { $gte: timeRange },
							satisfactionScore: { $exists: true, $ne: null },
						},
					},
					{
						$group: {
							_id: { $dateFromParts: groupBy },
							value: { $avg: "$satisfactionScore" },
							count: { $sum: 1 },
						},
					},
					{ $sort: { _id: 1 } },
				];
				break;

			case "responseTime":
				collection = Message;
				pipeline = [
					{
						$match: {
							createdAt: { $gte: timeRange },
							responseTime: { $exists: true, $gt: 0 },
						},
					},
					{
						$group: {
							_id: {
								$dateFromParts: {
									...groupBy,
									year: { $year: "$createdAt" },
									month: { $month: "$createdAt" },
									day: { $dayOfMonth: "$createdAt" },
									...(groupBy.hour
										? { hour: { $hour: "$createdAt" } }
										: {}),
								},
							},
							value: { $avg: "$responseTime" },
							count: { $sum: 1 },
						},
					},
					{ $sort: { _id: 1 } },
				];
				break;

			case "escalationRate":
				pipeline = [
					{ $match: { updatedAt: { $gte: timeRange } } },
					{
						$group: {
							_id: { $dateFromParts: groupBy },
							escalated: {
								$sum: {
									$cond: [
										{ $eq: ["$status", "escalated"] },
										1,
										0,
									],
								},
							},
							total: { $sum: 1 },
						},
					},
					{
						$addFields: {
							value: {
								$multiply: [
									{ $divide: ["$escalated", "$total"] },
									100,
								],
							},
						},
					},
					{ $sort: { _id: 1 } },
				];
				break;

			case "resolutionRate":
				pipeline = [
					{ $match: { updatedAt: { $gte: timeRange } } },
					{
						$group: {
							_id: { $dateFromParts: groupBy },
							resolved: {
								$sum: {
									$cond: [
										{ $eq: ["$status", "resolved"] },
										1,
										0,
									],
								},
							},
							total: { $sum: 1 },
						},
					},
					{
						$addFields: {
							value: {
								$multiply: [
									{ $divide: ["$resolved", "$total"] },
									100,
								],
							},
						},
					},
					{ $sort: { _id: 1 } },
				];
				break;

			default:
				return res.status(400).json({ error: "Invalid metric type" });
		}

		const results = await collection.aggregate(pipeline);

		// Format results for chart consumption
		const chartData = results.map((item) => ({
			timestamp: item._id,
			value: Math.round((item.value || 0) * 100) / 100,
			count: item.count || item.total || 0,
		}));

		res.json({
			metric,
			period,
			granularity,
			data: chartData,
		});
	} catch (e) {
		next(e);
	}
});

// Get agent performance metrics
router.get("/agents/performance", async (req, res, next) => {
	try {
		const { timeRange = "24h", limit = 10 } = req.query;

		// Calculate time filter
		let timeFilter = {};
		switch (timeRange) {
			case "24h":
				timeFilter = {
					updatedAt: {
						$gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "7d":
				timeFilter = {
					updatedAt: {
						$gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					},
				};
				break;
			case "30d":
				timeFilter = {
					updatedAt: {
						$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					},
				};
				break;
		}

		const agentStats = await Conversation.aggregate([
			{ $match: { ...timeFilter, agentId: { $ne: null } } },
			{
				$lookup: {
					from: "users",
					localField: "agentId",
					foreignField: "_id",
					as: "agent",
				},
			},
			{ $unwind: "$agent" },
			{
				$group: {
					_id: "$agentId",
					agentName: { $first: "$agent.name" },
					totalConversations: { $sum: 1 },
					resolvedConversations: {
						$sum: {
							$cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
						},
					},
					escalatedConversations: {
						$sum: {
							$cond: [{ $eq: ["$status", "escalated"] }, 1, 0],
						},
					},
					averageResponseTime: { $avg: "$averageResponseTime" },
					averageCSAT: { $avg: "$satisfactionScore" },
				},
			},
			{
				$addFields: {
					resolutionRate: {
						$multiply: [
							{
								$divide: [
									"$resolvedConversations",
									"$totalConversations",
								],
							},
							100,
						],
					},
					escalationRate: {
						$multiply: [
							{
								$divide: [
									"$escalatedConversations",
									"$totalConversations",
								],
							},
							100,
						],
					},
				},
			},
			{ $sort: { resolutionRate: -1, averageCSAT: -1 } },
			{ $limit: parseInt(limit) },
		]);

		res.json({
			timeRange,
			agents: agentStats,
		});
	} catch (e) {
		next(e);
	}
});

// Create metric snapshot
router.post("/snapshots", async (req, res, next) => {
	try {
		const snapshotData = {
			...req.body,
			calculatedAt: new Date(),
		};

		const doc = await MetricSnapshot.create(snapshotData);
		res.status(201).json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
