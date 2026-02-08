'use client';

import QuotePage from '../components/QuotePage';
import Dashboard from '../components/Dashboard';
import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { Plus, Minus, Trash2, Save, FolderOpen, FileText, Settings, Download, Building2 } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories, getSuppliers, getAllMaterials } from '../lib/materialsLoader';
import Header from '../components/Header';
import AIAssistant from '../components/AIAssistant';
import { generateQuotePDF } from '../lib/pdfGenerator';
import { validateQuote, getValidationSummary } from '../lib/quoteValidation';
import { useAIChat } from '../hooks/useAIChat';
import { useProjects } from '../hooks/useProjects';
import { useCart } from '../hooks/useCart';
import { useSubscription } from '../hooks/useSubscription';

// Lazy load heavy components
const MaterialsPage = lazy(() => import('../components/MaterialsPage'));
const PlansUpload = lazy(() => import('../components/PlansUpload'));
const SaveProjectDialog = lazy(() => import('../components/SaveProjectDialog'));
const LabourSettingsDialog = lazy(() => import('../components/LabourSettingsDialog'));
const CompanySettingsDialog = lazy(() => import('../components/CompanySettingsDialog'));
const AddMaterialModal = lazy(() => import('../components/AddMaterialModal'));
const ReviewEstimate = lazy(() => import('../components/ReviewEstimate'));
import {
  DEFAULT_LABOUR_RATES,
  DEFAULT_COMPANY_INFO,
  LABOUR_PRESETS,
  LABOUR_RATES_KEY,
  COMPANY_INFO_KEY,
  MATERIAL_PRESETS_KEY,
  PLAN_USAGE_KEY,
  TIER_USAGE_KEY,
  TIER_LIMITS,
  GST_RATE
} from '../lib/constants';


const allMaterials = getAllMaterials();

// Build word index for O(1) material lookup (instead of O(13k) per search)
const materialWordIndex = new Map();
allMaterials.forEach((m, idx) => {
  if (!m?.name) return;
  const words = m.name.toUpperCase().replace(/[^A-Z0-9.]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  words.forEach(word => {
    if (!materialWordIndex.has(word)) materialWordIndex.set(word, []);
    materialWordIndex.get(word).push(idx);
  });
});

export default function PricedInApp() {
  // Hydration guard
  const [hydrated, setHydrated] = useState(false);

  // Page state
  const [page, setPage] = useState('projects');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAI, setShowAI] = useState(true); // AI shown by default on quote page

  // Cart hook
  const { cart, setCart, addToCart, updateQty, removeFromCart, addItemsToCart, clearCart } = useCart();

  // Materials filter state
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

  // AI calculations state (for showing working in quote)
  const [aiCalculations, setAiCalculations] = useState([]);

  // Project management hook
  const {
    projects,
    currentProjectId,
    currentProjectName,
    projectNotes,
    setProjectNotes,
    clientName,
    setClientName,
    clientAddress,
    setClientAddress,
    showSaveDialog,
    saveProjectName,
    setSaveProjectName,
    saveProject,
    loadProject,
    deleteProject,
    duplicateProject,
    updateProjectStatus,
    newProject,
    openSaveDialog,
    closeSaveDialog
  } = useProjects({
    getProjectData: () => ({ cart, labourItems, wastage, margin, gst, chatHistory }),
    onLoadProject: (project) => {
      setCart(project.cart || []);
      setLabourItems(project.labourItems || []);
      setWastage(project.wastage ?? 10);
      setMargin(project.margin ?? 20);
      setGst(project.gst ?? true);
      setChatHistory(project.chatHistory || []);
    },
    onNewProject: () => {
      setCart([]);
      setLabourItems([]);
      setWastage(10);
      setMargin(20);
      setGst(true);
      setChatHistory([]);
    },
    onNavigate: setPage
  });

  // UI state
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(DEFAULT_COMPANY_INFO);
  const [materialPresets, setMaterialPresets] = useState([]);
  const { tier: userTier, loading: subscriptionLoading, customerId: stripeCustomerId, subscription: stripeSubscription, trialDaysLeft, startCheckout, openPortal, refreshStatus } = useSubscription();
  const [planUsage, setPlanUsage] = useState({ month: new Date().toISOString().slice(0, 7), plans: 0 });
  const [tierUsage, setTierUsage] = useState({
    month: new Date().toISOString().slice(0, 7),
    aiQuotes: 0,
    manualQuotes: 0,
    planAnalyses: 0
  });
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  // Review estimate state (materials pending review before adding to cart)
  const [reviewMaterials, setReviewMaterials] = useState(null);

  // Plan upload state
  const [planFile, setPlanFile] = useState(null);
  const [planPreview, setPlanPreview] = useState(null);
  const [planAnalyzing, setPlanAnalyzing] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setHydrated(true);

    const savedRates = localStorage.getItem(LABOUR_RATES_KEY);
    if (savedRates) setLabourRates(JSON.parse(savedRates));

    const savedCompany = localStorage.getItem(COMPANY_INFO_KEY);
    if (savedCompany) setCompanyInfo(JSON.parse(savedCompany));

    const savedPresets = localStorage.getItem(MATERIAL_PRESETS_KEY);
    if (savedPresets) setMaterialPresets(JSON.parse(savedPresets));

    const savedUsage = localStorage.getItem(PLAN_USAGE_KEY);
    if (savedUsage) {
      const usage = JSON.parse(savedUsage);
      const currentMonth = new Date().toISOString().slice(0, 7);
      // Reset if new month
      if (usage.month !== currentMonth) {
        setPlanUsage({ month: currentMonth, pages: 0 });
      } else {
        setPlanUsage(usage);
      }
    }

    // Load tier usage
    const savedTierUsage = localStorage.getItem(TIER_USAGE_KEY);
    if (savedTierUsage) {
      const usage = JSON.parse(savedTierUsage);
      const currentMonth = new Date().toISOString().slice(0, 7);
      // Reset if new month
      if (usage.month !== currentMonth) {
        setTierUsage({ month: currentMonth, aiQuotes: 0, manualQuotes: 0, planAnalyses: 0 });
      } else {
        setTierUsage(usage);
      }
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

  // Persist material presets
  useEffect(() => {
    localStorage.setItem(MATERIAL_PRESETS_KEY, JSON.stringify(materialPresets));
  }, [materialPresets]);

  // Persist plan usage
  useEffect(() => {
    localStorage.setItem(PLAN_USAGE_KEY, JSON.stringify(planUsage));
  }, [planUsage]);

  // Persist tier usage
  useEffect(() => {
    localStorage.setItem(TIER_USAGE_KEY, JSON.stringify(tierUsage));
  }, [tierUsage]);

  // Get current tier limits
  const currentTierLimits = TIER_LIMITS[userTier] || TIER_LIMITS.free;

  // Tier enforcement functions
  const canUseAI = useCallback(() => {
    if (subscriptionLoading) return true; // Optimistic while checking subscription
    if (currentTierLimits.aiQuotesPerMonth === 0) return false;
    return tierUsage.aiQuotes < currentTierLimits.aiQuotesPerMonth;
  }, [subscriptionLoading, currentTierLimits, tierUsage.aiQuotes]);

  const canSaveQuote = useCallback(() => {
    if (currentTierLimits.manualQuotesPerMonth === Infinity) return true;
    return tierUsage.manualQuotes < currentTierLimits.manualQuotesPerMonth;
  }, [currentTierLimits, tierUsage.manualQuotes]);

  const canAnalyzePlan = useCallback(() => {
    if (subscriptionLoading) return true; // Optimistic while checking subscription
    const limit = currentTierLimits.planUploadsPerMonth ?? 0;
    if (limit === 0) return false;
    if (limit === Infinity) return true;
    return tierUsage.planAnalyses < limit;
  }, [subscriptionLoading, currentTierLimits, tierUsage.planAnalyses]);

  const incrementAIUsage = useCallback(() => {
    setTierUsage(prev => ({
      ...prev,
      aiQuotes: prev.aiQuotes + 1
    }));
  }, []);

  const incrementManualQuoteUsage = useCallback(() => {
    setTierUsage(prev => ({
      ...prev,
      manualQuotes: prev.manualQuotes + 1
    }));
  }, []);

  // Clear materialSearch when leaving materials page
  useEffect(() => {
    if (page !== 'materials') setMaterialSearch('');
  }, [page]);

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

  // Material preset functions
  const savePreset = useCallback((name) => {
    if (!name || cart.length === 0) return;
    const preset = {
      id: Date.now().toString(),
      name,
      materials: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        qty: item.qty,
        category: item.category,
        supplier: item.supplier
      })),
      createdAt: new Date().toISOString()
    };
    setMaterialPresets(prev => [...prev, preset]);
  }, [cart]);

  const loadPreset = useCallback((presetId) => {
    const preset = materialPresets.find(p => p.id === presetId);
    if (!preset) return;
    // Add preset materials to cart with new IDs
    const newItems = preset.materials.map(item => ({
      ...item,
      id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }));
    setCart(prev => [...prev, ...newItems]);
  }, [materialPresets]);

  const deletePreset = useCallback((presetId) => {
    setMaterialPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  // Review estimate handlers
  const handleMaterialsForReview = useCallback((materials) => {
    // Show materials in review modal instead of directly adding to cart
    setReviewMaterials(materials);
  }, []);

  const handleConfirmReview = useCallback(() => {
    if (reviewMaterials && reviewMaterials.length > 0) {
      addItemsToCart(reviewMaterials);
      setPage('quote');
    }
    setReviewMaterials(null);
  }, [reviewMaterials, addItemsToCart]);

  const handleCancelReview = useCallback(() => {
    setReviewMaterials(null);
  }, []);

  const handleUpdateReviewQty = useCallback((id, newQty) => {
    setReviewMaterials(prev =>
      prev.map(item => item.id === id ? { ...item, qty: newQty } : item)
    );
  }, []);

  const handleRemoveReviewItem = useCallback((id) => {
    setReviewMaterials(prev => prev.filter(item => item.id !== id));
  }, []);

  // AI chat hook
  const {
    chatInput,
    setChatInput,
    chatHistory,
    setChatHistory,
    aiLoading,
    sendAIMessage,
    addMaterialsToQuote,
    addLabourToQuote
  } = useAIChat({
    labourRates,
    onAddToCart: handleMaterialsForReview,  // Show review modal instead of direct add
    onAddLabourItem: addLabourItem,
    onNavigateToQuote: () => {},  // Don't auto-navigate - we navigate after review confirmation
    allMaterials,
    materialWordIndex,
    onSetAiCalculations: setAiCalculations,
    // Tier enforcement
    canUseAI,
    onAIUsed: incrementAIUsage,
    userTier,
    tierUsage,
    tierLimits: currentTierLimits
  });

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
    const materialsTotal = gst ? withMargin * (1 + GST_RATE) : withMargin;
    const labourTotal = gst ? labourWithMargin * (1 + GST_RATE) : labourWithMargin;
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

  // Export functions
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
    const gstAmount = gst ? subtotal * GST_RATE : 0;

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

  // Calculate totals for validation
  const calculateTotals = useCallback(() => {
    const materialsSubtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
    const labourSubtotal = labourItems.reduce((sum, item) => {
      const rate = labourRates[item.role] || 0;
      return sum + rate * (item.hours || 0);
    }, 0);
    const withWastage = materialsSubtotal * (1 + wastage / 100);
    const withMargin = (withWastage + labourSubtotal) * (1 + margin / 100);
    const grandTotal = withMargin * (1 + (gst ? GST_RATE : 0));
    return { materialsSubtotal, labourSubtotal, grandTotal };
  }, [cart, labourItems, labourRates, wastage, margin, gst]);

  // Generate PDF with validation
  const generatePDF = async () => {
    const totals = calculateTotals();

    // Validate quote before generating PDF
    const validation = validateQuote({
      cart,
      labourItems,
      materialsTotal: totals.materialsSubtotal,
      labourTotal: totals.labourSubtotal,
      grandTotal: totals.grandTotal
    });

    // Block if errors
    if (!validation.valid) {
      const errorMsg = validation.errors.map(e => e.message).join('\n');
      alert(`Cannot generate PDF:\n\n${errorMsg}`);
      return;
    }

    // Warn if issues but allow proceed
    if (validation.warnings.length > 0) {
      const warningMsg = validation.warnings.map(w => `• ${w.message}`).join('\n');
      const proceed = confirm(`Warnings found:\n\n${warningMsg}\n\nGenerate PDF anyway?`);
      if (!proceed) return;
    }

    setPdfGenerating(true);
    try {
      await generateQuotePDF({
        cart,
        labourItems,
        labourRates,
        companyInfo,
        projectName: currentProjectName,
        projectNotes,
        wastage,
        margin,
        gst,
        // Add watermark for free tier
        watermark: currentTierLimits.hasWatermark
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
    setPdfGenerating(false);
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
        userTier={userTier}
        startCheckout={startCheckout}
        openPortal={openPortal}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* AI Assistant - toggled via Header */}
        {page === 'quote' && showAI && (
          <AIAssistant
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
            // Tier props
            userTier={userTier}
            tierUsage={tierUsage}
            tierLimits={currentTierLimits}
            canUseAI={canUseAI()}
            subscriptionLoading={subscriptionLoading}
            trialDaysLeft={trialDaysLeft}
            startCheckout={startCheckout}
          />
        )}

        {showSaveDialog && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <SaveProjectDialog
              isOpen={showSaveDialog}
              saveProjectName={saveProjectName}
              setSaveProjectName={setSaveProjectName}
              clientName={clientName}
              setClientName={setClientName}
              clientAddress={clientAddress}
              setClientAddress={setClientAddress}
              projectNotes={projectNotes}
              setProjectNotes={setProjectNotes}
              onSave={() => saveProject(saveProjectName)}
              onClose={closeSaveDialog}
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

        {reviewMaterials && reviewMaterials.length > 0 && (
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <ReviewEstimate
              materials={reviewMaterials}
              onConfirm={handleConfirmReview}
              onCancel={handleCancelReview}
              onUpdateQty={handleUpdateReviewQty}
              onRemoveItem={handleRemoveReviewItem}
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
            onSaveAs={openSaveDialog}
            onNew={newProject}
            onLabourSettings={() => setShowLabourSettings(true)}
            onCompanySettings={() => setShowCompanySettings(true)}
            onGeneratePDF={generatePDF}
            onExportXero={exportXero}
            onUpdateCartQty={(id, value, isAbsolute) => {
              setCart(cart.map(item =>
                item.id === id
                  ? {...item, qty: Math.max(1, isAbsolute ? value : item.qty + value)}
                  : item
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
            onUpdateLabourRate={(role, rate) => setLabourRates(prev => ({ ...prev, [role]: rate }))}
            onOpenAddMaterial={() => setShowAddMaterial(true)}
            aiCalculations={aiCalculations}
            onUpdateItemNote={(id, note) => {
              setCart(cart.map(item =>
                item.id === id ? {...item, itemNote: note} : item
              ));
            }}
            materialPresets={materialPresets}
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
            onDeletePreset={deletePreset}
            // Tier props
            userTier={userTier}
            tierLimits={currentTierLimits}
            tierUsage={tierUsage}
            canSaveQuote={canSaveQuote()}
          />
        )}

        {page === 'projects' && (
          <Dashboard
            projects={projects}
            onNewProject={newProject}
            onLoadProject={loadProject}
            onDeleteProject={deleteProject}
            onDuplicateProject={duplicateProject}
            onUpdateProjectStatus={updateProjectStatus}
            labourRates={labourRates}
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
              // Tier props
              userTier={userTier}
              tierLimits={currentTierLimits}
              tierUsage={tierUsage}
              canAnalyzePlan={canAnalyzePlan()}
              subscriptionLoading={subscriptionLoading}
              trialDaysLeft={trialDaysLeft}
              startCheckout={startCheckout}
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
              onAnalyzePlan={async () => {
                if (!planFile || !planPreview) return;
                setPlanAnalyzing(true);
                setTierUsage(prev => ({
                  ...prev,
                  planAnalyses: (prev.planAnalyses || 0) + 1
                }));
                try {
                  // Read file as base64
                  const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      // Strip data:...;base64, prefix to get raw base64
                      const result = reader.result;
                      const base64Data = result.split(',')[1];
                      resolve(base64Data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(planFile);
                  });
                  const mediaType = planFile.type || 'image/jpeg';
                  await sendAIMessage(
                    'Analyze this building plan and estimate materials needed',
                    'plan',
                    { planImage: base64, planMediaType: mediaType }
                  );
                } catch (err) {
                  console.error('Failed to read plan file:', err);
                }
                setPlanAnalyzing(false);
              }}
              onNavigateToQuote={() => setPage('quote')}
              onClearPlan={() => {
                setPlanFile(null);
                setPlanPreview(null);
              }}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
