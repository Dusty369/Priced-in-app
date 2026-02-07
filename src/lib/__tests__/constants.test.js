import { describe, it, expect } from 'vitest';
import {
  formatNZD,
  TIER_LIMITS,
  LABOUR_ROLES,
  DEFAULT_LABOUR_RATES,
  GST_RATE,
} from '../constants';

describe('formatNZD', () => {
  it('formats positive amounts', () => {
    const result = formatNZD(1234.5);
    expect(result).toContain('1,234.50');
    expect(result).toMatch(/\$/);
  });

  it('formats zero', () => {
    const result = formatNZD(0);
    expect(result).toContain('0.00');
  });

  it('formats negative amounts', () => {
    const result = formatNZD(-500);
    expect(result).toContain('500.00');
  });
});

describe('GST_RATE', () => {
  it('is 0.15', () => {
    expect(GST_RATE).toBe(0.15);
  });
});

describe('TIER_LIMITS', () => {
  it('has free, trial, and professional tiers', () => {
    expect(TIER_LIMITS).toHaveProperty('free');
    expect(TIER_LIMITS).toHaveProperty('trial');
    expect(TIER_LIMITS).toHaveProperty('professional');
  });

  it('each tier has required fields', () => {
    for (const [key, tier] of Object.entries(TIER_LIMITS)) {
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('price');
      expect(tier).toHaveProperty('aiQuotesPerMonth');
      expect(tier).toHaveProperty('aiFollowUpsPerQuote');
      expect(tier).toHaveProperty('planUploadsPerMonth');
      expect(typeof tier.name).toBe('string');
      expect(typeof tier.price).toBe('number');
    }
  });

  it('trial tier has correct limits', () => {
    expect(TIER_LIMITS.trial.aiQuotesPerMonth).toBe(10);
    expect(TIER_LIMITS.trial.aiFollowUpsPerQuote).toBe(5);
    expect(TIER_LIMITS.trial.planUploadsPerMonth).toBe(3);
    expect(TIER_LIMITS.trial.planFollowUpsPerUpload).toBe(3);
  });

  it('free tier blocks AI after trial', () => {
    expect(TIER_LIMITS.free.aiQuotesPerMonth).toBe(0);
    expect(TIER_LIMITS.free.planUploadsPerMonth).toBe(0);
  });

  it('free tier has zero price', () => {
    expect(TIER_LIMITS.free.price).toBe(0);
  });

  it('professional tier has correct price', () => {
    expect(TIER_LIMITS.professional.price).toBe(79);
  });

  it('professional tier has capped limits', () => {
    expect(TIER_LIMITS.professional.aiQuotesPerMonth).toBe(25);
    expect(TIER_LIMITS.professional.aiFollowUpsPerQuote).toBe(8);
    expect(TIER_LIMITS.professional.planUploadsPerMonth).toBe(10);
    expect(TIER_LIMITS.professional.planFollowUpsPerUpload).toBe(5);
  });
});

describe('LABOUR_ROLES and DEFAULT_LABOUR_RATES', () => {
  it('every role has a matching default rate', () => {
    for (const role of Object.keys(LABOUR_ROLES)) {
      expect(DEFAULT_LABOUR_RATES).toHaveProperty(role);
      expect(typeof DEFAULT_LABOUR_RATES[role]).toBe('number');
      expect(DEFAULT_LABOUR_RATES[role]).toBeGreaterThan(0);
    }
  });

  it('every role has label, min, max, unit', () => {
    for (const [key, role] of Object.entries(LABOUR_ROLES)) {
      expect(role).toHaveProperty('label');
      expect(role).toHaveProperty('min');
      expect(role).toHaveProperty('max');
      expect(role).toHaveProperty('unit');
      expect(role.min).toBeLessThanOrEqual(role.max);
    }
  });

  it('default rate falls within min/max range', () => {
    for (const [role, config] of Object.entries(LABOUR_ROLES)) {
      const rate = DEFAULT_LABOUR_RATES[role];
      expect(rate).toBeGreaterThanOrEqual(config.min);
      expect(rate).toBeLessThanOrEqual(config.max);
    }
  });
});
