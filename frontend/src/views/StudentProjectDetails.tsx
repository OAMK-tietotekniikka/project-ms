import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, FileText } from "lucide-react";
import {
	useAddProjectMember,
	useGetProjectDetails,
	useGetProjectMembers,
} from "@/hooks/useProjects";
import ProjectHeader from "@/components/StudentUI/ProjectDetailsHeader";
import ProjectOverview from "@/components/StudentUI/ProjectDetailsOverview";
import NotesListing from "@/components/StudentUI/NotesListing";
import { toast } from "sonner";

const StudentProjectDetails = () => {
	const { t } = useTranslation();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const projectId = parseInt(id || "0");
	const navigate = useNavigate();

	const {
		data: members,
		isLoading: isMembersLoading,
		error: membersError,
	} = useGetProjectMembers(projectId);

	const {
		data: projectData,
		isLoading: isProjectLoading,
		error: projectError,
	} = useGetProjectDetails(projectId);

	const addMemberMutation = useAddProjectMember();

	const handleAddStudent = async (data: {
		project_id: number;
		data: { email: string };
	}) => {
		try {
			await addMemberMutation.mutateAsync(data);
			toast.success(t("toast_success"));
		} catch (error) {
			toast.error(t("toast_error"));
			console.error("Failed to add student:", error);
		}
	};
	console.log("state proj", location.state?.proj);
	const proj = projectData?.[0] || location.state?.proj; // TODO improve perfomance
	console.log("state proj", proj);
	if (!proj) {
		navigate("/student");
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<ProjectHeader proj={proj} />

			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger
						value="overview"
						className="space-x-2 dark:data-[state=active]:bg-card"
					>
						<Info className="h-4 w-4" />
						<span>{t("overview", { defaultValue: "Overview" })}</span>
					</TabsTrigger>
					<TabsTrigger
						value="docs-notes"
						className="space-x-2 dark:data-[state=active]:bg-card"
					>
						<FileText className="h-4 w-4" />
						<span>{t("notes", { defaultValue: "Notes" })}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<ProjectOverview
						proj={proj}
						projectId={projectId}
						members={members || []}
						isMembersLoading={isMembersLoading}
						membersError={membersError}
						onAddStudent={handleAddStudent}
						addMemberLoading={addMemberMutation.isPending}
					/>
				</TabsContent>

				<TabsContent value="docs-notes">
					<NotesListing projectId={projectId} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default StudentProjectDetails;
