import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { App } from "../src/app";

import pool from "../src/config/mariadb.config";
import { generateToken } from "./testsTokenGenerator";

const appInstance = new App();
const app = appInstance.getExpressApp();

const basePath = "/api/v2/companies";

// accessible to all tests
let testTeacher1Id: number;
let testTeacherToken: string;

let testStudent1Id: number;
let testStudentToken: string;

let testInvalidToken: string = "invalid-token";
let testCompanyId: number;
let testCompanyIdForFavorites: number;

describe("Companies", () => {
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

			// Create test teacher
			const teacherResult = await connection.query(
				"INSERT INTO teachers (teacher_name, email) VALUES ('Test teacher1', 'test_teacher1@uni.fi')",
			);

			testTeacher1Id = Number(teacherResult.insertId);
			testTeacherToken = generateToken(
				"Test teacher1",
				"test_teacher1@uni.fi",
				"teacher",
				"valid",
			);

			// Create test student
			const studentResult = await connection.query(
				"INSERT INTO students (student_name, email, class_code) VALUES ('Test student1', 'test_student1@student.uni.fi', 'code0')",
			);

			testStudent1Id = Number(studentResult.insertId);
			testStudentToken = generateToken(
				"Test student1",
				"test_student1@student.uni.fi",
				"student",
				"valid",
			);
			console.log(testStudentToken);
		} finally {
			connection.release();
		}
	});

	// Close pool after all tests
	afterAll(async () => {
		await pool.end();
	});
	describe("GET /companies - listCompanies", () => {
		it("should return empty array when no companies exist", async () => {
			const response = await request(app)
				.get(`${basePath}`)
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual([]);
		});
	});

	describe("POST /companies - createCompany", () => {
		it("should create a new company successfully", async () => {
			const companyData = {
				company_name: "Nokia Oy",
			};

			const response = await request(app)
				.post(`${basePath}`)
				.send(companyData)
				.set("Authorization", testTeacherToken)
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();

			// Verify company was created
			const connection = await pool.getConnection();
			try {
				const [company] = await connection.query(
					"SELECT * FROM companies WHERE company_name = ?",
					["nokia"],
				);

				expect(company).toBeDefined();
				expect(company.company_name).toBe("nokia");
			} finally {
				connection.release();
			}
		});

		it("should return array of companies after new company insertion", async () => {
			const response = await request(app)
				.get(`${basePath}`)
				.set("Authorization", testTeacherToken)
				.expect(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toEqual(1);
			expect(response.body.data[0].company_name).toEqual("nokia");
		});

		it("should return existing company if name already exists", async () => {
			// Get existing company
			const connection = await pool.getConnection();
			let existing_id: number;
			try {
				const [company] = await connection.query(
					"SELECT company_id FROM companies WHERE company_name = 'nokia'",
				);
				existing_id = company.company_id;
			} finally {
				connection.release();
			}

			const response = await request(app)
				.post(`${basePath}`)
				.send({ company_name: "Nokia Oy" })
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.company_id).toBe(existing_id);
		});

		it("should return 400 for invalid request body", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.send({ invalid_field: "test" })
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});

		it("should return 400 for missing company_name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.send({})
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});

		it("should return 401 for not authenticated user trying to create company", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.send({})
				.expect(401);

			expect(response.body.error.toLowerCase()).toBe("bad token");
		});

		it("should handle empty/low length company_name", async () => {
			const response = await request(app)
				.post(`${basePath}`)
				.send({ company_name: "" })
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});

		it("should handle very long length company_name", async () => {
			const longCompanyName = "t".repeat(300);
			const response = await request(app)
				.post(`${basePath}`)
				.send({ company_name: longCompanyName })
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});
	});

	describe("DELETE /companies/:companyId - deleteCompany", () => {
		// runs before tests in THIS describe block only
		beforeAll(async () => {
			const connection = await pool.getConnection();
			try {
				const [companies] = await connection.query(
					"SELECT * FROM companies WHERE company_name = 'nokia' LIMIT 1",
				);
				testCompanyId = companies.company_id;
			} finally {
				connection.release();
			}
		});

		it("should return 403 when student try to delete a company", async () => {
			const response = await request(app)
				.delete(`${basePath}/${testCompanyId}`)
				.set("Authorization", testStudentToken)
				.expect(403);

			expect(response.body.error.toLowerCase()).toBe(
				"insufficient permissions",
			);

			// Verify company was not deleted
			const connection = await pool.getConnection();
			try {
				const [companies] = await connection.query(
					"SELECT * FROM companies WHERE company_id = ?",
					[testCompanyId],
				);
				expect(companies as any[]).toBeDefined();
			} finally {
				connection.release();
			}
		});

		it("should delete company (teacher) successfully when no projects reference it", async () => {
			const response = await request(app)
				.delete(`${basePath}/${testCompanyId}`)
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify company was deleted
			const connection = await pool.getConnection();
			try {
				const [companies] = await connection.query(
					"SELECT * FROM companies WHERE company_id = ?",
					[testCompanyId],
				);
				expect(companies as any[]).toBeUndefined();
			} finally {
				connection.release();
			}
		});

		it("should return 404 for non-existent company", async () => {
			const response = await request(app)
				.delete(`${basePath}/99999`)
				.set("Authorization", testTeacherToken)
				.expect(404);

			expect(response.body.success).toBe(false);
		});

		it("should return 400 for invalid company ID", async () => {
			const response = await request(app)
				.delete(`${basePath}/invalid`)
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});
	});

	describe("GET /companies/favorites - listFavoriteCompanies", () => {
		it("should return empty array when teacher has no favorites", async () => {
			const response = await request(app)
				.get(`${basePath}/favorites`)
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual([]);
		});

		it("should return 401 for unauthenticated request", async () => {
			const response = await request(app)
				.get(`${basePath}/favorites`)
				.expect(401);
			expect(response.body.error.toLowerCase()).toBe("bad token");
		});

		it("should return 401 for bad token request", async () => {
			const response = await request(app)
				.get(`${basePath}/favorites`)
				.set("Authorization", testInvalidToken)
				.expect(401);

			expect(response.body.error.toLowerCase()).toBe("bad token");
		});

		it("should return 403 for student request", async () => {
			const response = await request(app)
				.get(`${basePath}/favorites`)
				.set("Authorization", testStudentToken)
				.expect(403);
			expect(response.body.error.toLowerCase()).toBe(
				"insufficient permissions",
			);
		});
	});

	describe("POST /companies/favorites - addFavoriteCompany", () => {
		// This beforeAll runs before tests in THIS describe block only
		beforeAll(async () => {
			const connection = await pool.getConnection();
			try {
				const result = await connection.query(
					"INSERT INTO companies (company_name) VALUES ('Power ABS')",
				);
				testCompanyIdForFavorites = Number(result.insertId);
			} finally {
				connection.release();
			}
		});

		it("should add company to favorites successfully", async () => {
			const response = await request(app)
				.post(`${basePath}/favorites`)
				.set("Authorization", testTeacherToken)
				.send({ company_id: testCompanyIdForFavorites })
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.company_id).toBe(testCompanyIdForFavorites);
			expect(response.body.data.teacher_id).toBe(testTeacher1Id);

			// Verify in database
			const connection = await pool.getConnection();
			try {
				const [relation] = await connection.query(
					"SELECT * FROM company_teacher WHERE company_id = ? AND teacher_id = ?",
					[testCompanyIdForFavorites, testTeacher1Id],
				);
				expect(relation).toBeDefined();
			} finally {
				connection.release();
			}
		});

		it("should return 401 for invalid teacher", async () => {
			const response = await request(app)
				.post(`${basePath}/favorites`)
				.set("Authorization", testInvalidToken)
				.send({ company_id: testCompanyIdForFavorites })
				.expect(401);
		});

		it("should return 403 for student", async () => {
			const response = await request(app)
				.post(`${basePath}/favorites`)
				.set("Authorization", testStudentToken)
				.send({ company_id: testCompanyIdForFavorites })
				.expect(403);
			expect(response.body.error.toLowerCase()).toBe(
				"insufficient permissions",
			);
		});

		it("should return favorite companies list after addition", async () => {
			const response = await request(app)
				.get(`${basePath}/favorites`)
				.set("Authorization", testTeacherToken)
				.expect(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toEqual(1);
			expect(response.body.data[0].company_id).toEqual(2);
		});
	});

	describe("DELETE /companies/favorites/:companyId - removeFavoriteCompany", () => {
		it("student cannot delete favorite company", async () => {
			const response = await request(app)
				.delete(`${basePath}/favorites/${testCompanyIdForFavorites}`) // Fixed template literal
				.set("Authorization", testStudentToken)
				.expect(403);

			expect(response.body.error.toLowerCase()).toBe(
				"insufficient permissions",
			);

			// Verify kept in database
			const connection = await pool.getConnection();
			try {
				const [relations] = await connection.query(
					"SELECT * FROM company_teacher WHERE company_id = ? AND teacher_id = ?",
					[testCompanyIdForFavorites, testTeacher1Id],
				);
				expect(relations).toBeDefined();
			} finally {
				connection.release();
			}
		});
		it("should remove company from favorites successfully", async () => {
			const response = await request(app)
				.delete(`${basePath}/favorites/${testCompanyIdForFavorites}`) // Fixed template literal
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify removed from database
			const connection = await pool.getConnection();
			try {
				const [relations] = await connection.query(
					"SELECT * FROM company_teacher WHERE company_id = ? AND teacher_id = ?",
					[testCompanyIdForFavorites, testTeacher1Id],
				);
				expect(relations).toBeUndefined();
			} finally {
				connection.release();
			}
		});

		it("should return 400 for missing company ID", async () => {
			const response = await request(app)
				.delete(`${basePath}/favorites/`)
				.set("Authorization", testTeacherToken)
				.expect(400);

			expect(response.body.success).toBe(false);
		});

		it("should handle non-existent favorite gracefully", async () => {
			const response = await request(app)
				.delete(`${basePath}/favorites/99999`)
				.set("Authorization", testTeacherToken)
				.expect(200);

			expect(response.body.success).toBe(true);
		});
	});
});
