import { describe, it, expect } from 'vitest';
import {
  buildKHQR, parseKHQR, parseKHQRDetail, parseKHQRLenient, DEMO_KHQR, crc16,
} from './khqr';

/** Minimal EMVCo field helper (tag + 2-digit length + value). */
function field(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

describe('KHQR / Bakong parser & builder', () => {
  it('round-trips a static USD ABA QR', () => {
    const raw = buildKHQR({
      bakongId: '0168886168@ababank',
      merchantName: 'SOEU YUKHEANG',
      city: 'PHNOM PENH',
      currency: 'USD',
    });
    const d = parseKHQR(raw);
    expect(d).not.toBeNull();
    expect(d!.bakongId).toBe('0168886168@ababank');
    expect(d!.accountNumber).toBe('0168886168');
    expect(d!.bankCode).toBe('ababank');
    expect(d!.bankName).toBe('ABA Bank');
    expect(d!.bankColor).toBe('#E8002D');
    expect(d!.qrType).toBe('static');
    expect(d!.currency).toBe('USD');
    expect(d!.amount).toBeUndefined();
  });

  it('round-trips a dynamic KHR QR with amount', () => {
    const raw = buildKHQR({
      bakongId: '0967779991@wingbank',
      merchantName: 'KIM SREYLEAK',
      currency: 'KHR',
      amount: '20000',
    });
    const d = parseKHQR(raw);
    expect(d).not.toBeNull();
    expect(d!.qrType).toBe('dynamic');
    expect(d!.currency).toBe('KHR');
    expect(d!.amount).toBe('20000');
    expect(d!.bankName).toBe('Wing Bank (Cambodia) Plc.');
  });

  it('parses merchant ID, bill number and reference', () => {
    const raw = buildKHQR({
      bakongId: '095998877@principlebank',
      merchantName: 'LYNA PICH',
      currency: 'USD',
      amount: '15.50',
      billNumber: 'INV-2026-009',
      reference: 'PO 8842',
      merchantId: 'M-10001',
    });
    const d = parseKHQR(raw);
    expect(d).not.toBeNull();
    expect(d!.merchantId).toBe('M-10001');
    expect(d!.billNumber).toBe('INV-2026-009');
    expect(d!.reference).toBe('PO 8842');
    expect(d!.bankName).toBe('Prince Bank Plc.');
  });

  it('round-trips a Khmer merchant name (unicode)', () => {
    const raw = buildKHQR({
      bakongId: '088555222@ababank',
      merchantName: 'ឡុង ស្រីពេជ្រ',
      city: 'PHNOM PENH',
      currency: 'USD',
      amount: '5.25',
      merchantId: 'M-10001',
    });
    const d = parseKHQR(raw);
    expect(d).not.toBeNull();
    expect(d!.merchantName).toBe('ឡុង ស្រីពេជ្រ');
    expect(d!.amount).toBe('5.25');
    expect(d!.merchantId).toBe('M-10001');
  });

  it('rejects a QR whose CRC was tampered with', () => {
    const raw = buildKHQR({
      bakongId: '0168886168@ababank',
      merchantName: 'SOEU YUKHEANG',
      currency: 'USD',
    });
    // Flip the last CRC nibble so the stored checksum no longer matches.
    const tampered = raw.slice(0, -1) + (raw.slice(-1) === '0' ? 'F' : '0');
    const res = parseKHQRDetail(tampered);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('crc');
    expect(parseKHQR(tampered)).toBeNull();
  });

  it('rejects a valid non-Bakong EMV QR (unknown GUID)', () => {
    // Well-formed EMVCo QR with a VISA-style GUID and a correct CRC.
    let qr =
      field('00', '01') +
      field('01', '12') +
      field('29', field('00', 'com.visa') + field('01', '4000000001')) +
      field('52', '0000') +
      field('53', '840') +
      field('54', '10.00') +
      field('58', 'KH') +
      field('59', 'VISA MERCHANT') +
      field('60', 'PHNOM PENH');
    qr += field('63', crc16(qr + '6304'));

    const res = parseKHQRDetail(qr);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('not-bakong');
  });

  it('rejects malformed / empty input', () => {
    expect(parseKHQRDetail('').ok).toBe(false);
    expect(parseKHQRDetail('  ').ok).toBe(false);
    const res = parseKHQRDetail('not-a-tlv-string');
    expect(res.ok).toBe(false);
  });

  it('resolves the bank from the GUID when a Pi Pay code has no @bankCode', () => {
    // Pi Pay merchant codes carry "com.pipay" as the GUID and a plain account
    // number in tag 29.01 (no "@bankCode") — the bank must be inferred.
    let qr =
      field('00', '01') +
      field('01', '11') +
      field('29', field('00', 'com.pipay') + field('01', '0123456789')) +
      field('52', '0000') +
      field('53', '840') +
      field('58', 'KH') +
      field('59', 'NISAI MEDIA') +
      field('60', 'PHNOM PENH');
    qr += field('63', crc16(qr + '6304'));

    // Strict parse: not a Bakong GUID → unverified, but fields are still read.
    const strict = parseKHQRDetail(qr);
    expect(strict.ok).toBe(false);

    const len = parseKHQRLenient(qr);
    expect(len.structureOk).toBe(true);
    expect(len.isBakong).toBe(false);
    expect(len.data).not.toBeNull();
    expect(len.data!.bankName).toBe('Pi Pay Plc.');
    expect(len.data!.accountNumber).toBe('0123456789');
    expect(len.data!.merchantName).toBe('NISAI MEDIA');
  });

  it('resolves real bank codes across the NBC participant list', () => {
    const cases: Array<[string, string]> = [
      ['sathapana', 'Sathapana Bank Plc.'],
      ['abaa', 'ABA Bank'],
      ['wing', 'Wing Bank (Cambodia) Plc.'],
      ['vattanacbank', 'Vattanac Bank'],
      ['kookminbank', 'KB Kookmin Bank Plc.'],
      ['maybank', 'Maybank (Cambodia) Plc.'],
      ['cimb', 'CIMB Bank Plc.'],
      ['jtrustroyal', 'J Trust Royal Bank Plc.'],
      ['bankofchina', 'Bank of China'],
      ['icbc', 'ICBC'],
      ['phillipbank', 'Phillip Bank Plc.'],
      ['rhbindochina', 'RHB Indochina Bank Plc.'],
      ['prasac', 'PRASAC Microfinance Plc.'],
      ['lolve', 'LOLC (Cambodia) Plc.'],
      ['gdbank', 'Global Digital Bank'],
    ];
    for (const [code, name] of cases) {
      const raw = buildKHQR({ bakongId: `090000000@${code}`, merchantName: 'TEST' });
      const d = parseKHQR(raw);
      expect(d, code).not.toBeNull();
      expect(d!.bankName, code).toBe(name);
    }
  });

  it('every demo QR is valid and covers all listed Bakong banks', () => {
    const banks = new Set<string>();
    for (const entry of DEMO_KHQR) {
      const d = parseKHQR(entry.qr);
      expect(d, entry.label).not.toBeNull();
      banks.add(d!.bankName);
    }
    expect(banks).toContain('ABA Bank');
    expect(banks).toContain('ACLEDA Bank Plc.');
    expect(banks).toContain('Wing Bank (Cambodia) Plc.');
    expect(banks).toContain('Canadia Bank Plc.');
    expect(banks).toContain('Prince Bank Plc.');
  });
});

describe('parseKHQRLenient – read info even when verification fails', () => {
  it('still reads recipient/account/bank from a CRC-tampered QR, flagged crcOk=false', () => {
    const raw = buildKHQR({
      bakongId: '0168886168@ababank',
      merchantName: 'SOEU YUKHEANG',
      currency: 'USD',
      amount: '18.75',
      merchantId: 'M-778899',
    });
    const tampered = raw.slice(0, -1) + (raw.slice(-1) === '0' ? 'F' : '0');

    // strict parser must still reject it…
    const strict = parseKHQRDetail(tampered);
    expect(strict.ok).toBe(false);
    if (!strict.ok) expect(strict.reason).toBe('crc');

    // …while the lenient readout surfaces the fields it can decode.
    const len = parseKHQRLenient(tampered);
    expect(len.structureOk).toBe(true);
    expect(len.crcOk).toBe(false);
    expect(len.isBakong).toBe(true);
    expect(len.data).not.toBeNull();
    expect(len.data!.merchantName).toBe('SOEU YUKHEANG');
    expect(len.data!.bakongId).toBe('0168886168@ababank');
    expect(len.data!.bankName).toBe('ABA Bank');
    expect(len.data!.amount).toBe('18.75');
  });

  it('reports crcOk=true for an untouched valid QR', () => {
    const raw = buildKHQR({
      bakongId: '0123456789@acledabank',
      merchantName: 'CHAN VEASNA',
      currency: 'USD',
    });
    const len = parseKHQRLenient(raw);
    expect(len.crcOk).toBe(true);
    expect(len.isBakong).toBe(true);
    expect(len.data!.bankName).toBe('ACLEDA Bank Plc.');
  });

  it('returns null data for unreadable input', () => {
    expect(parseKHQRLenient('').data).toBeNull();
    expect(parseKHQRLenient('garbage-not-tlv').data).toBeNull();
  });

  it('falls back to the uppercase bank code when the bank is not in the map', () => {
    const raw = buildKHQR({
      bakongId: '099999999@zzztestbank',
      merchantName: 'TEST MERCHANT',
      currency: 'USD',
    });
    const len = parseKHQRLenient(raw);
    expect(len.crcOk).toBe(true);
    expect(len.data!.bankName).toBe('ZZZTESTBANK');
    // strict parse agrees on the fallback name
    const strict = parseKHQRDetail(raw);
    expect(strict.ok).toBe(true);
    if (strict.ok) expect(strict.data.bankName).toBe('ZZZTESTBANK');
  });
});
