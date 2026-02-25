import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './index';

describe('HomePage', () => {
  it('shows correct brand name in header', () => {
    render(<HomePage />);
    // check the brand text around the logo
    expect(screen.getByText('واحدی')).toBeInTheDocument();
  });
});