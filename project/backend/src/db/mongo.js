const mongoose = require("mongoose");

async function connectMongo(cfg) {
	const uri = cfg.MONGODB_URI;
	mongoose.set("strictQuery", true);
	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 5000,
	});
	return mongoose.connection;
}

module.exports = { connectMongo };
