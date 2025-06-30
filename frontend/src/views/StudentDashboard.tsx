import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { Calendar, User, Plus, FolderOpen, ChartLine } from "lucide-react";
import { useStudentProfile, useStudentProjects } from "@/hooks/useStudents";

const StudentDashboard = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const {
		data: profile,
		isLoading: isProfileLoading,
		error: profileError,
	} = useStudentProfile();

	const {
		data: projects,
		isLoading: isProjectsLoading,
		error: projectsError,
	} = useStudentProjects();
	console.log(profile);
	if (isProfileLoading || isProjectsLoading) {
		return <p>Loading...</p>;
	}

	if (profileError || projectsError) {
		return <p>Error loading student data.</p>;
	}

	if (!profile) {
		return <p>No student profile found.</p>;
	}

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
							<h2 className="text-xl font-semibold">
								{profile[0].student_name}
							</h2>
							<p className="text-sm text-muted-foreground">
								{profile[0].email}
							</p>
							{profile[0].class_code ? (
								<Badge variant="outline" className="mt-1">
									profile[0].class_code.toUpperCase()
								</Badge>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Projects Section */}
			<Card className="border-0 shadow-sm">
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg font-semibold flex items-center space-x-2">
							<FolderOpen className="w-5 h-5" />
							<span>My Projects</span>
						</CardTitle>
						<Button
							className="bg-primary/75 hover:cursor-pointer"
							onClick={() => navigate("/form")}
						>
							<Plus className="w-4 h-4 mr-2" />
							{t("createProj")}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{projects.length > 0 ? (
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground mb-4">
								{t("projListBelow")}
							</p>

							{/* Table Header */}
							<div className="grid grid-cols-4 gap-4 py-3 px-4 bg-card rounded-lg text-sm font-medium">
								<div>Project</div>

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
							<div className="space-y-2">
								{projects.map((proj, index) => (
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
												{t("projectNo")} {index + 1}
											</span>
										</div>
										<div className="text-sm">{formatDate(proj.start_date)}</div>
										<div className="text-sm">{formatDate(proj.end_date)}</div>
										<div className="text-sm">{proj.project_status}</div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="text-center py-12">
							<FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">{t("noProjects")}</h3>
							<p className="text-gray-500 mb-6">
								Start by creating your first project
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default StudentDashboard;
