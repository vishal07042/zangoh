const express = require("express");
const Conversation = require("../../models/conversation");
const Message = require("../../models/message");
const Alert = require("../../models/alert");

const router = express.Router();

// Get conversations with filtering, sorting, and pagination
router.get("/", async (req, res, next) => {
	try {
		const {
			status,
			search,
			supervisorControlled,
			priority,
			limit = 100,
			offset = 0,
			sortBy = "updatedAt",
			sortOrder = "desc",
		} = req.query;

		// Build filter query
		const filter = {};
		if (status) {
			filter.status = status === "all" ? { $ne: null } : status;
		}
		if (supervisorControlled !== undefined) {
			filter.isControlledBySupervisor = supervisorControlled === "true";
		}
		if (priority) {
			filter.priority = priority;
		}
		if (search) {
			filter.$or = [
				{ customerName: { $regex: search, $options: "i" } },
				{ customerId: { $regex: search, $options: "i" } },
				{ tags: { $in: [new RegExp(search, "i")] } },
			];
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === "asc" ? 1 : -1;

		const items = await Conversation.find(filter)
			.populate("agentId", "name email")
			.populate("supervisorId", "name email")
			.sort(sort)
			.limit(parseInt(limit))
			.skip(parseInt(offset));

		const totalCount = await Conversation.countDocuments(filter);

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

// Create new conversation
router.post("/", async (req, res, next) => {
	try {
		const conversationData = {
			...req.body,
			lastMessageAt: new Date(),
		};
		const doc = await Conversation.create(conversationData);
		res.status(201).json(doc);
	} catch (e) {
		next(e);
	}
});

// Get single conversation with messages
router.get("/:id", async (req, res, next) => {
	try {
		const conversation = await Conversation.findById(req.params.id)
			.populate("agentId", "name email")
			.populate("supervisorId", "name email");

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Get recent messages
		const messages = await Message.find({ conversationId: req.params.id })
			.populate("senderId", "name email")
			.sort({ createdAt: 1 })
			.limit(100);

		res.json({ conversation, messages });
	} catch (e) {
		next(e);
	}
});

// Update conversation
router.patch("/:id", async (req, res, next) => {
	try {
		const doc = await Conversation.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		)
			.populate("agentId", "name email")
			.populate("supervisorId", "name email");

		if (!doc) {
			return res.status(404).json({ error: "Conversation not found" });
		}
		res.json(doc);
	} catch (e) {
		next(e);
	}
});

// Supervisor takeover
router.post("/:id/takeover", async (req, res, next) => {
	try {
		const { supervisorId, notes } = req.body;

		const conversation = await Conversation.findByIdAndUpdate(
			req.params.id,
			{
				isControlledBySupervisor: true,
				supervisorId,
				takeoverTimestamp: new Date(),
				takeoverNotes: notes,
			},
			{ new: true }
		).populate("supervisorId", "name email");

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Create takeover message
		const takeoverMessage = await Message.create({
			conversationId: req.params.id,
			senderType: "supervisor",
			senderId: supervisorId,
			text: notes || "Supervisor has taken control of this conversation",
			takeoverMessage: true,
			isInternal: true,
		});

		// TODO: Emit WebSocket event for real-time updates
		// io.emit('conversationTakeover', { conversationId: req.params.id, conversation });

		res.json({ conversation, takeoverMessage });
	} catch (e) {
		next(e);
	}
});

// Return conversation to AI
router.post("/:id/return-to-ai", async (req, res, next) => {
	try {
		const { notes } = req.body;

		const conversation = await Conversation.findByIdAndUpdate(
			req.params.id,
			{
				isControlledBySupervisor: false,
				$unset: { takeoverTimestamp: 1 },
			},
			{ new: true }
		);

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Create return message
		const returnMessage = await Message.create({
			conversationId: req.params.id,
			senderType: "supervisor",
			senderId: conversation.supervisorId,
			text: notes || "Conversation returned to AI agent",
			returnToAIMessage: true,
			isInternal: true,
		});

		// TODO: Emit WebSocket event
		// io.emit('conversationReturnedToAI', { conversationId: req.params.id, conversation });

		res.json({ conversation, returnMessage });
	} catch (e) {
		next(e);
	}
});

// Update conversation status
router.post("/:id/status", async (req, res, next) => {
	try {
		const { status, resolution, satisfactionScore } = req.body;

		const updateData = { status };
		if (resolution)
			updateData.metadata = { ...updateData.metadata, resolution };
		if (satisfactionScore) updateData.satisfactionScore = satisfactionScore;
		if (status === "resolved") updateData.resolvedAt = new Date();

		const conversation = await Conversation.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true }
		);

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// TODO: Emit WebSocket event
		// io.emit('conversationStatusUpdate', { conversationId: req.params.id, status });

		res.json(conversation);
	} catch (e) {
		next(e);
	}
});

// Add tags to conversation
router.post("/:id/tags", async (req, res, next) => {
	try {
		const { tags } = req.body;

		const conversation = await Conversation.findByIdAndUpdate(
			req.params.id,
			{ $addToSet: { tags: { $each: tags } } },
			{ new: true }
		);

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		res.json(conversation);
	} catch (e) {
		next(e);
	}
});

// Remove tags from conversation
router.delete("/:id/tags", async (req, res, next) => {
	try {
		const { tags } = req.body;

		const conversation = await Conversation.findByIdAndUpdate(
			req.params.id,
			{ $pullAll: { tags: tags } },
			{ new: true }
		);

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		res.json(conversation);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
