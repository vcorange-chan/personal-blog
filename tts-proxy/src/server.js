import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express from "express";

const app = express();

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 8787);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID;
const ENGLISH_VOICE_ID = process.env.ELEVENLABS_ENGLISH_VOICE_ID ?? DEFAULT_VOICE_ID;
const FRENCH_VOICE_ID = process.env.ELEVENLABS_FRENCH_VOICE_ID ?? DEFAULT_VOICE_ID;
const KOREAN_VOICE_ID = process.env.ELEVENLABS_KOREAN_VOICE_ID ?? DEFAULT_VOICE_ID;
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH ?? 500);
const CACHE_DIR = process.env.CACHE_DIR ?? ".cache/audio";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 20);
const DAILY_REQUEST_LIMIT = Number(process.env.DAILY_REQUEST_LIMIT ?? 200);
const DAILY_CHARACTER_LIMIT = Number(process.env.DAILY_CHARACTER_LIMIT ?? 7_000);
const UPSTREAM_FAILURE_CACHE_MS = Number(process.env.UPSTREAM_FAILURE_CACHE_MS ?? 600_000);
const ALLOW_MISSING_ORIGIN = process.env.ALLOW_MISSING_ORIGIN === "true";
const CACHE_MAX_BYTES = Number(process.env.CACHE_MAX_BYTES ?? 100 * 1024 * 1024);
const CACHE_MAX_AGE_DAYS = Number(process.env.CACHE_MAX_AGE_DAYS ?? 90);
const CACHE_CLEANUP_INTERVAL_MS = Number(
	process.env.CACHE_CLEANUP_INTERVAL_MS ?? 6 * 60 * 60 * 1000,
);
const ALLOWED_ORIGINS = new Set(
	(process.env.ALLOWED_ORIGINS ?? "https://cliffordchen.org")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
);
const rateLimitBuckets = new Map();

app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
	const origin = req.get("origin");
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin");
	}
	res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") return res.sendStatus(204);
	next();
});

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

app.post("/speak", async (req, res) => {
	try {
		enforceAllowedOrigin(req);
		enforceRateLimit(req);
		const text = normalizeText(req.body?.text);
		const voice = normalizeVoice(req.body?.voice);
		const voiceId = getVoiceId(voice);

		if (!ELEVENLABS_API_KEY) {
			return res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured." });
		}
		if (!voiceId) {
			return res.status(500).json({
				error:
					"No ElevenLabs voice id configured. Set ELEVENLABS_FRENCH_VOICE_ID or ELEVENLABS_DEFAULT_VOICE_ID.",
			});
		}

		const cachePath = getCachePath({ text, voiceId });
		const cached = await readCachedAudio(cachePath);
		if (cached) return sendAudio(res, cached, "HIT");

		const failureCachePath = getFailureCachePath({ text, voiceId });
		const cachedFailure = await readCachedFailure(failureCachePath);
		if (cachedFailure) throw httpError(cachedFailure.statusCode, cachedFailure.message);

		await enforceDailyUsageLimit(text);
		let audio;
		try {
			audio = await synthesizeWithElevenLabs({ text, voiceId });
		} catch (error) {
			await writeCachedFailure(failureCachePath, error);
			throw error;
		}
		await writeCachedAudio(cachePath, audio);
		return sendAudio(res, audio, "MISS");
	} catch (error) {
		const status = error.statusCode ?? 500;
		return res.status(status).json({ error: error.message ?? "TTS proxy error." });
	}
});

app.listen(PORT, HOST, () => {
	console.log(`TTS proxy listening on http://${HOST}:${PORT}`);
});

scheduleCacheCleanup();

function enforceAllowedOrigin(req) {
	const origin = req.get("origin");
	if (!origin && ALLOW_MISSING_ORIGIN) return;
	if (origin && ALLOWED_ORIGINS.has(origin)) return;
	throw httpError(403, "TTS requests are not allowed from this origin.");
}

function enforceRateLimit(req) {
	const now = Date.now();
	const key = req.ip ?? "unknown";
	const bucket = rateLimitBuckets.get(key);

	if (!bucket || now >= bucket.resetAt) {
		rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return;
	}

	bucket.count += 1;
	if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
		throw httpError(429, "Too many TTS requests. Please try again later.");
	}
}

function normalizeText(value) {
	if (typeof value !== "string") throw httpError(400, "`text` must be a string.");
	const text = value.trim();
	if (!text) throw httpError(400, "`text` cannot be empty.");
	if (text.length > MAX_TEXT_LENGTH) {
		throw httpError(413, `Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`);
	}
	return text;
}

function normalizeVoice(value) {
	if (typeof value !== "string") return "french";
	const voice = value.trim().toLowerCase();
	return voice || "french";
}

function getVoiceId(voice) {
	if (voice === "english" || voice === "en") return ENGLISH_VOICE_ID;
	if (voice === "french" || voice === "fr") return FRENCH_VOICE_ID;
	if (voice === "korean" || voice === "ko") return KOREAN_VOICE_ID;
	return DEFAULT_VOICE_ID;
}

function getCachePath({ text, voiceId }) {
	const hash = crypto
		.createHash("sha256")
		.update(`${ELEVENLABS_MODEL}:${voiceId}:${text}`)
		.digest("hex");
	return path.join(CACHE_DIR, `${hash}.mp3`);
}

function getFailureCachePath({ text, voiceId }) {
	const hash = crypto
		.createHash("sha256")
		.update(`${ELEVENLABS_MODEL}:${voiceId}:${text}`)
		.digest("hex");
	return path.join(CACHE_DIR, "failures", `${hash}.json`);
}

async function readCachedAudio(cachePath) {
	try {
		return await fs.readFile(cachePath);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

async function readCachedFailure(cachePath) {
	try {
		const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
		if (Date.now() < cached.expiresAt) return cached;
		await fs.unlink(cachePath);
		return null;
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

async function writeCachedFailure(cachePath, error) {
	const statusCode = error.statusCode ?? 500;
	if (![402, 429, 500, 502, 503, 504].includes(statusCode)) return;
	await fs.mkdir(path.dirname(cachePath), { recursive: true });
	await fs.writeFile(
		cachePath,
		JSON.stringify({
			statusCode,
			message: error.message ?? "TTS upstream error.",
			expiresAt: Date.now() + UPSTREAM_FAILURE_CACHE_MS,
		}),
	);
}

async function writeCachedAudio(cachePath, audio) {
	await fs.mkdir(path.dirname(cachePath), { recursive: true });
	await fs.writeFile(cachePath, audio);
}

async function enforceDailyUsageLimit(text) {
	const usagePath = path.join(CACHE_DIR, "usage", `${new Date().toISOString().slice(0, 10)}.json`);
	const usage = await readDailyUsage(usagePath);
	const nextRequests = usage.requests + 1;
	const nextCharacters = usage.characters + text.length;

	if (nextRequests > DAILY_REQUEST_LIMIT) {
		throw httpError(
			429,
			`Daily TTS request limit reached. Maximum is ${DAILY_REQUEST_LIMIT} upstream requests per day.`,
		);
	}
	if (nextCharacters > DAILY_CHARACTER_LIMIT) {
		throw httpError(
			429,
			`Daily TTS character limit reached. Maximum is ${DAILY_CHARACTER_LIMIT} characters per day.`,
		);
	}

	await fs.mkdir(path.dirname(usagePath), { recursive: true });
	await fs.writeFile(
		usagePath,
		JSON.stringify({ requests: nextRequests, characters: nextCharacters }),
	);
}

async function readDailyUsage(usagePath) {
	try {
		return JSON.parse(await fs.readFile(usagePath, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT") return { requests: 0, characters: 0 };
		throw error;
	}
}

function scheduleCacheCleanup() {
	cleanupCache().catch((error) => {
		console.warn("TTS cache cleanup failed:", error);
	});

	setInterval(() => {
		cleanupCache().catch((error) => {
			console.warn("TTS cache cleanup failed:", error);
		});
	}, CACHE_CLEANUP_INTERVAL_MS).unref();
}

async function cleanupCache() {
	const files = await listCacheFiles(CACHE_DIR);
	const now = Date.now();
	const maxAgeMs = CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
	const remaining = [];

	for (const file of files) {
		if (file.path.endsWith(".json") && file.path.includes(`${path.sep}failures${path.sep}`)) {
			const failure = await readJsonOrNull(file.path);
			if (!failure || now >= failure.expiresAt) {
				await deleteFileIfExists(file.path);
				continue;
			}
		}

		if (now - file.mtimeMs > maxAgeMs) {
			await deleteFileIfExists(file.path);
			continue;
		}

		remaining.push(file);
	}

	let totalBytes = remaining.reduce((sum, file) => sum + file.size, 0);
	if (totalBytes <= CACHE_MAX_BYTES) return;

	remaining.sort((a, b) => a.mtimeMs - b.mtimeMs);
	for (const file of remaining) {
		await deleteFileIfExists(file.path);
		totalBytes -= file.size;
		if (totalBytes <= CACHE_MAX_BYTES) return;
	}
}

async function listCacheFiles(dir) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const nested = await Promise.all(
			entries.map(async (entry) => {
				const entryPath = path.join(dir, entry.name);
				if (entry.isDirectory()) return listCacheFiles(entryPath);
				if (!entry.isFile()) return [];
				const stats = await fs.stat(entryPath);
				return [{ path: entryPath, size: stats.size, mtimeMs: stats.mtimeMs }];
			}),
		);
		return nested.flat();
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
}

async function readJsonOrNull(filePath) {
	try {
		return JSON.parse(await fs.readFile(filePath, "utf8"));
	} catch {
		return null;
	}
}

async function deleteFileIfExists(filePath) {
	try {
		await fs.unlink(filePath);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
}

async function synthesizeWithElevenLabs({ text, voiceId }) {
	const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
		method: "POST",
		headers: {
			Accept: "audio/mpeg",
			"Content-Type": "application/json",
			"xi-api-key": ELEVENLABS_API_KEY,
		},
		body: JSON.stringify({
			text,
			model_id: ELEVENLABS_MODEL,
			voice_settings: {
				stability: 0.45,
				similarity_boost: 0.8,
				speed: 0.9,
			},
		}),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw httpError(response.status, `ElevenLabs request failed: ${detail}`);
	}

	return Buffer.from(await response.arrayBuffer());
}

function sendAudio(res, audio, cacheStatus) {
	res.setHeader("Content-Type", "audio/mpeg");
	res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
	res.setHeader("X-TTS-Cache", cacheStatus);
	return res.send(audio);
}

function httpError(statusCode, message) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}
