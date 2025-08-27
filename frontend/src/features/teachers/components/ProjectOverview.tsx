import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	FolderOpen,
	Search,
	Download,
	BarChart3,
	Check,
	Podcast,
	CircleDashed,
} from "lucide-react";
import { useGetAllProjects } from "@/features/projects/hooks/useProjects.hook";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import not_found from "@/assets/not_found_1.svg";
import { projectService } from "@/core/api/services";
import ProjectStatsDialog from "@/features/projects/components/ProjectStatsDialog";
import { getStudyYear } from "@/shared/utils/GetStudyYear";

interface Project {
	project_id?: number;
	project_name?: string;
	teacher_name?: string;
	project_status?: string;
	student_names_cache?: string;
}

const Projects: React.FC = () => {
	const { t } = useTranslation();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isExporting, setIsExporting] = useState(false);
	const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);

	const studyYear = getStudyYear(new Date());
	const [selectedYear, setSelectedYear] = useState(studyYear);

	const navigate = useNavigate();

	const { data: projects, isLoading, error } = useGetAllProjects(selectedYear);

	const generateAcademicYears = () => {
		const currentStudyYearStr = getStudyYear(new Date());
		const startYearNum = Number(currentStudyYearStr.split("-")[0]);
		const years = [];

		for (let i = -2; i <= 2; i++) {
			years.push(`${startYearNum + i}-${startYearNum + i + 1}`);
		}

		return years;
	};

	const academicYears = generateAcademicYears();
	const icons = {
		pending: CircleDashed,
		ongoing: Podcast,
		completed: Check,
	};

	const filteredProjects = useMemo(() => {
		if (!projects) return [];

		const searchLower = searchTerm.toLowerCase();
		const statusLower = statusFilter.toLowerCase();

		return projects.filter((project: Project) => {
			// Early return for performance
			if (
				statusFilter !== "all" &&
				project.project_status?.toLowerCase() !== statusLower
			) {
				return false;
			}

			if (!searchTerm) return true;

			return (
				project.project_name?.toLowerCase().includes(searchLower) ||
				project.teacher_name?.toLowerCase().includes(searchLower)
			);
		});
	}, [projects, searchTerm, statusFilter]);

	const exportProjects = async () => {
		setIsExporting(true);
		try {
			const response = await projectService.getExportProjects();
			const exportData = response.data.data;
			const csv = Papa.unparse(exportData, {
				header: true,
				delimiter: ",",
				newline: "\n",
			});

			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);

			link.setAttribute("href", url);
			link.setAttribute(
				"download",
				`projects-${new Date().toISOString().split("T")[0]}.csv`,
			);
			link.style.visibility = "hidden";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			return;
		} catch (error) {
			console.error("Error fetching export projects:", error);
			return;
		} finally {
			setIsExporting(false);
		}
	};

	// Memoized click handler
	const handleProjectClick = useCallback(
		(proj: Project) => {
			navigate(`/projects/${proj?.project_id}`, { state: { proj } });
		},
		[navigate],
	);

	const ProjectItem = useCallback(
		(index: number) => {
			const project = filteredProjects[index];
			const Icon = icons[project.project_status];
			return (
				<div
					className="group hover:bg-accent/50 cursor-pointer border-b border-border/40 px-3 py-2"
					onClick={() => handleProjectClick(project)}
				>
					{/* #ID Project Name (Teacher Name) Status */}
					<div className="flex items-center justify-between gap-3 mb-1">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<span className="text-xs text-muted-foreground font-mono flex-shrink-0">
								#{project.project_id}
							</span>
							<span className="font-medium text-sm truncate group-hover:text-primary">
								{project.project_name}
							</span>
							{project.teacher_name && (
								<span className="text-xs text-muted-foreground truncate">
									({project.teacher_name})
								</span>
							)}
						</div>
						<span className="text-xs text-muted-foreground flex-shrink-0">
							<Icon className="h-4 w-4" />
						</span>
					</div>

					{/* Students */}
					{project.student_names_cache && (
						<div className="text-xs text-muted-foreground pl-6 truncate">
							{project.student_names_cache}
						</div>
					)}
				</div>
			);
		},
		[filteredProjects, handleProjectClick, t],
	);

	if (error || (!isLoading && !projects)) {
		return (
			<div className="max-w-4xl mx-auto p-6 min-h-500">
				<div className="bg-card rounded-xl shadow-sm p-6">
					<div className="text-center py-12 text-muted-foreground">
						<FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="font-medium">
							{error ? t("error") : t("projects_noProjectsFound")}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div className="flex items-center justify-between">
					<p className="text-xl font-bold">{t("projects")}</p>
					<div className="flex gap-3">
						<Button
							onClick={() => setIsStatsDialogOpen(true)}
							disabled={isExporting}
							variant="outline"
							className="gap-2 hover:cursor-pointer"
						>
							<BarChart3 className="h-4 w-4" />
							{t("projects_stats", {
								defaultValue: "Stats",
							})}
						</Button>

						<ProjectStatsDialog
							open={isStatsDialogOpen}
							onOpenChange={setIsStatsDialogOpen}
						/>
						<Button
							onClick={() => {
								if (isExporting || !projects?.length || isLoading) return;
								exportProjects();
							}}
							variant="outline"
							className="gap-2 hover:cursor-pointer"
						>
							<Download className="h-4 w-4" />
							{t("projects_exportProjects", {
								defaultValue: "Export projects",
							})}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="bg-card rounded-xl shadow-sm p-6">
				{/* Filters */}
				<div className="flex gap-4 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder={t("projects_searchProjects", {
								defaultValue: "Search projects...",
							})}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("statuses_all").toLowerCase()}
							</SelectItem>
							<SelectItem value="pending">{t("pending")}</SelectItem>
							<SelectItem value="ongoing">{t("ongoing")}</SelectItem>
							<SelectItem value="completed">{t("completed")}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={selectedYear} onValueChange={setSelectedYear}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{academicYears.map((year) => (
								<SelectItem key={year} value={year}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Results count */}
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm text-muted-foreground">
						{t("showing")} {filteredProjects.length} / {projects?.length || 0}{" "}
						{t("projects")}
					</div>
				</div>

				{/* Projects List */}
				{filteredProjects.length === 0 && !isLoading ? (
					<div className="flex flex-col items-center text-center text-muted-foreground py-12">
						<img src={not_found} alt="" className="h-24" />
						<p className="text-md font-medium">
							{t("projects_noProjectsFound", {
								defaultValue: "No projects found",
							})}
						</p>
					</div>
				) : (
					<div className="h-[60vh] w-full border rounded-lg overflow-hidden">
						<Virtuoso
							data={filteredProjects}
							totalCount={filteredProjects.length}
							itemContent={ProjectItem}
							style={{ height: "100%" }}
							overscan={10}
							increaseViewportBy={200}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default Projects;
