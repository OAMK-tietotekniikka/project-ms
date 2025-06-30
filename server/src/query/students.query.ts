export const QUERY = {
	STUDENT_EXISTS:
		"SELECT student_id, student_name, email, class_code FROM students WHERE email = ? LIMIT 1",
	SELECT_STUDENTS:
		"SELECT student_id, student_name, email, class_code FROM students ORDER BY created_at DESC LIMIT 2000",
	SELECT_STUDENT:
		"SELECT student_id, student_name, email, class_code FROM students WHERE student_id = ?",
	CREATE_STUDENT:
		"INSERT INTO students (student_name, email, class_code) VALUES (?, ?, ?)",
	UPDATE_STUDENT:
		"UPDATE students SET student_name = ?, email = ?, class_code = ? WHERE student_id = ?",
	DELETE_STUDENT: "DELETE FROM students WHERE student_id = ?",
	SELECT_STUDENT_BY_EMAIL:
		"SELECT student_id, student_name, email, class_code FROM students WHERE email = ?",
};
