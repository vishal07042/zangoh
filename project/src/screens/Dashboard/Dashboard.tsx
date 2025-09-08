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
import React, { useEffect } from "react";
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
			];
			setAlerts(newAlerts);
		}, 2000); // Simulate every 2 seconds
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='bg-[#ecebf1] grid justify-items-center [align-items:start] w-screen'>
			<div className='bg-primary-100 w-[1440px] h-[1024px]'>
				<div className='flex flex-col w-[1376px] h-[960px] items-start gap-6 relative top-8 left-8'>
					<header className='flex items-center justify-between px-10 py-4 relative self-stretch w-full flex-[0_0_auto] bg-primary-1000 rounded-3xl overflow-hidden'>
						<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-100 text-base tracking-[0] leading-[normal]">
							ABC Company
						</div>
						<div className='flex items-center gap-4'>
							<Button
								onClick={() => setIsConfigModalOpen(true)}
								className='bg-primary-800 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2'
							>
								<SettingsIcon className='w-4 h-4' />
								Agent Config
							</Button>
							<div className='flex items-center gap-2'>
								<AlertTriangle className='w-5 h-5 text-[#ba3a3a]' />
								<span className='text-white text-sm'>
									{alerts.length}
								</span>
							</div>
						</div>
						<Avatar className='w-8 h-8'>
							<AvatarImage src='/ellipse-1.png' alt='Profile' />
							<AvatarFallback>AC</AvatarFallback>
						</Avatar>
					</header>

					<div className='flex items-stretch gap-4 relative flex-1 self-stretch w-full grow'>
						<nav className='flex flex-col w-[88px] min-w-[88px] max-w-[88px] h-full items-center justify-between py-8 px-2 relative self-stretch bg-white rounded-3xl overflow-hidden shadow-sm'>
							<div className='flex flex-col items-center gap-2 w-full flex-1'>
								{navigationItems.map((item, index) => {
									const isActive = location.pathname === item.path;
									return (
										<Link
											key={index}
											to={item.path}
											className={`flex items-center gap-3 p-3 relative self-stretch w-full rounded-xl cursor-pointer transition-colors ${
												isActive
													? "bg-primary-200"
													: "hover:bg-primary-100"
											}`}
										>
											{/* Active indicator bar */}
											<div
												className={`w-1 h-6 rounded-full ${
													isActive
														? "bg-primary-800"
														: "bg-transparent"
												}`}
											/>
											<div className='flex items-center gap-2 flex-1'>
												<item.icon
													className={`w-6 h-6 ${
														isActive
															? "text-primary-1000"
															: "text-grey-700"
													}`}
												/>
												<div
													className={`flex-1 mt-[-1.00px] text-xl tracking-[0] leading-[normal] ${
														isActive
															? "[font-family:'General_Sans-Medium',Helvetica] font-medium text-primary-1000"
															: "[font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-1000"
													}`}
												>
													{item.label}
												</div>
											</div>
										</Link>
									);
								})}
							</div>
							<Link
								to='/settings'
								className='flex flex-col items-center gap-1 py-4 px-0 w-full rounded-2xl cursor-pointer transition-colors hover:bg-primary-100'
							>
								<div className={`w-1 h-6 rounded-full mb-2 bg-transparent`} />
								<SettingsIcon className={`w-6 h-6 mb-1 text-grey-700`} />
								<div className={`text-xs text-center [font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-1000`}>
									Settings
								</div>
							</Link>
						</nav>

						<main className='flex items-start gap-4 relative flex-1 self-stretch grow'>
							<div className='flex flex-col items-start gap-4 relative flex-1 grow'>
								<div className='flex flex-col items-start gap-6 relative flex-1 self-stretch w-full grow'>
									{/* Top Row - Metrics Cards */}
									<div className='flex items-center gap-6 relative self-stretch w-full'>
										{/* Customer Satisfaction Score Card */}
										<Card className='flex flex-col items-start justify-between p-6 relative flex-1 bg-white rounded-3xl overflow-hidden border-0'>
											<CardContent className='p-0 w-full'>
												<div className="relative self-stretch [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl tracking-[0] leading-[normal] mb-4">
													Customer Satisfaction Score
													(CSAT)
												</div>
												<div className='h-[180px] w-full rounded-2xl bg-gray-50 p-4 flex items-end justify-between relative'>
													{/* Chart Grid Lines */}
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
													{/* Chart Bars */}
													{chartData.map(
														(bar, index) => (
															<div
																key={index}
																className={`w-[40px] ${bar.height} ${bar.color} rounded-t-lg relative z-10`}
															/>
														)
													)}
													{/* Today Label and Score */}
													<div className='absolute bottom-2 right-4 text-right'>
														<div className='text-grey-500 text-xs mb-1'>
															Today
														</div>
														<div className="text-primary-1000 text-lg [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
															7.9
														</div>
													</div>
												</div>
											</CardContent>
										</Card>

										{/* Right Side Metrics */}
										<div className='flex flex-col gap-6 w-[300px]'>
											{/* Avg Response Time Card */}
											<Card className='flex flex-col items-start justify-between p-6 relative bg-white rounded-3xl overflow-hidden border-0'>
												<CardContent className='p-0 w-full'>
													<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl tracking-[0] leading-[normal] mb-4">
														Avg. Response Time
													</div>
													<div className='flex items-center justify-between w-full'>
														<div className="text-grey-1000 text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
															01:24
														</div>
														<div className='flex w-8 h-8 items-center justify-center bg-[#ffc8c8] rounded-full border border-solid border-[#ba3a3a]'>
															<ArrowUpIcon className='w-4 h-4 text-[#ba3a3a] rotate-180' />
														</div>
													</div>
												</CardContent>
											</Card>

											{/* Active Conversations Card */}
											<Card className='flex flex-col items-start justify-between p-6 relative bg-white rounded-3xl overflow-hidden border-0'>
												<CardContent className='p-0 w-full'>
													<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl tracking-[0] leading-[normal] mb-4">
														Active Conversations
													</div>
													<div className='flex items-center justify-between w-full'>
														<div className="text-grey-1000 text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
															421
														</div>
														<div className='flex w-8 h-8 items-center justify-center bg-[#daffc8] rounded-full border border-solid border-[#3bb300]'>
															<ArrowUpIcon className='w-4 h-4 text-[#3bb300]' />
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
									</div>

									{/* Second Row - Escalation Rate */}
									<div className='flex items-center gap-6 relative self-stretch w-full'>
										{/* Empty Space to align with chart above */}
										<div className='flex-1'></div>

										{/* Escalation Rate Card */}
										<div className='w-[300px]'>
											<Card className='flex flex-col items-start justify-between p-6 relative bg-white rounded-3xl overflow-hidden border-0'>
												<CardContent className='p-0 w-full'>
													<div className="relative [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl tracking-[0] leading-[normal] mb-4">
														Escalation Rate
													</div>
													<div className='flex items-center justify-between w-full'>
														<div className="text-grey-1000 text-5xl [font-family:'General_Sans-Semibold',Helvetica] font-semibold">
															46%
														</div>
														<div className='flex w-8 h-8 items-center justify-center bg-[#ffc8c8] rounded-full border border-solid border-[#ba3a3a]'>
															<ArrowUpIcon className='w-4 h-4 text-[#ba3a3a] rotate-180' />
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
									</div>
								</div>

								{/* Conversations Table */}
								<Card className='flex flex-col items-start gap-6 p-6 relative flex-1 self-stretch w-full bg-white rounded-3xl overflow-hidden border-0'>
									<CardContent className='p-0 w-full'>
										<div className='flex items-start justify-between relative flex-[0_0_auto] mb-4'>
											<Tabs
												defaultValue='all'
												className='inline-flex h-10 items-center gap-4 relative flex-[0_0_auto]'
											>
												<TabsList className='bg-transparent p-0 h-auto gap-4'>
													{conversationTabs.map(
														(tab) => (
															<TabsTrigger
																key={tab.id}
																value={tab.id}
																onClick={() =>
																	setStatusFilter(
																		tab.id ===
																			"all"
																			? "all"
																			: tab.label.toLowerCase()
																	)
																}
																className={`inline-flex items-center justify-center gap-2 px-4 py-2 relative self-stretch flex-[0_0_auto] rounded-[72px] data-[state=active]:bg-primary-1000 data-[state=inactive]:bg-grey-100 ${
																	tab.active
																		? "bg-primary-1000"
																		: "bg-grey-100"
																}`}
															>
																{tab.hasIndicator && (
																	<div className='relative w-2 h-2 bg-[#ba3939] rounded' />
																)}
																<div
																	className={`relative w-fit text-base tracking-[0] leading-[normal] ${
																		tab.active
																			? "[font-family:'General_Sans-Medium',Helvetica] font-medium text-white"
																			: "[font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-1000"
																	}`}
																>
																	{tab.label}
																</div>
															</TabsTrigger>
														)
													)}
												</TabsList>
											</Tabs>

											<div className='inline-flex items-center gap-4 relative flex-[0_0_auto]'>
												<div className='relative'>
													<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-500' />
													<Input
														value={searchTerm}
														onChange={(e) =>
															setSearchTerm(
																e.target.value
															)
														}
														placeholder='Search conversations...'
														className='pl-10 pr-4 py-2 w-64 rounded-full border-grey-300'
													/>
												</div>
												<Button className='inline-flex items-center justify-center gap-2 px-4 py-2 relative flex-[0_0_auto] bg-primary-100 rounded-[72px] h-auto border-0'>
													<Filter className='relative w-6 h-6' />
												</Button>

												<Button className='inline-flex items-center justify-center gap-2 px-4 py-2 relative flex-[0_0_auto] bg-primary-100 rounded-[72px] h-auto border-0'>
													<ArrowUpRightIcon className='relative w-6 h-6' />
												</Button>
											</div>
										</div>

										<Table>
											<TableHeader>
												<TableRow className='border-0'>
													<TableHead className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
														Name
													</TableHead>
													<TableHead className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
														Message
													</TableHead>
													<TableHead className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
														Status
													</TableHead>
													<TableHead className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
														Time
													</TableHead>
													<TableHead className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-500 text-xs tracking-[0] leading-[normal]">
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredConversations.map(
													(conversation, index) => (
														<React.Fragment
															key={index}
														>
															<TableRow className='border-0'>
																<TableCell className='flex w-40 items-center gap-2 relative'>
																	<Avatar className='w-6 h-6'>
																		<AvatarImage
																			src={
																				conversation.avatar
																			}
																			alt={
																				conversation.name
																			}
																		/>
																		<AvatarFallback>
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
																	<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-[#0b0b0b] text-xs tracking-[0] leading-[normal]">
																		{
																			conversation.name
																		}
																	</div>
																</TableCell>
																<TableCell className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Regular',Helvetica] font-normal text-grey-800 text-xs tracking-[0] leading-[normal]">
																	{
																		conversation.message
																	}
																</TableCell>
																<TableCell>
																	<Badge
																		className={`flex w-40 items-center justify-center gap-2 px-4 py-1 relative rounded-[72px] border border-solid ${conversation.statusColor}`}
																	>
																		<div className="w-fit [font-family:'General_Sans-Regular',Helvetica] font-normal text-xs relative mt-[-1.00px] text-grey-1000 tracking-[0] leading-[normal]">
																			{
																				conversation.status
																			}
																		</div>
																	</Badge>
																</TableCell>
																<TableCell className="relative w-40 mt-[-1.00px] [font-family:'General_Sans-Regular',Helvetica] font-normal text-[#0b0b0b] text-xs tracking-[0] leading-[normal]">
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
																		className='bg-primary-1000 text-white px-3 py-1 rounded-full text-xs'
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
									</CardContent>
								</Card>
							</div>

							{/* Alerts Panel */}
							<div className='w-80'>
								<AlertsPanel
									alerts={alerts}
									onViewConversation={handleViewConversation}
									onDismissAlert={handleDismissAlert}
								/>
							</div>
						</main>
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
