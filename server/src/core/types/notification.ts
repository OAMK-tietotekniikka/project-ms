export interface NotificationEvent {
	type:
		| "teacher_update"
		| "resource_update"
		| "project_teacher_update"
		| "project_status_update"
		| "project_note_added"
		| "student_joined_project"
		| "project_details_update";
	timestamp: string;
	userId: number;
	userType: "teacher" | "student";
	data: any;
	relatedIds?: {
		teacherId?: number;
		projectId?: number;
		studentId?: number;
		companyId?: number;
	};
}

export interface NotificationSummary {
	userId: number;
	userType: "teacher" | "student";
	date: string;
	events: {
		teacher_updates: number;
		project_updates: {
			count: number;
			project_ids: number[];
		};
		resource_updates: {
			count: number;
			study_years: string[];
		};
		new_notes: number;
		students_joined: number;
	};
}

export interface NotificationPreference {
	userId: number;
	userType: "teacher" | "student";
	notificationType: string;
	emailEnabled: boolean;
	inAppEnabled: boolean;
}
