const express = require("express");
const conversations = require("./conversations");
const messages = require("./messages");
const metrics = require("./metrics");
const alerts = require("./alerts");
const config = require("./config");
const agentConfig = require("./agentConfig");
const templates = require("./templates");

function registerRoutes(app) {
	const router = express.Router();

	router.get("/v1", (_req, res) => {
		res.json({ api: "v1" });
	});

	router.use("/v1/conversations", conversations);
	router.use("/v1/messages", messages);
	router.use("/v1/metrics", metrics);
	router.use("/v1/alerts", alerts);
	router.use("/v1/config", config);
	router.use("/v1/agent-config", agentConfig);
	router.use("/v1/templates", templates);

	app.use("/api", router);
}

module.exports = { registerRoutes };
