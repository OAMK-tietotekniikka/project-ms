export interface Project {
    project_id: number;
    project_name: string;
    project_desc: string;
    teacher_id: number,
    company_id: number,
    project_status: string;
    project_url: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
}