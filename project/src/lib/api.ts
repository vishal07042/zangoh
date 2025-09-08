import axios from "axios";
import { io, Socket } from "socket.io-client";

// Backend URL configuration
export const API_BASE_URL = "http://localhost:3000";
export const WEBSOCKET_URL = "http://localhost:3000";

// Create axios instance with default config
export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 10000,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
	(config) => {
		console.log(
			`API Request: ${config.method?.toUpperCase()} ${config.url}`
		);
		return config;
	},
	(error) => {
		console.error("API Request Error:", error);
		return Promise.reject(error);
	}
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		console.error(
			"API Response Error:",
			error.response?.data || error.message
		);
		return Promise.reject(error);
	}
);

// Socket.IO client instance
let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
	if (!socketInstance) {
		socketInstance = io(WEBSOCKET_URL, {
			autoConnect: false,
		});
	}
	return socketInstance;
};

export const connectSocket = (): Promise<Socket> => {
	const socket = getSocket();

	return new Promise((resolve, reject) => {
		socket.connect();

		socket.on("connect", () => {
			console.log("Socket connected:", socket.id);
			resolve(socket);
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
			reject(error);
		});
	});
};

export const disconnectSocket = (): void => {
	if (socketInstance) {
		socketInstance.disconnect();
		socketInstance = null;
	}
};

// API endpoints
export const API_ENDPOINTS = {
	// Conversations
	conversations: "/api/conversations",
	conversation: (id: string) => `/api/conversations/${id}`,
	conversationMessages: (id: string) => `/api/conversations/${id}/messages`,

	// Messages
	messages: "/api/messages",
	message: (id: string) => `/api/messages/${id}`,

	// Templates
	templates: "/api/templates",
	template: (id: string) => `/api/templates/${id}`,
	templatePreview: (id: string) => `/api/templates/${id}/preview`,
	templateCategories: "/api/templates/meta/categories",
	popularTemplates: "/api/templates/popular/trending",
	searchTemplates: "/api/templates/search/keywords",

	// Alerts
	alerts: "/api/alerts",
	alert: (id: string) => `/api/alerts/${id}`,

	// Metrics
	metrics: "/api/metrics",
	metricsSnapshot: "/api/metrics/snapshot",
	metricsStream: "/api/metrics/stream",

	// Agent Config
	agentConfig: "/api/agent-config",
	agentConfigHistory: "/api/agent-config/history",

	// Config
	config: "/api/config",

	// Health check
	health: "/health",
};

// API helper functions
export const api = {
	// Conversations
	getConversations: async (params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.conversations, {
			params,
		});
		return response.data;
	},

	getConversation: async (id: string) => {
		const response = await apiClient.get(API_ENDPOINTS.conversation(id));
		return response.data;
	},

	createConversation: async (data: any) => {
		const response = await apiClient.post(
			API_ENDPOINTS.conversations,
			data
		);
		return response.data;
	},

	updateConversation: async (id: string, data: any) => {
		const response = await apiClient.patch(
			API_ENDPOINTS.conversation(id),
			data
		);
		return response.data;
	},

	// Messages
	getMessages: async (conversationId: string, params?: any) => {
		const response = await apiClient.get(
			API_ENDPOINTS.conversationMessages(conversationId),
			{ params }
		);
		return response.data;
	},

	sendMessage: async (data: any) => {
		const response = await apiClient.post(API_ENDPOINTS.messages, data);
		return response.data;
	},

	// Templates
	getTemplates: async (params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.templates, {
			params,
		});
		return response.data;
	},

	getTemplate: async (id: string) => {
		const response = await apiClient.get(API_ENDPOINTS.template(id));
		return response.data;
	},

	createTemplate: async (data: any) => {
		const response = await apiClient.post(API_ENDPOINTS.templates, data);
		return response.data;
	},

	updateTemplate: async (id: string, data: any) => {
		const response = await apiClient.patch(
			API_ENDPOINTS.template(id),
			data
		);
		return response.data;
	},

	deleteTemplate: async (id: string) => {
		const response = await apiClient.delete(API_ENDPOINTS.template(id));
		return response.data;
	},

	previewTemplate: async (id: string, variables: any) => {
		const response = await apiClient.post(
			API_ENDPOINTS.templatePreview(id),
			{ variables }
		);
		return response.data;
	},

	getTemplateCategories: async () => {
		const response = await apiClient.get(API_ENDPOINTS.templateCategories);
		return response.data;
	},

	getPopularTemplates: async (params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.popularTemplates, {
			params,
		});
		return response.data;
	},

	searchTemplates: async (keywords: string, params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.searchTemplates, {
			params: { keywords, ...params },
		});
		return response.data;
	},

	// Alerts
	getAlerts: async (params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.alerts, { params });
		return response.data;
	},

	createAlert: async (data: any) => {
		const response = await apiClient.post(API_ENDPOINTS.alerts, data);
		return response.data;
	},

	dismissAlert: async (id: string) => {
		const response = await apiClient.delete(API_ENDPOINTS.alert(id));
		return response.data;
	},

	// Metrics
	getMetrics: async (params?: any) => {
		const response = await apiClient.get(API_ENDPOINTS.metrics, { params });
		return response.data;
	},

	getMetricsSnapshot: async () => {
		const response = await apiClient.get(API_ENDPOINTS.metricsSnapshot);
		return response.data;
	},

	// Agent Config
	getAgentConfig: async () => {
		const response = await apiClient.get(API_ENDPOINTS.agentConfig);
		return response.data;
	},

	updateAgentConfig: async (data: any) => {
		const response = await apiClient.patch(API_ENDPOINTS.agentConfig, data);
		return response.data;
	},

	// Health check
	healthCheck: async () => {
		const response = await apiClient.get(API_ENDPOINTS.health);
		return response.data;
	},
};

// SSE (Server-Sent Events) helper for real-time metrics
export const createSSEConnection = (
	endpoint: string,
	onMessage: (data: any) => void,
	onError?: (error: Event) => void
): EventSource => {
	const eventSource = new EventSource(`${API_BASE_URL}${endpoint}`);

	eventSource.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			onMessage(data);
		} catch (error) {
			console.error("Error parsing SSE data:", error);
		}
	};

	eventSource.onerror = (error) => {
		console.error("SSE connection error:", error);
		if (onError) {
			onError(error);
		}
	};

	return eventSource;
};
