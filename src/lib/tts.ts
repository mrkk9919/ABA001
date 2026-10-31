/* ─── Transfer / PaySound voice announcement (zh / en / km) ──────────────────
   ALL announcements are now synthesized on the SERVER (cambet89.online),
   which accepts raw text in any of the three languages and returns an MP3.
   Browser Web Speech API is kept only as the final fallback if the server
   is unreachable. This replaces the dead OpenAI TTS key entirely.
────────────────────────────────────────────────────────────────────────────── */

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
const SPEECH_RATE = 1;

/* ─── Server TTS endpoint (cambet89.online) — accepts raw `text`, returns MP3 */
const SERVER_TTS_ENDPOINT = 'https://cambet89.online/api/khmer-tts';
const SERVER_TTS_TIMEOUT = 4000;

/* ─── Audio unlock: mobile browsers block programmatic audio.play() until the
   user has interacted with the page. On the first pointer/touch/click we play
   a silent WAV blob and "speak" an empty utterance, which unlocks both the
   HTMLAudio element and speechSynthesis for all later calls. */
let audioUnlocked = false;
function unlockAudio() {
  if (typeof window === 'undefined' || audioUnlocked) return;
  audioUnlocked = true;
  try {
    // 1) Unlock HTMLAudio playback (silent 0-sample WAV)
    const silent = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silent.volume = 0;
    silent.play().catch(() => { /* ignore — unlock may already be in effect */ });
  } catch { /* ignore */ }
  try {
    // 2) Unlock speechSynthesis (iOS requires a gesture-triggered speak)
    if ('speechSynthesis' in window) {
      const U = (window as { SpeechSynthesisUtterance?: new (t: string) => SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
      if (U) {
        const u = new U(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    }
  } catch { /* ignore */ }
}
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'click'].forEach((ev) => {
    window.addEventListener(ev, unlockAudio, { once: true, passive: true });
  });
}

/* ─── Shared: send text to the server, play the returned MP3. Returns true on
   success; on ANY failure (network, timeout, play rejection) returns false so
   the caller can fall back to browser TTS. */
async function playServerTts(text: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SERVER_TTS_TIMEOUT);
  try {
    const resp = await fetch(SERVER_TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 500) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return false;
    const blob = await resp.blob();
    if (!blob || blob.size < 100) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const cleanup = () => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } };
    audio.onended = cleanup;
    audio.onerror = () => { cleanup(); };
    // play() returns a promise; a rejection (e.g. autoplay block) must NOT
    // silently swallow the fallback — we catch it and return false.
    try {
      await audio.play();
      return true;
    } catch {
      cleanup();
      return false;
    }
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/* ─── Browser TTS fallback (Web Speech API) ───────────────────────────────── */
let voicesWarmed = false;
function warmVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || voicesWarmed) return;
  voicesWarmed = true;
  try {
    const ss = window.speechSynthesis as SpeechSynthesis & { getVoices?: () => SpeechSynthesisVoice[] };
    ss.getVoices?.();
    ss.onvoiceschanged = () => { ss.getVoices?.(); };
  } catch { /* ignore */ }
}
if (typeof window !== 'undefined') warmVoices();

function speakBrowser(text: string, lang: TtsLang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const Utterance = (window as { SpeechSynthesisUtterance?: new (t: string) => SpeechSynthesisUtterance })
    .SpeechSynthesisUtterance;
  if (typeof Utterance !== 'function') return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new Utterance(text);
    utter.lang = LANG_TAG[lang];
    utter.rate = SPEECH_RATE;
    utter.pitch = 1;
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

/* ─── Amount formatting per language ────────────────────────────────────────
   Khmer amounts use Khmer numerals (០១២៣៤៥៦៧៨៩) to match the official ABA
   Paysong style, e.g. "ទឹកប្រាក់ចំនួន ១០ ដុល្លា បានវេរចេញ សូមបញ្ជាក់". */
const KM_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
function toKhmerNumerals(n: number | string): string {
  return String(n).split('').map((c) => (/\d/.test(c) ? KM_DIGITS[Number(c)] : c)).join('');
}

function fmtAmount(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): string {
  const n = Number(amount).toLocaleString();
  if (currency === 'KHR') {
    if (lang === 'zh') return `${n} 瑞尔`;
    if (lang === 'km') return `${toKhmerNumerals(Math.round(amount))} រៀល`;
    return `${n} KHR`;
  }
  if (lang === 'zh') return `${Number(amount).toFixed(2)} 美元`;
  if (lang === 'km') {
    const whole = Math.floor(amount);
    const cents = Math.round((amount - whole) * 100);
    if (cents === 0) return `${toKhmerNumerals(whole)} ដុល្លា`;
    return `${toKhmerNumerals(whole)} ដុល្លា ${toKhmerNumerals(cents)} សេន`;
  }
  return `${Number(amount).toFixed(2)} US dollars`;
}

/* Build the full announcement text in the chosen language (for server TTS). */
function buildSuccessText(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): string {
  const amt = fmtAmount(amount, currency, lang);
  if (lang === 'zh') return `转账成功，您已转出 ${amt}，请确认。`;
  if (lang === 'km') return `ទឹកប្រាក់ចំនួន ${amt} បានវេរចេញ សូមបញ្ជាក់`;
  return `Transfer successful. You have sent ${amt}, please confirm.`;
}

function buildReceivedText(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): string {
  const amt = fmtAmount(amount, currency, lang);
  if (lang === 'zh') return `收到转账金额 ${amt}，请您确认。`;
  if (lang === 'km') return `ទឹកប្រាក់ចំនួន ${amt} បានបញ្ចូលគណនី សូមបញ្ជាក់`;
  return `Received transfer amount ${amt}, please confirm.`;
}

function buildConfirmText(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): string {
  const amt = fmtAmount(amount, currency, lang);
  if (lang === 'zh') return `您正在转出 ${amt}，请确认。`;
  if (lang === 'km') return `អ្នកកំពុងផ្ទេរចំនួនទឹកប្រាក់ ${amt} សូមបញ្ជាក់`;
  return `You are transferring out ${amt}, please confirm.`;
}

/* ─── Public API ──────────────────────────────────────────────────────────── */

/** Amount-review announcement (spoken when the user taps Confirm). */
export function speakTransferConfirm(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): boolean {
  return speakBrowser(buildConfirmText(lang, amount, currency), lang);
}

/** Success announcement — server TTS first, browser TTS fallback. */
export async function speakTransferSuccessSmart(
  lang: TtsLang,
  amount: number,
  currency: 'USD' | 'KHR',
): Promise<void> {
  const text = buildSuccessText(lang, amount, currency);
  const ok = await playServerTts(text);
  if (!ok) speakBrowser(text, lang);
}

/** Incoming-payment (PaySound) announcement — server TTS first, browser fallback.
 *  Used by the settings "test voice" button and any received-payment event. */
export async function speakReceivedSmart(
  amount: number,
  currency: 'USD' | 'KHR',
  lang: TtsLang,
): Promise<void> {
  const text = buildReceivedText(lang, amount, currency);
  const ok = await playServerTts(text);
  if (!ok) speakBrowser(text, lang);
}

/* Kept for backward compatibility (browser-only). Prefer the *Smart versions. */
export function speakTransferSuccess(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): boolean {
  return speakBrowser(buildSuccessText(lang, amount, currency), lang);
}
export function speakReceived(amount: number, currency: 'USD' | 'KHR', lang: TtsLang): boolean {
  return speakBrowser(buildReceivedText(lang, amount, currency), lang);
}
