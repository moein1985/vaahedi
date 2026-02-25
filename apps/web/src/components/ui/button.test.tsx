import React from 'react';
// declare jest-dom matcher types for TS (will be skipped if package missing)
declare global {
  namespace Vi {
    interface Assertion<T> {
      toBeInTheDocument(): void;
      toHaveClass(arg: string): void;
      toBeDisabled(): void;
    }
  }
}

// guard in case testing library not installed
let hasRTLReact = true;
try {
  require.resolve('@testing-library/react');
} catch {
  hasRTLReact = false;
}

let render: any, fireEvent: any, cleanup: any;
if (hasRTLReact) {
  ({ render, fireEvent, cleanup } = require('@testing-library/react'));
  try {
    require('@testing-library/jest-dom');
  } catch {}
}
// automatically unmount after each test when using RTL
import { afterEach } from 'vitest';
afterEach(() => {
  if (cleanup) cleanup();
});
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button.js';

if (!hasRTLReact) {
  describe.skip('<Button />', () => {
    it('skipped because testing library not installed', () => {});
  });
} else {
  describe('<Button />', () => {
    it('renders with default styling', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const btn = getByRole('button', { name: /click me/i });
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('inline-flex')).toBe(true);
  });

  it('applies variant props', () => {
    const { getByRole, rerender } = render(<Button variant="outline">Test</Button>);
    const btn = getByRole('button', { name: /test/i });
    expect(btn.classList.contains('border')).toBe(true);
    rerender(<Button variant="ghost">Test</Button>);
    expect(btn.classList.contains('hover:bg-muted')).toBe(true);
  });

  it('applies size props', () => {
    const { getByRole, rerender } = render(<Button size="sm">Small</Button>);
    const btn = getByRole('button', { name: /small/i });
    expect(btn.classList.contains('h-8')).toBe(true);
    rerender(<Button size="lg">Large</Button>);
    expect(btn.classList.contains('h-12')).toBe(true);
  });

  it('shows loading state with spinner and disables button', () => {
    const { getByRole, container } = render(<Button loading>Load</Button>);
    const btn = getByRole('button', { name: /load/i });
    expect(btn.disabled).toBe(true);
    // spinner should be present
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('disables when loading=true even if disabled prop false', () => {
    const { getByRole } = render(<Button loading disabled={false}>Hi</Button>);
    expect(getByRole('button', { name: /hi/i }).disabled).toBe(true);
  });

  it('calls onClick handler', () => {
    const handler = vi.fn();
    const { getByRole } = render(<Button onClick={handler}>Go</Button>);
    fireEvent.click(getByRole('button', { name: /go/i }));
    expect(handler).toHaveBeenCalled();
  });
});
}