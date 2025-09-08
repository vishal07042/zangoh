const express = require("express");
const Conversation = require("../../models/conversation");

const router = express.Router();

router.get("/", async (req, res, next) => {
	try {
		const items = await Conversation.find()
			.sort({ updatedAt: -1 })
			.limit(100);
		res.json({ items });
	} catch (e) {
		next(e);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const doc = await Conversation.create(req.body || {});
		res.status(201).json(doc);
	} catch (e) {
		next(e);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const doc = await Conversation.findById(req.params.id);
		if (!doc) return res.status(404).json({ error: "Not found" });
		res.json(doc);
	} catch (e) {
		next(e);
	}
});

router.patch("/:id", async (req, res, next) => {
	try {
		const doc = await Conversation.findByIdAndUpdate(
			req.params.id,
			req.body || {},
			{ new: true }
		);
		if (!doc) return res.status(404).json({ error: "Not found" });
		res.json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
