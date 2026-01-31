# Phase 1 Fixes & Enhancements

Priority order for implementation. Each marked with time estimate and difficulty.

---

## 🔴 CRITICAL - PDF Export Implementation
**Time:** 1-2 hours | **Difficulty:** Medium | **Impact:** HIGH

### Current State
- Only exports CSV to Xero
- jsPDF is installed but not used
- Users can't download native PDF quotes

### Solution
Implement native PDF generation using jsPDF + autoTable

### Code to Add

Replace the `exportToXero()` function in `page.js` with this enhanced version that supports both CSV and PDF:

```javascript
// Generate PDF quote
const generatePdfQuote = () => {
  setPdfGenerating(true);
  
  try {
    const jsPDF = window.jspdf?.jsPDF;
    const autoTable = window.autoTable?.default;
    
    if (!jsPDF || !autoTable) {
      alert('PDF library not loaded. Try refreshing the page.');
      setPdfGenerating(false);
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Company Header
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(companyInfo.name || 'Your Company', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (companyInfo.phone) doc.text(`Phone: ${companyInfo.phone}`, 20, yPosition);
    yPosition += 4;
    if (companyInfo.email) doc.text(`Email: ${companyInfo.email}`, 20, yPosition);
    yPosition += 4;
    if (companyInfo.address) doc.text(`Address: ${companyInfo.address}`, 20, yPosition);
    yPosition += 6;

    // Quote Title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTE', 20, yPosition);
    yPosition += 8;

    // Quote Info
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Project: ${currentProjectName || 'Untitled Project'}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date().toLocaleDateString('en-NZ')}`, 20, yPosition);
    if (projectNotes) {
      yPosition += 5;
      doc.text(`Notes: ${projectNotes.substring(0, 50)}...`, 20, yPosition);
    }
    yPosition += 10;

    // Materials Table
    if (cart.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text('MATERIALS', 20, yPosition);
      yPosition += 6;

      const materialTableData = cart.map(item => [
        item.name.substring(0, 40),
        item.qty.toString(),
        item.unit,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.qty).toFixed(2)}`
      ]);

      doc.autoTable({
        head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
        body: materialTableData,
        startY: yPosition,
        margin: { left: 20, right: 20 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 8;
    }

    // Labour Table
    if (labourItems.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text('LABOUR', 20, yPosition);
      yPosition += 6;

      const labourTableData = labourItems.map(item => [
        item.description,
        item.role.charAt(0).toUpperCase() + item.role.slice(1),
        item.hours.toString(),
        `$${labourRates[item.role].toFixed(2)}`,
        `$${(item.hours * labourRates[item.role]).toFixed(2)}`
      ]);

      doc.autoTable({
        head: [['Description', 'Role', 'Hours', 'Rate/hr', 'Total']],
        body: labourTableData,
        startY: yPosition,
        margin: { left: 20, right: 20 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 8;
    }

    // Totals Section
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    const materialTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const labourTotal = labourItems.reduce((sum, item) => sum + item.hours * labourRates[item.role], 0);
    const subtotal = materialTotal + labourTotal;
    const withWastage = subtotal * (1 + wastage / 100);
    const withMargin = withWastage * (1 + margin / 100);
    const gstAmount = withMargin * 0.15;
    const total = withMargin + gstAmount;

    yPosition += 5;
    doc.text(`Subtotal:`, 130, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${subtotal.toFixed(2)}`, 180, yPosition);

    yPosition += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(`Wastage (${wastage}%):`, 130, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${(withWastage - subtotal).toFixed(2)}`, 180, yPosition);

    yPosition += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(`Markup (${margin}%):`, 130, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${(withMargin - withWastage).toFixed(2)}`, 180, yPosition);

    yPosition += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(`GST (15%):`, 130, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${gstAmount.toFixed(2)}`, 180, yPosition);

    yPosition += 7;
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text(`TOTAL:`, 130, yPosition);
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(`$${total.toFixed(2)}`, 180, yPosition);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'This quote is valid for 30 days. Terms & conditions apply. Prices exclude variation in material costs.',
      20,
      pageHeight - 15
    );
    doc.text(
      `Generated by Priced-In | ${new Date().toLocaleDateString('en-NZ')} ${new Date().toLocaleTimeString('en-NZ')}`,
      20,
      pageHeight - 10
    );

    // Download PDF
    const filename = `Quote_${currentProjectName?.replace(/\s+/g, '_') || 'Untitled'}_${Date.now()}.pdf`;
    doc.save(filename);

    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: `✅ PDF downloaded as "${filename}"`
    }]);
  } catch (error) {
    console.error('PDF generation error:', error);
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: `❌ PDF generation failed: ${error.message}`
    }]);
  }
  
  setPdfGenerating(false);
};
```

### Changes to UI

Update the quote page buttons to include PDF download:

```jsx
{page === 'quote' && (
  <div className="flex gap-3">
    <button
      onClick={generatePdfQuote}
      disabled={pdfGenerating || cart.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
    >
      {pdfGenerating ? 'Generating PDF...' : '📄 Download PDF'}
    </button>
    <button
      onClick={exportToXero}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      📊 Export to Xero
    </button>
  </div>
)}
```

### Test Steps
1. Add some materials to cart
2. Click "Download PDF" button
3. PDF should download with:
   - Company header
   - Project name & date
   - Materials table
   - Labour table (if any)
   - Calculation breakdown
   - Total quote

---

## 🟡 MEDIUM - Labour Item Presets
**Time:** 30 mins | **Difficulty:** Easy | **Impact:** MEDIUM

### Current State
Building labour items requires typing description each time

### Solution
Add quick presets for common labour types

### Code to Add

Add this to your labour items section (around line 1400):

```javascript
const LABOUR_PRESETS = [
  { role: 'builder', hours: 8, description: 'Framing & assembly' },
  { role: 'builder', hours: 4, description: 'Decking installation' },
  { role: 'builder', hours: 6, description: 'Roof installation' },
  { role: 'builder', hours: 3, description: 'Painting/staining' },
  { role: 'labourer', hours: 4, description: 'Material handling & cleanup' },
  { role: 'labourer', hours: 8, description: 'Excavation & site prep' },
  { role: 'apprentice', hours: 8, description: 'General site assistant' },
];
```

Add this button in the Labour section:

```jsx
<div className="flex gap-2 flex-wrap">
  {LABOUR_PRESETS.map((preset, idx) => (
    <button
      key={idx}
      onClick={() => addLabourItem(preset)}
      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
    >
      + {preset.role}: {preset.description} ({preset.hours}h)
    </button>
  ))}
</div>
```

---

## 🟡 MEDIUM - Material Search Performance
**Time:** 1-2 hours | **Difficulty:** Medium | **Impact:** MEDIUM

### Current State
Loads all 5,600 materials into memory

### Solution
Implement lazy-loading/pagination

### Code Changes

Replace the material filtering with pagination:

```javascript
const [materialPage, setMaterialPage] = useState(0);
const ITEMS_PER_PAGE = 50;

// Filter materials
const filteredAll = materials.filter(m => {
  const matchesCategory = category === 'All' || m.category === category;
  const matchesSupplier = supplier === 'All' || m.supplier === supplier;
  const matchesSearch = !search || 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSupplier && matchesSearch;
});

const filtered = filteredAll.slice(
  materialPage * ITEMS_PER_PAGE,
  (materialPage + 1) * ITEMS_PER_PAGE
);
```

Add pagination buttons below material list:

```jsx
{filteredAll.length > ITEMS_PER_PAGE && (
  <div className="flex gap-2 justify-center mt-4">
    <button
      onClick={() => setMaterialPage(Math.max(0, materialPage - 1))}
      disabled={materialPage === 0}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      ← Previous
    </button>
    <span className="px-3 py-1">
      Page {materialPage + 1} of {Math.ceil(filteredAll.length / ITEMS_PER_PAGE)}
    </span>
    <button
      onClick={() => setMaterialPage(materialPage + 1)}
      disabled={(materialPage + 1) * ITEMS_PER_PAGE >= filteredAll.length}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next →
    </button>
  </div>
)}
```

---

## 🟢 LOW - Reset Settings to Defaults
**Time:** 15 mins | **Difficulty:** Easy | **Impact:** LOW

### Code to Add

Add button in settings panel:

```javascript
const resetToDefaults = () => {
  if (confirm('Reset all settings to defaults?')) {
    setLabourRates(DEFAULT_LABOUR_RATES);
    setCompanyInfo(DEFAULT_COMPANY_INFO);
    setWastage(10);
    setMargin(20);
    localStorage.removeItem(LABOUR_RATES_KEY);
    localStorage.removeItem(COMPANY_INFO_KEY);
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: '✅ Settings reset to defaults'
    }]);
  }
};
```

Add button in settings UI:

```jsx
<button
  onClick={resetToDefaults}
  className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
>
  Reset to Defaults
</button>
```

---

## 🟢 LOW - Currency Formatting Helper
**Time:** 20 mins | **Difficulty:** Easy | **Impact:** LOW

### Code to Add

Add helper function at top of file:

```javascript
const formatNZD = (amount) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2
  }).format(amount);
};
```

Use in rendering:

```jsx
<span>{formatNZD(item.price * item.qty)}</span>
// Instead of: <span>${(item.price * item.qty).toFixed(2)}</span>
```

---

## 🔵 REFACTORING - Component Extraction (Optional)
**Time:** 4-5 hours | **Difficulty:** Hard | **Impact:** Maintenance

### Current State
page.js is 1,920 lines - hard to maintain

### Solution
Split into components:

```
components/
├── QuoteBuilder.jsx (quote calculation logic)
├── ProjectManager.jsx (save/load projects)
├── LabourCostWidget.jsx (labour items)
├── MaterialsList.jsx (search & add materials)
├── AIChat.jsx (chat interface)
├── PlanUploader.jsx (plan analysis)
└── Settings.jsx (company/labour rates)
```

### Order of Priority

1. **PDF Export** ← DO THIS FIRST (critical)
2. Labour presets (quick win)
3. Performance optimization (needed for scale)
4. Reset defaults (nice to have)
5. Currency formatting (polish)
6. Refactoring (technical debt - lower priority)

---

## Testing Checklist for Each Fix

### PDF Export
- [ ] Downloads PDF when clicked
- [ ] Filename includes project name
- [ ] Company info shows in header
- [ ] Materials table displays correctly
- [ ] Labour table displays (if items present)
- [ ] Totals calculation matches quote page
- [ ] GST shows 15%
- [ ] Renders on different browsers

### Labour Presets
- [ ] Each preset button works
- [ ] Adds item with correct hours
- [ ] Correct role assigned
- [ ] Hours calculated correctly

### Material Pagination
- [ ] Shows correct number per page (50)
- [ ] Page counter accurate
- [ ] Previous/Next buttons work
- [ ] Performance improved on load

### Other Fixes
- [ ] Settings reset properly
- [ ] Currency formats correctly
- [ ] No console errors

---

## Quick Implementation Guide

### Step 1: PDF Export
1. Copy the `generatePdfQuote()` function into page.js
2. Add the PDF button to quote section
3. Test download

### Step 2: Labour Presets
1. Add LABOUR_PRESETS constant
2. Add preset button grid
3. Test adding items

### Step 3: Everything Else
Follow similar pattern - add code, test, verify

---

## Resources

- **jsPDF Docs:** https://github.com/parallax/jsPDF
- **autoTable Plugin:** https://github.com/simonbengtsson/jsPDF-AutoTable
- **Next.js Best Practices:** https://nextjs.org/docs

---

**All fixes are backward compatible and don't break existing features.**
