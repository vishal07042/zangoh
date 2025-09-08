const express = require("express");
const http = require("http");
const cors = require("cors");
const { json } = require("express");

const { loadConfig } = require("./src/config");
const { connectMongo } = require("./src/db/mongo");
const { registerRoutes } = require("./src/http/routes");
const { registerErrorHandlers } = require("./src/http/errors");
const { createWebsocketServer } = require("./src/realtime/ws");
const { setIO } = require("./src/pipeline/ingest");

async function bootstrap() {
	const cfg = loadConfig();
	await connectMongo(cfg);

	const app = express();
	app.use(cors({ origin: cfg.CORS_ORIGIN || "*", credentials: true }));
	app.use(json({ limit: "2mb" }));

	app.get("/health", (_req, res) => {
		res.json({ status: "ok" });
	});

	registerRoutes(app);
	registerErrorHandlers(app);

	const server = http.createServer(app);
	const io = createWebsocketServer(server, cfg);
	setIO(io);

	server.listen(cfg.PORT, () => {
		console.log(`API listening on :${cfg.PORT}`);
	});

	return { app, server, io };
}

// Start only when executed directly
if (require.main === module) {
	bootstrap().catch((err) => {
		console.error("Fatal startup error", err);
		process.exit(1);
	});
}

module.exports = { bootstrap };
