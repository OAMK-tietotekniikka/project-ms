export interface Resource {
    resource_id: number;
    teacher_id: number;
    total_resources: number;
    used_resources: number;
    study_year: string
    created_at: Date;
};

export interface NewResource {
    teacher_id: number;
    total_resources: number;
    used_resources: number;
    study_year: string;
};