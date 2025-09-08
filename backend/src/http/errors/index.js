function registerErrorHandlers(app) {
	// Not found
	app.use((req, res, next) => {
		if (req.path === "/favicon.ico") return res.status(204).end();
		res.status(404).json({ error: "Not Found" });
		next();
	});

	// Error handler
	// eslint-disable-next-line no-unused-vars
	app.use((err, _req, res, _next) => {
		console.error("Unhandled error", err);
		res.status(err.status || 500).json({
			error: err.message || "Internal Server Error",
		});
	});
}

module.exports = { registerErrorHandlers };
