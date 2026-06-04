import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		date: z.date(),
		category: z.enum(["math", "tech", "projects", "academia", "lang", "read"]),
		subcategory: z.string().optional(),
		series: z.string().optional(),
		seriesOrder: z.number().optional(),
		tags: z.array(z.string()).optional(),
		lang: z.enum(["zh", "en", "fr", "ko"]),
		description: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
