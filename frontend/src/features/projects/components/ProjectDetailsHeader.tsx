import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProjectHeaderProps {
	proj: any;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ proj }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="rounded-xl shadow-sm p-6 mb-6 bg-card">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xl font-bold">{proj?.project_name}</p>
					<p className="text-sm text-muted-foreground">
						{t("projectId")} #{proj?.project_id}
					</p>
				</div>

				<Button
					onClick={() => navigate(`/projects/${proj.project_id}/update`, { state: { proj } })}
					variant="outline"
					className="flex items-center"
				>
					<Edit3 className="h-4 w-4" />
					{t("modifyData")}
				</Button>
			</div>
		</div>
	);
};

export default ProjectHeader;
