import React from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

interface ProjectMembersProps {
	members: any[];
	isLoading: boolean;
	error: any;
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({
	members,
	isLoading,
	error,
}) => {
	const { t } = useTranslation();
	const max_members = 8;
	if (error) {
		return (
			<div className="bg-card rounded-xl p-4">
				<div className="flex items-center gap-2 mb-3">
					<Users className="h-4 w-4" />
					<span className="font-medium">{t("students_Involved")}</span>
				</div>
				<p className="text-sm text-muted-foreground">Error loading members</p>
			</div>
		);
	}

	return (
		<div className="bg-card rounded-xl p-4">
			<div className="flex items-center gap-2 mb-3">
				<Users className="h-4 w-4" />
				<span className="font-medium">{t("students_Involved")} </span>

				<span className="text-muted-foreground text-xs">
					{Array.isArray(members) ? members.length : 0}/{max_members}
				</span>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
				{Array.isArray(members) &&
					members.filter(Boolean).map((member, index) => (
						<div
							key={index}
							className="bg-accent rounded-xl px-3 py-2 text-muted-foreground text-sm font-medium"
						>
							{member.student_name || ""}
						</div>
					))}
			</div>
		</div>
	);
};

export default ProjectMembers;
