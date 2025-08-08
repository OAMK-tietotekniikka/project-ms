import { z } from "zod";

export const TeacherSchema = z.object({
	teacher_name: z
		.string()
		.min(4)
		.max(127)
		.transform((val) => val.toLowerCase()),
	email: z.email().transform((val) => val.toLowerCase()),
});

export const TeacherNameSchema = z.object({
	teacher_name: z
		.string()
		.min(4)
		.max(127)
		.transform((val) => val.toLowerCase()),
});

export type Teacher = z.infer<typeof TeacherSchema>;
export type TeacherName = z.infer<typeof TeacherNameSchema>;
