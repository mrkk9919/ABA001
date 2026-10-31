/**
 * KHQR / Bakong – EMVCo QR Code parser & generator
 * Spec: National Bank of Cambodia – KHQR Standard
 *
 * Top-level tags (2-digit tag, 2-digit length, value):
 *   00  Payload Format Indicator  → always "01"
 *   01  Point of Initiation       → "11" static | "12" dynamic
 *   29  Merchant Account Info (Bakong)
 *         00  GUID  "bakong.gov.kh"
 *         01  Bakong Account  "<account>@<bankCode>"
 *         02  Merchant ID (optional)
 *   52  Merchant Category Code
 *   53  Transaction Currency      → "840" USD | "116" KHR
 *   54  Transaction Amount        → present only for dynamic QR
 *   58  Country Code              → "KH"
 *   59  Merchant Name
 *   60  Merchant City
 *   62  Additional Data
 *         01  Bill Number
 *         02  Mobile Number
 *         05  Reference Label
 *   63  CRC-16 (CRC-16/CCITT-FALSE, over full string including "6304")
 */

// ─── Bank code → display info ─────────────────────────────────────────────────
// Covers the NBC KHQR participating banks & MFIs (aliases included), so real
// Bakong QRs uploaded from any participating institution resolve to a bank name.
// For production, sync this list with the official NBC KHQR participant codes.
type BankInfo = { name: string; color: string; short: string };
/**
 * Defines one bank under its canonical key plus any alias keys (older codes,
 * NBC variants, legacy names). Every alias shares the same object, so the
 * displayed name / brand colour / short wordmark are always in sync.
 */
function B(name: string, color: string, short: string, aliases: string[] = []): Record<string, BankInfo> {
  const info: BankInfo = { name, color, short };
  return { [aliases[0]]: info, ...Object.fromEntries(aliases.slice(1).map((a) => [a, info])) };
}

export const BANK_MAP: Record<string, BankInfo> = {
  ...B('ABA Bank', '#E8002D', 'ABA', ['ababank', 'abaa']),
  ...B('ACLEDA Bank Plc.', '#005BAA', 'ACLEDA', ['aclb', 'acledabank', 'acledabank_plc']),
  ...B('Wing Bank (Cambodia) Plc.', '#D97706', 'WING', ['wingbank', 'wing']),
  ...B('Canadia Bank Plc.', '#003DA5', 'CANADIA', ['canadiabank']),
  ...B('Sathapana Bank Plc.', '#D0006F', 'SATHAPANA', ['sathapana']),
  ...B('Vattanac Bank', '#B91C1C', 'VATTANAC', ['vattanacbank']),
  ...B('Cambodia Bank', '#C8102E', 'CB', ['cambodiabank']),
  ...B('Prince Bank Plc.', '#6D2077', 'PRINCE', ['principlebank', 'principle']),
  ...B('Phnom Penh Commercial Bank Plc.', '#0077B6', 'PPC', ['ppcbank', 'ppc', 'ppbank']),
  ...B('Maybank (Cambodia) Plc.', '#FFD100', 'MAYBANK', ['maybank']),
  ...B('CIMB Bank Plc.', '#7A0C42', 'CIMB', ['cimb']),
  ...B('J Trust Royal Bank Plc.', '#1E40AF', 'JTRUST', ['jtrustroyal', 'jtrust']),
  ...B('KB Kookmin Bank Plc.', '#F26E21', 'KOOKMIN', ['kookminbank', 'kookmin']),
  ...B('Bank of China', '#C8102E', 'BOC', ['bankofchina']),
  ...B('ICBC', '#B30000', 'ICBC', ['icbc']),
  ...B('Sacombank (Cambodia) Plc.', '#D71920', 'SACOM', ['sacombank']),
  ...B('Phillip Bank Plc.', '#0E7490', 'PHILLIP', ['phillipbank']),
  ...B('RHB Indochina Bank Plc.', '#8A1538', 'RHB', ['rhbindochina']),
  ...B('Union Commercial Bank Plc.', '#1D4ED8', 'UCB', ['ucb', 'ucbbank']),
  ...B('Cambodian Public Bank Plc.', '#F59E0B', 'CPB', ['cambodianpublicbank']),
  ...B('Woori Bank (Cambodia) Plc.', '#0EA5E9', 'WOORI', ['wooribank', 'worldbank']),
  ...B('KBank', '#1E9E4A', 'KBANK', ['kbank', 'kasikornbank']),
  ...B('BIDC', '#DC2626', 'BIDC', ['bidc', 'bidcbank']),
  ...B('AMK', '#E87722', 'AMK', ['amk', 'amkbank']),
  ...B('Hattha Bank Plc.', '#00833E', 'HATTHA', ['hathabank', 'hattha']),
  ...B('PRASAC Microfinance Plc.', '#16A34A', 'PRASAC', ['prasac', 'prasacmicrofinance']),
  ...B('LOLC (Cambodia) Plc.', '#7C3AED', 'LOLC', ['lolc', 'lolve']),
  ...B('KREDIT Microfinance Plc.', '#0891B2', 'KREDIT', ['kredith']),
  ...B('Market Microfinance Plc.', '#EA580C', 'MARKET', ['marketmicrofinance', 'market']),
  ...B('Global Digital Bank', '#4F46E5', 'GDB', ['gdbank']),
  ...B('BRUC', '#15803D', 'BRUC', ['bruc']),
  ...B('Pi Pay Plc.', '#E8002D', 'PIPAY', ['pipay', 'pippay']),
  ...B('eMoney (Cambodia) Plc.', '#F97316', 'EMONEY', ['emoney']),
  /* ── All Cambodia banks (NBC commercial-bank list + common logos) ─────────── */
  ...B('Foreign Trade Bank of Cambodia', '#003087', 'FTB', ['ftb']),
  ...B('ARDB', '#00843D', 'ARDB', ['ardb']),
  ...B('Shinhan Bank (Cambodia) Plc.', '#0046FF', 'SHINHAN', ['shinhan']),
  ...B('Saigon-Hanoi Bank Cambodia Plc.', '#E60012', 'SHB', ['shb']),
  ...B('BRED Bank (Cambodia) Plc.', '#002395', 'BRED', ['bred']),
  ...B('Chief (Cambodia) Commercial Bank Plc.', '#6D28D9', 'CHIEF', ['chief']),
  ...B('B.I.C. (Cambodia) Bank Plc.', '#C8102E', 'BIC', ['bic']),
  ...B('Industrial Bank of Korea', '#003876', 'IBK', ['ibk']),
  ...B('Chip Mong Commercial Bank Plc.', '#B91C1C', 'CHIPMONG', ['chipmong']),
  ...B('Asia-Pacific Development Bank Plc.', '#2563EB', 'APD', ['apd']),
  ...B('Panda Commercial Bank Plc.', '#059669', 'PANDA', ['panda']),
  ...B('SME Bank of Cambodia Plc.', '#1D4ED8', 'SME', ['sme']),
  ...B('Alpha Commercial Bank Plc.', '#1E3A8A', 'ALPHA', ['alpha']),
  ...B('SBI Ly Hour Bank Plc.', '#0033A0', 'SBI', ['sbi']),
  ...B('DGB Bank Plc.', '#004098', 'DGB', ['dgb']),
  ...B('Rui Li (Cambodia) Bank Plc.', '#B91C1C', 'RUILI', ['ruili']),
  ...B('Heng He (Cambodia) Commercial Bank Plc.', '#EA580C', 'HENGHE', ['henghe']),
  ...B('Booyoung Khmer Bank Plc.', '#0891B2', 'BOOYOUNG', ['booyoung']),
  ...B('Hong Leong Bank (Cambodia) Plc.', '#0027A0', 'HONGLEONG', ['hongleong']),
  ...B('Cathay United Bank (Cambodia) Corp.', '#003893', 'CATHAY', ['cathayunited', 'cathay']),
  ...B('IPU Sea Bank (Cambodia) Plc.', '#1E40AF', 'IPU', ['ipu']),
  ...B('TrueMoney', '#C8102E', 'TRUEMONEY', ['truemoney']),
  ...B('Amret', '#E8632A', 'AMRET', ['amret']),
  /* ── Additional NBC-licensed commercial & specialized banks (full coverage) ── */
  ...B('Agribank Cambodia', '#00994D', 'AGRI', ['agribank', 'agribankcambodia', 'vbsp']),
  ...B('Bangkok Bank (Cambodia) Plc.', '#1A3C8E', 'BBL', ['bangkokbank', 'bbl', 'bangkokbankplc']),
  ...B('Cambodia Asia Bank Plc.', '#0066B3', 'CAB', ['cab', 'cambodiaasiabank']),
  ...B('Cambodia Mekong Bank Plc.', '#00838F', 'MEKONG', ['mekongbank', 'cambodiamekongbank', 'cmb']),
  ...B('Cambodia Post Bank Plc.', '#E30613', 'CPB', ['cambodiapostbank', 'cpbank', 'postbank']),
  ...B('Cambodian Commercial Bank Ltd.', '#00529B', 'CCB', ['ccb', 'cambodiancommercialbank']),
  ...B('Crédit Mutuel Kampuchea Plc.', '#003DA5', 'CMK', ['cmk', 'creditmutuel', 'creditmutuelkampuchea']),
  ...B('First Commercial Bank Plc.', '#007A33', 'FIRST', ['firstcommercial', 'firstbank', 'fcb']),
  ...B('Krungthai Bank Plc.', '#1E64B3', 'KTB', ['krungthai', 'ktb', 'krungthaibank']),
  ...B('Land Bank of Cambodia Plc.', '#2E7D32', 'LAND', ['landbank', 'landbankcambodia']),
  ...B('Maruhan Japan Bank Plc.', '#D71920', 'MARUHAN', ['maruhan', 'maruhanjapanbank', 'mjb']),
  ...B('Mega International Commercial Bank Co., Ltd.', '#003C82', 'MEGA', ['mega', 'megabank', 'megainternational']),
  ...B('Oriental Bank Plc.', '#C62828', 'ORIENTAL', ['orientalbank', 'oriental', 'obc']),
  ...B('Standard Chartered Bank Cambodia', '#00A3E0', 'SCB', ['standardchartered', 'stanchart']),
  ...B('Taiwan Cooperative Bank (Cambodia) Plc.', '#005BAC', 'TCB', ['taiwancoop', 'taiwancooperative', 'tcb_cambodia']),
  ...B('VietinBank Cambodia Plc.', '#009245', 'VIETIN', ['vietinbank', 'vietin', 'ctg']),
  ...B('Vietcombank (Cambodia) Plc.', '#0066B3', 'VCB', ['vietcombank', 'vcb', 'vietcombankcambodia']),
  ...B('AEON Specialized Bank (Cambodia) Plc.', '#00A0E9', 'AEON', ['aeon', 'aeonspecializedbank']),
  ...B('Angkor Capital Specialized Bank Plc.', '#B8860B', 'ANGKOR', ['angkorcapital', 'angkorcapitalbank']),
  ...B('Bridge Specialized Bank Plc.', '#6A1B9A', 'BRIDGE', ['bridgebank', 'bridgespecialized']),
  ...B('NongHyup Finance (Cambodia) Plc.', '#00A651', 'NH', ['nonghyup', 'nh', 'nonghyupfinance']),
  ...B('Rural Development Bank', '#2E7D32', 'RDB', ['ruraldev', 'ruraldevelopmentbank', 'rdb']),
  ...B('Shanghai Commercial Bank Ltd.', '#C8102E', 'SHANGHAI', ['shanghaicommercial', 'shanghaibank']),
};

/**
 * Some payment providers (Pi Pay, eMoney, …) issue Bakong QR codes whose tag 29
 * carries their own GUID and an account string without an "@<bankCode>". When the
 * account string has no bank code, fall back to the GUID to name the bank.
 * Real NBC merchant GUIDs use the "khqr@<bankCode>" shape (e.g. khqr@aclb).
 */
function inferBankCode(guid: string, bankCodeFromId: string): string {
  if (bankCodeFromId) return bankCodeFromId;
  const g = guid.toLowerCase();
  const m = g.match(/@([a-z0-9_]+)$/);
  if (m) return m[1];
  if (g.includes('pipay') || g.includes('celpay')) return 'pippay';
  if (g.includes('emoney')) return 'emoney';
  if (g.includes('wing'))   return 'wingbank';
  return '';
}

/** True for both the classic "bakong.gov.kh" GUID and real NBC "khqr@…" merchant GUIDs. */
function isBakongGuid(guid: string): boolean {
  const g = guid.toLowerCase();
  return g.includes('bakong') || g.startsWith('khqr@');
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface KHQRData {
  /** Full Bakong account string, e.g. "012345678@ababank" */
  bakongId:     string;
  /** Raw account part before "@" */
  accountNumber: string;
  /** Bank code after "@" */
  bankCode:     string;
  /** Human-readable bank name */
  bankName:     string;
  /** Brand colour for the bank */
  bankColor:    string;
  /** Merchant / recipient name (tag 59) */
  merchantName: string;
  /** City (tag 60) */
  city:         string;
  /** "USD" or "KHR" */
  currency:     'USD' | 'KHR';
  /** Amount string if dynamic QR, otherwise undefined */
  amount?:      string;
  /** Tag 29.02 merchant ID (present on real merchant Bakong QRs) */
  merchantId?:  string;
  /** Tag 62.01 bill number */
  billNumber?:  string;
  /** Tag 62.02 mobile number */
  mobileNumber?: string;
  /** Tag 62.05 reference label */
  reference?:   string;
  /** "static" | "dynamic" */
  qrType:       'static' | 'dynamic';
}

// ─── EMV TLV parser ───────────────────────────────────────────────────────────
function parseTLV(data: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.slice(i, i + 2);
    const len = parseInt(data.slice(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > data.length) break;
    const val = data.slice(i + 4, i + 4 + len);
    map.set(tag, val);
    i += 4 + len;
  }
  return map;
}

// ─── CRC-16/CCITT-FALSE ──────────────────────────────────────────────────────
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ─── Parse a raw QR string ────────────────────────────────────────────────────
// Returns a structured result so callers can tell a corrupted code (bad CRC)
// apart from a valid EMVCo QR that simply is not a Bakong code.
export type ParseResult =
  | { ok: true; data: KHQRData }
  | { ok: false; reason: 'crc' | 'not-bakong' | 'malformed' };

export function parseKHQRDetail(raw: string): ParseResult {
  const input = raw.trim();
  if (!input) return { ok: false, reason: 'malformed' };

  const root = parseTLV(input);

  // Must have KHQR payload indicator
  if (root.get('00') !== '01') return { ok: false, reason: 'malformed' };

  // CRC-16 (tag 63, spec: last field, computed over the full string incl. "6304").
  // Reject corrupted QRs instead of silently accepting wrong data.
  const storedCrc = root.get('63');
  if (storedCrc) {
    const crcIdx = input.lastIndexOf('6304');
    // CRC covers the full string including the "6304" prefix of tag 63.
    if (crcIdx < 0 || crc16(input.slice(0, crcIdx + 4)) !== storedCrc.toUpperCase()) {
      return { ok: false, reason: 'crc' };
    }
  }

  // Bakong merchant account info lives in tag 29 (ABA-built) or the EMVCo
  // standard tag 30 used by real NBC KHQR merchant signs (khqr@<bankCode> GUID).
  const merchantInfoRaw = root.get('30') ?? root.get('29');
  if (!merchantInfoRaw) return { ok: false, reason: 'not-bakong' };
  const sub = parseTLV(merchantInfoRaw);

  const guid = sub.get('00') ?? '';
  if (!isBakongGuid(guid)) return { ok: false, reason: 'not-bakong' };

  const bakongId     = sub.get('01') ?? '';
  const atIdx        = bakongId.indexOf('@');
  const accountNumber = atIdx >= 0 ? bakongId.slice(0, atIdx) : bakongId;
  const bankCode     = inferBankCode(guid, atIdx >= 0 ? bakongId.slice(atIdx + 1).toLowerCase() : '');
  const bankInfo     = BANK_MAP[bankCode] ?? { name: bankCode ? bankCode.toUpperCase() : 'N/A', color: '#374151', short: '?' };
  // In real NBC merchant QRs (tag 30) field 02 is the acquirer bank name, not a
  // merchant ID; only surface it as an ID when it differs from the bank name.
  const rawId = sub.get('02');
  const merchantId = rawId && rawId.toUpperCase() !== bankInfo.short.toUpperCase() ? rawId : undefined;

  const currencyCode = root.get('53') ?? '840';
  const currency: 'USD' | 'KHR' = currencyCode === '116' ? 'KHR' : 'USD';
  const amount       = root.get('54');           // only present for dynamic
  const qrType: 'static' | 'dynamic' =
    root.get('01') === '12' ? 'dynamic' : 'static';

  const merchantName = root.get('59') ?? 'Unknown';
  const city         = root.get('60') ?? 'Cambodia';

  // Additional data (tag 62)
  let billNumber: string | undefined;
  let mobileNumber: string | undefined;
  let reference: string | undefined;
  const addRaw = root.get('62');
  if (addRaw) {
    const add = parseTLV(addRaw);
    billNumber   = add.get('01');
    mobileNumber = add.get('02');
    reference    = add.get('05');
  }

  return {
    ok: true,
    data: {
      bakongId, accountNumber, bankCode,
      bankName: bankInfo.name, bankColor: bankInfo.color,
      merchantName, city, currency, amount, qrType,
      merchantId, billNumber, mobileNumber, reference,
    },
  };
}

/** Convenience wrapper: returns parsed data or null. */
export function parseKHQR(raw: string): KHQRData | null {
  const res = parseKHQRDetail(raw);
  return res.ok ? res.data : null;
}

// ─── Lenient parse (read info even when verification fails) ──────────────────
// Used by the upload/camera paths so a code that fails CRC-16 or is not a Bakong
// KHQR can still surface its readable fields (recipient / account / bank),
// clearly flagged as UNVERIFIED – never used to authorise a payment.
export interface LenientResult {
  /** Best-effort fields, null when the payload is not even structured EMV. */
  data: KHQRData | null;
  /** EMVCo TLV structure was readable (payload indicator "01" present). */
  structureOk: boolean;
  /** Tag 63 CRC-16 matched the payload. */
  crcOk: boolean;
  /** Tag 29 contains the "bakong" GUID (real Bakong merchant info). */
  isBakong: boolean;
}

export function parseKHQRLenient(raw: string): LenientResult {
  const input = raw.trim();
  if (!input) return { data: null, structureOk: false, crcOk: false, isBakong: false };

  const root = parseTLV(input);
  if (root.get('00') !== '01') {
    return { data: null, structureOk: false, crcOk: false, isBakong: false };
  }

  let crcOk = false;
  const storedCrc = root.get('63');
  if (storedCrc) {
    const crcIdx = input.lastIndexOf('6304');
    crcOk = crcIdx >= 0 && crc16(input.slice(0, crcIdx + 4)) === storedCrc.toUpperCase();
  }

  const merchantInfoRaw = root.get('30') ?? root.get('29') ?? '';
  const sub = parseTLV(merchantInfoRaw);
  const guid = sub.get('00') ?? '';
  const isBakong = isBakongGuid(guid);

  const bakongId      = sub.get('01') ?? '';
  const atIdx         = bakongId.indexOf('@');
  const accountNumber = atIdx >= 0 ? bakongId.slice(0, atIdx) : bakongId;
  const bankCode      = inferBankCode(guid, atIdx >= 0 ? bakongId.slice(atIdx + 1).toLowerCase() : '');
  const bankInfo      = BANK_MAP[bankCode] ?? { name: bankCode ? bankCode.toUpperCase() : 'N/A', color: '#374151', short: '?' };

  const currencyCode = root.get('53') ?? '840';
  const currency: 'USD' | 'KHR' = currencyCode === '116' ? 'KHR' : 'USD';
  const amount       = root.get('54');
  const qrType: 'static' | 'dynamic' = root.get('01') === '12' ? 'dynamic' : 'static';

  let billNumber: string | undefined;
  let mobileNumber: string | undefined;
  let reference: string | undefined;
  const addRaw = root.get('62');
  if (addRaw) {
    const add = parseTLV(addRaw);
    billNumber   = add.get('01');
    mobileNumber = add.get('02');
    reference    = add.get('05');
  }

  return {
    data: {
      bakongId, accountNumber, bankCode,
      bankName: bankInfo.name, bankColor: bankInfo.color,
      merchantName: root.get('59') ?? 'Unknown',
      city:         root.get('60') ?? 'Cambodia',
      currency, amount, qrType,
      merchantId:   (() => {
        const rawId = sub.get('02');
        return rawId && rawId.toUpperCase() !== bankInfo.short.toUpperCase() ? rawId : undefined;
      })(),
      billNumber, mobileNumber, reference,
    },
    structureOk: true,
    crcOk,
    isBakong,
  };
}

// ─── Build a valid KHQR string (with CRC) ────────────────────────────────────
function field(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

function merchantAccountInfo(bakongId: string, merchantId?: string): string {
  let sub = field('00', 'bakong.gov.kh') + field('01', bakongId);
  if (merchantId) sub += field('02', merchantId);
  return field('29', sub);
}

function additionalData(bill?: string, mobile?: string, ref?: string): string {
  let sub = '';
  if (bill)   sub += field('01', bill);
  if (mobile) sub += field('02', mobile);
  if (ref)    sub += field('05', ref);
  return sub ? field('62', sub) : '';
}

export interface KHQRBuildOptions {
  bakongId:     string;       // "phone@bankcode"
  merchantName: string;
  city?:        string;
  currency?:    'USD' | 'KHR';
  amount?:      string;       // omit for static
  billNumber?:  string;
  mobileNumber?: string;
  reference?:   string;
  merchantId?:  string;
  mcc?:         string;
}

export function buildKHQR(opts: KHQRBuildOptions): string {
  const dynamic   = Boolean(opts.amount);
  const currency  = opts.currency === 'KHR' ? '116' : '840';
  const city      = opts.city ?? 'PHNOM PENH';
  const mcc       = opts.mcc ?? '0000';

  let qr = '';
  qr += field('00', '01');
  qr += field('01', dynamic ? '12' : '11');
  qr += merchantAccountInfo(opts.bakongId, opts.merchantId);
  qr += field('52', mcc);
  qr += field('53', currency);
  if (opts.amount) qr += field('54', opts.amount);
  qr += field('58', 'KH');
  qr += field('59', opts.merchantName.slice(0, 25));
  qr += field('60', city.slice(0, 15));
  qr += additionalData(opts.billNumber, opts.mobileNumber, opts.reference);
  // CRC placeholder: tag 63 + length 04 (always 4 hex chars)
  const crcPayload = qr + '6304';
  qr += field('63', crc16(crcPayload));
  return qr;
}

// ─── Demo KHQR strings (pre-built, valid CRC) ────────────────────────────────
// One static + dynamic per supported Bakong bank, incl. merchant ID, bill no.,
// reference and a Khmer merchant name, to exercise real-world payload variety.
export const DEMO_KHQR: { label: string; qr: string }[] = [
  {
    label: 'eMoney – LY KIM ENG (static USD)',
    qr: buildKHQR({
      bakongId: '0966279599@emoney',
      merchantName: 'LY KIM ENG',
      city: 'PHNOM PENH',
      currency: 'USD',
    }),
  },
  {
    label: 'ABA – SOEU YUKHEANG (static USD)',
    qr: buildKHQR({
      bakongId: '0168886168@ababank',
      merchantName: 'SOEU YUKHEANG',
      city: 'PHNOM PENH',
      currency: 'USD',
    }),
  },
  {
    label: 'ACLEDA – CHAN VEASNA (static USD)',
    qr: buildKHQR({
      bakongId: '0123456789@acledabank',
      merchantName: 'CHAN VEASNA',
      city: 'SIEM REAP',
      currency: 'USD',
    }),
  },
  {
    label: 'Wing – KIM SREYLEAK (dynamic KHR 20,000)',
    qr: buildKHQR({
      bakongId: '0967779991@wingbank',
      merchantName: 'KIM SREYLEAK',
      city: 'PHNOM PENH',
      currency: 'KHR',
      amount: '20000',
    }),
  },
  {
    label: 'Canadia – DAVID KHUN (static USD)',
    qr: buildKHQR({
      bakongId: '077123456@canadiabank',
      merchantName: 'DAVID KHUN',
      city: 'PHNOM PENH',
      currency: 'USD',
    }),
  },
  {
    label: 'Prince – LYNA PICH (dynamic USD 15.50 + bill)',
    qr: buildKHQR({
      bakongId: '095998877@principlebank',
      merchantName: 'LYNA PICH',
      city: 'PHNOM PENH',
      currency: 'USD',
      amount: '15.50',
      billNumber: 'INV-2026-009',
      reference: 'PO 8842',
    }),
  },
  {
    label: 'ABA – ឡុង ស្រីពេជ្រ (dynamic USD 5.25 + merchant ID)',
    qr: buildKHQR({
      bakongId: '088555222@ababank',
      merchantName: 'ឡុង ស្រីពេជ្រ',
      city: 'PHNOM PENH',
      currency: 'USD',
      amount: '5.25',
      merchantId: 'M-10001',
    }),
  },
  {
    // Real ACLEDA storefront sign QR (Ngin Saloem, Merchant ID 18603655):
    // 00020101021130370009khqr@aclb011009733866660206ACLEDA3920001185518603655010115204593153038405802KH5911Ngin Saloem6010Svay Rieng6214021009733866666304B1E6
    label: 'ACLEDA – Ngin Saloem (real sign QR, USD)',
    qr: '00020101021130370009khqr@aclb011009733866660206ACLEDA3920001185518603655010115204593153038405802KH5911Ngin Saloem6010Svay Rieng6214021009733866666304B1E6',
  },
];
