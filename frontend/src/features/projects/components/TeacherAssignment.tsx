import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { User, UserCheck } from "lucide-react";
import { useUpdateProjectTeacher } from "@/features/projects/hooks/useProjects.hook";
import { useGetAvailableTeachers } from "@/features/teachers/hooks/useTeachers.hook";
import { getStudyYear } from "@/shared/utils/GetStudyYear";

interface TeacherAssignmentProps {
	projectId: number;
	startDate: string;
	currentTeacherId: number | null;
	currentTeacherName: string;
	onTeacherUpdate: (teacher: { id: number | null; name: string }) => void;
}

export const TeacherAssignment: React.FC<TeacherAssignmentProps> = ({
	projectId,
	startDate,
	currentTeacherId,
	currentTeacherName,
	onTeacherUpdate,
}) => {
	const { t } = useTranslation();
	const studyYear = getStudyYear(new Date(startDate));
	const { data: teachers = [], isLoading: isTeacherLoading } =
		useGetAvailableTeachers(studyYear);
	const updateTeacherMutation = useUpdateProjectTeacher();

	const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
		currentTeacherId,
	);
	const [isUpdatingTeacher, setIsUpdatingTeacher] = useState(false);

	useEffect(() => {
		setSelectedTeacherId(currentTeacherId);
	}, [currentTeacherId]);

	const handleTeacherUpdate = async () => {
		if (!selectedTeacherId || selectedTeacherId === currentTeacherId) return;

		setIsUpdatingTeacher(true);
		try {
			await updateTeacherMutation.mutateAsync({
				projectId: projectId,
				data: { new_teacher_id: selectedTeacherId },
			});

			const selectedTeacher = teachers.find(
				(t) => t.teacher_id === selectedTeacherId,
			);
			if (selectedTeacher) {
				onTeacherUpdate({
					id: selectedTeacherId,
					name: selectedTeacher.teacher_name,
				});
			}
			toast.success(t("toast_success_refresh"));
		} catch (error) {
			toast.error(t("toast_error"));
			console.error("Failed to update teacher:", error);
		} finally {
			setIsUpdatingTeacher(false);
		}
	};

	const hasChanges =
		selectedTeacherId !== currentTeacherId && selectedTeacherId !== null;

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserCheck className="w-5 h-5" />
					{t("projects_updateTeacher")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Current Teacher Display */}
				<div className="p-3 bg-accent/50 rounded-xl border-input">
					<div className="text-sm text-muted-foreground mb-1">
						{t("projects_currentTeacher")}
					</div>
					<div className="font-medium">
						{currentTeacherName || "Not assigned"}
					</div>
				</div>

				{/* Teacher Selection */}
				<div className="space-y-3">
					<Label htmlFor="teacher-select" className="text-sm font-medium">
						{t("projects_selectNewTeacher")}
					</Label>

					<Select
						value={selectedTeacherId?.toString() ?? ""}
						onValueChange={(value) => setSelectedTeacherId(parseInt(value))}
						disabled={isTeacherLoading}
					>
						<SelectTrigger id="teacher-select">
							<SelectValue placeholder="Choose a teacher..." />
						</SelectTrigger>
						<SelectContent>
							{teachers?.length ? (
								teachers.map((teacher) => {
									const availableResources =
										(teacher?.total_resources || 0) -
										(teacher?.used_resources || 0);
									const usagePercentage =
										(availableResources / (teacher?.total_resources || 1)) *
										100;
									return (
										<SelectItem
											key={teacher.teacher_id}
											value={teacher.teacher_id.toString()}
										>
											<div className="flex justify-between items-center w-full">
												<span className="font-medium">
													{teacher.teacher_name}
												</span>
												<span className="text-xs text-muted-foreground ml-2">
													{availableResources} available (
													{usagePercentage.toFixed(0)}%)
												</span>
											</div>
										</SelectItem>
									);
								})
							) : (
								<SelectItem value="null" disabled>
									No teachers available
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				</div>

				{/* Action Buttons */}
				{hasChanges && (
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setSelectedTeacherId(currentTeacherId)}
							className="flex-1"
						>
							{t("cancel")}
						</Button>
						<Button
							type="button"
							onClick={handleTeacherUpdate}
							disabled={isUpdatingTeacher}
							className="flex-1"
						>
							{isUpdatingTeacher ? t("updating") : t("projects_updateTeacher")}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
