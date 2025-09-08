const { Server } = require("socket.io");

function createWebsocketServer(server, cfg) {
	const io = new Server(server, {
		cors: {
			origin: cfg.CORS_ORIGIN || "*",
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		// Basic rooms for conversations and alerts
		socket.on("subscribe", (room) => {
			if (typeof room === "string") socket.join(room);
		});
		socket.on("unsubscribe", (room) => {
			if (typeof room === "string") socket.leave(room);
		});
	});

	return io;
}

module.exports = { createWebsocketServer };
