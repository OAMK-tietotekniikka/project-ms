export interface NewNote {
    note: string;
    document_path: string;
    created_by: string;
};

export interface Note {
    note_id: number;
    project_id: number;
    note: string;
    document_path: string;
    created_by: string;
    created_at: string;
};