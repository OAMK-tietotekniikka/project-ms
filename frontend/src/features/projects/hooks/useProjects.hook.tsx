import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/core/api/services";

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
	project_id: number;
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
	projectId: number;
	data: any;
};

type updateProject = {
	projectId: number;
	data: any;
};

type projectNote = {
	projectId: number;
	data: any;
};

type delete_projectNote = {
	projectId: number;
	noteId: number;
};

type joinCode = {
	joinCode: string;
};

export const useGetProjectDetails = (projectId: number) => {
	return useQuery({
		queryKey: ["projects", projectId, "details"],
		queryFn: () =>
			projectService.getProjectDetails(projectId).then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!projectId,
	});
};

export const useGetAllProjects = () => {
	return useQuery({
		queryKey: ["projects", "list"],
		queryFn: () => projectService.getAllProjects().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useListStudentProjectNumbers = (studentId: number) => {
	return useQuery({
		queryKey: ["students", studentId, "projects"],
		queryFn: () =>
			projectService
				.listStudentProjects(studentId)
				.then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!studentId,
	});
};

// get personal projects
export const useGetUserProjects = () => {
	return useQuery({
		queryKey: ["me", "projects"],
		queryFn: () =>
			projectService.getUserProjects().then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
	});
};

export const useCreateProject = () => {
	const queryClient = useQueryClient();

	return useMutation<CreateProjectResponse, Error, CreateProjectData>({
		mutationFn: (data: CreateProjectData) =>
			projectService.createProject(data).then((res) => res.data.data),
		onSuccess: (newProject) => {
			// Update projects list (dont update since only students can create a new project)
			//queryClient.setQueryData(["projects", "list"], (oldData: any[]) => {
			//	return oldData ? [...oldData, newProject] : [newProject];
			//});

			// Update user's projects
			console.log("created Project", newProject);
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
		mutationFn: ({ projectId, data }: updateProject) =>
			projectService
				.updateProject(projectId, data)
				.then((res) => res.data.data),
		onSuccess: (updatedProject, { projectId }) => {
			const safelyMergeProject = (existingProject: any, updates: any) => {
				if (!existingProject) return updates;
				console.log("existingProject", existingProject);
				console.log("updates", updates);

				// Preserve important fields that might not be in the update response
				return {
					...existingProject,
					...updates,

					teacher_id: updates.teacher_id ?? existingProject.teacher_id,
					teacher_name: updates.teacher_name ?? existingProject.teacher_name,
				};
			};

			// Update project details
			console.log("updatedProject", updatedProject);
			queryClient.setQueryData(
				["projects", projectId, "details"],
				(oldData: any) => {
					return safelyMergeProject(oldData, updatedProject);
				},
			);

			// Update project in all projects list

			queryClient.setQueryData(["projects", "list"], (oldData: any[]) => {
				console.log("old data:", oldData, projectId, updatedProject);
				return (
					oldData?.map((project) =>
						project.project_id === projectId
							? {
									...project,
									project_name:
										updatedProject.project_name || project.project_name,
								}
							: project,
					) || []
				);
			});

			// Update project in user's projects
			queryClient.setQueryData(["me", "projects"], (oldData: any[]) => {
				if (!oldData) return [];
				console.log("old data:", oldData);
				return oldData.map((project) =>
					project.project_id === projectId
						? safelyMergeProject(project, updatedProject)
						: project,
				);
			}); // todo check contents for student
		},
		onError: (error) => {
			console.error("Failed to update project:", error);
		},
	});
};

export const useGetProjectMembers = (projectId: number) => {
	return useQuery({
		queryKey: ["projects", projectId, "members"],
		queryFn: () =>
			projectService.getProjectMembers(projectId).then((res) => res.data.data),
		staleTime: 5 * 60 * 1000,
		enabled: !!projectId,
	});
};

export const useGetProjectNotes = (projectId: number) => {
	return useQuery({
		queryKey: ["projects", projectId, "notes"],
		queryFn: () =>
			projectService
				.getProjectNotes(projectId)
				.then((res) => res.data.data || []),
		staleTime: 5 * 60 * 1000,
		enabled: !!projectId,
	});
};

export const useAddProjectNote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ projectId, data }: projectNote) =>
			projectService
				.addProjectNote(projectId, data)
				.then((res) => res.data.data),
		onSuccess: (newNote, { projectId }) => {
			// Update notes list by adding the new note
			queryClient.setQueryData(
				["projects", projectId, "notes"],
				(oldNotes: any[]) => {
					return oldNotes ? [...oldNotes, newNote[0]] : [newNote[0]];
				},
			);
		},
		onError: (error) => {
			console.error("Failed to add a new note:", error);
		},
	});
};

export const useDeleteProjectNote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ projectId, noteId }: delete_projectNote) =>
			projectService
				.deleteProjectNote(projectId, noteId)
				.then((res) => res.data.data),
		onSuccess: (res, { projectId, noteId }) => {
			// Remove the deleted note from the notes list
			queryClient.setQueryData(
				["projects", projectId, "notes"],
				(oldNotes: any[]) => {
					return oldNotes?.filter((note) => note.note_id !== noteId) || [];
				},
			);

			console.log("Delete successful, updated cache for project:", projectId);
		},
		onError: (error) => {
			console.error("Failed to delete a note:", error);
		},
	});
};

export const useJoinProject = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ joinCode }: joinCode) =>
			projectService
				.joinProjectWithCode({ joinCode })
				.then((res) => res.data.data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["me", "projects"],
			});
		},
		onError: (error: unknown) => {
			console.error("Failed to join a project:", error);
		},
	});
};

// used to generate a new project join code
export const useAddProjectMember = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ projectId, data }: AddMemberInput) =>
			projectService
				.addProjectMember(projectId, data)
				.then((res) => res.data.data),
		onSuccess: (newMember, { projectId }) => {},
		onError: (error) => {
			console.error("Failed to add a new member:", error);
		},
	});
};

export const useUpdateProjectStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ projectId, data }: AddMemberInput) =>
			projectService
				.updateProjectStatus(projectId, data)
				.then((res) => res.data.data),
		onSuccess: (updatedProjectStatus, { projectId }) => {
			// Project details is a single object, not an array
			console.log("updatedProjectStatus", updatedProjectStatus);
			queryClient.setQueryData(
				["projects", projectId, "details"],
				(oldData: any) => {
					return oldData
						? {
								...oldData,
								project_status:
									updatedProjectStatus.project_status || oldData.project_status,
							}
						: null;
				},
			);

			// Update in projects list (this is an array)
			queryClient.setQueryData(["projects", "list"], (oldData: any[]) => {
				return (
					oldData?.map((project) =>
						project.project_id === projectId
							? {
									...project,
									project_status:
										updatedProjectStatus.project_status ||
										project.project_status,
								}
							: project,
					) || []
				);
			});

			// Update in user's projects
			queryClient.setQueryData(["me", "projects"], (oldData: any[]) => {
				return (
					oldData?.map((project) =>
						project.project_id === projectId
							? {
									...project,
									project_status:
										updatedProjectStatus.project_status ||
										project.project_status,
								}
							: project,
					) || []
				);
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
		mutationFn: ({ projectId, data }: AddMemberInput) =>
			projectService
				.updateProjectTeacher(projectId, data)
				.then((res) => res.data.data),
		onSuccess: (updatedTeacher, { projectId }) => {
			// Update project details cache

			console.log("updatedTeacher", updatedTeacher);

			queryClient.invalidateQueries({ queryKey: ["me", "projects"] }); // todo improve
			// todo add invalidate for available teachers

			queryClient.setQueryData(
				["projects", projectId, "details"],
				(oldData: any) => {
					console.log("oldData", oldData);
					return oldData
						? {
								...oldData,
								teacher_id: updatedTeacher.teacher_id || oldData.teacher_id,
								teacher_name:
									updatedTeacher.teacher_name || oldData.teacher_name,
							}
						: null;
				},
			);

			// Update in all projects list
			queryClient.setQueryData(["projects", "list"], (oldProjects: any[]) => {
				if (!oldProjects) return oldProjects;
				return oldProjects.map((project) =>
					project.project_id === projectId
						? {
								...project,
								teacher_id: updatedTeacher.teacher_id || project.teacher_id,
								teacher_name:
									updatedTeacher.teacher_name || project.teacher_name,
							}
						: project,
				);
			});
		},
		onError: (error) => {
			console.error("Failed to update project teacher", error);
		},
	});
};
