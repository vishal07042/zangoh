import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
	BriefcaseIcon,
	HomeIcon,
	MessageSquareIcon,
	SettingsIcon,
	ZapIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

const navigationItems = [
	{ icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
	{ icon: MessageSquareIcon, label: "Conversations", path: "/conversations" },
	{ icon: BriefcaseIcon, label: "AI Agents", path: "/agents" },
	{ icon: ZapIcon, label: "Templates", path: "/templates" },
];

export const Settings = (): JSX.Element => {
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
						<nav className='flex flex-col w-[280px] items-start justify-between p-8 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className='flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]'>
								{navigationItems.map((item, index) => {
									const isActive = location.pathname === item.path;
									return (
										<Link
											key={index}
											to={item.path}
											className={`flex flex-col items-start gap-2 p-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg cursor-pointer transition-colors ${
												isActive ? "bg-primary-200" : "hover:bg-primary-100"
											}`}
										>
											<div className='flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]'>
												<item.icon className='relative w-6 h-6' />
												<div
													className={`relative flex-1 mt-[-1.00px] text-grey-1000 text-xl tracking-[0] leading-[normal] ${
														isActive
															? "[font-family:'General_Sans-Medium',Helvetica] font-medium"
															: "[font-family:'General_Sans-Regular',Helvetica] font-normal"
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
								to="/settings"
								className={`flex flex-col items-start gap-2 p-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg cursor-pointer transition-colors ${
									location.pathname === "/settings" ? "bg-primary-200" : "hover:bg-primary-100"
								}`}
							>
								<div className='flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]'>
									<SettingsIcon className='relative w-6 h-6' />
									<div className={`relative flex-1 mt-[-1.00px] text-grey-1000 text-xl tracking-[0] leading-[normal] ${
										location.pathname === "/settings"
											? "[font-family:'General_Sans-Medium',Helvetica] font-medium"
											: "[font-family:'General_Sans-Regular',Helvetica] font-normal"
									}`}>
										Settings
									</div>
								</div>
							</Link>
						</nav>

						<main className='flex items-center justify-center flex-1 self-stretch grow bg-white rounded-3xl'>
							<div className='text-2xl text-grey-1000'>
								Settings page (coming soon)
							</div>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};
