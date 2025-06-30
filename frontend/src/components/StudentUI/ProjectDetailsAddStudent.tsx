import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddStudentFormProps {
	projectId: number;
	onAddStudent: (data: { project_id: number; data: { email: string } }) => void;
	disabled?: boolean;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({
	projectId,
	onAddStudent,
	disabled = false,
}) => {
	const { t } = useTranslation();
	const [studentEmail, setStudentEmail] = useState<string>("");

	const handleAddStudent = () => {
		if (studentEmail.trim()) {
			onAddStudent({
				project_id: projectId,
				data: { email: studentEmail },
			});
			setStudentEmail(""); // Clear input after adding
		}
	};

	return (
		<div className="bg-card rounded-xl p-4">
			<h3 className="font-medium mb-3">{t("addNewStudent")}</h3>
			<div className="flex gap-3">
				<Input
					type="email"
					placeholder={t("email", { defaultValue: "email" })}
					value={studentEmail}
					onChange={(e) => setStudentEmail(e.target.value)}
					className="flex-1"
				/>
				<Button
					onClick={handleAddStudent}
					disabled={!studentEmail.trim() || disabled}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					{t("addStudent")}
				</Button>
			</div>
		</div>
	);
};

export default AddStudentForm;
