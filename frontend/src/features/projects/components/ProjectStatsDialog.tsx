import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

import { LoaderCircle, BarChart3 } from "lucide-react";

import { Virtuoso } from "react-virtuoso";
import { useGetProjectStatistics } from "@/features/projects/hooks/useProjects.hook";

const ProjectStatsDialog = ({ open, onOpenChange }) => {
	const { t } = useTranslation();
	const [selectedStudyYear, setSelectedStudyYear] = useState("");

	const {
		data: statsData,
		isLoading: isStatsLoading,
		error: statsError,
	} = useGetProjectStatistics(open);

	// Get available study years
	const studyYears = useMemo(() => {
		if (!statsData) return [];
		return statsData.map((item) => item.study_year);
	}, [statsData]);

	// companies for selected study year, sorted by students (highest to lowest)
	const sortedCompanies = useMemo(() => {
		if (!statsData || !selectedStudyYear) return [];

		const selectedYearData = statsData.find(
			(item) => item.study_year === selectedStudyYear,
		);

		if (!selectedYearData) return [];

		return [...selectedYearData.companies].sort(
			(a, b) => b.Students - a.Students,
		);
	}, [statsData, selectedStudyYear]);

	// default study year
	useEffect(() => {
		if (studyYears.length > 0 && !selectedStudyYear) {
			setSelectedStudyYear(studyYears[0]);
		}
	}, [studyYears, selectedStudyYear]);

	const closeDialog = () => {
		setSelectedStudyYear("");
		onOpenChange(false);
	};

	const getContainerHeight = () => {
		return window.innerHeight >= 800
			? "350px"
			: window.innerHeight >= 600
				? "200px"
				: "150px";
	};

	// Company item
	const CompanyStatsItem = (index) => {
		const company = sortedCompanies[index];

		return (
			<div
				key={`${company.Company}-${index}`}
				className="flex items-center justify-between py-3 px-3 border rounded-xl hover:bg-accent/50 mb-2"
			>
				<div className="flex items-center gap-3 flex-1">
					<span className="font-medium text-sm">{company.Company}</span>
				</div>

				<div className="flex items-center gap-4">
					<div className="text-center">
						<div className="text-lg font-semibold text-primary">
							{company.Students}
						</div>
						<div className="text-xs text-muted-foreground">
							{t("students", { defaultValue: "Students" })}
						</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-semibold text-secondary-foreground">
							{company.Projects}
						</div>
						<div className="text-xs text-muted-foreground capitalize">
							{t("projects", { defaultValue: "Projects" })}
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Empty state component
	const EmptyState = () => (
		<div className="text-center py-8 text-muted-foreground">
			<BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
			<p>{t("noStatsData", { defaultValue: "No statistics data found" })}</p>
		</div>
	);

	// Show error state
	if (statsError && !isStatsLoading) {
		return (
			<Dialog open={open} onOpenChange={closeDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-md flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							{t("projects_stats", { defaultValue: "Project Statistics" })}
						</DialogTitle>
					</DialogHeader>
					<div className="text-center py-8">
						<p>{t("errorLoading", { defaultValue: "Error loading data" })}</p>
					</div>
					<Button variant="outline" onClick={closeDialog} className="w-full">
						{t("close", { defaultValue: "Close" })}
					</Button>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={closeDialog}>
			<DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-md flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						{t("projects_stats", { defaultValue: "Project Statistics" })}
					</DialogTitle>
				</DialogHeader>

				{/* Study Year Selection */}
				<div className="pb-4">
					<div className="flex gap-2 flex-wrap">
						{studyYears.map((year) => (
							<Button
								key={year}
								variant={selectedStudyYear === year ? "default" : "secondary"}
								size="sm"
								onClick={() => setSelectedStudyYear(year)}
								className="text-xs hover:cursor-pointer"
							>
								{year}
							</Button>
						))}
					</div>
				</div>

				<div className="flex-1 flex flex-col space-y-4 min-h-0">
					{/* Table Header */}
					{selectedStudyYear && sortedCompanies.length > 0 && (
						<div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground border-b">
							<div className="flex-1">
								{t("company", { defaultValue: "Company" })}
							</div>
							<div className="flex items-center gap-4">
								<div className="text-center w-16">
									{t("students", { defaultValue: "Students" })}
								</div>
								<div className="text-center w-16 capitalize">
									{t("projects", { defaultValue: "Projects" })}
								</div>
							</div>
						</div>
					)}

					{/* Companies Stats List */}
					<div className="flex-1 min-h-0">
						<div style={{ height: getContainerHeight() }}>
							{selectedStudyYear && sortedCompanies.length > 0 ? (
								<Virtuoso
									style={{ height: "100%" }}
									totalCount={sortedCompanies.length}
									itemContent={CompanyStatsItem}
									overscan={5}
								/>
							) : selectedStudyYear && !isStatsLoading ? (
								<EmptyState />
							) : (
								<div></div>
							)}
						</div>
					</div>
				</div>

				<div className="pt-4 border-t flex-shrink-0">
					<Button variant="outline" onClick={closeDialog} className="w-full">
						{t("close", { defaultValue: "Close" })}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ProjectStatsDialog;
