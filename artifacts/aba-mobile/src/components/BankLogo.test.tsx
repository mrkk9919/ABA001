import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BankLogo from './BankLogo';

describe('BankLogo', () => {
  it('renders a brand tile plus the bank name for a known code', () => {
    render(<BankLogo bankCode="ababank" bankName="ABA Bank" />);
    expect(screen.getByText('ABA')).toBeInTheDocument(); // wordmark tile
    expect(screen.getByText('ABA Bank')).toBeInTheDocument();
  });

  it('renders the raw code as the wordmark when the code is unknown', () => {
    render(<BankLogo bankCode="zzztestbank" bankName="ZZZTESTBANK" />);
    expect(screen.getByText('ZZZT')).toBeInTheDocument();
    expect(screen.getByText('ZZZTESTBANK')).toBeInTheDocument();
  });

  it('falls back to a neutral tile when no code is present', () => {
    render(<BankLogo bankName="Unknown Bank" />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Unknown Bank')).toBeInTheDocument();
  });
});
