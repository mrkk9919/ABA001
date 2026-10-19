import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router: IRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "..", "public", "audio");

/* External TTS service (cambet89.online) — generates Khmer audio on the fly */
const EXTERNAL_TTS_URL = "https://cambet89.online/api/khmer-tts";

/**
 * POST /api/khmer-tts
 * Body: { amount: "88", currency: "USD", template: "ជូនដំណឹង ****" }
 *
 * Returns MP3 audio stream. X-TTS-Text header contains the actual Khmer text.
 * Forwards to external TTS service that can synthesize ANY amount.
 */
router.post("/khmer-tts", async (req, res) => {
  const { amount, currency, template } = req.body || {};

  if (!amount || !currency) {
    res.status(400).json({ error: "amount and currency required" });
    return;
  }

  try {
    const extResp = await fetch(EXTERNAL_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(amount),
        currency: String(currency),
        template: template || "ជូនដំណឹង ****",
      }),
    });

    if (!extResp.ok) {
      const errText = await extResp.text();
      res.status(extResp.status).json({ error: "TTS service failed", detail: errText });
      return;
    }

    // Pass through the audio stream
    const ttsText = extResp.headers.get("X-TTS-Text");
    if (ttsText) res.setHeader("X-TTS-Text", ttsText);
    res.setHeader("Content-Type", "audio/mpeg");

    const buf = Buffer.from(await extResp.arrayBuffer());
    res.setHeader("Content-Length", buf.length);
    res.send(buf);
  } catch (err) {
    res.status(502).json({ error: "TTS service unreachable", detail: String(err) });
  }
});

/**
 * GET /api/khmer-tts?amount=88&currency=USD
 *
 * Returns JSON with the Khmer announcement text.
 * First checks for a pre-recorded MP3; otherwise generates text locally.
 * Frontend should use POST to get actual audio for any amount.
 */
router.get("/khmer-tts", (req, res) => {
  const amount = Number(req.query.amount);
  const currency = (req.query.currency as string)?.toUpperCase() === "KHR" ? "KHR" : "USD";

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid amount", received: req.query.amount });
    return;
  }

  // Check for pre-recorded audio
  const filename = `khmer-transfer-success-${amount}${currency}.mp3`;
  const audioFile = path.join(AUDIO_DIR, filename);
  const hasAudio = fs.existsSync(audioFile);

  // Build text (simple local fallback)
  const text = `ជូនដំណឹង ${amount} ${currency === "USD" ? "ដុល្លា" : "រៀល"}`;

  res.json({
    text,
    amount,
    currency,
    audioUrl: hasAudio ? `/api/khmer-tts?amount=${amount}&currency=${currency}&format=audio` : null,
  });
});

export default router;
