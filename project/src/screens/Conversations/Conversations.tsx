import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	BriefcaseIcon,
	HomeIcon,
	MessageSquareIcon,
	SettingsIcon,
	ZapIcon,
	Send,
	ChevronDown,
	Mic,
	MicOff,
} from "lucide-react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useVoiceInput } from "../../lib/useVoiceInput";
import { TemplateModal } from "../../components/TemplateModal";

const navigationItems = [
	{ icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
	{ icon: MessageSquareIcon, label: "Conversations", path: "/conversations" },
	{ icon: BriefcaseIcon, label: "AI Agents", path: "/agents" },
	{ icon: ZapIcon, label: "Templates", path: "/templates" },
];

const conversationsList = [
	{
		id: 1,
		name: "Jim Halpert",
		avatar: "/ellipse-1.png",
		status: "Active",
		statusColor: "bg-[#ffc8c8] text-[#ba3a3a]",
		time: "8 min",
		isSelected: true,
	},
	{
		id: 2,
		name: "Pam Beesly",
		avatar: "/ellipse-1.png",
		status: "Waiting",
		statusColor: "bg-[#fff4c8] text-[#b8860b]",
		time: "6 min",
		isSelected: false,
	},
	{
		id: 3,
		name: "Michael Scott",
		avatar: "/ellipse-1.png",
		status: "Resolved",
		statusColor: "bg-[#daffc8] text-[#3bb300]",
		time: "3 min",
		isSelected: false,
	},
	{
		id: 4,
		name: "Andy Bernard",
		avatar: "/ellipse-1.png",
		status: "Escalated",
		statusColor: "bg-[#c8ecff] text-[#006d94]",
		time: "6 min",
		isSelected: false,
	},
];

const messages = [
	{
		id: 1,
		sender: "customer",
		content:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do Lorem ipsum dolor sit amet.",
		time: "11:02 AM",
	},
	{
		id: 2,
		sender: "ai",
		content:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		time: "11:03 AM",
	},
	{
		id: 3,
		sender: "customer",
		content:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do Lorem ipsum dolor sit amet.",
		time: "11:04 AM",
	},
];

export const Conversations = (): JSX.Element => {
	const location = useLocation();
	const [selectedConversation, setSelectedConversation] = useState(1);
	const [messageInput, setMessageInput] = useState("");
	const [notes, setNotes] = useState("Who has...");
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

	// Voice input functionality
	const handleVoiceResult = (transcript: string) => {
		// Append the voice input to existing message
		setMessageInput((prev) => {
			const separator = prev.trim() ? " " : "";
			return prev + separator + transcript;
		});
	};

	const handleVoiceError = (error: string) => {
		console.error("Voice input error:", error);
		// You could show a toast notification here
	};

	// Template functionality
	const handleTemplateSelect = (processedContent: string) => {
		setMessageInput(processedContent);
		setIsTemplateModalOpen(false);
	};

	const {
		isListening,
		isSupported,
		transcript,
		startListening,
		stopListening,
	} = useVoiceInput({
		onResult: handleVoiceResult,
		onError: handleVoiceError,
		continuous: false,
		interimResults: true,
		lang: "en-US",
	});

	const currentConversation = conversationsList.find(
		(c) => c.id === selectedConversation
	);

	return (
		<div className='bg-[#ecebf1] grid justify-items-center [align-items:start] w-screen'>
			<div className='bg-primary-100 w-[1440px] h-[1024px]'>
				<div className='flex flex-col w-[1376px] h-[960px] items-start gap-6 relative top-8 left-8'>
					{/* Header */}
					<header className='flex items-center justify-between px-10 py-4 relative self-stretch w-full flex-[0_0_auto] bg-primary-1000 rounded-3xl overflow-hidden'>
						<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-100 text-base tracking-[0] leading-[normal]">
							ABC Company
						</div>
						<Avatar className='w-8 h-8'>
							<AvatarImage src='/ellipse-1.png' alt='Profile' />
							<AvatarFallback>AC</AvatarFallback>
						</Avatar>
					</header>

					<div className='flex items-start gap-4 relative flex-1 self-stretch w-full grow'>
						{/* Left Navigation */}
						<nav className='flex flex-col w-[100px] items-start justify-between p-4 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className='flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]'>
								{navigationItems.map((item, index) => {
									const isActive =
										location.pathname === item.path;
									return (
										<Link
											key={index}
											to={item.path}
											className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors ${
												isActive
													? "bg-primary-200"
													: "hover:bg-primary-100"
											}`}
										>
											<item.icon className='w-6 h-6 text-grey-600' />
										</Link>
									);
								})}
							</div>

							<Link
								to='/settings'
								className='flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-primary-100'
							>
								<SettingsIcon className='w-6 h-6 text-grey-600' />
							</Link>
						</nav>

						{/* Customer Conversations List */}
						<div className='flex flex-col w-[280px] p-6 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className="mb-6 [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg">
								Customer Conversations
							</div>
							<div className='flex flex-col gap-4'>
								{conversationsList.map((conversation) => (
									<div
										key={conversation.id}
										onClick={() =>
											setSelectedConversation(
												conversation.id
											)
										}
										className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
											selectedConversation ===
											conversation.id
												? "bg-primary-100"
												: "hover:bg-grey-50"
										}`}
									>
										<Avatar className='w-10 h-10'>
											<AvatarImage
												src={conversation.avatar}
												alt={conversation.name}
											/>
											<AvatarFallback>
												{conversation.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
										<div className='flex-1'>
											<div className="[font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-sm mb-1">
												{conversation.name}
											</div>
											<div className='flex items-center gap-2'>
												<Badge
													className={`px-2 py-1 text-xs rounded-full ${conversation.statusColor}`}
												>
													{conversation.status}
												</Badge>
												<span className='text-xs text-grey-500'>
													{conversation.time}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Main Conversation Area */}
						<div className='flex flex-col flex-1 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							{/* Conversation Header */}
							<div className='flex items-center justify-between p-6 border-b border-grey-200'>
								<div className='flex items-center gap-3'>
									<Avatar className='w-10 h-10'>
										<AvatarImage
											src={currentConversation?.avatar}
											alt={currentConversation?.name}
										/>
										<AvatarFallback>
											{currentConversation?.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="[font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg">
											{currentConversation?.name} - #12345
										</div>
										{currentConversation && (
											<Badge
												className={`px-2 py-1 text-xs rounded-full ${currentConversation.statusColor}`}
											>
												{currentConversation.status}
											</Badge>
										)}
									</div>
								</div>
								<Button className='bg-primary-600 text-white px-4 py-2 rounded-lg'>
									Take Over
								</Button>
							</div>

							{/* Messages Area */}
							<div className='flex-1 p-6 overflow-y-auto'>
								<div className='space-y-4'>
									{messages.map((message) => (
										<div
											key={message.id}
											className={`flex ${
												message.sender === "customer"
													? "justify-start"
													: "justify-end"
											}`}
										>
											<div className='flex items-start gap-2 max-w-[70%]'>
												{message.sender ===
													"customer" && (
													<Avatar className='w-8 h-8'>
														<AvatarImage
															src={
																currentConversation?.avatar
															}
															alt={
																currentConversation?.name
															}
														/>
														<AvatarFallback>
															{currentConversation?.name
																.split(" ")
																.map(
																	(n) => n[0]
																)
																.join("")}
														</AvatarFallback>
													</Avatar>
												)}
												<div className='flex flex-col'>
													<div
														className={`px-4 py-3 rounded-lg ${
															message.sender ===
															"customer"
																? "bg-grey-100 text-grey-1000"
																: "bg-primary-600 text-white"
														}`}
													>
														<div className='text-sm'>
															{message.sender ===
																"ai" && (
																<div className='flex items-center gap-1 mb-2 text-xs opacity-70'>
																	<span>
																		+ Chat
																	</span>
																</div>
															)}
															{message.content}
														</div>
													</div>
												</div>
												{message.sender === "ai" && (
													<div className='w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold'>
														AI
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Message Input */}
							<div className='p-6 border-t border-grey-200'>
								<div className='flex items-center gap-3'>
									<div className='flex-1 relative'>
										<Input
											value={messageInput}
											onChange={(e) =>
												setMessageInput(e.target.value)
											}
											placeholder={
												isListening
													? "Listening..."
													: "Respond"
											}
											className='px-4 py-3 rounded-lg border border-grey-300 pr-12'
											disabled={isListening}
										/>
										{/* Voice input display overlay */}
										{isListening && transcript && (
											<div className='absolute inset-0 px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center'>
												<span className='text-blue-700 italic'>
													{transcript}
												</span>
											</div>
										)}
										{/* Voice input button */}
										{isSupported && (
											<Button
												onClick={
													isListening
														? stopListening
														: startListening
												}
												className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full border-0 ${
													isListening
														? "bg-red-500 text-white hover:bg-red-600"
														: "bg-grey-100 text-grey-600 hover:bg-grey-200"
												}`}
												title={
													isListening
														? "Stop recording"
														: "Start voice input"
												}
											>
												{isListening ? (
													<MicOff className='w-4 h-4' />
												) : (
													<Mic className='w-4 h-4' />
												)}
											</Button>
										)}
									</div>
									<Button
										onClick={() =>
											setIsTemplateModalOpen(true)
										}
										className='flex items-center gap-2 px-3 py-3 bg-grey-100 text-grey-600 rounded-lg'
									>
										<span className='text-xs'>
											Template
										</span>
										<ChevronDown className='w-4 h-4' />
									</Button>
									<Button className='p-3 bg-primary-600 text-white rounded-lg'>
										<Send className='w-4 h-4' />
									</Button>
								</div>
								{/* Voice input status */}
								{isListening && (
									<div className='mt-2 flex items-center gap-2 text-sm text-blue-600'>
										<div className='flex items-center gap-1'>
											<div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
											<span>Recording... Speak now</span>
										</div>
									</div>
								)}
								{!isSupported && (
									<div className='mt-2 text-xs text-orange-600'>
										Voice input not supported in this
										browser. Please use Chrome, Edge, or
										Safari.
									</div>
								)}
							</div>
						</div>

						{/* Right Sidebar - Customer Details */}
						<div className='flex flex-col w-[280px] p-6 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className="mb-6 [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-lg">
								Customer Details
							</div>

							{/* Customer Info */}
							<div className='mb-6'>
								<div className='flex items-center gap-3 mb-4'>
									<Avatar className='w-12 h-12'>
										<AvatarImage
											src={currentConversation?.avatar}
											alt={currentConversation?.name}
										/>
										<AvatarFallback>
											{currentConversation?.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="[font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000">
											{currentConversation?.name}
										</div>
										<div className='text-grey-500 text-sm'>
											#12345
										</div>
									</div>
								</div>

								<div className='text-xs text-grey-500 mb-2'>
									1234 Elm Street, Suite 567, Springfield, IL
									62704, United States
								</div>

								<div className='mb-4'>
									<div className='text-xs text-grey-500 mb-1'>
										Conversation Metrics
									</div>
									<div className='flex items-center gap-2'>
										<Badge
											className={`px-2 py-1 text-xs rounded-full ${currentConversation?.statusColor}`}
										>
											{currentConversation?.status}
										</Badge>
										<span className='text-xs text-grey-500'>
											{currentConversation?.time}
										</span>
									</div>
								</div>

								<div className='mb-4'>
									<div className='text-xs text-grey-500 mb-2'>
										Tags
									</div>
									<div className='flex gap-2'>
										<Badge className='px-2 py-1 text-xs rounded-lg bg-grey-100 text-grey-600'>
											#Return
										</Badge>
										<Badge className='px-2 py-1 text-xs rounded-lg bg-grey-100 text-grey-600'>
											#Parcel
										</Badge>
									</div>
								</div>
							</div>

							{/* Notes Section */}
							<div className='mb-6'>
								<div className='text-xs text-grey-500 mb-2'>
									Supervisor Notes
								</div>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className='w-full h-32 p-3 bg-[#fff9c4] border border-grey-300 rounded-lg text-sm resize-none'
									placeholder='Add notes...'
								/>
							</div>

							{/* Action Button */}
							<Button className='w-full bg-primary-600 text-white py-3 rounded-lg [font-family:"General_Sans-Medium",Helvetica] font-medium'>
								Mark as Resolved
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Template Modal */}
			<TemplateModal
				isOpen={isTemplateModalOpen}
				onClose={() => setIsTemplateModalOpen(false)}
				onSelectTemplate={handleTemplateSelect}
			/>
		</div>
	);
};
