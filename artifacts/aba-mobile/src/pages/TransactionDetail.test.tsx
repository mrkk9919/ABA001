import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router, Route } from 'wouter';
import type { ReactNode } from 'react';
import TransactionDetail from './TransactionDetail';

function renderWithMemoryLocation(ui: ReactNode, path = '/accounts/1/tx/12') {
  const memory = { path };
  const navigate = vi.fn((to: string) => {
    memory.path = to;
  });
  const hook = () => [memory.path, navigate] as [string, (to: string) => void];

  const utils = render(
    <Router hook={hook}>
      <Route path="/accounts/:id/tx/:txId">{ui}</Route>
    </Router>
  );
  return { ...utils, memory, navigate };
}

describe('TransactionDetail receipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Bakong cross-bank payment receipt', () => {
    renderWithMemoryLocation(<TransactionDetail />);

    // Header: KHQR avatar + absolute amount + "Sent to" description
    expect(screen.getByText('KHQR')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-amount')).toHaveTextContent('1.00 USD');
    expect(screen.getByText('Sent to Nisai Media')).toBeInTheDocument();

    // Delivery status timeline (Bakong cross-bank receipt)
    for (const label of ['Sent', 'Processed', 'Delivered']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByText('25 Jul | 8:14 PM')).toHaveLength(3);

    // Receipt rows (Bakong cross-bank template, Khmer transaction ID label)
    const rows: Array<[string, string]> = [
      ['លេខកូដប្រតិបត្តិការ', '58148069728'],
      ['Bakong hash #', 'f4ab25ae'],
      ['Bank', 'Pi Pay Plc.'],
      ['From account', 'qiang (150 614 168)'],
      ['Original amount', '1.00 USD'],
      ['Reference #', '100FT38433785322'],
      ['Seller', 'Nisai Media'],
      ['Transaction date', 'Jul 25, 2026 08:14 PM'],
    ];
    for (const [label, value] of rows) {
      expect(screen.getByText(`${label}:`)).toBeInTheDocument();
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }

    // Action buttons (Khmer labels)
    expect(screen.getByText('ចែករំលែកជារូបភាព')).toBeInTheDocument();
    expect(screen.getByText('ឆាត')).toBeInTheDocument();
    expect(screen.getByText('ទាញយកជា PDF')).toBeInTheDocument();
    expect(screen.getByText('មើលប្រវត្តិប្រតិបត្តិការ')).toBeInTheDocument();
  });

  it('renders the internal ABA-to-ABA receipt (Received from)', () => {
    renderWithMemoryLocation(<TransactionDetail />, '/accounts/1/tx/6');

    expect(screen.getByTestId('receipt-amount')).toHaveTextContent('20.00 USD');
    expect(screen.getByText('Received from LEAH SEAN')).toBeInTheDocument();
    expect(screen.getByText('017 530 556')).toBeInTheDocument();
    expect(screen.getByText('100FT39274468733')).toBeInTheDocument();
    // No Bakong timeline on internal transfers
    expect(screen.queryByText('Sent')).toBeNull();
  });

  it('renders the Wing KHQR cross-border receipt with the Bakong timeline', () => {
    renderWithMemoryLocation(<TransactionDetail />, '/accounts/1/tx/11');

    expect(screen.getByTestId('receipt-amount')).toHaveTextContent('46.00 USD');
    expect(screen.getByText('57647758955')).toBeInTheDocument();
    expect(screen.getByText('Wing Bank (Cambodia) Plc')).toBeInTheDocument();
    expect(screen.getByText('100FT38342077625')).toBeInTheDocument();
    expect(screen.getByText('928ef807')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getAllByText('17 Jul | 10:43 AM')).toHaveLength(3);
  });

  it('navigates back to the account detail when the backdrop is tapped', async () => {
    const user = userEvent.setup();
    const { navigate } = renderWithMemoryLocation(<TransactionDetail />);

    await user.click(screen.getByRole('button', { name: 'Back to account' }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toBe('/accounts/1');
  });
});
