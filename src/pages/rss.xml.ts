import rss from "@astrojs/rss";
import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";

export const GET = async () => {
	const posts = await getAllPosts();

	return rss({
		title: `${siteConfig.title} - Blog`,
		description: `${siteConfig.description} Notes on mathematics, software, academia, languages, and reading.`,
		site: import.meta.env.SITE,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `posts/${post.id}/`,
		})),
	});
};
