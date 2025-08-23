import { generateToken } from "./testsTokenGenerator.ts";

// ---------------- TEACHER ----------------
export const teacherDetails_valid = {
	teacher_name: "Test teacher1",
	email: "test_teacher1@uni.fi",
	role: "teacher",
};

export const testTeacherToken_valid = generateToken(
	teacherDetails_valid.teacher_name,
	teacherDetails_valid.email,
	teacherDetails_valid.role,
	"valid",
);

export const testTeacherToken_invalid_email = generateToken(
	teacherDetails_valid.teacher_name,
	"bad_email_format",
	teacherDetails_valid.role,
	"valid",
);

export const teacherDetails_invalid_shortName = {
	teacher_name: "T",
	email: "test_teacher2@uni.fi",
	role: "teacher",
};
export const testTeacherToken_invalid_shortName = generateToken(
	teacherDetails_invalid_shortName.teacher_name,
	teacherDetails_invalid_shortName.email,
	teacherDetails_invalid_shortName.role,
	"invalid",
);

export const teacherDetails_invalid_longName = {
	teacher_name: "T".repeat(300),
	email: "test_teacher2@uni.fi",
	role: "teacher",
};
export const testTeacherToken_invalid_longName = generateToken(
	teacherDetails_invalid_longName.teacher_name,
	teacherDetails_invalid_longName.email,
	teacherDetails_invalid_longName.role,
	"invalid",
);

export const teacherDetails_invalid_shortEmail = {
	teacher_name: "Test teacher1",
	email: "t@u.fi",
	role: "teacher",
};
export const testTeacherToken_invalid_shortEmail = generateToken(
	teacherDetails_invalid_shortEmail.teacher_name,
	teacherDetails_invalid_shortEmail.email,
	teacherDetails_invalid_shortEmail.role,
	"invalid",
);

export const teacherDetails_invalid_longEmail = {
	teacher_name: "Test teacher1",
	email: "t".repeat(300) + "@uni.fi",
	role: "teacher",
};
export const testTeacherToken_invalid_longEmail = generateToken(
	teacherDetails_invalid_longEmail.teacher_name,
	teacherDetails_invalid_longEmail.email,
	teacherDetails_invalid_longEmail.role,
	"invalid",
);

// ---------------- STUDENT ----------------
export const studentDetails_valid = {
	student_name: "Test student1",
	email: "test_student1@student.uni.fi",
	role: "student",
};
export const testStudentToken_valid = generateToken(
	studentDetails_valid.student_name,
	studentDetails_valid.email,
	studentDetails_valid.role,
	"valid",
);

export const testStudentToken_invalid_email = generateToken(
	studentDetails_valid.student_name,
	"bad_email_format",
	studentDetails_valid.role,
	"valid",
);

export const studentDetails_invalid_shortName = {
	student_name: "S",
	email: "test_student2@student.uni.fi",
	role: "student",
};
export const testStudentToken_invalid_shortName = generateToken(
	studentDetails_invalid_shortName.student_name,
	studentDetails_invalid_shortName.email,
	studentDetails_invalid_shortName.role,
	"invalid",
);

export const studentDetails_invalid_longName = {
	student_name: "S".repeat(300),
	email: "test_student2@student.uni.fi",
	role: "student",
};
export const testStudentToken_invalid_longName = generateToken(
	studentDetails_invalid_longName.student_name,
	studentDetails_invalid_longName.email,
	studentDetails_invalid_longName.role,
	"invalid",
);

export const studentDetails_invalid_shortEmail = {
	student_name: "Test student1",
	email: "s@u.fi",
	role: "student",
};
export const testStudentToken_invalid_shortEmail = generateToken(
	studentDetails_invalid_shortEmail.student_name,
	studentDetails_invalid_shortEmail.email,
	studentDetails_invalid_shortEmail.role,
	"invalid",
);

export const studentDetails_invalid_longEmail = {
	student_name: "Test student1",
	email: "s".repeat(300) + "@student.uni.fi",
	role: "student",
};
export const testStudentToken_invalid_longEmail = generateToken(
	studentDetails_invalid_longEmail.student_name,
	studentDetails_invalid_longEmail.email,
	studentDetails_invalid_longEmail.role,
	"invalid",
);

// ---------------- VISITOR ----------------
export const visitorDetails_valid = {
	visitor_name: "Test visitor1",
	email: "test_visitor1@visitor.fi",
	role: "visitor",
};
export const testVisitorToken_valid = generateToken(
	visitorDetails_valid.visitor_name,
	visitorDetails_valid.email,
	visitorDetails_valid.role,
	"valid",
);

export const visitorDetails_invalid = {
	visitor_name: "Test visitor1",
	email: "bad_email_format",
	role: "visitor",
};
export const testVisitorToken_invalid = generateToken(
	visitorDetails_invalid.visitor_name,
	visitorDetails_invalid.email,
	visitorDetails_invalid.role,
	"invalid",
);
