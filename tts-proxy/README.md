# Clifford TTS Proxy

Small Express service that keeps the ElevenLabs API key on the VPS and returns MP3 audio to the static Astro blog.

## Endpoint

```http
POST /speak
Content-Type: application/json

{
  "text": "Bonjour, comment allez-vous ?",
  "voice": "french"
}
```

Response:

```text
audio/mpeg
```

## Environment

Copy `.env.example` to `.env` on the VPS and fill in:

```bash
ELEVENLABS_API_KEY=...
ELEVENLABS_FRENCH_VOICE_ID=...
```

Do not commit `.env`.

## Local Run

```bash
cd tts-proxy
npm install
npm start
```

Health check:

```bash
curl http://127.0.0.1:8787/health
```

## Caddy Reverse Proxy

Example Caddy site:

```caddyfile
tts.cliffordchen.org {
	reverse_proxy 127.0.0.1:8787
}
```

## Security Notes

- The ElevenLabs key is read from server environment variables only.
- The public Astro site never sees the API key.
- `ALLOWED_ORIGINS` should include `https://cliffordchen.org`.
- Audio is cached on disk under `.cache/audio` to avoid repeated ElevenLabs usage for the same phrase.
