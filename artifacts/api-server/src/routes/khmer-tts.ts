import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router: IRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "..", "public", "audio");

/* Khmer number words (same logic as frontend khmerSpeech.ts) */
const ONES = [
  "សូន្យ", "មួយ", "ពីរ", "បី", "បួន",
  "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន",
];

function twoDigits(n: number): string[] {
  if (n < 10) return [ONES[n]];
  const t = Math.floor(n / 10);
  const o = n % 10;
  const out: string[] = [];
  if (t === 1) out.push("ដប់");
  else { out.push(ONES[t]); out.push("ដប់"); }
  if (o > 0) out.push(ONES[o]);
  return out;
}

function numberToKhmer(n: number): string {
  if (n === 0) return ONES[0];
  const parts: string[] = [];
  if (n >= 100000) { const v = Math.floor(n / 100000); parts.push(...twoDigits(v), "សែន"); n %= 100000; }
  if (n >= 10000) { const v = Math.floor(n / 10000); parts.push(...twoDigits(v), "ម៉ឺន"); n %= 10000; }
  if (n >= 1000) { const v = Math.floor(n / 1000); parts.push(...twoDigits(v), "ពាន់"); n %= 1000; }
  if (n >= 100) { const v = Math.floor(n / 100); parts.push(ONES[v], "រយ"); n %= 100; }
  if (n > 0) parts.push(...twoDigits(n));
  return parts.join(" ");
}

function amountToKhmerSpeech(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  if (cents === 0) return `${numberToKhmer(whole)} ដុល្លា`;
  return `${numberToKhmer(whole)} ដុល្លា ${numberToKhmer(cents)} សេន`;
}

/**
 * Find a pre-recorded MP3 for the given amount/currency.
 * Convention: khmer-transfer-success-{amount}USD.mp3
 */
function findAudioFile(amount: number, currency: string): string | null {
  const filename = `khmer-transfer-success-${amount}${currency}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  return fs.existsSync(filepath) ? filepath : null;
}

/**
 * GET /api/khmer-tts?amount=88&currency=USD
 * 
 * Returns:
 *   - format=audio: MP3 audio stream if pre-recorded, 404 otherwise
 *   - default: JSON { text, amount, currency, audioUrl? }
 *     audioUrl is present when a pre-recorded MP3 exists for this amount.
 */
router.get("/khmer-tts", (req, res) => {
  const amount = Number(req.query.amount);
  const currency = (req.query.currency as string)?.toUpperCase() === "KHR" ? "KHR" : "USD";
  const format = req.query.format as string | undefined;

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid amount", received: req.query.amount });
    return;
  }

  const audioFile = findAudioFile(amount, currency);

  // Audio request — return MP3 stream
  if (format === "audio") {
    if (!audioFile) {
      res.status(404).json({ error: "no pre-recorded audio for this amount", amount, currency });
      return;
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", fs.statSync(audioFile).size);
    fs.createReadStream(audioFile).pipe(res);
    return;
  }

  // JSON response — include audioUrl if available
  let text: string;
  if (currency === "USD") {
    text = `ជូនដំណឹង ${amountToKhmerSpeech(amount)}`;
  } else {
    text = `ជូនដំណឹង ${numberToKhmer(Math.round(amount))} រៀល`;
  }

  res.json({
    text,
    amount,
    currency,
    audioUrl: audioFile ? `/api/khmer-tts?amount=${amount}&currency=${currency}&format=audio` : null,
  });
});

export default router;
