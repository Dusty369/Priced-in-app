'use client';

import QuotePage from '../components/QuotePage';
import Dashboard from '../components/Dashboard';
import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { Plus, Minus, Trash2, Save, FolderOpen, FileText, Settings, Download, Building2 } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories, getSuppliers, getAllMaterials } from '../lib/materialsLoader';
import Header from '../components/Header';
import AIAssistant from '../components/AIAssistant';
import { extractSearchSuggestions } from '../utils/searchSuggestions';

// Lazy load heavy components
const MaterialsPage = lazy(() => import('../components/MaterialsPage'));
const PlansUpload = lazy(() => import('../components/PlansUpload'));
const SaveProjectDialog = lazy(() => import('../components/SaveProjectDialog'));
const LabourSettingsDialog = lazy(() => import('../components/LabourSettingsDialog'));
const PriceComparisonModal = lazy(() => import('../components/PriceComparisonModal'));
const CompanySettingsDialog = lazy(() => import('../components/CompanySettingsDialog'));
const AddMaterialModal = lazy(() => import('../components/AddMaterialModal'));
import { 
  DEFAULT_LABOUR_RATES, 
  LABOUR_ROLES, 
  DEFAULT_COMPANY_INFO,
  LABOUR_PRESETS,
  PROJECTS_KEY,
  CURRENT_PROJECT_KEY,
  LABOUR_RATES_KEY,
  COMPANY_INFO_KEY
} from '../lib/constants';


const allMaterials = getAllMaterials();

export default function PricedInApp() {
  // Hydration guard
  const [hydrated, setHydrated] = useState(false);

  // Page state
  const [page, setPage] = useState('projects');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAI, setShowAI] = useState(true);

  // Cart & materials state
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState(''); // For AI suggestion -> Materials nav
  const [category, setCategory] = useState('All');
  const [supplier, setSupplier] = useState('All');
  const [wastage, setWastage] = useState(10);
  const [gst, setGst] = useState(true);
  const [margin, setMargin] = useState(20);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Labour state
  const [labourRates, setLabourRates] = useState(DEFAULT_LABOUR_RATES);
  const [labourItems, setLabourItems] = useState([]);
  const [showLabourSettings, setShowLabourSettings] = useState(false);

  // Project state
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveProjectName, setSaveProjectName] = useState('');

  // UI state
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(DEFAULT_COMPANY_INFO);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  // Plan upload state
  const [planFile, setPlanFile] = useState(null);
  const [planPreview, setPlanPreview] = useState(null);
  const [planAnalyzing, setPlanAnalyzing] = useState(false);

  // AI state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setHydrated(true);
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    
    const savedRates = localStorage.getItem(LABOUR_RATES_KEY);
    if (savedRates) setLabourRates(JSON.parse(savedRates));
    
    const savedCompany = localStorage.getItem(COMPANY_INFO_KEY);
    if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));
    
    const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentId && savedProjects) {
      const current = JSON.parse(savedProjects).find(p => p.id === currentId);
      if (current) loadProject(current);
    }
  }, []);

  // Persist labour rates
  useEffect(() => {
    localStorage.setItem(LABOUR_RATES_KEY, JSON.stringify(labourRates));
  }, [labourRates]);

  // Persist company info
  useEffect(() => {
    localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(companyInfo));
  }, [companyInfo]);

  // Clear materialSearch when leaving materials page
  useEffect(() => {
    if (page !== 'materials') setMaterialSearch('');
  }, [page]);

  // Cart functions (memoized to prevent unnecessary re-renders)
  const addToCart = useCallback((material) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === material.id);
      if (existing) {
        return prev.map(i => i.id === material.id ? {...i, qty: i.qty + 1} : i);
      }
      return [...prev, { ...material, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return newQty === 0 ? null : {...i, qty: newQty};
      }
      return i;
    }).filter(Boolean));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  // Labour functions (memoized)
  const addLabourItem = useCallback((item) => {
    const id = Date.now().toString();
    setLabourItems(prev => [...prev, { ...item, id }]);
  }, []);

  const updateLabourHours = useCallback((id, hours) => {
    setLabourItems(prev => prev.map(i => 
      i.id === id ? {...i, hours: Math.max(0, hours)} : i
    ).filter(i => i.hours > 0));
  }, []);

  const removeLabourItem = useCallback((id) => {
    setLabourItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Calculations (memoized to prevent recalculation on every render)
  const subtotal = useMemo(() => 
    cart.reduce((sum, i) => sum + (i.price * i.qty), 0), [cart]
  );

  const labourSubtotal = useMemo(() => 
    labourItems.reduce((sum, item) => {
      const rate = labourRates[item.role] || DEFAULT_LABOUR_RATES[item.role] || 0;
      return sum + (rate * item.hours);
    }, 0), [labourItems, labourRates]
  );

  const totals = useMemo(() => {
    const withWastage = subtotal * (1 + wastage / 100);
    const withMargin = withWastage * (1 + margin / 100);
    const labourWithMargin = labourSubtotal * (1 + margin / 100);
    const materialsTotal = gst ? withMargin * 1.15 : withMargin;
    const labourTotal = gst ? labourWithMargin * 1.15 : labourWithMargin;
    return {
      withWastage,
      withMargin,
      labourWithMargin,
      materialsTotal,
      labourTotal,
      grandTotal: materialsTotal + labourTotal
    };
  }, [subtotal, labourSubtotal, wastage, margin, gst]);

  const { withWastage, withMargin, labourWithMargin, materialsTotal, labourTotal, grandTotal } = totals;

  // Project functions (memoized)
  const saveProject = useCallback((name, overwrite = false) => {
    setProjects(prev => {
      const projectData = {
        id: overwrite && currentProjectId ? currentProjectId : Date.now().toString(),
        name: name || currentProjectName || 'Untitled Project',
        cart,
        labourItems,
        wastage,
        margin,
        gst,
        notes: projectNotes,
        chatHistory,
        createdAt: overwrite && currentProjectId ? prev.find(p => p.id === currentProjectId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProjects = overwrite && currentProjectId 
        ? prev.map(p => p.id === currentProjectId ? projectData : p)
        : [...prev, projectData];
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      setCurrentProjectId(projectData.id);
      setCurrentProjectName(projectData.name);
      localStorage.setItem(CURRENT_PROJECT_KEY, projectData.id);
      setShowSaveDialog(false);
      return updatedProjects;
    });
  }, [currentProjectId, currentProjectName, cart, labourItems, wastage, margin, gst, projectNotes, chatHistory]);

  const exportXero = useCallback(() => {
    const materialsSubtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const materialsWithWastage = materialsSubtotal * (1 + wastage / 100);
    const labourSubtotal = labourItems.reduce((sum, item) => {
      const rate = labourRates[item.role] || 0;
      return sum + (rate * item.hours);
    }, 0);
    const subtotalBeforeMargin = materialsWithWastage + labourSubtotal;
    const marginAmount = subtotalBeforeMargin * (margin / 100);
    const subtotal = subtotalBeforeMargin + marginAmount;
    const gstAmount = gst ? subtotal * 0.15 : 0;

    let csv = "ContactName,InvoiceNumber,InvoiceDate,DueDate,Description,Quantity,UnitAmount,AccountCode,TaxType\n";
    
    cart.forEach(item => {
      csv += `"${currentProjectName || "Quote"}","${Date.now()}","${new Date().toISOString().split("T")[0]}","${new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]}","${item.name}",${item.qty},${item.price.toFixed(2)},200,15%\n`;
    });
    
    labourItems.forEach(item => {
      const rate = labourRates[item.role] || 0;
      csv += `"${currentProjectName || "Quote"}","${Date.now()}","${new Date().toISOString().split("T")[0]}","${new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]}","${item.description}",${item.hours},${rate.toFixed(2)},200,15%\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProjectName || "quote"}-xero.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [cart, labourItems, labourRates, currentProjectName, wastage, margin, gst]);

  const loadProject = useCallback((project) => {
    setCart(project.cart || []);
    setLabourItems(project.labourItems || []);
    setWastage(project.wastage ?? 10);
    setMargin(project.margin ?? 20);
    setGst(project.gst ?? true);
    setProjectNotes(project.notes || '');
    setChatHistory(project.chatHistory || []);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    setPage('quote');
  }, []);

  const deleteProject = useCallback((projectId) => {
    if (!confirm('Delete this project?')) return;
    setProjects(prev => {
      const updatedProjects = prev.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setCurrentProjectName('');
        localStorage.removeItem(CURRENT_PROJECT_KEY);
      }
      return updatedProjects;
    });
  }, [currentProjectId]);

  const newProject = useCallback(() => {
    setCart([]);
    setLabourItems([]);
    setWastage(10);
    setMargin(20);
    setGst(true);
    setProjectNotes('');
    setChatHistory([]);
    setCurrentProjectId(null);
    setCurrentProjectName('');
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    setPage('quote');
    setPage('materials');
  }, []);

  // Generate PDF
  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const leftMargin = 14;
      const rightMargin = 14;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      let yPos = 20;

      // Helper to format currency
      const formatCurrency = (amount) => `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Company header (left side)
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129);
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
      if (currentProjectName) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'bold');
        doc.text(`Project: ${currentProjectName}`, leftMargin, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 10;
      }

      // Materials table
      if (cart.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.setFont(undefined, 'bold');
        doc.text('MATERIALS', leftMargin, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 2;

        const materialsData = cart.map(item => [
          item.name.length > 55 ? item.name.substring(0, 52) + '...' : item.name,
          item.qty.toString(),
          item.unit || 'EA',
          formatCurrency(item.price),
          formatCurrency(item.price * item.qty)
        ]);

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
          tableLineWidth: 0.1
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
        doc.setTextColor(16, 185, 129);
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
      const labourTotalPDF = labourItems.reduce((sum, item) => {
        const rate = labourRates[item.role] || DEFAULT_LABOUR_RATES[item.role] || 0;
        return sum + item.hours * rate;
      }, 0);

      // Materials: apply wastage then margin
      const materialsWithMarkup = materialTotal * (1 + wastage / 100) * (1 + margin / 100);
      // Labour: apply margin only (no wastage on labour)
      const labourWithMarkup = labourTotalPDF * (1 + margin / 100);
      // Subtotal is the sum of marked-up values
      const subtotalPDF = materialsWithMarkup + labourWithMarkup;
      const gstAmount = gst ? subtotalPDF * 0.15 : 0;
      const totalPDF = subtotalPDF + gstAmount;

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
      totalsRows.push(['Subtotal:', formatCurrency(subtotalPDF)]);
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
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.line(totalsX, yPos, totalsX + totalsWidth, yPos);
      yPos += 6;

      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', totalsX, yPos);
      doc.text(formatCurrency(totalPDF), totalsX + totalsWidth, yPos, { align: 'right' });
      doc.setFont(undefined, 'normal');

      yPos += 15;

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
      }

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by Priced In - Building Estimator', pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text(`Quote valid for 30 days from ${new Date().toLocaleDateString('en-NZ')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        if (pageCount > 1) {
          doc.text(`Page ${i} of ${pageCount}`, pageWidth - rightMargin, pageHeight - 8, { align: 'right' });
        }
      }

      const fileName = currentProjectName
        ? `Quote_${currentProjectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
        : `Quote_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
    setPdfGenerating(false);
  };

  // Extract JSON from AI response text using balanced brace matching
  const extractJSON = (text) => {
    // First, try to find JSON in a code block (```json ... ``` or ``` ... ```)
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        if (parsed.materials) return parsed; // Valid estimate JSON
      } catch (e) { /* continue to other methods */ }
    }

    // Find the first { that starts a JSON object with required fields
    const startIdx = text.indexOf('{');
    if (startIdx === -1) return null;

    // Use balanced brace counting to find the matching }
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = startIdx; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;

        if (braceCount === 0) {
          // Found matching closing brace
          const jsonStr = text.slice(startIdx, i + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            // Verify it has expected structure (at minimum, materials array)
            if (parsed.materials && Array.isArray(parsed.materials)) {
              return parsed;
            }
          } catch (e) {
            // This JSON object wasn't valid, try finding next one
            const nextStart = text.indexOf('{', i + 1);
            if (nextStart !== -1) {
              return extractJSON(text.slice(nextStart));
            }
          }
          break;
        }
      }
    }

    return null;
  };

  // AI message handler
  const sendAIMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'project',
          materials: [],
          labourRates,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}. Make sure your API key is set in .env.local`,
          type: 'error'
        }]);
      } else {
        let text = data.content?.find(c => c.type === 'text')?.text || 'No response';

        // Try to parse JSON and format it nicely
        try {
          // Extract JSON from response using balanced brace matching
          const json = extractJSON(text);
          if (json) {
            
            // Format the response beautifully
            let formattedContent = '';
            
            if (json.summary) {
              formattedContent += `**${json.summary}**\n\n`;
            }

            if (json.calculations) {
              formattedContent += '🧮 **Calculations:**\n';
              formattedContent += `${json.calculations}\n\n`;
            }

            if (json.materials && json.materials.length > 0) {
              formattedContent += '📦 **Materials needed:**\n';
              json.materials.forEach(m => {
                formattedContent += `• ${m.qty} × ${m.name}\n`;
              });
              formattedContent += '\n';
            }
            
            if (json.labour && json.labour.totalHours) {
              const rate = labourRates.builder || 95;
              const cost = rate * json.labour.totalHours;
              formattedContent += '👷 **Labour estimate:**\n';
              formattedContent += `• ${json.labour.totalHours} builder hours ($${cost.toFixed(0)})\n`;
              if (json.labour.description) {
                formattedContent += `  ${json.labour.description}\n`;
              }
              formattedContent += '\n';
            }
            
            if (json.notes && json.notes.length > 0) {
              formattedContent += '📝 **Important notes:**\n';
              json.notes.forEach(note => {
                formattedContent += `• ${note}\n`;
              });
              formattedContent += '\n';
            }
            
            if (json.warnings && json.warnings.length > 0) {
              formattedContent += '⚠️ **Warnings:**\n';
              json.warnings.forEach(warning => {
                formattedContent += `• ${warning}\n`;
              });
            }
            
            setChatHistory(prev => [...prev, { 
              role: 'assistant', 
              content: formattedContent.trim(),
              parsed: json
            }]);
          } else {
            // No JSON found, display as-is
            setChatHistory(prev => [...prev, { role: 'assistant', content: text }]);
          }
        } catch (e) {
          // JSON parse failed, display as plain text
          setChatHistory(prev => [...prev, { role: 'assistant', content: text }]);
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to connect. Check your internet connection.' 
      }]);
    }
    
    setAiLoading(false);
  };

  // Add AI-suggested materials to quote
  const addMaterialsToQuote = (materials, msgIndex) => {
    if (!materials || materials.length === 0) return;

    const newItems = [];
    const unmatched = []; // Track materials we couldn't find

    materials.forEach(suggested => {
      const searchTerm = (suggested.searchTerm || suggested.name || "").toUpperCase();
      const searchWords = searchTerm.replace(/[^A-Z0-9.]/g, " ").split(" ").filter(w => w.length > 1);

      // Validate and parse quantity
      let qty = suggested.qty;
      if (typeof qty === 'string') qty = parseFloat(qty);
      if (!qty || isNaN(qty) || qty <= 0) qty = 1;
      qty = Math.ceil(qty); // Round up - can't buy partial items

      // Skip if no valid search term
      if (searchWords.length === 0) {
        unmatched.push({ name: suggested.name || 'Unknown item', qty, reason: 'No search term' });
        return;
      }

      // Find best match - prioritize key product words
      let bestMatch = null;
      let bestScore = 0;

      // Key words that MUST match if present (product identifiers)
      const keyWords = searchWords.filter(w =>
        ["AQUALINE", "ULTRALINE", "FYRELINE", "STANDARD", "PINK", "EARTHWOOL", "H3.1", "H3.2", "H4", "H5", "H1.2", "SG8", "KD"].includes(w)
      );

      allMaterials.forEach(m => {
        if (!m?.name) return; // Skip invalid entries
        const matName = m.name.toUpperCase();

        // If we have key words, they must ALL match
        if (keyWords.length > 0) {
          const keyMatches = keyWords.every(kw => matName.includes(kw));
          if (!keyMatches) return;
        }

        // Score by total word matches
        const score = searchWords.filter(word => matName.includes(word)).length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = m;
        }
      });

      if (bestMatch) {
        const existing = newItems.find(i => i.id === bestMatch.id);
        if (existing) {
          existing.qty += qty;
        } else {
          newItems.push({ ...bestMatch, qty });
        }
      } else {
        // Track unmatched for user feedback with helpful search suggestions
        const itemName = suggested.name || searchTerm;
        const suggestedSearches = extractSearchSuggestions(itemName, suggested.searchTerm);
        unmatched.push({
          name: itemName,
          qty,
          searchTerm: suggested.searchTerm,
          reason: 'No match in database',
          suggestions: suggestedSearches
        });
      }
    });

    // Add all matched items to cart
    if (newItems.length > 0) {
      setCart(prev => {
        const updated = [...prev];
        newItems.forEach(item => {
          const existing = updated.find(i => i.id === item.id);
          if (existing) {
            existing.qty += item.qty;
          } else {
            updated.push(item);
          }
        });
        return updated;
      });
    }

    // Update chat with match results and add warning message for unmatched items
    setChatHistory(prev => {
      const updated = prev.map((msg, idx) =>
        idx === msgIndex ? {
          ...msg,
          added: true,
          matchResults: {
            matched: newItems.length,
            total: materials.length,
            unmatched: unmatched.length > 0 ? unmatched : null
          }
        } : msg
      );

      // Add system warning message if items couldn't be matched
      if (unmatched.length > 0) {
        updated.push({
          role: 'system',
          type: 'warning',
          content: `${unmatched.length} of ${materials.length} items couldn't be matched`,
          unmatched: unmatched,
          matched: newItems.length
        });
      }

      return updated;
    });

    setPage('quote');
  };

  // Add AI-suggested labour to quote
  const addLabourToQuote = (labour, msgIndex) => {
    if (!labour || !labour.totalHours) return;

    addLabourItem({
      role: 'builder',
      hours: labour.totalHours,
      description: labour.description || 'Builder labour'
    });
  };


  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Header 
        page={page} 
        setPage={setPage} 
        currentProjectName={currentProjectName} 
        cart={cart}
        showAI={showAI}
        setShowAI={setShowAI}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="max-w-7xl mx-auto p-4">
        {showAI && (
          <AIAssistant
            showAI={showAI}
            chatHistory={chatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendMessage={sendAIMessage}
            aiLoading={aiLoading}
            onAddMaterialsToQuote={addMaterialsToQuote}
            onAddLabourToQuote={addLabourToQuote}
            onSearchMaterial={(term) => {
              setMaterialSearch(term);
              setPage('materials');
            }}
          />
        )}

        {showSaveDialog && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <SaveProjectDialog
              isOpen={showSaveDialog}
              saveProjectName={saveProjectName}
              setSaveProjectName={setSaveProjectName}
              projectNotes={projectNotes}
              setProjectNotes={setProjectNotes}
              onSave={() => saveProject(saveProjectName)}
              onCancel={() => setShowSaveDialog(false)}
            />
          </Suspense>
        )}

        {showLabourSettings && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <LabourSettingsDialog
              isOpen={showLabourSettings}
              labourRates={labourRates}
              setLabourRates={setLabourRates}
              onClose={() => setShowLabourSettings(false)}
            />
          </Suspense>
        )}

        {showPriceComparison && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <PriceComparisonModal
              showPriceComparison={showPriceComparison}
              cart={cart}
              materials={materials}
              setShowPriceComparison={setShowPriceComparison}
              onSwitchSupplier={(oldId, newId) => {
                const oldItem = cart.find(i => i.id === oldId);
                const newItem = materials.find(m => m.id === newId);
                if (oldItem && newItem) {
                  setCart(prev => prev.map(i => 
                    i.id === oldId ? { ...newItem, qty: oldItem.qty } : i
                  ));
                  setShowPriceComparison(null);
                }
              }}
            />
          </Suspense>
        )}

        {showCompanySettings && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <CompanySettingsDialog
              isOpen={showCompanySettings}
              companyInfo={companyInfo}
              setCompanyInfo={setCompanyInfo}
              onClose={() => setShowCompanySettings(false)}
            />
          </Suspense>
        )}

        {showAddMaterial && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <AddMaterialModal
              isOpen={showAddMaterial}
              onClose={() => setShowAddMaterial(false)}
              onAddToCart={addToCart}
            />
          </Suspense>
        )}

        {page === 'materials' && (
          <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading materials...</div>}>
            <MaterialsPage onAddToCart={addToCart} initialSearch={materialSearch} />
          </Suspense>
        )}

        {page === 'quote' && (
          <QuotePage
            cart={cart}
            labourItems={labourItems}
            currentProjectId={currentProjectId}
            currentProjectName={currentProjectName}
            wastage={wastage}
            setWastage={setWastage}
            margin={margin}
            setMargin={setMargin}
            gst={gst}
            setGst={setGst}
            projectNotes={projectNotes}
            setProjectNotes={setProjectNotes}
            onSave={() => saveProject(currentProjectName, true)}
            onSaveAs={() => { setSaveProjectName(''); setShowSaveDialog(true); }}
            onNew={newProject}
            onLabourSettings={() => setShowLabourSettings(true)}
            onCompanySettings={() => setShowCompanySettings(true)}
            onGeneratePDF={generatePDF}
            onExportXero={exportXero}
            onUpdateCartQty={(id, delta) => {
              setCart(cart.map(item => 
                item.id === id ? {...item, qty: Math.max(1, item.qty + delta)} : item
              ));
            }}
            onRemoveFromCart={(id) => setCart(cart.filter(i => i.id !== id))}
            onUpdateLabourHours={(id, hours) => {
              setLabourItems(labourItems.map(item =>
                item.id === id ? {...item, hours: Math.max(0.5, hours)} : item
              ));
            }}
            onRemoveLabourItem={(id) => setLabourItems(labourItems.filter(i => i.id !== id))}
            onAddLabourItem={addLabourItem}
            onUpdateLabourRole={(id, role) => setLabourItems(labourItems.map(i => i.id === id ? {...i, role} : i))}
            pdfGenerating={pdfGenerating}
            labourRates={labourRates}
            onOpenAddMaterial={() => setShowAddMaterial(true)}
          />
        )}

        {page === 'projects' && (
          <Dashboard 
            projects={projects}
            onNewProject={newProject}
            onLoadProject={loadProject}
            onDeleteProject={deleteProject}
          />
        )}

        {page === 'plans' && (
          <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading plans...</div>}>
            <PlansUpload
            planFile={planFile}
            planPreview={planPreview}
            planAnalyzing={planAnalyzing}
            chatHistory={chatHistory}
            cart={cart}
            labourItems={labourItems}
            onHandlePlanUpload={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPlanFile(file);
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (evt) => setPlanPreview(evt.target?.result);
                reader.readAsDataURL(file);
              } else if (file.type === 'application/pdf') {
                setPlanPreview('PDF: ' + file.name);
              }
            }}
            onAnalyzePlan={() => {}}
            onNavigateToQuote={() => setPage('quote')}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
