import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

function removeDupsAndLowerCase(array: string[]) {
	return [...new Set(array.map((str) => str.toLowerCase()))];
}

const titleSchema = z.string().max(60);

const baseSchema = z.object({
	title: titleSchema,
});

const post = defineCollection({
	loader: glob({ base: "./src/content/post", pattern: "**/*.{md,mdx}" }),
	schema: () =>
		baseSchema.extend({
			description: z.string().optional(),
			date: z.coerce.date(),
			category: z.enum(["math", "tech", "projects", "academia", "lang", "read"]),
			subcategory: z.string().optional(),
			series: z.string().optional(),
			seriesOrder: z.number().optional(),
			lang: z.enum(["zh", "en", "fr", "ko"]),
			draft: z.boolean().default(false),
			tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
			updatedDate: z.coerce.date().optional(),
			pinned: z.boolean().default(false),
	}),
});

const tag = defineCollection({
	loader: glob({ base: "./src/content/tag", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: titleSchema.optional(),
		description: z.string().optional(),
	}),
});

export const collections = { post, tag };
