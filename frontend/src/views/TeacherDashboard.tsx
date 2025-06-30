import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getStudyYear } from "@/components/GetStudyYear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	User,
	BookOpen,
	FolderOpen,
	Calendar,
	ChartLine,
	Building2,
	Heart,
} from "lucide-react";

import { useTeacherProfile } from "@/hooks/useTeachers";
import { useTeacherResources } from "@/hooks/useResources";
import { useTeacherProjects } from "@/hooks/useTeachers";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FavoriteCompaniesDialog from "@/components/TeacherUI/FavoCompaniesDialog";

const TeacherDashboard: React.FC = () => {
	const { t } = useTranslation();
	const currentDate = new Date();
	const studyYear = getStudyYear(currentDate);
	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useTeacherProfile();

	const {
		data: resources,
		isLoading: isResourcesLoading,
		error: resourcesError,
	} = useTeacherResources();

	const {
		data: projects,
		isLoading: isProjectsLoading,
		error: projectsError,
	} = useTeacherProjects();

	const [showCompaniesDialog, setShowCompaniesDialog] = useState(false);

	const navigate = useNavigate();

	const formatDate = (dateString) => {
		if (!dateString) return "Not set";

		const date = dayjs(dateString);
		if (!date.isValid() || date.year() === 1970) {
			return "Not set";
		}

		return date.format("DD.MM.YYYY");
	};

	const teacherId = profile?.teacher_id || null;
	const teacherCurrentResource = resources ? resources[0] : null; //
	console.log("teacher resources", teacherCurrentResource);

	// Filter projects based on status
	const ongoingProjects = projects
		? projects.filter(
				(proj) =>
					proj.project_status &&
					!["completed", "finished", "done", "closed"].includes(
						proj.project_status.toLowerCase(),
					),
			)
		: [];

	const pastProjects = projects
		? projects.filter(
				(proj) =>
					proj.project_status &&
					["completed", "finished", "done", "closed"].includes(
						proj.project_status.toLowerCase(),
					),
			)
		: [];

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
				return "bg-primary/60";
			case "low":
				return "bg-primary";
			default:
				return "bg-primary/20";
		}
	};

	const percentage = teacherCurrentResource
		? Math.round(
				(teacherCurrentResource.used_resources /
					teacherCurrentResource.total_resources) *
					100,
			)
		: 0;

	const ProjectsList = ({ projectsList, emptyMessage }) =>
		projectsList && projectsList.length > 0 ? (
			<div className="space-y-1">
				<p className="text-sm text-muted-foreground mb-4">
					{t("projListBelow")}
				</p>

				{/* Table Header */}
				<div className="grid grid-cols-4 gap-4 py-3 px-4 bg-card rounded-lg text-sm font-medium">
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
				</div>

				{/* Project Rows */}
				<div className="space-y-2">
					{projectsList.map((proj) => (
						<div
							key={proj.project_id}
							onClick={() =>
								navigate(`/studentProject/${proj.project_id}`, {
									state: { proj },
								})
							}
							className="grid grid-cols-4 gap-4 py-4 px-4 rounded-lg hover:bg-accent cursor-pointer transition-colors border"
						>
							<div>
								<span className="text-sm font-medium">
									{t("projectNo")} {proj.project_id}
								</span>
							</div>
							<div className="text-sm">{proj.company_name}</div>
							<div className="text-sm">{formatDate(proj.end_date)}</div>
							<div className="text-sm">{proj.project_status}</div>
						</div>
					))}
				</div>
			</div>
		) : (
			<div className="text-center py-12">
				<FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
				<h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
				<p className="text-muted-foreground mb-6">
					{emptyMessage === t("noProjects")
						? "Start by creating your first project"
						: "No projects in this category yet"}
				</p>
			</div>
		);

	return (
		<div className="max-w-4xl mx-auto space-y-6 p-6">
			{/* Teacher Info Card */}
			<Card className="">
				<CardContent className="pt-6">
					{profile ? (
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
									<User className="w-6 h-6" />
								</div>
								<div>
									<h2 className="text-xl font-semibold">
										{profile[0].teacher_name}
									</h2>
									<p className="text-sm text-muted-foreground">
										{profile[0].email}
									</p>
								</div>
							</div>
							<Button
								onClick={() => setShowCompaniesDialog(true)}
								variant="outline"
								className="flex items-center gap-2"
							>
								<Heart className="h-4 w-4" />
								{t("favoriteCompanies", { defaultValue: "Favorite companies" })}
							</Button>
						</div>
					) : (
						<p className="text-muted-foreground">No teacher data</p>
					)}

					<FavoriteCompaniesDialog
						open={showCompaniesDialog}
						onOpenChange={setShowCompaniesDialog}
					/>

					{teacherCurrentResource ? (
						<div className="pt-6 border-t mt-6">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center space-x-2">
									<BookOpen className="w-4 h-4 text-muted-foreground" />
									<span className="text-sm font-medium text-muted-foreground">
										{t("resources", { defaultValue: "resources" })} ({studyYear}
										)
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
												{teacherCurrentResource.used_resources}
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
					) : (
						<div className="text-center py-8 border-t mt-6">
							<BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
							<p className="text-muted-foreground">{t("notResources")}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Projects Section with Tabs */}
			<Card className="border-0 shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg font-semibold flex items-center space-x-2">
						<FolderOpen className="w-5 h-5" />
						<span>{t("projects")}</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="ongoing" className="w-full">
						<TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
							<TabsTrigger
								value="ongoing"
								className="dark:data-[state=active]:bg-card"
							>
								{t("projectsCurr")} ({ongoingProjects.length})
							</TabsTrigger>
							<TabsTrigger
								value="past"
								className="dark:data-[state=active]:bg-card"
							>
								{t("projectsPast")} ({pastProjects.length})
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

export default TeacherDashboard;
