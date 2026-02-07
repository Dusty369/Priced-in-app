import { describe, it, expect } from 'vitest';
import { extractSearchSuggestions } from '../searchSuggestions';

describe('extractSearchSuggestions', () => {
  it('extracts dimensions', () => {
    const result = extractSearchSuggestions('140x45 H3.2 Bearer');
    expect(result).toContain('140 X 45');
  });

  it('extracts treatment grades', () => {
    const result = extractSearchSuggestions('140x45 H3.2 Bearer');
    expect(result.some(s => s.includes('H3'))).toBe(true);
  });

  it('prioritises hardware keywords over framing', () => {
    const result = extractSearchSuggestions('JOIST HANGER 140X45');
    expect(result).toContain('HANGER');
    // Should NOT add RADIATA since it's hardware
    expect(result).not.toContain('RADIATA');
  });

  it('adds RADIATA for framing timber', () => {
    const result = extractSearchSuggestions('140x45 H3.2 Bearer 4.8m');
    expect(result).toContain('RADIATA');
  });

  it('adds DECKING for deck boards but not deck screws', () => {
    const deckBoard = extractSearchSuggestions('100x25 H3.2 Decking');
    expect(deckBoard).toContain('DECKING');

    const deckScrew = extractSearchSuggestions('Deck screws SS316');
    expect(deckScrew).not.toContain('DECKING');
  });

  it('caps suggestions at 4', () => {
    // Input with many potential keywords
    const result = extractSearchSuggestions('140x45 H3.2 GIB Aqualine Galv Stainless Deck Post');
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('handles empty input', () => {
    const result = extractSearchSuggestions('');
    expect(Array.isArray(result)).toBe(true);
  });

  it('recognises stirrup and prevents POST keyword', () => {
    const result = extractSearchSuggestions('POST STIRRUP 100MM GALVANISED');
    expect(result).toContain('STIRRUP');
    expect(result).not.toContain('POST');
  });
});
