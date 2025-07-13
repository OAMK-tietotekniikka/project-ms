import React from "react";
import { useTranslation } from "react-i18next";
import {Building, Link, CalendarDays, GraduationCap} from "lucide-react";
import dayjs from "dayjs";

interface ProjectInfoGridProps {
	proj: any;
}

const ProjectInfoGrid: React.FC<ProjectInfoGridProps> = ({ proj }) => {
	const { t } = useTranslation();

	const formatDate = (dateString: string) => {
		if (!dateString) return "Not set";

		const date = dayjs(dateString);
		if (!date.isValid() || date.year() === 1970) {
			return "Not set";
		}

		return date.format("DD.MM.YYYY");
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Timeline Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<CalendarDays className="h-4 w-4" />
					<span className="font-medium">
						{t("timeline", { defaultValue: "timeline" })}
					</span>
				</div>
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("startDate")}:</span>
						<span className="text-muted-foreground">
							{formatDate(proj?.start_date)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("dueDate")}:</span>
						<span className="text-muted-foreground">
							{formatDate(proj?.end_date)}
						</span>
					</div>
				</div>
			</div>

			{/* Company Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<Building className="h-4 w-4" />
					<span className="font-medium">{t("company")}</span>
				</div>
				<p className="text-sm font-medium text-muted-foreground">
					{proj?.company_name}
				</p>
			</div>

			{/* Supervisor Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<GraduationCap className="h-4 w-4" />
					<span className="font-medium">{t("supervisor") || "Supervisor"}</span>
				</div>
				<p className="text-sm text-muted-foreground">
					{!proj?.teacher_name || !proj?.teacher_id
						? t("noTeacher")
						: proj?.teacher_name}
				</p>
			</div>

			{/* Project URL Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<Link className="h-4 w-4" />
					<span className="font-medium">{t("url")}</span>
				</div>
				{proj?.project_url ? (
					<a
						href={proj.project_url}
						className="text-sm text-primary hover:underline break-all"
						target="_blank"
						rel="noopener noreferrer"
					>
						{proj.project_url}
					</a>
				) : (
					<span className="text-sm">{t("noUrl")}</span>
				)}
			</div>
		</div>
	);
};

export default ProjectInfoGrid;
