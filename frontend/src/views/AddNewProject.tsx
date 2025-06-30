import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Building2,
	FileText,
	User,
	Edit,
	Link,
	CalendarDays,
	UserCheck,
} from "lucide-react";
import {
	useCreateProject,
	useGetProjectDetails,
	useUpdateProject,
	useUpdateProjectTeacher,
} from "@/hooks/useProjects";
import { useCreateCompany, useGetCompanies } from "@/hooks/useCompanies";
import { useGetAvailableTeachers } from "@/hooks/useTeachers";
import { toast } from "sonner";
import { getStudyYear } from "@/components/GetStudyYear";

interface FormData {
	project_name: string;
	project_desc: string;
	company_id: number | null;
	company_name: string;
	project_status: string;
	project_url: string;
	start_date: string;
	end_date: string;
}

const TeacherAssignmentSection: React.FC<{
	start_date: Date;
	projectId: number;
	currentTeacherName: string;
	currentTeacherId: number | null;
	onTeacherUpdate: (teacher: { id: number | null; name: string }) => void;
}> = ({
	start_date,
	projectId,
	currentTeacherName,
	currentTeacherId,
	onTeacherUpdate,
}) => {
	const { t } = useTranslation();
	console.log(start_date);
	const study_year = getStudyYear(new Date(start_date));
	const { data: teachers = [], isLoading: isTeacherLoading } =
		useGetAvailableTeachers(study_year);
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
				project_id: projectId,
				data: { new_teacher_id: selectedTeacherId },
			});

			// Find the selected teacher's name and update parent state
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

	const hasChanges = selectedTeacherId !== currentTeacherId;

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserCheck className="w-5 h-5" />
					Change Supervising Teacher
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-muted-foreground">
					Current supervising teacher:{" "}
					<span className="font-medium">{currentTeacherName}</span>
				</div>

				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						<User className="w-4 h-4" />
						Select New Supervising Teacher
					</Label>
					<Select
						value={selectedTeacherId?.toString() ?? ""}
						onValueChange={(value) => setSelectedTeacherId(parseInt(value))}
						disabled={isTeacherLoading}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select supervising teacher" />
						</SelectTrigger>
						<SelectContent>
							{teachers?.length ? (
								teachers.map((teacher) => {
									const usedRatio =
										(teacher?.used_resources || 0) /
										(teacher?.total_resources || 1);

									return (
										<SelectItem
											key={teacher?.teacher_id || Math.random()}
											value={teacher?.teacher_id?.toString() || ""}
											disabled={!teacher?.teacher_id}
											className={`
                                            ${
																							usedRatio >= 0.8
																								? "border-l-5 border-primary/50"
																								: usedRatio >= 0.6
																									? "border-l-5 border-primary/70"
																									: "border-l-5 border-primary"
																						}
                                            my-2
                                            `}
										>
											<div className="flex flex-col">
												<span className="font-medium">
													{teacher?.teacher_name || "Unknown Teacher"}
												</span>
												<span
													className={`text-xs font-medium ${
														usedRatio >= 0.8
															? "text-primary/50"
															: usedRatio >= 0.6
																? "text-primary/70"
																: "text-primary"
													}`}
												>
													Available:{" "}
													{teacher?.total_resources - teacher?.used_resources ||
														0}{" "}
													rs [
													{((teacher?.total_resources -
														teacher?.used_resources) /
														teacher?.total_resources) *
														100}
													%]
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

				{hasChanges && (
					<div className="flex gap-2 pt-2 border-t">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setSelectedTeacherId(currentTeacherId)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleTeacherUpdate}
							disabled={isUpdatingTeacher}
						>
							{isUpdatingTeacher ? "Updating..." : "Update Teacher"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const AddNewProject: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	let role = localStorage.getItem("role");
	const { proj } = useLocation().state || {};
	const { data: freshProj } = useGetProjectDetails(proj?.project_id); // TODO enabled
	const currentProj = freshProj?.[0] || proj;
	const isEditing = !!proj;

	useEffect(() => {
		if (freshProj?.[0]) {
			setCurrentTeacher({
				id: freshProj[0].teacher_id || null,
				name: freshProj[0].teacher_name || "",
			});
		}
	}, [freshProj]);

	const [currentTeacher, setCurrentTeacher] = useState({
		id: currentProj?.teacher_id || null,
		name: currentProj?.teacher_name || "",
	});

	const { data: companies = [] } = useGetCompanies();
	const createProjectMutation = useCreateProject();
	const updateProjectMutation = useUpdateProject();
	const createCompanyMutation = useCreateCompany();

	const [formData, setFormData] = useState<FormData>({
		project_name: proj?.project_name || "",
		project_desc: proj?.project_desc || "",
		company_id: proj?.company_id || null,
		company_name: proj?.company_name || "",
		project_status: proj?.project_status || "pending",
		project_url: proj?.project_url || "",
		start_date: proj?.start_date ? proj.start_date.split("T")[0] : "",
		end_date: proj?.end_date ? proj.end_date.split("T")[0] : "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const isValid =
		formData.project_name &&
		formData.company_name &&
		formData.start_date &&
		formData.project_desc;

	const handleChange = (field: keyof FormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCompanySelect = (companyId: string) => {
		const selectedCompany = companies.find(
			(c: any) => c.company_id.toString() === companyId,
		);
		if (selectedCompany) {
			setFormData((prev) => ({
				...prev,
				company_id: selectedCompany.company_id,
				company_name: selectedCompany.company_name,
			}));
		}
	};

	const handleCompanyNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			company_name: e.target.value,
			company_id: null,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid || isSubmitting) return;

		setIsSubmitting(true);
		try {
			let finalCompanyId = formData.company_id;

			// Create company if it doesn't exist
			if (!finalCompanyId && formData.company_name) {
				const newCompany = await createCompanyMutation.mutateAsync({
					company_name: formData.company_name,
				});
				finalCompanyId = newCompany.company_id;
			}

			const submitData = {
				...formData,
				company_id: finalCompanyId,
				start_date: new Date(formData.start_date),
				end_date: formData.end_date ? new Date(formData.end_date) : null,
			};

			if (isEditing) {
				await updateProjectMutation.mutateAsync({
					project_id: proj.project_id,
					data: submitData,
				});
			} else {
				await createProjectMutation.mutateAsync(submitData);
			}

			navigate("/");
		} catch (error) {
			console.error("Failed to submit form:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			<Card className="mb-6">
				<CardContent>
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
							{isEditing ? (
								<Edit className="w-6 h-6" />
							) : (
								<FileText className="w-6 h-6" />
							)}
						</div>
						<div>
							<h1 className="text-2xl font-semibold">
								{isEditing ? t("modifyData") : t("createProj")}
							</h1>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Teacher Assignment Section - Only show when editing and user is teacher */}
			{role === "teacher" && (
				<TeacherAssignmentSection
					start_date={proj.start_date}
					projectId={proj.project_id}
					currentTeacherName={currentTeacher.name}
					currentTeacherId={currentTeacher.id}
					onTeacherUpdate={setCurrentTeacher}
				/>
			)}

			<Card>
				<CardContent className="pt-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Project Name */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<FileText className="w-4 h-4" />
								{t("projName")} *
							</Label>
							<Input
								value={formData.project_name}
								onChange={(e) => handleChange("project_name", e.target.value)}
								placeholder="Enter project name"
								required
							/>
						</div>

						{/* Project URL */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Link className="w-4 h-4" />
								{t("url")}
							</Label>
							<Input
								value={formData.project_url}
								onChange={(e) => handleChange("project_url", e.target.value)}
								placeholder={t("url")}
							/>
						</div>

						{/* Company */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Building2 className="w-4 h-4" />
								{t("companyName")} *
							</Label>
							<Select
								value={formData.company_id?.toString() ?? ""}
								onValueChange={handleCompanySelect}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("dropdownSelectCompany")} />
								</SelectTrigger>
								<SelectContent>
									{companies.map((company: any) => (
										<SelectItem
											key={company.company_id}
											value={company.company_id.toString()}
										>
											{company.company_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Input
								value={formData.company_name}
								onChange={handleCompanyNameInput}
								placeholder="Or enter new company name"
							/>
						</div>

						{/* Dates */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<CalendarDays className="w-4 h-4" />
									{t("startDate")} *
								</Label>
								<Input
									type="date"
									value={formData.start_date}
									onChange={(e) => handleChange("start_date", e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<CalendarDays className="w-4 h-4" />
									{t("dueDate")}
								</Label>
								<Input
									type="date"
									value={formData.end_date}
									onChange={(e) => handleChange("end_date", e.target.value)}
								/>
							</div>
						</div>

						{/* Project Description */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<FileText className="w-4 h-4" />
								{t("projDesc")} *
							</Label>
							<Textarea
								value={formData.project_desc}
								onChange={(e) => handleChange("project_desc", e.target.value)}
								placeholder={t("projDescPlaceholder")}
								rows={4}
								required
							/>
						</div>

						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-4">
								* {t("obligatory")}
							</p>
							<div className="flex gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										navigate(
											role === "teacher" || role === "student" ? "/" : "/login",
										)
									}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={!isValid || isSubmitting}>
									{isSubmitting
										? "Saving..."
										: isEditing
											? "Update Project"
											: t("createPrjButton")}
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default AddNewProject;
