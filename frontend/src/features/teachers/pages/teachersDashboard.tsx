import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getStudyYear } from "@/shared/utils/GetStudyYear";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
	BookOpen,
	Calendar,
	ChartLine,
	Building2,
	Heart,
	Users,
	Search, // Added Search Icon
} from "lucide-react";

import { useTeacherProfile } from "@/features/teachers/hooks/useTeachers.hook";
import { useAnyTeacherResources } from "@/features/teachers/hooks/useResources.hook";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import FavoriteCompaniesDialog from "@/features/companies/components/CompanyFavoriteDialog";
import { useGetUserProjects } from "@/features/projects/hooks/useProjects.hook";
import general_teacher from "@/assets/general_teacher.svg";
import { getInitials } from "@/shared/utils/getInitials";
import { Input } from "@/shared/components/ui/input"; // Added Input component

const TeachersDashboard: React.FC = () => {
	const { t } = useTranslation();
	const currentDate = new Date();
	const studyYear = getStudyYear(currentDate);

	const [showCompaniesDialog, setShowCompaniesDialog] = useState(false);
	const [searchTerm, setSearchTerm] = useState(""); // State for the search input

	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useTeacherProfile();

	const teacherId = profile?.[0]?.teacher_id;
	const {
		data: resources,
		isLoading: isResourcesLoading,
		error: resourcesError,
	} = useAnyTeacherResources(teacherId);

	const {
		data: projectsRaw,
		isLoading: isProjectsLoading,
		error: projectsError,
	} = useGetUserProjects();

	const navigate = useNavigate();

	// --- DATA PROCESSING ---
	const projects = projectsRaw?.map((proj) => ({
		...proj,
		display_names: proj.student_names_cache?.replace(/,\s*/g, "\n") || "",
	}));

	if (profileError) {
		//logout();
	}

	const formatDate = (dateString) => {
		if (!dateString) return "Not set";
		const date = dayjs(dateString);
		if (!date.isValid() || date.year() === 1970) {
			return "Not set";
		}
		return date.format("DD.MM.YYYY");
	};

	const teacherCurrentResource = resources
		? resources.find((r) => r.study_year === studyYear)
		: null;

	const filteredProjects = projects
		? projects.filter(
				(proj) =>
					proj.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					proj.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(proj.student_names_cache &&
						proj.student_names_cache
							.toLowerCase()
							.includes(searchTerm.toLowerCase())),
			)
		: [];

	const ongoingProjects = filteredProjects.filter(
		(proj) =>
			proj.project_status &&
			!["completed", "finished", "done", "closed"].includes(
				proj.project_status.toLowerCase(),
			),
	);

	const pastProjects = filteredProjects.filter(
		(proj) =>
			proj.project_status &&
			["completed", "finished", "done", "closed"].includes(
				proj.project_status.toLowerCase(),
			),
	);

	const getResourceStatus = (used: number, total: number) => {
		const percentage = (used / total) * 100;
		if (percentage >= 90) return "full";
		if (percentage >= 50) return "partial";
		return "low";
	};

	const resourceStatus = teacherCurrentResource
		? getResourceStatus(
				teacherCurrentResource.used_resources,
				teacherCurrentResource.total_resources,
			)
		: "none";

	const getResourceStatusColor = (status: string) => {
		switch (status) {
			case "full":
				return "bg-primary/30";
			case "partial":
				return "bg-primary/80";
			case "low":
				return "bg-primary";
			default:
				return "bg-primary/20";
		}
	};

	const percentage =
		teacherCurrentResource && teacherCurrentResource.total_resources > 0
			? Math.round(
					(teacherCurrentResource?.used_resources /
						teacherCurrentResource?.total_resources) *
						100,
				)
			: 0;

	// --- SUB-COMPONENTS ---
	const ProjectsList = ({ projectsList, emptyMessage }) =>
		projectsList && projectsList.length > 0 ? (
			<div className="space-y-1">
				{/* Table Header */}
				<div className="grid grid-cols-5 gap-4 py-3 px-4 bg-card rounded-xl text-sm font-medium">
					<span>{t("project")}</span>

					<div className="flex items-center space-x-1">
						<Building2 className="w-4 h-4" />
						<span>{t("company")}</span>
					</div>
					<div className="flex items-center space-x-1">
						<Calendar className="w-4 h-4" />
						<span>{t("dueDate")}</span>
					</div>
					<div className="flex items-center space-x-1">
						<ChartLine className="w-4 h-4" />
						<span>{t("status")}</span>
					</div>
					<div className="flex items-center space-x-1">
						<Users className="w-4 h-4" />
						<span>{t("students")}</span>
					</div>
				</div>

				{/* Project Rows */}
				<div className="space-y-2">
					{projectsList.map((proj) => (
						<div
							key={proj.project_id}
							onClick={() =>
								navigate(`/projects/${proj.project_id}`, {
									state: { proj },
								})
							}
							className="grid grid-cols-5 gap-4 py-4 px-4 rounded-xl hover:bg-accent cursor-pointer border items-center"
						>
							<div>
								<span className="text-sm font-medium capitalize">
									{proj.project_name}
								</span>
							</div>
							<div className="text-sm">{proj.company_name}</div>
							<div className="text-sm">{formatDate(proj.end_date)}</div>
							<div className="text-sm">{t(proj.project_status)}</div>
							<div className="text-sm  whitespace-pre-line">
								{proj.display_names}
							</div>
						</div>
					))}
				</div>
			</div>
		) : (
			!isProjectsLoading && (
				<div className="flex flex-col items-center text-center py-12">
					<img src={general_teacher} alt="" className="h-32" />
					<p className="font-medium text-muted-foreground mb-6">
						{t("projects_noProjectsFound")}
					</p>
				</div>
			)
		);

	// --- RENDER ---
	return (
		<div className="max-w-4xl mx-auto space-y-6 p-6 ">
			{/* Teacher Info Card */}
			<Card className="pt-6">
				<CardContent>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center font-semibold uppercase">
								{profile && getInitials(profile?.[0]?.teacher_name)}
							</div>
							<div>
								<p className="text-xl font-semibold capitalize">
									{profile ? profile[0].teacher_name : ""}
								</p>
								<p className="text-sm text-muted-foreground">
									{profile ? profile[0].email : ""}
								</p>
							</div>
						</div>
						{profile && (
							<Button
								onClick={() => setShowCompaniesDialog(true)}
								variant="outline"
								className="flex items-center gap-2 hover:cursor-pointer"
							>
								<Heart className="h-4 w-4" />
								{t("favoriteCompanies", { defaultValue: "Favorite companies" })}
							</Button>
						)}
					</div>

					<FavoriteCompaniesDialog
						open={showCompaniesDialog}
						onOpenChange={setShowCompaniesDialog}
					/>

					<div className="pt-6 border-t mt-6">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center space-x-2">
								<BookOpen className="w-4 h-4 text-muted-foreground" />
								<span className="capitalize text-sm font-medium text-muted-foreground">
									{t("resources", { defaultValue: "resources" })} ({studyYear})
								</span>
							</div>
						</div>

						<div className="space-y-3">
							{/* Progress Bar */}
							<div className="w-full bg-background rounded-full h-2 overflow-hidden">
								<div
									className={`h-full rounded-full transition-all duration-500 ease-out ${getResourceStatusColor(resourceStatus)}`}
									style={{
										width: `${Math.min(percentage, 100)}%`,
									}}
								/>
							</div>

							{/* Usage Statistics */}
							<div className="flex justify-between items-center text-sm">
								<div className="flex items-center space-x-4">
									<span className="text-muted-foreground">
										<span className="font-semibold text-foreground">
											{teacherCurrentResource?.used_resources || 0}
										</span>{" "}
										{t("used", { defaultValue: "used" })}
									</span>
									<span className="text-muted-foreground">
										<span className="font-semibold text-foreground">
											{teacherCurrentResource
												? teacherCurrentResource.total_resources -
													teacherCurrentResource.used_resources
												: 0}
										</span>{" "}
										{t("remaining", { defaultValue: "remaining" })}
									</span>
								</div>
								<div className="text-right">
									<span className="text-sm font-semibold text-foreground">
										{percentage || 0}%
									</span>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Projects Section with Tabs */}
			<Card className="border-0 shadow-sm">
				<CardContent>
					{/* Search Input */}
					<div className="relative mb-4">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("projects_search", {
								defaultValue: "Search by project, company, or student...",
							})}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					<Tabs defaultValue="ongoing" className="w-full">
						<TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
							<TabsTrigger
								value="ongoing"
								className="dark:data-[state=active]:bg-card"
							>
								{t("projects_current")} ({ongoingProjects.length})
							</TabsTrigger>
							<TabsTrigger
								value="past"
								className="dark:data-[state=active]:bg-card"
							>
								{t("projects_past")} ({pastProjects.length})
							</TabsTrigger>
						</TabsList>
						<TabsContent value="ongoing" className="mt-4">
							<ProjectsList
								projectsList={ongoingProjects}
								emptyMessage="No ongoing projects"
							/>
						</TabsContent>
						<TabsContent value="past" className="mt-4">
							<ProjectsList
								projectsList={pastProjects}
								emptyMessage={t("noProjects")}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};

export default TeachersDashboard;
