import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Upload, Search } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import ImportStudents from "../components/TeacherUI/ImportStudents";
import StudentsList from "../components/TeacherUI/StudentsList";

const Students: React.FC = () => {
	const { t } = useTranslation();
	const [showImportModal, setShowImportModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedClass, setSelectedClass] = useState("all");

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="bg-card rounded-lg shadow-sm p-6 mb-6">
				<div className="flex items-center justify-between">
					<p className="text-xl font-bold">{t("studentsMain") || "Students"}</p>

					<Dialog open={showImportModal} onOpenChange={setShowImportModal}>
						<DialogTrigger asChild>
							<Button variant="outline" className="gap-2">
								<Upload className="h-4 w-4" />
								{t("students_importStudents", {
									defaultValue: "Import students",
								})}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<VisuallyHidden>
									<DialogTitle className="flex items-center gap-2">
										<Upload className="h-4 w-4" />
										{t("importStudentsToClass") || "Import Students to Class"}
									</DialogTitle>
								</VisuallyHidden>
							</DialogHeader>
							<ImportStudents handleClose={() => setShowImportModal(false)} />
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Main Content */}
			<div className="bg-card rounded-lg shadow-sm p-6">
				{/* Filters */}
				<div className="flex gap-4 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder={t("students_searchStudents", {
								defaultValue: "Search students...",
							})}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Select value={selectedClass} onValueChange={setSelectedClass}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder={t("students_selectClass")} />
						</SelectTrigger>
						<SelectContent>
							{" "}
							{/* TODO change */}
							<SelectItem value="all">
								{t("students_allClass", { defaultValue: "all classes" })}
							</SelectItem>
							<SelectItem value="none">
								{t("students_noClass", { defaultValue: "no class" })}
							</SelectItem>
							<SelectItem value="din22sp">din22sp</SelectItem>
							<SelectItem value="tvt22sp">tvt22sp</SelectItem>
							<SelectItem value="din23sp">din23sp</SelectItem>
							<SelectItem value="tvt23sp">tvt23sp</SelectItem>
							<SelectItem value="din24sp">din24sp</SelectItem>
							<SelectItem value="tvt24sp">tvt24sp</SelectItem>
							<SelectItem value="din25sp">din25sp</SelectItem>
							<SelectItem value="tvt25sp">tvt25sp</SelectItem>
							<SelectItem value="din26sp">din26sp</SelectItem>
							<SelectItem value="tvt26sp">tvt26sp</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Students List */}
				<StudentsList searchTerm={searchTerm} selectedClass={selectedClass} />
			</div>
		</div>
	);
};

export default Students;
