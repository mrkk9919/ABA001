import { Router, type IRouter } from "express";

const router: IRouter = Router();

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
 * GET /api/khmer-tts?amount=88&currency=USD
 * Returns the Khmer announcement text for voice playback.
 * Response: { text: "ជូនដំណឹង ប្រាំបី ដប់ ប្រាំបី ដុល្លា", amount: 88, currency: "USD" }
 */
router.get("/khmer-tts", (req, res) => {
  const amount = Number(req.query.amount);
  const currency = (req.query.currency as string)?.toUpperCase() === "KHR" ? "KHR" : "USD";

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid amount", received: req.query.amount });
    return;
  }

  let text: string;
  if (currency === "USD") {
    text = `ជូនដំណឹង ${amountToKhmerSpeech(amount)}`;
  } else {
    text = `ជូនដំណឹង ${numberToKhmer(Math.round(amount))} រៀល`;
  }

  res.json({ text, amount, currency });
});

export default router;
