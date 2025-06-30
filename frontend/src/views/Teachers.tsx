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
import { Plus, Users, GraduationCap } from "lucide-react";
import TeachersList from "../components/TeacherUI/TeachersList";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const Teachers: React.FC = () => {
	const { t } = useTranslation();
	const [showImportModal, setShowImportModal] = useState(false);
	// add teacher to be added

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="bg-card rounded-lg shadow-sm p-6 mb-6">
				<div className="flex items-center justify-between">
					<p className="text-xl font-bold">{t("teachersMain") || "Teachers"}</p>

					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" className="gap-2">
								<Plus className="h-4 w-4" />
								{t("addTeacher") || "Add Teacher"}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<VisuallyHidden>
									<DialogTitle></DialogTitle>
								</VisuallyHidden>
							</DialogHeader>
							<div className="space-y-4 mt-4">
								<div>
									<label className="text-sm font-medium mb-2 block">
										{t("name")}
									</label>
									<input
										className="w-full px-3 mb-5 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder={t("enterName").toLowerCase()}
									/>

									<label className="text-sm font-medium mb-2 block">
										{t("email")}
									</label>
									<input
										type="email"
										className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder={t("email")}
									/>
								</div>
								<div className="flex gap-2 pt-4">
									<Button className="flex-1">
										{t("addTeacher") || "Add Teacher"}
									</Button>
									<Button variant="outline" className="flex-1">
										{t("cancel") || "Cancel"}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Main Content */}
			<div className="bg-card rounded-lg shadow-sm p-6">
				<TeachersList />
			</div>
		</div>
	);
};

export default Teachers;
