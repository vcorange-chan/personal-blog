import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const origin = "https://blog.cliffordchen.org";
const callback = `${origin}/cms/callback`;
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const owner = "vcorange-chan";
const states = new Map();
const attempts = new Map();

function send(res, status, body, type = "text/plain") {
	res.writeHead(status, {
		"Content-Type": `${type}; charset=utf-8`,
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "no-referrer",
		"Content-Security-Policy":
			"default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'",
	});
	res.end(body);
}

export const server = createServer(async (req, res) => {
	try {
		const url = new URL(req.url, origin);
		if (req.method !== "GET") return send(res, 405, "Method not allowed");
		if (url.pathname === "/cms/health") {
			return send(
				res,
				clientId && clientSecret ? 200 : 503,
				JSON.stringify({ configured: Boolean(clientId && clientSecret) }),
				"application/json",
			);
		}
		if (!clientId || !clientSecret)
			return send(res, 503, "GitHub sign-in is awaiting owner configuration.");
		if (url.pathname === "/cms/auth") {
			const now = Date.now();
			for (const [key, value] of states) if (value.expires < now) states.delete(key);
			for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
			const ip = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress;
			const bucket = attempts.get(ip) ?? { count: 0, expires: now + 60_000 };
			if (++bucket.count > 10 || states.size >= 1000) return send(res, 429, "Try again later");
			attempts.set(ip, bucket);
			const state = randomBytes(32).toString("hex");
			const verifier = randomBytes(32).toString("hex");
			states.set(state, { verifier, expires: now + 600_000 });
			const target = new URL("https://github.com/login/oauth/authorize");
			target.search = new URLSearchParams({
				client_id: clientId,
				redirect_uri: callback,
				scope: "public_repo",
				state,
			});
			res.writeHead(302, {
				Location: target.href,
				"Set-Cookie": `cms_state=${verifier}; Path=/cms; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
				"Cache-Control": "no-store",
			});
			return res.end();
		}
		if (url.pathname !== "/cms/callback") return send(res, 404, "Not found");
		const state = url.searchParams.get("state");
		const pending = states.get(state);
		states.delete(state);
		const cookie = req.headers.cookie
			?.split(";")
			.map((s) => s.trim())
			.find((s) => s.startsWith("cms_state="))
			?.slice(10);
		if (
			!pending ||
			pending.expires < Date.now() ||
			!cookie ||
			cookie.length !== pending.verifier.length ||
			!timingSafeEqual(Buffer.from(cookie), Buffer.from(pending.verifier))
		) {
			return send(res, 403, "Invalid or expired sign-in. Close this window and try again.");
		}
		const code = url.searchParams.get("code");
		if (!code) return send(res, 403, "GitHub sign-in was cancelled.");
		const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: callback,
			}),
			signal: AbortSignal.timeout(15_000),
		});
		const token = await tokenResponse.json();
		if (!tokenResponse.ok || !token.access_token)
			return send(res, 403, "GitHub authorization failed.");
		const userResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
				Accept: "application/vnd.github+json",
			},
			signal: AbortSignal.timeout(15_000),
		});
		const user = await userResponse.json();
		if (!userResponse.ok || user.login?.toLowerCase() !== owner)
			return send(res, 403, "Only the site owner can sign in.");
		const message = JSON.stringify(
			`authorization:github:success:${JSON.stringify({ token: token.access_token, provider: "github" })}`,
		).replaceAll("<", "\\u003c");
		return send(
			res,
			200,
			`<!doctype html><html lang="en"><meta charset="utf-8"><title>GitHub sign-in</title><p>Completing sign-in...</p><script>const target=${JSON.stringify(origin)};window.addEventListener('message',event=>{if(event.origin===target&&event.source===window.opener){window.opener.postMessage(${message},target);window.close();}},{once:true});window.opener?.postMessage('authorizing:github',target);</script></html>`,
			"text/html",
		);
	} catch {
		// Never log OAuth codes, cookies, tokens, or upstream response bodies.
		send(res, 502, "Sign-in service unavailable. Try again later.");
	}
});

if (process.env.NODE_ENV !== "test") server.listen(8790, "127.0.0.1");
