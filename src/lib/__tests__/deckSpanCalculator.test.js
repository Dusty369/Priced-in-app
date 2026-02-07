import { describe, it, expect } from 'vitest';
import { calculateDeckMembers } from '../deckSpanCalculator';

describe('calculateDeckMembers', () => {
  it('sizes bearers for short spans', () => {
    const result = calculateDeckMembers({ length: 4, width: 3, postSpacing: 1.8, height: 600 });
    expect(result.bearerSize).toBe('140x45');
    expect(result.doubleBearer).toBe(false);
  });

  it('sizes bearers for medium spans', () => {
    const result = calculateDeckMembers({ length: 4, width: 3, postSpacing: 2.8, height: 600 });
    expect(result.bearerSize).toBe('190x45');
  });

  it('doubles bearers for large spans', () => {
    const result = calculateDeckMembers({ length: 6, width: 3, postSpacing: 3.2, height: 600 });
    expect(result.bearerSize).toBe('190x45');
    expect(result.doubleBearer).toBe(true);
  });

  it('sizes joists for various spans', () => {
    const short = calculateDeckMembers({ length: 4, width: 2.0, height: 600 });
    expect(short.joistSize).toBe('140x45');

    const medium = calculateDeckMembers({ length: 4, width: 3.0, height: 600 });
    expect(medium.joistSize).toBe('190x45');

    const long = calculateDeckMembers({ length: 4, width: 4.5, height: 600 });
    expect(long.joistSize).toBe('240x45');
  });

  it('sizes posts for various heights', () => {
    const low = calculateDeckMembers({ length: 4, width: 3, height: 800 });
    expect(low.postSize).toBe('100x100');

    const mid = calculateDeckMembers({ length: 4, width: 3, height: 1500 });
    expect(mid.postSize).toBe('125x125');

    const high = calculateDeckMembers({ length: 4, width: 3, height: 2000 });
    expect(high.postSize).toContain('150x150');
  });

  it('warns for spans exceeding NZS 3604 tables', () => {
    const result = calculateDeckMembers({ length: 4, width: 6.0, height: 600 });
    expect(result.joistSize).toMatch(/LVL|engineered/i);
    expect(result.warnings.some(w => /engineer/i.test(w))).toBe(true);
  });

  it('requires handrail for height > 1m', () => {
    const result = calculateDeckMembers({ length: 4, width: 3, height: 1200 });
    expect(result.compliance.some(c => /handrail/i.test(c))).toBe(true);
  });

  it('requires building consent for area > 30m²', () => {
    // 8m × 4m = 32m²
    const result = calculateDeckMembers({ length: 8, width: 4, height: 600 });
    expect(result.compliance.some(c => /building consent/i.test(c))).toBe(true);
  });

  it('qualifies for exemption when small and low', () => {
    // 4m × 3m = 12m², 600mm high
    const result = calculateDeckMembers({ length: 4, width: 3, height: 600 });
    expect(result.compliance.some(c => /exemption/i.test(c))).toBe(true);
  });
});
