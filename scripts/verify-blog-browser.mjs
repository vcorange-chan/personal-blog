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
mkdirSync("artifacts/release-2026-11-13", { recursive: true });
try {
	for (const width of [390, 1440]) {
		const page = await browser.newPage({ viewport: { width, height: 900 }, locale: "zh-CN" });
		await page.addInitScript(() => localStorage.setItem("ui-language", "fr"));
		await page.goto(`${base}/posts/math/algebra/counting-theorem-intuition/`, {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		assert.equal(await page.locator("html").getAttribute("lang"), "en");
		assert.equal(await page.locator(".katex-error").count(), 0);
		assert.ok((await page.locator(".katex").count()) > 50);
		assert.ok((await page.locator(".katex-display").count()) > 20);
		const content = await page.locator("article").innerText();
		assert.ok(!content.includes("\\operatorname"));
		assert.ok(!content.includes("\\("));
		assert.equal(await page.locator("[data-ui-language-button]").count(), 0);
		assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
		await page.screenshot({
			path: `artifacts/release-2026-11-13/math-${width}.png`,
			fullPage: true,
		});
		await page.emulateMedia({ colorScheme: "dark" });
		await page.screenshot({ path: `artifacts/release-2026-11-13/math-dark-${width}.png` });
		console.log(`Math ${width}px: formulas rendered, English UI, no page overflow.`);
		await page.goto(`${base}/posts/math/topology/define-topology/`);
		assert.equal(await page.locator(".katex-error").count(), 0);
		assert.ok((await page.locator(".katex").count()) > 10);
		await page.close();
	}
	const admin = await browser.newPage({ viewport: { width: 390, height: 844 } });
	const errors = [];
	admin.on("pageerror", (error) => errors.push(error.message));
	await admin.goto(`${base}/admin/`, { waitUntil: "networkidle" });
	await admin.getByText("Login with GitHub", { exact: false }).waitFor();
	await admin.screenshot({ path: "artifacts/release-2026-11-13/admin-mobile.png" });
	assert.deepEqual(errors, []);
	console.log("Admin mobile: GitHub login rendered without JavaScript errors.");
	const editor = await browser.newPage({ viewport: { width: 390, height: 844 } });
	editor.on("pageerror", (error) => errors.push(error.message));
	await editor.route("**/admin/config.yml", async (route) => {
		const response = await route.fetch();
		const config = (await response.text()).replace(
			/^backend:[\s\S]*?site_url:/,
			"backend:\n  name: test-repo\nsite_url:",
		);
		await route.fulfill({ response, body: config });
	});
	await editor.goto(`${base}/admin/`);
	await editor.getByRole("button", { name: "Login", exact: true }).click();
	await editor.locator('a[href*="/collections/posts/new"]').click();
	await editor.getByText("Import Markdown", { exact: false }).waitFor();
	await editor.screenshot({
		path: "artifacts/release-2026-11-13/editor-before-import.png",
		fullPage: true,
	});
	console.log("Editor fields:", (await editor.locator("body").innerText()).slice(0, 1500));
	await editor.locator('input[type="file"]').setInputFiles({
		name: "sample.md",
		mimeType: "text/markdown",
		buffer: Buffer.from("# Imported mathematics\n\n$E=mc^2$"),
	});
	await editor.waitForFunction(() =>
		document
			.querySelector('textarea[aria-label="Markdown body"]')
			?.value.includes("Imported mathematics"),
	);
	assert.ok(
		(await editor.getByRole("textbox", { name: "Markdown body" }).inputValue()).includes(
			"$E=mc^2$",
		),
	);
	await editor.screenshot({
		path: "artifacts/release-2026-11-13/editor-mobile.png",
		fullPage: true,
	});
	assert.deepEqual(errors, []);
	console.log(
		"Admin mobile: new post editor and Markdown file import work with in-memory test backend.",
	);
} finally {
	await browser.close();
}
