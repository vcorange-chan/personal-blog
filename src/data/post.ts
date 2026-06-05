import { type CollectionEntry, getCollection } from "astro:content";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"posts">[]> {
	return await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"posts">[]) {
	return Object.groupBy(posts, (post) => post.data.date.getFullYear().toString());
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"posts">[]) {
	return posts.flatMap((post) => [...(post.data.tags ?? [])]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
	return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(posts: CollectionEntry<"posts">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}

export function getCategoryCounts(posts: CollectionEntry<"posts">[]): [string, number][] {
	return [
		...posts.reduce(
			(acc, post) => acc.set(post.data.category, (acc.get(post.data.category) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => a[0].localeCompare(b[0]));
}

export function getSubcategoryCounts(
	posts: CollectionEntry<"posts">[],
	category: string,
): [string, number][] {
	return [
		...posts
			.filter((post) => post.data.category === category && post.data.subcategory)
			.reduce((acc, post) => {
				const subcategory = post.data.subcategory as string;
				return acc.set(subcategory, (acc.get(subcategory) ?? 0) + 1);
			}, new Map<string, number>()),
	].sort((a, b) => a[0].localeCompare(b[0]));
}

export function getSeriesCounts(posts: CollectionEntry<"posts">[]): [string, number][] {
	return [
		...posts
			.filter((post) => post.data.series)
			.reduce((acc, post) => {
				const series = post.data.series as string;
				return acc.set(series, (acc.get(series) ?? 0) + 1);
			}, new Map<string, number>()),
	].sort((a, b) => a[0].localeCompare(b[0]));
}

export function getLanguageCounts(posts: CollectionEntry<"posts">[]): [string, number][] {
	return [
		...posts.reduce(
			(acc, post) => acc.set(post.data.lang, (acc.get(post.data.lang) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => a[0].localeCompare(b[0]));
}

export function slugifyValue(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function sortSeriesPosts(posts: CollectionEntry<"posts">[]) {
	return posts.sort((a, b) => {
		const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
		if (orderA !== orderB) return orderA - orderB;
		return a.data.date.getTime() - b.data.date.getTime();
	});
}
