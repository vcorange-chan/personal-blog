import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		date: z.date(),
		updatedDate: z.date().optional(),
		category: z.enum(["math", "tech", "projects", "academia", "lang", "read"]),
		subcategory: z.string().optional(),
		series: z.string().optional(),
		seriesOrder: z.number().optional(),
		tags: z.array(z.string()).optional(),
		lang: z
			.string()
			.regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
			.default("en"),
		description: z.string().optional(),
		layout: z.enum(["article", "immersive"]).default("article"),
		interactiveFile: z
			.string()
			.regex(/^\/uploads\/[a-zA-Z0-9_./%\-\p{L}]+\.html$/u)
			.optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
