import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import {
	useAddProjectNote,
	useDeleteProjectNote,
	useGetProjectNotes,
} from "@/hooks/useProjects";

interface NotesListingProps {
	projectId: number;
}

const formatDate = (dateString) => {
	if (!dateString) return "Not set";

	const date = dayjs(dateString);
	if (!date.isValid() || date.year() === 1970) {
		return "Not set";
	}

	return date.format("DD.MM.YYYY");
};

const NotesListing: React.FC<NotesListingProps> = ({ projectId }) => {
	const { t } = useTranslation();
	const [newNote, setNewNote] = useState<string>("");
	let project_status = "ongoing"; // TODO : REMOVE

	const {
		data: notes,
		isLoading: isNotesLoading,
		error: notesError,
	} = useGetProjectNotes(projectId);

	const deleteNoteMutation = useDeleteProjectNote();
	const addNoteMutation = useAddProjectNote();

	const deleteProjectNote = async (project_id: number, note_id: number) => {
		try {
			await deleteNoteMutation.mutateAsync({
				project_id: project_id,
				note_id: note_id,
			});
		} catch (error) {
			console.error("Failed to delete note:", error);
		}
	};

	const addNote = async () => {
		if (!newNote.trim()) return;

		try {
			await addNoteMutation.mutateAsync({
				project_id: projectId,
				data: {
					note: newNote,
					document_path: "",
					created_by: localStorage.getItem("role") || "",
				},
			});
			// Clear the input field after successful addition
			setNewNote("");
		} catch (error) {
			console.error("Failed to add note:", error);
		}
	};

	return (
		<div className="space-y-4">
			{isNotesLoading ? (
				<div className="text-center py-8 text-muted-foreground">
					<FileText className="h-12 w-12 mx-auto mb-3" />
					<p>Loading notes...</p>
				</div>
			) : !notes || notes.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
					<p>{t("noNotes")}</p>
				</div>
			) : (
				<div className="mt-4 space-y-4">
					{notes.map((noteItem: any, index) => (
						<div
							key={noteItem.note_id || index}
							className="bg-card border rounded-xl p-4"
						>
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<p className="mb-2">{noteItem.note}</p>
									<p className="text-sm text-muted-foreground">
										{t("by")} {noteItem.created_by} •{" "}
										{formatDate(noteItem.created_at)}
									</p>
								</div>
								<button
									onClick={() => deleteProjectNote(projectId, noteItem.note_id)}
									disabled={deleteNoteMutation.isPending}
									className="hover:cursor-pointer hover:text-primary p-1 disabled:opacity-50"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Note */}
			{project_status !== "completed" && (
				<div className="bg-card rounded-xl p-4">
					<div className="flex gap-3">
						<Input
							type="text"
							placeholder={t("addNewNote")}
							value={newNote}
							onChange={(e) => setNewNote(e.target.value)}
							className="flex-1"
							onKeyPress={(e) => {
								if (e.key === "Enter" && !addNoteMutation.isPending) {
									addNote();
								}
							}}
						/>
						<Button
							onClick={addNote}
							disabled={!newNote.trim() || addNoteMutation.isPending}
						>
							{addNoteMutation.isPending
								? t("saving") || "Saving..."
								: t("saveNote")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default NotesListing;
