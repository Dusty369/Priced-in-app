/**
 * Quote validation utilities
 * Validates quotes before PDF generation to catch common errors
 */

/**
 * Validate a quote and return warnings/errors
 * @param {Object} quote - Quote data
 * @param {Array} quote.cart - Cart items
 * @param {Array} quote.labourItems - Labour items
 * @param {number} quote.materialsTotal - Materials subtotal
 * @param {number} quote.labourTotal - Labour subtotal
 * @param {number} quote.grandTotal - Grand total including GST
 * @returns {Object} - { valid: boolean, errors: [], warnings: [] }
 */
export function validateQuote({ cart, labourItems, materialsTotal, labourTotal, grandTotal }) {
  const errors = [];
  const warnings = [];

  // === BLOCKING ERRORS (prevent PDF) ===

  // Empty quote
  if ((!cart || cart.length === 0) && (!labourItems || labourItems.length === 0)) {
    errors.push({
      type: 'empty_quote',
      message: 'Quote is empty - add materials or labour before generating PDF'
    });
  }

  // Zero quantity items
  const zeroQtyItems = cart?.filter(item => !item.qty || item.qty <= 0) || [];
  if (zeroQtyItems.length > 0) {
    errors.push({
      type: 'zero_qty',
      message: `${zeroQtyItems.length} item(s) have zero quantity`,
      items: zeroQtyItems.map(i => i.name)
    });
  }

  // Labour job with no labour
  const hasTimberOrFraming = cart?.some(item =>
    /framing|timber|joist|bearer|stud|rafter/i.test(item.name || item.category)
  );
  if (hasTimberOrFraming && (!labourItems || labourItems.length === 0)) {
    errors.push({
      type: 'missing_labour',
      message: 'Quote has framing materials but no labour - add builder hours'
    });
  }

  // === WARNINGS (allow PDF but show alert) ===

  // Suspiciously low total
  if (grandTotal > 0 && grandTotal < 500) {
    warnings.push({
      type: 'low_total',
      message: `Total $${grandTotal.toFixed(0)} seems low - verify quantities`
    });
  }

  // Suspiciously high total for small job
  if (cart?.length < 10 && grandTotal > 50000) {
    warnings.push({
      type: 'high_total',
      message: `Total $${grandTotal.toFixed(0)} seems high for ${cart.length} items - verify quantities`
    });
  }

  // High quantity items (potential unit confusion)
  const highQtyItems = cart?.filter(item => {
    const name = (item.name || '').toLowerCase();
    // Screws/nails >20 boxes is suspicious
    if (/screw|nail|staple/i.test(name) && item.qty > 20) return true;
    // Paint/stain >10 tins is suspicious
    if (/paint|stain|finish/i.test(name) && item.qty > 10) return true;
    // Concrete >100 bags is suspicious for small job
    if (/concrete|cement/i.test(name) && item.qty > 100) return true;
    return false;
  }) || [];

  if (highQtyItems.length > 0) {
    warnings.push({
      type: 'high_qty',
      message: `${highQtyItems.length} item(s) have unusually high quantities`,
      items: highQtyItems.map(i => `${i.name}: ${i.qty}`)
    });
  }

  // High value line items
  const highValueItems = cart?.filter(item => {
    const lineTotal = (item.price || 0) * (item.qty || 0);
    return lineTotal > 5000;
  }) || [];

  if (highValueItems.length > 0) {
    warnings.push({
      type: 'high_value_line',
      message: `${highValueItems.length} line item(s) exceed $5,000`,
      items: highValueItems.map(i => `${i.name}: $${((i.price || 0) * (i.qty || 0)).toFixed(0)}`)
    });
  }

  // Missing common materials for category
  const hasDecking = cart?.some(item => /decking/i.test(item.name));
  const hasFraming = cart?.some(item => /joist|bearer/i.test(item.name));
  const hasScrews = cart?.some(item => /screw|nail/i.test(item.name));

  if ((hasDecking || hasFraming) && !hasScrews) {
    warnings.push({
      type: 'missing_fixings',
      message: 'Quote has timber but no screws/nails - add fixings'
    });
  }

  // Stale prices (>6 months old)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const stalePriceItems = cart?.filter(item => {
    if (!item.priceUpdated) return false;
    return new Date(item.priceUpdated) < sixMonthsAgo;
  }) || [];

  if (stalePriceItems.length > 0) {
    warnings.push({
      type: 'stale_prices',
      message: `${stalePriceItems.length} item(s) have prices >6 months old`,
      items: stalePriceItems.slice(0, 5).map(i => i.name)
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canGeneratePDF: errors.length === 0
  };
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(validation) {
  if (validation.valid && validation.warnings.length === 0) {
    return { status: 'ok', message: 'Quote ready for PDF' };
  }

  if (!validation.valid) {
    return {
      status: 'error',
      message: validation.errors[0]?.message || 'Quote has errors'
    };
  }

  return {
    status: 'warning',
    message: `${validation.warnings.length} warning(s) - review before generating PDF`
  };
}

export default validateQuote;
