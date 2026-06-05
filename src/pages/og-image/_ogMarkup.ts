import { html } from "satori-html";
import { siteConfig } from "@/site.config";

export const ogMarkup = (title: string, pubDate: string) =>
	html`<div tw="flex flex-col w-full h-full bg-[#F5F1E8] text-[#2F2922]">
		<div tw="flex w-full px-14 pt-12 items-center justify-between">
			<div tw="flex items-center">
				<div tw="flex w-20 h-20 rounded-lg border-4 border-[#9A3F2F] items-center justify-center text-[#9A3F2F] text-3xl font-bold">
					CC
				</div>
				<div tw="flex flex-col ml-5">
					<p tw="text-3xl font-bold">${siteConfig.title}</p>
					<p tw="text-xl text-[#6F6254]">mathematics · software · long-form thinking</p>
				</div>
			</div>
			<p tw="text-xl text-[#7B4A2F]">${pubDate}</p>
		</div>
		<div tw="flex flex-col flex-1 w-full px-14 justify-center">
			<p tw="text-xl mb-6 tracking-wide text-[#276B60]">BLOG NOTE</p>
			<h1 tw="text-6xl font-bold leading-snug text-[#211B16]">${title}</h1>
		</div>
		<div tw="flex items-center justify-between w-full px-14 py-9 border-t-2 border-[#9A3F2F] text-[#6F6254]">
			<p tw="text-2xl font-semibold">${siteConfig.description}</p>
			<p>by ${siteConfig.author}</p>
		</div>
	</div>`;
