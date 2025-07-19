import React, { useState, useMemo } from "react";
import { VariableSizeList as List } from "react-window";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	FileText,
	Trash2,
	Link,
	MessageSquare,
	Target,
	Plus,
	Search,
	Milestone,
} from "lucide-react";
import dayjs from "dayjs";
import {
	useAddProjectNote,
	useDeleteProjectNote,
	useGetProjectNotes,
} from "@/features/projects/hooks/useProjects.hook";
import { useTranslation } from "react-i18next";
import not_found_3 from "@/assets/not_found_3.svg";

const icons = {
	text: FileText,
	link: Link,
	feedback: MessageSquare,
	milestone: Milestone,
};

// Helper function to estimate item height based on content
const getItemHeight = (note) => {
	const baseHeight = 80; // Base height for padding, icon, and creator info
	const content =
		note.note_type === "link"
			? note.note_url
			: note.note_title || note.note_content || note.note;

	// Estimate height based on content length (rough calculation)
	const estimatedLines = Math.ceil(content.length / 60); // ~60 chars per line
	const contentHeight = Math.max(1, Math.min(estimatedLines, 4)) * 20; // Max 4 lines, 20px per line

	return baseHeight + contentHeight;
};

const NoteItem = ({ index, style, data }) => {
	const note = data.notes[index];
	const Icon = icons[note.note_type] || FileText;

	const firstItemClass = index === 0 ? "mt-4" : "";

	const content =
		note.note_type === "link" ? (
			<a
				href={note.note_url}
				target="_blank"
				className="text-primary text-sm break-words hover:underline"
			>
				{note.note_url}
			</a>
		) : (
			<div className="text-sm break-words whitespace-pre-wrap">
				{note.note_title || note.note_content || note.note}
			</div>
		);

	return (
		<div style={style} className={`px-2 pb-2 ${firstItemClass}`}>
			<div className="flex flex-col gap-2 p-3 bg-secondary rounded-xl">
				<div className="flex items-start gap-3">
					<Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
					<div className="flex-1 min-w-0 overflow-hidden">{content}</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<div className="text-xs text-muted-foreground whitespace-nowrap">
							{dayjs(note.created_at).format("DD.MM")}
						</div>
						<Trash2
							className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
							onClick={() => data.onDelete(note.note_id)}
						/>
					</div>
				</div>
				{note.created_by_name && (
					<div className="text-xs text-muted-foreground ml-7">
						Created by {note.created_by_name}
					</div>
				)}
			</div>
		</div>
	);
};

const QuickAdd = ({ onAdd, isLoading }) => {
	const { t } = useTranslation();
	const [type, setType] = useState("text");
	const [value, setValue] = useState("");

	const submit = async (e) => {
		e.preventDefault();
		if (!value.trim()) return;

		const data =
			type === "link"
				? {
						note_type: "link",
						note_url: value,
						note_title: "",
						note_content: "",
					}
				: {
						note_type: type,
						note_content: value,
						note_title: "",
						note_url: "",
					};

		await onAdd(data);
		setValue("");
	};

	return (
		<form onSubmit={submit} className="flex gap-2 p-3 border-b">
			<Select value={type} onValueChange={setType}>
				<SelectTrigger className="w-24 h-8">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{Object.entries(icons).map(([key, Icon]) => (
						<SelectItem key={key} value={key}>
							<div className="flex items-center gap-1">
								<Icon className="h-3 w-3" />
								<span className="capitalize">{key}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={type === "link" ? "https://..." : t("projects_addNewNote")}
				className="flex-1"
			/>
			<Button
				type="submit"
				disabled={!value.trim() || isLoading}
				className="text-foreground hover:cursor-pointer"
			>
				<Plus className="h-4 w-4" />
			</Button>
		</form>
	);
};

const NotesListing = ({ project }) => {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterBy, setFilterBy] = useState("all");

	const { data: notes, isLoading } = useGetProjectNotes(project.project_id);
	const deleteNoteMutation = useDeleteProjectNote();
	const addNoteMutation = useAddProjectNote();

	const deleteNote = async (noteId) => {
		await deleteNoteMutation.mutateAsync({
			projectId: project.project_id,
			noteId,
		});
	};

	const addNote = async (noteData) => {
		await addNoteMutation.mutateAsync({
			projectId: project.project_id,
			data: {
				...noteData,
				created_by_name: localStorage.getItem("role") || "",
			},
		});
	};

	// Filter and search notes
	const filteredNotes = useMemo(() => {
		if (!notes) return [];

		let filtered = notes;

		// Filter by type
		if (filterBy !== "all") {
			filtered = filtered.filter((note) => note.note_type === filterBy);
		}

		// Search in content
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter((note) => {
				const content =
					note.note_type === "link"
						? note.note_url
						: note.note_title || note.note_content || note.note;
				return (
					content.toLowerCase().includes(search) ||
					(note.created_by_name &&
						note.created_by_name.toLowerCase().includes(search))
				);
			});
		}

		return filtered;
	}, [notes, searchTerm, filterBy]);

	const itemData = useMemo(
		() => ({
			notes: filteredNotes,
			onDelete: deleteNote,
		}),
		[filteredNotes],
	);

	// Function to get height for each item
	const getItemSize = (index) => {
		if (!filteredNotes || !filteredNotes[index]) return 80;
		return getItemHeight(filteredNotes[index]);
	};

	if (isLoading) return null;

	const showQuickAdd = project.project_status !== "completed";
	const listHeight = showQuickAdd ? 380 : 420; // Reduced to account for search/filter space

	return (
		<div className="space-y-4">
			{/* Search and Filter */}
			<div className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("projects_searchNotes")}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={filterBy} onValueChange={setFilterBy}>
					<SelectTrigger className="w-32 h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("projects_notesCategoryAll")}
						</SelectItem>
						<SelectItem value="text">
							<div className="flex items-center gap-1">
								<FileText className="h-3 w-3" />
								{t("projects_notesCategoryText")}
							</div>
						</SelectItem>
						<SelectItem value="link">
							<div className="flex items-center gap-1">
								<Link className="h-3 w-3" />
								{t("projects_notesCategoryLink")}
							</div>
						</SelectItem>
						<SelectItem value="feedback">
							<div className="flex items-center gap-1">
								<MessageSquare className="h-3 w-3" />
								{t("projects_notesCategoryFeedback")}
							</div>
						</SelectItem>
						<SelectItem value="milestone">
							<div className="flex items-center gap-1">
								<Target className="h-3 w-3" />
								{t("projects_notesCategoryMilestone")}
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Notes List */}
			<div className="border rounded-xl overflow-hidden">
				{showQuickAdd && (
					<QuickAdd onAdd={addNote} isLoading={addNoteMutation.isPending} />
				)}
				{!filteredNotes?.length ? (
					<div className="flex flex-col items-center justify-center h-64 font-medium text-md text-center text-muted-foreground">
						<img src={not_found_3} alt="" className="h-24" />
						<span>
							{searchTerm || filterBy !== "all"
								? t("projects_noNotesFound")
								: t("projects_noNotes")}
						</span>
					</div>
				) : (
					<div>
						<List
							height={listHeight}
							itemCount={filteredNotes.length}
							itemSize={getItemSize}
							width={"100%"}
							itemData={itemData}
						>
							{NoteItem}
						</List>
					</div>
				)}
			</div>
		</div>
	);
};

export default NotesListing;
