export interface Student {
    student_id: number;
    student_name: string;
    email: string;
    class_code: string;
    created_at: Date;
}

export interface UpdatedStudent {
    student_name: string;
    email: string;
    class_code: string;
}

export interface newStudent {
    student_name: string;
    email: string;
    class_code: string;
}
