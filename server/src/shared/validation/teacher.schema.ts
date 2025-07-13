import { z } from "zod";

export const TeacherSchema = z.object({
	name: z.string().min(8),
	email: z.string().email(),
});

export const TeacherNameSchema = z.object({
	teacher_name: z.string().min(8),
});

export type Teacher = z.infer<typeof TeacherSchema>;
export type TeacherName = z.infer<typeof TeacherNameSchema>;
