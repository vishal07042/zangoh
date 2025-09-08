const path = require("path");

function loadConfig() {
	const PORT = Number(process.env.PORT || 4000);
	const MONGODB_URI =
		process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zangoh";
	const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

	return {
		PORT,
		MONGODB_URI,
		CORS_ORIGIN,
		ROOT_DIR: path.resolve(__dirname, "../../.."),
	};
}

module.exports = { loadConfig };
