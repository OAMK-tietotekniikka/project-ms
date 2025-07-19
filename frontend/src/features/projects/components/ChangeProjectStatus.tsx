import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { useUpdateProjectStatus } from "@/features/projects/hooks/useProjects.hook";
import { Loader2Icon } from "lucide-react";

interface ChangeProjectStatusProps {
	projectData: any;
	role: string;
}

const ChangeProjectStatus: React.FC<ChangeProjectStatusProps> = ({
	projectData,
	role,
}) => {
	const { t } = useTranslation();
	const [projectStatus, setProjectStatus] = useState<string>(
		projectData?.project_status || "",
	);
	const [initialStatus, setInitialStatus] = useState<string>(
		projectData?.project_status || "",
	);
	const projectStatusMutation = useUpdateProjectStatus();
	const isStatusChanged = projectStatus !== initialStatus;

	useEffect(() => {
		if (projectData?.project_status) {
			setProjectStatus(projectData.project_status);
			setInitialStatus(projectData.project_status);
		}
	}, [projectData?.project_status]);

	const handleSaveStatus = async () => {
		try {
			await projectStatusMutation.mutateAsync({
				projectId: projectData?.project_id,
				data: { project_status: projectStatus },
			});
			setInitialStatus(projectStatus);
		} catch (error) {
			console.error("Failed to update project status:", error);
			setProjectStatus(initialStatus);
		}
	};

	return (
		<div className="space-y-4">
			<RadioGroup
				value={projectStatus}
				onValueChange={setProjectStatus}
				className="space-y-3"
			>
				<div className="flex items-center space-x-3">
					<RadioGroupItem value="pending" id="pending" />
					<Label htmlFor="pending" className="cursor-pointer flex flex-col">
						<div className="flex flex-col">
							<div className="font-medium">{t("pending")}</div>
							<div className="text-sm text-muted-foreground">
								{t("pendingRadio")}
							</div>
						</div>
					</Label>
				</div>

				<div className="flex items-center space-x-3">
					<RadioGroupItem value="ongoing" id="ongoing" />
					<Label htmlFor="ongoing" className="cursor-pointer">
						<div className="flex flex-col">
							<div className="font-medium">{t("ongoing")}</div>
							<div className="text-sm text-muted-foreground">
								{t("ongoingRadio")}
							</div>
						</div>
					</Label>
				</div>

				{role === "teacher" && (
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="completed" id="completed" />
						<Label htmlFor="completed" className="cursor-pointer">
							<div className="flex flex-col">
								<div className="font-medium">{t("completed")}</div>
								<div className="text-sm text-muted-foreground">
									{t("completedRadio")}
								</div>
							</div>
						</Label>
					</div>
				)}
			</RadioGroup>

			<Button
				onClick={handleSaveStatus}
				disabled={!isStatusChanged || projectStatusMutation.isPending}
				className="w-full flex items-center text-foreground hover:cursor-pointer"
			>
				{projectStatusMutation.isPending ? (
					<Loader2Icon className="animate-spin" />
				) : (
					t("save")
				)}
			</Button>
		</div>
	);
};

export default ChangeProjectStatus;
