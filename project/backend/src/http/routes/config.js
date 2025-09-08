const express = require("express");
const Config = require("../../models/config");

const router = express.Router();

router.get("/", async (_req, res, next) => {
	try {
		const items = await Config.find().sort({ key: 1 });
		res.json({ items });
	} catch (e) {
		next(e);
	}
});

router.put("/:key", async (req, res, next) => {
	try {
		const doc = await Config.findOneAndUpdate(
			{ key: req.params.key },
			{ key: req.params.key, value: req.body?.value },
			{ upsert: true, new: true }
		);
		res.json(doc);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
