import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	projectService,
	resourcesService,
	teacherService,
} from "@/core/api/services";

type updateResource = {
	resourceId: number;
	teacher_id: number;
	data: any;
};

type createResource = {
	data: any;
};

export const useAnyTeacherResources = (teacherId: number) => {
	return useQuery({
		queryKey: ["teacher", teacherId, "resources"],
		queryFn: () =>
			resourcesService
				.getAnyTeacherResources(teacherId)
				.then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!teacherId,
	});
};

export const useUpdateTeacherResources = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ resourceId, data }: updateResource) =>
			resourcesService
				.updateTeacherResources(resourceId, data)
				.then((res) => res.data.data),
		onSuccess: (updatedResourceRaw, variables) => {
			const teacherId = updatedResourceRaw.teacher_id || variables.teacher_id;
			if (Object.keys(updatedResourceRaw).length === 0) {
				queryClient.invalidateQueries({
					queryKey: ["teacher", teacherId, "resources"],
				});
			} else {
				let updatedResource = {
					resource_id: updatedResourceRaw.resource_id,
					used_resources: updatedResourceRaw.used_resources,
					total_resources: updatedResourceRaw.total_resources,
					study_year: updatedResourceRaw.study_year,
				};

				queryClient.setQueryData(
					["teacher", teacherId, "resources"],
					(oldData: any[] | undefined) => {
						if (!oldData) return [updatedResource];
						return oldData.map((resource) =>
							resource.resource_id === variables.resourceId
								? updatedResource
								: resource,
						);
					},
				);
			}
		},
	});
};

export const useCreateTeacherResources = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ data }: createResource) =>
			resourcesService.createTeacherResource(data).then((res) => res.data.data),
		onSuccess: (newResource, variables) => {
			const teacherId = newResource.teacher_id || variables.data.teacher_id;

			queryClient.setQueryData(
				["teacher", teacherId, "resources"],
				(oldData: any[] | undefined) => {
					if (!oldData) return [newResource];
					return [...oldData, newResource];
				},
			);
		},
	});
};

//teacher_id,
//total_resources,
//study_year
