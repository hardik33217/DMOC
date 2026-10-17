import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  FolderIcon,
  ArrowLeftIcon,
  SparklesIcon,
  BoltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { clsx } from "clsx";

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState<"create" | "edit" | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<{ id: string; title: string; description?: string; status?: string } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: workflowsData } = useQuery({
    queryKey: ["workflows", searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await api.get(`/workflows?${params.toString()}`);
      return response.data.data;
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const response = await api.get("/workflows/templates");
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; templateId?: string }) => {
      const response = await api.post("/workflows", data);
      return response.data.data;
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
      setDialogOpen(null);
      navigate(`/workflows/${workflow.id}`);
    },
    onError: () => toast.error("Failed to create workflow"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description?: string; status?: string }) => {
      const response = await api.patch(`/workflows/${data.id}`, { title: data.title, description: data.description, status: data.status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated");
      setDialogOpen(null);
      setEditingWorkflow(null);
    },
    onError: () => toast.error("Failed to update workflow"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/workflows/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workflows"] }); toast.success("Workflow deleted"); },
    onError: () => toast.error("Failed to delete workflow"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => { const response = await api.post(`/workflows/${id}/duplicate`); return response.data.data; },
    onSuccess: (workflow) => { queryClient.invalidateQueries({ queryKey: ["workflows"] }); toast.success("Workflow duplicated"); navigate(`/workflows/${workflow.id}`); },
    onError: () => toast.error("Failed to duplicate"),
  });

  const workflows = workflowsData || [];
  const templates = templatesData || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="heading-2">Decision Workflows</h1>
            <p className="body text-sm mt-0.5">Visual node-based canvas for multi-criteria modeling and simulations</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingWorkflow(null);
            setSelectedTemplateId("");
            setDialogOpen("create");
          }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="h-5 w-5" />
          New Workflow
        </button>
      </div>

      {/* Featured Templates Section */}
      {templates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="heading-4">Pre-built Decision Templates</h2>
            </div>
            <span className="text-xs text-text-light-muted dark:text-text-dark-muted">
              Ready-to-run interactive decision pipelines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl: any, idx: number) => {
              const iconMap: Record<number, any> = {
                0: SparklesIcon,
                1: BoltIcon,
                2: ChartBarIcon,
              };
              const Icon = iconMap[idx % 3] || SparklesIcon;

              return (
                <div
                  key={tpl.id}
                  className="card p-5 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-light-hover dark:bg-surface-dark-hover text-text-light-muted dark:text-text-dark-muted border border-surface-light-border dark:border-surface-dark-border">
                        {tpl._count?.nodes || 6} nodes
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-text-light dark:text-text-dark text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-light-border dark:border-surface-dark-border mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-text-light-muted dark:text-text-dark-muted">
                      {tpl._count?.edges || 5} connections
                    </span>
                    <button
                      onClick={() => {
                        createMutation.mutate({
                          title: `${tpl.title}`,
                          description: tpl.description,
                          templateId: tpl.id,
                        });
                      }}
                      disabled={createMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Use Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* User Workflows List Card */}
      <div className="card">
        {/* Search & Filters */}
        <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search workflows by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border rounded-lg text-sm text-text-light dark:text-text-dark placeholder-text-light-muted dark:placeholder-text-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light-muted dark:text-text-dark-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-44 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Workflows Items */}
        {workflows.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="h-16 w-16 mx-auto text-text-light-muted dark:text-text-dark-muted mb-4" />
            <h3 className="heading-4 mb-2">No custom workflows yet</h3>
            <p className="body mb-6 text-sm">Pick a template above or create your first workflow canvas from scratch</p>
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setDialogOpen("create");
              }}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5" /> Create Blank Workflow
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-light-border dark:divide-surface-dark-border">
            {workflows.map((workflow: any, index: number) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              >
                <Link to={`/workflows/${workflow.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3.5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center">
                      <FolderIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-light dark:text-text-dark text-sm sm:text-base truncate hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                          {workflow.title}
                        </h3>
                        <span
                          className={clsx(
                            "px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider",
                            workflow.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          {workflow.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-light-muted dark:text-text-dark-muted mt-1">
                        <span>{workflow._count?.nodes || 0} nodes</span>
                        <span>•</span>
                        <span>{workflow._count?.edges || 0} connections</span>
                        <span>•</span>
                        <span>v{workflow.version || 1}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Open Canvas
                  </Link>

                  <button
                    onClick={() => duplicateMutation.mutate(workflow.id)}
                    className="btn-ghost btn-sm p-2"
                    title="Duplicate workflow"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingWorkflow({
                        id: workflow.id,
                        title: workflow.title,
                        description: workflow.description,
                        status: workflow.status,
                      });
                      setDialogOpen("edit");
                    }}
                    className="btn-ghost btn-sm p-2"
                    title="Edit details"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this workflow?")) {
                        deleteMutation.mutate(workflow.id);
                      }
                    }}
                    className="btn-ghost btn-sm p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400"
                    title="Delete workflow"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Workflow Dialog */}
      <Transition.Root show={dialogOpen !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDialogOpen(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-light border border-surface-light-border p-6 text-left align-middle shadow-xl dark:bg-surface-dark dark:border-surface-dark-border">
                  <Dialog.Title className="heading-4 mb-4">
                    {dialogOpen === "create" ? "Create Workflow" : "Edit Workflow Details"}
                  </Dialog.Title>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const title = fd.get("title") as string;
                      const description = fd.get("description") as string;
                      const templateId = (fd.get("templateId") as string) || undefined;

                      if (dialogOpen === "create") {
                        createMutation.mutate({ title, description, templateId });
                      } else if (editingWorkflow) {
                        const status = (fd.get("status") as string) || undefined;
                        updateMutation.mutate({ id: editingWorkflow.id, title, description, status });
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="title" className="label">Workflow Title</label>
                      <input
                        id="title"
                        name="title"
                        defaultValue={editingWorkflow?.title || ""}
                        placeholder="e.g. Q3 Vendor Selection Analysis"
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="label">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        defaultValue={editingWorkflow?.description || ""}
                        rows={3}
                        placeholder="Describe the decision problem and goals..."
                        className="input"
                      />
                    </div>

                    {dialogOpen === "create" && templates.length > 0 && (
                      <div>
                        <label htmlFor="templateId" className="label">Starting Canvas Template</label>
                        <select
                          id="templateId"
                          name="templateId"
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="input"
                        >
                          <option value="">Blank Canvas (Empty Workflow)</option>
                          {templates.map((tpl: any) => (
                            <option key={tpl.id} value={tpl.id}>
                              Template: {tpl.title} ({tpl._count?.nodes || 0} nodes)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {dialogOpen === "edit" && editingWorkflow && (
                      <div>
                        <label htmlFor="status" className="label">Status</label>
                        <select
                          id="status"
                          name="status"
                          defaultValue={editingWorkflow.status || "draft"}
                          className="input"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-light-border dark:border-surface-dark-border">
                      <button
                        type="button"
                        onClick={() => {
                          setDialogOpen(null);
                          setEditingWorkflow(null);
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="btn-primary"
                      >
                        {dialogOpen === "create" ? "Create Workflow" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}