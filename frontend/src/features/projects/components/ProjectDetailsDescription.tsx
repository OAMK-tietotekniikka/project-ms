import React from "react";
import { useTranslation } from "react-i18next";

interface ProjectDescriptionProps {
	description: string;
}

const ProjectDescription: React.FC<ProjectDescriptionProps> = ({
	description,
}) => {
	const { t } = useTranslation();

	return (
		<div className="bg-card rounded-xl p-4">
			<p className="font-medium mb-2">{t("projDesc")}</p>
			<p
				className={`text-secondary-foreground ${description ? "" : "invisible"}`}
			>
				{description || "*"}
			</p>
		</div>
	);
};

export default ProjectDescription;
