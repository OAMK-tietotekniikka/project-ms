import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, HeartOff, Loader2, Trash2 } from "lucide-react";

// Import your hooks here
import {
	useCreateCompany,
	useDeleteCompany,
	useGetCompanies,
} from "@/hooks/useCompanies";
import {
	useGetFavoriteCompanies,
	useAddFavoriteCompanies,
	useDeleteFavoriteCompanies,
} from "@/hooks/useCompanies";

const FavoriteCompaniesDialog = ({ open, onOpenChange }) => {
	const { t } = useTranslation();
	const [newCompanyName, setNewCompanyName] = useState("");

	// Data fetching hooks
	const {
		data: companies,
		isLoading: isCompaniesLoading,
		error: companiesError,
	} = useGetCompanies();

	const {
		data: favoriteCompanies,
		isLoading: isFavoriteCompaniesLoading,
		error: favoriteCompaniesError,
	} = useGetFavoriteCompanies();

	console.log("favo companies", favoriteCompanies);
	console.log("companies", companies);

	// Mutation hooks
	const mutateAddFavoriteCompanies = useAddFavoriteCompanies();
	const mutateDeleteFavoriteCompanies = useDeleteFavoriteCompanies();
	const mutateCreateCompany = useCreateCompany();
	const mutateDeleteCompany = useDeleteCompany();

	const handleCreateCompany = async () => {
		if (newCompanyName.trim()) {
			await mutateCreateCompany.mutateAsync({ company_name: newCompanyName });
			console.log("Add new company:", newCompanyName.trim());
			setNewCompanyName("");
		}
	};

	const handleDeleteCompany = async (companyId: number, e) => {
		e.stopPropagation(); // Prevent triggering the favorite toggle
		await mutateDeleteCompany.mutateAsync(companyId);
		console.log("Delete company:", companyId);
	};

	const handleToggleFavorite = async (companyId) => {
		if (isFavorite(companyId)) {
			await mutateDeleteFavoriteCompanies.mutateAsync({
				data: { company_id: companyId },
			});
		} else {
			await mutateAddFavoriteCompanies.mutateAsync({
				data: { company_id: companyId },
			});
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleCreateCompany();
		}
	};

	const isFavorite = (companyId) => {
		return (
			favoriteCompanies?.some((fav) => fav.company_id === companyId) || false
		);
	};

	const closeDialog = () => {
		setNewCompanyName("");
		onOpenChange(false);
	};

	// Show loading state
	if (isCompaniesLoading || isFavoriteCompaniesLoading) {
		return (
			<Dialog open={open} onOpenChange={closeDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-md flex items-center gap-2">
							{t("favoriteCompanies", { defaultValue: "Favorite Companies" })}
						</DialogTitle>
					</DialogHeader>
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span className="ml-2">
							{t("loading", { defaultValue: "Loading..." })}
						</span>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	// Show error state
	if (companiesError || favoriteCompaniesError) {
		return (
			<Dialog open={open} onOpenChange={closeDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-md flex items-center gap-2">
							{t("favoriteCompanies", { defaultValue: "Favorite Companies" })}
						</DialogTitle>
					</DialogHeader>
					<div className="text-center py-8">
						<p>{t("errorLoading", { defaultValue: "Error loading data" })}</p>
					</div>
					<Button variant="outline" onClick={closeDialog} className="w-full">
						{t("close", { defaultValue: "Close" })}
					</Button>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={closeDialog}>
			<DialogContent className="max-w-md max-h-[60vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-md flex items-center gap-2">
						{t("favoriteCompanies", { defaultValue: "Favorite Companies" })}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Companies List */}
					<div className="space-y-2">
						{companies && companies.length > 0 ? (
							companies.map((company) => {
								const isCompanyFavorite = isFavorite(company.company_id);

								return (
									<div
										key={company.company_id}
										className="flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
										onClick={() => handleToggleFavorite(company.company_id)}
									>
										<div className="flex items-center gap-3">
											<span className="font-medium text-sm">
												{company.company_name}
											</span>
											{isCompanyFavorite && (
												<Badge variant="default" className="text-xs">
													{t("favorite", { defaultValue: "Favorite" })}
												</Badge>
											)}
										</div>

										<div className="flex items-center gap-2">
											<button
												onClick={(e) =>
													handleDeleteCompany(company.company_id, e)
												}
												title={t("deleteCompany", {
													defaultValue: "Delete company",
												})}
											>
												<Trash2 className="text-muted-foreground h-4 w-4 hover:text-primary " />
											</button>
											{isCompanyFavorite ? (
												<Heart className="h-4 w-4 text-primary fill-primary" />
											) : (
												<HeartOff className="h-4 w-4 text-muted-foreground" />
											)}
										</div>
									</div>
								);
							})
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>
									{t("noCompanies", { defaultValue: "No companies found" })}
								</p>
							</div>
						)}
					</div>

					{/* Add New Company */}
					<div className="border-t pt-4">
						<h4 className="text-sm font-medium mb-3">
							{t("addNewCompany", { defaultValue: "Add New Company" })}
						</h4>
						<div className="flex gap-2">
							<Input
								placeholder={t("companyName", {
									defaultValue: "Enter company name...",
								})}
								value={newCompanyName}
								onChange={(e) => setNewCompanyName(e.target.value)}
								className="flex-1"
							/>
							<Button
								onClick={handleCreateCompany}
								disabled={!newCompanyName.trim()}
								className="px-3"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="pt-4 border-t">
					<Button variant="outline" onClick={closeDialog} className="w-full">
						{t("close", { defaultValue: "Close" })}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FavoriteCompaniesDialog;
