import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getStudyYear } from "../GetStudyYear";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Search,
	Mail,
	Clock,
	User,
	Ban,
	CircleCheck,
	Book,
	BookCheck,
	Check,
} from "lucide-react";
import { useGetAllTeachers } from "@/hooks/useTeachers";
import {
	useAnyTeacherResources,
	useCreateTeacherResources,
	useUpdateTeacherResources,
} from "@/hooks/useResources";

const TeachersList = () => {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterBy, setFilterBy] = useState("all");
	const [selectedTeacher, setSelectedTeacher] = useState(null);
	const [editingYear, setEditingYear] = useState("");
	const [editValue, setEditValue] = useState("");

	const currStudyYear = getStudyYear(new Date());

	const { data: teachers = [], isLoading: isTeacherLoading } =
		useGetAllTeachers();
	const { data: teacherResources = [] } = useAnyTeacherResources(
		selectedTeacher?.teacher_id,
	);
	const updateTeacherResourcesMutation = useUpdateTeacherResources();
	const createTeacherResourceMutation = useCreateTeacherResources();

	// Generate study years
	const studyYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return [
			`${currentYear - 2}-${currentYear - 1}`,
			currStudyYear,
			`${currentYear + 1}-${currentYear + 2}`,
			`${currentYear + 2}-${currentYear + 3}`,
		];
	}, [currStudyYear]);

	// Process teacher resources into organized structure
	const processedResources = useMemo(() => {
		if (!teacherResources.length) {
			const empty = {};
			studyYears.forEach((year) => {
				empty[year] = { used: 0, total: 0 };
			});
			return empty;
		}

		const resources = {};
		studyYears.forEach((year) => {
			resources[year] = { used: 0, total: 0 };
		});

		teacherResources.forEach((res) => {
			const year = res.study_year;
			if (studyYears.includes(year)) {
				resources[year].used = res.used_resources || 0;
				resources[year].total = res.total_resources || 0;
				resources[year].resource_id = res.resource_id || 0;
			}
		});
		console.log(resources);
		return resources;
	}, [teacherResources, studyYears]);

	// Filter teachers
	const filteredTeachers = useMemo(() => {
		return teachers.filter((teacher) => {
			const matchesSearch =
				teacher.teacher_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());

			let matchesFilter = true;
			if (filterBy === "active") {
				matchesFilter = teacher.total_resources > 0;
			} else if (filterBy === "inactive") {
				matchesFilter =
					teacher.total_resources === 0 || !teacher.total_resources;
			} else if (filterBy === "available") {
				matchesFilter = teacher.used_resources < teacher.total_resources;
			}

			return matchesSearch && matchesFilter;
		});
	}, [teachers, searchTerm, filterBy]);

	// Get resource status
	const getResourceStatus = (teacher) => {
		if (teacher.total_resources === 0 || !teacher.total_resources)
			return "inactive";
		if (teacher.used_resources >= teacher.total_resources) return "full";
		if (teacher.used_resources > 0) return "partial";
		return "available";
	};

	// Get status badge
	const getStatusBadge = (status) => {
		const badges = {
			inactive: (
				<Badge variant="secondary">
					<Clock className="h-3 w-3 mr-1" />
					{t("teachers_resource_status_inactive") || "Inactive"}
				</Badge>
			),
			full: (
				<Badge className="bg-primary/60">
					<Ban className="h-3 w-3 mr-1" />
					{t("teachers_resource_status_full")}
				</Badge>
			),
			partial: (
				<Badge className="bg-primary">
					<CircleCheck className="h-3 w-3 mr-1" />
					{t("teachers_resource_status_partiallyUsed")}
				</Badge>
			),
			available: (
				<Badge className="bg-primary">
					<CircleCheck className="h-3 w-3 mr-1" />
					{t("teachers_resource_status_available")}
				</Badge>
			),
		};
		return badges[status];
	};

	// Handle teacher card click
	const handleTeacherClick = (teacher) => {
		setSelectedTeacher(teacher);
		setEditingYear("");
		setEditValue("");
	};

	// Handle resource change
	const handleResourceChange = (year, value) => {
		setEditValue(value);
	};

	// Save year resources
	const saveYearResources = async (resource_id, year) => {
		const numValue = parseInt(editValue) || 0;
		console.log(
			`Saving ${year}: ${numValue} total resources for teacher ${selectedTeacher.teacher_id}`,
		);

		if (!resource_id) {
			await createTeacherResourceMutation.mutateAsync({
				data: {
					teacher_id: selectedTeacher.teacher_id,
					total_resources: numValue,
					study_year: year,
				},
			});
		} else {
			await updateTeacherResourcesMutation.mutateAsync({
				teacher_id: selectedTeacher.teacher_id,
				resource_id: resource_id,
				data: { total_resources: numValue },
			});
		}
		console.log("r.id", resource_id);

		setEditingYear("");
		setEditValue("");
	};

	// Close dialog
	const closeDialog = () => {
		setSelectedTeacher(null);
		setEditingYear("");
		setEditValue("");
	};

	if (isTeacherLoading) {
		return <div className="text-center py-8">Loading teachers...</div>;
	}

	return (
		<div className="space-y-4">
			{/* Search and Filter */}
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("teachers_searchTeachers", {
							defaultValue: "Search teachers...",
						})}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={filterBy} onValueChange={setFilterBy}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("teachers_filter_allTeachers", {
								defaultValue: "All teachers",
							}).toLowerCase()}
						</SelectItem>
						<SelectItem value="active">
							{t("teachers_filter_activeTeachers", {
								defaultValue: "Active",
							}).toLowerCase()}
						</SelectItem>
						<SelectItem value="inactive">
							{t("teachers_filter_inactiveTeachers", {
								defaultValue: "Inactive",
							}).toLowerCase()}
						</SelectItem>
						<SelectItem value="available">
							{t("teachers_filter_availableResources", {
								defaultValue: "Available",
							}).toLowerCase()}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Teachers Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{filteredTeachers.map((teacher, index) => {
					const status = getResourceStatus(teacher);
					return (
						<Card
							key={`${teacher.teacher_id}-${index}`}
							className="cursor-pointer transition-all hover:shadow-md hover:bg-accent/30 "
							onClick={() => handleTeacherClick(teacher)}
						>
							<CardContent className="p-4">
								<div className="flex items-center gap-3 mb-3">
									<div className="bg-primary/10 p-2 rounded-full">
										<User className="h-4 w-4 text-primary" />
									</div>
									<div className="flex-1">
										<h3 className="font-medium text-sm">
											{teacher.teacher_name}
										</h3>
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Mail className="h-3 w-3" />
											<span>{teacher.email}</span>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									{getStatusBadge(status)}

									<div className="bg-muted rounded-lg p-3">
										<div className="text-xs text-muted-foreground mb-2">
											{t("resources", { defaultValue: "resources" })}{" "}
											{currStudyYear}
										</div>
										<div className="flex justify-between text-sm">
											<span>
												<BookCheck className="h-3 w-3 inline mr-1" />
												{teacher.used_resources || 0}
											</span>
											<span>
												<Book className="h-3 w-3 inline mr-1" />
												{teacher.total_resources || 0}
											</span>
										</div>

										{teacher.total_resources > 0 && (
											<div className="w-full bg-background rounded-full h-2 mt-2">
												<div
													className="h-2 rounded-full bg-primary dark:bg-foreground"
													style={{
														width: `${Math.min((teacher.used_resources / teacher.total_resources) * 100, 100)}%`,
													}}
												/>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Resource Dialog */}
			<Dialog open={!!selectedTeacher} onOpenChange={closeDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg">
							{selectedTeacher?.teacher_name}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-3">
						{studyYears.map((year) => {
							const isCurrent = year === currStudyYear;
							const usedResources = processedResources[year]?.used || 0;
							const totalResources = processedResources[year]?.total || 0;
							const resourceId = processedResources[year].resource_id;
							const isEditing = editingYear === year;

							return (
								<div
									key={year}
									className="flex items-center justify-between py-2 border-b"
								>
									<div className="flex items-center gap-3">
										<Badge
											variant={isCurrent ? "default" : "outline"}
											className="text-xs"
										>
											{year}
										</Badge>
										{usedResources > 0 && (
											<span className="text-xs text-muted-foreground">
												{usedResources} used
											</span>
										)}
									</div>

									<div className="flex items-center gap-2">
										{isEditing ? (
											<>
												<Input
													type="number"
													value={editValue}
													onChange={(e) =>
														handleResourceChange(year, e.target.value)
													}
													className="w-16 h-8 text-center"
													min="0"
													autoFocus
												/>
												<Button
													size="sm"
													onClick={() => saveYearResources(resourceId, year)}
													className="h-8 px-2"
												>
													<Check className="h-3 w-3" />
												</Button>
											</>
										) : (
											<Button
												variant="ghost"
												onClick={() => {
													setEditingYear(year);
													setEditValue(totalResources.toString());
												}}
												className="h-8 px-3 font-mono"
											>
												{totalResources}
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>

					<div className="pt-4">
						<Button variant="outline" onClick={closeDialog} className="w-full">
							{t("close") || "Close"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Empty State */}
			{filteredTeachers.length === 0 && (
				<div className="text-center py-12 text-muted-foreground">
					<User className="h-12 w-12 mx-auto mb-4 opacity-50" />
					<p className="text-lg font-medium mb-2">
						{t("teachers_noTeachersFound", {
							defaultValue: "No teachers found",
						})}
					</p>
				</div>
			)}
		</div>
	);
};

export default TeachersList;
