import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../utils/api";
import { useBusiness } from "../../context/BusinessContext";

export default function InventoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentBusiness } = useBusiness();

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("all"); // all, low_stock, out_of_stock, near_expiry
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Dedicated Refill Modal states
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillProduct, setRefillProduct] = useState<any>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(10);
  const [refillReason, setRefillReason] = useState("");

  // Bulk Refill Modal states
  const [isBulkRefillModalOpen, setIsBulkRefillModalOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<{ productId: string; name: string; currentStock: number; reorderPoint: number; quantity: number; unitPrice: number; unit: string }[]>([]);

  // New product form states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("General");
  const unit = "pcs";
  const [packSize, setPackSize] = useState<number>(1);
  const [packUnit, setPackUnit] = useState("pack");
  const [purchasePrice, setPurchasePrice] = useState<number>(15);
  const [packPurchasePrice, setPackPurchasePrice] = useState<number>(15);
  const [sellingPrice, setSellingPrice] = useState<number>(20);
  const [stockOnHand, setStockOnHand] = useState<number>(20);
  const [reorderPoint, setReorderPoint] = useState<number>(10);
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<any[]>([]);

  // Adjustment states
  const [adjustType, setAdjustType] = useState<"purchase" | "sale" | "adjustment" | "waste_spoilage">("purchase");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState("");

  const businessId = currentBusiness?.id;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", businessId, search, stockStatus],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get("/products", {
        params: {
          businessId,
          search: search || undefined,
          stockStatus: stockStatus !== "all" ? stockStatus : undefined,
        },
      });
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });

  // External catalog lookup
  const handleExternalSearch = async () => {
    if (!name && !barcode) return;
    setSearchingExternal(true);
    try {
      const res = await api.get("/products/search-external", {
        params: {
          q: name || undefined,
          barcode: barcode || undefined,
          categoryType: currentBusiness?.type,
        },
      });
      if (res.data.success) {
        setExternalResults(res.data.data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingExternal(false);
    }
  };

  const applyExternalResult = (r: any) => {
    setName(r.name);
    if (r.brand) setBrand(r.brand);
    if (r.barcode) setBarcode(r.barcode);
    if (r.category) setCategory(r.category);
    if (r.packSize) setPackSize(r.packSize);
    if (r.packUnit) setPackUnit(r.packUnit);
    if (r.estimatedWholesalePrice) {
      setPurchasePrice(r.estimatedWholesalePrice);
      setPackPurchasePrice(r.estimatedWholesalePrice * (r.packSize || 1));
    }
    if (r.suggestedRetailPrice) setSellingPrice(r.suggestedRetailPrice);
    setExternalResults([]);
  };

  // Add product mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/products", {
        businessId,
        name,
        brand,
        barcode,
        category,
        unit,
        packSize: Number(packSize),
        packUnit,
        purchasePrice: Number(purchasePrice),
        packPurchasePrice: Number(packPurchasePrice),
        sellingPrice: Number(sellingPrice),
        stockOnHand: Number(stockOnHand),
        reorderPoint: Number(reorderPoint),
        expiryDate: expiryDate || undefined,
        batchNumber: batchNumber || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard-metrics"] });
      setIsAddModalOpen(false);
    },
  });

  // Record stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/inventory/movements", {
        businessId,
        productId: selectedProduct.id,
        type: adjustType,
        quantity: Number(adjustQuantity),
        reason: adjustReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard-metrics"] });
      setIsAdjustModalOpen(false);
    },
  });

  // Open single product refill modal
  const openRefillModal = (p: any) => {
    setRefillProduct(p);
    const deficit = Math.max(1, (p.reorderPoint || 10) - (p.stockOnHand || 0));
    setRefillQuantity(deficit);
    setRefillReason(`Restock to required safe threshold (+${deficit} ${p.unit})`);
    setIsRefillModalOpen(true);
  };

  // Single product refill mutation
  const refillStockMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/inventory/movements", {
        businessId,
        productId: refillProduct.id,
        type: "purchase",
        quantity: Number(refillQuantity),
        reason: refillReason || "Stock replenishment to requirement",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard-metrics"] });
      setIsRefillModalOpen(false);
    },
  });

  // Open bulk refill modal
  const openBulkRefillModal = () => {
    const depleted = (products as any[]).filter((p) => p.stockOnHand <= p.reorderPoint);
    const items = depleted.map((p) => {
      const deficit = Math.max(1, p.reorderPoint - p.stockOnHand);
      return {
        productId: p.id,
        name: p.name,
        currentStock: p.stockOnHand,
        reorderPoint: p.reorderPoint,
        quantity: deficit,
        unitPrice: p.purchasePrice,
        unit: p.unit,
      };
    });
    setBulkItems(items);
    setIsBulkRefillModalOpen(true);
  };

  // Bulk refill mutation
  const bulkRefillMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/inventory/bulk-refill", {
        businessId,
        items: bulkItems.map((bi) => ({
          productId: bi.productId,
          quantity: bi.quantity,
        })),
        reason: "Bulk replenishment to reorder thresholds",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard-metrics"] });
      setIsBulkRefillModalOpen(false);
    },
  });

  const currencySym = currentBusiness?.currencySymbol || "₹";

  const lowStockCount = (products as any[]).filter((p) => p.stockOnHand <= p.reorderPoint).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Products & Inventory Catalog</h1>
          <p className="body text-sm text-text-light-muted dark:text-text-dark-muted">
            Manage barcodes, unit & pack conversions, purchase costs, and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button
              onClick={openBulkRefillModal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              title="Refill all depleted items to safe thresholds"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refill All Low Stock ({lowStockCount})
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters & Status Tabs */}
      <div className="card p-4 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-text-light-muted dark:text-text-dark-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, brand, barcode, or SKU..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Items" },
              { id: "low_stock", label: "Low Stock" },
              { id: "out_of_stock", label: "Stockouts" },
              { id: "near_expiry", label: "Near Expiry" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  stockStatus === tab.id
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-text-light-muted hover:text-text-light"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden rounded-2xl border border-surface-light-border dark:border-surface-dark-border">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-light-muted dark:text-text-dark-muted animate-pulse">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-light-muted dark:text-text-dark-muted">
            No products found matching your filters. Click <strong>Add Product</strong> to add your first inventory item!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-surface-light-border dark:border-surface-dark-border text-text-light-muted dark:text-text-dark-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Product & Brand</th>
                  <th className="p-3.5">Barcode / Category</th>
                  <th className="p-3.5">Pack & Unit</th>
                  <th className="p-3.5">Cost vs Price</th>
                  <th className="p-3.5">Stock on Hand</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                {products.map((p: any) => {
                  const isStockout = p.stockOnHand <= 0;
                  const isLow = p.stockOnHand > 0 && p.stockOnHand <= p.reorderPoint;
                  const isNearExpiry = p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const marginPct = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : "0";

                  return (
                    <tr key={p.id} className="hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors">
                      <td className="p-3.5 font-bold text-text-light dark:text-text-dark">
                        <div className="flex items-center gap-1.5">
                          {p.regulatoryStatus === "verified" && (
                            <span title="Verified Catalog Item">
                              <ShieldCheckIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                            </span>
                          )}
                          <div>
                            <div className="truncate max-w-[200px]">{p.name}</div>
                            {p.brand && (
                              <div className="text-[10px] font-normal text-text-light-muted dark:text-text-dark-muted">
                                {p.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-text-light-muted dark:text-text-dark-muted">
                        <div>{p.category || "General"}</div>
                        {p.barcode && <div className="text-[10px] font-mono">{p.barcode}</div>}
                      </td>

                      <td className="p-3.5 text-text-light dark:text-text-dark">
                        <div>
                          {p.packSize > 1 ? `${p.packSize} ${p.unit} / ${p.packUnit || "pack"}` : `1 ${p.unit}`}
                        </div>
                        {p.packPurchasePrice && (
                          <div className="text-[10px] text-text-light-muted dark:text-text-dark-muted">
                            Pack: {currencySym}{p.packPurchasePrice}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-text-light dark:text-text-dark">
                        <div className="font-semibold">
                          {currencySym}{p.purchasePrice} → {currencySym}{p.sellingPrice}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {marginPct}% margin
                        </div>
                      </td>

                      <td className="p-3.5 text-text-light dark:text-text-dark">
                        <div className="font-black text-sm">
                          {p.stockOnHand} <span className="text-[10px] font-normal text-text-light-muted">{p.unit}</span>
                        </div>
                        <div className="text-[10px] text-text-light-muted">
                          Reorder at: {p.reorderPoint}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isStockout ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            In Stock
                          </span>
                        )}
                        {isNearExpiry && (
                          <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                            Expires soon
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => openRefillModal(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 ${
                            p.stockOnHand <= p.reorderPoint
                              ? "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20"
                              : "bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950"
                          }`}
                          title={`Refill stock for ${p.name}`}
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          Refill Stock
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-text-light-muted dark:text-text-dark-muted hover:text-text-light hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-light-border dark:border-surface-dark-border">
              <h3 className="text-base font-bold text-text-light dark:text-text-dark">
                Add New Inventory Item
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Quick barcode / provider lookup */}
            <div className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 space-y-2">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                <SparklesIcon className="h-4 w-4" /> Live Catalog Search (Open Food Facts & Pharmacy Reference)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Barcode or product query (e.g. Dolo 650, Atta, Lay's)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
                <button
                  type="button"
                  onClick={handleExternalSearch}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white shrink-0 hover:bg-brand-700"
                >
                  {searchingExternal ? "Searching..." : "Lookup"}
                </button>
              </div>

              {externalResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                  {externalResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => applyExternalResult(r)}
                      className="p-2 rounded-lg bg-surface-light dark:bg-surface-dark border border-brand-300 hover:border-brand-500 cursor-pointer text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold">{r.name}</span>
                        <span className="text-[10px] text-text-light-muted ml-2">({r.sourceProvider})</span>
                      </div>
                      <span className="text-brand-600 font-bold text-[10px]">Auto-Fill →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Pack Size (Units)</label>
                <input
                  type="number"
                  value={packSize}
                  onChange={(e) => {
                    const ps = Number(e.target.value) || 1;
                    setPackSize(ps);
                    setPurchasePrice(+(packPurchasePrice / ps).toFixed(2));
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Pack Wholesale ({currencySym})</label>
                <input
                  type="number"
                  value={packPurchasePrice}
                  onChange={(e) => {
                    const pp = Number(e.target.value);
                    setPackPurchasePrice(pp);
                    setPurchasePrice(+(pp / (packSize || 1)).toFixed(2));
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Unit Cost ({currencySym})</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Selling Price ({currencySym})</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Starting Stock</label>
                <input
                  type="number"
                  value={stockOnHand}
                  onChange={(e) => setStockOnHand(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reorder Point</label>
                <input
                  type="number"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Batch Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-X"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim() || createProductMutation.isPending}
                onClick={() => createProductMutation.mutate()}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                {createProductMutation.isPending ? "Adding..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-light-border dark:border-surface-dark-border">
              <h3 className="text-sm font-bold text-text-light dark:text-text-dark">
                Adjust Stock: {selectedProduct.name}
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Adjustment Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none font-semibold"
              >
                <option value="purchase">Purchase Received (+ Add)</option>
                <option value="sale">Recorded Sale (- Subtract)</option>
                <option value="waste_spoilage">Damaged / Expired (- Waste)</option>
                <option value="adjustment">Stock Count Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Reason / Note</label>
              <input
                type="text"
                placeholder="e.g. Delivery from Metro FMCG, weekly recount"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjustStockMutation.isPending}
                onClick={() => adjustStockMutation.mutate()}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                {adjustStockMutation.isPending ? "Recording..." : "Confirm Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Refill Stock Modal */}
      {isRefillModalOpen && refillProduct && (() => {
        const deficit = Math.max(0, (refillProduct.reorderPoint || 0) - (refillProduct.stockOnHand || 0));
        const newStock = (refillProduct.stockOnHand || 0) + (refillQuantity || 0);
        const capitalOutlay = (refillQuantity || 0) * (refillProduct.purchasePrice || 0);
        const estimatedRevenue = (refillQuantity || 0) * (refillProduct.sellingPrice || 0);
        const estimatedProfit = estimatedRevenue - capitalOutlay;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-light-border dark:border-surface-dark-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                      <ArrowPathIcon className="h-4 w-4" />
                    </span>
                    <h3 className="text-base font-bold text-text-light dark:text-text-dark">
                      Refill Stock: {refillProduct.name}
                    </h3>
                  </div>
                  <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-0.5">
                    {refillProduct.brand ? `${refillProduct.brand} • ` : ""}{refillProduct.category || "General"}
                  </p>
                </div>
                <button
                  onClick={() => setIsRefillModalOpen(false)}
                  className="p-1 rounded-lg text-text-light-muted hover:text-text-light"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Requirement Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                  <div className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted">Current Stock</div>
                  <div className={`text-base font-black ${refillProduct.stockOnHand <= 0 ? "text-rose-600 dark:text-rose-400" : "text-text-light dark:text-text-dark"}`}>
                    {refillProduct.stockOnHand} <span className="text-[10px] font-normal text-text-light-muted">{refillProduct.unit}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                  <div className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted">Reorder Threshold</div>
                  <div className="text-base font-black text-text-light dark:text-text-dark">
                    {refillProduct.reorderPoint} <span className="text-[10px] font-normal text-text-light-muted">{refillProduct.unit}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Required Deficit</div>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400">
                    +{deficit} <span className="text-[10px] font-normal text-amber-700/80">{refillProduct.unit}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-light dark:text-text-dark">
                  Refill Quantity According to Requirement
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRefillQuantity(Math.max(1, refillQuantity - 5))}
                    className="px-3 py-2 text-sm font-bold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefillQuantity(Math.max(1, refillQuantity - 1))}
                    className="px-3 py-2 text-sm font-bold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-3 py-2 text-center text-lg rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-black outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setRefillQuantity(refillQuantity + 1)}
                    className="px-3 py-2 text-sm font-bold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefillQuantity(refillQuantity + 5)}
                    className="px-3 py-2 text-sm font-bold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100"
                  >
                    +5
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-text-light-muted">Presets:</span>
                  {deficit > 0 && (
                    <button
                      type="button"
                      onClick={() => setRefillQuantity(deficit)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                    >
                      Fill Deficit (+{deficit})
                    </button>
                  )}
                  {refillProduct.packSize > 1 && (
                    <button
                      type="button"
                      onClick={() => setRefillQuantity(refillProduct.packSize)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-gray-200 transition-colors"
                    >
                      1 Carton (+{refillProduct.packSize})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRefillQuantity(Math.max(10, deficit * 2))}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-gray-200 transition-colors"
                  >
                    2x Buffer (+{Math.max(10, deficit * 2)})
                  </button>
                </div>
              </div>

              {/* Financial & Stock Preview */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-text-light-muted dark:text-text-dark-muted">New Stock After Refill:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {newStock} {refillProduct.unit} {newStock >= refillProduct.reorderPoint ? "(Above Reorder Level ✓)" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Wholesale Capital Outlay:</span>
                  <span className="font-bold text-text-light dark:text-text-dark">
                    {currencySym}{capitalOutlay.toLocaleString()} ({currencySym}{refillProduct.purchasePrice}/{refillProduct.unit})
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-text-light-muted dark:text-text-dark-muted">Projected Gross Profit:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{currencySym}{estimatedProfit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-[11px] font-medium text-text-light-muted dark:text-text-dark-muted mb-1">
                  Supplier Delivery Note / PO Reference
                </label>
                <input
                  type="text"
                  value={refillReason}
                  onChange={(e) => setRefillReason(e.target.value)}
                  placeholder="e.g. Replenishment shipment received from distributor"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-light-border dark:border-surface-dark-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsRefillModalOpen(false);
                    navigate("/wizard");
                  }}
                  className="px-3 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  title="Simulate this purchase decision in the Universal Decision Wizard"
                >
                  <SparklesIcon className="h-4 w-4" /> Simulate in Wizard →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRefillModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border text-text-light-muted hover:text-text-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={refillStockMutation.isPending || refillQuantity <= 0}
                    onClick={() => refillStockMutation.mutate()}
                    className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {refillStockMutation.isPending
                      ? "Refilling..."
                      : `Confirm Refill (+${refillQuantity} ${refillProduct.unit})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Refill All Low Stock Modal */}
      {isBulkRefillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-light-border dark:border-surface-dark-border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <ArrowPathIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-text-light dark:text-text-dark">
                    Refill All Low Stock Items ({bulkItems.length} Products)
                  </h3>
                  <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                    Replenish each depleted product to its required threshold level
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBulkRefillModalOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Table of items to refill */}
            <div className="overflow-x-auto border border-surface-light-border dark:border-surface-dark-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-surface-light-border dark:border-surface-dark-border text-text-light-muted uppercase font-bold">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Current</th>
                    <th className="p-3">Threshold</th>
                    <th className="p-3">Refill Qty</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                  {bulkItems.map((item, idx) => {
                    const subtotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="p-3 font-bold text-text-light dark:text-text-dark">
                          {item.name}
                        </td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="p-3 text-text-light-muted">
                          {item.reorderPoint} {item.unit}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setBulkItems((prev) =>
                                prev.map((bi, i) => (i === idx ? { ...bi, quantity: val } : bi))
                              );
                            }}
                            className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark outline-none text-center"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-text-light dark:text-text-dark">
                          {currencySym}{subtotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border flex items-center justify-between text-xs font-bold">
              <span>Total Working Capital Required:</span>
              <span className="text-base font-black text-brand-600 dark:text-brand-400">
                {currencySym}
                {bulkItems.reduce((acc, bi) => acc + bi.quantity * bi.unitPrice, 0).toLocaleString()}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-surface-light-border dark:border-surface-dark-border">
              <button
                type="button"
                onClick={() => setIsBulkRefillModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border text-text-light-muted hover:text-text-light"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkRefillMutation.isPending || bulkItems.length === 0}
                onClick={() => bulkRefillMutation.mutate()}
                className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {bulkRefillMutation.isPending ? "Refilling All Items..." : "Confirm All Refills"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
