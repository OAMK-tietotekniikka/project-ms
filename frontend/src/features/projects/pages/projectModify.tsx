import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import {Building2, FileText, Edit, Link, CalendarDays, Loader2Icon, ChevronsUpDown, Check} from "lucide-react";
import { type DateRange } from "react-day-picker";
import { enUS, fi } from "react-day-picker/locale";

import { useGetProjectDetails, useUpdateProject } from "@/hooks/use-projects";
import { useGetCompanies } from "@/hooks/use-companies";
import { TeacherAssignment } from "@/features/projects/components/TeacherAssignment"; // Assuming TeacherAssignment is in the same folder

interface FormData {
	project_name: string;
	project_desc: string;
	company_id: number | null;
	project_status: string;
	project_url: string;
}

const EditProject: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const role = localStorage.getItem("role");
	const { state } = useLocation();
	const projectId = state?.proj?.project_id;

	const { data: freshProjData } = useGetProjectDetails(projectId);// , { enabled: !!projectId }
	const project = freshProjData?.[0] || state?.proj;

	const [formData, setFormData] = useState<FormData>({
		project_name: "",
		project_desc: "",
		company_id: null,
		project_status: "pending",
		project_url: "",
	});

	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [currentTeacher, setCurrentTeacher] = useState({ id: null, name: "" });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [companyComboboxOpen, setCompanyComboboxOpen] = useState(false);

	const { data: companies = [] } = useGetCompanies(true);
	const updateProjectMutation = useUpdateProject();

	useEffect(() => {
		if (!projectId) {
			console.error("No project ID provided. Redirecting.");
			navigate("/", { replace: true });
		}
	}, [projectId, navigate]);

	useEffect(() => {
		if (project) {
			setFormData({
				project_name: project.project_name || "",
				project_desc: project.project_desc || "",
				company_id: project.company_id || null,
				project_status: project.project_status || "pending",
				project_url: project.project_url || "",
			});
			setDateRange({
				from: project.start_date ? new Date(project.start_date) : undefined,
				to: project.end_date ? new Date(project.end_date) : undefined,
			});
			setCurrentTeacher({
				id: project.teacher_id || null,
				name: project.teacher_name || "",
			});
		}
	}, [project]);

	const normalizeUrl = (url: string): string => {
		if (!url) return "";
		return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
	};

	const handleChange = (field: keyof FormData, value: string | number | null) => {
		const finalValue = field === "project_url" ? normalizeUrl(value as string) : value;
		setFormData((prev) => ({ ...prev, [field]: finalValue }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || !dateRange?.from) return;

		setIsSubmitting(true);
		try {
			await updateProjectMutation.mutateAsync({
				projectId,
				data: {
					...formData,
					start_date: dateRange.from.toISOString().split("T")[0],
					end_date: dateRange.to ? dateRange.to.toISOString().split("T")[0] : null,
				},
			});
			navigate("/");
		} catch (error) {
			console.error("Failed to update project:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!project) {
		return <div>Loading project details...</div>; // Or a spinner component
	}

	const isValid = formData.project_name && formData.company_id && formData.project_desc && dateRange?.from;
	const selectedCompany = companies.find((company: any) => company.company_id === formData.company_id);


	return (
		<div className="max-w-4xl mx-auto p-6">
			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
							<Edit className="w-6 h-6 text-primary-foreground" />
						</div>
						<p className="text-2xl font-semibold">{t("modifyData")}</p>
					</div>
				</CardContent>
			</Card>

			{role === "teacher" && (
				<TeacherAssignment
					projectId={projectId}
					startDate={project.start_date}
					currentTeacherId={currentTeacher.id}
					currentTeacherName={currentTeacher.name}
					onTeacherUpdate={setCurrentTeacher}
				/>
			)}

			<Card>
				<CardContent className="pt-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label className="flex items-center gap-2"><FileText className="w-4 h-4" />{t("projName")} *</Label>
							<Input value={formData.project_name} onChange={(e) => handleChange("project_name", e.target.value)} required />
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2"><Link className="w-4 h-4" />{t('url')}</Label>
							<Input value={formData.project_url} onChange={(e) => handleChange("project_url", e.target.value)} />
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2"><Building2 className="w-4 h-4" />{t("companyName")} *</Label>
							<Popover open={companyComboboxOpen} onOpenChange={setCompanyComboboxOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={companyComboboxOpen}
										className="w-full justify-between"
									>
										{selectedCompany ? selectedCompany.company_name : t("dropdownSelectCompany")}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-full p-0 h-28" align="start">
									<Command>
										<CommandInput placeholder={t("searchCompany")} />
										<CommandEmpty>{t("noCompanyFound")}</CommandEmpty>
										<CommandGroup>
											{companies.map((company: any) => (
												<CommandItem
													key={company.company_id}
													value={company.company_name}
													onSelect={() => {
														handleChange("company_id", company.company_id);
														setCompanyComboboxOpen(false);
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															formData.company_id === company.company_id ? "opacity-100" : "opacity-0"
														)}
													/>
													{company.company_name}
												</CommandItem>
											))}
										</CommandGroup>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						<div>
							<Label className="flex items-center gap-2 mb-2 capitalize"><CalendarDays className="w-4 h-4" />{t("timeline")} *</Label>
							<Drawer direction="top">
								<DrawerTrigger asChild>
									<Button id="date" variant="outline" className="w-full justify-start text-left font-normal">
										{dateRange?.from ? (
											dateRange.to ? (
												<>{dateRange.from.toLocaleDateString("fi-FI")} - {dateRange.to.toLocaleDateString("fi-FI")}</>
											) : (
												dateRange.from.toLocaleDateString("fi-FI")
											)
										) : (
											<span>{t("Pick a date")}</span>
										)}
									</Button>
								</DrawerTrigger>
								<DrawerContent className="w-auto pb-6 flex justify-center items-center">
									<Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={fi} />
								</DrawerContent>
							</Drawer>
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2"><FileText className="w-4 h-4" />{t("projDesc")} *</Label>
							<Textarea value={formData.project_desc} onChange={(e) => handleChange("project_desc", e.target.value)} rows={4} required />
						</div>

						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-4">* {t("obligatory")}</p>
							<div className="flex gap-3">
								<Button type="button" variant="outline" onClick={() => navigate("/")}>{t("cancel")}</Button>
								<Button type="submit" disabled={!isValid || isSubmitting}>
									{isSubmitting ? (
											<Loader2Icon className="animate-spin"/>
										)
										:
										(
											t("projects_updateProject")
										)
									}
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default EditProject;