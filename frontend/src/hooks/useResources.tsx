import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService, resourcesService, teacherService } from "@/services";

type updateResource = {
	resource_id: number;
	teacher_id: number;
	data: any;
};

type createResource = {
	data: any;
};

export const useTeacherResources = () => {
	return useQuery({
		queryKey: ["teacher", "me", "resources"],
		queryFn: () =>
			resourcesService.getTeacherResources().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useAnyTeacherResources = (teacher_id: number) => {
	return useQuery({
		queryKey: ["teacher", teacher_id, "resources"],
		queryFn: () =>
			resourcesService
				.getAnyTeacherResources(teacher_id)
				.then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!teacher_id,
	});
};

export const useUpdateTeacherResources = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ resource_id, data }: updateResource) =>
			resourcesService
				.updateTeacherResources(resource_id, data)
				.then((res) => res.data.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["teacher", variables.teacher_id, "resources"],
			});
		},
	});
};

export const useCreateTeacherResources = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ data }: createResource) =>
			resourcesService.createTeacherResource(data).then((res) => res.data.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["teacher", variables.data.teacher_id, "resources"],
			});
		},
	});
};

//teacher_id,
//total_resources,
//study_year
