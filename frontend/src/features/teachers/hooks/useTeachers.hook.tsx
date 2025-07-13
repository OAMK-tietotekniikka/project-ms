import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {projectService, studentService, teacherService} from "@/shared/services";

type createTeacher = {
	data: any;
};

type updateTeacher = {
	teacherId: number;
	data: any;
};

export const useTeacherProfile = () => {
	return useQuery({
		queryKey: ["teacher", "profile"],
		queryFn: () =>
			teacherService.getTeacherProfile().then((res) => res.data.data),
		staleTime: 10 * 60 * 1000,
	});
};

export const useGetAllTeachers = () => {
	return useQuery({
		queryKey: ["teachers", "all"],
		queryFn: () => teacherService.getAllTeachers().then((res) => res.data.data),
		staleTime: 10 * 60 * 1000,
	});
};

export const useGetAvailableTeachers = (studyYear: string) => {
	return useQuery({
		queryKey: ["teachers", "available", studyYear],
		queryFn: () =>
			teacherService
				.getAvailableTeachers(studyYear)
				.then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useCreateTeacher = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({data}: createTeacher) =>
			teacherService.createTeacher(data).then((res) => res.data.data),
		onSuccess: (newTeacher) => {
			queryClient.setQueryData(["teachers", "all"], (oldData: any[] | undefined) => {
				if (Object.keys(newTeacher).length === 0) {
					queryClient.invalidateQueries({
						queryKey: ["teacher", "all"]
					});
				} else {
					let new_cached = {
						teacher_id: newTeacher.teacher_id,
						teacher_name: newTeacher.teacher_name,
						email: newTeacher.email,
						used_resources: null,
						total_resources: null,
					}
					if (!oldData) return [new_cached];
					return [...oldData, new_cached];
				}
			});
		},
		onError: (error) => {
			console.error("Failed to create teacher:", error);
		},
	});
};

export const useUpdateTeacher = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ teacherId, data }: updateTeacher) =>
			teacherService.updateTeacherName(teacherId, data).then((res) => res.data.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["teachers", "all"] });
		},
	});
};

