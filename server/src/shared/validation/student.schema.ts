import { z } from "zod";

export const updateStudentSchema = z
	.object({
		student_name: z
			.string()
			.min(4)
			.max(127)
			.optional()
			.transform((val) => val?.toLowerCase()),
		class_code: z
			.string()
			.optional()
			.transform((val) => val?.toLowerCase()),
	})
	.partial();

export const createStudentSchema = z.object({
	email: z
		.email()
		.min(8)
		.max(127)
		.transform((val) => val.toLowerCase()),
	student_name: z
		.string()
		.min(4)
		.max(127)
		.transform((val) => val.toLowerCase()),
	class_code: z
		.string()
		.optional()
		.transform((val) => val?.toLowerCase()),
});

export const batchStudentSchema = z.object({
	students: z.array(createStudentSchema).min(1),
});

export const studentIdParamsSchema = z.coerce.number().int().positive();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type BatchStudentInput = z.infer<typeof batchStudentSchema>;
