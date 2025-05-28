export const QUERY = {
  SELECT_STUDENTS: 'SELECT * FROM students ORDER BY created_at DESC LIMIT 50',
  SELECT_STUDENT: 'SELECT * FROM students WHERE student_id = ?',  
  CREATE_STUDENT: 'INSERT INTO students (student_name, email, class_code) VALUES (?, ?, ?)',
  UPDATE_STUDENT: 'UPDATE students SET student_name = ?, email = ?, class_code = ? WHERE student_id = ?',
  DELETE_STUDENT: 'DELETE FROM students WHERE student_id = ?',
  SELECT_STUDENT_BY_EMAIL: 'SELECT * FROM students WHERE email = ?',
};