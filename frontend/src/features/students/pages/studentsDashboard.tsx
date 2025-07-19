import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import dayjs from "dayjs";
import {
	Calendar,
	User,
	Plus,
	FolderOpen,
	ChartLine,
	GitPullRequestArrow,
} from "lucide-react";
import { useStudentProfile } from "@/features/students/hooks/useStudents.hook";
import {
	useGetUserProjects,
	useJoinProject,
} from "@/features/projects/hooks/useProjects.hook";
import general_success_2 from "@/assets/general_success_1.svg";
import InputProjectCodeDialog from "@/features/projects/components/InputProjectCode";
import { toast } from "sonner";

const StudentsDashboard = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const max_projects = 8;

	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useStudentProfile();
	console.log("CALLING STUDENT NO REASON");

	const {
		data: projects,
		isLoading: isProjectsLoading,
		error: projectsError,
	} = useGetUserProjects();

	const mutationJoinProject = useJoinProject();
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	if (isProfileLoading || isProjectsLoading) {
		return null;
	}

	if (profileError || projectsError) {
		//logout();
	}

	if (!profile) {
		//logout();
	}

	const joinWithCode = async (code: string) => {
		try {
			console.log(code);
			await mutationJoinProject.mutateAsync({ joinCode: code });
			toast.success(t("toast_success"));
			setIsDialogOpen(false);
		} catch (error) {
			toast.error(t("toast_error"));
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Not set";

		const date = dayjs(dateString);
		if (!date.isValid() || date.year() === 1970) {
			return "Not set";
		}

		return date.format("DD.MM.YYYY");
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 p-6">
			{/* Student Info Card */}
			<Card>
				<CardContent>
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
							<User className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xl font-semibold">
								{profile ? profile[0].student_name : "..."}
							</p>
							<p className="text-sm text-muted-foreground">
								{profile ? profile[0].email : "..."}
							</p>
							{profile &&
							profile[0].class_code &&
							profile[0].class_code != "undefined" ? (
								<Badge variant="outline" className="mt-1">
									{profile[0].class_code.toUpperCase()}
								</Badge>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Projects Section */}
			<Card className="border-0 shadow-sm">
				<CardHeader className="pb-4">
					<div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
						<CardTitle className="text-xl font-semibold flex items-center space-x-2">
							<FolderOpen className="w-5 h-5 flex-shrink-0" />
							<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
								<span className="text-xl">{t("projects_myProjects")}</span>
								<span className="text-muted-foreground text-sm">
									{Array.isArray(projects) ? projects.length : 0}/{max_projects}
								</span>
							</div>
						</CardTitle>
						<div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
							<Button
								className="text-foreground hover:cursor-pointer"
								onClick={() => navigate("/projects/create")}
							>
								<Plus className="w-4 h-4 mr-2" />
								{t("createProj")}
							</Button>
							<InputProjectCodeDialog
								open={isDialogOpen}
								onOpenChange={setIsDialogOpen}
								onSubmit={joinWithCode}
								trigger={
									<Button className="text-foreground hover:cursor-pointer">
										<GitPullRequestArrow className="w-4 h-4 mr-2" />
										{t("join")}
									</Button>
								}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{projects && projects.length > 0 ? (
						<div className="space-y-1">
							{/* Table Header - Hidden on mobile */}
							<div className="hidden md:grid grid-cols-4 gap-4 py-3 px-4 bg-card rounded-xl text-sm font-medium">
								<div>{t("project")}</div>
								<div className="flex items-center space-x-1">
									<Calendar className="w-4 h-4" />
									<span>{t("startDate")}</span>
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
							<div className="space-y-4">
								{projects.map((proj, index) => (
									<div
										key={proj.project_id}
										onClick={() =>
											navigate(`/projects/${proj.project_id}`, {
												state: { proj },
											})
										}
										className="py-4 px-4 rounded-xl hover:bg-accent cursor-pointer border"
									>
										{/* Mobile Layout */}
										<div className="md:hidden space-y-2">
											<div className="font-medium">
												{t("projectNo")} {index + 1}
											</div>
											<div className="grid grid-cols-2 gap-2 text-sm">
												<div>
													<span className="text-muted-foreground">
														{t("startDate")}:{" "}
													</span>
													{formatDate(proj.start_date)}
												</div>
												<div>
													<span className="text-muted-foreground">
														{t("dueDate")}:{" "}
													</span>
													{formatDate(proj.end_date)}
												</div>
											</div>
											<div className="text-sm">
												<span className="text-muted-foreground">
													{t("status")}:{" "}
												</span>
												{proj.project_status}
											</div>
										</div>

										{/* Desktop Layout */}
										<div className="hidden md:grid grid-cols-4 gap-4">
											<div className="text-sm font-medium">
												{t("projectNo")} {index + 1}
											</div>
											<div className="text-sm">
												{formatDate(proj.start_date)}
											</div>
											<div className="text-sm">{formatDate(proj.end_date)}</div>
											<div className="text-sm">{proj.project_status}</div>
										</div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="text-center text-muted-foreground py-12">
							<div className="flex flex-col font-medium items-center">
								<img
									loading="lazy"
									src={general_success_2}
									alt=""
									className="h-24"
								/>
								<p className="text-md font-medium mb-2">
									{t("projects_noProjectsFound")}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default StudentsDashboard;
