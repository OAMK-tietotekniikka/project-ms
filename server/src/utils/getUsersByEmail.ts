import { PoolConnection } from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import { QUERY } from "../query/projects.query";

export const getStudentIdByEmail = async (
	connection: PoolConnection,
	email: string,
): Promise<number | null> => {
	const [rows] = await connection.query<RowDataPacket[]>(
		QUERY.SELECT_STUDENT_BY_EMAIL,
		[email],
	);
	if (rows.length === 0 || !rows[0].student_id) {
		return null;
	}
	return rows[0].student_id;
};

export const getTeacherIdByEmail = async (
	connection: PoolConnection,
	email: string,
): Promise<number | null> => {
	const [rows] = await connection.query<RowDataPacket[]>(
		QUERY.SELECT_TEACHER_BY_EMAIL,
		[email],
	);
	if (rows.length === 0 || !rows[0].teacher_id) {
		return null;
	}
	return rows[0].teacher_id;
};
