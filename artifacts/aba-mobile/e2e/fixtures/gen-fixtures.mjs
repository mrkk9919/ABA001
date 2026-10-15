#!/usr/bin/env node
/**
 * E2E QR fixtures generator (ABA mobile – Bakong/KHQR journeys)
 *
 * Produces the two PNG fixtures the Playwright suite uploads:
 *   valid.png     – a genuine Bakong KHQR (CRC-16 valid)
 *   tampered.png  – same payload with the last CRC digit flipped (0BFB → 0BF0)
 *
 * The payload builder mirrors src/lib/khqr.ts (field / crc16 / buildKHQR) so the
 * fixtures are byte-identical to what the app's own generator would emit.
 * Rendering uses Python's `qrcode` (needs: python3 -m pip install qrcode[pil]).
 *
 * Usage:  node gen-fixtures.mjs   (run from e2e/fixtures/)
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ── Mirror of lib/khqr.ts ──────────────────────────────────────────────
function field(tag, value) {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

function crc16(data) {
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

function merchantAccountInfo(bakongId, merchantId) {
  let sub = field('00', 'bakong.gov.kh') + field('01', bakongId);
  if (merchantId) sub += field('02', merchantId);
  return field('29', sub);
}

function additionalData(bill, mobile, ref) {
  let sub = '';
  if (bill) sub += field('01', bill);
  if (mobile) sub += field('02', mobile);
  if (ref) sub += field('05', ref);
  return sub ? field('62', sub) : '';
}

function buildKHQR(opts) {
  const dynamic = Boolean(opts.amount);
  const currency = opts.currency === 'KHR' ? '116' : '840';
  const city = opts.city ?? 'PHNOM PENH';
  const mcc = opts.mcc ?? '0000';
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
  const crcPayload = qr + '6304';
  qr += field('63', crc16(crcPayload));
  return qr;
}

// ── The test vector the suite asserts on ───────────────────────────────
const payload = buildKHQR({
  bakongId: '0168886168@ababank',
  merchantName: 'SOEU YUKHEANG',
  city: 'PHNOM PENH',
  currency: 'USD',
  amount: '18.75',
  merchantId: 'M-778899',
  billNumber: 'RCPT-8899',
  reference: 'CASHIER 07',
});

const crcIdx = payload.lastIndexOf('6304');
const tampered =
  payload.slice(0, crcIdx + 4) + '0BF0'; // was 0BFB → CRC no longer matches

console.log('payload   :', payload);
console.log('tampered  :', tampered);

// ── Render with python qrcode ──────────────────────────────────────────
function renderPng(text, outName) {
  const script = `
import qrcode, sys
img = qrcode.make(sys.argv[1], border=4, box_size=10)
img.save(sys.argv[2])
`;
  execFileSync('python3', ['-c', script, text, join(here, outName)]);
  console.log('wrote', outName);
}

renderPng(payload, 'valid.png');
renderPng(tampered, 'tampered.png');
