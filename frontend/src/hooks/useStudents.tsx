import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesService, studentService } from "@/services";

type batchStudents = {
	data: any;
};

export const useGetAllStudents = () => {
	return useQuery({
		queryKey: ["students", "all"],
		queryFn: () => studentService.getAllStudents().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useBatchStudents = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ data }: batchStudents) =>
			studentService.createStudentBatch(data).then((res) => res.data.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["students", "all"] });
		},
	});
};

export const useStudentProfile = () => {
	return useQuery({
		queryKey: ["student", "profile"],
		queryFn: () =>
			studentService.getStudentProfile().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useStudentProjects = () => {
	return useQuery({
		queryKey: ["student", "projects"],
		queryFn: () =>
			studentService.getStudentProjects().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};
