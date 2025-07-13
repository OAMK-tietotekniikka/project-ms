import React from "react";
import { useTranslation } from "react-i18next";

interface ProjectDescriptionProps {
	description: string;
}

const ProjectDescription: React.FC<ProjectDescriptionProps> = ({
	description,
}) => {
	const { t } = useTranslation();

	if (!description) return null;

	return (
		<div className="bg-card rounded-xl p-4">
			<h3 className="font-semibold mb-2">{t("projDesc")}</h3>
			<p className="text-secondary-foreground">{description}</p>
		</div>
	);
};

export default ProjectDescription;
