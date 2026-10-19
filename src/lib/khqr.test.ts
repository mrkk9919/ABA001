import { describe, it, expect } from 'vitest';
import { buildKHQR, parseKHQR, parseKHQRDetail, parseKHQRLenient, DEMO_KHQR } from './khqr';

describe('KHQR builder', () => {
  it('builds a valid static USD QR that round-trips', () => {
    const qr = buildKHQR({ bakongId: '0168886168@ababank', merchantName: 'SOEU YUKHEANG', currency: 'USD' });
    const parsed = parseKHQR(qr);
    expect(parsed).not.toBeNull();
    expect(parsed!.bakongId).toBe('0168886168@ababank');
    expect(parsed!.bankName).toBe('ABA Bank');
    expect(parsed!.merchantName).toBe('SOEU YUKHEANG');
    expect(parsed!.currency).toBe('USD');
    expect(parsed!.qrType).toBe('static');
  });

  it('builds a dynamic KHR QR with amount and bill number', () => {
    const qr = buildKHQR({
      bakongId: '0967779991@wingbank',
      merchantName: 'KIM SREYLEAK',
      currency: 'KHR',
      amount: '20000',
      billNumber: 'INV-2026-009',
    });
    const parsed = parseKHQR(qr);
    expect(parsed).not.toBeNull();
    expect(parsed!.currency).toBe('KHR');
    expect(parsed!.amount).toBe('20000');
    expect(parsed!.billNumber).toBe('INV-2026-009');
    expect(parsed!.qrType).toBe('dynamic');
  });

  it('rejects a QR with a tampered CRC', () => {
    const qr = buildKHQR({ bakongId: '0168886168@ababank', merchantName: 'TEST', currency: 'USD' });
    const tampered = qr.slice(0, -1) + (qr.slice(-1) === '0' ? 'F' : '0');
    const res = parseKHQRDetail(tampered);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('crc');
  });

  it('maps every supported bank code to its display name', () => {
    const cases: [string, string][] = [
      ['ababank', 'ABA Bank'],
      ['aclb', 'ACLEDA Bank Plc.'],
      ['wingbank', 'Wing Bank (Cambodia) Plc.'],
      ['canadiabank', 'Canadia Bank Plc.'],
      ['sathapana', 'Sathapana Bank Plc.'],
      ['vattanacbank', 'Vattanac Bank'],
      ['cambodiabank', 'Cambodia Bank'],
      ['principlebank', 'Prince Bank Plc.'],
      ['ppcbank', 'Phnom Penh Commercial Bank Plc.'],
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
