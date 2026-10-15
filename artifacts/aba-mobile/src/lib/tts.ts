/* ─── Transfer voice announcement (zh / en / km) ────────────────────────────
   Two announcements:
   1. speakTransferConfirm  – right when the user taps Confirm (amount review)
   2. speakTransferSuccess  – when the transfer settles
   Language is user-selectable (中文 / English / ខ្មែរ) and persisted.
   Uses the Web Speech API (speechSynthesis) — no network, no backend.
────────────────────────────────────────────────────────────────────────────── */

export type TtsLang = 'zh' | 'en' | 'km';

const LANG_KEY = 'aba.tts.lang';

export function getTtsLang(): TtsLang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'en' || v === 'km' ? v : 'zh';
  } catch {
    return 'zh';
  }
}

export function setTtsLang(lang: TtsLang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ }
}

const LANG_TAG: Record<TtsLang, string> = { zh: 'zh-CN', en: 'en-US', km: 'km-KH' };
const VOICE_RE: Record<TtsLang, RegExp> = { zh: /^zh/i, en: /^en/i, km: /^km/i };

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
    utter.rate = 1;
    utter.pitch = 1;
    const voice = window.speechSynthesis.getVoices().find((v) => VOICE_RE[lang].test(v.lang));
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
  if (lang === 'zh') text = `你转出 ${fmtAmount(amount, currency, 'zh')} 的资金，请你确认`;
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
 *   km: ផ្ទេរជោគជ័យ អ្នកបានផ្ទេរចំនួនទឹកប្រាក់ 3.00 ដុល្លារ សូមបញ្ជាក់
 */
export function speakTransferSuccess(lang: TtsLang, amount: number, currency: 'USD' | 'KHR'): boolean {
  let text: string;
  if (lang === 'zh') {
    text = `转账成功，你已转出 ${fmtAmount(amount, currency, 'zh')} 的资金，请你确认`;
  } else if (lang === 'km') {
    text = `ផ្ទេរជោគជ័យ អ្នកបានផ្ទេរចំនួនទឹកប្រាក់ ${fmtAmount(amount, currency, 'km')} សូមបញ្ជាក់`;
  } else {
    text = `Transfer successful. You have transferred out ${fmtAmount(amount, currency, 'en')}, please confirm.`;
  }
  return speak(text, lang);
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
