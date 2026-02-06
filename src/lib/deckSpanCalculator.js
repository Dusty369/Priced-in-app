// NZS 3604 simplified span tables for SG8 Radiata Pine
export function calculateDeckMembers(params) {
  const { length, width, postSpacing = 1.8, height, deckingThickness = 32 } = params;

  const joistSpan = width; // Joists typically span the width
  const bearerSpan = postSpacing;

  // Bearer sizing (SG8, 450mm joist spacing)
  let bearerSize;
  let doubleBearer = false;

  if (bearerSpan <= 1.8) bearerSize = "140x45";
  else if (bearerSpan <= 2.4) bearerSize = "140x45";
  else if (bearerSpan <= 3.0) {
    bearerSize = "190x45";
  } else {
    bearerSize = "190x45";
    doubleBearer = true;
  }

  // Joist sizing (450mm spacing for 32mm decking)
  let joistSize;
  let joistSpacing = 450;

  if (deckingThickness < 32) {
    joistSpacing = 400; // Closer spacing for thinner boards
  }

  if (joistSpan <= 2.4) joistSize = "140x45";
  else if (joistSpan <= 3.6) joistSize = "190x45";
  else if (joistSpan <= 4.8) joistSize = "240x45";
  else if (joistSpan <= 5.4) joistSize = "290x45";
  else joistSize = "LVL or engineered beam required";

  // Post sizing
  let postSize;
  if (height <= 900) postSize = "100x100";
  else if (height <= 1800) postSize = "125x125";
  else postSize = "150x150 or engineer required";

  // Foundation type
  let foundationType;
  if (height < 600) {
    foundationType = "Nuralock adjustable jacks or H5 posts in concrete";
  } else {
    foundationType = "H5 posts in concrete (600mm min embedment)";
  }

  // Warnings & compliance
  const warnings = [];
  const compliance = [];

  if (joistSpan > 5.4) {
    warnings.push("Joist span exceeds NZS 3604 tables - structural engineer required");
  }

  if (bearerSpan > 3.6) {
    warnings.push("Bearer span large - consider closer post spacing or engineered beams");
  }

  if (height > 1000) {
    compliance.push("Handrail required (>1m height)");
    compliance.push("Balustrade required (100mm max gap between rails)");
  }

  if (height > 1000 || (length * width) > 30) {
    compliance.push("Building consent likely required");
  } else {
    compliance.push("May qualify for Exemption 39 (<30m\u00B2, <1m high)");
  }

  if (doubleBearer) {
    compliance.push("Double bearers must be nailed together with 90mm nails at 600mm centres staggered");
  }

  compliance.push("DPC tape under all bearers required");
  compliance.push("All H5 posts must have 600mm min embedment in concrete");

  return {
    bearerSize,
    doubleBearer,
    joistSize,
    joistSpacing,
    postSize,
    foundationType,
    warnings,
    compliance,
    calculations: {
      joistSpan: `${joistSpan}m span requires ${joistSize}`,
      bearerSpan: `${bearerSpan}m span requires ${bearerSize}${doubleBearer ? ' (doubled)' : ''}`,
      postHeight: `${height}mm height requires ${postSize} posts`
    }
  };
}
