import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
	Plus,
	Heart,
	HeartOff,
	Loader2,
	Trash2,
	Ellipsis,
	LoaderCircle,
	Search,
} from "lucide-react";

// Import your hooks here
import {
	useCreateCompany,
	useDeleteCompany,
	useGetCompanies,
} from "@/features/companies/hooks/useCompanies.hook";
import {
	useGetFavoriteCompanies,
	useAddFavoriteCompanies,
	useDeleteFavoriteCompanies,
} from "@/features/companies/hooks/useCompanies.hook";
import { toast } from "sonner";

import { Virtuoso } from "react-virtuoso";

const FavoriteCompaniesDialog = ({ open, onOpenChange }) => {
	const { t } = useTranslation();
	const [newCompanyName, setNewCompanyName] = useState("");
	const [searchTerm, setSearchTerm] = useState("");

	// Data fetching hooks
	const {
		data: companies,
		isLoading: isCompaniesLoading,
		error: companiesError,
	} = useGetCompanies(open);

	const {
		data: favoriteCompanies,
		isLoading: isFavoriteCompaniesLoading,
		error: favoriteCompaniesError,
	} = useGetFavoriteCompanies(open);

	// Mutation hooks
	const mutateAddFavoriteCompanies = useAddFavoriteCompanies();
	const mutateDeleteFavoriteCompanies = useDeleteFavoriteCompanies();
	const createCompanyMutation = useCreateCompany();
	const deleteCompanyMutation = useDeleteCompany();

	const filteredCompanies = useMemo(() => {
		if (!companies) return [];

		if (!searchTerm.trim()) {
			return companies;
		}

		return companies.filter((company) =>
			company.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [companies, searchTerm]);

	const handleCreateCompany = async () => {
		if (newCompanyName.trim()) {
			await createCompanyMutation.mutateAsync({ company_name: newCompanyName });
			setNewCompanyName("");
		}
	};

	const handleDeleteCompany = async (companyId: number, e) => {
		e.stopPropagation(); // Prevent triggering the favorite toggle
		try {
			await deleteCompanyMutation.mutateAsync(companyId);
		} catch (error) {
			toast.error(t("toast_error_deleteCompany"));
		}
	};

	const handleToggleFavorite = async (companyId) => {
		if (isFavorite(companyId)) {
			await mutateDeleteFavoriteCompanies.mutateAsync(companyId);
		} else {
			await mutateAddFavoriteCompanies.mutateAsync({
				data: { company_id: companyId },
			});
		}
	};

	const isFavorite = (companyId) => {
		return (
			favoriteCompanies?.some((fav) => fav.company_id === companyId) || false
		);
	};

	const closeDialog = () => {
		setNewCompanyName("");
		setSearchTerm("");
		onOpenChange(false);
	};

	// Company item renderer for Virtuoso
	const CompanyItem = (index) => {
		const company = filteredCompanies[index]; // Use filteredCompanies instead of companies
		const isCompanyFavorite = isFavorite(company.company_id);

		return (
			<div
				key={company.company_id}
				className="flex items-center justify-between py-3 px-3 border rounded-xl hover:bg-accent/50 cursor-pointer mb-2"
				onClick={() => handleToggleFavorite(company.company_id)}
			>
				<div className="flex items-center gap-3">
					<span className="font-medium text-sm">{company.company_name}</span>
					{isCompanyFavorite && (
						<Badge variant="default" className="text-xs">
							{t("favorite", { defaultValue: "Favorite" })}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={(e) => handleDeleteCompany(company.company_id, e)}
						title={t("deleteCompany", {
							defaultValue: "Delete company",
						})}
					>
						<Trash2 className="text-muted-foreground h-4 w-4 hover:text-primary" />
					</button>
					{isCompanyFavorite ? (
						<Heart className="h-4 w-4 text-primary fill-primary" />
					) : (
						<HeartOff className="h-4 w-4 text-muted-foreground hover:text-primary" />
					)}
				</div>
			</div>
		);
	};

	// Empty state component
	const EmptyState = () => (
		<div className="text-center py-8 text-muted-foreground">
			<Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
			<p>{t("noCompanies", { defaultValue: "No companies found" })}</p>
		</div>
	);

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
						<LoaderCircle className="w-5 h-5 animate-spin" />
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
			<DialogContent className="max-w-md max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-md flex items-center gap-2">
						{t("favoriteCompanies", { defaultValue: "Favorite Companies" })}
					</DialogTitle>
				</DialogHeader>
				<div className="pb-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("searchCompanies", {
								defaultValue: "Search companies...",
							})}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				<div className="flex-1 flex flex-col space-y-4 min-h-0">
					{/* Companies List with Virtuoso */}
					<div className="flex-1 min-h-0">
						{filteredCompanies && filteredCompanies.length > 0 ? (
							<Virtuoso
								style={{
									height:
										window.innerHeight >= 800
											? "350px"
											: window.innerHeight >= 600
												? "150px"
												: "75px",
								}}
								totalCount={filteredCompanies.length}
								itemContent={CompanyItem}
							/>
						) : (
							<EmptyState />
						)}
					</div>

					{/* Add New Company */}
					<div className="border-t pt-4 flex-shrink-0">
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
								className="text-foreground px-3"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="pt-4 border-t flex-shrink-0">
					<Button variant="outline" onClick={closeDialog} className="w-full">
						{t("close", { defaultValue: "Close" })}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FavoriteCompaniesDialog;
