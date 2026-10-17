import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, ChartBarIcon, PlayIcon, DocumentDuplicateIcon, TrashIcon, ShareIcon, ArrowDownTrayIcon, Cog6ToothIcon, ArrowRightIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { DecisionWithRelations, DecisionStatus } from "@decisionos/shared";
import { DecisionTree3D } from "../../components/DecisionTree3D";

type DecisionDetail = Omit<DecisionWithRelations, "alternatives"> & {
  alternatives: Array<{
    id: string;
    title: string;
    description?: string | null;
    order?: number;
    outcomes: Array<{
      id: string;
      title: string;
      description?: string | null;
      probability: number;
      monetaryPayoff?: number | null;
      utilityScore?: number | null;
      riskLevel: "low" | "medium" | "high" | "critical";
    }>;
  }>;
  _count?: {
    alternatives: number;
    criteria: number;
    outcomes: number;
    scenarios: number;
  };
  scenarios?: Array<{ id: string; name: string; isBaseline: boolean }>;
};

const statusLabels: Record<DecisionStatus, string> = { draft: "Draft", active: "Active", archived: "Archived", completed: "Completed" };
const statusColors: Record<DecisionStatus, string> = { draft: "badge-neutral", active: "badge-primary", archived: "badge-neutral", completed: "badge-success" };

function buildDecisionTreeNodes(decision: DecisionDetail) {
  const nodes: Array<{ id: string; title: string; type: "decision" | "alternative" | "outcome"; position: [number, number, number]; color: string; data?: Record<string, unknown> }> = [];
  const links: Array<{ source: string; target: string }> = [];

  nodes.push({
    id: decision.id,
    title: decision.title,
    type: "decision",
    position: [0, 0, 0],
    color: "#4f46e5",
    data: decision,
  });

  const altRadius = 4;
  decision.alternatives.forEach((alt, altIndex) => {
    const angle = (altIndex / decision.alternatives.length) * Math.PI * 2;
    const x = Math.cos(angle) * altRadius;
    const y = Math.sin(angle) * altRadius;
    const altId = `alt-${alt.id}`;
    nodes.push({
      id: altId,
      title: alt.title,
      type: "alternative",
      position: [x, y, 0],
      color: "#059669",
      data: alt,
    });
    links.push({ source: decision.id, target: altId });

    const outcomeRadius = 2.5;
    alt.outcomes.forEach((outcome, outcomeIndex) => {
      const oAngle = (outcomeIndex / alt.outcomes.length) * Math.PI * 2 + angle;
      const ox = x + Math.cos(oAngle) * outcomeRadius;
      const oy = y + Math.sin(oAngle) * outcomeRadius;
      const outcomeId = `outcome-${outcome.id}`;
      const isPositive = (outcome.monetaryPayoff ?? 0) >= 0;
      nodes.push({
        id: outcomeId,
        title: outcome.title,
        type: "outcome",
        position: [ox, oy, 0],
        color: isPositive ? "#059669" : "#dc2626",
        data: outcome,
      });
      links.push({ source: altId, target: outcomeId });
    });
  });

  return { nodes, links };
}

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareDialog, setShareDialog] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const { data: decision, isLoading } = useQuery<DecisionDetail>({
    queryKey: ["decision", id],
    queryFn: async () => {
      const response = await api.get(`/decisions/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { await api.delete(`/decisions/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["decisions"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }); toast.success("Decision deleted"); navigate("/decisions"); },
    onError: () => toast.error("Failed to delete"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => { const response = await api.post(`/decisions/${id}/duplicate`); return response.data.data; },
    onSuccess: (newDecision) => { queryClient.invalidateQueries({ queryKey: ["decisions"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }); toast.success("Duplicated"); navigate(`/decisions/${newDecision.id}`); },
    onError: () => toast.error("Failed to duplicate"),
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-surface-light-border dark:bg-surface-dark-border rounded w-1/4" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="card p-6 h-32" /><div className="card p-6 h-32" /><div className="card p-6 h-32" /></div></div>;
  }

  if (!decision) {
    return <div className="text-center py-12"><h2 className="heading-3 mb-2">Decision not found</h2><Link to="/decisions" className="btn-primary">Back to Decisions</Link></div>;
  }

  const alternativesCount = decision._count?.alternatives ?? 0;
  const criteriaCount = decision._count?.criteria ?? 0;
  const outcomesCount = decision._count?.outcomes ?? 0;
  const scenariosCount = decision._count?.scenarios ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/decisions" className="btn-ghost">
          <ArrowLeftIcon className="h-5 w-5" /> Back
        </Link>
        <div>
          <h1 className="heading-2">{decision.title}</h1>
          <p className="body mt-1">{decision.question}</p>
        </div>
        <div className="flex items-center gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="btn-secondary">
              <Cog6ToothIcon className="h-5 w-5" /> Actions
            </Menu.Button>
            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-surface-light border border-surface-light-border shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link to={`/decisions/${id}/edit`} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}>
                        <Cog6ToothIcon className="h-4 w-4" /> Edit
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}>
                        <DocumentDuplicateIcon className="h-4 w-4" /> Duplicate
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => setShareDialog("open")} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}>
                        <ShareIcon className="h-4 w-4" /> Share
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => setDeleteDialog(true)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 ${active ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6" style={{ transitionDelay: "0ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><ChartBarIcon className="h-6 w-6" /></div>
            <div><p className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Alternatives</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{alternativesCount}</p></div>
          </div>
          <Link to={`/decisions/${id}`} className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">Manage <ArrowRightIcon className="h-4 w-4 inline" /></Link>
        </motion.article>
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6" style={{ transitionDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><Cog6ToothIcon className="h-6 w-6" /></div>
            <div><p className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Criteria</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{criteriaCount}</p></div>
          </div>
          <Link to={`/decisions/${id}`} className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">Manage <ArrowRightIcon className="h-4 w-4 inline" /></Link>
        </motion.article>
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6" style={{ transitionDelay: "100ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"><DocumentIcon className="h-6 w-6" /></div>
            <div><p className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Outcomes</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{outcomesCount}</p></div>
          </div>
          <Link to={`/decisions/${id}`} className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">Manage <ArrowRightIcon className="h-4 w-4 inline" /></Link>
        </motion.article>
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6" style={{ transitionDelay: "150ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"><PlayIcon className="h-6 w-6" /></div>
            <div><p className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Scenarios</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{scenariosCount}</p></div>
          </div>
          <Link to={`/scenarios/${id}`} className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">Open Lab <ArrowRightIcon className="h-4 w-4 inline" /></Link>
        </motion.article>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6" aria-labelledby="tree-heading">
            <h2 id="tree-heading" className="heading-4 mb-4">Decision Tree Visualization</h2>
            {(() => {
              const { nodes, links } = buildDecisionTreeNodes(decision);
              return <DecisionTree3D nodes={nodes} links={links} height={400} />;
            })()}
          </section>

          <section className="card p-6" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="heading-4 mb-4">Decision Summary</h2>
            <dl className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Status</dt>
                <dd><span className={`badge ${statusColors[decision.status]}`}>{statusLabels[decision.status]}</span></dd>
                <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Category</dt>
                <dd><span className="badge-neutral">{decision.category.replace("_", " ")}</span></dd>
                <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Created</dt>
                <dd className="text-text-light dark:text-text-dark">{formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true })}</dd>
                <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Updated</dt>
                <dd className="text-text-light dark:text-text-dark">{formatDistanceToNow(new Date(decision.updatedAt), { addSuffix: true })}</dd>
              </div>
              {decision.deadline && (
                <div>
                  <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Deadline</dt>
                  <dd className="text-text-light dark:text-text-dark">{new Date(decision.deadline).toLocaleDateString()}</dd>
                </div>
              )}
              {decision.description && (
                <div>
                  <dt className="text-sm font-medium text-text-light-muted dark:text-text-dark-muted">Description</dt>
                  <dd className="text-text-light dark:text-text-dark mt-1 whitespace-pre-wrap">{decision.description}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="heading-4 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to={`/scenarios/${id}`} className="btn-primary w-full justify-center gap-2">
                <PlayIcon className="h-5 w-5" /> Run Simulation
              </Link>
              <Link to={`/decisions/${id}/edit`} className="btn-secondary w-full justify-center gap-2">
                <Cog6ToothIcon className="h-5 w-5" /> Edit Decision
              </Link>
              <button className="btn-secondary w-full justify-center gap-2" onClick={() => setShareDialog("open")}>
                <ShareIcon className="h-5 w-5" /> Share Decision
              </button>
              <button className="btn-secondary w-full justify-center gap-2">
                <ArrowDownTrayIcon className="h-5 w-5" /> Export Report
              </button>
              <button className="btn-secondary w-full justify-center gap-2">
                <ArrowDownTrayIcon className="h-5 w-5" /> Export Excel
              </button>
            </div>
          </section>

          {decision.scenarios && decision.scenarios.length > 0 && (
            <section className="card p-6" aria-labelledby="scenarios-heading">
              <h2 id="scenarios-heading" className="heading-4 mb-4">Saved Scenarios</h2>
              <div className="space-y-2">
                {decision.scenarios.map((scenario) => (
                  <Link key={scenario.id} to={`/scenarios/${id}?scenario=${scenario.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors">
                    <div>
                      <p className="font-medium text-text-light dark:text-text-dark">{scenario.name}</p>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted">{scenario.isBaseline ? "Baseline" : "Modified"}</p>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-text-light-muted dark:text-text-dark-muted" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Transition.Root show={!!shareDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShareDialog(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border">
                  <Dialog.Title className="heading-4 mb-4">Share Decision</Dialog.Title>
                  <p className="body mb-4">Create a read-only link to share this decision. Recipients can view the tree, alternatives, and outcomes but cannot edit.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Access Level</label>
                      <select className="input">
                        <option value="view">View only</option>
                        <option value="comment">View & Comment</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Expiration (optional)</label>
                      <input type="date" className="input" min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <button className="btn-primary w-full">Generate Share Link</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={deleteDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteDialog(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border">
                  <Dialog.Title className="heading-4 mb-4">Delete Decision</Dialog.Title>
                  <p className="body mb-6">Are you sure you want to delete "{decision.title}"? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteDialog(false)} className="btn-secondary">Cancel</button>
                    <button onClick={() => { deleteMutation.mutate(); setDeleteDialog(false); }} disabled={deleteMutation.isPending} className="btn-danger">
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </button>
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