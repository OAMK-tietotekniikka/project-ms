import { QUERY } from "../../features/projects/queries/projects.query";
import mariadb from "mariadb";

export const getStudentIdByEmail = async (
	connection: mariadb.PoolConnection,
	email: string,
): Promise<number | null> => {
	const rows = await connection.query(QUERY.SELECT_STUDENT_BY_EMAIL, [email]);
	if (rows.length === 0 || !rows[0].student_id) {
		return null;
	}
	return rows[0].student_id;
};

export const getTeacherIdByEmail = async (
	connection: mariadb.PoolConnection,
	email: string,
): Promise<number | null> => {
	const rows = await connection.query(QUERY.SELECT_TEACHER_BY_EMAIL, [email]);
	if (rows.length === 0 || !rows[0].teacher_id) {
		return null;
	}
	return rows[0].teacher_id;
};
