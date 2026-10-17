import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PrinterIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useBusiness } from "../../context/BusinessContext";

export default function ReportsPage() {
  const { currentBusiness } = useBusiness();
  const businessId = currentBusiness?.id;

  const [activeTab, setActiveTab] = useState<"store_reports" | "excel_exports">("store_reports");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Fetch business decision reports
  const { data: storeReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["decision-reports", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get(`/businesses/${businessId}/dashboard-metrics`);
      return res.data.data?.recentReports || [];
    },
    enabled: Boolean(businessId),
  });

  // Existing decision models for Excel export
  const { data: decisions = [] } = useQuery({
    queryKey: ["decisions"],
    queryFn: async () => {
      const response = await api.get("/decisions", { params: { limit: 50 } });
      return response.data.data?.data || [];
    },
  });

  const exportReport = async (decisionId: string) => {
    try {
      const response = await api.get(`/import-export/export/${decisionId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `decision-report-${decisionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currencySym = currentBusiness?.currencySymbol || "₹";

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Decision Intelligence Reports</h1>
          <p className="body text-sm text-text-light-muted dark:text-text-dark-muted">
            Executive briefs for store owners and Excel exports with complete provenance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("store_reports")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "store_reports"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-text-light-muted"
            }`}
          >
            Store Owner Reports
          </button>
          <button
            onClick={() => setActiveTab("excel_exports")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "excel_exports"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-text-light-muted"
            }`}
          >
            Excel Export Center
          </button>
        </div>
      </div>

      {activeTab === "store_reports" ? (
        <div className="space-y-4">
          {reportsLoading ? (
            <div className="p-8 text-center text-xs text-text-light-muted animate-pulse">
              Loading reports...
            </div>
          ) : storeReports.length === 0 ? (
            <div className="card p-12 text-center rounded-2xl border border-surface-light-border dark:border-surface-dark-border space-y-3">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-brand-500 opacity-60" />
              <h3 className="font-bold text-sm text-text-light dark:text-text-dark">
                No Store Decision Reports Generated Yet
              </h3>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted max-w-md mx-auto">
                Use the <strong>Universal Decision Wizard</strong> to evaluate inventory purchasing questions and generate printable executive reports.
              </p>
              <Link to="/wizard" className="btn-primary inline-flex items-center gap-2 text-xs font-bold">
                <SparklesIcon className="h-4 w-4" /> Open Decision Wizard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeReports.map((r: any) => {
                const metrics = r.financialMetrics ? JSON.parse(r.financialMetrics) : null;
                const pathA = metrics?.pathA_Proposed;

                return (
                  <div
                    key={r.id}
                    className="card p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border hover:border-brand-500 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.recommendation === "proceed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : r.recommendation === "alternative"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}>
                        {r.recommendation.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-text-light-muted">
                        {format(new Date(r.createdAt), "dd MMM yyyy")}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-text-light dark:text-text-dark truncate">
                        {r.title}
                      </h3>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted line-clamp-2 mt-1">
                        "{r.question}"
                      </p>
                    </div>

                    {pathA && (
                      <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-text-light-muted">Order Qty:</span>
                          <span className="font-bold">{pathA.orderQuantity} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-light-muted">Capital Required:</span>
                          <span className="font-bold">{currencySym}{pathA.capitalRequired}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-light-muted">Net Gain:</span>
                          <span className="font-bold text-brand-600 dark:text-brand-400">{currencySym}{pathA.netFinancialGain}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-surface-light-border dark:border-surface-dark-border flex justify-end">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        View Full Brief →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Excel Export Center */
        <div className="card overflow-hidden rounded-2xl border border-surface-light-border dark:border-surface-dark-border">
          <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border font-bold text-sm">
            Available Decisions for Spreadsheet Export
          </div>
          {decisions.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-light-muted">
              No decisions found to export.
            </div>
          ) : (
            <div className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
              {decisions.map((d: any) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover">
                  <div>
                    <h3 className="font-bold text-sm text-text-light dark:text-text-dark">{d.title}</h3>
                    <p className="text-xs text-text-light-muted">{d.question}</p>
                  </div>
                  <button
                    onClick={() => exportReport(d.id)}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Export (.xlsx)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Printable Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl print:max-w-none print:w-full print:p-0 print:border-none">
            <div className="flex items-center justify-between pb-3 border-b border-surface-light-border dark:border-surface-dark-border print:hidden">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                DMOC Executive Brief
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-surface-light-border text-xs font-semibold flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <PrinterIcon className="h-4 w-4" /> Print / Save as PDF
                </button>
                <button onClick={() => setSelectedReport(null)}>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div>
              <div className="text-xs font-mono text-text-light-muted dark:text-text-dark-muted">
                {currentBusiness?.name} • Evaluated on {format(new Date(selectedReport.createdAt), "dd MMMM yyyy")}
              </div>
              <h2 className="text-xl font-black text-text-light dark:text-text-dark mt-1">
                {selectedReport.title}
              </h2>
              <p className="text-sm italic text-text-light-muted dark:text-text-dark-muted mt-0.5">
                "{selectedReport.question}"
              </p>
            </div>

            {/* Verdict */}
            <div className="p-4 rounded-xl border border-brand-500 bg-brand-50/50 dark:bg-brand-900/20">
              <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">
                Recommendation: {selectedReport.recommendation.replace("_", " ")}
              </div>
              <p className="text-sm font-semibold text-text-light dark:text-text-dark mt-1">
                {selectedReport.summaryText}
              </p>
            </div>

            {/* Metrics */}
            {selectedReport.financialMetrics && (
              <div>
                <h4 className="text-xs font-bold text-text-light dark:text-text-dark uppercase tracking-wider mb-2">
                  Simulation Outcome Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {(() => {
                    const m = JSON.parse(selectedReport.financialMetrics);
                    const pA = m?.pathA_Proposed;
                    if (!pA) return null;
                    return (
                      <>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs">
                          <span className="text-text-light-muted block">Capital Required</span>
                          <span className="font-black text-base">{currencySym}{pA.capitalRequired}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs">
                          <span className="text-text-light-muted block">Expected Net Gain</span>
                          <span className="font-black text-base text-brand-600">{currencySym}{pA.netFinancialGain}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs">
                          <span className="text-text-light-muted block">Break-even Units</span>
                          <span className="font-black text-base">{pA.breakEvenUnits} units</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tagline Footer */}
            <div className="pt-3 border-t border-surface-light-border dark:border-surface-dark-border text-center text-xs text-text-light-muted dark:text-text-dark-muted">
              DMOC — "Know the risk. Understand the opportunity. Decide with evidence."
            </div>
          </div>
        </div>
      )}
    </div>
  );
}