import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { projectService } from "@/core/api/services";
interface ProjectDetailsInviteProps {
	projectId: number;
}
const ProjectDetailsInvite: React.FC<ProjectDetailsInviteProps> = ({
	projectId,
}) => {
	const [inviteCode, setInviteCode] = useState("");
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		let codeToCopy = inviteCode;

		if (!codeToCopy) {
			try {
				const response = await projectService.getInviteCode(projectId);
				codeToCopy = response.data.data.joinCode || "";
				setInviteCode(codeToCopy);
			} catch (error) {
				console.error("Failed to fetch invite code:", error);
				return; // exit early if fetch fails
			}
		}

		try {
			await navigator.clipboard.writeText(codeToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			console.error("Failed to copy invite code:", err);
		}
	};

	return (
		<div className="space-y-4">
			<div className="text-sm text-center font-mono text-muted-foreground border rounded-xl px-3 py-2 bg-muted">
				{inviteCode || "******"}
			</div>
			<Button
				onClick={handleCopy}
				className="w-full text-foreground hover:cursor-pointer"
			>
				{copied ? "Copied!" : "Get invite code"}
			</Button>
		</div>
	);
};

export default ProjectDetailsInvite;
