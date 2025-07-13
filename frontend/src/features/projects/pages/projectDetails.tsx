import React, {useEffect} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, FileText } from "lucide-react";
import {
	useAddProjectMember,
	useGetProjectDetails,
	useGetProjectMembers,
} from "@/hooks/use-projects";
import ProjectHeader from "@/features/projects/components/ProjectDetailsHeader";
import ProjectOverview from "@/features/projects/components/ProjectDetailsOverview";
import NotesListing from "@/features/projects/components/NotesListing";



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

	console.log("state proj", location.state?.proj);
	const proj = projectData; // TODO improve perfomance
	// location.state?.proj || // TODO
	console.log("proj", proj);

	useEffect(() => {
		if (projectError || (!proj && !isProjectLoading)) {
			navigate("/", { replace: true });
		}
	}, [projectError, proj, isProjectLoading, navigate]);

	console.log("loading", isProjectLoading);





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
						addMemberLoading={addMemberMutation.isPending}
					/>
				</TabsContent>

				<TabsContent value="docs-notes">
					<NotesListing
						project = {proj}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default StudentProjectDetails;
