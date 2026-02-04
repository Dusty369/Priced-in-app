'use client';

import QuotePage from '../components/QuotePage';
import Dashboard from '../components/Dashboard';
import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { Plus, Minus, Trash2, Save, FolderOpen, FileText, Settings, Download, Building2 } from 'lucide-react';
import { searchMaterials, getMaterialsByCategory, getCategories, getSuppliers, getAllMaterials } from '../lib/materialsLoader';
import Header from '../components/Header';
import AIAssistant from '../components/AIAssistant';
import { generateQuotePDF } from '../lib/pdfGenerator';
import { useAIChat } from '../hooks/useAIChat';

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
  DEFAULT_COMPANY_INFO,
  LABOUR_PRESETS,
  PROJECTS_KEY,
  CURRENT_PROJECT_KEY,
  LABOUR_RATES_KEY,
  COMPANY_INFO_KEY
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

  // AI chat hook (must be after addLabourItem is defined)
  const addItemsToCart = useCallback((items) => {
    setCart(prev => {
      const updated = [...prev];
      items.forEach(item => {
        const existing = updated.find(i => i.id === item.id);
        if (existing) {
          existing.qty += item.qty;
        } else {
          updated.push(item);
        }
      });
      return updated;
    });
  }, []);

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
    onAddToCart: addItemsToCart,
    onAddLabourItem: addLabourItem,
    onNavigateToQuote: () => setPage('quote'),
    allMaterials,
    materialWordIndex
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
      await generateQuotePDF({
        cart,
        labourItems,
        labourRates,
        companyInfo,
        projectName: currentProjectName,
        projectNotes,
        wastage,
        margin,
        gst
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
