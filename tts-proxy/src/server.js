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
const FRENCH_VOICE_ID = process.env.ELEVENLABS_FRENCH_VOICE_ID ?? DEFAULT_VOICE_ID;
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH ?? 500);
const CACHE_DIR = process.env.CACHE_DIR ?? ".cache/audio";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30);
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
		enforceRateLimit(req);
		const text = normalizeText(req.body?.text);
		const voice = normalizeVoice(req.body?.voice);
		const voiceId = getVoiceId(voice);

		if (!ELEVENLABS_API_KEY) {
			return res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured." });
		}
		if (!voiceId) {
			return res.status(500).json({
				error: "No ElevenLabs voice id configured. Set ELEVENLABS_FRENCH_VOICE_ID or ELEVENLABS_DEFAULT_VOICE_ID.",
			});
		}

		const cachePath = getCachePath({ text, voiceId });
		const cached = await readCachedAudio(cachePath);
		if (cached) return sendAudio(res, cached, "HIT");

		const audio = await synthesizeWithElevenLabs({ text, voiceId });
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
	if (voice === "french" || voice === "fr") return FRENCH_VOICE_ID;
	return DEFAULT_VOICE_ID;
}

function getCachePath({ text, voiceId }) {
	const hash = crypto
		.createHash("sha256")
		.update(`${ELEVENLABS_MODEL}:${voiceId}:${text}`)
		.digest("hex");
	return path.join(CACHE_DIR, `${hash}.mp3`);
}

async function readCachedAudio(cachePath) {
	try {
		return await fs.readFile(cachePath);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

async function writeCachedAudio(cachePath, audio) {
	await fs.mkdir(path.dirname(cachePath), { recursive: true });
	await fs.writeFile(cachePath, audio);
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
