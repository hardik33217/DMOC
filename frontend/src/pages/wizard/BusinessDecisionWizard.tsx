import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  BuildingStorefrontIcon,
  TagIcon,
  ShieldCheckIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon,
  BanknotesIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import api from "../../utils/api";
import { useBusiness } from "../../context/BusinessContext";

export interface StoredDecisionItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  unit: string;
  packSize: number;
  packUnit: string;
  currentStock: number;
  proposedOrderQuantity: number;
  unitCost: number;
  sellingPrice: number;
  leadTimeDays: number;
  minOrderQuantity: number;
  averageDailySales: number;
  shelfLifeDays: number;
  isVerified: boolean;
  regulatoryNotice?: string;
  sourceUrl?: string;
}

const QUICK_PROMPTS = [
  {
    type: "pharmacy",
    label: "Medical Store Pain-Relief",
    prompt: "I own a medical store. Should I order 20 additional packs of Paracetamol 650mg before the weekend?",
  },
  {
    type: "grocery",
    label: "Grocery Store Snack Order",
    prompt: "I own a grocery shop. Should I buy 50 extra packs of a popular snack before the weekend?",
  },
  {
    type: "quick_commerce",
    label: "Dark Store High Velocity",
    prompt: "I manage a quick-commerce dark store. Should I order 40 units of Whole Wheat Atta 5kg with a 2-day lead time?",
  },
  {
    type: "retail",
    label: "Retail General Reorder",
    prompt: "Should I purchase 30 units of inventory at wholesale cost of ₹120 to avoid running out next week?",
  },
];

export default function BusinessDecisionWizard() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [prompt, setPrompt] = useState(
    currentBusiness?.type === "pharmacy"
      ? QUICK_PROMPTS[0].prompt
      : QUICK_PROMPTS[1].prompt
  );
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Multi-item decision state
  const [storedItems, setStoredItems] = useState<StoredDecisionItem[]>([]);
  const [editingStoredIndex, setEditingStoredIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedTermItemIndex, setSelectedTermItemIndex] = useState<number>(0);

  // Form inputs for current active product
  const [decisionQuestion, setDecisionQuestion] = useState("");
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("General");
  const [productBarcode, setProductBarcode] = useState("");
  const [productUnit, setProductUnit] = useState("pack");
  const [productPackSize, setProductPackSize] = useState<number>(1);
  const [productPackUnit, setProductPackUnit] = useState("pack");
  const [isCustomizingKnowledge, setIsCustomizingKnowledge] = useState(false);

  // Knowledge search & switch states in Step 2
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [currentStock, setCurrentStock] = useState<number>(10);
  const [proposedOrderQuantity, setProposedOrderQuantity] = useState<number>(25);
  const [unitCost, setUnitCost] = useState<number>(15);
  const [sellingPrice, setSellingPrice] = useState<number>(22);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(10);
  const [averageDailySales, setAverageDailySales] = useState<number>(4);
  const [planningHorizonDays, setPlanningHorizonDays] = useState<number>(30);
  const [availableCash, setAvailableCash] = useState<number>(5000);
  const storageCapacity = 200;
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(180);

  // Simulation outcome
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Step 1 -> 2: Natural Language Parsing
  const handleParsePrompt = async () => {
    if (!prompt.trim()) return;
    setParsing(true);
    try {
      const res = await api.post("/inventory-decisions/parse-wizard", {
        prompt: prompt.trim(),
        businessId: currentBusiness?.id,
      });

      if (res.data.success) {
        const d = res.data.data;
        setParsedData(d);
        const sf = d.suggestedFields;
        setDecisionQuestion(sf.decisionQuestion);
        setProductName(sf.productName);
        setCurrentStock(sf.currentStock);
        setProposedOrderQuantity(sf.proposedOrderQuantity);
        setUnitCost(sf.unitCost);
        setSellingPrice(sf.sellingPrice);
        setLeadTimeDays(sf.leadTimeDays);
        setMinOrderQuantity(sf.minOrderQuantity);
        setAverageDailySales(sf.averageDailySales);
        setPlanningHorizonDays(sf.planningHorizonDays);

        // Enrich specs from matched product or existing inventory
        if (d.matchedProduct) {
          setProductBrand(d.matchedProduct.brand || "");
          setProductCategory(d.matchedProduct.category || "General");
          setProductBarcode(d.matchedProduct.barcode || "");
          setProductPackSize(d.matchedProduct.packSize || 1);
          setProductPackUnit(d.matchedProduct.packUnit || "pack");
          setProductUnit(d.matchedProduct.unit || "pack");
        }
        setStep(2);
      }
    } catch (err) {
      console.error("Failed to parse prompt:", err);
    } finally {
      setParsing(false);
    }
  };

  // Store current item and prepare to search next product
  const handleStoreAndSearchNext = () => {
    if (!productName.trim()) {
      setStatusMessage("Please select or enter a product name before adding the next item.");
      return;
    }

    const itemToStore: StoredDecisionItem = {
      id: editingStoredIndex !== null && storedItems[editingStoredIndex]
        ? storedItems[editingStoredIndex].id
        : `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: productName.trim(),
      brand: productBrand.trim() || parsedData?.matchedProduct?.brand || "Standard Formulation",
      category: productCategory.trim() || parsedData?.matchedProduct?.category || "General",
      barcode: productBarcode.trim() || parsedData?.matchedProduct?.barcode || "",
      unit: productUnit || "pack",
      packSize: Number(productPackSize) || 1,
      packUnit: productPackUnit || "pack",
      currentStock: Number(currentStock) || 0,
      proposedOrderQuantity: Number(proposedOrderQuantity) || 20,
      unitCost: Number(unitCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      leadTimeDays: Number(leadTimeDays) || 3,
      minOrderQuantity: Number(minOrderQuantity) || 10,
      averageDailySales: Number(averageDailySales) || 4,
      shelfLifeDays: Number(shelfLifeDays) || 180,
      isVerified: Boolean(parsedData?.matchedProduct?.isVerified),
      regulatoryNotice: parsedData?.matchedProduct?.regulatoryNotice,
      sourceUrl: parsedData?.matchedProduct?.sourceUrl,
    };

    let newItemsList: StoredDecisionItem[];
    if (editingStoredIndex !== null && editingStoredIndex >= 0 && editingStoredIndex < storedItems.length) {
      newItemsList = [...storedItems];
      newItemsList[editingStoredIndex] = itemToStore;
      setStoredItems(newItemsList);
      setEditingStoredIndex(null);
      setStatusMessage(`✓ Updated item: "${itemToStore.name}". You can now search your next product below!`);
    } else {
      newItemsList = [...storedItems, itemToStore];
      setStoredItems(newItemsList);
      setStatusMessage(`✓ Item #${newItemsList.length} "${itemToStore.name}" confirmed & stored! Now search your next product below.`);
    }

    // Reset fields to prepare for next product
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults(null);
    setProductName("");
    setProductBrand("");
    setProductCategory("General");
    setProductBarcode("");
    setProductPackSize(1);
    setProductPackUnit("pack");
    setProductUnit("pack");
    setParsedData(null);
    setIsCustomizingKnowledge(false);

    // Focus product search bar for immediate search
    setTimeout(() => {
      const searchEl = document.getElementById("product-search-input");
      if (searchEl) {
        searchEl.focus();
        searchEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Re-open a stored item for editing in Step 2
  const handleEditStoredItem = (idx: number) => {
    const itm = storedItems[idx];
    if (!itm) return;
    setEditingStoredIndex(idx);
    setProductName(itm.name);
    setProductBrand(itm.brand);
    setProductCategory(itm.category);
    setProductBarcode(itm.barcode);
    setProductUnit(itm.unit);
    setProductPackSize(itm.packSize);
    setProductPackUnit(itm.packUnit);
    setCurrentStock(itm.currentStock);
    setProposedOrderQuantity(itm.proposedOrderQuantity);
    setUnitCost(itm.unitCost);
    setSellingPrice(itm.sellingPrice);
    setLeadTimeDays(itm.leadTimeDays);
    setMinOrderQuantity(itm.minOrderQuantity);
    setAverageDailySales(itm.averageDailySales);
    setShelfLifeDays(itm.shelfLifeDays);
    setParsedData({
      matchedProduct: {
        name: itm.name,
        brand: itm.brand,
        category: itm.category,
        barcode: itm.barcode,
        unit: itm.unit,
        packSize: itm.packSize,
        packUnit: itm.packUnit,
        isVerified: itm.isVerified,
        regulatoryNotice: itm.regulatoryNotice,
        sourceUrl: itm.sourceUrl,
        suggestedRetailPrice: itm.sellingPrice,
        estimatedWholesalePrice: itm.unitCost,
      },
    });
    setStatusMessage(`Editing Item #${idx + 1}: "${itm.name}". Adjust specifications or terms below.`);
  };

  // Remove a stored item
  const handleRemoveStoredItem = (idx: number) => {
    const removedName = storedItems[idx]?.name;
    setStoredItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingStoredIndex === idx) {
      setEditingStoredIndex(null);
    }
    setStatusMessage(`Removed "${removedName}" from stored decision items.`);
  };

  // Proceed to Step 3 with all confirmed items
  const handleProceedToStep3 = () => {
    const finalItems = [...storedItems];
    if (productName.trim()) {
      const currentItem: StoredDecisionItem = {
        id: editingStoredIndex !== null && storedItems[editingStoredIndex]
          ? storedItems[editingStoredIndex].id
          : `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: productName.trim(),
        brand: productBrand.trim() || parsedData?.matchedProduct?.brand || "Standard Formulation",
        category: productCategory.trim() || parsedData?.matchedProduct?.category || "General",
        barcode: productBarcode.trim() || parsedData?.matchedProduct?.barcode || "",
        unit: productUnit || "pack",
        packSize: Number(productPackSize) || 1,
        packUnit: productPackUnit || "pack",
        currentStock: Number(currentStock) || 0,
        proposedOrderQuantity: Number(proposedOrderQuantity) || 20,
        unitCost: Number(unitCost) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        leadTimeDays: Number(leadTimeDays) || 3,
        minOrderQuantity: Number(minOrderQuantity) || 10,
        averageDailySales: Number(averageDailySales) || 4,
        shelfLifeDays: Number(shelfLifeDays) || 180,
        isVerified: Boolean(parsedData?.matchedProduct?.isVerified),
        regulatoryNotice: parsedData?.matchedProduct?.regulatoryNotice,
        sourceUrl: parsedData?.matchedProduct?.sourceUrl,
      };

      if (editingStoredIndex !== null && editingStoredIndex < finalItems.length) {
        finalItems[editingStoredIndex] = currentItem;
      } else if (!finalItems.some((it) => it.name.toLowerCase() === currentItem.name.toLowerCase())) {
        finalItems.push(currentItem);
      }
      setStoredItems(finalItems);
    }

    if (finalItems.length === 0) {
      setStatusMessage("Please select or enter at least one product before proceeding.");
      return;
    }

    if (finalItems.length > 0) {
      const first = finalItems[0];
      setProductName(first.name);
      setCurrentStock(first.currentStock);
      setProposedOrderQuantity(first.proposedOrderQuantity);
      setUnitCost(first.unitCost);
      setSellingPrice(first.sellingPrice);
      setLeadTimeDays(first.leadTimeDays);
      setMinOrderQuantity(first.minOrderQuantity);
      setAverageDailySales(first.averageDailySales);
      setShelfLifeDays(first.shelfLifeDays);
      setSelectedTermItemIndex(0);
    }

    setStep(3);
  };

  // Live product search & knowledge enrichment in Step 2
  const handleEnrichSearch = async (queryToUse?: string, barcodeToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    const bc = barcodeToUse !== undefined ? barcodeToUse : "";
    if (!q && !bc) return;

    setIsSearchingProduct(true);
    try {
      const res = await api.post("/inventory-decisions/enrich-product", {
        query: q,
        barcode: bc,
        businessId: currentBusiness?.id,
        categoryType: currentBusiness?.type,
      });

      if (res.data.success) {
        setSearchResults(res.data.data);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error("Failed to enrich product:", err);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  // Apply a matched external catalog product or internal inventory item
  const handleSelectProduct = (selectedProd: any, isStoreInventory: boolean = false) => {
    if (!selectedProd) return;

    if (isStoreInventory) {
      setProductName(selectedProd.name);
      setProductBrand(selectedProd.brand || "");
      setProductCategory(selectedProd.category || "General");
      setProductBarcode(selectedProd.barcode || "");
      setCurrentStock(selectedProd.stockOnHand ?? currentStock);
      setUnitCost(selectedProd.purchasePrice ?? unitCost);
      setSellingPrice(selectedProd.sellingPrice ?? sellingPrice);
      setLeadTimeDays(selectedProd.leadTimeDays || 3);
      setProductUnit(selectedProd.unit || "pcs");
      setProductPackSize(selectedProd.packSize || 1);
      setMinOrderQuantity(selectedProd.packSize || 10);

      setParsedData((prev: any) => ({
        ...prev,
        matchedProduct: {
          name: selectedProd.name,
          brand: selectedProd.brand,
          category: selectedProd.category,
          barcode: selectedProd.barcode,
          unit: selectedProd.unit,
          packSize: selectedProd.packSize,
          isVerified: true,
          matchType: "official_catalog",
          sourceProvider: "manual_verified",
          regulatoryNotice: "Store inventory record. Stock levels and historical supplier purchase costs verified from your store database.",
        },
        existingInventory: {
          productId: selectedProd.id,
          name: selectedProd.name,
          currentStock: selectedProd.stockOnHand,
          unitCost: selectedProd.purchasePrice,
          sellingPrice: selectedProd.sellingPrice,
          reorderPoint: selectedProd.reorderPoint,
          leadTimeDays: selectedProd.leadTimeDays || 3,
        },
      }));
    } else {
      setProductName(selectedProd.name);
      setProductBrand(selectedProd.brand || "");
      setProductCategory(selectedProd.category || "General");
      setProductBarcode(selectedProd.barcode || "");
      setProductUnit(selectedProd.unit || "pack");
      setProductPackSize(selectedProd.packSize || 1);
      setProductPackUnit(selectedProd.packUnit || "pack");
      setMinOrderQuantity(selectedProd.packSize || 10);
      if (selectedProd.estimatedWholesalePrice) {
        setUnitCost(selectedProd.estimatedWholesalePrice);
      }
      if (selectedProd.suggestedRetailPrice) {
        setSellingPrice(selectedProd.suggestedRetailPrice);
      }

      setParsedData((prev: any) => ({
        ...prev,
        matchedProduct: selectedProd,
      }));
    }

    setShowSearchResults(false);
  };

  // Sync edited fields back to storedItems for multi-item decisions
  const updateStoredTermField = (field: keyof StoredDecisionItem, val: any) => {
    if (storedItems.length > 0 && selectedTermItemIndex < storedItems.length) {
      const updated = [...storedItems];
      updated[selectedTermItemIndex] = {
        ...updated[selectedTermItemIndex],
        [field]: val,
      };
      setStoredItems(updated);
    }
  };

  // Step 3 -> 4: Run Simulation
  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const itemsToSimulate = storedItems.length > 0 ? storedItems : [{
        id: "single",
        name: productName,
        brand: productBrand,
        category: productCategory,
        barcode: productBarcode,
        unit: productUnit,
        packSize: productPackSize,
        packUnit: productPackUnit,
        currentStock: Number(currentStock),
        proposedOrderQuantity: Number(proposedOrderQuantity),
        unitCost: Number(unitCost),
        sellingPrice: Number(sellingPrice),
        leadTimeDays: Number(leadTimeDays),
        minOrderQuantity: Number(minOrderQuantity),
        averageDailySales: Number(averageDailySales),
        shelfLifeDays: Number(shelfLifeDays),
        isVerified: Boolean(parsedData?.matchedProduct?.isVerified),
      }];

      const totalProposedQuantity = itemsToSimulate.reduce((acc, it) => acc + it.proposedOrderQuantity, 0);
      const totalCurrentStock = itemsToSimulate.reduce((acc, it) => acc + it.currentStock, 0);
      const totalOutlay = itemsToSimulate.reduce((acc, it) => acc + (it.proposedOrderQuantity * it.unitCost), 0);
      const totalRevenue = itemsToSimulate.reduce((acc, it) => acc + (it.proposedOrderQuantity * it.sellingPrice), 0);
      const weightedUnitCost = totalProposedQuantity > 0 ? totalOutlay / totalProposedQuantity : Number(unitCost);
      const weightedSellingPrice = totalProposedQuantity > 0 ? totalRevenue / totalProposedQuantity : Number(sellingPrice);
      const combinedAvgVelocity = itemsToSimulate.reduce((acc, it) => acc + it.averageDailySales, 0);

      const simProductName = itemsToSimulate.length === 1
        ? itemsToSimulate[0].name
        : `${itemsToSimulate.length} Products Batch (${itemsToSimulate.map((it) => it.name).slice(0, 2).join(", ")}${itemsToSimulate.length > 2 ? ` +${itemsToSimulate.length - 2} more` : ""})`;

      const res = await api.post("/inventory-decisions/simulate", {
        decisionQuestion: decisionQuestion || `Decision: Purchase inventory batch for ${currentBusiness?.name || "Store"}`,
        businessType: currentBusiness?.type || "retail",
        productName: simProductName,
        currentStock: Math.round(totalCurrentStock),
        proposedOrderQuantity: Math.round(totalProposedQuantity),
        unitCost: Math.round(weightedUnitCost * 100) / 100,
        sellingPrice: Math.round(weightedSellingPrice * 100) / 100,
        leadTimeDays: Number(leadTimeDays),
        minOrderQuantity: Number(minOrderQuantity),
        planningHorizonDays: Number(planningHorizonDays),
        averageDailySales: Number(combinedAvgVelocity),
        availableCash: Number(availableCash),
        storageCapacityUnits: Number(storageCapacity),
        shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : undefined,
      });

      if (res.data.success) {
        setSimulationResult(res.data.data);
        setStep(4);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Convert to Workflow Canvas
  const handleGenerateWorkflow = async () => {
    try {
      const res = await api.post("/inventory-decisions/generate-workflow", {
        businessId: currentBusiness?.id,
        simulationResult,
        title: decisionQuestion,
      });

      if (res.data.success) {
        navigate(`/workflows/${res.data.data.workflowId}`);
      }
    } catch (err) {
      console.error("Failed to generate workflow:", err);
    }
  };

  // Save Report
  const handleSaveReport = async () => {
    try {
      const res = await api.post("/inventory-decisions/save-report", {
        businessId: currentBusiness?.id,
        title: `Decision Analysis: ${productName}`,
        question: decisionQuestion,
        recommendation: simulationResult.recommendedPath === "A" ? "proceed" : simulationResult.recommendedPath === "C" ? "alternative" : "do_not_proceed",
        summaryText: simulationResult.recommendationSummary,
        planningHorizonDays,
        simulationResult,
        assumptions: simulationResult.assumptions,
        missingInfo: simulationResult.omissionsOrMissingInfo,
      });

      if (res.data.success) {
        navigate("/reports");
      }
    } catch (err) {
      console.error("Failed to save report:", err);
    }
  };

  const currencySym = currentBusiness?.currencySymbol || "₹";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md">
              <SparklesIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-text-light dark:text-text-dark">
                Universal Decision Wizard
              </h1>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                Natural-language inventory and purchasing simulator
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-light-muted dark:text-text-dark-muted">
          <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>1. Ask</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>2. Product</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>3. Terms</span>
          <span>→</span>
          <span className={`px-2.5 py-1 rounded-lg ${step === 4 ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>4. Outcomes</span>
        </div>
      </div>

      {/* STEP 1: Natural Language Question */}
      {step === 1 && (
        <div className="card p-6 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-light dark:text-text-dark mb-1">
              What business decision are you considering?
            </label>
            <p className="text-xs text-text-light-muted dark:text-text-dark-muted mb-3">
              Type naturally in plain language. DMOC will extract the product, proposed quantity, context, and cross-reference verified catalog sources.
            </p>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I own a medical store. Should I order 20 additional packs of a particular pain-relief product before the weekend?"
              className="w-full p-4 rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted block mb-2">
              Or choose an example business decision:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(qp.prompt)}
                  className="p-3 rounded-xl border border-surface-light-border dark:border-surface-dark-border text-left hover:border-brand-500 transition-all text-xs"
                >
                  <span className="font-bold text-brand-600 dark:text-brand-400 block mb-1">
                    {qp.label}
                  </span>
                  <span className="text-text-light dark:text-text-dark line-clamp-2">
                    "{qp.prompt}"
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={parsing || !prompt.trim()}
              onClick={handleParsePrompt}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold"
            >
              {parsing ? "Analyzing Context & Sourcing Products..." : "Analyze Decision"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Product Enrichment & Identity Verification */}
      {step === 2 && (
        <div className="card p-6 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-6">
          {/* Header & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-light-border dark:border-surface-dark-border gap-2">
            <div>
              <h2 className="text-base font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-brand-500" />
                Verified Product Identification & Knowledge Dossier
              </h2>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-0.5">
                Inspect official catalog provenance, change or search products, and customize specifications to match your exact requirement.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {parsedData?.matchedProduct?.isVerified ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold flex items-center gap-1 shadow-sm">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Source Verified
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-bold flex items-center gap-1 shadow-sm">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Manual / Unverified Entry
                </span>
              )}
              {parsedData?.existingInventory && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-bold flex items-center gap-1 shadow-sm">
                  <BuildingStorefrontIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  In Store Inventory
                </span>
              )}
            </div>
          </div>

          {/* Status announcement banner */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Stored / Confirmed Items List Tray */}
          {storedItems.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-surface-light-border dark:border-surface-dark-border space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShoppingBagIcon className="h-4 w-4 text-brand-500" />
                  <span className="text-xs font-bold text-text-light dark:text-text-dark">
                    Confirmed Items for this Decision ({storedItems.length} {storedItems.length === 1 ? "item" : "items"})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Combined Outlay: {currencySym}{storedItems.reduce((acc, it) => acc + (it.proposedOrderQuantity * it.unitCost), 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {storedItems.map((itm, idx) => (
                  <div
                    key={itm.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                      editingStoredIndex === idx
                        ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 ring-1 ring-brand-500"
                        : "bg-gray-50/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="cursor-pointer" onClick={() => handleEditStoredItem(idx)}>
                      <div className="font-bold text-text-light dark:text-text-dark flex items-center gap-1">
                        <span>#{idx + 1} {itm.name}</span>
                        {itm.isVerified && (
                          <CheckCircleIcon className="h-3 w-3 text-emerald-500" title="Source Verified" />
                        )}
                      </div>
                      <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                        Buy: {currencySym}{itm.unitCost} • Order: {itm.proposedOrderQuantity} {itm.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-1 border-l pl-1.5 border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => handleEditStoredItem(idx)}
                        className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
                        title="Edit item specifications"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStoredItem(idx)}
                        className="text-gray-400 hover:text-red-500 p-0.5"
                        title="Remove item"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Search & Product Switcher */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/70 via-indigo-50/50 to-purple-50/40 dark:from-gray-800/60 dark:via-gray-800/40 dark:to-gray-800/60 border border-brand-200/60 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-light dark:text-text-dark flex items-center gap-1.5">
                <ArrowsRightLeftIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Change or Search Product Knowledge
              </span>
              <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted">
                Connects to Open Food Facts, NPPA/CDSCO Database & your live inventory
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  id="product-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEnrichSearch();
                    }
                  }}
                  placeholder="Search next product name, brand, or barcode (e.g. Paracetamol 650, Atta, Maggi, Ghee, 8901491101837)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                />
              </div>
              <button
                type="button"
                disabled={isSearchingProduct || !searchQuery.trim()}
                onClick={() => handleEnrichSearch()}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {isSearchingProduct ? (
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                )}
                {isSearchingProduct ? "Searching..." : "Lookup Knowledge"}
              </button>
            </div>

            {/* Quick Benchmark Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted mr-1 font-medium">
                Quick Benchmarks:
              </span>
              {(currentBusiness?.type === "pharmacy"
                ? ["Paracetamol 650mg", "Amoxicillin 500mg", "Cetirizine 10mg", "Pantoprazole 40mg", "WHO ORS Sachet"]
                : ["Masala Potato Chips 50g", "Whole Wheat Atta 5kg", "Pure Cow Ghee 1L", "Instant 2-Minute Noodles", "Glucose Biscuits 250g"]
              ).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(preset);
                    handleEnrichSearch(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-brand-600 dark:text-brand-400 hover:border-brand-500 transition-all shadow-xs"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Search Results Dropdown/Drawer */}
            {showSearchResults && searchResults && (
              <div className="mt-3 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-brand-300 dark:border-brand-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-surface-light-border dark:border-surface-dark-border pb-2">
                  <span className="text-xs font-bold text-text-light dark:text-text-dark">
                    Available Matches for "{searchResults.query || searchResults.barcode}"
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSearchResults(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* 1. In Store Inventory Matches */}
                {searchResults.inventoryMatches?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1.5 flex items-center gap-1">
                      <BuildingStorefrontIcon className="h-3.5 w-3.5" />
                      Matches in Your Store Inventory ({searchResults.inventoryMatches.length})
                    </span>
                    <div className="space-y-1.5">
                      {searchResults.inventoryMatches.map((inv: any) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs"
                        >
                          <div>
                            <span className="font-bold text-text-light dark:text-text-dark">
                              {inv.name}
                            </span>
                            <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted ml-2">
                              Stock: {inv.stockOnHand} {inv.unit} • Buy: {currencySym}{inv.purchasePrice} • Sell: {currencySym}{inv.sellingPrice}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(inv, true)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          >
                            Use Store Record
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Official External Catalog Matches */}
                {searchResults.allMatches?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1.5 flex items-center gap-1">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      Verified Catalog Standards ({searchResults.allMatches.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {searchResults.allMatches.map((cat: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-xs"
                        >
                          <div className="pr-2">
                            <span className="font-bold text-text-light dark:text-text-dark">
                              {cat.name}
                            </span>
                            <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                              Brand: {cat.brand || "Standard"} • Pack: {cat.packSize} {cat.unit}
                              {cat.suggestedRetailPrice && ` • MRP: ${currencySym}${cat.suggestedRetailPrice}`}
                              {cat.estimatedWholesalePrice && ` • Wholesale: ${currencySym}${cat.estimatedWholesalePrice}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(cat, false)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shrink-0"
                          >
                            Apply Knowledge
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Full Product Knowledge Dossier */}
          {parsedData?.matchedProduct ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border space-y-4">
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-text-light dark:text-text-dark">
                    {parsedData.matchedProduct.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-light-muted dark:text-text-dark-muted">
                    <span className="flex items-center gap-1">
                      <TagIcon className="h-3.5 w-3.5 text-brand-500" />
                      <strong>Brand:</strong> {parsedData.matchedProduct.brand || productBrand || "Standard Formulation"}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Category:</strong> {parsedData.matchedProduct.category || productCategory}
                    </span>
                    {parsedData.matchedProduct.barcode && (
                      <>
                        <span>•</span>
                        <span>
                          <strong>Barcode:</strong> {parsedData.matchedProduct.barcode}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {parsedData.matchedProduct.sourceUrl && (
                  <a
                    href={parsedData.matchedProduct.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline shrink-0 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-900"
                  >
                    View Official Source <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Regulatory Notice & FSSAI / DPCO Compliance */}
              {parsedData.matchedProduct.regulatoryNotice && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <InformationCircleIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Compliance & Regulatory Notice:</span>
                    <span>{parsedData.matchedProduct.regulatoryNotice}</span>
                  </div>
                </div>
              )}

              {/* 4-Block Knowledge Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted mb-1">
                    <CubeIcon className="h-3.5 w-3.5 text-brand-500" />
                    Packaging Format
                  </div>
                  <div className="text-sm font-bold text-text-light dark:text-text-dark">
                    {productPackSize} {productUnit}
                  </div>
                  <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    per {productPackUnit}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted mb-1">
                    <BanknotesIcon className="h-3.5 w-3.5 text-emerald-500" />
                    Wholesale Benchmark
                  </div>
                  <div className="text-sm font-bold text-text-light dark:text-text-dark">
                    {currencySym}{unitCost}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Est. Margin: {sellingPrice > 0 ? (((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted mb-1">
                    <TagIcon className="h-3.5 w-3.5 text-indigo-500" />
                    Suggested Retail (MRP)
                  </div>
                  <div className="text-sm font-bold text-text-light dark:text-text-dark">
                    {currencySym}{sellingPrice}
                  </div>
                  <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Per unit retail
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted mb-1">
                    <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                    Shelf Life & Storage
                  </div>
                  <div className="text-sm font-bold text-text-light dark:text-text-dark">
                    {shelfLifeDays} days
                  </div>
                  <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                    Standard commercial
                  </div>
                </div>
              </div>

              {/* Extra formulation/composition details */}
              {(parsedData.matchedProduct.strength || parsedData.matchedProduct.dosageForm || parsedData.matchedProduct.ingredients) && (
                <div className="p-2.5 rounded-lg bg-gray-100/60 dark:bg-gray-800/80 text-[11px] text-text-light-muted dark:text-text-dark-muted flex flex-wrap gap-x-4 gap-y-1">
                  {parsedData.matchedProduct.strength && (
                    <span><strong>Active Strength:</strong> {parsedData.matchedProduct.strength}</span>
                  )}
                  {parsedData.matchedProduct.dosageForm && (
                    <span><strong>Dosage Form:</strong> {parsedData.matchedProduct.dosageForm}</span>
                  )}
                  {parsedData.matchedProduct.ingredients && (
                    <span><strong>Ingredients:</strong> {parsedData.matchedProduct.ingredients}</span>
                  )}
                </div>
              )}

              {/* Store inventory match indicator */}
              {parsedData.existingInventory && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <BuildingStorefrontIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Live store inventory match: <strong>{parsedData.existingInventory.currentStock} units on hand</strong> (Reorder Point: {parsedData.existingInventory.reorderPoint} units)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    Lead time: {parsedData.existingInventory.leadTimeDays || 3} days
                  </span>
                </div>
              )}

              {parsedData.disclaimer && (
                <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted italic">
                  {parsedData.disclaimer}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300">
              No catalog match found. Using user-entered product identity. You can search verified products above or customize specifications below.
            </div>
          )}

          {/* Customize Product Specifications Section */}
          <div className="border border-surface-light-border dark:border-surface-dark-border rounded-xl p-4 bg-surface-light dark:bg-surface-dark space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-light dark:text-text-dark flex items-center gap-1.5">
                <PencilSquareIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Customize Product Knowledge According to Your Requirement
              </span>
              <button
                type="button"
                onClick={() => setIsCustomizingKnowledge(!isCustomizingKnowledge)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                {isCustomizingKnowledge ? "Hide Details" : "Edit All Specifications"}
              </button>
            </div>

            {/* Always visible confirmed product name */}
            <div>
              <label className="block text-xs font-bold text-text-light-muted dark:text-text-dark-muted mb-1">
                Confirmed Product Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleEnrichSearch(productName)}
                  title="Search verified catalog for this name"
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-brand-500 hover:text-white transition-all flex items-center gap-1 shrink-0"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Lookup Name
                </button>
              </div>

              {/* Direct Store & Search Next Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-surface-light-border dark:border-surface-dark-border">
                <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted">
                  Ready with this product? Store it and search your next item to build a multi-item decision.
                </span>
                <button
                  type="button"
                  disabled={!productName.trim()}
                  onClick={handleStoreAndSearchNext}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {editingStoredIndex !== null ? "Update & Search Next Item" : "+ Store Item & Search Next"}
                </button>
              </div>
            </div>

            {/* Extended editable specifications when toggled */}
            {isCustomizingKnowledge && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={productBrand}
                    onChange={(e) => setProductBrand(e.target.value)}
                    placeholder="e.g. Lay's, Cipla, Amul"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="e.g. Packaged Snacks, Analgesic"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Barcode / GTIN / SKU
                  </label>
                  <input
                    type="text"
                    value={productBarcode}
                    onChange={(e) => setProductBarcode(e.target.value)}
                    placeholder="e.g. 8901491101837"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Pack Size (Units per case)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productPackSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProductPackSize(val);
                      setMinOrderQuantity(val);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Pack Unit
                  </label>
                  <input
                    type="text"
                    value={productPackUnit}
                    onChange={(e) => setProductPackUnit(e.target.value)}
                    placeholder="carton, strip, bag, box"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                    Shelf Life (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={shelfLifeDays}
                    onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Synchronized Decision Record Preview */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckBadgeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Synchronized Decision Record Preview (Carried to Step 3)
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                ✓ Ready for Financial Simulation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted block">Selected Product:</span>
                <span className="font-bold text-text-light dark:text-text-dark truncate block">{productName || "None selected"}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted block">Store Stock on Hand:</span>
                <span className="font-bold text-text-light dark:text-text-dark">{currentStock} units</span>
              </div>
              <div>
                <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted block">Cost / Selling Benchmark:</span>
                <span className="font-bold text-text-light dark:text-text-dark">
                  {currencySym}{unitCost} / {currencySym}{sellingPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted block">Pack / Shelf Life:</span>
                <span className="font-bold text-text-light dark:text-text-dark">
                  {productPackSize} units • {shelfLifeDays}d
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border border-surface-light-border dark:border-surface-dark-border flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Question
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={!productName.trim()}
                onClick={handleStoreAndSearchNext}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                {editingStoredIndex !== null ? "Update & Search Next" : "+ Store Item & Search Next"}
              </button>
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                Confirm & Enter Stock Terms {storedItems.length > 0 && `(${storedItems.length + (productName.trim() && editingStoredIndex === null ? 1 : 0)} Items)`} <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Stock, Supplier Prices & Constraints */}
      {step === 3 && (
        <div className="card p-6 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-light-border dark:border-surface-dark-border gap-2">
            <div>
              <h2 className="text-base font-bold text-text-light dark:text-text-dark">
                Inventory Snapshot, Supplier Terms & Constraints
              </h2>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                {storedItems.length > 1
                  ? `Configuring terms across ${storedItems.length} confirmed products in this decision.`
                  : "Review stock on hand, proposed order quantity, wholesale prices, and sales velocity."}
              </p>
            </div>
            {storedItems.length > 1 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold shrink-0">
                Combined Outlay: {currencySym}{storedItems.reduce((acc, it) => acc + (it.proposedOrderQuantity * it.unitCost), 0).toLocaleString()}
              </span>
            )}
          </div>

          {/* Multi-Item Selector Tabs if more than 1 item */}
          {storedItems.length > 1 && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border space-y-2">
              <span className="text-[11px] font-bold text-text-light-muted dark:text-text-dark-muted block">
                Select product tab to review & customize individual terms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {storedItems.map((itm, idx) => (
                  <button
                    key={itm.id}
                    type="button"
                    onClick={() => {
                      setSelectedTermItemIndex(idx);
                      setProductName(itm.name);
                      setCurrentStock(itm.currentStock);
                      setProposedOrderQuantity(itm.proposedOrderQuantity);
                      setUnitCost(itm.unitCost);
                      setSellingPrice(itm.sellingPrice);
                      setLeadTimeDays(itm.leadTimeDays);
                      setMinOrderQuantity(itm.minOrderQuantity);
                      setAverageDailySales(itm.averageDailySales);
                      setShelfLifeDays(itm.shelfLifeDays);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedTermItemIndex === idx
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700 hover:border-brand-500"
                    }`}
                  >
                    <span>#{idx + 1} {itm.name}</span>
                    <span className="text-[10px] opacity-80 font-normal">({itm.proposedOrderQuantity} units @ {currencySym}{itm.unitCost})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Current Stock on Hand (Units)
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentStock(val);
                  updateStoredTermField("currentStock", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Proposed Order Quantity (Units) *
              </label>
              <input
                type="number"
                value={proposedOrderQuantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProposedOrderQuantity(val);
                  updateStoredTermField("proposedOrderQuantity", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-brand-500 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Avg Daily Sales Velocity (Units/day)
              </label>
              <input
                type="number"
                step="0.5"
                value={averageDailySales}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAverageDailySales(val);
                  updateStoredTermField("averageDailySales", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Wholesale Unit Cost ({currencySym})
              </label>
              <input
                type="number"
                step="0.1"
                value={unitCost}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setUnitCost(val);
                  updateStoredTermField("unitCost", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Retail Selling Price ({currencySym})
              </label>
              <input
                type="number"
                step="0.1"
                value={sellingPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSellingPrice(val);
                  updateStoredTermField("sellingPrice", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                value={leadTimeDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLeadTimeDays(val);
                  updateStoredTermField("leadTimeDays", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Supplier MOQ (Units)
              </label>
              <input
                type="number"
                value={minOrderQuantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMinOrderQuantity(val);
                  updateStoredTermField("minOrderQuantity", val);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Planning Horizon (Days)
              </label>
              <input
                type="number"
                value={planningHorizonDays}
                onChange={(e) => setPlanningHorizonDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Available Working Capital ({currencySym})
              </label>
              <input
                type="number"
                value={availableCash}
                onChange={(e) => setAvailableCash(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                Product Shelf Life (Days)
              </label>
              <input
                type="number"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                placeholder="Leave blank if non-perishable"
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-light-border dark:border-surface-dark-border flex items-center gap-1"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={simulating}
              onClick={handleRunSimulation}
              className="btn-primary px-7 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 shadow-md"
            >
              {simulating ? "Calculating Decision Paths..." : "Simulate Decision"}
              <SparklesIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 3-Path Comparison & Decision Report */}
      {step === 4 && simulationResult && (
        <div className="space-y-6">
          {/* Recommendation Banner */}
          <div className="card p-6 rounded-2xl border-2 border-brand-500 bg-gradient-to-br from-brand-50/50 via-surface-light to-surface-light dark:from-brand-950/20 dark:via-surface-dark dark:to-surface-dark space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-500 text-white font-bold text-xs">
                VERDICT
              </span>
              <h2 className="text-lg font-black text-text-light dark:text-text-dark">
                {simulationResult.recommendationTitle}
              </h2>
            </div>
            <p className="text-sm text-text-light-muted dark:text-text-dark-muted">
              {simulationResult.recommendationSummary}
            </p>
          </div>

          {/* 3 Paths Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Path A */}
            <div className={`card p-5 rounded-2xl border-2 transition-all ${
              simulationResult.recommendedPath === "A" ? "border-brand-500 shadow-lg" : "border-surface-light-border dark:border-surface-dark-border opacity-90"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  PATH A (PROPOSED)
                </span>
                {simulationResult.recommendedPath === "A" && (
                  <CheckCircleIcon className="h-5 w-5 text-brand-500" />
                )}
              </div>
              <h3 className="font-bold text-sm mt-2 text-text-light dark:text-text-dark">
                Order {simulationResult.pathA_Proposed.orderQuantity} Units
              </h3>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Capital Required:</span>
                  <span className="font-bold">{currencySym}{simulationResult.pathA_Proposed.capitalRequired.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Expected Revenue:</span>
                  <span className="font-bold">{currencySym}{simulationResult.pathA_Proposed.expectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Gross Margin:</span>
                  <span className="font-bold text-emerald-600">{simulationResult.pathA_Proposed.grossMarginPct}%</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-1">
                  <span className="font-semibold text-text-light dark:text-text-dark">Net Financial Gain:</span>
                  <span className="font-black text-sm text-brand-600 dark:text-brand-400">
                    {currencySym}{simulationResult.pathA_Proposed.netFinancialGain.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Break-even Units:</span>
                  <span className="font-bold">{simulationResult.pathA_Proposed.breakEvenUnits} units</span>
                </div>
              </div>
            </div>

            {/* Path B */}
            <div className={`card p-5 rounded-2xl border-2 transition-all ${
              simulationResult.recommendedPath === "B" ? "border-brand-500 shadow-lg" : "border-surface-light-border dark:border-surface-dark-border opacity-90"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  PATH B (DO NOT ORDER)
                </span>
                {simulationResult.recommendedPath === "B" && (
                  <CheckCircleIcon className="h-5 w-5 text-brand-500" />
                )}
              </div>
              <h3 className="font-bold text-sm mt-2 text-text-light dark:text-text-dark">
                Order 0 Units (Status Quo)
              </h3>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Capital Required:</span>
                  <span className="font-bold">{currencySym}0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Lost Margin (Stockout):</span>
                  <span className="font-bold text-rose-600">-{currencySym}{simulationResult.pathB_DoNotProceed.lostMarginFromStockouts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Stockout Risk:</span>
                  <span className="font-bold text-rose-500">{simulationResult.pathB_DoNotProceed.stockoutProbabilityPct}%</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-1">
                  <span className="font-semibold text-text-light dark:text-text-dark">Net Financial Gain:</span>
                  <span className="font-black text-sm text-text-light dark:text-text-dark">
                    {currencySym}{simulationResult.pathB_DoNotProceed.netFinancialGain.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Path C */}
            <div className={`card p-5 rounded-2xl border-2 transition-all ${
              simulationResult.recommendedPath === "C" ? "border-brand-500 shadow-lg" : "border-surface-light-border dark:border-surface-dark-border opacity-90"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  PATH C (OPTIMAL ALTERNATIVE)
                </span>
                {simulationResult.recommendedPath === "C" && (
                  <CheckCircleIcon className="h-5 w-5 text-brand-500" />
                )}
              </div>
              <h3 className="font-bold text-sm mt-2 text-text-light dark:text-text-dark">
                Order {simulationResult.pathC_Alternative.orderQuantity} Units
              </h3>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Capital Required:</span>
                  <span className="font-bold">{currencySym}{simulationResult.pathC_Alternative.capitalRequired.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Expected Revenue:</span>
                  <span className="font-bold">{currencySym}{simulationResult.pathC_Alternative.expectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Holding Cost:</span>
                  <span className="font-bold">{currencySym}{simulationResult.pathC_Alternative.holdingCost}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-1">
                  <span className="font-semibold text-text-light dark:text-text-dark">Net Financial Gain:</span>
                  <span className="font-black text-sm text-brand-600 dark:text-brand-400">
                    {currencySym}{simulationResult.pathC_Alternative.netFinancialGain.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights & Evidence */}
          <div className="card p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-3">
            <h3 className="text-sm font-bold text-text-light dark:text-text-dark">
              Evidence-Based Decision Rationale
            </h3>
            <ul className="space-y-1.5 text-xs text-text-light-muted dark:text-text-dark-muted">
              {simulationResult.keyInsights.map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-brand-500 font-bold">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-light-border dark:border-surface-dark-border flex items-center gap-1"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Adjust Parameters
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 flex items-center gap-1.5"
              >
                <DocumentChartBarIcon className="h-4 w-4" /> Save Decision Report
              </button>
              <button
                type="button"
                onClick={handleGenerateWorkflow}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 shadow-lg"
              >
                Open in Workflow Canvas <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
