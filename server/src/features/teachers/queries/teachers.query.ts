export const QUERY = {
	SELECT_TEACHERS:
		"SELECT teacher_id, teacher_name, email FROM teachers ORDER BY teacher_id ASC LIMIT 50",
	SELECT_TEACHERS_AND_RESOURCES: `
    SELECT 
        t.teacher_id, 
        t.teacher_name, 
        t.email,
        r.used_resources,
        r.total_resources
    FROM teachers t
    LEFT JOIN resources r ON t.teacher_id = r.teacher_id
    AND r.study_year = ?
    `,

	SELECT_TEACHER:
		"SELECT teacher_id, teacher_name, email FROM teachers WHERE teacher_id = ?",
	CREATE_TEACHER: "INSERT INTO teachers (teacher_name, email) VALUES (?, ?) RETURNING *",
	UPDATE_TEACHER: "UPDATE teachers SET teacher_name = ? WHERE teacher_id = ?",

	SELECT_AVAILABLE_TEACHERS: `
        SELECT t.teacher_id, t.teacher_name, t.email, r.used_resources, r.total_resources, r.resource_id
        FROM teachers t
                 JOIN resources r ON t.teacher_id = r.teacher_id
        WHERE r.study_year = ? AND r.used_resources < r.total_resources
    `,
	SELECT_TEACHER_BY_EMAIL:
		"SELECT teacher_id, teacher_name, email FROM teachers WHERE email = ?",
	SELECT_TEACHERS_BY_COMPANY:
		"SELECT teachers.teacher_id, teachers.teacher_name FROM company_teacher JOIN teachers ON company_teacher.teacher_id = teachers.teacher_id JOIN companies ON company_teacher.company_id = companies.company_id WHERE companies.company_name = ?",

	ALLOCATE_TEACHER: `
        SELECT 
            r.*,
            t.teacher_name,
            t.email,
            -- Check if teacher has worked with this student before
            CASE WHEN prev_projects.teacher_id IS NOT NULL THEN 2 ELSE 0 END +
            -- Check if teacher has company as favorite
            CASE WHEN fav_company.teacher_id IS NOT NULL THEN 1 ELSE 0 END as priority_score,
            -- Additional info for debugging/logging
            CASE WHEN prev_projects.teacher_id IS NOT NULL THEN 1 ELSE 0 END as has_previous_projects,
            CASE WHEN fav_company.teacher_id IS NOT NULL THEN 1 ELSE 0 END as has_company_favorite
        FROM resources r
        JOIN teachers t ON r.teacher_id = t.teacher_id
        -- Check for previous projects with this student
        LEFT JOIN (
            SELECT DISTINCT p.teacher_id
            FROM projects p
            JOIN student_project sp ON p.project_id = sp.project_id
            WHERE sp.student_id = ? AND ? IS NOT NULL
        ) prev_projects ON prev_projects.teacher_id = r.teacher_id
        -- Check for company favorites
        LEFT JOIN (
            SELECT teacher_id
            FROM company_teacher
            WHERE company_id = ?
        ) fav_company ON fav_company.teacher_id = r.teacher_id
        WHERE r.study_year = ? 
        AND r.used_resources < r.total_resources
        ORDER BY 
            priority_score DESC,    -- Highest priority first
            r.used_resources ASC    -- Then least utilized
        LIMIT 1
    `,
};
