import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, LinkIcon, ArrowTopRightOnSquareIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import api from "../utils/api";

export default function SharedDecisionPage() {
  const { token } = useParams<{ token: string }>();

  const { data: sharedData, isLoading, error } = useQuery({
    queryKey: ["shared-decision", token],
    queryFn: async () => {
      const response = await api.get(`/decisions/shared/public/${token}`);
      return response.data.data;
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto p-8">
          <div className="h-8 bg-surface-light-border dark:bg-surface-dark-border rounded w-1/3" />
          <div className="h-32 bg-surface-light-border dark:bg-surface-dark-border rounded" />
          <div className="grid grid-cols-3 gap-4"><div className="h-24 bg-surface-light-border dark:bg-surface-dark-border rounded" /><div className="h-24 bg-surface-light-border dark:bg-surface-dark-border rounded" /><div className="h-24 bg-surface-light-border dark:bg-surface-dark-border rounded" /></div>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark px-4">
        <div className="max-w-md text-center">
          <LinkIcon className="h-16 w-16 mx-auto text-text-light-muted dark:text-text-dark-muted mb-4" />
          <h1 className="heading-2 mb-2">Shared Decision Not Found</h1>
          <p className="body mb-6">This link may have expired or the decision may have been made private.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const { decision, accessLevel, shareId } = sharedData;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="sticky top-0 z-40 border-b border-surface-light-border bg-surface-light/80 backdrop-blur-sm dark:border-surface-dark-border dark:bg-surface-dark/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="btn-ghost">
            <ArrowLeftIcon className="h-5 w-5" /> Back to DMOC
          </Link>
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">Shared View ({accessLevel})</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="py-8">
        <div className="container space-y-8">
          <div className="p-6 bg-surface-light-hover dark:bg-surface-dark-hover rounded-xl border border-surface-light-border dark:border-surface-dark-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="badge-primary mb-2 inline-block">{decision.category.replace("_", " ")}</span>
                <h1 className="heading-2 mb-2">{decision.title}</h1>
                <p className="body">{decision.question}</p>
              </div>
              {decision.owner && (
                <div className="text-right text-sm text-text-light-muted dark:text-text-dark-muted">
                  <p>Created by {decision.owner.name}</p>
                  <p className="flex items-center justify-end gap-1">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    <span>Share ID: {shareId?.slice(0, 8)}...</span>
                  </p>
                </div>
              )}
            </div>
            {decision.description && (
              <div className="mt-4 pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                <p className="body">{decision.description}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <h2 className="heading-4 mb-4 flex items-center gap-2"><ChartBarIcon className="h-5 w-5" /> Alternatives ({decision._count?.alternatives || decision.alternatives?.length || 0})</h2>
              <ul className="space-y-3">
                {decision.alternatives?.map((alt: { title: string; description?: string; outcomes?: Array<{ title: string; probability: number; monetaryPayoff?: number; riskLevel: string }> }, index: number) => (
                  <li key={alt.title || index} className="p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                    <h3 className="font-medium text-text-light dark:text-text-dark">{alt.title}</h3>
                    {alt.description && <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">{alt.description}</p>}
                    {alt.outcomes && alt.outcomes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {alt.outcomes.map((o: { title: string; probability: number; monetaryPayoff?: number; riskLevel: string }, oi: number) => (
                          <div key={oi} className="flex items-center justify-between text-xs">
                            <span className="text-text-light-muted dark:text-text-dark-muted">{o.title} ({(o.probability * 100).toFixed(0)}%)</span>
                            <span className="font-medium">{o.monetaryPayoff !== undefined ? `$${o.monetaryPayoff.toLocaleString()}` : o.riskLevel}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {(!decision.alternatives || decision.alternatives.length === 0) && <p className="text-text-light-muted dark:text-text-dark-muted text-center py-4">No alternatives defined</p>}
            </motion.article>

            <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 100 }} className="card p-6">
              <h2 className="heading-4 mb-4">Criteria ({decision._count?.criteria || decision.criteria?.length || 0})</h2>
              <ul className="space-y-2">
                {decision.criteria?.map((c: { name: string; weight: number; direction: string }, index: number) => (
                  <li key={c.name || index} className="flex items-center justify-between p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                    <div>
                      <p className="font-medium text-text-light dark:text-text-dark">{c.name}</p>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted">{c.direction === "maximize" ? "Higher is better" : "Lower is better"}</p>
                    </div>
                    <span className="badge-primary">{c.weight}</span>
                  </li>
                ))}
              </ul>
              {(!decision.criteria || decision.criteria.length === 0) && <p className="text-text-light-muted dark:text-text-dark-muted text-center py-4">No criteria defined</p>}
            </motion.article>

            <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 200 }} className="card p-6">
              <h2 className="heading-4 mb-4">Scenarios ({decision._count?.scenarios || decision.scenarios?.length || 0})</h2>
              <ul className="space-y-2">
                {decision.scenarios?.map((s: { name: string; isBaseline: boolean; description?: string }, index: number) => (
                  <li key={s.name || index} className="p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-text-light dark:text-text-dark">{s.name}</h3>
                      {s.isBaseline && <span className="badge-primary text-xs">Baseline</span>}
                    </div>
                    {s.description && <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1">{s.description}</p>}
                  </li>
                ))}
              </ul>
              {(!decision.scenarios || decision.scenarios.length === 0) && <p className="text-text-light-muted dark:text-text-dark-muted text-center py-4">No scenarios saved</p>}
            </motion.article>
          </div>

          <div className="card p-6 border border-surface-light-border dark:border-surface-dark-border bg-yellow-50 dark:bg-yellow-900/10">
            <h3 className="heading-4 mb-2 flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Disclaimer</h3>
            <p className="body text-yellow-800 dark:text-yellow-200">
              This is a read-only shared view of a decision. The analysis and recommendations are based on the decision owner's assumptions and input data.
              Results do not guarantee outcomes. Consider this information as decision support, not professional advice.
              The decision owner can revoke this link at any time.
            </p>
          </div>

          <div className="text-center">
            <Link to="/register" className="btn-primary inline-flex">
              Create Your Own Decisions <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}