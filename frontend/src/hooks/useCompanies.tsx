import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService, projectService, studentService } from "@/services";

type FavoriteCompanies = {
	data: any;
};

type CreateCompanyInput = {
	company_name: string;
};

export const useGetCompanies = () => {
	return useQuery({
		queryKey: ["companies"],
		queryFn: () => companyService.getCompanies().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useGetFavoriteCompanies = () => {
	return useQuery({
		queryKey: ["companies", "favorite"],
		queryFn: () =>
			companyService.getFavoriteCompanies().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useAddFavoriteCompanies = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ data }: FavoriteCompanies) =>
			companyService.addFavoriteCompanies(data).then((res) => res.data.data),
		onSuccess: (favoCompanies) => {
			queryClient.invalidateQueries({ queryKey: ["companies", "favorite"] });
		},
		onError: (error) => {
			console.error("Failed to add favo company", error);
		},
	});
};

export const useDeleteFavoriteCompanies = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ data }: FavoriteCompanies) =>
			companyService.deleteFavoriteCompanies(data).then((res) => res.data.data),
		onSuccess: (favoCompanies) => {
			queryClient.invalidateQueries({ queryKey: ["companies", "favorite"] });
		},
		onError: (error) => {
			console.error("Failed to delete favo company", error);
		},
	});
};

export const useCreateCompany = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateCompanyInput) =>
			companyService.createCompany(data).then((res) => res.data.data),
		onSuccess: (newCompany) => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
		},
	});
};

export const useDeleteCompany = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (company_id: number) =>
			companyService.deleteCompany(company_id).then((res) => res.data.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["companies"] });
		},
	});
};
