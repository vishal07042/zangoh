const express = require("express");
const Alert = require("../../models/alert");

const router = express.Router();

router.get("/", async (req, res, next) => {
	try {
		const { conversationId } = req.query;
		const q = conversationId ? { conversationId } : {};
		const items = await Alert.find(q).sort({ createdAt: -1 }).limit(200);
		res.json({ items });
	} catch (e) {
		next(e);
	}
});

router.patch("/:id/ack", async (req, res, next) => {
	try {
		const doc = await Alert.findByIdAndUpdate(
			req.params.id,
			{ acknowledged: true },
			{ new: true }
		);
		if (!doc) return res.status(404).json({ error: "Not found" });
		res.json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
