import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import sharp from "sharp";
import RobotoMonoBold from "@/assets/roboto-mono-700.ttf";
import RobotoMono from "@/assets/roboto-mono-regular.ttf";
import { getAllPosts } from "@/data/post";
import { getFormattedDate } from "@/utils/date";
import { readCache, writeToCache } from "./_cacheUtil";
import { ogMarkup } from "./_ogMarkup";

const ogOptions: SatoriOptions = {
	// debug: true,
	fonts: [
		{
			data: Buffer.from(RobotoMono),
			name: "Roboto Mono",
			style: "normal",
			weight: 400,
		},
		{
			data: Buffer.from(RobotoMonoBold),
			name: "Roboto Mono",
			style: "normal",
			weight: 700,
		},
	],
	height: 630,
	width: 1200,
};

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { date, title } = context.props as Props;

	// check the og-image cache
	let pngBuffer = readCache(title, date);
	if (!pngBuffer) {
		console.info(`Generating new OG image for: ${title}`);
		const postDate = getFormattedDate(date, {
			month: "long",
			weekday: "long",
		});
		const svg = await satori(ogMarkup(title, postDate), ogOptions);
		pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
		writeToCache(title, date, pngBuffer);
	}

	return new Response(new Uint8Array(pngBuffer), {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts
		.values()
		.map((post) => ({
			params: { slug: post.id },
			props: {
				date: post.data.updatedDate ?? post.data.date,
				title: post.data.title,
			},
		}))
		.toArray();
}
