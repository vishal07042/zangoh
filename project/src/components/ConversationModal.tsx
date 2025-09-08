import {
	X,
	MessageSquare,
	User,
	Bot,
	ArrowRight,
	Settings,
	Mic,
	MicOff,
	Library,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

interface Message {
	id: string;
	sender: "customer" | "ai" | "supervisor";
	content: string;
	timestamp: string;
}

interface ConversationModalProps {
	isOpen: boolean;
	onClose: () => void;
	conversation: {
		id: string;
		customerName: string;
		customerAvatar: string;
		status: string;
		statusColor: string;
		startTime: string;
		messages: Message[];
	} | null;
	onTakeOver: (conversationId: string) => void;
	onReturnToAI: (conversationId: string, notes: string) => void;
	onSendMessage: (conversationId: string, message: string) => void;
	isControlledBySupervisor: boolean;
}

export const ConversationModal: React.FC<ConversationModalProps> = ({
	isOpen,
	onClose,
	conversation,
	onTakeOver,
	onReturnToAI,
	onSendMessage,
	isControlledBySupervisor,
}) => {
	const [newMessage, setNewMessage] = useState("");
	const [returnNotes, setReturnNotes] = useState("");
	const [showReturnDialog, setShowReturnDialog] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [showTemplates, setShowTemplates] = useState(false);
	const [templates, setTemplates] = useState<
		Array<{ id: string; title: string; body: string }>
	>(() => {
		try {
			const stored = localStorage.getItem("responseTemplates");
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	if (!isOpen || !conversation) return null;

	const handleSendMessage = () => {
		if (newMessage.trim()) {
			onSendMessage(conversation.id, newMessage);
			setNewMessage("");
		}
	};

	const handleReturnToAI = () => {
		onReturnToAI(conversation.id, returnNotes);
		setReturnNotes("");
		setShowReturnDialog(false);
	};

	// Simple WebSpeechAPI dictation into the textarea
	const toggleVoice = () => {
		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) return;
		if (!isRecording) {
			const rec = new SpeechRecognition();
			rec.continuous = false;
			rec.lang = "en-US";
			rec.interimResults = false;
			rec.onresult = (e: any) => {
				const text = Array.from(e.results)
					.map((r: any) => r[0].transcript)
					.join(" ");
				setNewMessage((v) => (v ? v + " " + text : text));
			};
			rec.onend = () => setIsRecording(false);
			try {
				rec.start();
				setIsRecording(true);
			} catch {
				setIsRecording(false);
			}
			(window as any).__active_rec = rec;
		} else {
			try {
				(window as any).__active_rec?.stop();
			} catch {}
			setIsRecording(false);
		}
	};

	const handleInsertTemplate = (tpl: {
		id: string;
		title: string;
		body: string;
	}) => {
		// Replace variables like {{name}} with prompts for user input
		const placeholders = Array.from(
			tpl.body.matchAll(/\{\{(.*?)\}\}/g)
		).map((m) => m[1]);
		let filled = tpl.body;
		placeholders.forEach((ph) => {
			const value = prompt(`Enter value for ${ph}`) || "";
			filled = filled.replace(
				new RegExp(`\\{\\{${ph}\\}\\}`, "g"),
				value
			);
		});
		setNewMessage((v) => (v ? v + "\n" + filled : filled));
		setShowTemplates(false);
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<Card className='w-[800px] h-[600px] bg-white rounded-3xl overflow-hidden border-0'>
				<CardContent className='p-0 h-full flex flex-col'>
					{/* Header */}
					<div className='flex items-center justify-between p-6 border-b border-grey-200'>
						<div className='flex items-center gap-4'>
							<Avatar className='w-10 h-10'>
								<AvatarImage
									src={conversation.customerAvatar}
									alt={conversation.customerName}
								/>
								<AvatarFallback>
									{conversation.customerName
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>
							<div>
								<h2 className='text-xl font-medium text-grey-1000'>
									{conversation.customerName}
								</h2>
								<div className='flex items-center gap-2'>
									<Badge
										className={`${conversation.statusColor} text-xs`}
									>
										{conversation.status}
									</Badge>
									<span className='text-xs text-grey-500'>
										Started {conversation.startTime}
									</span>
								</div>
							</div>
						</div>
						<Button
							onClick={onClose}
							className='p-2 bg-grey-100 hover:bg-grey-200 rounded-full'
						>
							<X className='w-5 h-5' />
						</Button>
					</div>

					{/* Control Panel */}
					<div className='flex items-center justify-between p-4 bg-primary-100 border-b border-grey-200'>
						<div className='flex items-center gap-2'>
							{isControlledBySupervisor ? (
								<Badge className='bg-[#daffc8] border-[#3bb300] text-grey-1000'>
									<User className='w-3 h-3 mr-1' />
									Supervisor Control
								</Badge>
							) : (
								<Badge className='bg-[#c8ecff] border-[#006d94] text-grey-1000'>
									<Bot className='w-3 h-3 mr-1' />
									AI Control
								</Badge>
							)}
						</div>
						<div className='flex gap-2'>
							{!isControlledBySupervisor ? (
								<Button
									onClick={() => onTakeOver(conversation.id)}
									className='bg-primary-1000 text-white px-4 py-2 rounded-full text-sm'
								>
									Take Over
								</Button>
							) : (
								<Button
									onClick={() => setShowReturnDialog(true)}
									className='bg-grey-600 text-white px-4 py-2 rounded-full text-sm'
								>
									Return to AI
								</Button>
							)}
						</div>
					</div>

					{/* Messages */}
					<div className='flex-1 overflow-y-auto p-4 space-y-4'>
						{conversation.messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-3 ${
									message.sender === "customer"
										? "justify-start"
										: "justify-end"
								}`}
							>
								{message.sender === "customer" && (
									<Avatar className='w-8 h-8'>
										<AvatarImage
											src={conversation.customerAvatar}
											alt={conversation.customerName}
										/>
										<AvatarFallback>
											{conversation.customerName
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
								)}
								<div
									className={`max-w-[70%] p-3 rounded-2xl ${
										message.sender === "customer"
											? "bg-grey-100 text-grey-1000"
											: message.sender === "ai"
											? "bg-primary-200 text-grey-1000"
											: "bg-primary-1000 text-white"
									}`}
								>
									<div className='flex items-center gap-2 mb-1'>
										{message.sender === "ai" && (
											<Bot className='w-3 h-3' />
										)}
										{message.sender === "supervisor" && (
											<User className='w-3 h-3' />
										)}
										<span className='text-xs opacity-70'>
											{message.sender === "customer"
												? "Customer"
												: message.sender === "ai"
												? "AI Agent"
												: "Supervisor"}
										</span>
										<span className='text-xs opacity-50'>
											{message.timestamp}
										</span>
									</div>
									<p className='text-sm'>{message.content}</p>
								</div>
								{message.sender !== "customer" && (
									<Avatar className='w-8 h-8'>
										<AvatarFallback>
											{message.sender === "ai" ? (
												<Bot className='w-4 h-4' />
											) : (
												<User className='w-4 h-4' />
											)}
										</AvatarFallback>
									</Avatar>
								)}
							</div>
						))}
					</div>

					{/* Message Input */}
					{isControlledBySupervisor && (
						<div className='p-4 border-t border-grey-200'>
							<div className='flex gap-2'>
								<Textarea
									value={newMessage}
									onChange={(e) =>
										setNewMessage(e.target.value)
									}
									placeholder='Type your message...'
									className='flex-1 resize-none'
									rows={2}
								/>
								<Button
									onClick={() => setShowTemplates(true)}
									className='bg-primary-100 text-grey-1000 rounded-full'
									title='Templates'
								>
									<Library className='w-5 h-5' />
								</Button>
								<Button
									onClick={toggleVoice}
									className={`rounded-full ${
										isRecording
											? "bg-[#ffc8c8] text-[#ba3a3a]"
											: "bg-primary-100 text-grey-1000"
									}`}
									title='Voice input'
								>
									{isRecording ? (
										<MicOff className='w-5 h-5' />
									) : (
										<Mic className='w-5 h-5' />
									)}
								</Button>
								<Button
									onClick={handleSendMessage}
									disabled={!newMessage.trim()}
									className='bg-primary-1000 text-white px-6 py-2 rounded-full'
								>
									Send
								</Button>
							</div>
						</div>
					)}

					{/* Return to AI Dialog */}
					{showReturnDialog && (
						<div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
							<Card className='w-96 bg-white rounded-2xl p-6'>
								<h3 className='text-lg font-medium mb-4'>
									Return Control to AI
								</h3>
								<Textarea
									value={returnNotes}
									onChange={(e) =>
										setReturnNotes(e.target.value)
									}
									placeholder='Add notes for the AI agent (optional)...'
									className='mb-4'
									rows={3}
								/>
								<div className='flex gap-2 justify-end'>
									<Button
										onClick={() =>
											setShowReturnDialog(false)
										}
										className='bg-grey-200 text-grey-1000 px-4 py-2 rounded-full'
									>
										Cancel
									</Button>
									<Button
										onClick={handleReturnToAI}
										className='bg-primary-1000 text-white px-4 py-2 rounded-full'
									>
										Return to AI
									</Button>
								</div>
							</Card>
						</div>
					)}
				</CardContent>
			</Card>
			{/* Templates Drawer */}
			{showTemplates && (
				<div className='absolute bottom-0 left-0 right-0 bg-white border-t border-grey-200 p-4'>
					<div className='flex items-center justify-between mb-3'>
						<div className='text-sm font-medium'>Templates</div>
						<Button
							className='bg-grey-200 text-grey-1000 rounded-full'
							onClick={() => setShowTemplates(false)}
						>
							Close
						</Button>
					</div>
					{templates.length === 0 ? (
						<div className='text-sm text-grey-600'>
							No templates yet. Create some in Templates page.
						</div>
					) : (
						<div className='grid grid-cols-3 gap-3 max-h-48 overflow-y-auto'>
							{templates.map((t) => (
								<button
									key={t.id}
									onClick={() => handleInsertTemplate(t)}
									className='text-left p-3 border border-grey-300 rounded-xl hover:bg-primary-100'
								>
									<div className='text-xs font-medium mb-1'>
										{t.title}
									</div>
									<div className='text-[11px] text-grey-700 line-clamp-3'>
										{t.body}
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
