import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
	BriefcaseIcon,
	HomeIcon,
	MessageSquareIcon,
	SettingsIcon,
	ZapIcon,
	Search as SearchIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";

const navigationItems = [
	{ icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
	{ icon: MessageSquareIcon, label: "Conversations", path: "/conversations" },
	{ icon: BriefcaseIcon, label: "AI Agents", path: "/agents" },
	{ icon: ZapIcon, label: "Templates", path: "/templates" },
];

const templateCards = [
	{ id: 1, title: "Say Hi to welcome new visitors!", type: "Chat", views: 1234, date: "Feb 7" },
	{ id: 2, title: "Ask new users if they need any help.", type: "Chat", views: 2345, date: "Feb 9" },
	{ id: 3, title: "Take new users on a tour.", type: "Message", views: 1234, date: "Feb 1" },
	{ id: 4, title: "Learn about personalised experiences.", type: "Website", views: 456, date: "Feb 7" },
	{ id: 5, title: "Guide users through a new feature.", type: "Chat", views: 1234, date: "Feb 2" },
];

const FilterSection = ({ title, items }: { title: string; items: string[] }) => (
	<div className='mb-4'>
		<div className='text-[11px] text-grey-600 mb-2'>{title}</div>
		<div className='flex flex-col gap-2'>
			{items.map((it) => (
				<button key={it} className='text-left px-3 py-2 rounded-lg hover:bg-primary-100 text-sm'>
					{it}
				</button>
			))}
		</div>
	</div>
);

const TemplateCard = ({ title, type, views, date }: any) => (
	<div className='rounded-xl border border-grey-300 p-3 w-[260px] bg-white'>
		<div className='rounded-lg border border-grey-300 h-14 bg-[#f6f5f9] mb-3' />
		<div className='text-[11px] text-grey-600 mb-1'>
			<span className='inline-block bg-[#f0eef6] px-2 py-[2px] rounded-full mr-1'>
				{type}
			</span>
		</div>
		<div className='text-xs text-grey-1000 leading-snug mb-3'>{title}</div>
		<div className='flex items-center gap-2 text-[10px] text-grey-600'>
			<span className='inline-block bg-[#f0eef6] px-2 py-[2px] rounded-full'>{views}</span>
			<span className='inline-block bg-[#f0eef6] px-2 py-[2px] rounded-full'>{date}</span>
		</div>
	</div>
);

export const Templates = (): JSX.Element => {
	const location = useLocation();

	return (
		<div className='bg-[#ecebf1] grid justify-items-center [align-items:start] w-screen'>
			<div className='bg-primary-100 w-[1440px] h-[1024px]'>
				<div className='flex flex-col w-[1376px] h-[960px] items-start gap-6 relative top-8 left-8'>
					<header className='flex items-center justify-between px-10 py-4 relative self-stretch w-full flex-[0_0_auto] bg-primary-1000 rounded-3xl overflow-hidden'>
						<div className="relative w-fit [font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-100 text-base tracking-[0] leading-[normal]">
							ABC Company
						</div>
						<Avatar className='w-8 h-8'>
							<AvatarImage src='/ellipse-1.png' alt='Profile' />
							<AvatarFallback>AC</AvatarFallback>
						</Avatar>
					</header>

					<div className='flex items-center gap-4 relative flex-1 self-stretch w-full grow'>
						{/* Icon-only sidebar */}
						<nav className='flex flex-col w-[72px] items-center justify-between py-6 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className='flex flex-col items-center gap-6'>
								{navigationItems.map((item, index) => {
									const isActive = location.pathname === item.path;
									const Icon = item.icon;
									return (
										<Link key={index} to={item.path} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-primary-200" : "bg-transparent hover:bg-primary-100"}`}>
											<Icon className='w-5 h-5' />
										</Link>
									);
								})}
							</div>
							<Link to='/settings' className='w-10 h-10 rounded-xl flex items-center justify-center bg-transparent hover:bg-primary-100'>
								<SettingsIcon className='w-5 h-5' />
							</Link>
						</nav>

						{/* Filters panel */}
						<aside className='w-[260px] bg-white rounded-3xl p-4 h-full overflow-hidden'>
							<div className='relative mb-4'>
								<SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-500' />
								<Input placeholder='Search' className='pl-9 rounded-full' />
								<div className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-primary-100 rounded-full px-2 py-[2px]'>20</div>
							</div>
							<FilterSection title='' items={["All", "Popular"]} />
							<FilterSection title='Use Cases' items={["Onboarding", "Return", "Engagement", "Transaction"]} />
							<FilterSection title='Channels' items={["Website", "Mobile", "Messenger"]} />
							<div className='absolute bottom-4 left-0 right-0 px-4'>
								<div className='h-px bg-grey-200 mb-3' />
								<div className='text-[11px] text-grey-600'>Tips: Select a use case to narrow results</div>
							</div>
						</aside>

						{/* Main content */}
						<main className='flex-1 bg-white rounded-3xl p-6 flex flex-col'>
							<div className='flex items-center justify-between mb-4'>
								<div className="[font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl">Response Templates</div>
								<Button
									className='rounded-full bg-primary-1000 text-white'
									onClick={() => {
										const title = prompt("Template Title")?.trim();
										if (!title) return;
										const body = prompt("Template Body (use {{variable}} placeholders)")?.trim() || "";
										const existing = JSON.parse(localStorage.getItem("responseTemplates") || "[]");
										const updated = [{ id: Date.now().toString(), title, body }, ...existing];
										localStorage.setItem("responseTemplates", JSON.stringify(updated));
										alert("Template saved. It will be available in Conversations -> Templates drawer.");
									}}
								>
									Create Template
								</Button>
							</div>
							<Tabs defaultValue='mine'>
								<div className='flex items-center justify-between mb-4'>
									<TabsList className='bg-transparent p-0 h-auto gap-3'>
										<TabsTrigger value='mine' className='px-4 py-2 rounded-full data-[state=active]:bg-primary-1000 data-[state=active]:text-white bg-grey-100'>My Templates</TabsTrigger>
										<TabsTrigger value='shared' className='px-4 py-2 rounded-full data-[state=active]:bg-primary-1000 data-[state=active]:text-white bg-grey-100'>Shared Templates</TabsTrigger>
									</TabsList>
								</div>
							</Tabs>

							<div className='grid grid-cols-3 gap-6 pt-2'>
								{templateCards.map((t) => (
									<TemplateCard key={t.id} {...t} />
								))}
							</div>
							<div className='mt-auto pt-6'>
								<div className='rounded-3xl border border-grey-200 p-4 bg-[#f7f6fb]'>
									<div className='text-[12px] text-grey-600'>Select a card to reveal actions (edit, clone, share)</div>
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};
