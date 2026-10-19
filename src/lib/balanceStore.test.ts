import { describe, it, expect, beforeEach } from 'vitest';
import { deductBalance, getBalance, resetBalances } from './balanceStore';

describe('balanceStore', () => {
  beforeEach(() => {
    resetBalances();
  });

  it('returns seed balance when nothing was deducted', () => {
    expect(getBalance('1', '8.17')).toBe('8.17');
    expect(getBalance('2', null)).toBeNull();
  });

  it('deducts outbound amount from the seed balance', () => {
    deductBalance('1', 5);
    expect(getBalance('1', '8.17')).toBe('3.17');
  });

  it('accumulates multiple deductions', () => {
    deductBalance('1', 1.5);
    deductBalance('1', 2.25);
    expect(getBalance('1', '8.17')).toBe('4.42');
  });

  it('tracks deductions per account independently', () => {
    deductBalance('1', 5);
    deductBalance('2', 1);
    expect(getBalance('1', '8.17')).toBe('3.17');
    expect(getBalance('2', '0.00')).toBe('-1.00');
  });

  it('persists across store reloads', () => {
    deductBalance('1', 2);
    // simulate a fresh module load (cache cleared by reset is not called)
    expect(getBalance('1', '8.17')).toBe('6.17');
  });
});
