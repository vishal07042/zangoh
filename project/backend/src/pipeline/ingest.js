const MetricSnapshot = require("../models/metricSnapshot");
const Alert = require("../models/alert");
const {
	computeWindowMetrics,
	persistSnapshot,
} = require("../services/metrics/engine");
const { detectAnomalies } = require("../services/anomaly/detector");

let ioRef = null;
function setIO(io) {
	ioRef = io;
}

async function onMessageIngest(messageDoc) {
	const conversationId = messageDoc.conversationId;
	const snapshot = await computeWindowMetrics(conversationId);
	const saved = await persistSnapshot(conversationId, snapshot);
	if (!saved) return;

	// Load short history to detect anomalies
	const history = await MetricSnapshot.find({ conversationId })
		.sort({ createdAt: 1 })
		.limit(50);
	const anomalies = detectAnomalies(history, saved.toObject());
	if (anomalies.length) {
		const alerts = await Alert.insertMany(
			anomalies.map((a) => ({
				level: a === "latency_spike" ? "critical" : "warning",
				type: a,
				message: a.replace("_", " "),
				conversationId,
			}))
		);
		if (ioRef) {
			alerts.forEach((a) =>
				ioRef.to(String(conversationId)).emit("alert.raised", a)
			);
		}
	}

	if (ioRef) {
		ioRef.to(String(conversationId)).emit("metrics.snapshot", saved);
		ioRef.emit("message.created", messageDoc);
	}
}

module.exports = { onMessageIngest, setIO };
