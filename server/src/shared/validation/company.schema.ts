import { z } from "zod";

export const companyIdParamsSchema = z.coerce.number().int().positive();
export const companyCreateSchema = z.object({
	company_name: z
		.string()
		.min(2)
		.max(255)
		.transform((val) => val.toLowerCase()),
	industry: z
		.string()
		.optional()
		.transform((val) => val?.toLowerCase()),
});
