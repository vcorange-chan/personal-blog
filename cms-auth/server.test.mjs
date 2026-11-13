import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.GITHUB_CLIENT_ID = "test-client";
process.env.GITHUB_CLIENT_SECRET = "test-secret";
const { server } = await import("./server.mjs");
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const realFetch = globalThis.fetch;
after(() => server.close());

test("rejects forged OAuth callbacks and non-GET requests", async () => {
	assert.equal((await realFetch(`${base}/cms/callback?state=forged&code=test`)).status, 403);
	assert.equal((await realFetch(`${base}/cms/auth`, { method: "POST" })).status, 405);
});

test("binds OAuth state to the browser, restricts owner, and posts only to the admin origin", async () => {
	globalThis.fetch = async (url) =>
		new Response(
			JSON.stringify(
				String(url).includes("access_token")
					? { access_token: "test-token" }
					: { login: "vcorange-chan" },
			),
		);
	try {
		const auth = await realFetch(`${base}/cms/auth`, { redirect: "manual" });
		assert.equal(auth.status, 302);
		const state = new URL(auth.headers.get("location")).searchParams.get("state");
		const cookie = auth.headers.get("set-cookie").split(";")[0];
		const response = await realFetch(`${base}/cms/callback?state=${state}&code=test`, {
			headers: { Cookie: cookie },
		});
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.ok(html.includes("https://blog.cliffordchen.org"));
		assert.ok(html.includes("authorization:github:success:"));
		assert.ok(!html.includes("test-secret"));
		assert.equal(
			(
				await realFetch(`${base}/cms/callback?state=${state}&code=test`, {
					headers: { Cookie: cookie },
				})
			).status,
			403,
		);
	} finally {
		globalThis.fetch = realFetch;
	}
});

test("does not issue a browser token to another GitHub account", async () => {
	globalThis.fetch = async (url) =>
		new Response(
			JSON.stringify(
				String(url).includes("access_token")
					? { access_token: "test-token" }
					: { login: "someone-else" },
			),
		);
	try {
		const auth = await realFetch(`${base}/cms/auth`, { redirect: "manual" });
		const state = new URL(auth.headers.get("location")).searchParams.get("state");
		const cookie = auth.headers.get("set-cookie").split(";")[0];
		assert.equal(
			(
				await realFetch(`${base}/cms/callback?state=${state}&code=test`, {
					headers: { Cookie: cookie },
				})
			).status,
			403,
		);
	} finally {
		globalThis.fetch = realFetch;
	}
});
