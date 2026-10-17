import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  InformationCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  ScaleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import api from "../../utils/api";
import { DashboardStats } from "@decisionos/shared";
import { useBusiness } from "../../context/BusinessContext";

export default function DashboardPage() {
  const { currentBusiness, setShowOnboarding } = useBusiness();
  const [isBusinessDetailsOpen, setIsBusinessDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"pl" | "investment" | "profile">("pl");

  // Existing decision stats query
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/decisions/stats");
      return response.data.data;
    },
  });

  // Business-specific live KPI metrics
  const { data: bizMetrics, isLoading: bizLoading } = useQuery({
    queryKey: ["business-dashboard-metrics", currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness?.id) return null;
      const response = await api.get(`/businesses/${currentBusiness.id}/dashboard-metrics`);
      return response.data.data;
    },
    enabled: Boolean(currentBusiness?.id),
  });

  const currencySym = currentBusiness?.currencySymbol || "₹";

  if (statsLoading || bizLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="card p-6 h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const isPharmacy = currentBusiness?.type === "pharmacy";
  const isGrocery = currentBusiness?.type === "grocery" || currentBusiness?.type === "quick_commerce";
  const isPerishableBusiness = isPharmacy || isGrocery || currentBusiness?.type === "restaurant";

  return (
    <div className="space-y-8 pb-12">
      {/* Sample Workspace Banner */}
      {currentBusiness?.isSample && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs">SAMPLE</span>
            <div>
              <h4 className="text-sm font-bold text-text-light dark:text-text-dark">
                Demo Benchmark Workspace ({currentBusiness.name})
              </h4>
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                Pre-populated with realistic inventory, supplier quotes, and sales velocities for training and simulation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-all shrink-0"
          >
            Create Your Real Business
          </button>
        </div>
      )}

      {/* Header with Ambient Aurora Glass Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600/10 via-indigo-600/5 to-cyan-500/10 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="heading-2 font-black tracking-tight">{currentBusiness ? currentBusiness.name : "DMOC Workspace"}</h1>
            {currentBusiness && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/15 text-brand-600 dark:text-cyan-300 border border-brand-500/30 capitalize tracking-wide">
                {currentBusiness.type.replace("_", " ")}
              </span>
            )}
            <button
              onClick={() => setIsBusinessDetailsOpen(true)}
              className="p-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 text-brand-600 dark:text-brand-400 hover:text-white border border-brand-500/20 transition-all shadow-xs group"
              title="Open Full Business Profile & P&L Statement"
            >
              <BuildingStorefrontIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={() => setIsBusinessDetailsOpen(true)}
              className="px-3 py-1 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 hover:border-brand-500 text-text-light dark:text-text-dark flex items-center gap-1.5 shadow-xs transition-all backdrop-blur-md"
            >
              <InformationCircleIcon className="h-3.5 w-3.5 text-brand-500" />
              Store Details & Ledger
            </button>
          </div>
          <p className="body mt-1.5 text-sm text-text-light-muted dark:text-text-dark-muted font-medium">
            Know the risk. Understand the opportunity. Decide with evidence.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/wizard"
            className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
          >
            <SparklesIcon className="h-4 w-4" />
            Decision Wizard
          </Link>
          <Link to="/decisions/new" className="btn-secondary flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New Decision
          </Link>
        </div>
      </div>

      {/* Capital Investment, Spending & P&L Performance Suite */}
      {bizMetrics && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted flex items-center gap-1.5">
              <BanknotesIcon className="h-4 w-4 text-emerald-500" />
              Capital Investment, Spending & P&L Performance
            </h2>
            <button
              onClick={() => {
                setDetailsTab("pl");
                setIsBusinessDetailsOpen(true);
              }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Full P&L Record & Ledger →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Capital Invested */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Total Capital Invested
                </span>
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <BanknotesIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark">
                {currencySym}{(bizMetrics.totalWorkingCapitalInvested || (bizMetrics.totalInventoryValue + bizMetrics.monthlyOperationalCost)).toLocaleString()}
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>Stock: {currencySym}{bizMetrics.totalInventoryValue.toLocaleString()}</span>
                <span>Ops: {currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Total Spending This Month */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border bg-gradient-to-br from-amber-500/5 via-transparent to-transparent shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Spending This Month
                </span>
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <CreditCardIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark">
                {currencySym}{(bizMetrics.totalSpendingThisMonth || (bizMetrics.monthlyCOGS + bizMetrics.monthlyOperationalCost)).toLocaleString()}
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>COGS: {currencySym}{(bizMetrics.monthlyCOGS || 0).toLocaleString()}</span>
                <span>Fixed: {currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Total Return on Investment (ROI) */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Return on Capital (ROI)
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                {bizMetrics.returnOnInvestmentPct ?? 0}%
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>Gross Gain: +{currencySym}{bizMetrics.grossProfit.toLocaleString()}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </motion.div>

            {/* Full Record Profit & Loss (P&L) */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border bg-gradient-to-br from-purple-500/5 via-transparent to-transparent shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Full P&L Record (Net)
                </span>
                <div className={`p-2 rounded-xl ${
                  bizMetrics.estimatedNetProfit >= 0
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                }`}>
                  <ScaleIcon className="h-5 w-5" />
                </div>
              </div>
              <div className={`text-2xl font-black mt-2 ${
                bizMetrics.estimatedNetProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                {bizMetrics.estimatedNetProfit >= 0 ? "+" : ""}{currencySym}{bizMetrics.estimatedNetProfit.toLocaleString()}
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>Revenue: {currencySym}{bizMetrics.monthlyRevenue.toLocaleString()}</span>
                <button
                  onClick={() => {
                    setDetailsTab("pl");
                    setIsBusinessDetailsOpen(true);
                  }}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View P&L →
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Business Operational & Inventory KPIs */}
      {bizMetrics && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted flex items-center gap-1.5">
              <CurrencyDollarIcon className="h-4 w-4 text-brand-500" />
              Business Financial & Inventory KPIs
            </h2>
            <Link to="/inventory" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              View Inventory Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Inventory Value & Cash Tied Up */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Inventory Value
                </span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ArchiveBoxIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark">
                {currencySym}{bizMetrics.totalInventoryValue.toLocaleString()}
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>{bizMetrics.totalStockOnHand} units on hand</span>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Cash tied up</span>
              </div>
            </motion.div>

            {/* Monthly Revenue & Gross Profit */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  30-Day Sales & Margin
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark">
                {currencySym}{bizMetrics.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                <span>Gross: {currencySym}{bizMetrics.grossProfit.toLocaleString()}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {bizMetrics.grossMarginPct}% margin
                </span>
              </div>
            </motion.div>

            {/* Estimated Net Profit */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card card-3d p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Est. Net Profit
                </span>
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark">
                {currencySym}{bizMetrics.estimatedNetProfit.toLocaleString()}
              </div>
              <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted mt-1 truncate" title="Gross Profit minus monthly fixed operational overhead">
                After {currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()} fixed overhead
              </p>
            </motion.div>

            {/* Inventory Alerts (Stockouts & Low Stock) */}
            <motion.div
              whileHover={{ y: -2 }}
              className="card p-5 rounded-2xl border border-surface-light-border dark:border-surface-dark-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-light-muted dark:text-text-dark-muted">
                  Purchasing Alerts
                </span>
                <div className={`p-2 rounded-xl ${
                  bizMetrics.stockoutCount > 0
                    ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                }`}>
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-text-light dark:text-text-dark flex items-baseline gap-2">
                <span className={bizMetrics.stockoutCount > 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                  {bizMetrics.stockoutCount}
                </span>
                <span className="text-sm font-normal text-text-light-muted dark:text-text-dark-muted">stockout</span>
                <span className="text-lg font-bold text-amber-500 ml-2">{bizMetrics.lowStockCount}</span>
                <span className="text-sm font-normal text-text-light-muted dark:text-text-dark-muted">low</span>
              </div>
              <div className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 flex items-center justify-between">
                {isPerishableBusiness && bizMetrics.nearExpiryCount > 0 ? (
                  <span className="text-rose-500 font-semibold">{bizMetrics.nearExpiryCount} near expiry</span>
                ) : (
                  <span>Reorder threshold monitored</span>
                )}
                <Link to="/inventory?status=low_stock" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                  Reorder →
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Decision Intelligence Hub Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted">
          Decision Intelligence & Scenarios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/decisions" className="card p-6 rounded-2xl hover:border-brand-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted">
                Total Decisions
              </span>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <DocumentTextIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-text-light dark:text-text-dark">
              {stats?.totalDecisions ?? 0}
            </div>
            <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Review Decisions <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link to="/workflows" className="card p-6 rounded-2xl hover:border-brand-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted">
                Decision Flow Builder
              </span>
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-text-light dark:text-text-dark">Canvas</div>
            <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Visual Nodes <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link to="/scenarios" className="card p-6 rounded-2xl hover:border-brand-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted">
                Scenario Lab
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-text-light dark:text-text-dark">
              {stats?.savedScenarios ?? 0}
            </div>
            <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Simulate Scenarios <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link to="/reports" className="card p-6 rounded-2xl hover:border-brand-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted">
                Decision Reports
              </span>
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-text-light dark:text-text-dark">
              {bizMetrics?.reportsCount ?? 0}
            </div>
            <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Executive Briefs <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity / Decisions Table */}
      <div className="card p-6 rounded-2xl border border-surface-light-border dark:border-surface-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-text-light dark:text-text-dark">Recent Decisions</h2>
          <Link to="/decisions" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            View All →
          </Link>
        </div>

        {stats?.recentDecisions && stats.recentDecisions.length > 0 ? (
          <div className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
            {stats.recentDecisions.map((decision) => (
              <div key={decision.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to={`/decisions/${decision.id}`}
                    className="font-bold text-sm text-text-light dark:text-text-dark hover:text-brand-600 truncate block"
                  >
                    {decision.title}
                  </Link>
                  <p className="text-xs text-text-light-muted dark:text-text-dark-muted truncate mt-0.5">
                    {decision.question}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                    {decision.status}
                  </span>
                  <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(decision.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-text-light-muted dark:text-text-dark-muted">
            <SparklesIcon className="h-8 w-8 mx-auto text-brand-500 mb-2 opacity-60" />
            No business decisions logged yet. Use the <strong>Decision Wizard</strong> to evaluate your first purchasing or investment decision!
          </div>
        )}
      </div>

      {/* Full Business Details & Comprehensive P&L Statement Modal */}
      {isBusinessDetailsOpen && currentBusiness && bizMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-surface-light-border dark:border-surface-dark-border">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  <BuildingStorefrontIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-text-light dark:text-text-dark">
                      {currentBusiness.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 capitalize">
                      {currentBusiness.type.replace("_", " ")}
                    </span>
                    {currentBusiness.isSample && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Demo Benchmark Workspace
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                    {currentBusiness.city ? `${currentBusiness.city}, ` : ""}{currentBusiness.serviceArea ? `${currentBusiness.serviceArea}, ` : ""}{currentBusiness.country}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBusinessDetailsOpen(false)}
                className="p-1.5 rounded-xl text-text-light-muted hover:text-text-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-surface-light-border dark:border-surface-dark-border pb-2">
              {[
                { id: "pl", label: "Profit & Loss (P&L) Ledger", icon: ScaleIcon },
                { id: "investment", label: "Capital & Returns (ROI)", icon: BanknotesIcon },
                { id: "profile", label: "Store Profile & Setup", icon: BuildingStorefrontIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = detailsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailsTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-text-light-muted hover:text-text-light"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Full Profit & Loss (P&L) Statement */}
            {detailsTab === "pl" && (
              <div className="space-y-4">
                {/* Net Profit Alert Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  bizMetrics.estimatedNetProfit >= 0
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300"
                }`}>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Estimated 30-Day Net Bottom Line
                    </span>
                    <span className="text-2xl font-black">
                      {bizMetrics.estimatedNetProfit >= 0 ? "+" : ""}{currencySym}{bizMetrics.estimatedNetProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block">
                      Net Margin: {bizMetrics.netMarginPct}%
                    </span>
                    <span className="text-[11px] opacity-80">
                      Gross Margin: {bizMetrics.grossMarginPct}%
                    </span>
                  </div>
                </div>

                {/* Audited P&L Line Items Table */}
                <div className="border border-surface-light-border dark:border-surface-dark-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-surface-light-border dark:border-surface-dark-border text-text-light-muted uppercase font-bold">
                      <tr>
                        <th className="p-3">Financial Line Item</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">% of Revenue</th>
                        <th className="p-3">Nature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="p-3 font-bold text-text-light dark:text-text-dark">
                          1. Gross Customer Sales (Past 30 Days)
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          +{currencySym}{bizMetrics.monthlyRevenue.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-text-light-muted">
                          100.0%
                        </td>
                        <td className="p-3 text-text-light-muted">Inflow / Revenue</td>
                      </tr>

                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="p-3 font-semibold text-rose-600 dark:text-rose-400 pl-6">
                          - Cost of Goods Sold (COGS)
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{currencySym}{(bizMetrics.monthlyCOGS || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-text-light-muted">
                          {bizMetrics.monthlyRevenue > 0
                            ? (((bizMetrics.monthlyCOGS || 0) / bizMetrics.monthlyRevenue) * 100).toFixed(1)
                            : 0}%
                        </td>
                        <td className="p-3 text-text-light-muted">Wholesale Inventory Cost</td>
                      </tr>

                      <tr className="bg-gray-50 dark:bg-gray-800/40 font-bold">
                        <td className="p-3 text-text-light dark:text-text-dark">
                          = Gross Profit
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          +{currencySym}{bizMetrics.grossProfit.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {bizMetrics.grossMarginPct}%
                        </td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400">Gross Contribution</td>
                      </tr>

                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="p-3 font-semibold text-rose-600 dark:text-rose-400 pl-6">
                          - Fixed Operational Overhead (Rent, Wages, Utilities)
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-text-light-muted">
                          {bizMetrics.monthlyRevenue > 0
                            ? ((bizMetrics.monthlyOperationalCost / bizMetrics.monthlyRevenue) * 100).toFixed(1)
                            : 0}%
                        </td>
                        <td className="p-3 text-text-light-muted">Operating Expenses</td>
                      </tr>

                      <tr className={`font-black text-sm ${
                        bizMetrics.estimatedNetProfit >= 0
                          ? "bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-100/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      }`}>
                        <td className="p-3">
                          = Net Profit / Net Loss
                        </td>
                        <td className="p-3 text-right">
                          {bizMetrics.estimatedNetProfit >= 0 ? "+" : ""}{currencySym}{bizMetrics.estimatedNetProfit.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          {bizMetrics.netMarginPct}%
                        </td>
                        <td className="p-3 text-xs font-semibold">Final Bottom Line</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted italic">
                  Note: DMOC strictly distinguishes Gross Profit from Net Profit. Operating costs (rent, wages, and utilities) are never assumed to be zero.
                </p>
              </div>
            )}

            {/* TAB 2: Capital Investment & Returns Breakdown */}
            {detailsTab === "investment" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted block">
                      Total Working Capital Invested
                    </span>
                    <span className="text-xl font-black text-text-light dark:text-text-dark block mt-1">
                      {currencySym}{(bizMetrics.totalWorkingCapitalInvested || (bizMetrics.totalInventoryValue + bizMetrics.monthlyOperationalCost)).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-text-light-muted mt-1 block">
                      Inventory Valuation ({currencySym}{bizMetrics.totalInventoryValue.toLocaleString()}) + Ops ({currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()})
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted block">
                      Total Spending This Month
                    </span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 block mt-1">
                      {currencySym}{(bizMetrics.totalSpendingThisMonth || (bizMetrics.monthlyCOGS + bizMetrics.monthlyOperationalCost)).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-text-light-muted mt-1 block">
                      COGS ({currencySym}{(bizMetrics.monthlyCOGS || 0).toLocaleString()}) + Overhead ({currencySym}{bizMetrics.monthlyOperationalCost.toLocaleString()})
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted block">
                      Gross Return on Capital (ROI)
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                      {bizMetrics.returnOnInvestmentPct ?? 0}%
                    </span>
                    <span className="text-[11px] text-text-light-muted mt-1 block">
                      Gross Profit ÷ Total Capital Outlay
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted dark:text-text-dark-muted block">
                      Cash Tied Up in Inventory
                    </span>
                    <span className="text-xl font-black text-text-light dark:text-text-dark block mt-1">
                      {currencySym}{bizMetrics.totalInventoryValue.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-text-light-muted mt-1 block">
                      Across {bizMetrics.totalStockOnHand} physical units on shelves
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-900/30 text-xs text-text-light-muted dark:text-text-dark-muted flex items-start gap-2">
                  <InformationCircleIcon className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Capital Efficiency:</strong> Every ₹100 of working capital currently generates ₹{bizMetrics.returnOnInvestmentPct ?? 0} in gross returns. Use the <strong>Scenario Lab</strong> or <strong>Decision Wizard</strong> to simulate reducing holding costs and restocking faster-turning SKUs.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: Store Profile & Setup */}
            {detailsTab === "profile" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Business Model</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark capitalize">
                      {currentBusiness.type.replace("_", " ")}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Operational Status</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark">
                      {currentBusiness.isExisting ? "Existing Operating Store" : "Planned New Business"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Currency & Symbol</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark">
                      {currentBusiness.currency} ({currentBusiness.currencySymbol})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Tax Configuration</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark">
                      {currentBusiness.taxName || "GST"} @ {currentBusiness.taxRate || 0}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Target Monthly Revenue</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark">
                      {currencySym}{currentBusiness.monthlyRevenue?.toLocaleString() || "Not set"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                    <span className="text-[10px] uppercase font-bold text-text-light-muted block">Monthly Fixed Overhead</span>
                    <span className="font-bold text-sm text-text-light dark:text-text-dark">
                      {currencySym}{currentBusiness.monthlyCost?.toLocaleString() || "Not set"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-surface-light-border dark:border-surface-dark-border">
                  <span className="text-[10px] uppercase font-bold text-text-light-muted block mb-1">
                    Store Location & Service Area
                  </span>
                  <p className="font-bold text-text-light dark:text-text-dark">
                    {[currentBusiness.serviceArea, currentBusiness.city, currentBusiness.country].filter(Boolean).join(", ") || "Location not configured"}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBusinessDetailsOpen(false);
                      setShowOnboarding(true);
                    }}
                    className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit Business Profile & Settings
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-light-border dark:border-surface-dark-border">
              <span className="text-xs text-text-light-muted dark:text-text-dark-muted">
                Workspace ID: <code className="font-mono text-[11px]">{currentBusiness.id.substring(0, 8)}...</code>
              </span>
              <button
                type="button"
                onClick={() => setIsBusinessDetailsOpen(false)}
                className="btn-primary px-5 py-2 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}