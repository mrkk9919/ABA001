/* ─── Khmer number-to-words conversion for TTS ────────────────────────────────
   Converts numeric amounts to Khmer spoken words for voice announcements.
   Uses the simple compound style (matches official ABA TTS samples):
     88  = ប្រាំបី ដប់ ប្រាំបី  (eight ten eight)
     100 = មួយ រយ              (one hundred)
────────────────────────────────────────────────────────────────────────────── */

const ONES = [
  'សូន្យ', 'មួយ', 'ពីរ', 'បី', 'បួន',
  'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន',
];

/**
 * Convert a non-negative integer to Khmer words.
 * Uses simple "digit ដប់" style for tens (e.g. 80 = ប្រាំបី ដប់),
 * matching the official ABA TTS sample recordings.
 */
export function numberToKhmer(n: number): string {
  if (n === 0) return ONES[0];

  const parts: string[] = [];

  if (n >= 100000) {
    const hundredThousands = Math.floor(n / 100000);
    parts.push(...twoDigitsToKhmer(hundredThousands));
    parts.push('សែន');
    n %= 100000;
  }

  if (n >= 10000) {
    const tenThousands = Math.floor(n / 10000);
    parts.push(...twoDigitsToKhmer(tenThousands));
    parts.push('ម៉ឺន');
    n %= 10000;
  }

  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    parts.push(...twoDigitsToKhmer(thousands));
    parts.push('ពាន់');
    n %= 1000;
  }

  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    parts.push(ONES[hundreds]);
    parts.push('រយ');
    n %= 100;
  }

  if (n > 0) {
    parts.push(...twoDigitsToKhmer(n));
  }

  return parts.join(' ');
}

/** Convert 1–99 to Khmer words (simple digit + ដប់ style). */
function twoDigitsToKhmer(n: number): string[] {
  if (n < 10) return [ONES[n]];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const out: string[] = [];
  // Simple style: 20 = ពីរ ដប់, 80 = ប្រាំបី ដប់ (not ម្ភៃ/ប៉ែតសិប)
  if (tens === 1) {
    out.push('ដប់');
  } else {
    out.push(ONES[tens]);
    out.push('ដប់');
  }
  if (ones > 0) out.push(ONES[ones]);
  return out;
}

/**
 * Format a USD amount for Khmer voice announcement.
 * Examples:
 *   88    → "ប្រាំបី ដប់ ប្រាំបី ដុល្លា"
 *   100   → "មួយ រយ ដុល្លា"
 *   5.50  → "ប្រាំ ដុល្លា ប្រាំ ដប់ សេន" (5 dollars 50 cents)
 */
export function amountToKhmerSpeech(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);

  if (cents === 0) {
    return `${numberToKhmer(whole)} ដុល្លា`;
  }
  return `${numberToKhmer(whole)} ដុល្លា ${numberToKhmer(cents)} សេន`;
}
