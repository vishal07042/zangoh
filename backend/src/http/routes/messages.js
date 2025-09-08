const express = require("express");
const Message = require("../../models/message");
const Conversation = require("../../models/conversation");
const Template = require("../../models/template");
const { onMessageIngest } = require("../../pipeline/ingest");

const router = express.Router();

// Get messages with filtering and pagination
router.get("/", async (req, res, next) => {
	try {
		const {
			conversationId,
			senderType,
			limit = 200,
			offset = 0,
			includeInternal = false,
		} = req.query;

		const filter = {};
		if (conversationId) filter.conversationId = conversationId;
		if (senderType) filter.senderType = senderType;
		if (includeInternal === "false") filter.isInternal = { $ne: true };

		const items = await Message.find(filter)
			.populate("senderId", "name email")
			.populate("templateId", "name category")
			.sort({ createdAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset));

		res.json({ items });
	} catch (e) {
		next(e);
	}
});

// Send new message
router.post("/", async (req, res, next) => {
	try {
		const {
			conversationId,
			senderType,
			senderId,
			senderName,
			text,
			templateId,
			isInternal = false,
			metadata = {},
		} = req.body;

		// Validate conversation exists
		const conversation = await Conversation.findById(conversationId);
		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Calculate response time if this is a response to a customer message
		let responseTime;
		if (senderType === "ai" || senderType === "supervisor") {
			const lastCustomerMessage = await Message.findOne({
				conversationId,
				senderType: "customer",
			}).sort({ createdAt: -1 });

			if (lastCustomerMessage) {
				responseTime =
					Date.now() - lastCustomerMessage.createdAt.getTime();
			}
		}

		// Create message
		const messageData = {
			conversationId,
			senderType,
			senderId,
			senderName,
			text,
			templateId,
			isInternal,
			responseTime,
			metadata,
		};

		const doc = await Message.create(messageData);

		// Update conversation metrics
		const updateData = {
			lastMessageAt: new Date(),
			$inc: { messageCount: 1 },
		};

		if (responseTime) {
			updateData.$inc.totalResponseTime = responseTime;
			updateData.averageResponseTime =
				(conversation.totalResponseTime + responseTime) /
				conversation.messageCount;
		}

		await Conversation.findByIdAndUpdate(conversationId, updateData);

		// Populate the response
		const populatedDoc = await Message.findById(doc._id)
			.populate("senderId", "name email")
			.populate("templateId", "name category");

		// Kick off metrics pipeline (fire-and-forget)
		onMessageIngest(populatedDoc).catch(() => {});

		// TODO: Emit WebSocket event
		// io.emit('newMessage', { conversationId, message: populatedDoc });

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Send supervisor message
router.post("/supervisor", async (req, res, next) => {
	try {
		const {
			conversationId,
			supervisorId,
			supervisorName,
			text,
			templateId,
			isInternal = false,
		} = req.body;

		// Validate conversation and supervisor control
		const conversation = await Conversation.findById(conversationId);
		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		if (!conversation.isControlledBySupervisor && !isInternal) {
			return res.status(403).json({
				error: "Supervisor must take control before sending public messages",
			});
		}

		const messageData = {
			conversationId,
			senderType: "supervisor",
			senderId: supervisorId,
			senderName: supervisorName,
			text,
			templateId,
			isInternal,
		};

		const doc = await Message.create(messageData);

		// Update conversation
		await Conversation.findByIdAndUpdate(conversationId, {
			lastMessageAt: new Date(),
			$inc: { messageCount: 1 },
		});

		const populatedDoc = await Message.findById(doc._id)
			.populate("senderId", "name email")
			.populate("templateId", "name category");

		// TODO: Emit WebSocket event
		// io.emit('supervisorMessage', { conversationId, message: populatedDoc });

		res.status(201).json(populatedDoc);
	} catch (e) {
		next(e);
	}
});

// Apply template to message
router.post("/apply-template", async (req, res, next) => {
	try {
		const { templateId, variables = {} } = req.body;

		const template = await Template.findById(templateId);
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

		// Update template usage statistics
		await Template.findByIdAndUpdate(templateId, {
			$inc: { usageCount: 1 },
			lastUsedAt: new Date(),
		});

		res.json({
			template: {
				id: template._id,
				name: template.name,
				category: template.category,
			},
			processedContent,
			variables: template.variables,
		});
	} catch (e) {
		next(e);
	}
});

// Get conversation message history with analytics
router.get("/conversation/:conversationId/history", async (req, res, next) => {
	try {
		const { conversationId } = req.params;
		const { includeInternal = true, includeAnalytics = false } = req.query;

		const filter = { conversationId };
		if (includeInternal === "false") {
			filter.isInternal = { $ne: true };
		}

		const messages = await Message.find(filter)
			.populate("senderId", "name email")
			.populate("templateId", "name category")
			.sort({ createdAt: 1 });

		let analytics = {};
		if (includeAnalytics === "true") {
			const totalMessages = messages.length;
			const aiMessages = messages.filter(
				(m) => m.senderType === "ai"
			).length;
			const supervisorMessages = messages.filter(
				(m) => m.senderType === "supervisor"
			).length;
			const customerMessages = messages.filter(
				(m) => m.senderType === "customer"
			).length;

			const responseTimes = messages
				.filter((m) => m.responseTime && m.responseTime > 0)
				.map((m) => m.responseTime);

			analytics = {
				totalMessages,
				aiMessages,
				supervisorMessages,
				customerMessages,
				averageResponseTime:
					responseTimes.length > 0
						? responseTimes.reduce((a, b) => a + b, 0) /
						  responseTimes.length
						: 0,
				minResponseTime:
					responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
				maxResponseTime:
					responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
			};
		}

		res.json({ messages, analytics });
	} catch (e) {
		next(e);
	}
});

// Update message (for corrections or metadata)
router.patch("/:id", async (req, res, next) => {
	try {
		const allowedUpdates = ["metadata", "toxicity", "polarity", "entities"];
		const updates = {};

		Object.keys(req.body).forEach((key) => {
			if (allowedUpdates.includes(key)) {
				updates[key] = req.body[key];
			}
		});

		const doc = await Message.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		})
			.populate("senderId", "name email")
			.populate("templateId", "name category");

		if (!doc) {
			return res.status(404).json({ error: "Message not found" });
		}

		res.json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
