import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services";

interface CreateProjectData {
	project_name: string;
	project_desc: string;
	company_id: number;
	project_status: string;
	project_url: string;
	start_date: Date | null;
	end_date: Date | null;
}

interface CreateProjectResponse {
	id: number;
	project_name: string;
	project_desc: string;
	company_id: number;
	project_status: string;
	project_url: string;
	start_date: Date | null;
	end_date: Date | null;
	teacher_id?: number;
}

type AddMemberInput = {
	project_id: number;
	data: any;
};

type updateProject = {
	project_id: number;
	data: any;
};

type projectNote = {
	project_id: number;
	data: any;
};

type delete_projectNote = {
	project_id: number;
	note_id: number;
};

export const useGetProjectDetails = (project_id: number) => {
	return useQuery({
		queryKey: ["projects", project_id, "details"],
		queryFn: () =>
			projectService.getProjectDetails(project_id).then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!project_id,
	});
};

export const useGetAllProjects = () => {
	return useQuery({
		queryKey: ["projects", "all"],
		queryFn: () => projectService.getAllProjects().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useCreateProject = () => {
	const queryClient = useQueryClient();

	return useMutation<CreateProjectResponse, Error, CreateProjectData>({
		mutationFn: (data: CreateProjectData) =>
			projectService.createProject(data).then((res) => res.data.data),
		onSuccess: (newProject) => {
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
			queryClient.invalidateQueries({ queryKey: ["me", "projects"] });
		},
		onError: (error) => {
			console.error("Failed to create project:", error);
		},
	});
};

export const useUpdateProject = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, data }: updateProject) =>
			projectService
				.updateProject(project_id, data)
				.then((res) => res.data.data),
		onSuccess: (updatedProject, { project_id }) => {
			console.log("Update success - updatedProject:", updatedProject);
			console.log("Update success - project_id:", project_id);

			// Update individual project details cache
			queryClient.setQueryData(
				["projects", project_id, "details"],
				updatedProject,
			);

			// Get current cache data for debugging
			const currentCache = queryClient.getQueryData(["me", "projects"]);
			console.log("Current cache before update:", currentCache);

			// Update projects cache with better error handling
			queryClient.setQueryData(["me", "projects"], (oldProjects: any[]) => {
				console.log("oldProjects in cache update:", oldProjects);

				if (!oldProjects || !Array.isArray(oldProjects)) {
					console.log(
						"No old projects or not an array, returning updated project",
					);
					return [updatedProject];
				}

				const updatedProjects = oldProjects.map((project) => {
					console.log("Comparing:", project.project_id, "with", project_id);
					if (project.project_id === project_id) {
						console.log("Found matching project, updating...");
						return { ...project, ...updatedProject };
					}
					return project;
				});

				console.log("Updated projects array:", updatedProjects);
				return updatedProjects;
			});

			// Force invalidation to ensure fresh data (this is the most reliable approach)

			// Also update the 'all' projects cache
			queryClient.setQueryData(["projects", "all"], (oldProjects: any[]) => {
				if (!oldProjects || !Array.isArray(oldProjects))
					return [updatedProject];
				return oldProjects.map((project) =>
					project.project_id === project_id
						? { ...project, ...updatedProject }
						: project,
				);
			});
		},
		onError: (error) => {
			console.error("Failed to update project", error);
		},
	});
};

export const useGetProjectMembers = (project_id: number) => {
	return useQuery({
		queryKey: ["projects", project_id, "members"],
		queryFn: () =>
			projectService.getProjectMembers(project_id).then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!project_id,
	});
};

export const useGetProjectNotes = (project_id: number) => {
	return useQuery({
		queryKey: ["projects", project_id, "notes"],
		queryFn: () =>
			projectService
				.getProjectNotes(project_id)
				.then((res) => res.data.data || []),
		staleTime: 5 * 60 * 1000,
		enabled: !!project_id,
	});
};

export const useAddProjectNote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, data }: projectNote) =>
			projectService
				.addProjectNote(project_id, data)
				.then((res) => res.data.data),
		onSuccess: (newNote, { project_id }) => {
			queryClient.invalidateQueries({
				queryKey: ["projects", project_id, "notes"],
			});
		},
		onError: (error) => {
			console.error("Failed to add a new note:", error);
		},
	});
};

export const useDeleteProjectNote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, note_id }: delete_projectNote) =>
			projectService
				.deleteProjectNote(project_id, note_id)
				.then((res) => res.data.data),
		onSuccess: (res, { project_id }) => {
			queryClient.invalidateQueries({
				queryKey: ["projects", project_id, "notes"],
			});
			console.log(
				"Delete successful, invalidating cache for project:",
				project_id,
			);
		},
		onError: (error) => {
			console.error("Failed to delete a note:", error);
		},
	});
};

export const useAddProjectMember = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, data }: AddMemberInput) =>
			projectService
				.addProjectMember(project_id, data)
				.then((res) => res.data.data),
		onSuccess: (newMember, { project_id }) => {
			queryClient.invalidateQueries({
				queryKey: ["projects", project_id, "members"],
			});
		},
		onError: (error) => {
			console.error("Failed to add a new member:", error);
		},
	});
};

export const useUpdateProjectStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, data }: AddMemberInput) =>
			projectService
				.updateProjectStatus(project_id, data)
				.then((res) => res.data.data),
		onSuccess: (updatedProjectStatus, { project_id }) => {
			queryClient.invalidateQueries({
				queryKey: ["projects", project_id, "details"],
			});
		},
		onError: (error) => {
			console.error("Failed to update project status", error);
		},
	});
};

export const useUpdateProjectTeacher = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ project_id, data }: AddMemberInput) =>
			projectService
				.updateProjectTeacher(project_id, data)
				.then((res) => res.data.data),
		onSuccess: (updatedProject, { project_id }) => {
			// Update project details cache
			queryClient.setQueryData(
				["projects", project_id, "details"],
				(oldProject: any) => {
					return oldProject
						? { ...oldProject, ...updatedProject }
						: updatedProject;
				},
			);

			// Update in all projects list
			queryClient.setQueryData(["projects", "all"], (oldProjects: any[]) => {
				if (!oldProjects) return oldProjects;
				return oldProjects.map((project) =>
					project.id === project_id
						? { ...project, ...updatedProject }
						: project,
				);
			});

			// Update student projects if exists
			queryClient.setQueryData(
				["student", "projects"],
				(oldProjects: any[]) => {
					if (!oldProjects) return oldProjects;
					return oldProjects.map((project) =>
						project.id === project_id
							? { ...project, ...updatedProject }
							: project,
					);
				},
			);
		},
		onError: (error) => {
			console.error("Failed to update project teacher", error);
		},
	});
};
