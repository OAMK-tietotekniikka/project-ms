import { z } from "zod";

export const companyIdParamsSchema = z.coerce.number().int().positive();
export const companyCreateSchema = z.object({
	company_name: z.string().min(2),
});
