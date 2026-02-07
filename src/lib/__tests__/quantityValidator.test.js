import { describe, it, expect } from 'vitest';
import { validateMaterials, isStructuralJob, getRequiredTreatment } from '../quantityValidator';

describe('validateMaterials', () => {
  it('returns error for H4 in-ground structural use', () => {
    const materials = [{ name: '100x100 H4 Post' }];
    const errors = validateMaterials(materials, 'deck');
    expect(errors.some(e => e.error && /H4/i.test(e.message))).toBe(true);
  });

  it('returns error for undersized 90x45 deck joists', () => {
    const materials = [{ name: '90x45 H3.2 Framing Joist' }];
    const errors = validateMaterials(materials, 'deck');
    expect(errors.some(e => e.error && /UNDERSIZED/i.test(e.message))).toBe(true);
  });

  it('returns error for H1.2 used externally', () => {
    const materials = [{ name: '140x45 H1.2 Bearer' }];
    const errors = validateMaterials(materials, 'deck');
    expect(errors.some(e => e.error && /H1\.2/i.test(e.message))).toBe(true);
  });

  it('returns error for standard GIB in wet area', () => {
    const materials = [{ name: 'GIB Standard 10mm' }];
    const errors = validateMaterials(materials, 'bathroom');
    expect(errors.some(e => e.error && /STANDARD GIB/i.test(e.message))).toBe(true);
  });

  it('no error for Aqualine GIB in wet area', () => {
    const materials = [{ name: 'GIB Aqualine 10mm' }];
    const errors = validateMaterials(materials, 'bathroom');
    expect(errors.some(e => e.error && /STANDARD GIB/i.test(e.message))).toBe(false);
  });

  it('returns empty array for valid materials', () => {
    const materials = [{ name: '140x45 H3.2 Joist SG8' }];
    const errors = validateMaterials(materials, 'deck');
    expect(errors.filter(e => e.error)).toHaveLength(0);
  });

  it('returns empty array for null input', () => {
    expect(validateMaterials(null, 'deck')).toEqual([]);
    expect(validateMaterials([], 'deck')).toEqual([]);
  });
});

describe('isStructuralJob', () => {
  it('returns true for deck', () => {
    expect(isStructuralJob('deck')).toBe(true);
  });

  it('returns true for pergola', () => {
    expect(isStructuralJob('pergola')).toBe(true);
  });

  it('returns false for interior painting', () => {
    expect(isStructuralJob('interior painting')).toBe(false);
  });

  it('handles null/undefined', () => {
    expect(isStructuralJob(null)).toBe(false);
    expect(isStructuralJob(undefined)).toBe(false);
  });
});

describe('getRequiredTreatment', () => {
  it('returns H5 for in-ground piles', () => {
    expect(getRequiredTreatment('pile', true)).toBe('H5');
  });

  it('returns H3.2 for bearers', () => {
    expect(getRequiredTreatment('bearer')).toBe('H3.2');
  });

  it('returns H4 for fence posts', () => {
    expect(getRequiredTreatment('fence post')).toBe('H4');
  });

  it('returns H1.2 for interior framing', () => {
    expect(getRequiredTreatment('framing')).toBe('H1.2');
  });

  it('returns H1.2 as default', () => {
    expect(getRequiredTreatment('unknown')).toBe('H1.2');
  });
});
