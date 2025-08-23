import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { App } from "../src/app";

import pool from "../src/config/mariadb.config";
import {
	testStudentToken_invalid_email,
	testStudentToken_invalid_longEmail,
	testStudentToken_invalid_longName,
	testStudentToken_invalid_shortEmail,
	testStudentToken_invalid_shortName,
	testStudentToken_valid,
	testTeacherToken_invalid_email,
	testTeacherToken_invalid_longEmail,
	testTeacherToken_invalid_longName,
	testTeacherToken_invalid_shortEmail,
	testTeacherToken_invalid_shortName,
	testTeacherToken_valid,
	testVisitorToken_invalid,
	testVisitorToken_valid,
} from "./testTokens";

const appInstance = new App();
const app = appInstance.getExpressApp();

const basePath = "/api/v2/auth/login";

describe("Login and Sign Up", () => {
	// runs ONCE before ALL tests
	beforeAll(async () => {
		const connection = await pool.getConnection();
		try {
			await connection.query("DELETE FROM company_teacher");
			await connection.query("DELETE FROM companies");
			await connection.query("DELETE FROM teachers");
			await connection.query("DELETE FROM students");

			// Reset auto-increment counters
			await connection.query("ALTER TABLE company_teacher AUTO_INCREMENT = 1");
			await connection.query("ALTER TABLE companies AUTO_INCREMENT = 1");
			await connection.query("ALTER TABLE teachers AUTO_INCREMENT = 1");
			await connection.query("ALTER TABLE students AUTO_INCREMENT = 1");
		} finally {
			connection.release();
		}
	});

	// Close pool after all tests
	afterAll(async () => {
		const connection = await pool.getConnection();
		try {
			const studentsResult = await connection.query("SELECT * FROM students");
			const teachersResult = await connection.query("SELECT * FROM teachers");

			expect(studentsResult.length).toBe(1);
			expect(teachersResult.length).toBe(1);

			const student = studentsResult[0];
			expect(student).toMatchObject({
				student_id: expect.any(Number),
				student_name: "test student1",
				email: "test_student1@student.uni.fi",
				current_projects: 0,
				class_code: null,
				created_at: expect.any(Date),
			});

			const teacher = teachersResult[0];
			expect(teacher).toMatchObject({
				teacher_id: expect.any(Number),
				teacher_name: "test teacher1",
				email: "test_teacher1@uni.fi",
				created_at: expect.any(Date),
			});
		} finally {
			connection.release();
		}
		await pool.end();
	});

	describe("POST /login - login and signup", () => {
		it("should return CREATED when a new valid teacher is created", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_valid)
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("CREATED");
			expect(response.body.data).toEqual({ role: "teacher" });
		});

		it("should return OK when teacher logs in", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_valid)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("OK");
			expect(response.body.data).toEqual({ role: "teacher" });
		});

		it("should return CREATED when a new valid student is created", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_valid)
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("CREATED");
			expect(response.body.data).toEqual({ role: "student" });
		});

		it("should return OK when student logs in", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_valid)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("OK");
			expect(response.body.data).toEqual({ role: "student" });
		});

		it("should return bad request if we have an invalid teacher email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_invalid_email)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a long teacher email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_invalid_longEmail)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a short teacher email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_invalid_shortEmail)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a short teacher name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_invalid_shortName)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a long teacher name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testTeacherToken_invalid_longName)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have an invalid student email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_invalid_email)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a long student email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_invalid_longEmail)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a long student name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_invalid_longName)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a short student email", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_invalid_shortEmail)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request if we have a short student name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testStudentToken_invalid_shortName)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request for valid visitor token (since we only support teacher and student)", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testVisitorToken_valid)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});

		it("should return bad request for invalid visitor token", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.set("Authorization", testVisitorToken_invalid)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("BAD REQUEST");
		});
	});
});
