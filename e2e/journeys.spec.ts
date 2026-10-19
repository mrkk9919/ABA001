/**
 * ABA mobile – Bakong/KHQR end-to-end journeys (T1–T10)
 *
 * Mirrors the browser-tested journeys:
 *   T1 home · T2 cards + switch + back · T3 accounts · T4 scan ·
 *   T5 Bakong demo cycle (6 codes) · T5b real QR upload · T5c tampered CRC reject ·
 *   T6 Nisai Media merchant receipt (bottom sheet) · T7 backdrop tap to close ·
 *   T8 Wing KHQR receipt (no timeline) · T9 scan→transfer→success · T10 404
 *
 * Every journey also asserts zero console errors and zero 4xx/5xx responses.
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = (name: string) => path.join(here, 'fixtures', name);

// ── Hygiene listeners: no console errors, no bad responses ──────────────
let consoleErrors: string[] = [];
let badResponses: string[] = [];

test.beforeEach(({ page }) => {
  consoleErrors = [];
  badResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      badResponses.push(`${res.status()} ${res.url()}`);
    }
  });
});

test.afterEach(() => {
  expect(consoleErrors, 'console errors').toEqual([]);
  expect(badResponses, '4xx/5xx responses').toEqual([]);
});

// ── T1 · Home ────────────────────────────────────────────────────────────
test('T1 home shows balance and four tiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('$8.17').first()).toBeVisible();
  for (const tile of ['Accounts', 'Cards', 'ABA Scan', 'Transfers']) {
    await expect(page.getByText(tile).first()).toBeVisible();
  }
});

// ── T2 · Cards ───────────────────────────────────────────────────────────
test('T2 cards face, settings, online-payments switch, back', async ({ page }) => {
  await page.goto('/cards');
  await expect(page.getByText('YUKHEANG SOEU')).toBeVisible();
  await expect(page.getByText('6233 7501 5785 4858')).toBeVisible();
  await expect(page.getByText('Exp: 07/31')).toBeVisible();
  await expect(page.getByText('DEBIT')).toBeVisible();
  for (const row of ['Change Transactions Limit', 'Online Payments', 'Reset Card PIN', 'Close card']) {
    await expect(page.getByText(row, { exact: true })).toBeVisible();
  }

  const toggle = page.getByRole('switch');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('button', { name: 'Back to accounts' }).click();
  await expect(page).toHaveURL(/\/accounts$/);
});

// ── T3 · Accounts ────────────────────────────────────────────────────────
test('T3 accounts list shows accounts and balance', async ({ page }) => {
  await page.goto('/accounts');
  await expect(page.getByText('qiang').first()).toBeVisible();
  for (const row of ['Perinal Account', 'Savings', 'Mobile']) {
    await expect(page.getByText(row, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('$8.17').first()).toBeVisible();
});

// ── T4 · Scan ────────────────────────────────────────────────────────────
test('T4 scan page copy and controls', async ({ page }) => {
  await page.goto('/scan');
  await expect(page.getByText('Point at a KHQR / Bakong QR code')).toBeVisible();
  await expect(page.getByText(/ABA · ACLEDA · Wing · Canadia · Prince Bank/)).toBeVisible();
  await expect(page.getByText(/cycles 6 KHQR accounts/)).toBeVisible();
  await expect(page.locator('input[type=file]')).toBeAttached();
});

// ── T5 · Bakong demo cycle (6 codes in module order) ────────────────────
const DEMO = [
  { name: 'SOEU YUKHEANG', bank: 'ABA Bank', type: 'Static' },
  { name: 'CHAN VEASNA', bank: 'ACLEDA Bank', type: 'Static' },
  { name: 'KIM SREYLEAK', bank: 'Wing Bank', type: 'Dynamic' },
  { name: 'DAVID KHUN', bank: 'Canadia Bank', type: 'Static' },
  { name: 'LYNA PICH', bank: 'Prince Bank', type: 'Dynamic' },
  { name: 'ឡុង ស្រីពេជ្រ', bank: 'ABA Bank', type: 'Dynamic' },
];

async function closeSheet(page) {
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeHidden({ timeout: 5000 });
}

test('T5 demo scan cycles all six KHQR accounts', async ({ page }) => {
  await page.goto('/scan');
  const demoButton = page.getByRole('button', { name: /Demo scan/ });

  for (const [i, d] of DEMO.entries()) {
    await demoButton.click();
    const sheet = page.getByRole('button', { name: 'Cancel' });
    await expect(sheet).toBeVisible();
    await expect(page.getByText(d.name).first()).toBeVisible();
    await expect(page.getByText(d.bank).first()).toBeVisible();
    await expect(page.getByText(d.type).first()).toBeVisible();
    if (i === 2) await expect(page.getByText(/Pay 20,000៛/)).toBeVisible();
    if (i === 4) await expect(page.getByText('INV-2026-009')).toBeVisible();
    if (i === 5) await expect(page.getByText('M-10001')).toBeVisible();
    await closeSheet(page);
  }
});

// ── T5b · Real Bakong QR upload ──────────────────────────────────────────
test('T5b real QR upload resolves full Bakong panel', async ({ page }) => {
  await page.goto('/scan');
  await page.setInputFiles('input[type=file]', fixtures('valid.png'));
  const sheet = page.getByRole('button', { name: 'Cancel' });
  await expect(sheet).toBeVisible();
  // Recipient / account / bank readout (explicit labeled rows)
  await expect(page.getByText('Recipient', { exact: true })).toBeVisible();
  await expect(page.getByText('SOEU YUKHEANG').first()).toBeVisible();
  await expect(page.getByText('0168886168@ababank')).toBeVisible();
  await expect(page.getByText('Account', { exact: true })).toBeVisible();
  await expect(page.getByText('Bank', { exact: true })).toBeVisible();
  await expect(page.getByText('ABA Bank').first()).toBeVisible();
  await expect(page.getByText('M-778899')).toBeVisible();
  await expect(page.getByText('RCPT-8899')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pay $18.75' })).toBeVisible();
  await closeSheet(page);
});

// ── T5c · Tampered QR → CRC rejection ────────────────────────────────────
test('T5c tampered QR warns but still reads info and can continue to pay', async ({ page }) => {
  await page.goto('/scan');
  await page.setInputFiles('input[type=file]', fixtures('tampered.png'));
  // Unverified readout: warning shown…
  await expect(page.getByText(/CRC check failed/)).toBeVisible();
  // …recipient / account / bank still readable…
  await expect(page.getByText('SOEU YUKHEANG').first()).toBeVisible();
  await expect(page.getByText('0168886168@ababank')).toBeVisible();
  await expect(page.getByText('ABA Bank').first()).toBeVisible();
  // …and the flow continues: Pay → transfer page, amount pre-filled/editable.
  await page.getByRole('button', { name: 'Pay $18.75' }).click();
  await expect(page).toHaveURL(/\/transfer$/);
  await expect(page.getByText('SOEU YUKHEANG')).toBeVisible();
  await expect(page.getByText('$18.75').first()).toBeVisible();
});

// ── T5d · Unknown bank code → readable uppercase fallback ─────────────────
test('T5d unknown bank code still shows a readable bank name and can pay', async ({ page }) => {
  await page.goto('/scan');
  await page.setInputFiles('input[type=file]', fixtures('zzz-test.png'));
  await expect(page.getByText('TEST MERCHANT').first()).toBeVisible();
  await expect(page.getByText('099999999@zzztestbank')).toBeVisible();
  await expect(page.getByText('ZZZTESTBANK').first()).toBeVisible();
  // flow continues to transfer with the bank shown in the recipient card
  await page.getByRole('button', { name: 'Pay $9.99' }).click();
  await expect(page).toHaveURL(/\/transfer$/);
  await expect(page.getByText('Bank', { exact: true })).toBeVisible();
  await expect(page.getByText('ZZZTESTBANK').first()).toBeVisible();
});

// ── T6 · Nisai Media / Pi Pay merchant receipt (bottom sheet) ────────────
test('T6 Nisai Media receipt renders the Bakong cross-bank template', async ({ page }) => {
  await page.goto('/accounts/1');
  const row = page.getByText('Nisai Media').first();
  await row.scrollIntoViewIfNeeded();
  await row.click();
  await expect(page).toHaveURL(/\/tx\/12$/);

  await expect(page.getByText('KHBC')).toBeVisible();
  await expect(page.getByText('-1.00 USD')).toBeVisible();
  // Bakong cross-bank receipt: delivery timeline present
  for (const s of ['Sent', 'Processed', 'Delivered']) {
    await expect(page.getByText(s)).toBeVisible();
  }
  await expect(page.getByText('25 Jul | 8:14 PM')).toHaveCount(3);
  for (const f of [
    '58148069728', 'f4ab25ae', 'Pi Pay Plc.',
    '100FT38433785322', 'Jul 25, 2026 08:14 PM',
    'Share as image', 'Download as PDF',
  ]) {
    await expect(page.getByText(f).first()).toBeVisible();
  }
  // The masked balance (*858) was removed from the backdrop per the annotation.
  await expect(page.getByText('*858')).toHaveCount(0);

  await page.screenshot({ path: 'e2e-results/t6-nisai-receipt.png', fullPage: true });
});

// ── T7 · Backdrop tap closes the receipt ─────────────────────────────────
test('T7 tapping backdrop returns to the account page', async ({ page }) => {
  await page.goto('/accounts/1/tx/12');
  await expect(page.getByText('Nisai Media').first()).toBeVisible();
  const backdrop = page.getByRole('button', { name: 'Back to accounts' });
  await backdrop.click({ position: { x: 190, y: 60 } }); // top area, above the sheet
  await expect(page).toHaveURL(/\/accounts\/1$/);
});

// ── T8 · Wing KHQR receipt (Bakong cross-bank template) ──────────────────
test('T8 Wing receipt renders the Bakong cross-bank template', async ({ page }) => {
  await page.goto('/accounts/1/tx/11');
  for (const f of ['46.00 USD', '57647758955', 'Wing Bank (Cambodia) Plc', '100FT38342077625', '928ef807']) {
    await expect(page.getByText(f).first()).toBeVisible();
  }
  for (const s of ['Sent', 'Processed', 'Delivered']) {
    await expect(page.getByText(s)).toBeVisible();
  }
});

// ── T9 · Scan → transfer → success ───────────────────────────────────────
test('T9 scan-to-transfer flow prefills, succeeds, and lands in the statement', async ({ page }) => {
  await page.goto('/scan');
  await page.setInputFiles('input[type=file]', fixtures('valid.png'));
  const pay = page.getByRole('button', { name: 'Pay $18.75' });
  await expect(pay).toBeVisible();
  await pay.click();

  await expect(page).toHaveURL(/\/transfer$/);
  await expect(page.getByText('SOEU YUKHEANG')).toBeVisible();
  await expect(page.getByText('$18.75').first()).toBeVisible();

  await page.getByRole('button', { name: 'Pay $18.75' }).click();

  // Payment PIN verification before the transfer is committed (mock PIN 1234).
  await expect(page.getByText('Enter payment PIN')).toBeVisible();
  for (const d of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: `输入 ${d}` }).click();
  }
  await expect(page.getByText('Transfer Successful')).toBeVisible();
  await expect(page.getByText(/TXN/)).toBeVisible();

  // Done → account statement now carries the new debit at the top…
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/accounts/1');
  await expect(page.getByText('SOEU YUKHEANG').first()).toBeVisible();
  await expect(page.getByText('-18.75')).toBeVisible();

  // …and tapping it opens the receipt with the counterparty bank.
  await page.getByText('SOEU YUKHEANG').first().click();
  await expect(page).toHaveURL(/\/tx\/13$/);
  await expect(page.getByText('Trx. ID')).toBeVisible();
  await expect(page.getByText('ABA Bank').first()).toBeVisible();
  await expect(page.getByText('18.75 USD', { exact: true })).toBeVisible();
});

// ── T11 · Cross-bank Bakong transfer → receipt uses the Bakong template ──
test('T11 cross-bank Bakong transfer receipt shows timeline + hash/reference', async ({ page }) => {
  await page.goto('/scan');
  const demoButton = page.getByRole('button', { name: /Demo scan/ });
  // Cycle past the ABA demo account to ACLEDA (non-ABA → Bakong receipt).
  await demoButton.click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await demoButton.click();
  await expect(page.getByText('CHAN VEASNA').first()).toBeVisible();
  await expect(page.getByText('ACLEDA Bank').first()).toBeVisible();

  // Static demo account without an amount → the sheet action is "Transfer".
  await page.getByRole('button', { name: 'Transfer' }).click();
  await expect(page).toHaveURL(/\/transfer$/);
  await expect(page.getByText('ACLEDA Bank').first()).toBeVisible();

  // Type 5 on the numpad, then confirm.
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Transfer' }).click();

  // Payment PIN verification (mock PIN 1234).
  await expect(page.getByText('Enter payment PIN')).toBeVisible();
  for (const d of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: `输入 ${d}` }).click();
  }
  await expect(page.getByText('Transfer Successful')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto('/accounts/1');
  await page.getByText('CHAN VEASNA').first().click();
  await expect(page).toHaveURL(/\/tx\/13$/);
  // Bakong cross-bank receipt: timeline + hash/reference fields
  for (const s of ['Sent', 'Processed', 'Delivered']) {
    await expect(page.getByText(s).first()).toBeVisible();
  }
  for (const f of ['Trx. ID', 'Bakong hash #', 'ACLEDA Bank', 'Reference #', 'Seller', 'Transaction date']) {
    await expect(page.getByText(f).first()).toBeVisible();
  }
  await expect(page.getByText('ABA to ABA')).toHaveCount(0);
});

// ── T12 · Wrong payment PIN → error + recovery ──────────────────────────
test('T12 wrong payment PIN shows an error and recovers on the correct PIN', async ({ page }) => {
  await page.goto('/scan');
  await page.setInputFiles('input[type=file]', fixtures('valid.png'));
  await page.getByRole('button', { name: 'Pay $18.75' }).click();
  await expect(page).toHaveURL(/\/transfer$/);
  await page.getByRole('button', { name: 'Pay $18.75' }).click();
  await expect(page.getByText('Enter payment PIN')).toBeVisible();

  // Wrong PIN → red error message, then the keypad resets.
  for (const d of ['1', '1', '1', '1']) {
    await page.getByRole('button', { name: `输入 ${d}` }).click();
  }
  await expect(page.getByText('支付密码错误，请重新输入')).toBeVisible();
  // Error state locks the keypad for ~1.1s, then resets (mirrors the reference UI).
  await page.waitForTimeout(1300);

  // Recovery: correct PIN commits the transfer.
  for (const d of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: `输入 ${d}` }).click();
  }
  await expect(page.getByText('Transfer Successful')).toBeVisible();
});

// ── T10 · Unknown route → 404 ────────────────────────────────────────────
test('T10 unknown route renders 404', async ({ page }) => {
  await page.goto('/does-not-exist-xyz');
  await expect(page.getByText('404')).toBeVisible();
});
