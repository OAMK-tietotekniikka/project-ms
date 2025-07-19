export const QUERY = {
	SELECT_STUDENT_BY_EMAIL: `
    SELECT student_id
    FROM students
    WHERE email = ?
    `,

	SELECT_TEACHER_BY_EMAIL: `
    SELECT teacher_id
    FROM teachers
    WHERE email = ?
    `,

	SELECT_PROJECTS: `
        SELECT 
            p.project_id,
            p.teacher_id,
            p.project_name,
            p.project_status,
            t.teacher_name     
        FROM projects p
        LEFT JOIN teachers t ON p.teacher_id = t.teacher_id
        
    `,

	SELECT_PROJECT: `
        SELECT * 
        FROM projects 
        WHERE project_id = ?
    `,

	CREATE_PROJECT: `
        INSERT INTO projects (
            project_name, 
            project_desc, 
            teacher_id, 
            company_id, 
            project_status, 
            project_url,
            study_year,
            start_date, 
            end_date          
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    `,

	UPDATE_PROJECT: `
        UPDATE projects 
        SET 
            project_name = ?, 
            project_desc = ?, 
            company_id = ?, 
            project_status = ?, 
            project_url = ?, 
            study_year = ?,
            start_date = ?, 
            end_date = ? 
        WHERE project_id = ?
    `,

	GET_PROJECT_MEMBERS: `
        SELECT s.student_id, s.student_name
        FROM (
            SELECT student_id FROM student_project WHERE project_id = ?
             ) AS filtered_projects
        JOIN students s ON filtered_projects.student_id = s.student_id
    `,

	UPDATE_PROJECT_STATUS: `
    UPDATE projects
    SET project_status = ? WHERE project_id = ?
    `,

	DELETE_PROJECT_BY_ID: `
        DELETE FROM projects 
        WHERE project_id = ?
    `,

	SELECT_STUDENT_PROJECTS: `
        SELECT * 
        FROM student_project 
        ORDER BY student_id ASC
    `,

	SELECT_STUDENT_PROJECTS_BY_STUDENT_ID: `
        SELECT
            p.project_id,
            p.project_desc,
            p.project_url,
            p.company_id,
            p.teacher_id,
            p.project_name,
            p.project_status,
            p.start_date,
            p.end_date,
            c.company_name,
            t.teacher_name
        FROM projects p
                 INNER JOIN student_project sp ON p.project_id = sp.project_id
                 LEFT JOIN teachers t ON p.teacher_id = t.teacher_id
                 LEFT JOIN companies c ON p.company_id = c.company_id
        WHERE sp.student_id = ?
    `,

	SELECT_STUDENT_PROJECTS_BY_TEACHER_ID: `
        SELECT
            p.project_id,
            p.project_desc,
            p.project_url,
            p.company_id,
            p.teacher_id,
            p.project_name,
            p.project_status,
            p.start_date,
            p.end_date,
            c.company_name,
            t.teacher_name
        FROM projects p
                 INNER JOIN teachers t ON p.teacher_id = t.teacher_id
                 LEFT JOIN companies c ON p.company_id = c.company_id
        WHERE p.teacher_id = ?
    `,

	SELECT_STUDENT_PROJECT_BY_PROJECT_ID: `
        SELECT
            p.project_id,
            p.project_desc,
            p.project_url,
            p.company_id,
            p.teacher_id,
            p.project_name,
            p.project_status,
            p.start_date,
            p.end_date,
            c.company_name,
            t.teacher_name
        FROM projects p
                 LEFT JOIN teachers t ON p.teacher_id = t.teacher_id
                 LEFT JOIN companies c ON p.company_id = c.company_id
        WHERE p.project_id = ?
    `,

	SELECT_STUDENT_PROJECT_BY_STUDENT_AND_PROJECT_ID: `
        SELECT
            p.project_id,
            p.project_desc,
            p.project_url,
            p.company_id,
            p.teacher_id,
            p.project_name,
            p.project_status,
            p.start_date,
            p.end_date,
            c.company_name,
            t.teacher_name
        FROM projects p
                 LEFT JOIN teachers t ON p.teacher_id = t.teacher_id
                 LEFT JOIN companies c ON p.company_id = c.company_id
        WHERE p.project_id = ?
          AND EXISTS (
            SELECT 1
            FROM student_project sp
            WHERE sp.project_id = p.project_id
              AND sp.student_id = ?
        )
    `,
    STUDENT_BELONGS_TO_PROJECT: `
        SELECT 1
        FROM student_project
        WHERE student_id = ? AND project_id = ?
        LIMIT 1;
    `,


    CHECK_PROJECT_CAPACITY: `
    SELECT 
        p.max_students,
        COUNT(sp.student_id) as current_students,
        (COUNT(sp.student_id) < p.max_students) as can_add_student
    FROM projects p
    LEFT JOIN student_project sp ON p.project_id = sp.project_id 
    WHERE p.project_id = ? AND p.active = TRUE
    GROUP BY p.project_id, p.max_students
    `,

	CREATE_STUDENT_PROJECT: `
        INSERT INTO student_project (
            student_id, 
            project_id
        ) 
        VALUES (?, ?)
    `,

    INSERT_PROJECT_NOTE:
        `INSERT INTO project_note (
        project_id,
        note_title,
        note_content,
        note_url,
        note_type,
        created_by_name
    )
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *`,


	SELECT_PROJECT_NOTES: `
        SELECT * 
        FROM project_note 
        WHERE project_id = ?
    `,

	DELETE_PROJECT_NOTE: `
        DELETE FROM project_note 
        WHERE note_id = ? 
        AND project_id = ?
    `,

	DELETE_STUDENT_PROJECT: `
        DELETE FROM student_project 
        WHERE student_id = ? 
        AND project_id = ?
    `,

	DELETE_STUDENT_PROJECT_BY_PROJECT_ID: `
        DELETE FROM student_project 
        WHERE project_id = ?
    `,

	DELETE_PROJECT_NOTES_BY_PROJECT_ID: `
        DELETE FROM project_note 
        WHERE project_id = ?
    `,

	SELECT_PROJECTS_BY_COMPANY_AND_YEAR: `
    SELECT 
    c.company_name,
    COUNT(p.project_id) AS amount_of_projects,
    CONCAT(
        YEAR(p.start_date), 
        '-', 
        YEAR(p.end_date), 
        ' ', 
        CASE 
            WHEN MONTH(p.start_date) BETWEEN 1 AND 6 THEN 'Spring'
            ELSE 'Fall'
        END
    ) AS study_semester
    FROM projects p
    JOIN companies c ON p.company_id = c.company_id
    GROUP BY 
        c.company_name,
        YEAR(p.start_date),
        YEAR(p.end_date),
        CASE 
            WHEN MONTH(p.start_date) BETWEEN 1 AND 6 THEN 'Spring'
        ELSE 'Fall'
    END
ORDER BY 
    c.company_name, 
    study_semester;

    `,
};
