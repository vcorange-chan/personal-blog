import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(
	"C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({
	executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
	headless: true,
});
const base = process.env.BLOG_TEST_URL ?? "http://127.0.0.1:4321";
const directory = "artifacts/reading-design";
mkdirSync(directory, { recursive: true });
try {
	for (const width of [320, 390, 768, 1440]) {
		const page = await browser.newPage({ viewport: { width, height: 1000 } });
		const errors = [];
		page.on("pageerror", (error) => errors.push(error.message));
		for (const [name, path] of [
			["topology", "/posts/math/topology/define-topology/"],
			["counting", "/posts/math/algebra/counting-theorem-intuition/"],
			["code", "/posts/math/algebra/implement-category-arrows-in-julia/"],
		]) {
			await page.goto(base + path, { waitUntil: "networkidle" });
			await page.evaluate(() => document.fonts.ready);
			assert.ok(await page.evaluate(() => document.fonts.check('500 40px "Reading Garamond"')));
			assert.equal(await page.locator(".katex-error").count(), 0);
			assert.ok(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
				`${name} ${width}: horizontal overflow`,
			);
			const title = await page.locator(".article-title").boundingBox();
			const date = await page.locator(".article-date").boundingBox();
			const body = await page.locator(".article-body").boundingBox();
			assert.ok(date.y + date.height <= title.y);
			assert.ok(title.y + title.height < body.y);
			assert.ok(title.x >= 0 && title.x + title.width <= width);
			assert.ok(Math.abs(title.x - body.x) < 2);
			const toc = page.locator(".article-toc");
			if (await toc.count()) {
				assert.equal(await toc.getAttribute("open"), null);
				await toc.locator("summary").click();
				assert.notEqual(await toc.getAttribute("open"), null);
				await toc.locator("summary").click();
			}
			await page.screenshot({ path: `${directory}/${name}-${width}.png`, fullPage: width === 390 });
		}
		await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
		await page.waitForFunction(
			() => getComputedStyle(document.body).backgroundColor === "rgb(32, 36, 30)",
		);
		await page.screenshot({ path: `${directory}/dark-${width}.png` });
		await page.goto(`${base}/posts/lang/english/english-practice-2026-06-11/`);
		await page.locator("article iframe").waitFor();
		assert.ok(
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
			`HTML ${width}: overflow`,
		);
		const frame = await page.locator("article iframe").boundingBox();
		assert.ok(frame.width > width * 0.75 || frame.width >= 1100);
		assert.ok(frame.height > 500);
		assert.deepEqual(errors, []);
		await page.goto(`${base}/`);
		assert.equal(
			await page.locator("html").evaluate((el) => el.classList.contains("reading-page")),
			false,
		);
		assert.equal(
			await page.locator("body").evaluate((el) => getComputedStyle(el).maxWidth),
			"768px",
		);
		await page.screenshot({ path: `${directory}/home-${width}.png` });
		console.log(
			`${width}px: English/Chinese/formulas/code, TOC, dark mode and homepage isolation passed.`,
		);
		await page.close();
	}
} finally {
	await browser.close();
}
