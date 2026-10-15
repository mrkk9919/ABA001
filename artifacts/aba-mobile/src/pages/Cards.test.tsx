import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import type { ReactNode } from 'react';
import Cards from './Cards';

function renderWithMemoryLocation(ui: ReactNode) {
  const memory = { path: '/cards' };
  const navigate = vi.fn((to: string) => {
    memory.path = to;
  });
  const hook = () => [memory.path, navigate] as [string, (to: string) => void];

  const utils = render(<Router hook={hook}>{ui}</Router>);
  return { ...utils, memory, navigate };
}

describe('Cards page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header, debit card and all card settings rows', () => {
    renderWithMemoryLocation(<Cards />);

    // Header
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('ABA');
    expect(heading.textContent).toContain('កាត');

    // Debit card contents
    expect(screen.getByText(/ABA.*BANK/)).toBeInTheDocument();
    expect(screen.getByText('NATIONAL BANK OF CANADA GROUP')).toBeInTheDocument();
    expect(screen.getByText('DEBIT')).toBeInTheDocument();
    expect(screen.getByText('YUKHEANG SOEU')).toBeInTheDocument();
    expect(screen.getByText('6233 7501 5785 4858')).toBeInTheDocument();
    expect(screen.getByText(/Exp:/)).toBeInTheDocument();
    expect(screen.getByText(/CVV:/)).toBeInTheDocument();

    // Card selector
    expect(screen.getByText('UPI Debit Card')).toBeInTheDocument();
    expect(screen.getByText(/qiang \*168/)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByText('ផ្ទេរ')).toBeInTheDocument();
    expect(screen.getByText('មើលប្រតិបត្តិការ')).toBeInTheDocument();
    expect(screen.getByText('បង្កកកាត')).toBeInTheDocument();

    // Card Settings section
    expect(screen.getByText('ការកំណត់លើកាត')).toBeInTheDocument();
    const rows = [
      'ប្តូរកម្រិតប្រតិបត្តិការ',
      'ការទូទាត់តាមអនឡាញ',
      'ប្តូរលេខសម្ងាត់ថ្មី',
      'ប្តូរគណនីភ្ជាប់',
    ] as const;
    for (const title of rows) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('toggles the Online Payments switch off and back on', async () => {
    const user = userEvent.setup();
    renderWithMemoryLocation(<Cards />);

    const toggle = screen.getByRole('switch', { name: 'Online payments toggle' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles CVV visibility', async () => {
    const user = userEvent.setup();
    renderWithMemoryLocation(<Cards />);

    // CVV hidden by default
    expect(screen.getByText('***')).toBeInTheDocument();

    // Click CVV button to show
    const cvvBtn = screen.getByRole('button', { name: /CVV/ });
    await user.click(cvvBtn);
    expect(screen.getByText('159')).toBeInTheDocument();
  });

  it('navigates back to / when the back button is pressed', async () => {
    const user = userEvent.setup();
    const { navigate } = renderWithMemoryLocation(<Cards />);

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toBe('/');
  });
});
