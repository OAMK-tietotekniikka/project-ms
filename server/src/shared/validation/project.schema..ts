import { z } from "zod";

export const projectSchema = z.object({
	project_name: z
		.string()
		.min(6)
		.max(255)
		.transform((val) => val.toLowerCase()),
	project_desc: z.string().max(500).optional(),
	project_url: z
		.url()
		.optional()
		.transform((val) => val?.toLowerCase()),
	company_id: z.number().int().positive(),
	start_date: z.date(),
	end_date: z.date(),
	project_status: z
		.enum(["pending", "ongoing", "completed"])
		.default("pending"),
});
