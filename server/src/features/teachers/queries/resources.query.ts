export const R_QUERY = {
	SELECT_RESOURCES:
		"SELECT * FROM resources ORDER BY created_at DESC LIMIT 1000",
	SELECT_RESOURCE: "SELECT * FROM resources WHERE resource_id = ?",
	CREATE_RESOURCE:
		"INSERT INTO resources (teacher_id, total_resources, used_resources, study_year) VALUES (?, ?, 0, ?) RETURNING resource_id, total_resources, used_resources, study_year",
	UPDATE_RESOURCE:
		"UPDATE resources SET total_resources = ? WHERE resource_id = ?",
	DELETE_RESOURCE: "DELETE FROM resources WHERE resource_id = ?",

	SELECT_INDIVIDUAL_TEACHER_RESOURCES: `SELECT 
    resource_id,
    used_resources, 
    total_resources, 
    study_year
    FROM resources
    WHERE teacher_id = ?`,

	SELECT_RESOURCES_BY_STUDY_YEAR: `
        SELECT r.*, t.teacher_name, t.email 
        FROM resources r
        JOIN teachers t ON r.teacher_id = t.teacher_id
        WHERE r.study_year = ? 
        AND r.used_resources < r.total_resources
        ORDER BY r.used_resources ASC
    `,

	SELECT_TEACHERS_WITH_COMPANY_FAVORITE: `
        SELECT tc.teacher_id
        FROM company_teacher tc
        JOIN companies c ON tc.company_id = c.company_id
        WHERE c.company_name = ?
    `,

	INCREMENT_RESOURCE_USAGE: `
        UPDATE resources 
        SET used_resources = used_resources + 1 
        WHERE teacher_id = ? AND study_year = ? AND used_resources < total_resources
    `,

	DECREMENT_RESOURCE_USAGE: `
        UPDATE resources 
        SET used_resources = used_resources - 1 
        WHERE teacher_id = ? AND study_year = ? AND used_resources > 0
    `,
};
