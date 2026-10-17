import { useState, useEffect } from "react";
import { XMarkIcon, CheckIcon, ArrowPathIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { WorkflowNodeData } from "./nodeTypes";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

interface PropertiesPanelProps {
  node: WorkflowNodeData | null;
  onUpdate: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
  onSave: (nodeId: string) => void;
  onReset: (nodeId: string) => void;
  isDirty: boolean;
}

interface StoreInventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  dailySalesVelocity?: number;
}

export function PropertiesPanel({ node, onUpdate, onClose, onSave, onReset, isDirty }: PropertiesPanelProps) {
  const [inventoryItems, setInventoryItems] = useState<StoreInventoryItem[]>([]);

  // Fetch store inventory items for linking real store data
  useEffect(() => {
    let active = true;
    const fetchInventory = async () => {
      try {
        // First get active businesses
        const bizRes = await api.get("/inventory-decisions/businesses");
        const businesses = bizRes.data?.data || [];
        if (businesses.length > 0) {
          const bizId = businesses[0].id;
          const invRes = await api.get(`/inventory-decisions/inventory?businessId=${bizId}`);
          if (active && invRes.data?.data) {
            setInventoryItems(invRes.data.data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch store inventory for properties panel:", err);
      }
    };
    fetchInventory();
    return () => {
      active = false;
    };
  }, []);

  if (!node) {
    return (
      <div className="w-80 bg-surface-light border-l border-surface-light-border dark:bg-surface-dark dark:border-surface-dark-border flex flex-col h-full">
        <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border">
          <h2 className="heading-5">Properties</h2>
          <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">Select a node to view and edit its properties</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-text-light-muted dark:text-text-dark-muted text-center text-sm">No node selected on canvas</p>
        </div>
      </div>
    );
  }

  const config = (node.config || {}) as Record<string, any>;

  const handleConfigChange = (key: string, value: unknown) => {
    const nextConfig = { ...config, [key]: value };

    // Auto-compute helper values for store calculations
    if (key === "orderQuantity" || key === "unitCost") {
      const q = key === "orderQuantity" ? Number(value) : Number(nextConfig.orderQuantity || 20);
      const c = key === "unitCost" ? Number(value) : Number(nextConfig.unitCost || 18.5);
      if (!isNaN(q) && !isNaN(c)) {
        nextConfig.capitalRequired = Math.round(q * c);
      }
    }

    if (key === "dailySalesVelocity" || key === "horizonDays") {
      const v = key === "dailySalesVelocity" ? Number(value) : Number(nextConfig.dailySalesVelocity || 4);
      const h = key === "horizonDays" ? Number(value) : Number(nextConfig.horizonDays || 30);
      if (!isNaN(v) && !isNaN(h)) {
        nextConfig.expectedDemand = Math.round(v * h);
      }
    }

    if (key === "sellingPrice" || key === "unitCost") {
      const p = key === "sellingPrice" ? Number(value) : Number(nextConfig.sellingPrice || 24);
      const c = key === "unitCost" ? Number(value) : Number(nextConfig.unitCost || 18);
      if (!isNaN(p) && !isNaN(c) && p > 0) {
        nextConfig.grossMarginPct = +(((p - c) / p) * 100).toFixed(1);
      }
    }

    onUpdate(node.id, { config: nextConfig });
  };

  const handleSelectStoreItem = (item: StoreInventoryItem) => {
    const updates: Record<string, any> = {
      productName: item.name,
      category: item.category,
      unitCost: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      currentStock: item.currentStock,
      reorderPoint: item.reorderLevel,
      dailySalesVelocity: item.dailySalesVelocity || 4,
    };

    if (config.orderQuantity) {
      updates.capitalRequired = Math.round(Number(config.orderQuantity) * item.purchasePrice);
    }

    onUpdate(node.id, {
      label: `${node.label.split(":")[0]}: ${item.name}`,
      config: {
        ...config,
        ...updates,
      },
    });
    toast.success(`Linked to store item: ${item.name}`);
  };

  const isStoreNode = [
    "product_lookup",
    "proposed_purchase",
    "inventory_snapshot",
    "demand_forecast",
    "cost_margin",
    "scenario_branch",
    "recommendation",
    "business_profile",
    "break_even",
    "supplier_quote",
  ].includes(node.type);

  return (
    <div className="w-80 bg-surface-light border-l border-surface-light-border dark:bg-surface-dark dark:border-surface-dark-border flex flex-col h-full shadow-lg">
      <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <h2 className="heading-5 text-sm font-bold truncate text-text-light dark:text-text-dark">{node.label}</h2>
          <p className="text-xs text-text-light-muted dark:text-text-dark-muted capitalize truncate">{node.type.replace(/_/g, " ")}</p>
        </div>
        <button onClick={onClose} className="p-1 text-text-light-muted hover:text-text-light dark:hover:text-text-dark rounded-md">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Basic Settings */}
        <section className="space-y-3">
          <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Node Identification</h3>
          <div>
            <label className="label text-xs font-semibold mb-1 block">Display Name</label>
            <input
              type="text"
              value={node.label}
              onChange={e => onUpdate(node.id, { label: e.target.value })}
              className="input w-full text-xs"
              placeholder="e.g. 2. Product: Paracetamol 650mg"
            />
          </div>
          <div>
            <label className="label text-xs font-semibold mb-1 block">Description / Notes</label>
            <textarea
              value={node.description || ""}
              onChange={e => onUpdate(node.id, { description: e.target.value })}
              className="input w-full min-h-[50px] text-xs"
              rows={2}
              placeholder="Brief rationale for this decision step..."
            />
          </div>
        </section>

        {/* Real Store Item Binder */}
        {isStoreNode && inventoryItems.length > 0 && (
          <section className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
              <BuildingStorefrontIcon className="h-4 w-4" />
              <span>Link with Real Store Inventory</span>
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-400">
              Pick an item from your catalog to instantly bind verified costs, prices & velocities.
            </p>
            <select
              className="input w-full text-xs font-medium bg-white dark:bg-surface-dark border-teal-300 dark:border-teal-700"
              value=""
              onChange={e => {
                const item = inventoryItems.find(i => i.id === e.target.value);
                if (item) handleSelectStoreItem(item);
              }}
            >
              <option value="">Select a catalog product...</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.currentStock} · ₹{item.purchasePrice})
                </option>
              ))}
            </select>
          </section>
        )}

        {/* Store Node Dedicated Form Fields */}
        {node.type === "product_lookup" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Product Data</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Product Name</label>
              <input
                type="text"
                value={config.productName || ""}
                onChange={e => handleConfigChange("productName", e.target.value)}
                className="input w-full text-xs"
                placeholder="Product name"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Category</label>
              <input
                type="text"
                value={config.category || "Fast-moving Inventory"}
                onChange={e => handleConfigChange("category", e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </section>
        )}

        {node.type === "proposed_purchase" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Purchase Order Terms</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Order Quantity (Units)</label>
              <input
                type="number"
                value={config.orderQuantity ?? 20}
                onChange={e => handleConfigChange("orderQuantity", Math.max(1, parseInt(e.target.value) || 0))}
                className="input w-full text-xs"
                min="1"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Wholesale Unit Cost (₹)</label>
              <input
                type="number"
                step="0.1"
                value={config.unitCost ?? 18.5}
                onChange={e => handleConfigChange("unitCost", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border flex items-center justify-between">
              <span className="text-xs text-text-light-muted">Total Capital Required:</span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                ₹{Number(config.capitalRequired ?? (Number(config.orderQuantity || 20) * Number(config.unitCost || 18.5))).toLocaleString()}
              </span>
            </div>
          </section>
        )}

        {node.type === "inventory_snapshot" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Store Stock Status</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Current Stock On Hand</label>
              <input
                type="number"
                value={config.currentStock ?? 10}
                onChange={e => handleConfigChange("currentStock", parseInt(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Minimum Reorder Point (ROP)</label>
              <input
                type="number"
                value={config.reorderPoint ?? 15}
                onChange={e => handleConfigChange("reorderPoint", parseInt(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
          </section>
        )}

        {node.type === "demand_forecast" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Demand & Velocity</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Daily Sales Velocity (Units/day)</label>
              <input
                type="number"
                step="0.1"
                value={config.dailySalesVelocity ?? 4.0}
                onChange={e => handleConfigChange("dailySalesVelocity", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Forecast Horizon (Days)</label>
              <input
                type="number"
                value={config.horizonDays ?? 30}
                onChange={e => handleConfigChange("horizonDays", parseInt(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border flex items-center justify-between">
              <span className="text-xs text-text-light-muted">Expected Horizon Demand:</span>
              <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                {Number(config.expectedDemand ?? (Number(config.dailySalesVelocity || 4) * Number(config.horizonDays || 30)))} units
              </span>
            </div>
          </section>
        )}

        {node.type === "cost_margin" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Cost & Selling Price</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Wholesale Unit Cost (₹)</label>
              <input
                type="number"
                step="0.1"
                value={config.unitCost ?? 18}
                onChange={e => handleConfigChange("unitCost", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Selling Price (₹)</label>
              <input
                type="number"
                step="0.1"
                value={config.sellingPrice ?? 24}
                onChange={e => handleConfigChange("sellingPrice", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <span className="text-xs text-emerald-800 dark:text-emerald-300">Gross Margin %:</span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {config.grossMarginPct ?? (((Number(config.sellingPrice || 24) - Number(config.unitCost || 18)) / Number(config.sellingPrice || 24)) * 100).toFixed(1)}%
              </span>
            </div>
          </section>
        )}

        {node.type === "scenario_branch" && (
          <section className="space-y-3">
            <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Financial Scenario Returns (₹)</h3>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Path A (Proceed with Order)</label>
              <input
                type="number"
                value={config.pathA_Gain ?? 0}
                onChange={e => handleConfigChange("pathA_Gain", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Path B (Do Not Proceed)</label>
              <input
                type="number"
                value={config.pathB_Gain ?? 0}
                onChange={e => handleConfigChange("pathB_Gain", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="label text-xs font-semibold mb-1 block">Path C (Alternative Optimal Quantity)</label>
              <input
                type="number"
                value={config.pathC_Gain ?? 0}
                onChange={e => handleConfigChange("pathC_Gain", parseFloat(e.target.value) || 0)}
                className="input w-full text-xs"
              />
            </div>
          </section>
        )}

        {/* Generic Config Fields for non-customized keys */}
        <section className="space-y-3">
          <h3 className="heading-6 text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">Raw Parameters</h3>
          <div className="space-y-2">
            {Object.keys(config).map(key => {
              // Skip fields already handled above
              const handled = [
                "productName", "category", "orderQuantity", "unitCost",
                "capitalRequired", "currentStock", "reorderPoint",
                "dailySalesVelocity", "horizonDays", "expectedDemand",
                "sellingPrice", "grossMarginPct", "pathA_Gain",
                "pathB_Gain", "pathC_Gain"
              ];
              if (handled.includes(key)) return null;

              const val = config[key];
              if (typeof val === "object" && val !== null) {
                return (
                  <div key={key} className="text-[11px]">
                    <span className="font-semibold block mb-1 text-text-light-muted">{key}</span>
                    <pre className="p-2 rounded bg-surface-light-hover dark:bg-surface-dark-hover text-[10px] overflow-auto max-h-24">
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  </div>
                );
              }

              return (
                <div key={key}>
                  <label className="label text-xs font-semibold mb-0.5 block">{key}</label>
                  <input
                    type={typeof val === "number" ? "number" : "text"}
                    value={String(val ?? "")}
                    onChange={e => handleConfigChange(key, typeof val === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
                    className="input w-full text-xs"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Node Status Info */}
        <section className="pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
          <div className="flex justify-between text-xs text-text-light-muted">
            <span>Execution Status:</span>
            <span className={clsx(
              "font-bold uppercase text-[10px] px-1.5 py-0.5 rounded",
              node.status === "success" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
              node.status === "running" ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300" :
              node.status === "error" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            )}>
              {node.status || "idle"}
            </span>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-surface-light-border dark:border-surface-dark-border flex gap-2">
        <button
          onClick={() => onReset(node.id)}
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
          disabled={!isDirty}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reset
        </button>
        <button
          onClick={() => onSave(node.id)}
          className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
          disabled={!isDirty}
        >
          <CheckIcon className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}