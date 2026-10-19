import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import type { ReactNode } from 'react';
import Home from './Home';

function renderWithMemoryLocation(ui: ReactNode) {
  const memory = { path: '/' };
  const navigate = vi.fn((to: string) => {
    memory.path = to;
  });
  const hook = () => [memory.path, navigate] as [string, (to: string) => void];
  return { ...render(<Router hook={hook}>{ui}</Router>), memory, navigate };
}

describe('Home page → Cards entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a Cards tile that navigates to /cards', async () => {
    const user = userEvent.setup();
    const { navigate } = renderWithMemoryLocation(<Home />);

    const cardsTile = screen.getByRole('button', { name: /កាត/ });
    expect(cardsTile).toBeInTheDocument();

    await user.click(cardsTile);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toBe('/cards');
  });
});
