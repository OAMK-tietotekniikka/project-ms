import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService, projectService, studentService } from "@/shared/services";

type FavoriteCompanies = {
	data: any;
};

type CreateCompanyInput = {
	company_name: string;
};

export const useGetCompanies = (enabled: boolean) => {
	return useQuery({
		queryKey: ["companies"],
		queryFn: () => companyService.listCompanies().then((res) => res.data.data),
		staleTime: 10 * 60 * 1000,
		enabled: enabled
	});
};

export const useGetFavoriteCompanies = (enabled: boolean) => {
	return useQuery({
		queryKey: ["companies", "favorite"],
		queryFn: () =>
			companyService.getFavoriteCompanies().then((res) => res.data.data),
		staleTime: 10 * 60 * 1000,
		enabled: enabled
	});
};

export const useAddFavoriteCompanies = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ data }: FavoriteCompanies) =>
			companyService.addFavoriteCompanies(data).then((res) => res.data.data),
		onSuccess: (newFavoriteCompany, variables) => {
			queryClient.setQueryData(["companies", "favorite"], (oldData: any) => {
				if (!oldData) return [{ company_id: variables.data.company_id}];
				const exists = oldData.some((fav: any) => fav.company_id === variables.data.company_id);
				if (exists) return oldData;
				return [...oldData, { company_id: variables.data.company_id }];
			});
		},
		onError: (error) => {
			console.error("Failed to add favo company", error);
		},
	});
};

export const useDeleteFavoriteCompanies = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (companyId: number) =>
			companyService.deleteFavoriteCompanies(companyId).then((res) => res.data.data),
		onSuccess: (deletedCompany, companyId) => {
			queryClient.setQueryData(["companies", "favorite"], (oldData: any) => {
				if (!oldData) return [];
				return oldData.filter((company: any) => company.company_id !== companyId);
			});
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

			if (Array.isArray(newCompany)) {
				queryClient.setQueryData(["companies"], (oldData: any) => {
					if (!oldData) return [newCompany[0]];

					return [...oldData, newCompany[0]];
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ["companies"] });
			}


		},
	});
};

export const useDeleteCompany = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (companyId: number) =>
			companyService.deleteCompany(companyId).then((res) => res.data.data),
		onSuccess: (deletedCompany, companyId) => {
			queryClient.setQueryData(["companies"], (oldData: any) => {
				if (!oldData) return [];
				return oldData.filter((company: any) => company.company_id !== companyId);
			});

			queryClient.setQueryData(["companies", "favorite"], (oldData: any) => {
				if (!oldData) return [];
				return oldData.filter((company: any) => company.company_id !== companyId);
			});
		},
	});
};