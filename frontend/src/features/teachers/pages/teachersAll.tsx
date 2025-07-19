import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Plus, Users, GraduationCap } from "lucide-react";
import TeachersList from "@/features/teachers/components/TeachersList";
import { useCreateTeacher } from "@/features/teachers/hooks/useTeachers.hook";
import { toast } from "sonner";

const Teachers: React.FC = () => {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [teacherName, setTeacherName] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const createTeacherMutation = useCreateTeacher();

	const handleDialogChange = (isOpen: boolean) => {
		setIsDialogOpen(isOpen);
		if (!isOpen) {
			setEmail("");
			setTeacherName("");
		}
	};

	const addTeacher = async () => {
		if (!email || !teacherName) {
			toast.error(t("toast_error"));
			return;
		}
		try {
			await createTeacherMutation.mutateAsync({
				data: {
					email: email,
					teacher_name: teacherName,
				},
			});
			setEmail("");
			setTeacherName("");
			setIsDialogOpen(false);
			toast.success(t("toast_success"));
		} catch (error) {
			toast.error(t("toast_error"));
		}
	};
	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div className="flex items-center justify-between">
					<p className="text-xl font-bold">{t("teachersMain") || "Teachers"}</p>

					<Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
						<DialogTrigger asChild>
							<Button variant="outline" className="gap-2">
								<Plus className="h-4 w-4" />
								{t("addTeacher")}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>{t("addTeacher")}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-4">
								<div>
									<label className="capitalize text-sm font-medium mb-2 block">
										{t("name")}
									</label>
									<input
										value={teacherName}
										onChange={(e) => setTeacherName(e.target.value)}
										className="w-full px-3 mb-5 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder={t("enterName").toLowerCase()}
									/>
									<label className="capitalize text-sm font-medium mb-2 block">
										{t("email")}
									</label>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder={t("email")}
									/>
								</div>
								<div className="flex gap-2 pt-4">
									<Button
										onClick={() => setIsDialogOpen(false)}
										variant="outline"
										className="flex-1"
									>
										{t("cancel") || "Cancel"}
									</Button>
									<Button onClick={addTeacher} className="flex-1">
										<Plus className="h-4 w-4" />
										{t("addTeacher") || "Add Teacher"}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Main Content */}
			<div className="bg-card rounded-xl shadow-sm p-6">
				<TeachersList />
			</div>
		</div>
	);
};

export default Teachers;
