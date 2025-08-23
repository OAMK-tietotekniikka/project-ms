import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso"; // Changed from react-window
import { Badge } from "@/shared/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Mail, Check } from "lucide-react";
import {
	useGetAllStudents,
	useUpdateStudent,
} from "@/features/students/hooks/useStudents.hook";
import not_found from "@/assets/not_found_1.svg";
import { useListStudentProjectNumbers } from "@/features/projects/hooks/useProjects.hook";

interface StudentsListProps {
	searchTerm: string;
	selectedClass: string;
}

interface Student {
	student_id: number;
	student_name: string;
	email: string;
	class_code?: string;
}

const StudentsList: React.FC<StudentsListProps> = ({
	searchTerm,
	selectedClass,
}) => {
	const { t } = useTranslation();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [editingField, setEditingField] = useState<string>("");
	const [editValue, setEditValue] = useState("");

	const { data: students, isLoading } = useGetAllStudents();
	const updateStudentMutation = useUpdateStudent();
	const { data: studentProjectNumbers } = useListStudentProjectNumbers(
		selectedStudent?.student_id,
	);

	const filteredStudents = useMemo(() => {
		if (!students) return [];
		return students.filter((student: Student) => {
			const matchesSearch =
				!searchTerm ||
				student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				student.email.toLowerCase().includes(searchTerm.toLowerCase());

			const normalizedClass =
				selectedClass === "none" ? null : selectedClass.toLowerCase();

			const matchesClass =
				normalizedClass === "all" ||
				(normalizedClass === null && !student.class_code) ||
				student.class_code?.toLowerCase() === normalizedClass;

			return matchesSearch && matchesClass;
		});
	}, [students, searchTerm, selectedClass]);

	const handleStudentClick = useCallback((student: Student) => {
		setSelectedStudent(student);
		setEditingField("");
	}, []);

	const handleEdit = (field: string, value: string) => {
		setEditingField(field);
		setEditValue(value);
	};

	const handleSave = async (field: string) => {
		if (!selectedStudent) return;
		await updateStudentMutation.mutateAsync({
			studentId: selectedStudent.student_id,
			data: {
				[field]: editValue,
			},
		});
		setSelectedStudent({ ...selectedStudent, [field]: editValue });
		setEditingField("");
	};

	// Loading and empty states remain the same
	if (isLoading) return null;

	if (!students || students.length === 0) {
		return (
			<div className="text-center flex flex-col items-center text-muted-foreground py-12">
				<img src={not_found} alt="Not Found" className="h-24 mb-2" />
				<p className="text-lg font-medium">
					{t("students_noStudentsFound", { defaultValue: "No students found" })}
				</p>
			</div>
		);
	}

	if (filteredStudents.length === 0) {
		return (
			<div className="text-center flex flex-col items-center text-muted-foreground py-12">
				<img src={not_found} alt="Not Found" className="h-24 mb-2" />
				<p className="text-lg font-medium">
					{t("students_noStudentsFound", {
						defaultValue: "No matching students found",
					})}
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="text-sm text-muted-foreground mb-4">
				{t("showing")} {filteredStudents.length} / {students.length}{" "}
				{t("students")}
			</div>

			<div className="border rounded-md flex-1 min-h-0">
				<Virtuoso
					style={{ height: "60vh" }}
					data={filteredStudents}
					overscan={5}
					itemContent={(index, student) => (
						<div
							key={student.student_id}
							className="flex items-center justify-between px-4 py-3 border-b  hover:bg-accent/50 cursor-pointer group"
							onClick={() => handleStudentClick(student)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleStudentClick(student);
								}
							}}
						>
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<p className="font-medium capitalize text-sm truncate group-hover:text-primary transition-colors">
									{student.student_name}
								</p>
								<div className="flex items-center text-xs text-muted-foreground min-w-0">
									<span className="truncate">({student.email})</span>
								</div>
							</div>
						</div>
					)}
				/>
			</div>

			<Dialog
				open={!!selectedStudent}
				onOpenChange={() => setSelectedStudent(null)}
			>
				<DialogContent className="max-w-md max-h-[90vh] flex flex-col">
					<DialogHeader className="flex-shrink-0">
						<DialogTitle>{selectedStudent?.student_name}</DialogTitle>
					</DialogHeader>

					{selectedStudent && (
						<div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-2">
							<div className="flex items-center justify-between py-3 px-1 border-b">
								<span className="text-sm font-medium text-muted-foreground flex-shrink-0">
									{t("name", { defaultValue: "Name" })}
								</span>
								{editingField === "student_name" ? (
									<div className="flex items-center gap-2 min-w-0 flex-shrink">
										<Input
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											className="w-40 h-8"
											autoFocus
										/>
										<Button
											size="sm"
											onClick={() => handleSave("student_name")}
											className="h-8 px-2 flex-shrink-0"
										>
											<Check className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<Button
										variant="ghost"
										onClick={() =>
											handleEdit("student_name", selectedStudent.student_name)
										}
										className="h-8 px-2 text-sm min-w-0 max-w-[200px]"
									>
										<span className="truncate">
											{selectedStudent.student_name}
										</span>
									</Button>
								)}
							</div>

							{studentProjectNumbers && studentProjectNumbers.length > 0 && (
								<div className="py-2 border-b">
									<span className="text-sm font-medium text-muted-foreground block mb-2">
										{t("projects", { defaultValue: "Projects" })}
									</span>
									<div className="flex flex-wrap gap-2">
										{studentProjectNumbers.map((id) => (
											<Badge key={id} variant="outline" className="text-xs">
												<a
													href={`/projects/${id}`}
													className="text-primary hover:underline"
												>
													{id}
												</a>
											</Badge>
										))}
									</div>
								</div>
							)}

							<div className="flex items-center justify-between py-2 border-b">
								<span className="text-sm font-medium text-muted-foreground flex-shrink-0">
									{t("email", { defaultValue: "Email" })}
								</span>
								<span className="text-sm text-muted-foreground px-2 truncate max-w-[200px]">
									{selectedStudent.email}
								</span>
							</div>

							<div className="flex items-center justify-between py-2">
								<span className="text-sm font-medium text-muted-foreground flex-shrink-0">
									{t("class", { defaultValue: "Class" })}
								</span>
								{editingField === "class_code" ? (
									<div className="flex items-center gap-2 min-w-0">
										<Input
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											className="w-32 h-8"
											autoFocus
										/>
										<Button
											size="sm"
											onClick={() => handleSave("class_code")}
											className="h-8 px-2 flex-shrink-0"
										>
											<Check className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<Button
										variant="ghost"
										onClick={() =>
											handleEdit("class_code", selectedStudent.class_code || "")
										}
										className="h-8 px-2 text-sm min-w-0 max-w-[150px]"
									>
										<span className="truncate">
											{selectedStudent.class_code || t("students_noClass")}
										</span>
									</Button>
								)}
							</div>
						</div>
					)}

					<div className="flex-shrink-0 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setSelectedStudent(null)}
							className="w-full hover:cursor-pointer"
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default StudentsList;
