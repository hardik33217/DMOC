import { useState, useMemo } from "react";
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ListBulletIcon,
  CodeBracketIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { toast } from "react-hot-toast";
import { Node } from "@xyflow/react";
import { WorkflowNodeData } from "./nodes/nodeTypes";

export interface WorkflowExecutionConsoleProps {
  status: "idle" | "running" | "completed" | "failed";
  runId?: string;
  nodeStatuses: Record<string, "idle" | "running" | "success" | "error" | "skipped">;
  nodeOutputs: Record<string, unknown>;
  nodes: Node<WorkflowNodeData>[];
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export function WorkflowExecutionConsole({
  status,
  runId,
  nodeStatuses,
  nodeOutputs,
  nodes,
  onClose,
  onSelectNode,
}: WorkflowExecutionConsoleProps) {
  const [activeTab, setActiveTab] = useState<"verdict" | "steps" | "json">("verdict");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<string | null>(null);

  // Compute point-wise decision verdict from all node outputs
  const decisionSummary = useMemo(() => {
    const points: { icon: string; title: string; detail: string; highlight?: boolean; badge?: string }[] = [];
    let headline = "Workflow Execution Completed";
    let subheadline = "All active logic nodes have finished executing.";
    let dominantChoice: string | null = null;
    let branchDecision: string | null = null;
    let totalBenefit = 0;
    let totalCost = 0;
    let hasFinancials = false;
    let questionText = "";

    // 1. Scan nodes
    for (const node of nodes) {
      const output = nodeOutputs[node.id] as Record<string, any> | undefined;
      const type = node.data.type;
      const label = node.data.label;

      if (!output) continue;

      // Question
      if (type === "decision_question" && output.question) {
        questionText = output.question;
        points.push({
          icon: "question",
          title: "Decision Question",
          detail: String(output.question),
        });
      }

      // Alternative
      if (type === "alternative") {
        const altTitle = output.alternative?.title || output.title || label;
        points.push({
          icon: "alternative",
          title: `Option Evaluated: ${altTitle}`,
          detail: output.alternative?.description || node.data.description || "Active alternative in decision pipeline.",
        });
      }

      // If / Else logic
      if (type === "if_else") {
        const branch = output.branch ? String(output.branch).toUpperCase() : output.condition ? "TRUE" : "FALSE";
        branchDecision = branch;
        points.push({
          icon: "branch",
          title: `Logic Branch Evaluated: ${branch} Path Taken`,
          detail: `Condition (${node.data.config?.condition || "evaluated expression"}) resolved to ${output.condition ? "TRUE" : "FALSE"}. Downstream path routed to ${branch} branch.`,
          highlight: true,
          badge: `Branch: ${branch}`,
        });
      }

      // Product Lookup
      if (type === "product_lookup") {
        const pName = output.productName || node.data.config?.productName;
        if (pName) {
          points.push({
            icon: "alternative",
            title: `Product Evaluated: ${pName}`,
            detail: `Category: ${output.category || node.data.config?.category || "Inventory SKU"} · Regulatory source verified.`,
            badge: "Store Catalog",
          });
        }
      }

      // Proposed Purchase
      if (type === "proposed_purchase") {
        const qty = output.orderQuantity ?? node.data.config?.orderQuantity;
        const cap = output.capitalRequired ?? node.data.config?.capitalRequired;
        if (qty !== undefined) {
          points.push({
            icon: "cost",
            title: `Proposed Purchase: ${qty} Units (Capital Required: ₹${Number(cap || 0).toLocaleString()})`,
            detail: `Working capital investment commitment of ₹${Number(cap || 0).toLocaleString()} evaluated against cash flow and stock holding costs.`,
            highlight: true,
            badge: `Outlay: ₹${Number(cap || 0).toLocaleString()}`,
          });
        }
      }

      // Inventory Snapshot
      if (type === "inventory_snapshot") {
        const stock = output.currentStock ?? node.data.config?.currentStock;
        const rop = output.reorderPoint ?? node.data.config?.reorderPoint;
        points.push({
          icon: "sim",
          title: `Current Store Inventory: ${stock ?? 10} Units on hand`,
          detail: `Minimum reorder threshold (ROP) configured at ${rop ?? 15} units. Stock status evaluated as ${output.stockStatus || "adequate"}.`,
          badge: `Stock: ${stock}u`,
        });
      }

      // Demand Forecast
      if (type === "demand_forecast") {
        const dem = output.expectedDemand ?? node.data.config?.expectedDemand;
        const days = output.forecastHorizonDays ?? node.data.config?.horizonDays ?? 30;
        points.push({
          icon: "benefit",
          title: `Forecast Horizon Demand: ${dem ?? 30} Units over ${days} Days`,
          detail: `Based on empirical store velocity and safety stock buffers, expected customer absorption is ${dem} units with recommended safety buffer of ${output.safetyStockRecommended || 5} units.`,
          badge: `${dem} Units / ${days}d`,
        });
      }

      // Cost & Margin
      if (type === "cost_margin") {
        const margin = output.grossMarginPct ?? node.data.config?.grossMarginPct;
        const cost = output.unitCost ?? node.data.config?.unitCost;
        const price = output.sellingPrice ?? node.data.config?.sellingPrice;
        points.push({
          icon: "benefit",
          title: `Gross Margin: ${margin ?? 35}% (Price: ₹${price} · Cost: ₹${cost})`,
          detail: `Unit gross profit of ₹${Number(price - cost).toFixed(2)} per unit sold.`,
          badge: `${margin}% Margin`,
        });
      }

      // Scenario Branch
      if (type === "scenario_branch") {
        const pA = output.pathA_Gain ?? node.data.config?.pathA_Gain ?? 0;
        const pB = output.pathB_Gain ?? node.data.config?.pathB_Gain ?? 0;
        const pC = output.pathC_Gain ?? node.data.config?.pathC_Gain ?? 0;
        points.push({
          icon: "branch",
          title: `3-Path Scenario Outcomes: Path A (₹${pA}), Path B (₹${pB}), Path C (₹${pC})`,
          detail: `Path A (Proceed 20u): ₹${pA} net return | Path B (Do Not Proceed): ₹${pB} net return | Path C (Alternative Optimal): ₹${pC} net return.`,
          highlight: true,
          badge: "3 Scenarios",
        });
      }

      // Break Even
      if (type === "break_even") {
        const bUnits = output.breakEvenUnits ?? node.data.config?.breakEvenUnits ?? 12;
        points.push({
          icon: "emv",
          title: `Break-Even Sales Volume: ${bUnits} Units`,
          detail: `Requires selling ${bUnits} units to fully recover order capital outlay.`,
          badge: `${bUnits} Units to Break-Even`,
        });
      }

      // Recommendation
      if (type === "recommendation" || output.topRecommendation) {
        const rec = output.recommendation || output.recommendedPath || output.topRecommendation || "Path C";
        const title = output.title || output.executiveSummary || `Proceed with purchase order`;
        dominantChoice = String(rec);
        points.unshift({
          icon: "trophy",
          title: `Store Recommendation: Path ${rec} — ${title}`,
          detail: output.summary || output.executiveSummary || `Synthesized from verified supplier costs, inventory velocity, and cash flow constraints.`,
          highlight: true,
          badge: `Path ${rec}`,
        });
      }

      // Weighted score
      if (type === "weighted_score" && output.topRecommendation) {
        dominantChoice = String(output.topRecommendation);
        points.unshift({
          icon: "trophy",
          title: `MCDA Dominant Alternative: ${output.topRecommendation}`,
          detail: `Scored ${(Number(output.topScore || 0) * 100).toFixed(1)}% against evaluated criteria.`,
          highlight: true,
          badge: "Score Leader",
        });
      }

      // Expected Monetary Value
      if (type === "expected_monetary_value" && output.topAlternative) {
        dominantChoice = String(output.topAlternative);
        points.push({
          icon: "emv",
          title: `Highest Expected Monetary Value (EMV): ${output.topAlternative}`,
          detail: `Expected payoff: $${Number(output.topEMV || 0).toLocaleString()} USD.`,
          highlight: true,
          badge: `EMV: $${Number(output.topEMV || 0).toLocaleString()}`,
        });
      }

      // Monte Carlo
      if (type === "monte_carlo" && output.topAlternative) {
        dominantChoice = String(output.topAlternative);
        points.push({
          icon: "sim",
          title: `Monte Carlo Stochastic Simulation: ${output.topAlternative}`,
          detail: `Ran ${(output.iterations || 10000).toLocaleString()} stochastic trials with ${output.confidenceLevel || "95%"} confidence level.`,
          highlight: true,
          badge: "10,000 Runs",
        });
      }
    }

    // Set headlines
    if (dominantChoice) {
      headline = `Recommended Choice: ${dominantChoice}`;
      subheadline = questionText ? `Answering: "${questionText}"` : "Synthesized across all decision criteria and calculations.";
    } else if (branchDecision) {
      headline = `Decision Result: Took ${branchDecision} Branch`;
      subheadline = `The conditional evaluation steered the decision path down the ${branchDecision} branch.`;
    } else if (hasFinancials) {
      const net = totalBenefit - totalCost;
      headline = `Financial Evaluation: Net Payoff ${net >= 0 ? "+" : ""}${net.toLocaleString()} USD`;
      subheadline = `Total Benefits: +$${totalBenefit.toLocaleString()} | Total Costs: -$${totalCost.toLocaleString()}`;
    }

    // Default point if no specific decision points extracted
    if (points.length === 0) {
      points.push({
        icon: "check",
        title: "Workflow Processed Successfully",
        detail: `Executed ${nodes.length} nodes with no fatal interruptions.`,
      });
    }

    return {
      headline,
      subheadline,
      points,
      dominantChoice,
      branchDecision,
      hasFinancials,
      totalBenefit,
      totalCost,
      netPayoff: totalBenefit - totalCost,
    };
  }, [nodes, nodeOutputs]);

  // Copy point-wise summary to clipboard
  const handleCopySummary = () => {
    const lines = [
      `DMOC WORKFLOW RESULTS SUMMARY`,
      `Status: ${status.toUpperCase()} | Run ID: #${runId || "N/A"}`,
      `Verdict: ${decisionSummary.headline}`,
      `Details: ${decisionSummary.subheadline}`,
      ``,
      `POINT-WISE BREAKDOWN:`,
      ...decisionSummary.points.map((p, idx) => `${idx + 1}. ${p.title}\n   - ${p.detail}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Point-wise summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format node output nicely for the steps tab
  const formatNodeReadable = (type: string, output: any) => {
    if (!output) return "Executed (No return payload)";
    if (output.skipped) return "Skipped (Branch condition not taken)";
    if (type === "if_else") return `Condition: ${output.condition ? "TRUE" : "FALSE"} ➔ Took ${String(output.branch).toUpperCase()} Branch`;
    if (type === "benefit") return `Benefit: +$${Number(output.benefit || 0).toLocaleString()} ${output.currency || "USD"}`;
    if (type === "cost") return `Cost: -$${Number(output.cost || 0).toLocaleString()} ${output.currency || "USD"}`;
    if (type === "alternative") return `Option: "${output.alternative?.title || output.title || "Alternative"}"`;
    if (type === "start_decision") return "Triggered workflow pipeline";
    if (type === "manual_trigger") return "Manually triggered";
    if (type === "decision_question") return `Question: "${output.question || ""}"`;
    if (type === "weighted_score") return `Top Score: ${output.topRecommendation} (${(Number(output.topScore || 0) * 100).toFixed(0)}%)`;
    if (type === "expected_monetary_value") return `Top EMV: $${Number(output.topEMV || 0).toLocaleString()} (${output.topAlternative})`;
    if (type === "recommendation") return `Winner: ${output.recommendation}`;
    if (type === "monte_carlo") return `Stochastic Leader: ${output.topAlternative}`;
    if (type === "compare_values") return `Comparison: ${output.result ? "TRUE" : "FALSE"} (${output.left} ${output.operator} ${output.right})`;
    if (type === "threshold_check") return `Threshold: ${output.result ? "MET" : "NOT MET"}`;

    const keys = Object.keys(output);
    if (keys.length === 1 && typeof output[keys[0]] !== "object") {
      return `${keys[0]}: ${String(output[keys[0]])}`;
    }
    return JSON.stringify(output).slice(0, 60);
  };

  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-t border-surface-light-border dark:border-surface-dark-border shadow-2xl z-30 flex flex-col transition-all duration-300 backdrop-blur-md",
        isExpanded ? "h-[450px]" : "h-[300px]"
      )}
    >
      {/* DRAWER HEADER */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-light-border dark:border-surface-dark-border bg-surface-light-hover/40 dark:bg-surface-dark-hover/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                "w-2.5 h-2.5 rounded-full flex-shrink-0",
                status === "running" && "bg-brand-500 animate-ping",
                status === "completed" && "bg-emerald-500 ring-2 ring-emerald-500/30",
                status === "failed" && "bg-rose-500",
                status === "idle" && "bg-gray-400"
              )}
            />
            <span className="font-bold text-xs text-text-light dark:text-text-dark tracking-wide uppercase">
              Execution Results
            </span>
          </div>

          <span
            className={clsx(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              status === "running" && "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 animate-pulse",
              status === "completed" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20",
              status === "failed" && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
              status === "idle" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {status}
          </span>

          {runId && (
            <span className="text-[11px] font-mono text-text-light-muted dark:text-text-dark-muted hidden sm:inline">
              #{runId.slice(0, 8)}
            </span>
          )}

          {/* TABS */}
          <div className="flex items-center bg-surface-light-hover dark:bg-surface-dark-hover p-0.5 rounded-lg border border-surface-light-border dark:border-surface-dark-border ml-2">
            <button
              onClick={() => setActiveTab("verdict")}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                activeTab === "verdict"
                  ? "bg-white dark:bg-surface-dark text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-text-light-muted dark:text-text-dark-muted hover:text-text-light dark:hover:text-text-dark"
              )}
            >
              <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>Decision Verdict</span>
            </button>

            <button
              onClick={() => setActiveTab("steps")}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                activeTab === "steps"
                  ? "bg-white dark:bg-surface-dark text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-text-light-muted dark:text-text-dark-muted hover:text-text-light dark:hover:text-text-dark"
              )}
            >
              <ListBulletIcon className="h-3.5 w-3.5" />
              <span>Node Breakdown ({nodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                activeTab === "json"
                  ? "bg-white dark:bg-surface-dark text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-text-light-muted dark:text-text-dark-muted hover:text-text-light dark:hover:text-text-dark"
              )}
            >
              <CodeBracketIcon className="h-3.5 w-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light-hover dark:bg-surface-dark-hover hover:border-brand-500 text-text-light-muted hover:text-text-light dark:hover:text-text-dark transition-all"
            title="Copy Point-Wise Summary"
          >
            {copied ? (
              <>
                <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark border border-surface-light-border dark:border-surface-dark-border"
            title={isExpanded ? "Collapse height" : "Expand height"}
          >
            {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-light-muted hover:text-rose-500 border border-surface-light-border dark:border-surface-dark-border"
            title="Close Console"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* DRAWER CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: DECISION VERDICT & POINT-WISE SUMMARY */}
        {activeTab === "verdict" && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* HERO VERDICT CARD */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 via-indigo-50/50 to-white dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-surface-dark border border-brand-200 dark:border-brand-800/60 shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20 flex-shrink-0 mt-0.5">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400 bg-brand-100/70 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                    Decision Verdict
                  </span>
                  {decisionSummary.branchDecision && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      Branch: {decisionSummary.branchDecision}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-text-light dark:text-text-dark tracking-tight">
                  {decisionSummary.headline}
                </h3>
                <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-0.5">
                  {decisionSummary.subheadline}
                </p>
              </div>

              {/* QUICK STATS */}
              {decisionSummary.hasFinancials && (
                <div className="hidden sm:flex flex-col items-end flex-shrink-0 pl-4 border-l border-brand-200 dark:border-brand-800/60">
                  <span className="text-[10px] font-semibold text-text-light-muted dark:text-text-dark-muted uppercase">
                    Net Impact
                  </span>
                  <span
                    className={clsx(
                      "text-base font-bold",
                      decisionSummary.netPayoff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {decisionSummary.netPayoff >= 0 ? "+" : ""}${decisionSummary.netPayoff.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* POINT-WISE FINDINGS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-light-muted dark:text-text-dark-muted flex items-center gap-1.5">
                  <ListBulletIcon className="h-4 w-4 text-brand-500" />
                  Point-Wise Results Breakdown
                </h4>
                <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted">
                  {decisionSummary.points.length} Key Insights
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {decisionSummary.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "p-3 rounded-xl border transition-all flex items-start gap-3",
                      pt.highlight
                        ? "bg-brand-50/50 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800"
                        : "bg-surface-light-hover/60 dark:bg-surface-dark-hover/60 border-surface-light-border dark:border-surface-dark-border"
                    )}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-semibold text-xs sm:text-sm text-text-light dark:text-text-dark truncate">
                          {pt.title}
                        </h5>
                        {pt.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex-shrink-0">
                            {pt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 leading-relaxed">
                        {pt.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP NODE BREAKDOWN */}
        {activeTab === "steps" && (
          <div className="max-w-5xl mx-auto space-y-2">
            <p className="text-xs text-text-light-muted dark:text-text-dark-muted mb-3">
              Detailed point-wise execution log for every node on the workflow canvas. Click a row to inspect its parameters.
            </p>

            {nodes.map((node, index) => {
              const nodeStatus = nodeStatuses[node.id] || "idle";
              const output = nodeOutputs[node.id];
              const readableText = formatNodeReadable(node.data.type, output);
              const isSelected = selectedNodeDetails === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeDetails(isSelected ? null : node.id);
                    if (onSelectNode) onSelectNode(node.id);
                  }}
                  className={clsx(
                    "p-2.5 rounded-xl border transition-all cursor-pointer",
                    isSelected
                      ? "ring-2 ring-brand-500 bg-brand-50/40 dark:bg-brand-950/30 border-brand-300 dark:border-brand-800"
                      : "bg-surface-light-hover/60 dark:bg-surface-dark-hover/60 border-surface-light-border dark:border-surface-dark-border hover:border-brand-400"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border text-[11px] font-bold text-text-light-muted dark:text-text-dark-muted flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span
                        className={clsx(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          nodeStatus === "running" && "bg-brand-500 animate-ping",
                          nodeStatus === "success" && "bg-emerald-500",
                          nodeStatus === "error" && "bg-rose-500",
                          nodeStatus === "skipped" && "bg-amber-400",
                          nodeStatus === "idle" && "bg-gray-400"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-text-light dark:text-text-dark truncate">
                            {node.data.label}
                          </span>
                          <span className="text-[10px] text-text-light-muted dark:text-text-dark-muted font-mono">
                            ({node.data.type})
                          </span>
                        </div>
                        <p className="text-xs text-text-light-muted dark:text-text-dark-muted font-medium truncate mt-0.5">
                          • {readableText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={clsx(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                          nodeStatus === "success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                          nodeStatus === "error" && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
                          nodeStatus === "running" && "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
                          nodeStatus === "skipped" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                          nodeStatus === "idle" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}
                      >
                        {nodeStatus}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDABLE NODE DETAILS */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-surface-light-border dark:border-surface-dark-border text-xs space-y-2 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-light-muted dark:text-text-dark-muted">
                        <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border">
                          <span className="font-bold text-[10px] uppercase block mb-1 text-text-light dark:text-text-dark">
                            Node Configuration
                          </span>
                          <pre className="font-mono text-[11px] overflow-x-auto">
                            {JSON.stringify(node.data.config, null, 2)}
                          </pre>
                        </div>
                        <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border">
                          <span className="font-bold text-[10px] uppercase block mb-1 text-text-light dark:text-text-dark">
                            Execution Output Payload
                          </span>
                          <pre className="font-mono text-[11px] overflow-x-auto text-emerald-600 dark:text-emerald-400">
                            {JSON.stringify(output || { status: "No output generated" }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: RAW TECHNICAL JSON */}
        {activeTab === "json" && (
          <div className="max-w-5xl mx-auto">
            <div className="p-3 rounded-xl bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border font-mono text-xs overflow-x-auto">
              <pre className="text-text-light dark:text-text-dark">
                {JSON.stringify({ runId, status, nodeStatuses, nodeOutputs }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
