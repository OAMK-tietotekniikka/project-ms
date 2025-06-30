import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FolderOpen,
	Plus,
	Search,
	Filter,
	Calendar,
	Hash,
	User,
	Download,
} from "lucide-react";
import { useGetAllProjects } from "@/hooks/useProjects";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";

interface Project {
	project_id?: number;
	project_name?: string;
	teacher_name?: string;
	project_status?: string;
}

const getStatusVariant = (status: string) => {
	switch (status?.toLowerCase()) {
		case "active":
			return "default";
		case "completed":
			return "secondary";
		case "upcoming":
			return "outline";
		case "pending":
			return "outline";
		case "ongoing":
			return "default";
		default:
			return "outline";
	}
};

const Projects: React.FC = () => {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isExporting, setIsExporting] = useState(false);
	const navigate = useNavigate();

	const { data: projects, isLoading, error } = useGetAllProjects();

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

	// Export function
	const handleExportProjects = useCallback(() => {
		if (!filteredProjects.length) return;

		setIsExporting(true);

		try {
			const exportData = filteredProjects.map((project: Project) => ({
				"Project ID": project.project_id || "",
				"Project Name": project.project_name || "",
				"Teacher Name": project.teacher_name || "",
				Status: project.project_status || "",
			}));

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
				`projects-export-${new Date().toISOString().split("T")[0]}.csv`,
			);
			link.style.visibility = "hidden";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Export failed:", error);
		} finally {
			setIsExporting(false);
		}
	}, [filteredProjects]);

	// Memoized click handler
	const handleProjectClick = useCallback((project: Project) => {
		// This is where you'll implement your navigation logic
		console.log("Project clicked:", project);
		navigate(`/studentProject/${project?.project_id}`, { state: { project } });
		// Example: navigate(`/projects/${project.project_id}`);
		// or: onProjectSelect(project);
		// or: setSelectedProject(project);
	}, []);

	// Memoized ProjectItem component
	const ProjectItem = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const project = filteredProjects[index];

			return (
				<div style={style}>
					<Card
						className="hover:shadow-md hover:bg-accent/30 transition-shadow duration-100 mb-2 cursor-pointer group"
						onClick={() => handleProjectClick(project)}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleProjectClick(project);
							}
						}}
					>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4 flex-1 min-w-0">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-150 flex-shrink-0">
										<FolderOpen className="w-5 h-5 text-primary" />
									</div>
									<div className="space-y-1 flex-1 min-w-0">
										<h4 className="font-medium text-sm group-hover:text-primary transition-colors duration-150 truncate">
											{project.project_name}
										</h4>
										<div className="flex items-center gap-4 text-xs text-muted-foreground">
											<div className="flex items-center gap-1 flex-shrink-0">
												<Hash className="w-3 h-3" />
												<span>{project.project_id}</span>
											</div>
											{project.teacher_name && (
												<div className="flex items-center gap-1 min-w-0">
													<User className="w-3 h-3 flex-shrink-0" />
													<span className="truncate">
														{project.teacher_name}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>
								<Badge
									variant={getStatusVariant(project.project_status || "")}
									className="text-xs flex-shrink-0 ml-2"
								>
									{project.project_status}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		},
		[filteredProjects, handleProjectClick],
	);

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="bg-card rounded-lg shadow-sm p-6">
					<div className="space-y-3">
						{[...Array(8)].map((_, i) => (
							<Card key={i}>
								<CardContent className="p-4">
									<div className="flex items-center gap-4">
										<Skeleton className="h-10 w-10 rounded-full" />
										<div className="space-y-2 flex-1">
											<Skeleton className="h-4 w-48" />
											<Skeleton className="h-3 w-64" />
										</div>
										<Skeleton className="h-6 w-20" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error || !projects) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="bg-card rounded-lg shadow-sm p-6">
					<div className="text-center py-12">
						<FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium text-muted-foreground">
							{error ? "Error Loading Projects" : "No Projects Found"}
						</h3>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="bg-card rounded-lg shadow-sm p-6 mb-6">
				<div className="flex items-center justify-between">
					<p className="text-xl font-bold">{t("projectsMain")}</p>
					<Button
						onClick={handleExportProjects}
						disabled={!filteredProjects.length || isExporting}
						variant="outline"
						className="gap-2"
					>
						<Download className="h-4 w-4" />
						{isExporting
							? "Exporting..."
							: t("projects_exportProjects", {
									defaultValue: "Export projects",
								})}
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="bg-card rounded-lg shadow-sm p-6">
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
				</div>

				{/* Results count and Export button for filtered results */}
				<div className="flex items-center justify-between mb-4">
					<div className="text-sm text-muted-foreground">
						{t("showing")} {filteredProjects.length} / {projects?.length || 0}{" "}
						{t("projectsMain")}
					</div>
					{filteredProjects.length > 0 &&
						filteredProjects.length !== projects?.length && (
							<Button
								onClick={handleExportProjects}
								disabled={isExporting}
								variant="ghost"
								size="sm"
								className="gap-2"
							>
								<Download className="h-3 w-3" />
								{isExporting ? "Exporting..." : "Export Filtered"}
							</Button>
						)}
				</div>

				{/* Projects List */}
				{filteredProjects.length === 0 ? (
					<div className="text-center text-muted-foreground py-12">
						<FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
						<p className="text-lg font-medium">
							{t("projects_noProjectsFound", {
								defaultValue: "No projects found",
							})}
						</p>
					</div>
				) : (
					<div className="h-[400px] w-full border rounded-lg">
						<List
							height={400}
							width={"100%"}
							itemCount={filteredProjects.length}
							itemSize={130}
							className="p-2"
							overscanCount={5}
						>
							{ProjectItem}
						</List>
					</div>
				)}
			</div>
		</div>
	);
};

export default Projects;
