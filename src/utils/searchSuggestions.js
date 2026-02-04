/**
 * Search Suggestions Utility
 * Extracts useful search terms from AI-suggested material names
 * that didn't match in the database.
 *
 * Based on actual NZ materials database patterns like:
 * - "140 X 45 RADIATA SG8 H3.2 KD 4.8M" (framing)
 * - "PINE WET PREMIUM DECKING 100X025 H3.2" (decking)
 * - "L/LOK 190 X 52MM JOIST HANGER" (hardware)
 */

export function extractSearchSuggestions(name, aiSearchTerm) {
  const suggestions = new Set();
  const combined = `${name} ${aiSearchTerm || ''}`.toUpperCase();

  // Add dimension patterns (preserve spaces: "140 X 45" or "2400 X 1200")
  const dimMatch = combined.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})/);
  if (dimMatch) {
    suggestions.add(`${dimMatch[1]} X ${dimMatch[2]}`);
  }

  // Add treatment grades (H1.2, H3.2, H4, H5)
  const treatmentMatch = combined.match(/H[1-5]\.?\d?/i);
  if (treatmentMatch) {
    suggestions.add(treatmentMatch[0].toUpperCase());
  }

  // Hardware/fixings (check BEFORE framing timber to avoid false positives)
  if (/HANGER/i.test(combined)) {
    suggestions.add('HANGER');
  } else if (/STIRRUP/i.test(combined)) {
    suggestions.add('STIRRUP');
  } else if (/BRACKET/i.test(combined)) {
    suggestions.add('BRACKET');
  } else if (/SCREW/i.test(combined)) {
    suggestions.add('SCREW');
  } else if (/NAIL/i.test(combined)) {
    suggestions.add('NAIL');
  }

  // Framing timber - BEARER/JOIST aren't in product names, use RADIATA
  // Only add if not already identified as hardware
  if (/BEARER|JOIST|FRAMING|STUD|RAFTER/i.test(combined) && !suggestions.has('HANGER')) {
    suggestions.add('RADIATA');
  }

  // Decking (but not deck screws)
  if (/DECK/i.test(combined) && !suggestions.has('SCREW')) {
    suggestions.add('DECKING');
  }

  // Posts (but not post stirrups)
  if (/POST/i.test(combined) && !suggestions.has('STIRRUP')) {
    suggestions.add('POST');
  }

  // Materials and finishes
  if (/GALV/i.test(combined)) suggestions.add('GALV');
  if (/SS316|STAINLESS/i.test(combined)) suggestions.add('STAINLESS');
  if (/GIB/i.test(combined)) suggestions.add('GIB');
  if (/AQUALINE/i.test(combined)) suggestions.add('AQUALINE');
  if (/FYRELINE/i.test(combined)) suggestions.add('FYRELINE');
  if (/KWILA/i.test(combined)) suggestions.add('KWILA');
  if (/VITEX/i.test(combined)) suggestions.add('VITEX');

  return Array.from(suggestions).slice(0, 4);
}

export default extractSearchSuggestions;
