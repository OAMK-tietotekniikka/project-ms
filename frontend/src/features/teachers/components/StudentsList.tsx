import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { User, Mail, Users, Check } from "lucide-react";
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
		console.log(`Saving ${field}:`, editValue);
		await updateStudentMutation.mutateAsync({
			studentId: selectedStudent.student_id,
			data: {
				[field]: editValue,
			},
		});
		if (selectedStudent) {
			setSelectedStudent({ ...selectedStudent, [field]: editValue });
		}
		setEditingField("");
	};

	const StudentItem = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const student = filteredStudents[index];
			return (
				<div style={style}>
					<Card
						className="hover:shadow-md hover:bg-accent/30 transition-shadow duration-100 mb-2 cursor-pointer group"
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
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4 flex-1 min-w-0">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-150 flex-shrink-0">
										<User className="w-5 h-5 text-primary" />
									</div>
									<div className="space-y-1 flex-1 min-w-0">
										<p className="font-medium text-sm group-hover:text-primary transition-colors duration-150 truncate">
											{student.student_name}
										</p>
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Mail className="w-3 h-3 flex-shrink-0" />
											<span className="truncate">{student.email}</span>
										</div>
									</div>
								</div>
								{student.class_code && (
									<Badge
										variant="secondary"
										className="text-xs flex-shrink-0 ml-2"
									>
										{student.class_code}
									</Badge>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			);
		},
		[filteredStudents, handleStudentClick],
	);

	if (isLoading) return null;

	if (!students || students.length === 0) {
		return (
			<div className="text-center flex flex-col text-muted-foreground py-12">
				<p className="text-lg font-medium mb-2">
					<img src={not_found} alt="" className="h-24" />
					{t("students_noStudentsFound", { defaultValue: "No students found" })}
				</p>
			</div>
		);
	}

	if (filteredStudents.length === 0) {
		return (
			<div className="text-center flex flex-col text-muted-foreground py-12">
				<img src={not_found} alt="" className="h-24" />
				<p className="text-lg font-medium  mb-2">
					{t("students_noStudentsFound", { defaultValue: "No students found" })}
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="text-sm text-muted-foreground mb-4">
				{t("showing")} {filteredStudents.length} / {students.length}{" "}
				{t("studentsMain")}
			</div>

			<div className="h-[400px] w-full">
				<List
					height={400}
					width={"100%"}
					itemCount={filteredStudents.length}
					itemSize={130}
					className="p-2"
					overscanCount={5}
				>
					{StudentItem}
				</List>
			</div>

			<Dialog
				open={!!selectedStudent}
				onOpenChange={() => setSelectedStudent(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{selectedStudent?.student_name}</DialogTitle>
					</DialogHeader>
					{selectedStudent && (
						<div className="space-y-3">
							<div className="flex items-center justify-between py-2 border-b">
								<span className="text-sm font-medium">
									{t("name", { defaultValue: "name" })}
								</span>
								{editingField === "student_name" ? (
									<div className="flex items-center gap-2">
										<Input
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											className="w-40 h-8"
											autoFocus
										/>
										<Button
											size="sm"
											onClick={() => handleSave("student_name")}
											className="h-8 px-2"
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
										className="h-8 px-3 text-sm"
									>
										{selectedStudent.student_name}
									</Button>
								)}
							</div>

							{studentProjectNumbers && studentProjectNumbers.length > 0 && (
								<div className="flex items-center justify-between py-2 border-b">
									<span className="text-sm font-medium">
										{t("projects", { defaultValue: "projects" })}
									</span>
									<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
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
								<span className="text-sm font-medium">
									{t("email", { defaultValue: "email" })}
								</span>
								<span className="text-sm text-muted-foreground">
									{selectedStudent.email}
								</span>
							</div>
							<div className="flex items-center justify-between py-2 border-b">
								<span className="text-sm font-medium">
									{t("class", { defaultValue: "class" })}
								</span>
								{editingField === "class_code" ? (
									<div className="flex items-center gap-2">
										<Input
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											className="w-32 h-8"
											autoFocus
										/>
										<Button
											size="sm"
											onClick={() => handleSave("class_code")}
											className="h-8 px-2"
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
										className="h-8 px-3 text-sm"
									>
										{selectedStudent.class_code || t("students_noClass")}
									</Button>
								)}
							</div>
						</div>
					)}
					<Button
						variant="outline"
						onClick={() => setSelectedStudent(null)}
						className="w-full mt-4"
					>
						Close
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default StudentsList;
