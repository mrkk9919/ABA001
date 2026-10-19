import { describe, it, expect, beforeEach } from 'vitest';
import { addTxn, getDynamicTxns, getTxnDetail, resetTxns, todayStatementDate } from './txnStore';

const base = {
  name: 'SOEU YUKHEANG',
  amount: '18.75',
  currency: 'USD' as const,
  bankName: 'ABA Bank',
  bankColor: '#29AEFF',
  bakongId: '0168886168@ababank',
  accountNumber: '0168886168',
};

describe('txnStore dynamic statement', () => {
  beforeEach(() => resetTxns());

  it('appends a completed transfer as a debit row, newest first', () => {
    const a = addTxn(base);
    const b = addTxn({ ...base, name: 'CHAN VEASNA', amount: '5.00' });
    const list = getDynamicTxns();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(b.id); // newest first
    expect(list[1].id).toBe(a.id);
    expect(a.type).toBe('debit');
    expect(a.amount).toBe('-18.75');
    expect(a.initials).toBe('SY');
    expect(a.hasArrow).toBe(true);
  });

  it('assigns sequential ids starting after the static reference txns', () => {
    const a = addTxn(base);
    const b = addTxn(base);
    expect(a.id).toBe(13);
    expect(b.id).toBe(14);
  });

  it('exposes an ABA-to-ABA style receipt with the counterparty bank', () => {
    const row = addTxn({ ...base, note: 'coffee' });
    const d = getTxnDetail(String(row.id))!;
    expect(d).toBeDefined();
    expect(d.merchant).toBe('SOEU YUKHEANG');
    expect(d.type).toBe('debit');
    // No delivery timeline — the ABA to ABA receipt layout has none.
    expect(d.status).toBeUndefined();
    const labels = d.fields.map((f) => f.label);
    expect(labels).toEqual([
      'Trx. ID', 'Authorization Code', 'Cambodia time', 'Account#', 'Recipient',
      'Bank', 'Clearing time', 'From account', 'Original amount',
      'RRN#', 'Transfer type', 'Note',
    ]);
    const bank = d.fields.find((f) => f.label === 'Bank');
    expect(bank?.value).toBe('ABA Bank');
    const transferType = d.fields.find((f) => f.label === 'Transfer type');
    expect(transferType?.value).toBe('ABA to ABA');
    const original = d.fields.find((f) => f.label === 'Original amount');
    expect(original?.value).toBe('18.75 USD');
    const account = d.fields.find((f) => f.label === 'Account#');
    expect(account?.value).toBe('016 xxx xxx');
    const note = d.fields.find((f) => f.label === 'Note');
    expect(note?.value).toBe('coffee');
  });

  it('renders a Bakong cross-bank receipt (timeline + hash/reference) for non-ABA banks', () => {
    const row = addTxn({ ...base, bankName: 'Wing Bank (Cambodia) Plc', bankColor: '#D97706' });
    const d = getTxnDetail(String(row.id))!;
    // Bakong cross-bank template: delivery timeline present
    expect(d.status).toHaveLength(3);
    expect(d.status!.map((s) => s.label)).toEqual(['Sent', 'Processed', 'Delivered']);
    const labels = d.fields.map((f) => f.label);
    expect(labels).toEqual([
      'Trx. ID', 'Bakong hash #', 'Bank', 'From account',
      'Original amount', 'Reference #', 'Seller', 'Transaction date',
    ]);
    const bank = d.fields.find((f) => f.label === 'Bank');
    expect(bank?.value).toBe('Wing Bank (Cambodia) Plc');
    const reference = d.fields.find((f) => f.label === 'Reference #');
    expect(reference?.value).toMatch(/^100FT\d+$/);
    const seller = d.fields.find((f) => f.label === 'Seller');
    expect(seller?.value).toBe('SOEU YUKHEANG');
  });

  it('persists entries to localStorage', () => {
    addTxn(base);
    const raw = localStorage.getItem('aba.txns.v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.list).toHaveLength(1);
    expect(parsed.list[0].name).toBe('SOEU YUKHEANG');
  });

  it('formats a real statement date header', () => {
    expect(todayStatementDate()).toMatch(/^\d{2} [A-Za-z]{3} \d{4}$/);
  });
});
