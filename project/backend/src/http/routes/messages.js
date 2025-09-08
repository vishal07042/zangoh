const express = require("express");
const Message = require("../../models/message");
const { onMessageIngest } = require("../../pipeline/ingest");

const router = express.Router();

router.get("/", async (req, res, next) => {
	try {
		const { conversationId } = req.query;
		const q = conversationId ? { conversationId } : {};
		const items = await Message.find(q).sort({ createdAt: -1 }).limit(200);
		res.json({ items });
	} catch (e) {
		next(e);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const doc = await Message.create(req.body || {});
		// Kick off metrics pipeline (fire-and-forget)
		onMessageIngest(doc).catch(() => {});
		res.status(201).json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
