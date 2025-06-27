import { useQuery } from "@tanstack/react-query";
import { teacherService } from "@/services";

export const useTeacherProfile = () => {
	return useQuery({
		queryKey: ["teacher", "profile"],
		queryFn: () =>
			teacherService.getTeacherProfile().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useGetAllTeachers = () => {
	return useQuery({
		queryKey: ["teachers", "all"],
		queryFn: () => teacherService.getAllTeachers().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useGetAvailableTeachers = (study_year: string) => {
	return useQuery({
		queryKey: ["teachers", "available", study_year],
		queryFn: () =>
			teacherService
				.getAvailableTeachers(study_year)
				.then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useTeacherProjects = () => {
	return useQuery({
		queryKey: ["me", "projects"],
		queryFn: () =>
			teacherService.getTeacherProjects().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};
