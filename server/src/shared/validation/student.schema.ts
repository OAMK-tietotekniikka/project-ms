import { z } from "zod";

export const updateStudentSchema = z
	.object({
		student_name: z.string().min(4).max(100).optional(),
		class_code: z.string().optional(),
	})
	.partial();

export const createStudentSchema = z.object({
	email: z.email().min(8).max(100),
	student_name: z.string().min(4).max(100),
	class_code: z.string().optional(),
});

export const batchStudentSchema = z.object({
	students: z.array(createStudentSchema).min(1),
});

export const studentIdParamsSchema = z.coerce.number().int().positive();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type BatchStudentInput = z.infer<typeof batchStudentSchema>;
