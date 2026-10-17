import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeftIcon, ChartBarIcon, ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../../utils/api";

export default function SimulationRunDetailPage() {
  const { decisionId, runId } = useParams<{ decisionId: string; runId: string }>();

  const { data: runData, isLoading } = useQuery({
    queryKey: ["simulation-run", decisionId, runId],
    queryFn: async () => { const response = await api.get(`/decisions/${decisionId}/simulations/runs/${runId}`); return response.data.data; },
    enabled: !!decisionId && !!runId,
  });

  const { data: decision } = useQuery({
    queryKey: ["decision", decisionId],
    queryFn: async () => { const response = await api.get(`/decisions/${decisionId}`); return response.data.data; },
    enabled: !!decisionId,
  });

  const run = runData;

  const exportExcel = async () => {
    try {
      const response = await api.get(`/import-export/export/${decisionId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `simulation-report-${runId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const printReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="card p-12 text-center">
        <ChartBarIcon className="h-16 w-16 mx-auto text-text-light-muted dark:text-text-dark-muted mb-4" />
        <h3 className="heading-4 mb-2">Simulation run not found</h3>
        <Link to={`/decisions/${decisionId}`} className="btn-primary inline-flex mt-4">
          <ArrowLeftIcon className="h-5 w-5" /> Back to Decision
        </Link>
      </div>
    );
  }

  const results = run.results?.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0)) || [];
  const topResult = results[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link to={`/decisions/${decisionId}`} className="btn-ghost">
          <ArrowLeftIcon className="h-5 w-5" /> Back to Decision
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={printReport} className="btn-secondary flex items-center gap-2">
            <PrinterIcon className="h-5 w-5" /> Print
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" /> Export Excel
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <h1 className="heading-2">{decision?.title || "Simulation Report"}</h1>
        <p className="body mt-1">{run.scenario?.name} Scenario • {run.algorithmVersion} Algorithm • {new Date(run.completedAt || run.startedAt || run.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="card p-6 bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800 print:hidden">
        <h2 className="heading-4 mb-3">Executive Summary</h2>
        <div className="prose max-w-none text-text-light dark:text-text-dark whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {topResult?.details ? (() => {
            try {
              const details = typeof topResult.details === 'string' ? JSON.parse(topResult.details) : topResult.details;
              if (details?.explanation) return details.explanation;
              return "Simulation completed successfully. See detailed results below.";
            } catch {
              return "Simulation completed successfully. See detailed results below.";
            }
          })() : "Simulation completed successfully. See detailed results below."}
        </div>
      </div>

      <section className="card p-6 print:hidden" aria-labelledby="results-heading">
        <h2 id="results-heading" className="heading-4 mb-4">Results by Alternative</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-light-border dark:border-surface-dark-border text-left text-sm text-text-light-muted dark:text-text-dark-muted">
                <th className="pb-2 font-medium">Rank</th>
                <th className="pb-2 font-medium">Alternative</th>
                <th className="pb-2 font-medium text-right">Weighted Score</th>
                <th className="pb-2 font-medium text-right">EMV</th>
                <th className="pb-2 font-medium text-right">Utility</th>
                <th className="pb-2 font-medium text-right">Range (Worst–Best)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
              {results.map((result: any, index: number) => (
                <motion.tr key={result.id || result.alternativeId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <td className="py-3 font-bold text-brand-600 dark:text-brand-400">#{result.rank || index + 1}</td>
                  <td className="py-3 font-medium text-text-light dark:text-text-dark">{result.alternative?.title || result.alternativeTitle}</td>
                  <td className="py-3 text-right font-bold text-brand-600 dark:text-brand-400">{result.weightedScore?.toFixed(3) ?? "N/A"}</td>
                  <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">{result.expectedMonetaryValue !== null && result.expectedMonetaryValue !== undefined ? "$" + result.expectedMonetaryValue.toLocaleString() : "N/A"}</td>
                  <td className="py-3 text-right font-bold text-purple-600 dark:text-purple-400">{result.expectedUtility?.toFixed(1) ?? "N/A"}</td>
                  <td className="py-3 text-right font-medium text-text-light dark:text-text-dark">
                    {result.worstCase !== null && result.bestCase !== null
                      ? "$" + result.worstCase.toLocaleString() + " – $" + result.bestCase.toLocaleString()
                      : "N/A"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="details-heading">
        <h2 id="details-heading" className="heading-4 print:hidden">Detailed Breakdown</h2>
        {results.map((result: any, index: number) => {
          const details = (() => {
            try {
              return typeof result.details === 'string' ? JSON.parse(result.details) : result.details;
            } catch {
              return null;
            }
          })();

          return (
            <motion.article key={result.id || result.alternativeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="card p-6 print:page-break-inside-avoid">
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h3 className="heading-4">{result.alternative?.title || result.alternativeTitle}</h3>
                <span className="badge-primary">Rank #{result.rank || index + 1}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
                <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                  <p className="text-sm text-text-light-muted dark:text-text-dark-muted">Weighted Score</p>
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{result.weightedScore?.toFixed(3) ?? "N/A"}</p>
                </div>
                <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                  <p className="text-sm text-text-light-muted dark:text-text-dark-muted">Expected Monetary Value</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.expectedMonetaryValue !== null && result.expectedMonetaryValue !== undefined ? "$" + result.expectedMonetaryValue.toLocaleString() : "N/A"}</p>
                </div>
                <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                  <p className="text-sm text-text-light-muted dark:text-text-dark-muted">Expected Utility</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.expectedUtility?.toFixed(1) ?? "N/A"}</p>
                </div>
                <div className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                  <p className="text-sm text-text-light-muted dark:text-text-dark-muted">Range</p>
                  <p className="text-xl font-bold text-text-light dark:text-text-dark">
                    {result.worstCase !== null && result.bestCase !== null
                      ? "$" + result.worstCase.toLocaleString() + " – $" + result.bestCase.toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {details?.criterionDetails && (
                <div className="mb-6 print:page-break-inside-avoid">
                  <h4 className="heading-5 mb-3">Criterion Scores</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-light-border dark:border-surface-dark-border text-left text-sm text-text-light-muted dark:text-text-dark-muted">
                          <th className="pb-2 font-medium">Criterion</th>
                          <th className="pb-2 font-medium text-right">Raw Value</th>
                          <th className="pb-2 font-medium text-right">Normalized</th>
                          <th className="pb-2 font-medium text-right">Weight</th>
                          <th className="pb-2 font-medium text-right">Direction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                        {Object.entries(details.criterionDetails).map(([criterionId, d]: [string, any]) => (
                          <tr key={criterionId}>
                            <td className="py-2 text-text-light dark:text-text-dark">{criterionId}</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{d.rawValue?.toFixed(2) ?? "N/A"}</td>
                            <td className="py-2 text-right font-medium text-brand-600 dark:text-brand-400">{d.normalizedValue?.toFixed(3) ?? "N/A"}</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{(d.weight * 100).toFixed(0)}%</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{d.direction === "maximize" ? "↑ Maximize" : "↓ Minimize"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {details?.outcomeDetails && details.outcomeDetails.length > 0 && (
                <div className="print:page-break-inside-avoid">
                  <h4 className="heading-5 mb-3">Outcomes</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-light-border dark:border-surface-dark-border text-left text-sm text-text-light-muted dark:text-text-dark-muted">
                          <th className="pb-2 font-medium">Outcome</th>
                          <th className="pb-2 font-medium text-right">Probability</th>
                          <th className="pb-2 font-medium text-right">Monetary Payoff</th>
                          <th className="pb-2 font-medium text-right">Utility</th>
                          <th className="pb-2 font-medium">Risk Level</th>
                          <th className="pb-2 font-medium text-right">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                        {details.outcomeDetails.map((o: any) => (
                          <tr key={o.outcomeId}>
                            <td className="py-2 text-text-light dark:text-text-dark">{o.title}</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{(o.probability * 100).toFixed(1)}%</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{o.monetaryPayoff !== null ? "$" + o.monetaryPayoff.toLocaleString() : "N/A"}</td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{o.utilityScore !== null ? o.utilityScore.toFixed(1) : "N/A"}</td>
                            <td className="py-2">
                              <span className={`badge-neutral capitalize ${o.riskLevel === "high" || o.riskLevel === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : o.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                {o.riskLevel}
                              </span>
                            </td>
                            <td className="py-2 text-right text-text-light dark:text-text-dark">{o.contribution !== undefined ? "$" + o.contribution.toLocaleString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </section>

      <section className="card p-6 print:hidden" aria-labelledby="meta-heading">
        <h2 id="meta-heading" className="heading-4 mb-4">Run Metadata</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-light-muted dark:text-text-dark-muted">Algorithm</p>
            <p className="font-medium text-text-light dark:text-text-dark capitalize">{run.algorithmVersion?.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-text-light-muted dark:text-text-dark-muted">Status</p>
            <p className="font-medium text-text-light dark:text-text-dark capitalize">{run.status}</p>
          </div>
          <div>
            <p className="text-text-light-muted dark:text-text-dark-muted">Started</p>
            <p className="font-medium text-text-light dark:text-text-dark">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "N/A"}</p>
          </div>
          <div>
            <p className="text-text-light-muted dark:text-text-dark-muted">Completed</p>
            <p className="font-medium text-text-light dark:text-text-dark">{run.completedAt ? new Date(run.completedAt).toLocaleString() : "N/A"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}