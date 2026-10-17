import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import api from "../../utils/api";
import { useBusiness } from "../../context/BusinessContext";

export const SalesPage = () => {
  const queryClient = useQueryClient();
  const { currentBusiness } = useBusiness();
  const businessId = currentBusiness?.id;

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [forecastProductId, setForecastProductId] = useState<string>("");
  const [quantitySold, setQuantitySold] = useState<number>(5);
  const [unitPrice, setUnitPrice] = useState<number>(20);
  const [wasStockoutSuppressed, setWasStockoutSuppressed] = useState(false);
  const channel = "in_store";

  // Fetch sales records
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["sales", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get("/sales", { params: { businessId } });
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get("/products", { params: { businessId } });
      return res.data.data;
    },
    enabled: Boolean(businessId),
  });

  // Fetch statistical forecast for selected product
  const activeForecastId = forecastProductId || (products.length > 0 ? products[0].id : "");

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ["sales-forecast", activeForecastId],
    queryFn: async () => {
      if (!activeForecastId) return null;
      const res = await api.get(`/sales/forecast/${activeForecastId}`);
      return res.data.data;
    },
    enabled: Boolean(activeForecastId),
  });

  // Record sale mutation
  const recordSaleMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/sales", {
        businessId,
        productId: selectedProductId,
        quantitySold: Number(quantitySold),
        unitPrice: Number(unitPrice),
        wasStockoutSuppressed,
        channel,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-forecast"] });
      queryClient.invalidateQueries({ queryKey: ["business-dashboard-metrics"] });
      setIsRecordModalOpen(false);
    },
  });

  const currencySym = currentBusiness?.currencySymbol || "₹";
  const fc = forecastData?.forecast;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Sales History & Demand Forecasting</h1>
          <p className="body text-sm text-text-light-muted dark:text-text-dark-muted">
            Track daily sales velocity, normalize stockouts, and project inventory replenishment needs
          </p>
        </div>
        <button
          onClick={() => {
            if (products.length > 0) setSelectedProductId(products[0].id);
            setIsRecordModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" /> Record Sales Transaction
        </button>
      </div>

      {/* Demand Forecasting Engine Section */}
      <div className="card p-6 rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-light-border dark:border-surface-dark-border">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <ChartBarIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-light dark:text-text-dark">
                Demand Forecasting Model
              </h2>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                Stationary Poisson-Gaussian velocity with cycle service level safety stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
              Select Product:
            </label>
            <select
              value={activeForecastId}
              onChange={(e) => setForecastProductId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
            >
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {forecastLoading ? (
          <div className="py-8 text-center text-xs text-text-light-muted dark:text-text-dark-muted animate-pulse">
            Computing empirical demand distribution...
          </div>
        ) : fc ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                <span className="text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted block">
                  Daily Sales Velocity
                </span>
                <div className="text-2xl font-black mt-1 text-text-light dark:text-text-dark">
                  {fc.stockoutAdjustedDailyVelocity} <span className="text-xs font-normal">units/day</span>
                </div>
                <div className="text-[10px] text-text-light-muted mt-1">
                  Weekly: ~{fc.weeklySalesVelocity} units
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                <span className="text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted block">
                  30-Day Demand Forecast
                </span>
                <div className="text-2xl font-black mt-1 text-brand-600 dark:text-brand-400">
                  {fc.expectedDemandBase} <span className="text-xs font-normal">units</span>
                </div>
                <div className="text-[10px] text-text-light-muted mt-1">
                  Range: {fc.expectedDemandConservative} – {fc.expectedDemandOptimistic} units
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                <span className="text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted block">
                  Recommended Reorder Point
                </span>
                <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
                  {fc.reorderPointRecommended} <span className="text-xs font-normal">units</span>
                </div>
                <div className="text-[10px] text-text-light-muted mt-1">
                  Safety stock: {fc.safetyStockRecommended} units
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                <span className="text-[11px] font-semibold text-text-light-muted dark:text-text-dark-muted block">
                  Stock Depletion
                </span>
                <div className="text-2xl font-black mt-1 text-text-light dark:text-text-dark">
                  {fc.daysUntilStockout} <span className="text-xs font-normal">days</span>
                </div>
                <div className="text-[10px] text-text-light-muted mt-1">
                  Lead time: {fc.leadTimeDays} days
                </div>
              </div>
            </div>

            {/* Warnings or backtest info */}
            {fc.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                {fc.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 font-bold">
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-text-light-muted dark:text-text-dark-muted flex flex-wrap gap-4 pt-1">
              <span>Model: <strong>{fc.modelName}</strong></span>
              <span>Backtest MAE: <strong>{fc.backtestMAE}</strong></span>
              <span>Confidence: <strong className="capitalize text-emerald-600 dark:text-emerald-400">{fc.confidenceRating}</strong></span>
              <span>Normalized Stockout Days: <strong>{fc.stockoutDaysCount}</strong></span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-light-muted text-center py-4">
            Select a product above to generate demand forecasting analytics.
          </div>
        )}
      </div>

      {/* Sales Transactions Table */}
      <div className="card overflow-hidden rounded-2xl border border-surface-light-border dark:border-surface-dark-border">
        <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border font-bold text-sm">
          Recent Sales History Records
        </div>

        {salesLoading ? (
          <div className="p-8 text-center text-xs text-text-light-muted animate-pulse">
            Loading sales history...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-light-muted">
            No sales logged yet. Record a sale to start building your store's velocity baseline!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-surface-light-border dark:border-surface-dark-border text-text-light-muted font-bold uppercase">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Quantity Sold</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Total Sales</th>
                  <th className="p-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover">
                    <td className="p-3 text-text-light-muted font-mono">
                      {format(new Date(s.date), "dd MMM yyyy")}
                    </td>
                    <td className="p-3 font-bold text-text-light dark:text-text-dark">
                      {s.product?.name || "Product"}
                    </td>
                    <td className="p-3 font-semibold">
                      {s.quantitySold} units
                      {s.wasStockoutSuppressed && (
                        <span className="ml-2 text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded font-bold">
                          Stockout day
                        </span>
                      )}
                    </td>
                    <td className="p-3">{currencySym}{s.unitPrice}</td>
                    <td className="p-3 font-bold text-emerald-600">{currencySym}{s.totalAmount}</td>
                    <td className="p-3 capitalize text-text-light-muted">{s.channel.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-light-border dark:border-surface-dark-border">
              <h3 className="text-base font-bold text-text-light dark:text-text-dark">Record Sales Transaction</h3>
              <button onClick={() => setIsRecordModalOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const found = products.find((p: any) => p.id === e.target.value);
                  if (found) setUnitPrice(found.sellingPrice);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none font-bold"
              >
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stockOnHand})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Units Sold</label>
                <input
                  type="number"
                  value={quantitySold}
                  onChange={(e) => setQuantitySold(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price per Unit ({currencySym})</label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-light dark:text-text-dark">
                <input
                  type="checkbox"
                  checked={wasStockoutSuppressed}
                  onChange={(e) => setWasStockoutSuppressed(e.target.checked)}
                  className="rounded text-brand-500"
                />
                <span>Was demand suppressed by a stockout on this day?</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-surface-light-border dark:border-surface-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordSaleMutation.isPending}
                onClick={() => recordSaleMutation.mutate()}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                {recordSaleMutation.isPending ? "Recording..." : "Log Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
