import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	FileText,
	Building2,
	CalendarDays,
	CheckCircle,
	ArrowRight,
	ArrowLeft,
	X,
} from "lucide-react";
import { useCreateProject } from "@/features/projects/hooks/useProjects.hook";
import {
	useCreateCompany,
	useGetCompanies,
} from "@/features/companies/hooks/useCompanies.hook";
import { toast } from "sonner";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/shared/components/ui/calendar";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
} from "@/shared/components/ui/drawer";
import general_success from "@/assets/general_success_2.svg";

interface FormData {
	project_name: string;
	project_desc: string;
	company_id: number | null;
	company_name: string;
	project_url: string;
	start_date: string;
	end_date: string;
}

const INITIAL_FORM_DATA: FormData = {
	project_name: "",
	project_desc: "",
	company_id: null,
	company_name: "",
	project_url: "",
	start_date: "",
	end_date: "",
};

export const CreateProject: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const role = localStorage.getItem("role");
	const { data: companies = [] } = useGetCompanies(true);
	const createProjectMutation = useCreateProject();
	const createCompanyMutation = useCreateCompany();

	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: new Date(),
		to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
	});

	const STEPS = [
		{ title: t("projects_createProject_steps_title_1"), icon: FileText },
		{ title: t("projects_createProject_steps_title_2"), icon: Building2 },
		{ title: t("projects_createProject_steps_title_3"), icon: CalendarDays },
	];

	useEffect(() => {
		if (dateRange?.from) {
			setFormData((prev) => ({
				...prev,
				start_date: dateRange.from!.toISOString().split("T")[0],
				end_date: dateRange.to ? dateRange.to.toISOString().split("T")[0] : "",
			}));
		}
	}, [dateRange]);

	const handleChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: field === "project_url" ? normalizeUrl(value) : value,
		}));
	};

	const normalizeUrl = (url: string): string => {
		if (!url || url.startsWith("http")) return url;
		return `https://${url}`;
	};

	const handleCompanySelect = (companyId: string) => {
		const company = companies.find(
			(c: any) => c.company_id.toString() === companyId,
		);
		if (company) {
			setFormData((prev) => ({
				...prev,
				company_id: company.company_id,
				company_name: company.company_name,
			}));
		}
	};

	const handleSubmit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			let finalCompanyId = formData.company_id;

			if (!finalCompanyId && formData.company_name) {
				const newCompany = await createCompanyMutation.mutateAsync({
					company_name: formData.company_name,
				});
				finalCompanyId = newCompany?.[0].company_id;
			}

			await createProjectMutation.mutateAsync({
				...formData,
				project_status: "pending",
				company_id: finalCompanyId,
				start_date: new Date(formData.start_date),
				end_date: formData.end_date ? new Date(formData.end_date) : null,
			});

			setShowSuccess(true);
		} catch (error) {
			toast.error("Failed to create project. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
	const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

	const isStepValid = () => {
		switch (currentStep) {
			case 1:
				return formData.project_name.trim() !== "";
			case 2:
				return formData.company_name.trim() !== "";
			case 3:
				return (
					formData.project_desc.trim() !== "" && formData.start_date !== ""
				);
			default:
				return false;
		}
	};

	const resetForm = () => {
		setShowSuccess(false);
		setCurrentStep(1);
		setFormData(INITIAL_FORM_DATA);
	};

	// Success Screen
	if (showSuccess) {
		return (
			<div className="min-h-screen bg-background p-6">
				<div className="max-w-md mx-auto">
					<Card className="text-center">
						<CardContent className="pt-8 pb-8">
							<div className="flex justify-center mb-6">
								<img src={general_success} alt="" className="h-24" />
							</div>
							<p className="text-xl font-semibold mb-2">
								{t("projects_createProject_success_1")}
							</p>
							<p className="text-muted-foreground mb-6">
								{t("projects_createProject_success_2")}
							</p>
							<div className="space-y-4">
								<Button
									onClick={resetForm}
									className="w-full hover:cursor-pointer"
								>
									{t("projects_createProject_createAnother")}
								</Button>

								<Button
									variant="outline"
									onClick={() => navigate("/")}
									className="w-full hover:cursor-pointer"
								>
									{t("projects_createProject_backToProjects")}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto space-y-6 p-6">
				{/* Header */}
				<Card>
					<CardContent>
						<div className="flex items-center space-x-3 mb-4">
							<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
								<FileText className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xl sm:text-2xl font-semibold">
									{t("createProj") || "Create New Project"}
								</p>
								<p className="text-sm text-muted-foreground">
									{t("projects_createProject_steps", {
										currentStep: currentStep,
									})}
								</p>
							</div>
						</div>

						{/* Progress Bar */}
						<div className="w-full bg-muted rounded-full h-2 mb-4">
							<div
								className="bg-primary h-2 rounded-full transition-all duration-1000"
								style={{ width: `${(currentStep / 3) * 100}%` }}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Form */}
				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="text-center mb-6">
							<p className="text-lg font-semibold mb-2">
								{STEPS[currentStep - 1].title}
							</p>
						</div>

						<div className="space-y-8">
							{/* Step 1: Basic Info */}
							{currentStep === 1 && (
								<>
									<div className="space-y-4">
										<Label>{t("projName") || "Project Name"} *</Label>
										<Input
											value={formData.project_name}
											onChange={(e) =>
												handleChange("project_name", e.target.value)
											}
											placeholder="Enter project name"
										/>
									</div>
									<div className="space-y-4">
										<Label>{t("url") || "Project URL"} (Optional)</Label>
										<Input
											value={formData.project_url}
											onChange={(e) =>
												handleChange("project_url", e.target.value)
											}
											placeholder="https://example.com"
										/>
									</div>
								</>
							)}

							{/* Step 2: Company & Timeline */}
							{currentStep === 2 && (
								<>
									<div className="space-y-4">
										<Label>{t("companyName") || "Company"} *</Label>
										<Select
											value={formData.company_id?.toString() ?? ""}
											onValueChange={handleCompanySelect}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select existing company" />
											</SelectTrigger>
											<SelectContent className="h-36">
												{companies.map((company: any) => (
													<SelectItem
														key={company.company_id}
														value={company.company_id.toString()}
													>
														{company.company_name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											value={formData.company_name}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													company_name: e.target.value,
													company_id: null,
												}))
											}
											placeholder="Or enter new company name"
										/>
									</div>
									<div className="space-y-4">
										<Label className="capitalize">{t("timeline")}</Label>
										<Drawer>
											<DrawerTrigger asChild>
												<Button
													variant="outline"
													className="w-full justify-start"
												>
													<CalendarDays className="mr-2 h-4 w-4" />
													{dateRange?.from
														? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || ""}`
														: "Pick dates"}
												</Button>
											</DrawerTrigger>
											<DrawerContent>
												<div className="flex justify-center py-4">
													<Calendar
														mode="range"
														selected={dateRange}
														onSelect={setDateRange}
														numberOfMonths={1}
													/>
												</div>
											</DrawerContent>
										</Drawer>
									</div>
								</>
							)}

							{/* Step 3: Details */}
							{currentStep === 3 && (
								<>
									<div className="space-y-4">
										<Label>{t("projDesc") || "Project Description"} *</Label>
										<Textarea
											value={formData.project_desc}
											onChange={(e) =>
												handleChange("project_desc", e.target.value)
											}
											placeholder="Describe your project goals and requirements..."
											rows={6}
										/>
									</div>
									<div className="p-4 bg-muted rounded-xl">
										<p className="text-lg font-medium mb-2">Summary</p>
										<div className="space-y-2 text-md">
											<div>
												<u className="capitalize">{t("name")}:</u>
												<span className="ml-2">{formData.project_name}</span>
											</div>
											<div>
												<u className="capitalize">{t("company")}:</u>
												<span className="ml-2">{formData.company_name}</span>
											</div>
											<div>
												<u className="capitalize">{t("startDate")}:</u>
												<span className="ml-2">{formData.start_date}</span>
											</div>
											<div>
												<u className="capitalize">{t("dueDate")}:</u>
												<span className="ml-2">{formData.end_date}</span>
											</div>
											{formData.project_url && (
												<div>
													<u>URL:</u>
													<span className="ml-2">{formData.project_url}</span>
												</div>
											)}
										</div>
									</div>
								</>
							)}
						</div>

						{/* Navigation */}
						<div className="flex justify-between items-center pt-6 border-t mt-6 ">
							<div className="flex gap-4">
								{currentStep > 1 && (
									<Button
										variant="outline"
										className="hover:cursor-pointer"
										onClick={prevStep}
									>
										<ArrowLeft className="w-4 h-4" />
										{t("back")}
									</Button>
								)}
								<Button
									variant="outline"
									className="hover:cursor-pointer"
									onClick={() =>
										navigate(
											role === "teacher" || role === "student" ? "/" : "/login",
										)
									}
								>
									<X className="w-4 h-4" />
									{t("cancel")}
								</Button>
							</div>
							<div>
								{currentStep < 3 ? (
									<Button onClick={nextStep} disabled={!isStepValid()}>
										{t("next")}
										<ArrowRight className="w-4 h-4 ml-2" />
									</Button>
								) : (
									<Button
										onClick={handleSubmit}
										disabled={!isStepValid() || isSubmitting}
									>
										{isSubmitting ? t("loading") : t("createProj")}
									</Button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default CreateProject;
