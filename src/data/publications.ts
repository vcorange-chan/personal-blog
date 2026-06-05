import { parse } from "yaml";
import publicationsSource from "./publications.yaml?raw";

export interface AcademicLink {
	label: string;
	url: string;
}

export interface AcademicItem {
	authors?: string[];
	description?: string;
	links?: AcademicLink[];
	status?: string;
	title: string;
	venue?: string;
	year?: number;
}

export interface AcademicWork {
	inProgress: AcademicItem[];
	publications: AcademicItem[];
	writing: AcademicItem[];
}

function normalizeItems(value: unknown): AcademicItem[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
		.map((item) => {
			const normalized: AcademicItem = {
				title: typeof item.title === "string" ? item.title : "Untitled",
			};
			const authors = Array.isArray(item.authors)
				? item.authors.filter((author): author is string => typeof author === "string")
				: [];
			const links = Array.isArray(item.links)
				? item.links
						.filter(
							(link): link is Record<string, unknown> => Boolean(link) && typeof link === "object",
						)
						.flatMap((link) =>
							typeof link.label === "string" && typeof link.url === "string"
								? [{ label: link.label, url: link.url }]
								: [],
						)
				: [];

			if (authors.length) normalized.authors = authors;
			if (typeof item.description === "string") normalized.description = item.description;
			if (links.length) normalized.links = links;
			if (typeof item.status === "string") normalized.status = item.status;
			if (typeof item.venue === "string") normalized.venue = item.venue;
			if (typeof item.year === "number") normalized.year = item.year;

			return normalized;
		});
}

export async function getAcademicWork(): Promise<AcademicWork> {
	const data = parse(publicationsSource) as Record<string, unknown> | null;

	return {
		inProgress: normalizeItems(data?.inProgress),
		publications: normalizeItems(data?.publications),
		writing: normalizeItems(data?.writing),
	};
}
