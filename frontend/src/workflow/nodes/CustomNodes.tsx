import React from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { clsx } from "clsx";
import {
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  CalculatorIcon,
  CircleStackIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { WorkflowNodeData } from "./nodeTypes";

export type CustomWorkflowNode = Node<WorkflowNodeData, "workflow">;
export type CustomNodeProps = NodeProps<CustomWorkflowNode>;

const statusBorderClasses: Record<string, string> = {
  idle: "border-surface-light-border dark:border-surface-dark-border hover:border-brand-400 dark:hover:border-brand-500",
  running: "border-brand-500 ring-2 ring-brand-500/30 animate-pulse",
  success: "border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-500/10",
  error: "border-rose-500 ring-2 ring-rose-500/30 shadow-rose-500/10",
  skipped: "border-surface-light-border dark:border-surface-dark-border opacity-50",
};

const categoryTheme: Record<string, {
  bg: string;
  badgeBg: string;
  text: string;
  accent: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  triggers: {
    bg: "bg-emerald-500/10",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-500",
    border: "border-emerald-500/30",
    icon: BoltIcon,
  },
  inputs: {
    bg: "bg-blue-500/10",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
    accent: "bg-blue-500",
    border: "border-blue-500/30",
    icon: AdjustmentsHorizontalIcon,
  },
  logic: {
    bg: "bg-amber-500/10",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500",
    border: "border-amber-500/30",
    icon: ArrowsRightLeftIcon,
  },
  outcomes: {
    bg: "bg-teal-500/10",
    badgeBg: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
    text: "text-teal-600 dark:text-teal-400",
    accent: "bg-teal-500",
    border: "border-teal-500/30",
    icon: SparklesIcon,
  },
  calculations: {
    bg: "bg-violet-500/10",
    badgeBg: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
    text: "text-violet-600 dark:text-violet-400",
    accent: "bg-violet-500",
    border: "border-violet-500/30",
    icon: CalculatorIcon,
  },
  data: {
    bg: "bg-indigo-500/10",
    badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
    text: "text-indigo-600 dark:text-indigo-400",
    accent: "bg-indigo-500",
    border: "border-indigo-500/30",
    icon: CircleStackIcon,
  },
  outputs: {
    bg: "bg-rose-500/10",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    text: "text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500",
    border: "border-rose-500/30",
    icon: ChartBarIcon,
  },
  business: {
    bg: "bg-teal-500/10",
    badgeBg: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
    text: "text-teal-600 dark:text-teal-400",
    accent: "bg-teal-500",
    border: "border-teal-500/30",
    icon: SparklesIcon,
  },
};

function getNodeCategory(type: string): string {
  if ([
    "business_profile", "product_lookup", "source_verification", "inventory_snapshot",
    "sales_history", "supplier_quote", "proposed_purchase", "demand_forecast",
    "stockout_risk", "expiry_risk", "cost_margin", "cash_flow", "scenario_branch",
    "best_base_worst", "break_even", "compare_quantities", "report_output"
  ].includes(type)) return "business";
  if (["start_decision", "manual_trigger"].includes(type)) return "triggers";
  if (["alternative_list", "criteria_weights", "scenario_context", "user_prompt", "form_input", "number_input"].includes(type)) return "inputs";
  if (["if_else", "compare_values", "threshold_check", "and_or_conditions", "filter_alternatives", "merge_branches"].includes(type)) return "logic";
  if (["possible_outcome", "probability", "cost", "benefit", "risk_assessment", "time_estimate", "custom_metric"].includes(type)) return "outcomes";
  if (["weighted_score", "expected_monetary_value", "expected_utility", "best_worst_case", "sensitivity_analysis", "scenario_comparison", "monte_carlo"].includes(type)) return "calculations";
  if (["read_saved_decision", "read_spreadsheet_data", "transform_data", "validate_data", "save_results", "export_report"].includes(type)) return "data";
  return "outputs";
}

function StatusIndicator({ status }: { status?: string }) {
  if (!status || status === "idle") return null;

  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-1.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
        <ArrowPathIcon className="h-3 w-3 animate-spin" />
        Running
      </span>
    );
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
        <CheckCircleIcon className="h-3 w-3" />
        Done
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
        <XCircleIcon className="h-3 w-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
      <ExclamationCircleIcon className="h-3 w-3" />
      Skipped
    </span>
  );
}

function NodeExecutionBadge({ type, result }: { type: string; result?: any }) {
  if (!result) return null;

  if (type === "if_else") {
    const branch = result.branch ? String(result.branch).toUpperCase() : result.condition ? "TRUE" : "FALSE";
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-between">
        <span className="uppercase text-[9px] text-amber-600 dark:text-amber-400">Branch Taken:</span>
        <span className="font-mono bg-amber-500/20 px-1.5 py-0.2 rounded">{branch}</span>
      </div>
    );
  }

  if (type === "benefit") {
    const val = Number(result.benefit ?? 0);
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-between">
        <span className="uppercase text-[9px] text-emerald-600 dark:text-emerald-400">Benefit Result:</span>
        <span>+${val.toLocaleString()} {result.currency || "USD"}</span>
      </div>
    );
  }

  if (type === "cost") {
    const val = Number(result.cost ?? 0);
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center justify-between">
        <span className="uppercase text-[9px] text-rose-600 dark:text-rose-400">Cost Result:</span>
        <span>-${val.toLocaleString()} {result.currency || "USD"}</span>
      </div>
    );
  }

  if (type === "alternative") {
    const altTitle = result.alternative?.title || result.title;
    if (!altTitle) return null;
    return (
      <div className="mt-2 text-[10px] font-medium px-2 py-1 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 truncate">
        Evaluated: <strong className="font-semibold">{altTitle}</strong>
      </div>
    );
  }

  if (type === "weighted_score" && result.topRecommendation) {
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 truncate flex items-center justify-between">
        <span className="text-[9px] uppercase">Winner:</span>
        <span>{result.topRecommendation} ({(Number(result.topScore || 0) * 100).toFixed(0)}%)</span>
      </div>
    );
  }

  if (type === "recommendation" && result.recommendation) {
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 truncate flex items-center justify-between">
        <span className="text-[9px] uppercase">Recommended:</span>
        <span>{result.recommendation}</span>
      </div>
    );
  }

  if (type === "expected_monetary_value" && result.topAlternative) {
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 truncate flex items-center justify-between">
        <span className="text-[9px] uppercase">Top EMV:</span>
        <span>${Number(result.topEMV || 0).toLocaleString()}</span>
      </div>
    );
  }

  if (type === "monte_carlo" && result.topAlternative) {
    return (
      <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 truncate flex items-center justify-between">
        <span className="text-[9px] uppercase">P50 Median:</span>
        <span>{result.topAlternative}</span>
      </div>
    );
  }

  return null;
}

function StoreBusinessBadge({ type, config, result }: { type: string; config?: Record<string, any>; result?: any }) {
  if (!config && !result) return null;
  const cfg = config || {};
  const res = result || {};

  if (type === "product_lookup") {
    const name = cfg.productName || res.productName;
    if (!name) return null;
    return (
      <div className="mt-2 text-[11px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-lg p-2 text-teal-900 dark:text-teal-200">
        <div className="font-bold truncate">{name}</div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-teal-700 dark:text-teal-300">
          <span>{cfg.category || "Inventory SKU"}</span>
          <span className="font-mono bg-teal-100 dark:bg-teal-900/60 px-1 py-0.5 rounded text-[9px]">Verified</span>
        </div>
      </div>
    );
  }

  if (type === "business_profile") {
    return (
      <div className="mt-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
        <span className="font-semibold">{cfg.businessType || "Store"}</span>
        <span className="font-mono uppercase font-bold text-emerald-700 dark:text-emerald-300">Currency: {cfg.currency || "INR"}</span>
      </div>
    );
  }

  if (type === "inventory_snapshot") {
    const stock = res.currentStock ?? cfg.currentStock ?? 10;
    const rop = res.reorderPoint ?? cfg.reorderPoint;
    return (
      <div className="mt-2 text-[10px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg p-2 text-blue-900 dark:text-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-blue-700 dark:text-blue-300">On-Hand Stock:</span>
          <span className="font-bold text-xs">{stock} units</span>
        </div>
        {rop !== undefined && (
          <div className="flex items-center justify-between mt-1 text-blue-700 dark:text-blue-300">
            <span>Reorder Point:</span>
            <span className="font-mono">{rop} units</span>
          </div>
        )}
      </div>
    );
  }

  if (type === "proposed_purchase") {
    const qty = res.orderQuantity ?? cfg.orderQuantity ?? 20;
    const capital = res.capitalRequired ?? cfg.capitalRequired;
    return (
      <div className="mt-2 text-[10px] bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-lg p-2 text-violet-900 dark:text-violet-200">
        <div className="flex items-center justify-between">
          <span className="text-violet-700 dark:text-violet-300">Order Quantity:</span>
          <span className="font-bold text-xs">{qty} units</span>
        </div>
        {capital !== undefined && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-violet-700 dark:text-violet-300">Capital Outlay:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{Number(capital).toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === "demand_forecast") {
    const demand = res.expectedDemand ?? cfg.expectedDemand ?? 30;
    const days = res.forecastHorizonDays ?? cfg.horizonDays ?? 30;
    return (
      <div className="mt-2 text-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2 text-amber-900 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <span className="text-amber-700 dark:text-amber-300">Expected Demand:</span>
          <span className="font-bold text-xs">{demand} units</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-amber-700 dark:text-amber-300">
          <span>Planning Horizon:</span>
          <span className="font-mono">{days} days</span>
        </div>
      </div>
    );
  }

  if (type === "cost_margin") {
    const cost = res.unitCost ?? cfg.unitCost;
    const price = res.sellingPrice ?? cfg.sellingPrice;
    const margin = res.grossMarginPct ?? cfg.grossMarginPct;
    return (
      <div className="mt-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2 text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center justify-between">
          <span>Cost: ₹{cost}</span>
          <span>Price: ₹{price}</span>
        </div>
        {margin !== undefined && (
          <div className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">
            Gross Margin: {margin}%
          </div>
        )}
      </div>
    );
  }

  if (type === "scenario_branch") {
    const pA = res.pathA_Gain ?? cfg.pathA_Gain;
    const pB = res.pathB_Gain ?? cfg.pathB_Gain;
    const pC = res.pathC_Gain ?? cfg.pathC_Gain;
    return (
      <div className="mt-2 text-[10px] bg-gray-50 dark:bg-gray-800/60 border border-surface-light-border dark:border-surface-dark-border rounded-lg p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-text-light-muted">Path A (Proceed):</span>
          <span className={clsx("font-mono font-bold", (pA ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {(pA ?? 0) >= 0 ? "+" : ""}₹{pA ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-light-muted">Path B (Skip):</span>
          <span className={clsx("font-mono font-bold", (pB ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {(pB ?? 0) >= 0 ? "+" : ""}₹{pB ?? 0}
          </span>
        </div>
        {pC !== undefined && (
          <div className="flex items-center justify-between pt-1 border-t border-surface-light-border/40 dark:border-surface-dark-border/40">
            <span className="text-text-light-muted">Path C (Alternate):</span>
            <span className={clsx("font-mono font-bold", pC >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {pC >= 0 ? "+" : ""}₹{pC}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (type === "recommendation" || type === "report_output") {
    const recPath = res.recommendedPath || cfg.recommendedPath || "C";
    const title = res.title || cfg.title || "Proceed with purchase";
    const summary = res.summary || cfg.summary || "";
    return (
      <div className="mt-2 text-[10px] bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center justify-between">
          <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[9px]">Recommendation</span>
          <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px]">Path {recPath}</span>
        </div>
        <p className="font-bold mt-1 text-[11px] text-text-light dark:text-text-dark line-clamp-1">{title}</p>
        {summary && <p className="text-[10px] text-text-light-muted dark:text-text-dark-muted line-clamp-2 mt-0.5">{summary}</p>}
      </div>
    );
  }

  if (type === "break_even") {
    const units = res.breakEvenUnits ?? cfg.breakEvenUnits ?? 12;
    return (
      <div className="mt-2 text-[10px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-lg p-2 text-teal-900 dark:text-teal-200 flex items-center justify-between">
        <span>Break-Even Volume:</span>
        <span className="font-mono font-bold text-xs">{units} units</span>
      </div>
    );
  }

  return null;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const categoryKey = getNodeCategory(data.type);
  const theme = categoryTheme[categoryKey] || categoryTheme.triggers;
  const CategoryIcon = theme.icon;
  const isStartNode = ["start_decision", "manual_trigger"].includes(data.type);
  const isEndNode = data.type === "end";

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-brand-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2 mt-1">
            {data.description}
          </p>
        )}

        <StoreBusinessBadge type={data.type} config={data.config} result={data.result} />
        <NodeExecutionBadge type={data.type} result={data.result} />

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      {!isStartNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-brand-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
          id="input"
        />
      )}

      {!isEndNode && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-brand-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
          id="output"
        />
      )}
    </div>
  );
}

export function LogicNode({ data, selected }: CustomNodeProps) {
  const theme = categoryTheme.logic;
  const CategoryIcon = theme.icon;
  const conditionStr = data.config?.condition;

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-amber-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2">
            {data.description}
          </p>
        )}

        {conditionStr !== undefined && (
          <div className="mt-2 text-[11px] font-mono bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded truncate">
            {typeof conditionStr === "string" ? conditionStr : JSON.stringify(conditionStr)}
          </div>
        )}

        <NodeExecutionBadge type={data.type} result={data.result} />

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
        id="input"
      />

      {data.type === "if_else" ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
            id="true"
            style={{ top: "35%" }}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
            id="false"
            style={{ top: "70%" }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
          id="output"
        />
      )}
    </div>
  );
}

export function OutcomeNode({ data, selected }: CustomNodeProps) {
  const theme = categoryTheme.outcomes;
  const CategoryIcon = theme.icon;
  const config = data.config || {};

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-teal-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2 mb-1.5">
            {data.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {config.probability !== undefined && (
            <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 px-1.5 py-0.5 rounded">
              P: {(Number(config.probability) * 100).toFixed(0)}%
            </span>
          )}
          {config.monetaryPayoff !== undefined && config.monetaryPayoff !== null && (
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-1.5 py-0.5 rounded">
              ${Number(config.monetaryPayoff).toLocaleString()}
            </span>
          )}
          {Boolean(config.riskLevel) && (
            <span className="bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900 px-1.5 py-0.5 rounded uppercase">
              {String(config.riskLevel)}
            </span>
          )}
        </div>

        <NodeExecutionBadge type={data.type} result={data.result} />

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
        id="output"
      />
    </div>
  );
}

export function CalculationNode({ data, selected }: CustomNodeProps) {
  const theme = categoryTheme.calculations;
  const CategoryIcon = theme.icon;
  const config = data.config || {};

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-violet-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2">
            {data.description}
          </p>
        )}

        {Boolean(config.algorithm) && (
          <div className="mt-1.5 text-[10px] font-mono text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 px-1.5 py-0.5 rounded inline-block">
            {String(config.algorithm)}
          </div>
        )}

        <NodeExecutionBadge type={data.type} result={data.result} />

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
        id="output"
      />
    </div>
  );
}

export function OutputNode({ data, selected }: CustomNodeProps) {
  const theme = categoryTheme.outputs;
  const CategoryIcon = theme.icon;

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-rose-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2">
            {data.description}
          </p>
        )}

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
        id="input"
      />
      {data.type !== "end" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-rose-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
          id="output"
        />
      )}
    </div>
  );
}

export function DataNode({ data, selected }: CustomNodeProps) {
  const theme = categoryTheme.data;
  const CategoryIcon = theme.icon;

  return (
    <div
      className={clsx(
        "relative rounded-xl bg-surface-light dark:bg-surface-dark border shadow-md transition-all duration-200 min-w-[220px] max-w-[300px]",
        statusBorderClasses[data.status || "idle"],
        selected ? "ring-2 ring-indigo-500 shadow-lg scale-[1.01]" : ""
      )}
      style={{ width: data.width || 230 }}
    >
      <div className={clsx("h-1.5 w-full rounded-t-xl", theme.accent)} />

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx("p-1.5 rounded-lg flex-shrink-0", theme.bg, theme.text)}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
              {data.label}
            </h4>
          </div>
          <StatusIndicator status={data.status} />
        </div>

        {data.description && (
          <p className="text-[11px] text-text-light-muted dark:text-text-dark-muted line-clamp-2">
            {data.description}
          </p>
        )}

        {data.error && (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md">
            {data.error}
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-surface-light dark:!border-surface-dark !-left-1.5 hover:!scale-125 transition-transform"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-surface-light dark:!border-surface-dark !-right-1.5 hover:!scale-125 transition-transform"
        id="output"
      />
    </div>
  );
}

function getNodeComponent(type: string): React.ComponentType<CustomNodeProps> {
  if (["if_else", "compare_values", "threshold_check", "and_or_conditions", "filter_alternatives", "merge_branches"].includes(type)) {
    return LogicNode;
  }
  if (["possible_outcome", "probability", "cost", "benefit", "risk_assessment", "time_estimate", "custom_metric"].includes(type)) {
    return OutcomeNode;
  }
  if (["weighted_score", "expected_monetary_value", "expected_utility", "best_worst_case", "sensitivity_analysis", "scenario_comparison", "monte_carlo"].includes(type)) {
    return CalculationNode;
  }
  if (["recommendation", "results_table", "chart", "summary_report", "end"].includes(type)) {
    return OutputNode;
  }
  if (["read_saved_decision", "read_spreadsheet_data", "transform_data", "validate_data", "save_results", "export_report"].includes(type)) {
    return DataNode;
  }
  return CustomNode;
}

export function WorkflowNode(props: CustomNodeProps) {
  const Component = getNodeComponent(props.data.type);
  return <Component {...props} />;
}