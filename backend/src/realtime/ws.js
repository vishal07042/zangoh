const { Server } = require("socket.io");
const { handleRealtimeEvents } = require("./events");

function createWebsocketServer(server, cfg) {
	const io = new Server(server, {
		cors: {
			origin: cfg.CORS_ORIGIN || "*",
			credentials: true,
		},
		transports: ["websocket", "polling"],
	});

	// Store connected users and their roles
	const connectedUsers = new Map();
	const supervisors = new Set();

	io.on("connection", (socket) => {
		console.log(`Socket connected: ${socket.id}`);

		// Authentication and user registration
		socket.on("authenticate", (data) => {
			const { userId, userRole, userName } = data;

			connectedUsers.set(socket.id, {
				userId,
				userRole,
				userName,
				connectedAt: new Date(),
			});

			if (userRole === "supervisor" || userRole === "admin") {
				supervisors.add(socket.id);
				socket.join("supervisors");
			}

			socket.emit("authenticated", {
				success: true,
				userRole,
				connectedUsers: connectedUsers.size,
			});

			console.log(`User authenticated: ${userName} (${userRole})`);
		});

		// Room management for conversations and alerts
		socket.on("subscribe", (room) => {
			if (
				typeof room === "string" &&
				room.match(/^(conversation|alert|dashboard)_/)
			) {
				socket.join(room);
				socket.emit("subscribed", { room });
				console.log(`Socket ${socket.id} joined room: ${room}`);
			}
		});

		socket.on("unsubscribe", (room) => {
			if (typeof room === "string") {
				socket.leave(room);
				socket.emit("unsubscribed", { room });
				console.log(`Socket ${socket.id} left room: ${room}`);
			}
		});

		// Supervisor-specific events
		socket.on("supervisor_takeover", (data) => {
			const user = connectedUsers.get(socket.id);
			if (
				user &&
				(user.userRole === "supervisor" || user.userRole === "admin")
			) {
				// Broadcast takeover to conversation room
				io.to(`conversation_${data.conversationId}`).emit(
					"conversation_takeover",
					{
						conversationId: data.conversationId,
						supervisor: {
							id: user.userId,
							name: user.userName,
						},
						timestamp: new Date(),
					}
				);
			}
		});

		socket.on("supervisor_return_to_ai", (data) => {
			const user = connectedUsers.get(socket.id);
			if (
				user &&
				(user.userRole === "supervisor" || user.userRole === "admin")
			) {
				// Broadcast return to AI to conversation room
				io.to(`conversation_${data.conversationId}`).emit(
					"conversation_returned_to_ai",
					{
						conversationId: data.conversationId,
						supervisor: {
							id: user.userId,
							name: user.userName,
						},
						notes: data.notes,
						timestamp: new Date(),
					}
				);
			}
		});

		// Real-time typing indicators
		socket.on("typing_start", (data) => {
			const user = connectedUsers.get(socket.id);
			if (user) {
				socket
					.to(`conversation_${data.conversationId}`)
					.emit("user_typing", {
						conversationId: data.conversationId,
						user: {
							id: user.userId,
							name: user.userName,
							role: user.userRole,
						},
					});
			}
		});

		socket.on("typing_stop", (data) => {
			const user = connectedUsers.get(socket.id);
			if (user) {
				socket
					.to(`conversation_${data.conversationId}`)
					.emit("user_stopped_typing", {
						conversationId: data.conversationId,
						user: {
							id: user.userId,
							name: user.userName,
							role: user.userRole,
						},
					});
			}
		});

		// Handle custom events for real-time features
		handleRealtimeEvents(socket, io, connectedUsers);

		// Disconnect handling
		socket.on("disconnect", () => {
			const user = connectedUsers.get(socket.id);
			if (user) {
				console.log(
					`User disconnected: ${user.userName} (${user.userRole})`
				);
			}

			connectedUsers.delete(socket.id);
			supervisors.delete(socket.id);
			console.log(`Socket disconnected: ${socket.id}`);
		});
	});

	// Add methods to broadcast events
	io.broadcastNewMessage = (conversationId, message) => {
		io.to(`conversation_${conversationId}`).emit("new_message", {
			conversationId,
			message,
			timestamp: new Date(),
		});
	};

	io.broadcastNewAlert = (alert) => {
		io.to("supervisors").emit("new_alert", {
			alert,
			timestamp: new Date(),
		});

		// Also broadcast to dashboard listeners
		io.to("dashboard_alerts").emit("alert_update", {
			alert,
			action: "created",
			timestamp: new Date(),
		});
	};

	io.broadcastConversationUpdate = (conversationId, update) => {
		io.to(`conversation_${conversationId}`).emit("conversation_update", {
			conversationId,
			update,
			timestamp: new Date(),
		});

		// Also broadcast to dashboard
		io.to("dashboard_conversations").emit("conversation_update", {
			conversationId,
			update,
			timestamp: new Date(),
		});
	};

	io.broadcastMetricsUpdate = (metrics) => {
		io.to("dashboard_metrics").emit("metrics_update", {
			metrics,
			timestamp: new Date(),
		});
	};

	io.broadcastAlertDismissed = (alertId) => {
		io.to("supervisors").emit("alert_dismissed", {
			alertId,
			timestamp: new Date(),
		});

		io.to("dashboard_alerts").emit("alert_update", {
			alertId,
			action: "dismissed",
			timestamp: new Date(),
		});
	};

	// Periodic metrics broadcast (every 30 seconds)
	setInterval(() => {
		io.to("dashboard_metrics").emit("connected_users_count", {
			count: connectedUsers.size,
			supervisors: supervisors.size,
			timestamp: new Date(),
		});
	}, 30000);

	return io;
}

module.exports = { createWebsocketServer };
