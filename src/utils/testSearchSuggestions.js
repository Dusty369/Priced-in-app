function extractSearchSuggestions(name, aiSearchTerm) {
  const suggestions = new Set();
  const combined = `${name} ${aiSearchTerm || ''}`.toUpperCase();

  // Add dimension patterns (preserve spaces: "140 X 45" or "2400 X 1200")
  const dimMatch = combined.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})/);
  if (dimMatch) {
    suggestions.add(`${dimMatch[1]} X ${dimMatch[2]}`);
  }

  // Add treatment grades
  const treatmentMatch = combined.match(/H[1-5]\.?\d?/i);
  if (treatmentMatch) {
    suggestions.add(treatmentMatch[0].toUpperCase());
  }

  // Hardware/fixings (check BEFORE framing timber)
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

  // Framing timber (only if not hardware)
  if (/BEARER|JOIST|FRAMING|STUD|RAFTER/i.test(combined) && !suggestions.has('HANGER')) {
    suggestions.add('RADIATA');
  }

  // Decking
  if (/DECK/i.test(combined) && !suggestions.has('SCREW')) {
    suggestions.add('DECKING');
  }

  // Posts
  if (/POST/i.test(combined) && !suggestions.has('STIRRUP')) {
    suggestions.add('POST');
  }

  // Materials
  if (/GALV/i.test(combined)) suggestions.add('GALV');
  if (/SS316|STAINLESS/i.test(combined)) suggestions.add('STAINLESS');
  if (/GIB/i.test(combined)) suggestions.add('GIB');
  if (/AQUALINE/i.test(combined)) suggestions.add('AQUALINE');

  return Array.from(suggestions).slice(0, 4).join(' ');
}

// Test cases
const tests = [
  '140×45 H3.2 Bearer 4.8m',
  '140×32 H3.2 Decking',
  'POST STIRRUP 100MM GALVANISED',
  '100X100 H3.2 SG8 POST',
  'JOIST HANGER 140X45',
  'Deck screws SS316',
  'GIB Aqualine 2400x1200',
  '90×45 H1.2 Studs'
];

console.log('Search Suggestion Tests:\n');
tests.forEach(test => {
  const result = extractSearchSuggestions(test);
  console.log(`"${test}"`);
  console.log(`  → [${result}]\n`);
});
