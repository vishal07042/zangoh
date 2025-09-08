import React, { useState, useEffect } from "react";
import { X, Search, Send, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { api } from "../lib/api";

interface Template {
	_id: string;
	name: string;
	description?: string;
	category: string;
	content: string;
	variables: Array<{
		name: string;
		description?: string;
		defaultValue?: string;
		required: boolean;
		type: "text" | "number" | "date" | "dropdown" | "textarea";
		options?: string[];
	}>;
	useCase: string;
	tags: string[];
	usageCount: number;
	isPublic: boolean;
}

interface TemplateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectTemplate: (processedContent: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
	isOpen,
	onClose,
	onSelectTemplate,
}) => {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
		null
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [categories, setCategories] = useState<string[]>([]);
	const [variables, setVariables] = useState<Record<string, string>>({});
	const [previewContent, setPreviewContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState<"select" | "fill" | "preview">("select");

	// Fetch templates when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchTemplates();
			fetchCategories();
		}
	}, [isOpen]);

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedTemplate(null);
			setVariables({});
			setPreviewContent("");
			setStep("select");
			setSearchTerm("");
			setSelectedCategory("all");
		}
	}, [isOpen]);

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			const params: any = {
				isActive: true,
				limit: 50,
				sortBy: "usageCount",
				sortOrder: "desc",
			};

			if (searchTerm) {
				params.search = searchTerm;
			}

			if (selectedCategory !== "all") {
				params.category = selectedCategory;
			}

			const response = await api.getTemplates(params);
			setTemplates(response.items || []);
		} catch (error) {
			console.error("Error fetching templates:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await api.getTemplateCategories();
			setCategories(response.categories || []);
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	};

	// Fetch templates when search or category changes
	useEffect(() => {
		if (isOpen) {
			const debounceTimer = setTimeout(() => {
				fetchTemplates();
			}, 300);
			return () => clearTimeout(debounceTimer);
		}
	}, [searchTerm, selectedCategory, isOpen]);

	const handleTemplateSelect = (template: Template) => {
		setSelectedTemplate(template);

		// Initialize variables with default values
		const initialVariables: Record<string, string> = {};
		template.variables.forEach((variable) => {
			initialVariables[variable.name] = variable.defaultValue || "";
		});
		setVariables(initialVariables);

		if (template.variables.length > 0) {
			setStep("fill");
		} else {
			// No variables to fill, go directly to preview
			setPreviewContent(template.content);
			setStep("preview");
		}
	};

	const handleVariableChange = (variableName: string, value: string) => {
		setVariables((prev) => ({
			...prev,
			[variableName]: value,
		}));
	};

	const handlePreview = async () => {
		if (!selectedTemplate) return;

		try {
			setLoading(true);
			const response = await api.previewTemplate(
				selectedTemplate._id,
				variables
			);
			setPreviewContent(response.processedContent);
			setStep("preview");
		} catch (error) {
			console.error("Error previewing template:", error);
			// Fallback to client-side processing
			let processed = selectedTemplate.content;
			selectedTemplate.variables.forEach((variable) => {
				const value =
					variables[variable.name] ||
					variable.defaultValue ||
					`{{${variable.name}}}`;
				const regex = new RegExp(
					`{{\\\\s*${variable.name}\\\\s*}}`,
					"g"
				);
				processed = processed.replace(regex, value);
			});
			setPreviewContent(processed);
			setStep("preview");
		} finally {
			setLoading(false);
		}
	};

	const handleUseTemplate = () => {
		onSelectTemplate(previewContent);
		onClose();
	};

	const handleBack = () => {
		switch (step) {
			case "fill":
				setStep("select");
				break;
			case "preview":
				setStep(selectedTemplate?.variables.length ? "fill" : "select");
				break;
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-grey-200'>
					<div className='flex items-center gap-4'>
						{step !== "select" && (
							<Button
								onClick={handleBack}
								className='p-2 bg-grey-100 text-grey-600 rounded-lg border-0'
							>
								←
							</Button>
						)}
						<div>
							<h2 className='text-xl font-semibold text-grey-1000'>
								{step === "select" && "Choose Template"}
								{step === "fill" && "Fill Variables"}
								{step === "preview" && "Preview & Use"}
							</h2>
							{selectedTemplate && (
								<p className='text-sm text-grey-600 mt-1'>
									{selectedTemplate.name}
								</p>
							)}
						</div>
					</div>
					<Button
						onClick={onClose}
						className='p-2 bg-grey-100 text-grey-600 rounded-lg border-0'
					>
						<X className='w-5 h-5' />
					</Button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-hidden'>
					{step === "select" && (
						<div className='h-full flex flex-col'>
							{/* Search and filters */}
							<div className='p-6 border-b border-grey-200'>
								<div className='flex flex-col sm:flex-row gap-4'>
									<div className='flex-1 relative'>
										<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-500' />
										<Input
											value={searchTerm}
											onChange={(e) =>
												setSearchTerm(e.target.value)
											}
											placeholder='Search templates...'
											className='pl-10 pr-4 py-2 rounded-lg border-grey-300'
										/>
									</div>
									<select
										value={selectedCategory}
										onChange={(e) =>
											setSelectedCategory(e.target.value)
										}
										className='px-4 py-2 rounded-lg border border-grey-300 bg-white text-grey-800'
										aria-label='Category filter'
									>
										<option value='all'>
											All Categories
										</option>
										{categories.map((category) => (
											<option
												key={category}
												value={category}
											>
												{category
													.charAt(0)
													.toUpperCase() +
													category.slice(1)}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Templates list */}
							<div className='flex-1 overflow-y-auto p-6'>
								{loading ? (
									<div className='flex items-center justify-center h-32'>
										<div className='text-grey-500'>
											Loading templates...
										</div>
									</div>
								) : templates.length === 0 ? (
									<div className='flex items-center justify-center h-32'>
										<div className='text-grey-500'>
											No templates found
										</div>
									</div>
								) : (
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{templates.map((template) => (
											<Card
												key={template._id}
												className='cursor-pointer hover:shadow-md transition-shadow border border-grey-200 rounded-lg'
												onClick={() =>
													handleTemplateSelect(
														template
													)
												}
											>
												<CardContent className='p-4'>
													<div className='flex items-start justify-between mb-2'>
														<h3 className='font-medium text-grey-1000 text-sm'>
															{template.name}
														</h3>
														<Badge className='px-2 py-1 text-xs rounded-lg bg-primary-100 text-primary-800'>
															{template.category}
														</Badge>
													</div>
													{template.description && (
														<p className='text-xs text-grey-600 mb-3 line-clamp-2'>
															{
																template.description
															}
														</p>
													)}
													<div className='text-xs text-grey-500 mb-2 line-clamp-3'>
														{template.content.substring(
															0,
															150
														)}
														...
													</div>
													<div className='flex items-center justify-between'>
														<div className='flex items-center gap-2'>
															{template.variables
																.length > 0 && (
																<Badge className='px-2 py-1 text-xs rounded-lg bg-orange-100 text-orange-800'>
																	{
																		template
																			.variables
																			.length
																	}{" "}
																	variables
																</Badge>
															)}
															{template.isPublic && (
																<Badge className='px-2 py-1 text-xs rounded-lg bg-green-100 text-green-800'>
																	Shared
																</Badge>
															)}
														</div>
														<div className='text-xs text-grey-500'>
															Used{" "}
															{
																template.usageCount
															}{" "}
															times
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{step === "fill" && selectedTemplate && (
						<div className='h-full flex flex-col'>
							<div className='p-6 border-b border-grey-200'>
								<p className='text-sm text-grey-600'>
									Fill in the variables below to customize
									your template:
								</p>
							</div>
							<div className='flex-1 overflow-y-auto p-6'>
								<div className='space-y-4 max-w-2xl'>
									{selectedTemplate.variables.map(
										(variable) => (
											<div
												key={variable.name}
												className='space-y-2'
											>
												<label className='block text-sm font-medium text-grey-1000'>
													{variable.name}
													{variable.required && (
														<span className='text-red-500 ml-1'>
															*
														</span>
													)}
												</label>
												{variable.description && (
													<p className='text-xs text-grey-600'>
														{variable.description}
													</p>
												)}
												{variable.type === "dropdown" &&
												variable.options ? (
													<select
														value={
															variables[
																variable.name
															] || ""
														}
														onChange={(e) =>
															handleVariableChange(
																variable.name,
																e.target.value
															)
														}
														className='w-full px-3 py-2 border border-grey-300 rounded-lg bg-white text-grey-800'
														aria-label={`Select ${variable.name}`}
													>
														<option value=''>
															Select an option...
														</option>
														{variable.options.map(
															(option) => (
																<option
																	key={option}
																	value={
																		option
																	}
																>
																	{option}
																</option>
															)
														)}
													</select>
												) : variable.type ===
												  "textarea" ? (
													<Textarea
														value={
															variables[
																variable.name
															] || ""
														}
														onChange={(e) =>
															handleVariableChange(
																variable.name,
																e.target.value
															)
														}
														placeholder={
															variable.defaultValue ||
															`Enter ${variable.name}...`
														}
														className='w-full px-3 py-2 border border-grey-300 rounded-lg'
														rows={3}
													/>
												) : (
													<Input
														type={
															variable.type ===
															"number"
																? "number"
																: variable.type ===
																  "date"
																? "date"
																: "text"
														}
														value={
															variables[
																variable.name
															] || ""
														}
														onChange={(e) =>
															handleVariableChange(
																variable.name,
																e.target.value
															)
														}
														placeholder={
															variable.defaultValue ||
															`Enter ${variable.name}...`
														}
														className='w-full px-3 py-2 border border-grey-300 rounded-lg'
													/>
												)}
											</div>
										)
									)}
								</div>
							</div>
							<div className='p-6 border-t border-grey-200'>
								<div className='flex justify-end gap-3'>
									<Button
										onClick={handleBack}
										className='px-4 py-2 bg-grey-100 text-grey-600 rounded-lg border-0'
									>
										Back
									</Button>
									<Button
										onClick={handlePreview}
										disabled={loading}
										className='px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2'
									>
										<Eye className='w-4 h-4' />
										Preview
									</Button>
								</div>
							</div>
						</div>
					)}

					{step === "preview" && (
						<div className='h-full flex flex-col'>
							<div className='p-6 border-b border-grey-200'>
								<p className='text-sm text-grey-600'>
									Preview your customized message before using
									it:
								</p>
							</div>
							<div className='flex-1 overflow-y-auto p-6'>
								<div className='bg-grey-50 border border-grey-200 rounded-lg p-4'>
									<div className='whitespace-pre-wrap text-sm text-grey-800'>
										{previewContent}
									</div>
								</div>
							</div>
							<div className='p-6 border-t border-grey-200'>
								<div className='flex justify-end gap-3'>
									<Button
										onClick={handleBack}
										className='px-4 py-2 bg-grey-100 text-grey-600 rounded-lg border-0'
									>
										Back
									</Button>
									<Button
										onClick={handleUseTemplate}
										className='px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2'
									>
										<Send className='w-4 h-4' />
										Use Template
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
