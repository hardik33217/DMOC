import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PlusIcon, DocumentDuplicateIcon, ArrowLeftIcon, ChartBarIcon, ArrowRightIcon, XMarkIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";

export default function ScenarioLabPage() {
  const { decisionId } = useParams<{ decisionId: string }>();
  const queryClient = useQueryClient();
  const [scenarioDialog, setScenarioDialog] = useState<"create" | "edit" | null>(null);
  const [editingScenario, setEditingScenario] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [inputEditorScenario, setInputEditorScenario] = useState<{ id: string; name: string } | null>(null);
  const [inputScores, setInputScores] = useState<Record<string, Record<string, number>>>({});
  const [compareDialog, setCompareDialog] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareResults, setCompareResults] = useState<any | null>(null);
  const [runDialog, setRunDialog] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<"weighted" | "monte_carlo" | "emv" | "utility">("weighted");
  const [iterations, setIterations] = useState(10000);
  const [resultsDialog, setResultsDialog] = useState<{ runId: string; explanation: string; results: any[] } | null>(null);
  const [sensitivityData, setSensitivityData] = useState<any[] | null>(null);

  const { data: decision } = useQuery({
    queryKey: ["decision", decisionId],
    queryFn: async () => { const response = await api.get(`/decisions/${decisionId}`); return response.data.data; },
    enabled: !!decisionId,
  });

  const { data: scenariosData } = useQuery({
    queryKey: ["scenarios", decisionId],
    queryFn: async () => { const response = await api.get(`/decisions/${decisionId}/scenarios`); return response.data.data; },
    enabled: !!decisionId,
  });

  const { data: runsData } = useQuery({
    queryKey: ["simulation-runs", decisionId],
    queryFn: async () => { const response = await api.get(`/decisions/${decisionId}/simulations/runs`); return response.data.data; },
    enabled: !!decisionId,
  });

  const { data: marketData } = useQuery({
    queryKey: ["market-benchmarks"],
    queryFn: async () => {
      try {
        const response = await api.get("/market-data/benchmarks");
        return response.data.data;
      } catch {
        return { riskFreeRate: 4.28, inflationRate: 2.9, waccBenchmark: 8.5 };
      }
    },
  });

  const { data: activeScenarioData } = useQuery({
    queryKey: ["scenario-detail", decisionId, inputEditorScenario?.id],
    queryFn: async () => {
      const response = await api.get(`/decisions/${decisionId}/scenarios/${inputEditorScenario!.id}`);
      return response.data.data;
    },
    enabled: !!inputEditorScenario?.id,
  });

  useEffect(() => {
    if (activeScenarioData && decision) {
      const scores: Record<string, Record<string, number>> = {};
      decision.criteria?.forEach((c: any) => {
        scores[c.id] = {};
        decision.alternatives?.forEach((a: any) => {
          const input = activeScenarioData.inputs?.find((i: any) => i.entityType === "criterion" && i.entityId === c.id && (i.field === `score_${a.id}` || i.field === "score"));
          scores[c.id][a.id] = input ? parseFloat(input.value) : 50;
        });
      });
      setInputScores(scores);
    }
  }, [activeScenarioData, decision]);

  const saveInputsMutation = useMutation({
    mutationFn: async () => {
      if (!inputEditorScenario) return;
      const promises: Promise<any>[] = [];
      Object.entries(inputScores).forEach(([criterionId, altMap]) => {
        Object.entries(altMap).forEach(([altId, score]) => {
          promises.push(
            api.post(`/decisions/${decisionId}/scenarios/${inputEditorScenario.id}/inputs`, {
              entityType: "criterion",
              entityId: criterionId,
              field: `score_${altId}`,
              value: String(score),
            })
          );
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] });
      queryClient.invalidateQueries({ queryKey: ["scenario-detail", decisionId, inputEditorScenario?.id] });
      toast.success("Scenario assumptions saved!");
      setInputEditorScenario(null);
    },
    onError: () => toast.error("Failed to save assumptions"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; parentScenarioId?: string }) => {
      const response = await api.post(`/decisions/${decisionId}/scenarios`, data);
      return response.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] }); toast.success("Scenario created"); setScenarioDialog(null); },
    onError: () => toast.error("Failed to create scenario"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      const response = await api.patch(`/decisions/${decisionId}/scenarios/${data.id}`, { name: data.name, description: data.description });
      return response.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] }); toast.success("Scenario updated"); setScenarioDialog(null); setEditingScenario(null); },
    onError: () => toast.error("Failed to update scenario"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/decisions/${decisionId}/scenarios/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] }); toast.success("Scenario deleted"); },
    onError: () => toast.error("Failed to delete scenario"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => { const response = await api.post(`/decisions/${decisionId}/scenarios/${id}/duplicate`); return response.data.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] }); toast.success("Scenario duplicated"); },
    onError: () => toast.error("Failed to duplicate"),
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => { await api.post(`/decisions/${decisionId}/scenarios/${id}/reset`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios", decisionId] }); toast.success("Reset to baseline"); },
    onError: () => toast.error("Failed to reset"),
  });

  const runMutation = useMutation({
    mutationFn: async (scenarioId: string) => { const response = await api.post(`/decisions/${decisionId}/simulations/run`, { scenarioId, algorithm: selectedAlgorithm, iterations }); return response.data.data; },
    onSuccess: (result) => { 
      queryClient.invalidateQueries({ queryKey: ["simulation-runs", decisionId] }); 
      toast.success("Simulation complete"); 
      setRunDialog(null); 
      setResultsDialog({ 
        runId: result.simulationRun.id, 
        explanation: result.explanation, 
        results: result.results 
      });
    },
    onError: () => toast.error("Simulation failed"),
  });

  const sensitivityMutation = useMutation({
    mutationFn: async () => { const response = await api.post(`/decisions/${decisionId}/simulations/sensitivity`, {}); return response.data.data; },
    onSuccess: (data) => { toast.success("Sensitivity analysis complete"); setSensitivityData(data.sensitivity); },
    onError: () => toast.error("Sensitivity analysis failed"),
  });

  const compareMutation = useMutation({
    mutationFn: async (ids: string[]) => { 
      const baselineId = scenarios.find((s: any) => s.isBaseline)?.id;
      if (!baselineId) throw new Error("No baseline scenario");
      const response = await api.post(`/decisions/${decisionId}/simulations/compare`, { baselineScenarioId: baselineId, scenarioIds: ids });
      return response.data.data; 
    },
    onSuccess: (data) => { 
      toast.success("Comparison complete"); 
      setCompareResults(data);
      setCompareDialog(true);
    },
    onError: () => toast.error("Comparison failed"),
  });

  const scenarios = scenariosData || [];
  const runs = runsData || [];
  const latestRun = runs[0];

  const handleCompare = () => {
    if (compareIds.length >= 2) {
      setCompareDialog(true);
    } else {
      toast.error("Select at least 2 scenarios to compare");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to={`/decisions/${decisionId}`} className="btn-ghost">
          <ArrowLeftIcon className="h-5 w-5" /> Back to Decision
        </Link>
        <div>
          <h1 className="heading-2">Scenario Lab</h1>
          <p className="body mt-1">{decision?.title}</p>
        </div>
        <button onClick={() => { setEditingScenario(null); setScenarioDialog("create"); }} className="btn-primary">
          <PlusIcon className="h-5 w-5" /> New Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6" aria-labelledby="scenarios-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="scenarios-heading" className="heading-4">Scenarios</h2>
              <div className="flex gap-2">
                <button onClick={handleCompare} disabled={compareIds.length < 2} className="btn-secondary btn-sm">Compare Selected</button>
              </div>
            </div>

            {scenarios.length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 mx-auto text-text-light-muted dark:text-text-dark-muted mb-3" />
                <h3 className="heading-4 mb-1">No scenarios yet</h3>
                <p className="body mb-4">Create scenarios to test different assumptions</p>
                <button onClick={() => setScenarioDialog("create")} className="btn-primary">Create First Scenario</button>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map((scenario: { id: string; name: string; description?: string; isBaseline: boolean; parentScenarioId?: string; _count: { inputs: number; simulationRuns: number } }) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${compareIds.includes(scenario.id) ? "bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800" : "hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover border-surface-light-border dark:border-surface-dark-border"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(scenario.id)}
                        onChange={e => setCompareIds(e.target.checked ? [...compareIds, scenario.id] : compareIds.filter(id => id !== scenario.id))}
                        className="h-4 w-4 rounded border-surface-light-border text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-text-light dark:text-text-dark">{scenario.name}</h3>
                          {scenario.isBaseline && <span className="badge-primary text-xs">Baseline</span>}
                        </div>
                        <p className="text-sm text-text-light-muted dark:text-text-dark-muted">{scenario.description || "No description"} • {scenario._count.inputs} modified inputs • {scenario._count.simulationRuns} runs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedAlgorithm("weighted"); setRunDialog(scenario.id); }} disabled={runMutation.isPending} className="btn-primary btn-sm">
                        {runMutation.isPending && runDialog === scenario.id ? "Running..." : "Run Simulation"}
                      </button>
                      <button onClick={() => setInputEditorScenario(scenario)} className="btn-secondary btn-sm flex items-center gap-1">
                        <AdjustmentsHorizontalIcon className="h-4 w-4" /> Assumptions
                      </button>
                      <button onClick={() => { setEditingScenario(scenario); setScenarioDialog("edit"); }} className="btn-ghost btn-sm">Edit</button>
                      {!scenario.isBaseline && (
                        <>
                          <button onClick={() => duplicateMutation.mutate(scenario.id)} className="btn-ghost btn-sm">Duplicate</button>
                          <button onClick={() => resetMutation.mutate(scenario.id)} className="btn-ghost btn-sm">Reset</button>
                          <button onClick={() => deleteMutation.mutate(scenario.id)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {latestRun && (
            <section className="card p-6" aria-labelledby="latest-run-heading">
              <h2 id="latest-run-heading" className="heading-4 mb-4">Latest Simulation Results</h2>
              <div className="space-y-3">
                {latestRun.results?.map((result: any, rIdx: number) => {
                  const altTitle = result.alternative?.title || result.alternativeTitle || `Alternative #${result.rank || rIdx + 1}`;
                  const altId = result.alternative?.id || result.alternativeId || `run-res-${rIdx}`;
                  return (
                    <motion.div key={altId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                      <div>
                        <p className="font-medium text-text-light dark:text-text-dark">{altTitle}</p>
                        <p className="text-sm text-text-light-muted dark:text-text-dark-muted">Rank #{result.rank}</p>
                      </div>
                      <div className="text-right">
                        {result.weightedScore !== undefined && result.weightedScore !== null && <p className="text-lg font-bold text-brand-600 dark:text-brand-400">Score: {Number(result.weightedScore).toFixed(3)}</p>}
                        {result.expectedMonetaryValue !== undefined && result.expectedMonetaryValue !== null && <p className="text-lg font-bold text-green-600 dark:text-green-400">EMV: ${Math.round(result.expectedMonetaryValue).toLocaleString()}</p>}
                        {result.expectedUtility !== undefined && result.expectedUtility !== null && <p className="text-lg font-bold text-purple-600 dark:text-purple-400">Utility: {Number(result.expectedUtility).toFixed(1)}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <Link to={`/decisions/${decisionId}/simulations/runs/${latestRun.id}`} className="btn-secondary">View Full Results</Link>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="heading-4 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => { setEditingScenario(null); setScenarioDialog("create"); }} className="btn-secondary w-full justify-start gap-3">
                <PlusIcon className="h-5 w-5" /> New Scenario
              </button>
              <button onClick={handleCompare} disabled={compareIds.length < 2} className="btn-secondary w-full justify-start gap-3">
                <ChartBarIcon className="h-5 w-5" /> Compare {compareIds.length} Scenarios
              </button>
              <button onClick={() => sensitivityMutation.mutate()} disabled={sensitivityMutation.isPending} className="btn-secondary w-full justify-start gap-3">
                <ArrowRightIcon className="h-5 w-5" /> Sensitivity Analysis
              </button>
              <button onClick={() => { const baseline = scenarios.find((s: any) => s.isBaseline)?.id; if (baseline) setCompareIds([baseline, ...scenarios.filter((s: any) => !s.isBaseline).slice(0, 4).map((s: any) => s.id)]); }} className="btn-secondary w-full justify-start gap-3">
                <DocumentDuplicateIcon className="h-5 w-5" /> Duplicate Baseline
              </button>
            </div>
          </section>

          <section className="card p-6 border-brand-200 dark:border-brand-900/40 bg-gradient-to-br from-brand-50/50 to-surface-light dark:from-brand-950/20 dark:to-surface-dark" aria-labelledby="market-data-heading">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 id="market-data-heading" className="font-semibold text-text-light dark:text-text-dark">Live Market Feeds</h2>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live API
              </span>
            </div>
            <p className="text-xs text-text-light-muted dark:text-text-dark-muted mb-4">
              Real-time central bank benchmarks powering EMV discounting, utility valuation, and financial risk models.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                <p className="text-xs text-text-light-muted dark:text-text-dark-muted">Risk-Free Rate</p>
                <p className="text-base font-bold text-brand-600 dark:text-brand-400">{marketData?.riskFreeRate ?? 4.28}% <span className="text-xs font-normal text-text-light-muted">p.a.</span></p>
              </div>
              <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                <p className="text-xs text-text-light-muted dark:text-text-dark-muted">CPI Inflation</p>
                <p className="text-base font-bold text-orange-600 dark:text-orange-400">{marketData?.inflationRate ?? 2.9}% <span className="text-xs font-normal text-text-light-muted">p.a.</span></p>
              </div>
              <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                <p className="text-xs text-text-light-muted dark:text-text-dark-muted">WACC Benchmark</p>
                <p className="text-base font-bold text-purple-600 dark:text-purple-400">{marketData?.waccBenchmark ?? 8.5}%</p>
              </div>
              <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                <p className="text-xs text-text-light-muted dark:text-text-dark-muted">Corporate Tax</p>
                <p className="text-base font-bold text-text-light dark:text-text-dark">{marketData?.corporateTaxRate ?? 21.0}%</p>
              </div>
            </div>
          </section>

          <section className="card p-6" aria-labelledby="tips-heading">
            <h2 id="tips-heading" className="heading-4 mb-4">Tips</h2>
            <ul className="space-y-2 text-sm text-text-light-muted dark:text-text-dark-muted">
              <li className="flex gap-2"><span className="text-brand-600 dark:text-brand-400">→</span> Modify probabilities, payoffs, or weights in a scenario</li>
              <li className="flex gap-2"><span className="text-brand-600 dark:text-brand-400">→</span> Compare scenarios to see what changes the recommendation</li>
              <li className="flex gap-2"><span className="text-brand-600 dark:text-brand-400">→</span> Use sensitivity analysis to find key drivers</li>
              <li className="flex gap-2"><span className="text-brand-600 dark:text-brand-400">→</span> Save multiple scenarios for different "what-if" cases</li>
            </ul>
          </section>
        </div>
      </div>

      <Transition.Root show={!!scenarioDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { setScenarioDialog(null); setEditingScenario(null); }}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border">
                  <Dialog.Title className="heading-4 mb-4">{scenarioDialog === "create" ? "New Scenario" : "Edit Scenario"}</Dialog.Title>
                  <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = fd.get("name") as string; const description = fd.get("description") as string; if (scenarioDialog === "create") createMutation.mutate({ name, description }); else if (editingScenario) updateMutation.mutate({ id: editingScenario.id, name, description }); }} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="label">Name</label>
                      <input id="name" name="name" defaultValue={editingScenario?.name || ""} className="input" required />
                    </div>
                    <div>
                      <label htmlFor="description" className="label">Description</label>
                      <textarea id="description" name="description" defaultValue={editingScenario?.description || ""} rows={3} className="input" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => { setScenarioDialog(null); setEditingScenario(null); }} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                        {scenarioDialog === "create" ? "Create" : "Save"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={compareDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setCompareDialog(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg max-h-[85vh] overflow-y-auto dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="heading-4">Compare Decision Scenarios</Dialog.Title>
                    <button onClick={() => { setCompareDialog(false); setCompareResults(null); }} className="text-text-light-muted hover:text-text-light dark:hover:text-text-dark">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {compareResults ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="border-b border-surface-light-border dark:border-surface-dark-border text-text-light-muted">
                              <th className="py-2.5 pr-3 font-semibold">Alternative</th>
                              <th className="py-2.5 px-3 bg-brand-50/60 dark:bg-brand-950/30 rounded font-semibold text-brand-700 dark:text-brand-300">
                                {compareResults.baseline?.scenario?.name || "Baseline"}
                              </th>
                              {compareResults.scenarios?.map((s: any) => (
                                <th key={s.scenario.id} className="py-2.5 px-3 font-semibold">{s.scenario.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
                            {decision?.alternatives?.map((alt: any) => {
                              const bResult = compareResults.baseline?.run?.results?.find((r: any) => r.alternativeId === alt.id);
                              return (
                                <tr key={alt.id}>
                                  <td className="py-3 pr-3 font-medium text-text-light dark:text-text-dark">{alt.title}</td>
                                  <td className="py-3 px-3 bg-brand-50/40 dark:bg-brand-950/20">
                                    <div className="font-bold text-brand-600 dark:text-brand-400">Score: {bResult?.weightedScore ? Number(bResult.weightedScore).toFixed(3) : "—"}</div>
                                    <div className="text-xs text-green-600 dark:text-green-400">EMV: ${bResult?.expectedMonetaryValue ? Math.round(bResult.expectedMonetaryValue).toLocaleString() : "—"}</div>
                                    <div className="text-xs text-text-light-muted">Rank #{bResult?.rank ?? "—"}</div>
                                  </td>
                                  {compareResults.scenarios?.map((s: any) => {
                                    const sResult = s.run?.results?.find((r: any) => r.alternativeId === alt.id);
                                    return (
                                      <td key={s.scenario.id} className="py-3 px-3">
                                        <div className="font-bold text-brand-600 dark:text-brand-400">Score: {sResult?.weightedScore ? Number(sResult.weightedScore).toFixed(3) : "—"}</div>
                                        <div className="text-xs text-green-600 dark:text-green-400">EMV: ${sResult?.expectedMonetaryValue ? Math.round(sResult.expectedMonetaryValue).toLocaleString() : "—"}</div>
                                        <div className="text-xs text-text-light-muted">Rank #{sResult?.rank ?? "—"}</div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                      <p className="text-sm text-text-light-muted dark:text-text-dark-muted">
                        Select scenarios below to compare performance metrics against the empirical baseline:
                      </p>
                      {scenarios.filter((s: any) => compareIds.includes(s.id)).map((scenario: any) => (
                        <div key={scenario.id} className="p-4 border border-surface-light-border dark:border-surface-dark-border rounded-lg">
                          <h4 className="font-medium mb-1">{scenario.name} {scenario.isBaseline && <span className="badge-primary text-xs ml-2">Baseline</span>}</h4>
                          <p className="text-sm text-text-light-muted dark:text-text-dark-muted mb-2">{scenario.description || "No description"}</p>
                          <div className="flex gap-2 flex-wrap">
                            {scenario._count.simulationRuns > 0 && <span className="badge-success text-xs">Simulated</span>}
                            <span className="badge-neutral text-xs">{scenario._count.inputs} assumption overrides</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-light-border dark:border-surface-dark-border mt-4">
                    <button onClick={() => { setCompareDialog(false); setCompareResults(null); }} className="btn-secondary">Close</button>
                    {!compareResults && (
                      <button onClick={() => compareMutation.mutate(compareIds)} disabled={compareMutation.isPending || compareIds.length < 2} className="btn-primary">
                        {compareMutation.isPending ? "Comparing..." : "Run Side-by-Side Comparison"}
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Assumptions / Inputs Adjuster Dialog */}
      <Transition.Root show={!!inputEditorScenario} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setInputEditorScenario(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg max-h-[85vh] overflow-y-auto dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Dialog.Title className="heading-4">Adjust Scenario Assumptions</Dialog.Title>
                      <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">
                        Scenario: <span className="font-semibold text-brand-600 dark:text-brand-400">{inputEditorScenario?.name}</span>
                      </p>
                    </div>
                    <button onClick={() => setInputEditorScenario(null)} className="text-text-light-muted hover:text-text-light dark:hover:text-text-dark">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-sm text-text-light-muted dark:text-text-dark-muted mb-4">
                    Customize raw criterion performance scores (0–100) for each alternative under this scenario to test what-if assumptions against baseline:
                  </p>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {decision?.criteria?.map((criterion: any) => (
                      <div key={criterion.id} className="p-4 rounded-lg border border-surface-light-border dark:border-surface-dark-border bg-surface-light-hover/30 dark:bg-surface-dark-hover/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-text-light dark:text-text-dark">{criterion.name}</h4>
                            <span className="text-xs text-text-light-muted dark:text-text-dark-muted">
                              Weight: {criterion.weight}% • Direction: {criterion.direction}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {decision.alternatives?.map((alt: any) => {
                            const currentScore = inputScores[criterion.id]?.[alt.id] ?? 50;
                            return (
                              <div key={alt.id} className="p-3 rounded bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border">
                                <label className="block text-xs font-medium text-text-light dark:text-text-dark truncate mb-1">
                                  {alt.title}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentScore}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      setInputScores((prev) => ({
                                        ...prev,
                                        [criterion.id]: {
                                          ...(prev[criterion.id] || {}),
                                          [alt.id]: val,
                                        },
                                      }));
                                    }}
                                    className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700"
                                  />
                                  <span className="text-xs font-bold w-8 text-right text-brand-600 dark:text-brand-400">
                                    {currentScore}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-light-border dark:border-surface-dark-border mt-4">
                    <button type="button" onClick={() => setInputEditorScenario(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveInputsMutation.mutate()}
                      disabled={saveInputsMutation.isPending}
                      className="btn-primary"
                    >
                      {saveInputsMutation.isPending ? "Saving..." : "Save Assumptions"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={!!runDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setRunDialog(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="heading-4">Run Simulation</Dialog.Title>
                    <button onClick={() => setRunDialog(null)} className="text-text-light-muted hover:text-text-light dark:hover:text-text-dark">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={e => { e.preventDefault(); runMutation.mutate(runDialog!); }} className="space-y-4">
                    <div>
                      <label htmlFor="algorithm" className="label">Algorithm</label>
                      <select id="algorithm" name="algorithm" value={selectedAlgorithm} onChange={e => setSelectedAlgorithm(e.target.value as any)} className="input">
                        <option value="weighted">Weighted Scoring (Multi-criteria)</option>
                        <option value="monte_carlo">Monte Carlo (Probabilistic)</option>
                        <option value="emv">Expected Monetary Value</option>
                        <option value="utility">Expected Utility</option>
                      </select>
                    </div>
                    {(selectedAlgorithm === "monte_carlo") && (
                      <div>
                        <label htmlFor="iterations" className="label">Iterations</label>
                        <input id="iterations" name="iterations" type="number" min="1000" max="100000" step="1000" value={iterations} onChange={e => setIterations(parseInt(e.target.value))} className="input" />
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setRunDialog(null)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={runMutation.isPending} className="btn-primary">
                        {runMutation.isPending ? "Running..." : "Run Simulation"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={!!resultsDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setResultsDialog(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg max-h-[80vh] overflow-y-auto dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="heading-4">Simulation Results</Dialog.Title>
                    <button onClick={() => setResultsDialog(null)} className="text-text-light-muted hover:text-text-light dark:hover:text-text-dark">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    <section className="card p-4 bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800">
                      <h3 className="heading-5 mb-3">Recommendation</h3>
                      <pre className="whitespace-pre-wrap text-sm text-text-light dark:text-text-dark font-mono bg-surface-light dark:bg-surface-dark p-4 rounded border border-surface-light-border dark:border-surface-dark-border max-h-60 overflow-y-auto">{resultsDialog?.explanation}</pre>
                    </section>
                    <section className="card p-4">
                      <h3 className="heading-5 mb-3">Detailed Results</h3>
                      <div className="space-y-3">
                        {resultsDialog?.results?.map((result: any, rIdx: number) => {
                          const altTitle = result.alternativeTitle || result.alternative?.title || `Alternative #${result.rank || rIdx + 1}`;
                          return (
                            <motion.div key={result.alternativeId || result.id || rIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-text-light dark:text-text-dark">{altTitle}</h4>
                                <span className="badge-primary">Rank #{result.rank}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-text-light-muted dark:text-text-dark-muted">Weighted Score</p>
                                  <p className="font-bold text-brand-600 dark:text-brand-400">{result.weightedScore !== undefined && result.weightedScore !== null ? Number(result.weightedScore).toFixed(3) : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-text-light-muted dark:text-text-dark-muted">EMV</p>
                                  <p className="font-bold text-green-600 dark:text-green-400">{result.expectedMonetaryValue !== undefined && result.expectedMonetaryValue !== null ? `$${Math.round(result.expectedMonetaryValue).toLocaleString()}` : "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-text-light-muted dark:text-text-dark-muted">Utility</p>
                                  <p className="font-bold text-purple-600 dark:text-purple-400">{result.expectedUtility !== undefined && result.expectedUtility !== null ? Number(result.expectedUtility).toFixed(1) : "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-text-light-muted dark:text-text-dark-muted">Payoff Range</p>
                                  <p className="font-bold text-text-light dark:text-text-dark">
                                    {result.worstCase !== null && result.bestCase !== null && result.worstCase !== undefined && result.bestCase !== undefined
                                      ? `$${Math.round(result.worstCase).toLocaleString()} – $${Math.round(result.bestCase).toLocaleString()}`
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            {result.details?.criterionDetails && (
                              <div className="mt-3 pt-3 border-t border-surface-light-border dark:border-surface-dark-border">
                                <p className="text-sm text-text-light-muted dark:text-text-dark-muted mb-2">Criterion Breakdown</p>
                                <div className="space-y-1">
                                  {Object.entries(result.details.criterionDetails).map(([id, d]: [string, any]) => (
                                    <div key={id} className="flex justify-between text-sm">
                                      <span className="text-text-light-muted dark:text-text-dark-muted">{d.direction === "maximize" ? "↑" : "↓"} {d.normalizedValue.toFixed(3)}</span>
                                      <span className="font-medium text-text-light dark:text-text-dark">{d.weight.toFixed(0)}% weight</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                    <button onClick={() => setResultsDialog(null)} className="btn-secondary">Close</button>
                    <Link to={`/decisions/${decisionId}/simulations/runs/${resultsDialog?.runId}`} className="btn-primary">View Full Report</Link>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={!!sensitivityData} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSensitivityData(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg max-h-[80vh] overflow-y-auto dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="heading-4">Sensitivity Analysis</Dialog.Title>
                    <button onClick={() => setSensitivityData(null)} className="text-text-light-muted hover:text-text-light dark:hover:text-text-dark">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {sensitivityData && sensitivityData.length === 0 ? (
                      <div className="text-center py-8">
                        <ArrowPathIcon className="h-12 w-12 mx-auto text-text-light-muted dark:text-text-dark-muted mb-3" />
                        <h3 className="heading-4 mb-1">No sensitive parameters found</h3>
                        <p className="body text-text-light-muted dark:text-text-dark-muted">The current recommendation is stable across all tested parameter ranges.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sensitivityData?.map((item: any) => (
                          <motion.div key={item.parameter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg border border-surface-light-border dark:border-surface-dark-border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-text-light dark:text-text-dark">{item.parameter}</h4>
                              <span className="badge-primary text-xs capitalize">{item.parameterType.replace("_", " ")}</span>
                            </div>
                            <p className="text-sm text-text-light-muted dark:text-text-dark-muted mb-3">{item.description}</p>
                            <div className="flex gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-text-light-muted dark:text-text-dark-muted">Baseline:</span>
                                <span className="font-medium text-brand-600 dark:text-brand-400">{typeof item.baselineValue === "number" ? item.baselineValue.toFixed(2) : item.baselineValue}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-text-light-muted dark:text-text-dark-muted">Threshold:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{typeof item.thresholdValue === "number" ? item.thresholdValue.toFixed(2) : item.thresholdValue}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                    <button onClick={() => setSensitivityData(null)} className="btn-primary">Close</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}