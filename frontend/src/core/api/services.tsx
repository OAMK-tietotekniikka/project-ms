import { apiClient } from "@/core/api/api";

export const studentService = {
	getStudentProfile: () => apiClient.get("/students/me"),
	createStudentBatch: (data) => apiClient.post("/students/batchCreate", data),
	getAllStudents: () => apiClient.get("/students/"),
	//createStudent: (data) => apiClient.post("/students/create", data),
	updateStudent: (studentId: number, data) =>
		apiClient.put(`/students/${studentId}`, data),
	deleteStudent: (studentId: number) =>
		apiClient.delete(`/students/${studentId}`),
};

export const projectService = {
	getAllProjects: () => apiClient.get("/projects/"),
	createProject: (data) => apiClient.post("/projects/", data),
	getUserProjects: () => apiClient.get("/projects/me"),
	listStudentProjects: (studentId: number) =>
		apiClient.get(`/students/${studentId}/projects`),
	getExportProjects: () => apiClient.get("/projects/export"),
	getProjectStatistics: () => apiClient.get("/projects/statistics"),

	getProjectMembers: (projectId: number) =>
		apiClient.get(`/projects/${projectId}/members`),
	addProjectMember: (projectId: number, data) =>
		apiClient.post(`/projects/${projectId}/members`, data),

	getInviteCode: (projectId: number) =>
		apiClient.get(`/projects/${projectId}/joinCode`),
	joinProjectWithCode: (data: { joinCode: string }) =>
		apiClient.post(`/projects/joinProject`, data),

	getProjectDetails: (projectId: number) =>
		apiClient.get(`/projects/${projectId}`),
	deleteProject: (projectId: number) => apiClient.get(`/projects/${projectId}`),
	updateProject: (projectId: number, data) =>
		apiClient.put(`/projects/${projectId}`, data),

	updateProjectStatus: (projectId: number, data: { project_status: string }) =>
		apiClient.put(`/projects/${projectId}/updateStatus`, data),

	updateProjectTeacher: (projectId: number, data: { new_teacher_id: number }) =>
		apiClient.put(`/projects/${projectId}/teacher`, data),

	getProjectNotes: (projectId: number) =>
		apiClient.get(`/projects/${projectId}/notes`),

	addProjectNote: (projectId: number, data) =>
		apiClient.post(`/projects/${projectId}/notes`, data),

	deleteProjectNote: (projectId: number, noteId: number) =>
		apiClient.delete(`projects/${projectId}/notes/${noteId}`),
};

export const companyService = {
	listCompanies: () => apiClient.get("/companies"),
	addFavoriteCompanies: (data: { company_id: number | string }) =>
		apiClient.post("/companies/favorites", data),
	getFavoriteCompanies: () => apiClient.get("/companies/favorites"),
	deleteFavoriteCompanies: (companyId: number) =>
		apiClient.delete(`companies/favorites/${companyId}`),
	createCompany: (data) => apiClient.post("/companies/", data),
	deleteCompany: (companyId: number) =>
		apiClient.delete(`/companies/${companyId}`),
};

export const resourcesService = {
	createTeacherResource: (data) => apiClient.post(`/resources/me`, data),
	getAnyTeacherResources: (teacherId: number) =>
		apiClient.get(`/resources/teachers/${teacherId}`),
	updateTeacherResources: (resourceId: number, data) =>
		apiClient.put(`/resources/${resourceId}`, data),
};

export const teacherService = {
	getTeacherProfile: () => apiClient.get("/teachers/me"),
	getAllTeachers: () => apiClient.get("/teachers/"),
	createTeacher: (data) => apiClient.post("/teachers/", data),
	updateTeacherName: (teacherId: number, data) =>
		apiClient.put(`/teachers/${teacherId}`, data),
	getAvailableTeachers: (studyYear) =>
		apiClient.get(`/teachers/available/${studyYear}`),
};

// replace projects!! (one point instead of two)
