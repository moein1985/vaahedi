import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';

describe('cn() utility', () => {
  it('merges multiple class strings and drops duplicates', () => {
    const result = cn('px-2 py-1', 'px-4', 'text-center');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('text-center');
  });

  it('handles conflicting Tailwind classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).not.toContain('bg-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('handles conditional classes (truthy/falsy)', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('handles array of classes', () => {
    const arr = ['one', 'two'];
    const result = cn(arr, 'three');
    expect(result).toContain('one');
    expect(result).toContain('two');
    expect(result).toContain('three');
  });

  it('ignores null/undefined values', () => {
    const result = cn(null, undefined, 'foo');
    expect(result).toBe('foo');
  });

  it('preserves important non-conflicting classes', () => {
    const result = cn('m-2', 'p-2');
    expect(result).toContain('m-2');
    expect(result).toContain('p-2');
  });
});
