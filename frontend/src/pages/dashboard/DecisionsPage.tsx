import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, TrashIcon, DocumentDuplicateIcon, ArrowRightIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { PaginationParams, Decision } from "@decisionos/shared";

const statusOptions = ["all", "draft", "active", "archived", "completed"] as const;
const categoryOptions = ["all", "career", "education", "finance", "business", "personal", "project", "resource_allocation", "other"] as const;

export default function DecisionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<typeof statusOptions[number]>((searchParams.get("status") as typeof statusOptions[number]) || "all");
  const [category, setCategory] = useState<typeof categoryOptions[number]>((searchParams.get("category") as typeof categoryOptions[number]) || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const params: PaginationParams = {
    page,
    limit: 20,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...(search && { search }),
    ...(status !== "all" && { status }),
    ...(category !== "all" && { category }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["decisions", params],
    queryFn: async () => {
      const response = await api.get("/decisions", { params });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/decisions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Decision deleted");
      setDeleteDialog(null);
    },
    onError: () => toast.error("Failed to delete decision"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/decisions/${id}/duplicate`);
      return response.data.data;
    },
    onSuccess: (newDecision) => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Decision duplicated");
      navigate(`/decisions/${newDecision.id}`);
    },
    onError: () => toast.error("Failed to duplicate decision"),
  });

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (search) newParams.set("search", search);
    if (status !== "all") newParams.set("status", status);
    if (category !== "all") newParams.set("category", category);
    if (page > 1) newParams.set("page", String(page));
    setSearchParams(newParams, { replace: true });
  }, [search, status, category, page, setSearchParams]);

  const decisions = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">My Decisions</h1>
          <p className="body mt-1">Manage and organize all your decisions</p>
        </div>
        <Link to="/decisions/new" className="btn-primary">
          <PlusIcon className="h-5 w-5" /> New Decision
        </Link>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-xs sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-light-muted dark:text-text-dark-muted" />
            <input
              type="text"
              placeholder="Search decisions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof statusOptions[number]); setPage(1); }}
              className="input w-auto"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value as typeof categoryOptions[number]); setPage(1); }}
              className="input w-auto"
            >
              {categoryOptions.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1).replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-6 animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="card p-12 text-center">
          <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-text-light-muted dark:text-text-dark-muted mb-4" />
          <h3 className="heading-4 mb-2">No decisions found</h3>
          <p className="body mb-6">Create your first decision or adjust your filters</p>
          <Link to="/decisions/new" className="btn-primary inline-flex">
            <PlusIcon className="h-5 w-5" /> Create Decision
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
              {decisions.map((decision: Decision, index: number) => (
                <motion.article
                  key={decision.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-6 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <Link to={`/decisions/${decision.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <ChartBarIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-light dark:text-text-dark truncate">{decision.title}</h3>
                        <p className="text-sm text-text-light-muted dark:text-text-dark-muted truncate mt-1">{decision.question?.slice(0, 100)}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-light-muted dark:text-text-dark-muted">
                          <span className={`badge ${decision.status === "active" ? "badge-primary" : decision.status === "draft" ? "badge-neutral" : decision.status === "completed" ? "badge-success" : "badge-neutral"}`}>
                            {decision.status}
                          </span>
                          <span className="badge-neutral">{decision.category.replace("_", " ")}</span>
                          <span>Updated {formatDistanceToNow(new Date(decision.updatedAt), { addSuffix: true })}</span>
                          {decision.deadline && (
                            <span className={`badge ${new Date(decision.deadline) < new Date() ? "badge-danger" : "badge-warning"}`}>
                              Due {formatDistanceToNow(new Date(decision.deadline), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 sm:ml-4">
                    <Menu as="div" className="relative">
                      <Menu.Button className="btn-ghost btn-sm p-2">
                        <FunnelIcon className="h-5 w-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-surface-light border border-surface-light-border shadow-soft-lg dark:bg-surface-dark dark:border-surface-dark-border focus:outline-none">
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to={`/decisions/${decision.id}`}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}
                                >
                                  <ArrowRightIcon className="h-4 w-4" /> Open
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to={`/scenarios/${decision.id}`}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}
                                >
                                  <ChartBarIcon className="h-4 w-4" /> Simulate
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => { duplicateMutation.mutate(decision.id); }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-light-hover dark:bg-surface-dark-hover" : ""}`}
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" /> Duplicate
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setDeleteDialog(decision.id)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 ${active ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                                >
                                  <TrashIcon className="h-4 w-4" /> Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-sm text-text-light-muted dark:text-text-dark-muted">
                Page {page} of {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(meta.total / meta.limit)}
                className="btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <Transition.Root show={!!deleteDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteDialog(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-soft-lg transition-all dark:bg-surface-dark dark:border-surface-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="heading-4">Delete Decision</Dialog.Title>
                    <button onClick={() => setDeleteDialog(null)} className="btn-ghost">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="body mb-6">Are you sure you want to delete this decision? This action cannot be undone. All alternatives, criteria, outcomes, and scenarios will be permanently removed.</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteDialog(null)} className="btn-secondary">Cancel</button>
                    <button onClick={() => deleteMutation.mutate(deleteDialog!)} disabled={deleteMutation.isPending} className="btn-danger">
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