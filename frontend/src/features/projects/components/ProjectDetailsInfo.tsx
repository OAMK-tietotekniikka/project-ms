import React from "react";
import { useTranslation } from "react-i18next";
import { Building, Link, CalendarDays, GraduationCap } from "lucide-react";
import dayjs from "dayjs";

interface ProjectInfoGridProps {
	proj: any;
}

const ProjectInfoGrid: React.FC<ProjectInfoGridProps> = ({ proj }) => {
	const { t } = useTranslation();

	const formatDate = (dateString: string) => {
		if (!dateString) return "";

		const date = dayjs(dateString);
		if (!date.isValid() || date.year() === 1970) {
			return "";
		}

		return date.format("DD.MM.YYYY");
	};

	const formatted_startDate = formatDate(proj?.start_date);
	const formatted_endDate = formatDate(proj?.end_date);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Timeline Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<CalendarDays className="h-4 w-4" />
					<span className="font-medium capitalize">
						{t("timeline", { defaultValue: "timeline" })}
					</span>
				</div>
				<div className="space-y-2 text-sm text-muted-foreground">
					<div className="flex justify-between">
						<span>{t("startDate")}:</span>
						<span className={`${formatted_startDate ? "" : "invisible"}`}>
							{formatted_startDate || "*"}
						</span>
					</div>
					<div className="flex justify-between">
						<span>{t("dueDate")}:</span>
						<span className={`${formatted_endDate ? "" : "invisible"}`}>
							{formatted_endDate || "*"}
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
				<p
					className={`text-sm text-muted-foreground ${proj?.teacher_name && proj?.teacher_id ? "" : "invisible"}`}
				>
					{proj?.teacher_name || "*"}
				</p>
			</div>

			{/* Project URL Card */}
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-2">
					<Link className="h-4 w-4" />
					<span className="font-medium">{t("url")}</span>
				</div>
				<a
					href={proj?.project_url || undefined}
					className={`text-sm break-all ${proj?.project_url ? "text-primary hover:underline" : "invisible pointer-events-none"}`}
					target={proj?.project_url ? "_blank" : undefined}
					rel={proj?.project_url ? "noopener noreferrer" : undefined}
				>
					{proj?.project_url || t("noUrl")}
				</a>
			</div>
		</div>
	);
};

export default ProjectInfoGrid;
