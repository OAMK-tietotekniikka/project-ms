import React from "react";
import { useTranslation } from "react-i18next";
import ProjectDescription from "./ProjectDetailsDescription";
import ProjectInfoGrid from "./ProjectDetailsInfo";
import ProjectMembers from "./ProjectDetailsMembers";
import AddStudentForm from "./ProjectDetailsAddStudent";
import ChangeProjectStatus from "./ChangeProjectStatus";

interface ProjectOverviewProps {
	proj: any;
	projectId: number;
	members: any[];
	isMembersLoading: boolean;
	membersError: any;
	onAddStudent: (data: { project_id: number; data: { email: string } }) => void;
	addMemberLoading?: boolean;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
	proj,
	projectId,
	members,
	isMembersLoading,
	membersError,
	onAddStudent,
	addMemberLoading = false,
}) => {
	const { t } = useTranslation();
	const role = localStorage.getItem("role");
	return (
		<div className="space-y-6 mt-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column - Project Details */}
				<div className="lg:col-span-2 space-y-6">
					<ProjectDescription description={proj?.project_desc} />
					<ProjectInfoGrid proj={proj} />
					<ProjectMembers
						members={members || []}
						isLoading={isMembersLoading}
						error={membersError}
					/>
					<AddStudentForm
						projectId={projectId}
						onAddStudent={onAddStudent}
						disabled={addMemberLoading}
					/>
				</div>

				{/* Right Column - Status Management */}
				<div className="space-y-6">
					<div className="bg-card rounded-xl p-4">
						<h3 className="font-medium mb-4">{t("changeStatus")}</h3>
						<ChangeProjectStatus projectData={proj} role={role} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProjectOverview;
