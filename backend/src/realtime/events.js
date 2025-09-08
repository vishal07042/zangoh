const Events = {
	ConversationUpdated: "conversation.updated",
	MessageCreated: "message.created",
	MetricsSnapshot: "metrics.snapshot",
	AlertRaised: "alert.raised",
	ConfigUpdated: "config.updated",
	SupervisorTakeover: "supervisor.takeover",
	SupervisorReturnToAI: "supervisor.return_to_ai",
	ConversationStatusChanged: "conversation.status_changed",
	AlertDismissed: "alert.dismissed",
	AlertAcknowledged: "alert.acknowledged",
	MetricsUpdated: "metrics.updated",
	AgentConfigUpdated: "agent_config.updated",
};

/**
 * Handle custom real-time events for the AI Agent Supervisor Workstation
 * @param {Socket} socket - The socket.io socket instance
 * @param {Server} io - The socket.io server instance
 * @param {Map} connectedUsers - Map of connected users
 */
function handleRealtimeEvents(socket, io, connectedUsers) {
	// Dashboard subscription events
	socket.on("subscribe_dashboard", (data) => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			socket.join("dashboard_metrics");
			socket.join("dashboard_conversations");
			socket.join("dashboard_alerts");

			socket.emit("dashboard_subscribed", {
				success: true,
				subscriptions: ["metrics", "conversations", "alerts"],
			});
		}
	});

	// Conversation-specific events
	socket.on("subscribe_conversation", (data) => {
		const { conversationId } = data;
		if (conversationId) {
			socket.join(`conversation_${conversationId}`);
			socket.emit("conversation_subscribed", { conversationId });
		}
	});

	socket.on("unsubscribe_conversation", (data) => {
		const { conversationId } = data;
		if (conversationId) {
			socket.leave(`conversation_${conversationId}`);
			socket.emit("conversation_unsubscribed", { conversationId });
		}
	});

	// Alert management events
	socket.on("subscribe_alerts", () => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			socket.join("alerts_global");
			socket.emit("alerts_subscribed", { success: true });
		}
	});

	// Agent performance monitoring
	socket.on("subscribe_agent_performance", (data) => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			socket.join("agent_performance");
			socket.emit("agent_performance_subscribed", { success: true });
		}
	});

	// Request current metrics (for dashboard initialization)
	socket.on("request_current_metrics", async (data) => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			// This would typically fetch current metrics from database
			// For now, we'll emit mock data
			socket.emit("current_metrics", {
				conversations: {
					active: 421,
					resolved: 156,
					escalated: 23,
					total: 600,
				},
				responseTime: {
					average: 84, // seconds
					target: 30,
				},
				csat: {
					score: 7.9,
					target: 8.0,
				},
				escalationRate: {
					percentage: 46,
					target: 30,
				},
				timestamp: new Date(),
			});
		}
	});

	// Heartbeat for connection monitoring
	socket.on("heartbeat", () => {
		socket.emit("heartbeat_ack", { timestamp: new Date() });
	});

	// Custom event handlers for business logic
	socket.on("supervisor_action", (data) => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			const { action, conversationId, payload } = data;

			switch (action) {
				case "view_conversation":
					// Track supervisor viewing conversation
					io.to(`conversation_${conversationId}`).emit(
						"supervisor_viewing",
						{
							conversationId,
							supervisor: {
								id: user.userId,
								name: user.userName,
							},
							timestamp: new Date(),
						}
					);
					break;

				case "escalate_conversation":
					// Broadcast escalation to all supervisors
					io.to("supervisors").emit("conversation_escalated", {
						conversationId,
						escalatedBy: {
							id: user.userId,
							name: user.userName,
						},
						reason: payload?.reason,
						timestamp: new Date(),
					});
					break;

				case "resolve_conversation":
					// Broadcast resolution
					io.to(`conversation_${conversationId}`).emit(
						"conversation_resolved",
						{
							conversationId,
							resolvedBy: {
								id: user.userId,
								name: user.userName,
							},
							resolution: payload?.resolution,
							satisfactionScore: payload?.satisfactionScore,
							timestamp: new Date(),
						}
					);
					break;
			}
		}
	});

	// Template usage tracking
	socket.on("template_used", (data) => {
		const user = connectedUsers.get(socket.id);
		if (user) {
			const { templateId, conversationId, success } = data;

			// Broadcast template usage for analytics
			io.to("dashboard_metrics").emit("template_usage", {
				templateId,
				conversationId,
				usedBy: {
					id: user.userId,
					name: user.userName,
					role: user.userRole,
				},
				success,
				timestamp: new Date(),
			});
		}
	});

	// Configuration updates
	socket.on("agent_config_updated", (data) => {
		const user = connectedUsers.get(socket.id);
		if (
			user &&
			(user.userRole === "supervisor" || user.userRole === "admin")
		) {
			// Broadcast config update to all supervisors
			io.to("supervisors").emit("agent_config_changed", {
				configId: data.configId,
				changes: data.changes,
				updatedBy: {
					id: user.userId,
					name: user.userName,
				},
				timestamp: new Date(),
			});
		}
	});
}

/**
 * Emit events from server-side operations
 */
function emitEvent(io, event, data) {
	switch (event) {
		case Events.ConversationUpdated:
			io.broadcastConversationUpdate(data.conversationId, data.update);
			break;

		case Events.MessageCreated:
			io.broadcastNewMessage(data.conversationId, data.message);
			break;

		case Events.AlertRaised:
			io.broadcastNewAlert(data.alert);
			break;

		case Events.AlertDismissed:
			io.broadcastAlertDismissed(data.alertId);
			break;

		case Events.MetricsUpdated:
			io.broadcastMetricsUpdate(data.metrics);
			break;

		default:
			console.warn(`Unknown event type: ${event}`);
	}
}

module.exports = { Events, handleRealtimeEvents, emitEvent };
