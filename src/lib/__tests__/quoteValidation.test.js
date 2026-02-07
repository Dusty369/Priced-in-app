import { describe, it, expect } from 'vitest';
import { validateQuote, getValidationSummary } from '../quoteValidation';

describe('validateQuote', () => {
  it('returns error for empty quote', () => {
    const result = validateQuote({ cart: [], labourItems: [], materialsTotal: 0, labourTotal: 0, grandTotal: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('empty_quote');
  });

  it('returns error for zero quantity items', () => {
    const result = validateQuote({
      cart: [{ name: 'Timber', qty: 0, price: 10 }],
      labourItems: [{ role: 'builder', hours: 8 }],
      materialsTotal: 0,
      labourTotal: 800,
      grandTotal: 920,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'zero_qty')).toBe(true);
  });

  it('returns error for framing without labour', () => {
    const result = validateQuote({
      cart: [{ name: '90x45 Framing Timber', qty: 10, price: 15 }],
      labourItems: [],
      materialsTotal: 150,
      labourTotal: 0,
      grandTotal: 150,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'missing_labour')).toBe(true);
  });

  it('warns on suspiciously low total', () => {
    const result = validateQuote({
      cart: [{ name: 'Nails', qty: 1, price: 10 }],
      labourItems: [{ role: 'builder', hours: 1 }],
      materialsTotal: 10,
      labourTotal: 95,
      grandTotal: 120,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.type === 'low_total')).toBe(true);
  });

  it('warns on high total for few items', () => {
    const result = validateQuote({
      cart: [{ name: 'Steel beam', qty: 100, price: 600 }],
      labourItems: [{ role: 'builder', hours: 8 }],
      materialsTotal: 60000,
      labourTotal: 800,
      grandTotal: 70000,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.type === 'high_total')).toBe(true);
  });

  it('warns when timber has no fixings', () => {
    const result = validateQuote({
      cart: [
        { name: '140x45 Joist H3.2', qty: 10, price: 30 },
      ],
      labourItems: [{ role: 'builder', hours: 8 }],
      materialsTotal: 300,
      labourTotal: 800,
      grandTotal: 1265,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.type === 'missing_fixings')).toBe(true);
  });

  it('passes clean quote with no errors or warnings', () => {
    const result = validateQuote({
      cart: [
        { name: '140x45 Joist H3.2', qty: 10, price: 30 },
        { name: 'Deck screws 10g', qty: 2, price: 45 },
      ],
      labourItems: [{ role: 'builder', hours: 16 }],
      materialsTotal: 390,
      labourTotal: 1520,
      grandTotal: 2200,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('getValidationSummary', () => {
  it('returns ok for valid quote with no warnings', () => {
    const summary = getValidationSummary({ valid: true, errors: [], warnings: [] });
    expect(summary.status).toBe('ok');
  });

  it('returns error status for invalid quote', () => {
    const summary = getValidationSummary({
      valid: false,
      errors: [{ type: 'empty_quote', message: 'Quote is empty' }],
      warnings: [],
    });
    expect(summary.status).toBe('error');
  });

  it('returns warning status for valid quote with warnings', () => {
    const summary = getValidationSummary({
      valid: true,
      errors: [],
      warnings: [{ type: 'low_total', message: 'Total seems low' }],
    });
    expect(summary.status).toBe('warning');
  });
});
