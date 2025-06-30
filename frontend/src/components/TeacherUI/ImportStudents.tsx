import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Eye, ArrowLeft, User, Mail } from "lucide-react";
import Papa from "papaparse";
import { useBatchStudents } from "@/hooks/useStudents";
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
	const [error, setError] = useState(null);

	const handleFileChange = (e) => {
		setFile(e.target.files?.[0] || null);
		setError(null);
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
						Back
					</Button>

					{/* Stats on the right */}
					<div className="flex gap-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{validStudents.length}
							</div>
							<div className="text-sm text-muted-foreground">
								Valid Students
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{invalidRows.length}
							</div>
							<div className="text-sm text-muted-foreground">Invalid Rows</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="valid" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="valid" className="flex items-center gap-2">
							Valid Students
							{validStudents.length > 0 && (
								<Badge variant="secondary" className="ml-1">
									{validStudents.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="invalid" className="flex items-center gap-2">
							Invalid Rows
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
									No valid students found
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
									No invalid rows found
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
						Import {validStudents.length} Students
					</Button>
				</div>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Import Students</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Input type="file" accept=".csv" onChange={handleFileChange} />

				{error && <div className="text-sm text-primary">{error}</div>}

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={handleClose}>
						Cancel
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
			</CardContent>
		</Card>
	);
};

export default ImportStudents;
