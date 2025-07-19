import { z } from "zod";

export const TeacherSchema = z.object({
	teacher_name: z.string().min(4),
	email: z.email(),
});

export const TeacherNameSchema = z.object({
	teacher_name: z.string().min(4),
});

export type Teacher = z.infer<typeof TeacherSchema>;
export type TeacherName = z.infer<typeof TeacherNameSchema>;
