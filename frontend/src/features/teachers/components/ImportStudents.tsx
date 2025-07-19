import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, Upload, Eye, ArrowLeft, User, Mail } from "lucide-react";
import Papa from "papaparse";
import { useBatchStudents } from "@/features/students/hooks/useStudents.hook";
import { toast } from "sonner";

interface ImportStudentsProps {
	handleClose: () => void;
}

const ImportStudents: React.FC<ImportStudentsProps> = ({ handleClose }) => {
	const { t } = useTranslation();
	const batchStudentsMutation = useBatchStudents();
	const predefined_classes = new Set([
		"DIN21SP",
		"DIN22SP",
		"DIN23SP",
		"DIN24SP",
		"DIN25SP",
		"DIN26SP",
		"DIN27SP",
		"DIN28SP",
		"DIN29SP",
		"DIN30SP",
		"TVT21SPO",
		"TVT22SPO",
		"TVT23SPO",
		"TVT24SPO",
		"TVT25SPO",
		"TVT26SPO",
		"TVT27SPO",
		"TVT28SPO",
		"TVT29SPO",
		"TVT30SPO",
		"TVT21KMO",
		"TVT22KMO",
		"TVT23KMO",
		"TVT24KMO",
		"TVT25KMO",
		"TVT26KMO",
		"TVT27KMO",
		"TVT28KMO",
		"TVT29KMO",
		"TVT30KMO",
	]);

	const [file, setFile] = useState<File | null>(null);
	const [validStudents, setValidStudents] = useState([]);
	const [invalidRows, setInvalidRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState(null);

	const handleFileChange = (e) => {
		setFile(e.target.files?.[0] || null);
		setError(null);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			if (files[0]?.type != "text/csv") {
				toast.error(t("pleaseSelectFile"));
				return;
			}

			if (files[0]?.size >= 1024 * 128) {
				toast.error(t("students_importStudents_sizeLimit"));
				return;
			}
			console.log(files);
			handleFileChange({ target: { files } });
		}
	};

	const parseCSV = () => {
		if (!file) return;

		setLoading(true);
		Papa.parse<string[]>(file, {
			delimiter: ";",
			skipEmptyLines: true,
			complete: (results) => {
				const rows = results.data.slice(1); // Skip header
				const valid = [];
				const invalid = [];

				rows.forEach((row: string[], index) => {
					const studentNumIndex = row.findIndex((cell) =>
						/^\d+$/.test(cell?.trim()),
					);

					if (studentNumIndex > -1) {
						const firstName = row[studentNumIndex + 1]?.trim() || "";
						const lastName = row[studentNumIndex + 2]?.trim() || "";
						const email = row[studentNumIndex + 3]?.trim() || "";
						const classes_set = new Set(
							row.slice(0, studentNumIndex).map((s) => s.trim().toUpperCase()),
						);
						const has_predefined_class = () => {
							for (const c of classes_set) {
								if (predefined_classes.has(c)) {
									return c;
								}
							}
							return "";
						};

						valid.push({
							student_name: `${firstName} ${lastName}`.trim(),
							email: email,
							class_code: has_predefined_class(),
						});
					} else {
						invalid.push({
							line: index + 2,
							content: row.join(";"),
						});
					}
				});

				setValidStudents(valid);
				setInvalidRows(invalid);
				setShowPreview(true);
				setLoading(false);
			},
			error: () => {
				setError("Failed to parse CSV file");
				setLoading(false);
			},
		});
	};

	const handleImport = async () => {
		setLoading(true);
		console.log("Importing:", validStudents);

		try {
			await batchStudentsMutation.mutateAsync({
				data: { students: validStudents },
			});
			setLoading(false);
			toast.success(t("toast_success"));
			handleClose();
		} catch (err) {
			toast.error(t("toast_error"));
			setError("Import failed.");
		} finally {
			setLoading(false);
		}
	};

	const StudentRow = ({ index, style }) => (
		<div
			style={style}
			className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50"
		>
			<div className="flex items-center flex-1">
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium truncate">
						{validStudents[index].student_name}
					</div>

					<div className="flex gap-2 text-xs text-muted-foreground truncate">
						<Badge className="text-xs" variant="secondary">
							{validStudents[index].email}
						</Badge>
						<Badge className="text-xs" variant="secondary">
							{validStudents[index].class_code}
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);

	const InvalidRow = ({ index, style }) => (
		<div style={style} className="p-4 border-b last:border-b-0">
			<div className="text-sm font-medium">Line {invalidRows[index].line}</div>
			<div className="text-xs text-muted-foreground mt-1 font-mono bg-muted p-2 rounded">
				{invalidRows[index].content}
			</div>
		</div>
	);

	if (showPreview) {
		return (
			<div className="space-y-6">
				{/* Header with stats */}
				<div className="flex items-center justify-between">
					<Button
						className="hover:cursor-pointer"
						variant="outline"
						onClick={() => setShowPreview(false)}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						{t("back")}
					</Button>

					{/* Stats on the right */}
					<div className="flex gap-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{validStudents.length}
							</div>
							<div className="text-sm text-muted-foreground">
								{t("students_importStudents_valid")}
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{invalidRows.length}
							</div>
							<div className="text-sm text-muted-foreground">
								{t("students_importStudents_invalid")}
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="valid" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger
							value="valid"
							className="flex items-center gap-2 dark:data-[state=active]:bg-card"
						>
							{t("students_importStudents_valid")}
							{validStudents.length > 0 && (
								<Badge variant="secondary" className="ml-1">
									{validStudents.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger
							value="invalid"
							className="flex items-center gap-2 dark:data-[state=active]:bg-card"
						>
							{t("students_importStudents_valid")}
							{invalidRows.length > 0 && (
								<Badge variant="secondary" className="ml-1">
									{invalidRows.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="valid" className="mt-4">
						{validStudents.length > 0 ? (
							<Card>
								<CardContent className="p-0">
									<List
										height={250}
										width={"100%"}
										itemCount={validStudents.length}
										itemSize={100}
									>
										{StudentRow}
									</List>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="p-8 text-center text-muted-foreground">
									{t("students_importStudents_valid_notFound")}
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="invalid" className="mt-4">
						{invalidRows.length > 0 ? (
							<Card>
								<CardContent className="p-0">
									<List
										height={250}
										width={"100%"}
										itemCount={invalidRows.length}
										itemSize={100}
									>
										{InvalidRow}
									</List>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="p-8 text-center text-muted-foreground">
									{t("students_importStudents_invalid_notFound")}
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>

				{/* Import button */}
				<div className="flex justify-end">
					<Button
						onClick={handleImport}
						disabled={loading || validStudents.length === 0}
					>
						{loading ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Upload className="w-4 h-4 mr-2" />
						)}
						{t("students_importStudents_count", {
							count: validStudents?.length || 0,
						})}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => document.getElementById("file-input").click()}
				className={`
    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
    ${
			isDragging
				? "border-primary bg-primary/10"
				: file
					? "border-primary bg-primary/3"
					: "border-muted-foreground hover:border-primary"
		}
  `}
			>
				<Input
					id="file-input"
					type="file"
					accept=".csv"
					onChange={handleFileChange}
					className="hidden"
				/>
				<div className="flex items-center justify-center space-x-2">
					<p
						className={`text-sm max-w-[350px] break-words ${file ? "text-primary font-medium" : "text-muted-foreground"}`}
					>
						{isDragging
							? t("students_importStudents_dropHere")
							: file?.name
								? `${file.name}`
								: t("students_importStudents_clickDragFile")}
					</p>
				</div>
				{file && (
					<p className="text-xs text-muted-foreground mt-1">
						{(file.size / 1024).toFixed(1)} KB •{" "}
						{t("students_importStudents_readyImport")}
					</p>
				)}
			</div>

			{error && <div className="text-sm text-primary">{error}</div>}

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={handleClose}>
					{t("cancel") || "Cancel"}
				</Button>
				<Button onClick={parseCSV} disabled={!file || loading}>
					{loading ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Eye className="w-4 h-4 mr-2" />
					)}
					{t("students_importStudents_preview")}
				</Button>
			</div>
		</div>
	);
};

export default ImportStudents;
