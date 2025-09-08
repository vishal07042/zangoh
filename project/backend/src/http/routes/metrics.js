const express = require("express");
const MetricSnapshot = require("../../models/metricSnapshot");

const router = express.Router();

router.get("/snapshots", async (req, res, next) => {
	try {
		const { conversationId } = req.query;
		const q = conversationId ? { conversationId } : {};
		const items = await MetricSnapshot.find(q)
			.sort({ createdAt: -1 })
			.limit(100);
		res.json({ items });
	} catch (e) {
		next(e);
	}
});

module.exports = router;
