import { apiClient } from "@/lib/api";

export const studentService = {
	getAllStudents: () => apiClient.get("/students/"),
	getStudentProfile: () => apiClient.get("/students/me"),
	getStudentProjects: () => apiClient.get("/projects/student/me"),
	createStudentBatch: (data) => apiClient.post("/students/batch", data),
};

export const projectService = {
	getAllProjects: () => apiClient.get("/projects/"),
	getProjectDetails: (project_id: number) =>
		apiClient.get(`/projects/${project_id}`),
	createProject: (data) => apiClient.post("/projects/", data),
	updateProject: (project_id: number, data) =>
		apiClient.put(`/projects/${project_id}`, data),
	getProjectMembers: (project_id: number) =>
		apiClient.get(`/projects/${project_id}/members`),
	addProjectMember: (project_id: number, data) =>
		apiClient.put(`/projects/${project_id}/members`, data),
	updateProjectStatus: (project_id: number, data) =>
		apiClient.put(`/projects/${project_id}/status`, data),
	updateProjectTeacher: (project_id: number, data) =>
		apiClient.put(`/projects/${project_id}/teacher`, data),
	getProjectNotes: (project_id: number) =>
		apiClient.get(`/projects/${project_id}/notes`),
	addProjectNote: (project_id: number, data) =>
		apiClient.post(`/projects/${project_id}/notes`, data),
	deleteProjectNote: (project_id: number, note_id: number) =>
		apiClient.delete(`projects/${project_id}/notes/${note_id}`),
};

export const companyService = {
	getCompanies: () => apiClient.get("/companies"),
	addFavoriteCompanies: (data) => apiClient.post("/companies/favorite", data),
	getFavoriteCompanies: () => apiClient.get("/companies/favorite"),
	deleteFavoriteCompanies: (data) => apiClient.put("companies/favorite", data),
	createCompany: (data) => apiClient.post("/companies", data),
	deleteCompany: (company_id: number) =>
		apiClient.delete(`/companies/${company_id}`),
};

export const resourcesService = {
	getTeacherResources: () => apiClient.get("/resources/me"),
	getAnyTeacherResources: (teacher_id: number) =>
		apiClient.get(`/resources/${teacher_id}`),
	updateTeacherResources: (resource_id: number, data) =>
		apiClient.put(`/resources/${resource_id}`, data),
	createTeacherResource: (data) => apiClient.post(`/resources/me`, data),
};

export const teacherService = {
	getTeacherProfile: () => apiClient.get("/teachers/me"),
	getTeacherProjects: () => apiClient.get("/projects/teacher/me"),
	getAllTeachers: () => apiClient.get("/teachers/"),
	getAvailableTeachers: (study_year) =>
		apiClient.get(`/teachers/available/${study_year}`),
};
