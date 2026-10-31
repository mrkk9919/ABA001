/* ─── Transfer voice announcement (zh / en / km) ────────────────────────────
   Two announcements:
   1. speakTransferConfirm  – right when the user taps Confirm (amount review)
   2. speakTransferSuccess  – when the transfer settles
   Language is user-selectable (中文 / English / ខ្មែរ) and persisted.
   Uses the Web Speech API (speechSynthesis) — no network, no backend.
────────────────────────────────────────────────────────────────────────────── */

import { amountToKhmerSpeech } from './khmerSpeech';

export type TtsLang = 'zh' | 'en' | 'km';

const LANG_KEY = 'aba.tts.lang';

export function getTtsLang(): TtsLang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'zh' || v === 'en' || v === 'km' ? v : 'km';
  } catch {
    return 'km';
  }
}

export function setTtsLang(lang: TtsLang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ }
}

const LANG_TAG: Record<TtsLang, string> = { zh: 'zh-CN', en: 'en-US', km: 'km-KH' };
const VOICE_RE: Record<TtsLang, RegExp> = { zh: /^zh/i, en: /^en/i, km: /^km/i };

/* Normal (1x) speech rate — the ABA announcements must be read at a calm,
   natural pace, never sped up. */
const SPEECH_RATE = 1;

/* ─── OpenAI-compatible TTS (higher-quality natural voice) ───────────────────
   Used for English & Chinese announcements (Khmer is not supported by OpenAI
   TTS, so Khmer keeps the cambet89.online server Khmer TTS). If the call
   fails for any reason, the engine falls back to browser Web Speech API.
   Endpoint + voice are easy to swap for another OpenAI-compatible provider. */
const OPENAI_TTS_KEY = 'sk-Z-4GlxNqrimLP8X-_oNSgfcXLO1Qy4YM9Q_g1kNmQq0';
const OPENAI_TTS_ENDPOINT = 'https://api.openai.com/v1/audio/speech';
const OPENAI_TTS_VOICE = 'nova'; // alloy | echo | fable | onyx | nova | shimmer
const OPENAI_TTS_MODEL = 'tts-1';

async function speakOpenAI(text: string): Promise<boolean> {
  if (!OPENAI_TTS_KEY) return false;
  try {
    const resp = await fetch(OPENAI_TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_TTS_KEY}` },
      body: JSON.stringify({
        model: OPENAI_TTS_MODEL,
        voice: OPENAI_TTS_VOICE,
        input: text.slice(0, 4000),
        response_format: 'mp3',
      }),
    });
    if (!resp.ok) return false;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/* Browsers load the voice list asynchronously: the first getVoices() call is
   often empty, so the engine falls back to a default voice that can sound
   rushed or wrong. Pre-warm the list once so speak() picks the matching
   natural voice and reads at the normal 1x rate. */
let voicesWarmed = false;
function warmVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || voicesWarmed) return;
  voicesWarmed = true;
  try {
    const ss = window.speechSynthesis as SpeechSynthesis & { getVoices?: () => SpeechSynthesisVoice[] };
    ss.getVoices?.();
    ss.onvoiceschanged = () => { ss.getVoices?.(); };
  } catch { /* speech unavailable — announcements stay silent */ }
}
if (typeof window !== 'undefined') warmVoices();

function fmtAmount(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): string {
  const n = Number(amount).toLocaleString();
  if (currency === 'KHR') {
    if (lang === 'zh') return `${n} 瑞尔`;
    if (lang === 'km') return `${n} រៀល`;
    return `${n} KHR`;
  }
  if (lang === 'zh') return `${Number(amount).toFixed(2)} 美元`;
  if (lang === 'km') return `${Number(amount).toFixed(2)} ដុល្លារ`;
  return `$${Number(amount).toFixed(2)}`;
}

function speak(text: string, lang: TtsLang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const Utterance = (window as { SpeechSynthesisUtterance?: new (t: string) => SpeechSynthesisUtterance })
    .SpeechSynthesisUtterance;
  if (typeof Utterance !== 'function') return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new Utterance(text);
    utter.lang = LANG_TAG[lang];
    // Normal 1x pace for every announcement (never sped up).
    utter.rate = SPEECH_RATE;
    utter.pitch = 1;
    // Prefer the matching language voice (pre-warmed above) so the reading
    // sounds natural at the normal rate instead of a default engine.
    let voice: SpeechSynthesisVoice | undefined;
    try {
      const ss = window.speechSynthesis as SpeechSynthesis & { getVoices?: () => SpeechSynthesisVoice[] };
      const voices = ss.getVoices?.() ?? [];
      voice = voices.find((v) => VOICE_RE[lang].test(v.lang))
        ?? voices.find((v) => v.lang === LANG_TAG[lang]);
    } catch { voice = undefined; }
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

/**
 * Amount review announcement (spoken when the user taps Confirm):
 *   zh: 你转出 3.00 美元的资金，请你确认
 *   en: You are transferring out $3.00, please confirm.
 *   km: អ្នកកំពុងផ្ទេរចំនួនទឹកប្រាក់ 3.00 ដុល្លារ សូមបញ្ជាក់
 */
export function speakTransferConfirm(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): boolean {
  let text: string;
  if (lang === 'zh') text = `你转出 ${fmtAmount(amount, currency, 'zh')}的资金，请你确认`;
  else if (lang === 'km') text = `អ្នកកំពុងផ្ទេរចំនួនទឹកប្រាក់ ${fmtAmount(amount, currency, 'km')} សូមបញ្ជាក់`;
  else text = `You are transferring out ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  return speak(text, lang);
}

/**
 * Success announcement — speaks the OUTBOUND amount (what you sent to the
 * recipient). NEVER speaks the remaining account balance (user explicitly
 * forbade reading out the balance):
 *   zh: 转账成功，你已转出 3.00 美元的资金，请你确认
 *   en: Transfer successful. You have transferred out $3.00, please confirm.
 *   km: ទឹកប្រាក់ចំនួន [amount in Khmer words] បានវេរចេញ សូមបញ្ជាក់
 *       (e.g. 88 → ទឹកប្រាក់ចំនួន ប្រាំបី ដប់ ប្រាំបី ដុល្លា បានវេរចេញ សូមបញ្ជាក់)
 */
export function speakTransferSuccess(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): boolean {
  let text: string;
  if (lang === 'zh') {
    text = `转账成功，你已转出 ${fmtAmount(amount, currency, 'zh')}的资金，请你确认`;
  } else if (lang === 'km') {
    if (currency === 'USD') {
      text = `ជូនដំណឹង ${amountToKhmerSpeech(amount)}`;
    } else {
      text = `ជូនដំណឹង ${numberToKhmer(Math.round(amount))} រៀល`;
    }
  } else {
    text = `Transfer successful. You have transferred out ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  }
  return speak(text, lang);
}

/**
 * Async version — calls the backend TTS API to generate real Khmer audio
 * for ANY amount. Falls back to browser Web Speech API if the API is down.
 *
 * Call this on transfer success for the best audio quality.
 */
export async function speakTransferSuccessSmart(
  lang: TtsLang,
  amount: number,
  currency: 'USD' | 'KHR',
): Promise<void> {
  // Khmer: OpenAI TTS does not support Khmer, so use the cambet89 server
  // Khmer TTS (works for any amount) with browser TTS as the final fallback.
  if (lang === 'km') {
    try {
      const resp = await fetch('https://cambet89.online/api/khmer-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: String(amount),
          currency: currency,
          template: 'ទឹកប្រាក់ចំនួន **** សូមបញ្ជាក់',
        }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => { URL.revokeObjectURL(url); speakTransferSuccess(lang, amount, currency); };
        await audio.play();
        return;
      }
    } catch {
      // API unavailable — fall through to Web Speech
    }
    speakTransferSuccess(lang, amount, currency);
    return;
  }

  // English / Chinese: try the higher-quality OpenAI-compatible TTS voice first.
  const text =
    lang === 'zh'
      ? `转账成功，你已转出 ${fmtAmount(amount, currency, 'zh')}的资金，请你确认`
      : `Transfer successful. You have transferred out ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  const ok = await speakOpenAI(text);
  if (!ok) speakTransferSuccess(lang, amount, currency);
}

/**
 * Incoming-payment (PaySound) announcement — speaks the received transfer
 * amount, never the account balance:
 *   zh: 收到转账金额 5.00 美元，请您确认
 *   en: Received transfer amount $5.00, please confirm.
 *   km: បានទទួលចំនួនទឹកប្រាក់ផ្ទេរ 5.00 ដុល្លារ សូមបញ្ជាក់
 */
export function speakReceived(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): boolean {
  let text: string;
  if (lang === 'zh') text = `收到转账金额 ${fmtAmount(amount, currency, 'zh')}，请您确认`;
  else if (lang === 'km') text = `បានទទួលចំនួនទឹកប្រាក់ផ្ទេរ ${fmtAmount(amount, currency, 'km')} សូមបញ្ជាក់`;
  else text = `Received transfer amount ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  return speak(text, lang);
}

/** Smart version — OpenAI-compatible voice for en/zh, browser fallback.
 *  Khmer stays on browser/server (OpenAI has no Khmer voice). */
export async function speakReceivedSmart(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): Promise<void> {
  if (lang === 'km') { speakReceived(amount, currency, lang); return; }
  const text =
    lang === 'zh'
      ? `收到转账金额 ${fmtAmount(amount, currency, 'zh')}，请您确认`
      : `Received transfer amount ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  const ok = await speakOpenAI(text);
  if (!ok) speakReceived(amount, currency, lang);
}
