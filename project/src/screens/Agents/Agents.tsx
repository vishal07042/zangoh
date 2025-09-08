import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	BriefcaseIcon,
	HomeIcon,
	MessageSquareIcon,
	SettingsIcon,
	ZapIcon,
} from "lucide-react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Slider } from "../../components/ui/slider";

const navigationItems = [
	{ icon: HomeIcon, label: "Dashboard", path: "/dashboard" },
	{ icon: MessageSquareIcon, label: "Conversations", path: "/conversations" },
	{ icon: BriefcaseIcon, label: "AI Agents", path: "/agents" },
	{ icon: ZapIcon, label: "Templates", path: "/templates" },
];

const capabilityOptions = [
	"Decision Making",
	"Autonomy",
	"Learning",
	"Perception",
];

export const Agents = (): JSX.Element => {
	const location = useLocation();

	const [topP, setTopP] = useState<number[]>([0.7]);
	const [speed, setSpeed] = useState<number[]>([50]);
	const [personality, setPersonality] = useState<number[]>([50]);
	const [stability, setStability] = useState<number[]>([70]);
	const [maxTokens, setMaxTokens] = useState<number>(10);
	const [selectedCaps, setSelectedCaps] = useState<string[]>([
		"Decision Making",
		"Perception",
	]);
	const [kbAccess, setKbAccess] = useState({
		permissions: true,
		internal: true,
		public: true,
	});
	const [escalateMins, setEscalateMins] = useState<number>(10);

	const toggleCap = (name: string) => {
		setSelectedCaps((prev) =>
			prev.includes(name)
				? prev.filter((c) => c !== name)
				: [...prev, name]
		);
	};

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
						{/* Compact icon-only sidebar like the screenshot */}
						<nav className='flex flex-col w-[72px] items-center justify-between py-6 relative self-stretch bg-white rounded-3xl overflow-hidden'>
							<div className='flex flex-col items-center gap-6'>
								{navigationItems.map((item, index) => {
									const isActive =
										location.pathname === item.path;
									const Icon = item.icon;
									return (
										<Link
											key={index}
											to={item.path}
											className={`w-10 h-10 rounded-xl flex items-center justify-center ${
												isActive
													? "bg-primary-200"
													: "bg-transparent hover:bg-primary-100"
											}`}
										>
											<Icon className='w-5 h-5' />
										</Link>
									);
								})}
							</div>
							<Link
								to='/settings'
								className='w-10 h-10 rounded-xl flex items-center justify-center bg-transparent hover:bg-primary-100'
							>
								<SettingsIcon className='w-5 h-5' />
							</Link>
						</nav>

						{/* Main card */}
						<main className='flex flex-col gap-6 flex-1 self-stretch grow bg-white rounded-3xl p-8'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-4'>
									<div className="[font-family:'General_Sans-Medium',Helvetica] font-medium text-grey-1000 text-xl">
										Configure your AI Agent
									</div>
									<select className='px-3 py-1 rounded-full border border-grey-300 text-sm'>
										<option>CSR AI Agent</option>
										<option>Sales AI Agent</option>
									</select>
								</div>
								<div className='flex items-center gap-3'>
									<Button className='rounded-full bg-primary-100 text-grey-1000 border-0'>
										Reset Changes
									</Button>
									<Button className='rounded-full bg-primary-1000 text-white'>
										Save Changes
									</Button>
								</div>
							</div>

							<div className='flex items-start justify-between'>
								<div className='grid grid-cols-4 gap-4 flex-1'>
									{/* Top-p */}
									<div className='border border-grey-300 rounded-xl p-4'>
										<div className='text-sm text-grey-800 mb-3'>
											Top-p
										</div>
										<div className='px-1'>
											<Slider
												value={topP}
												min={0}
												max={1}
												step={0.01}
												onValueChange={setTopP}
											/>
											<div className='mt-2 text-xs text-grey-600'>
												<span className='inline-block bg-primary-200 text-grey-1000 rounded-full px-2 py-[2px]'>
													{topP[0].toFixed(1)}
												</span>
											</div>
										</div>
									</div>
									{/* Speed */}
									<div className='border border-grey-300 rounded-xl p-4'>
										<div className='text-sm text-grey-800 mb-1'>
											Speed
										</div>
										<div className='flex justify-between text-xs text-grey-600 px-1'>
											<span>Slow</span>
											<span>Fast</span>
										</div>
										<div className='px-1'>
											<Slider
												value={speed}
												onValueChange={setSpeed}
											/>
										</div>
									</div>
									{/* Personality */}
									<div className='border border-grey-300 rounded-xl p-4'>
										<div className='text-sm text-grey-800 mb-1'>
											Personality
										</div>
										<div className='flex justify-between text-xs text-grey-600 px-1'>
											<span>Formal</span>
											<span>Informal</span>
										</div>
										<div className='px-1'>
											<Slider
												value={personality}
												onValueChange={setPersonality}
											/>
										</div>
									</div>
									{/* Stability */}
									<div className='border border-grey-300 rounded-xl p-4'>
										<div className='text-sm text-grey-800 mb-1'>
											Stability
										</div>
										<div className='flex justify-between text-xs text-grey-600 px-1'>
											<span>Stable</span>
											<span>Variable</span>
										</div>
										<div className='px-1'>
											<Slider
												value={stability}
												onValueChange={setStability}
											/>
										</div>
									</div>
								</div>
								<div className='ml-4 flex flex-col items-end gap-2 w-[120px]'>
									<div className='text-xs text-grey-600'>
										Max Tokens
									</div>
									<Input
										type='number'
										value={maxTokens}
										onChange={(e) =>
											setMaxTokens(
												parseInt(e.target.value || "0")
											)
										}
										className='w-16 h-8 rounded-lg text-center'
									/>
								</div>
							</div>

							{/* Capabilities */}
							<div>
								<div className='text-sm text-grey-800 mb-2'>
									Capabilities
								</div>
								<div className='flex flex-wrap gap-3'>
									{capabilityOptions.map((cap) => {
										const selected =
											selectedCaps.includes(cap);
										return (
											<button
												key={cap}
												onClick={() => toggleCap(cap)}
												className={`px-4 py-2 rounded-full text-sm border ${
													selected
														? "bg-primary-1000 text-white border-transparent"
														: "bg-white text-grey-1000 border-grey-300"
												}`}
											>
												{cap}
												{selected && (
													<span className='ml-2'>
														✓
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Knowledge Base Access */}
							<div className='grid grid-cols-2 gap-6 items-start'>
								<div>
									<div className='text-sm text-grey-800 mb-2'>
										Knowledge Base Access
									</div>
									<label className='flex items-center gap-2 text-sm text-grey-1000 mb-2'>
										<input
											type='checkbox'
											checked={kbAccess.permissions}
											onChange={(e) =>
												setKbAccess({
													...kbAccess,
													permissions:
														e.target.checked,
												})
											}
										/>
										Permissions
									</label>
									<label className='flex items-center gap-2 text-sm text-grey-1000 mb-2'>
										<input
											type='checkbox'
											checked={kbAccess.internal}
											onChange={(e) =>
												setKbAccess({
													...kbAccess,
													internal: e.target.checked,
												})
											}
										/>
										Internal Articles
									</label>
									<label className='flex items-center gap-2 text-sm text-grey-1000'>
										<input
											type='checkbox'
											checked={kbAccess.public}
											onChange={(e) =>
												setKbAccess({
													...kbAccess,
													public: e.target.checked,
												})
											}
										/>
										Public Articles
									</label>
								</div>
								<div className='text-xs text-grey-500 mt-6 space-y-6'>
									<div className='text-right'>
										Last Updated: 18d Ago
									</div>
									<div className='text-right'>
										Last Updated: 2d Ago
									</div>
									<div className='text-right'>
										Last Updated: 7d Ago
									</div>
								</div>
							</div>

							{/* Escalation Thresholds */}
							<div>
								<div className='text-sm text-grey-800 mb-2'>
									Escalation Thresholds
								</div>
								<div className='text-sm text-grey-1000 flex items-center gap-2'>
									Escalate automatically if Agent has not
									responded in
									<Input
										type='number'
										value={escalateMins}
										onChange={(e) =>
											setEscalateMins(
												parseInt(e.target.value || "0")
											)
										}
										className='w-14 h-8 rounded-lg text-center'
									/>
									minutes
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>
		</div>
	);
};
