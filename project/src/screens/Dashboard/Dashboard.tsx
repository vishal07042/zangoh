import {
	ArrowUpIcon,
	ArrowUpRightIcon,
	BriefcaseIcon,
	HomeIcon,
	MessageSquareIcon,
	Settings2Icon,
	SettingsIcon,
	ZapIcon,
	AlertTriangle,
	Filter,
	Search,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ConversationModal } from "../../components/ConversationModal";
import { AgentConfigModal } from "../../components/AgentConfigModal";
import { AlertsPanel } from "../../components/AlertsPanel";
import { createSSEConnection } from "../../lib/api";

const navigationItems = [
	{ icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
	{ icon: MessageSquareIcon, label: "Conversations", path: "/conversations" },
	{ icon: BriefcaseIcon, label: "AI Agents", path: "/agents" },
	{ icon: ZapIcon, label: "Templates", path: "/templates" },
];

const chartData = [
	{ height: "h-[80px]", color: "bg-primary-200" },
	{ height: "h-[120px]", color: "bg-primary-400" },
	{ height: "h-[100px]", color: "bg-primary-600" },
	{ height: "h-[140px]", color: "bg-primary-800" },
];

const conversationTabs = [
	{ id: "all", label: "All Conversations", active: true },
	{ id: "attention", label: "Needs Attention", hasIndicator: true },
	{ id: "performance", label: "Agent Performance", active: false },
];

const conversationData = [
	{
		id: "conv-1",
		name: "Jim Halpert",
		avatar: "/ellipse-1.png",
		message:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		status: "Active",
		statusColor: "bg-[#ffc8c8] border-[#ba3a3a]",
		time: "11:02 AM",
		isControlledBySupervisor: false,
		messages: [
			{
				id: "1",
				sender: "customer",
				content: "Hi, I'm having trouble with my order",
				timestamp: "11:00 AM",
			},
			{
				id: "2",
				sender: "ai",
				content:
					"I'd be happy to help you with your order. Can you provide your order number?",
				timestamp: "11:01 AM",
			},
			{
				id: "3",
				sender: "customer",
				content: "It's #12345",
				timestamp: "11:02 AM",
			},
		],
	},
	{
		id: "conv-2",
		name: "Pam Beesly",
		avatar: "/ellipse-1.png",
		message:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		status: "Waiting",
		statusColor: "bg-[#fff4c8] border-[#ffc700]",
		time: "10:49 AM",
		isControlledBySupervisor: true,
		messages: [
			{
				id: "1",
				sender: "customer",
				content: "I need a refund for my purchase",
				timestamp: "10:45 AM",
			},
			{
				id: "2",
				sender: "ai",
				content:
					"I understand you'd like a refund. Let me check your account.",
				timestamp: "10:46 AM",
			},
			{
				id: "3",
				sender: "supervisor",
				content:
					"I've taken over this conversation. Let me help you with the refund process.",
				timestamp: "10:49 AM",
			},
		],
	},
	{
		id: "conv-3",
		name: "Micheal Scott",
		avatar: "/ellipse-1.png",
		message:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		status: "Resolved",
		statusColor: "bg-[#daffc8] border-[#3bb300]",
		time: "10:12 AM",
		isControlledBySupervisor: false,
		messages: [
			{
				id: "1",
				sender: "customer",
				content: "Thank you for your help!",
				timestamp: "10:10 AM",
			},
			{
				id: "2",
				sender: "ai",
				content:
					"You're welcome! Is there anything else I can help you with?",
				timestamp: "10:11 AM",
			},
			{
				id: "3",
				sender: "customer",
				content: "No, that's all. Thanks again!",
				timestamp: "10:12 AM",
			},
		],
	},
	{
		id: "conv-4",
		name: "Andy Bernard",
		avatar: "/ellipse-1.png",
		message:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		status: "Escalated",
		statusColor: "bg-[#c8ecff] border-[#006d94]",
		time: "9:54 AM",
		isControlledBySupervisor: false,
		messages: [
			{
				id: "1",
				sender: "customer",
				content: "This is unacceptable! I want to speak to a manager!",
				timestamp: "9:50 AM",
			},
			{
				id: "2",
				sender: "ai",
				content:
					"I understand your frustration. Let me escalate this to a supervisor.",
				timestamp: "9:54 AM",
			},
		],
	},
];

const mockAlerts = [
	{
		id: "alert-1",
		type: "escalation" as const,
		title: "High Priority Escalation",
		description:
			"Customer requesting manager after multiple failed attempts",
		conversationId: "conv-4",
		customerName: "Andy Bernard",
		timestamp: "2 min ago",
		severity: "high" as const,
	},
	{
		id: "alert-2",
		type: "timeout" as const,
		title: "Response Timeout",
		description: "AI agent hasn't responded in 5 minutes",
		conversationId: "conv-1",
		customerName: "Jim Halpert",
		timestamp: "5 min ago",
		severity: "medium" as const,
	},
	{
		id: "alert-3",
		type: "satisfaction" as const,
		title: "Low Satisfaction Score",
		description: "Customer rated interaction as 2/5 stars",
		conversationId: "conv-2",
		customerName: "Pam Beesly",
		timestamp: "10 min ago",
		severity: "low" as const,
	},
];

const defaultAgentConfig = {
	temperature: 0.7,
	maxTokens: 1000,
	responseTime: 10,
	escalationThreshold: 70,
	capabilities: {
		refunds: true,
		technicalSupport: true,
		billing: true,
		generalInquiry: true,
	},
	customInstructions:
		"Always be polite and helpful. Escalate complex issues to human supervisors.",
};

const configPresets = [
	{
		id: "1",
		name: "Conservative",
		config: {
			...defaultAgentConfig,
			temperature: 0.3,
			escalationThreshold: 80,
		},
	},
	{ id: "2", name: "Balanced", config: defaultAgentConfig },
	{
		id: "3",
		name: "Creative",
		config: {
			...defaultAgentConfig,
			temperature: 1.2,
			escalationThreshold: 60,
		},
	},
];

export const Dashboard = (): JSX.Element => {
	const location = useLocation();
	const [selectedConversation, setSelectedConversation] = useState<any>(null);
	const [isConversationModalOpen, setIsConversationModalOpen] =
		useState(false);
	const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
	const [agentConfig, setAgentConfig] = useState(defaultAgentConfig);
	const [alerts, setAlerts] = useState(mockAlerts);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
	const sseRef = useRef<EventSource | null>(null);

	const handleViewConversation = (conversationId: string) => {
		const conversation = conversationData.find(
			(c) => c.id === conversationId
		);
		if (conversation) {
			setSelectedConversation(conversation);
			setIsConversationModalOpen(true);
		}
	};

	const handleTakeOver = (conversationId: string) => {
		console.log("Taking over conversation:", conversationId);
		// Update conversation control status
	};

	const handleReturnToAI = (conversationId: string, notes: string) => {
		console.log("Returning to AI:", conversationId, notes);
		// Update conversation control status
	};

	const handleSendMessage = (conversationId: string, message: string) => {
		console.log("Sending message:", conversationId, message);
		// Add message to conversation
	};

	const handleSaveConfig = (config: any) => {
		setAgentConfig(config);
		console.log("Saving agent config:", config);
	};

	const handleSavePreset = (name: string, config: any) => {
		console.log("Saving preset:", name, config);
	};

	const handleLoadPreset = (preset: any) => {
		setAgentConfig(preset.config);
	};

	const handleDismissAlert = (alertId: string) => {
		setAlerts(alerts.filter((alert) => alert.id !== alertId));
	};

	const filteredConversations = conversationData.filter((conversation) => {
		const matchesSearch =
			conversation.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			conversation.message
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === "all" ||
			conversation.status.toLowerCase() === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Setup SSE connection for real-time metrics
	useEffect(() => {
		const setupSSE = () => {
			if (sseRef.current) {
				sseRef.current.close();
			}

			sseRef.current = createSSEConnection(
				"/api/metrics/stream",
				(data) => {
					console.log("Received SSE data:", data);
					setRealTimeMetrics({
						csat: {
							value: data.csat.value,
							trend: data.csat.metadata.trend,
							change: data.csat.metadata.change,
						},
						avgResponseTime: {
							value: data.avgResponseTime.value,
							trend: data.avgResponseTime.metadata.trend,
							change: `${
								data.avgResponseTime.metadata.change > 0
									? "+"
									: ""
							}${data.avgResponseTime.metadata.change}s`,
							formatted: data.avgResponseTime.metadata.formatted,
						},
						activeConversations: {
							value: data.activeConversations.value,
							trend: data.activeConversations.metadata.trend,
							change: `${
								data.activeConversations.metadata.change > 0
									? "+"
									: ""
							}${data.activeConversations.metadata.change}`,
						},
						escalationRate: {
							value: data.escalationRate.value,
							trend: data.escalationRate.metadata.trend,
							change: `${data.escalationRate.metadata.change}%`,
						},
					});
				},
				(error) => {
					console.error("SSE connection error:", error);
					// Retry connection after 5 seconds
					setTimeout(setupSSE, 5000);
				}
			);
		};

		// Setup SSE connection
		setupSSE();

		// Cleanup on unmount
		return () => {
			if (sseRef.current) {
				sseRef.current.close();
				sseRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			// Simulate SSE updates for alerts
			const newAlerts = [...mockAlerts];
			const randomIndex = Math.floor(Math.random() * newAlerts.length);
			const randomAlert = newAlerts[randomIndex];
			randomAlert.timestamp = `${
				Math.floor(Math.random() * 10) + 1
			} min ago`;
			randomAlert.severity = ["low", "medium", "high"][
				Math.floor(Math.random() * 3)
			] as "low" | "medium" | "high";
			setAlerts(newAlerts);
		}, 2000); // Simulate every 2 seconds
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='bg-[#ecebf1] min-h-screen w-full px-4 sm:px-6 lg:px-8'>
			<div className='bg-primary-100 max-w-7xl mx-auto min-h-screen'>
				<div className='flex flex-col w-full min-h-screen items-start gap-4 sm:gap-6 py-4 sm:py-8 px-4 sm:px-8'>
					<header className='flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 relative self-stretch w-full bg-primary-1000 rounded-2xl sm:rounded-3xl overflow-hidden'>
						<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-100 text-sm sm:text-base tracking-[0] leading-[normal]">
							ABC Company
						</div>
						<div className='flex items-center gap-2 sm:gap-4'>
							<Button
								onClick={() => setIsConfigModalOpen(true)}
								className='bg-primary-800 text-white px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2'
							>
								<SettingsIcon className='w-3 h-3 sm:w-4 sm:h-4' />
								<span className='hidden sm:inline'>
									Agent Config
								</span>
							</Button>
							<div className='flex items-center gap-1 sm:gap-2'>
								<AlertTriangle className='w-4 h-4 sm:w-5 sm:h-5 text-[#ba3a3a]' />
								<span className='text-white text-xs sm:text-sm'>
									{alerts.length}
								</span>
							</div>
							<Avatar className='w-6 h-6 sm:w-8 sm:h-8'>
								<AvatarImage
									src='/ellipse-1.png'
									alt='Profile'
								/>
								<AvatarFallback>AC</AvatarFallback>
							</Avatar>
						</div>
					</header>

					<div className='flex items-stretch gap-4 relative flex-1 self-stretch w-full grow'>
						{/* Make the main layout responsive */}
						<div className='flex flex-col lg:flex-row items-start gap-4 relative flex-1 self-stretch w-full grow'>
							{/* Mobile-responsive navigation */}
							<nav className='flex flex-row lg:flex-col w-full lg:w-[220px] lg:min-w-[220px] lg:shrink-0 items-center lg:items-start justify-center lg:justify-between p-3 sm:p-4 lg:p-8 relative bg-gradient-to-br from-white via-purple-50 to-blue-50 backdrop-blur-lg border border-white/20 shadow-xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden lg:self-stretch'>
								{/* Background decoration */}
								<div className='absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-50' />
								<div className='absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl -translate-x-16 -translate-y-16' />
								<div className='absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl translate-x-16 translate-y-16' />
								<div className='flex lg:flex-col items-center lg:items-start gap-4 lg:gap-4 relative w-full flex-[0_0_auto] overflow-x-auto lg:overflow-visible z-10'>
									{/* Company logo/brand area */}
									<div className='hidden lg:flex items-center gap-3 w-full mb-2'>
										<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
											<span className='text-white font-bold text-sm'>
												AC
											</span>
										</div>
										<div className='flex flex-col'>
											<span className='text-sm font-semibold text-gray-900'>
												AI Supervisor
											</span>
											<span className='text-xs text-gray-500'>
												Workstation
											</span>
										</div>
									</div>
									{navigationItems.map((item, index) => {
										const isActive =
											location.pathname === item.path;
										return (
											<Link
												key={index}
												to={item.path}
												className={`group flex items-center gap-2 lg:gap-3 p-2 lg:p-3 relative whitespace-nowrap lg:self-stretch lg:w-full rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
													isActive
														? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/30 shadow-lg"
														: "hover:bg-white/40 hover:backdrop-blur-sm hover:border hover:border-white/20 hover:shadow-md"
												}`}
											>
												{/* Active indicator bar with glow effect */}
												<div
													className={`w-1 h-6 rounded-full transition-all duration-300 ${
														isActive
															? "bg-gradient-to-b from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50"
															: "bg-transparent group-hover:bg-gradient-to-b group-hover:from-gray-400 group-hover:to-gray-500"
													} hidden lg:block`}
												/>
												<div className='flex items-center gap-2 flex-1 relative z-10'>
													<div
														className={`p-1 rounded-lg transition-all duration-300 ${
															isActive
																? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-md"
																: "group-hover:bg-white/30"
														}`}
													>
														<item.icon
															className={`w-5 h-5 lg:w-6 lg:h-6 transition-all duration-300 ${
																isActive
																	? "text-blue-700 drop-shadow-sm"
																	: "text-gray-600 group-hover:text-gray-800"
															}`}
														/>
													</div>
													{/* Hide text on mobile */}
													<div
														className={`flex-1 mt-[-1.00px] text-sm lg:text-lg tracking-[0] leading-[normal] hidden lg:block transition-all duration-300 ${
															isActive
																? "font-semibold text-gray-900 drop-shadow-sm"
																: "font-medium text-gray-700 group-hover:text-gray-900"
														}`}
													>
														{item.label}
													</div>
												</div>
												{/* Hover glow effect */}
												{isActive && (
													<div className='absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-xl blur-sm -z-10' />
												)}
											</Link>
										);
									})}
								</div>

								{/* Settings link - hidden on mobile */}
								<div className='hidden lg:block w-full relative z-10'>
									{/* Divider */}
									<div className='h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent my-4' />
									<Link
										to='/settings'
										className='group flex items-center gap-2 lg:gap-3 p-2 lg:p-3 relative whitespace-nowrap lg:self-stretch lg:w-full rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-white/40 hover:backdrop-blur-sm hover:border hover:border-white/20 hover:shadow-md'
									>
										<div
											className={`w-1 h-6 rounded-full bg-transparent group-hover:bg-gradient-to-b group-hover:from-gray-400 group-hover:to-gray-500 transition-all duration-300`}
										/>
										<div className='flex items-center gap-2 flex-1'>
											<div className='p-1 rounded-lg transition-all duration-300 group-hover:bg-white/30'>
												<SettingsIcon
													className={`w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-all duration-300`}
												/>
											</div>
											<div
												className={`flex-1 mt-[-1.00px] text-lg tracking-[0] leading-[normal] font-medium text-gray-700 group-hover:text-gray-900 transition-all duration-300`}
											>
												Settings
											</div>
										</div>
									</Link>
								</div>
							</nav>

							{/* Main content area */}
							<main className='flex flex-col xl:flex-row items-start gap-4 relative flex-1 self-stretch grow'>
								<div className='flex flex-col items-start gap-4 relative flex-1 grow'>
									<div className='flex flex-col items-start gap-4 lg:gap-6 relative flex-1 self-stretch w-full grow'>
										{/* Top Row - Metrics Cards - Responsive grid */}
										<div className='grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 relative self-stretch w-full'>
											{/* Customer Satisfaction Score Card - spans 2 columns on larger screens */}
											<Card className='lg:col-span-2 xl:col-span-3 flex flex-col items-start justify-between p-4 lg:p-6 relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden border-0'>
												<CardContent className='p-0 w-full'>
													<div className="relative self-stretch [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg lg:text-xl tracking-[0] leading-[normal] mb-4">
														Customer Satisfaction
														Score (CSAT)
													</div>
													<div className='h-[150px] lg:h-[180px] w-full rounded-2xl bg-gray-50 p-4 flex items-end justify-between relative'>
														{/* Chart content remains the same */}
														<div className='absolute inset-0 p-4'>
															{[...Array(8)].map(
																(_, i) => (
																	<div
																		key={i}
																		className='absolute left-4 right-4 border-t border-gray-200'
																		style={{
																			top: `${
																				(i +
																					1) *
																				20
																			}px`,
																		}}
																	/>
																)
															)}
														</div>
														{chartData.map(
															(bar, index) => (
																<div
																	key={index}
																	className={`w-[30px] lg:w-[40px] ${bar.height} ${bar.color} rounded-t-lg relative z-10`}
																/>
															)
														)}
														<div className='absolute bottom-2 right-4 text-right'>
															<div className='text-grey-500 text-xs mb-1'>
																Today
															</div>
															<div className="text-primary-1000 text-base lg:text-lg [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
																{realTimeMetrics
																	?.csat
																	?.value ||
																	7.9}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>

											{/* Right Side Metrics - Responsive stacking */}
											<div className='lg:col-span-2 xl:col-span-2 flex flex-col gap-4 lg:gap-6'>
												{/* Avg Response Time Card */}
												<Card className='flex flex-col items-start justify-between p-4 lg:p-6 relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden border-0'>
													<CardContent className='p-0 w-full'>
														<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg lg:text-xl tracking-[0] leading-[normal] mb-4">
															Avg. Response Time
														</div>
														<div className='flex items-center justify-between w-full'>
															<div className="text-grey-1000 text-3xl lg:text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
																{realTimeMetrics
																	?.avgResponseTime
																	?.formatted ||
																	"01:24"}
															</div>
															<div
																className={`flex w-8 h-8 items-center justify-center rounded-full border border-solid ${
																	realTimeMetrics
																		?.avgResponseTime
																		?.trend ===
																	"up"
																		? "bg-[#ffc8c8] border-[#ba3a3a]"
																		: "bg-[#daffc8] border-[#3bb300]"
																}`}
															>
																<ArrowUpIcon
																	className={`w-4 h-4 ${
																		realTimeMetrics
																			?.avgResponseTime
																			?.trend ===
																		"up"
																			? "text-[#ba3a3a] rotate-0"
																			: "text-[#3bb300] rotate-180"
																	}`}
																/>
															</div>
														</div>
													</CardContent>
												</Card>

												{/* Active Conversations Card */}
												<Card className='flex flex-col items-start justify-between p-4 lg:p-6 relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden border-0'>
													<CardContent className='p-0 w-full'>
														<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg lg:text-xl tracking-[0] leading-[normal] mb-4">
															Active Conversations
														</div>
														<div className='flex items-center justify-between w-full'>
															<div className="text-grey-1000 text-3xl lg:text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
																{realTimeMetrics
																	?.activeConversations
																	?.value ||
																	421}
															</div>
															<div
																className={`flex w-8 h-8 items-center justify-center rounded-full border border-solid ${
																	realTimeMetrics
																		?.activeConversations
																		?.trend ===
																	"up"
																		? "bg-[#daffc8] border-[#3bb300]"
																		: "bg-[#ffc8c8] border-[#ba3a3a]"
																}`}
															>
																<ArrowUpIcon
																	className={`w-4 h-4 ${
																		realTimeMetrics
																			?.activeConversations
																			?.trend ===
																		"up"
																			? "text-[#3bb300]"
																			: "text-[#ba3a3a] rotate-180"
																	}`}
																/>
															</div>
														</div>
													</CardContent>
												</Card>
											</div>
										</div>

										{/* Second Row - Escalation Rate (responsive) */}
										<div className='grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 relative self-stretch w-full'>
											<div className='lg:col-span-2 xl:col-span-3'></div>
											<div className='lg:col-span-2 xl:col-span-2'>
												<Card className='flex flex-col items-start justify-between p-4 lg:p-6 relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden border-0'>
													<CardContent className='p-0 w-full'>
														<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg lg:text-xl tracking-[0] leading-[normal] mb-4">
															Escalation Rate
														</div>
														<div className='flex items-center justify-between w-full'>
															<div className="text-grey-1000 text-3xl lg:text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
																{realTimeMetrics
																	?.escalationRate
																	?.value ||
																	46}
																%
															</div>
															<div
																className={`flex w-8 h-8 items-center justify-center rounded-full border border-solid ${
																	realTimeMetrics
																		?.escalationRate
																		?.trend ===
																	"up"
																		? "bg-[#ffc8c8] border-[#ba3a3a]"
																		: "bg-[#daffc8] border-[#3bb300]"
																}`}
															>
																<ArrowUpIcon
																	className={`w-4 h-4 ${
																		realTimeMetrics
																			?.escalationRate
																			?.trend ===
																		"up"
																			? "text-[#ba3a3a] rotate-180"
																			: "text-[#3bb300]"
																	}`}
																/>
															</div>
														</div>
													</CardContent>
												</Card>
											</div>
										</div>
									</div>

									{/* Conversations Table - Mobile responsive */}
									<Card className='flex flex-col items-start gap-4 lg:gap-6 p-4 lg:p-6 relative flex-1 self-stretch w-full bg-white rounded-2xl lg:rounded-3xl overflow-hidden border-0'>
										<CardContent className='p-0 w-full'>
											<div className='flex flex-col lg:flex-row items-start lg:items-center justify-between relative flex-[0_0_auto] mb-4 gap-4'>
												{/* Tabs - Responsive */}
												<Tabs
													defaultValue='all'
													className='inline-flex h-10 items-center gap-2 lg:gap-4 relative flex-[0_0_auto] overflow-x-auto'
												>
													<TabsList className='bg-transparent p-0 h-auto gap-2 lg:gap-4 flex-nowrap'>
														{conversationTabs.map(
															(tab) => (
																<TabsTrigger
																	key={tab.id}
																	value={
																		tab.id
																	}
																	onClick={() =>
																		setStatusFilter(
																			tab.id ===
																				"all"
																				? "all"
																				: tab.label.toLowerCase()
																		)
																	}
																	className={`inline-flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 relative whitespace-nowrap rounded-[72px] data-[state=active]:bg-primary-1000 data-[state=inactive]:bg-grey-100 ${
																		tab.active
																			? "bg-primary-1000"
																			: "bg-grey-100"
																	}`}
																>
																	{tab.hasIndicator && (
																		<div className='relative w-2 h-2 bg-[#ba3939] rounded' />
																	)}
																	<div
																		className={`relative w-fit text-sm lg:text-base tracking-[0] leading-[normal] ${
																			tab.active
																				? "[font-family:'General_Sans-Medium',Helvetica] font-medium text-white"
																				: "[font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-1000"
																		}`}
																	>
																		{
																			tab.label
																		}
																	</div>
																</TabsTrigger>
															)
														)}
													</TabsList>
												</Tabs>

												{/* Search and filter controls - Responsive */}
												<div className='inline-flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-4 relative w-full lg:w-auto'>
													<div className='relative flex-1 lg:flex-none'>
														<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-500' />
														<Input
															value={searchTerm}
															onChange={(e) =>
																setSearchTerm(
																	e.target
																		.value
																)
															}
															placeholder='Search conversations...'
															className='pl-10 pr-4 py-2 w-full lg:w-64 rounded-full border-grey-300'
														/>
													</div>
													<div className='flex gap-2'>
														<Button className='inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 relative bg-primary-100 rounded-[72px] h-auto border-0'>
															<Filter className='relative w-5 lg:w-6 h-5 lg:h-6' />
														</Button>
														<Button className='inline-flex items-center justify-center gap-2 px-3 lg:px-4 py-2 relative bg-primary-100 rounded-[72px] h-auto border-0'>
															<ArrowUpRightIcon className='relative w-5 lg:w-6 h-5 lg:h-6' />
														</Button>
													</div>
												</div>
											</div>

											{/* Mobile-responsive table */}
											<div className='overflow-x-auto'>
												<Table className='min-w-full'>
													<TableHeader>
														<TableRow className='border-0'>
															<TableHead className="relative w-32 lg:w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
																Name
															</TableHead>
															<TableHead className="relative w-40 lg:w-60 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal] hidden lg:table-cell">
																Message
															</TableHead>
															<TableHead className="relative w-24 lg:w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
																Status
															</TableHead>
															<TableHead className="relative w-20 lg:w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
																Time
															</TableHead>
															<TableHead className="relative w-20 lg:w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
																Actions
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{filteredConversations.map(
															(
																conversation,
																index
															) => (
																<React.Fragment
																	key={index}
																>
																	<TableRow className='border-0'>
																		<TableCell className='flex w-32 lg:w-40 items-center gap-2 relative'>
																			<Avatar className='w-5 h-5 lg:w-6 lg:h-6'>
																				<AvatarImage
																					src={
																						conversation.avatar
																					}
																					alt={
																						conversation.name
																					}
																				/>
																				<AvatarFallback className='text-xs'>
																					{conversation.name
																						.split(
																							" "
																						)
																						.map(
																							(
																								n
																							) =>
																								n[0]
																						)
																						.join(
																							""
																						)}
																				</AvatarFallback>
																			</Avatar>
																			<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-[#0b0b0b] text-xs tracking-[0] leading-[normal] truncate">
																				{
																					conversation.name
																				}
																			</div>
																		</TableCell>
																		<TableCell className="relative w-40 lg:w-60 mt-[-1.00px] [font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-800 text-xs tracking-[0] leading-[normal] hidden lg:table-cell">
																			<div className='truncate'>
																				{
																					conversation.message
																				}
																			</div>
																		</TableCell>
																		<TableCell>
																			<Badge
																				className={`flex w-20 lg:w-24 items-center justify-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 relative rounded-[72px] border border-solid ${conversation.statusColor} text-xs`}
																			>
																				<div className="w-fit [font-family:'General_Sans-Regular',Helvetica] font-normal relative mt-[-1.00px] text-grey-1000 tracking-[0] leading-[normal] truncate">
																					{
																						conversation.status
																					}
																				</div>
																			</Badge>
																		</TableCell>
																		<TableCell className="relative w-20 lg:w-40 mt-[-1.00px] [font-family:'General_Sans-Regular',Helvetica] font-normal text-[#0b0b0b] text-xs tracking-[0] leading-[normal]">
																			{
																				conversation.time
																			}
																		</TableCell>
																		<TableCell>
																			<Button
																				onClick={() =>
																					handleViewConversation(
																						conversation.id
																					)
																				}
																				className='bg-primary-1000 text-white px-2 lg:px-3 py-1 rounded-full text-xs'
																			>
																				View
																			</Button>
																		</TableCell>
																	</TableRow>
																	{index <
																		filteredConversations.length -
																			1 && (
																		<TableRow>
																			<TableCell
																				colSpan={
																					5
																				}
																				className='p-0 border-b border-grey-200'
																			/>
																		</TableRow>
																	)}
																</React.Fragment>
															)
														)}
													</TableBody>
												</Table>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Alerts Panel - Responsive positioning */}
								<div className='w-full xl:w-80 order-first xl:order-last'>
									<AlertsPanel
										alerts={alerts}
										onViewConversation={
											handleViewConversation
										}
										onDismissAlert={handleDismissAlert}
									/>
								</div>
							</main>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			<ConversationModal
				isOpen={isConversationModalOpen}
				onClose={() => setIsConversationModalOpen(false)}
				conversation={selectedConversation}
				onTakeOver={handleTakeOver}
				onReturnToAI={handleReturnToAI}
				onSendMessage={handleSendMessage}
				isControlledBySupervisor={
					selectedConversation?.isControlledBySupervisor || false
				}
			/>

			<AgentConfigModal
				isOpen={isConfigModalOpen}
				onClose={() => setIsConfigModalOpen(false)}
				currentConfig={agentConfig}
				onSaveConfig={handleSaveConfig}
				presets={configPresets}
				onSavePreset={handleSavePreset}
				onLoadPreset={handleLoadPreset}
			/>
		</div>
	);
};
