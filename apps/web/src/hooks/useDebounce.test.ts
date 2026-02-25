import { describe, it, expect, vi } from 'vitest';

// guard in case testing-library not installed
let hasRTL = true;
try {
  require.resolve('@testing-library/react-hooks');
} catch {
  hasRTL = false;
}

let renderHook: any, act: any;
if (hasRTL) {
  ({ renderHook, act } = require('@testing-library/react-hooks'));
}
import { useDebounce } from './useDebounce.js';

if (!hasRTL) {
  describe.skip('useDebounce hook', () => {
    it('skipped because testing library not installed', () => {});
  });
} else {
  describe('useDebounce hook', () => {
    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('init', 300));
      expect(result.current).toBe('init');
    });

  it('delays value updates by specified delay', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    expect(result.current).toBe('a');
    rerender({ value: 'b', delay: 500 });
    // still old value
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('b');
    vi.useRealTimers();
  });

  it('cancels previous debounce on new value', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300); // not enough to update to 'second'
    });
    rerender({ value: 'third', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('third');
    vi.useRealTimers();
  });

  it('handles rapid successive updates', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'x', delay: 100 } }
    );

    for (let val of ['a', 'b', 'c', 'd']) {
      rerender({ value: val, delay: 100 });
      act(() => {
        vi.advanceTimersByTime(50);
      });
    }

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('d');
    vi.useRealTimers();
  });
});
}