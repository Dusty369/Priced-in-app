import { DEFAULT_LABOUR_RATES, LABOUR_ROLES, formatNZD } from './constants';

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [16, 185, 129]; // Default emerald-600
}

/**
 * Generate a PDF quote document
 * @param {Object} options
 * @param {Array} options.cart - Cart items
 * @param {Array} options.labourItems - Labour line items
 * @param {Object} options.labourRates - Hourly rates by role
 * @param {Object} options.companyInfo - Company details
 * @param {string} options.projectName - Project name
 * @param {string} options.projectNotes - Notes to include
 * @param {number} options.wastage - Wastage percentage
 * @param {number} options.margin - Margin percentage
 * @param {boolean} options.gst - Include GST
 * @param {boolean} options.watermark - Add watermark (for free tier)
 */
export async function generateQuotePDF({
  cart,
  labourItems,
  labourRates,
  companyInfo,
  projectName,
  projectNotes,
  wastage,
  margin,
  gst,
  watermark = false
}) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const leftMargin = 14;
  const rightMargin = 14;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let yPos = 20;

  // Get brand color from company info or use default
  const brandColor = hexToRgb(companyInfo.primaryColor || '#10b981');
  const quoteValidity = companyInfo.quoteValidity || 30;

  // Helper to format currency
  const formatCurrency = (amount) => `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Logo (if exists)
  if (companyInfo.logo) {
    try {
      doc.addImage(companyInfo.logo, 'AUTO', leftMargin, yPos - 5, 40, 20, undefined, 'FAST');
      yPos += 18;
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
    }
  }

  // Company header (left side)
  doc.setFontSize(18);
  doc.setTextColor(...brandColor);
  doc.setFont(undefined, 'bold');
  doc.text(companyInfo.name || 'Quote', leftMargin, yPos);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let contactY = yPos + 6;
  if (companyInfo.phone) { doc.text(companyInfo.phone, leftMargin, contactY); contactY += 4; }
  if (companyInfo.email) { doc.text(companyInfo.email, leftMargin, contactY); contactY += 4; }
  if (companyInfo.address) { doc.text(companyInfo.address, leftMargin, contactY); contactY += 4; }

  // Quote details (right side)
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Quote Date: ${new Date().toLocaleDateString('en-NZ')}`, pageWidth - rightMargin, yPos, { align: 'right' });
  doc.text(`Quote #: ${Date.now().toString().slice(-6)}`, pageWidth - rightMargin, yPos + 5, { align: 'right' });

  yPos = Math.max(contactY, yPos + 15) + 8;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
  yPos += 10;

  // Project name
  if (projectName) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(`Project: ${projectName}`, leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 10;
  }

  // Materials table
  if (cart.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(...brandColor);
    doc.setFont(undefined, 'bold');
    doc.text('MATERIALS', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 2;

    const materialsData = cart.map(item => {
      const row = [
        item.name.length > 55 ? item.name.substring(0, 52) + '...' : item.name,
        item.qty.toString(),
        item.unit || 'EA',
        formatCurrency(item.price),
        formatCurrency(item.price * item.qty)
      ];
      return row;
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: materialsData,
      theme: 'striped',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [60, 60, 60],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.45 },
        1: { cellWidth: contentWidth * 0.08, halign: 'center' },
        2: { cellWidth: contentWidth * 0.10, halign: 'center' },
        3: { cellWidth: contentWidth * 0.17, halign: 'right' },
        4: { cellWidth: contentWidth * 0.20, halign: 'right' }
      },
      margin: { left: leftMargin, right: rightMargin },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      didDrawCell: (data) => {
        // Add item notes as sub-row if exists
        if (data.section === 'body' && data.column.index === 0) {
          const item = cart[data.row.index];
          if (item?.itemNote) {
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'italic');
            doc.text(`Note: ${item.itemNote}`, data.cell.x + 2, data.cell.y + data.cell.height - 1);
            doc.setFont(undefined, 'normal');
          }
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // Labour table
  if (labourItems.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(...brandColor);
    doc.setFont(undefined, 'bold');
    doc.text('LABOUR', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 2;

    const labourData = labourItems.map(item => {
      const rate = labourRates[item.role] || DEFAULT_LABOUR_RATES[item.role] || 0;
      const roleLabel = LABOUR_ROLES[item.role]?.label || item.role.charAt(0).toUpperCase() + item.role.slice(1);
      return [
        item.description || roleLabel,
        roleLabel,
        `${item.hours}h`,
        `${formatCurrency(rate)}/h`,
        formatCurrency(item.hours * rate)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Role', 'Hours', 'Rate', 'Total']],
      body: labourData,
      theme: 'striped',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [60, 60, 60],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.35 },
        1: { cellWidth: contentWidth * 0.20 },
        2: { cellWidth: contentWidth * 0.12, halign: 'center' },
        3: { cellWidth: contentWidth * 0.15, halign: 'right' },
        4: { cellWidth: contentWidth * 0.18, halign: 'right' }
      },
      margin: { left: leftMargin, right: rightMargin },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // Calculate totals - apply wastage to materials, margin to both, hide breakdown from client
  const materialTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const labourTotal = labourItems.reduce((sum, item) => {
    const rate = labourRates[item.role] || DEFAULT_LABOUR_RATES[item.role] || 0;
    return sum + item.hours * rate;
  }, 0);

  // Materials: apply wastage then margin
  const materialsWithMarkup = materialTotal * (1 + wastage / 100) * (1 + margin / 100);
  // Labour: apply margin only (no wastage on labour)
  const labourWithMarkup = labourTotal * (1 + margin / 100);
  // Subtotal is the sum of marked-up values
  const subtotal = materialsWithMarkup + labourWithMarkup;
  const gstAmount = gst ? subtotal * 0.15 : 0;
  const total = subtotal + gstAmount;

  // Check if we need a new page for totals
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = 20;
  }

  // Totals section - right aligned box
  const totalsX = pageWidth - rightMargin - 75;
  const totalsWidth = 75;
  yPos += 5;

  // Build totals rows - hide wastage/margin breakdown from client
  const totalsRows = [];
  if (cart.length > 0) totalsRows.push(['Materials:', formatCurrency(materialsWithMarkup)]);
  if (labourItems.length > 0) totalsRows.push(['Labour:', formatCurrency(labourWithMarkup)]);
  totalsRows.push(['Subtotal:', formatCurrency(subtotal)]);
  if (gst) totalsRows.push(['GST (15%):', formatCurrency(gstAmount)]);

  autoTable(doc, {
    startY: yPos,
    body: totalsRows,
    theme: 'plain',
    bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'normal' },
      1: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: totalsX },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0
  });

  yPos = doc.lastAutoTable.finalY + 2;

  // Grand total with emphasis
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPos, totalsX + totalsWidth, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setTextColor(...brandColor);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(formatCurrency(total), totalsX + totalsWidth, yPos, { align: 'right' });
  doc.setFont(undefined, 'normal');

  yPos += 15;

  // Payment terms (if exists)
  if (companyInfo.paymentTerms) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(...brandColor);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Terms:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const splitPayment = doc.splitTextToSize(companyInfo.paymentTerms, contentWidth);
    doc.text(splitPayment, leftMargin, yPos);
    yPos += splitPayment.length * 4 + 8;
  }

  // Notes section
  if (projectNotes) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(projectNotes, contentWidth);
    doc.text(splitNotes, leftMargin, yPos);
    yPos += splitNotes.length * 4 + 8;
  }

  // Terms & Conditions (if exists)
  if (companyInfo.termsAndConditions) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const splitTerms = doc.splitTextToSize(companyInfo.termsAndConditions, contentWidth);
    doc.text(splitTerms, leftMargin, yPos);
  }

  // Footer on each page (and watermark if free tier)
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Add watermark for free tier
    if (watermark) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.setFontSize(50);
      doc.setTextColor(100, 100, 100);
      // Rotate and draw diagonal watermark
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      doc.text('Created with Priced In', centerX, centerY - 20, {
        align: 'center',
        angle: 45
      });
      doc.setFontSize(24);
      doc.text('Upgrade at pricedin.co.nz', centerX, centerY + 20, {
        align: 'center',
        angle: 45
      });
      doc.restoreGraphicsState();
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Priced In - Building Estimator', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Quote valid for ${quoteValidity} days from ${new Date().toLocaleDateString('en-NZ')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    if (pageCount > 1) {
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - rightMargin, pageHeight - 8, { align: 'right' });
    }
  }

  const fileName = projectName
    ? `Quote_${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
    : `Quote_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(fileName);
}

export default generateQuotePDF;
