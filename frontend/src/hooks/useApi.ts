import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import type {
  CreateDecisionInput,
  UpdateDecisionInput,
  CreateAlternativeInput,
  UpdateAlternativeInput,
  CreateCriterionInput,
  UpdateCriterionInput,
  CreateOutcomeInput,
  UpdateOutcomeInput,
  CreateScenarioInput,
  RunSimulationInput,
  ShareDecisionInput,
  UpdateUserSettingsInput,
  ChangePasswordInput,
} from "@decisionos/shared";

// ─── Dashboard ──────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get("/decisions/stats");
      return res.data.data;
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.get("/decisions/templates");
      return res.data.data;
    },
    staleTime: Infinity,
  });
}

// ─── Decisions ──────────────────────────────────────────────────────

export function useDecisions(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["decisions", params],
    queryFn: async () => {
      const res = await api.get("/decisions", { params });
      return res.data;
    },
  });
}

export function useDecision(id: string | undefined) {
  return useQuery({
    queryKey: ["decisions", id],
    queryFn: async () => {
      const res = await api.get(`/decisions/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDecisionInput) => {
      const res = await api.post("/decisions", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDecisionInput }) => {
      const res = await api.patch(`/decisions/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["decisions", vars.id] });
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/decisions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDuplicateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/decisions/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Alternatives ───────────────────────────────────────────────────

export function useAlternatives(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "alternatives"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/alternatives`);
      return res.data.data;
    },
    enabled: !!decisionId,
  });
}

export function useCreateAlternative(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAlternativeInput) => {
      const res = await api.post(`/decisions/${decisionId}/alternatives`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useUpdateAlternative(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAlternativeInput }) => {
      const res = await api.patch(`/decisions/${decisionId}/alternatives/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useDeleteAlternative(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/decisions/${decisionId}/alternatives/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

// ─── Criteria ───────────────────────────────────────────────────────

export function useCriteria(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "criteria"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/criteria`);
      return res.data.data;
    },
    enabled: !!decisionId,
  });
}

export function useCreateCriterion(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCriterionInput) => {
      const res = await api.post(`/decisions/${decisionId}/criteria`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useUpdateCriterion(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCriterionInput }) => {
      const res = await api.patch(`/decisions/${decisionId}/criteria/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useDeleteCriterion(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/decisions/${decisionId}/criteria/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

// ─── Outcomes ───────────────────────────────────────────────────────

export function useOutcomes(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "outcomes"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/outcomes`);
      return res.data.data;
    },
    enabled: !!decisionId,
  });
}

export function useCreateOutcome(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOutcomeInput & { alternativeId: string }) => {
      const res = await api.post(`/decisions/${decisionId}/outcomes`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useUpdateOutcome(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOutcomeInput }) => {
      const res = await api.patch(`/decisions/${decisionId}/outcomes/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useDeleteOutcome(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/decisions/${decisionId}/outcomes/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

// ─── Scenarios ──────────────────────────────────────────────────────

export function useScenarios(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "scenarios"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/scenarios`);
      return res.data.data;
    },
    enabled: !!decisionId,
  });
}

export function useScenario(decisionId: string, scenarioId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "scenarios", scenarioId],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/scenarios/${scenarioId}`);
      return res.data.data;
    },
    enabled: !!decisionId && !!scenarioId,
  });
}

export function useCreateScenario(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateScenarioInput) => {
      const res = await api.post(`/decisions/${decisionId}/scenarios`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "scenarios"] });
    },
  });
}

export function useDuplicateScenario(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await api.post(`/decisions/${decisionId}/scenarios/${scenarioId}/duplicate`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "scenarios"] });
    },
  });
}

export function useDeleteScenario(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await api.delete(`/decisions/${decisionId}/scenarios/${scenarioId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "scenarios"] });
    },
  });
}

export function useUpdateScenarioInput(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, data }: { scenarioId: string; data: { entityType: string; entityId: string; field: string; value: string | number | boolean } }) => {
      const res = await api.post(`/decisions/${decisionId}/scenarios/${scenarioId}/inputs`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "scenarios"] });
    },
  });
}

export function useResetScenario(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await api.post(`/decisions/${decisionId}/scenarios/${scenarioId}/reset`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "scenarios"] });
    },
  });
}

// ─── Simulations ────────────────────────────────────────────────────

export function useRunSimulation(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RunSimulationInput) => {
      const res = await api.post(`/decisions/${decisionId}/simulations/run`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId] });
    },
  });
}

export function useSimulationRuns(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "simulations"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/simulations/runs`);
      return res.data;
    },
    enabled: !!decisionId,
  });
}

export function useSimulationComparison(decisionId: string) {
  return useMutation({
    mutationFn: async (data: { baselineScenarioId: string; scenarioIds: string[] }) => {
      const res = await api.post(`/decisions/${decisionId}/simulations/compare`, data);
      return res.data.data;
    },
  });
}

export function useSensitivityAnalysis(decisionId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/decisions/${decisionId}/simulations/sensitivity`);
      return res.data.data;
    },
  });
}

// ─── Shares ─────────────────────────────────────────────────────────

export function useShares(decisionId: string | undefined) {
  return useQuery({
    queryKey: ["decisions", decisionId, "shares"],
    queryFn: async () => {
      const res = await api.get(`/decisions/${decisionId}/shares`);
      return res.data.data;
    },
    enabled: !!decisionId,
  });
}

export function useCreateShare(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShareDecisionInput) => {
      const res = await api.post(`/decisions/${decisionId}/shares`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "shares"] });
    },
  });
}

export function useDeleteShare(decisionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shareId: string) => {
      const res = await api.delete(`/decisions/${decisionId}/shares/${shareId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions", decisionId, "shares"] });
    },
  });
}

export function useSharedDecision(token: string | undefined) {
  return useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const res = await api.get(`/decisions/shared/public/${token}`);
      return res.data.data;
    },
    enabled: !!token,
    retry: false,
  });
}

// ─── Users ──────────────────────────────────────────────────────────

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserSettingsInput) => {
      const res = await api.patch("/users/settings", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const res = await api.post("/users/change-password", data);
      return res.data;
    },
  });
}

export function useAuditLog(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: async () => {
      const res = await api.get("/users/audit", { params });
      return res.data;
    },
  });
}

// ─── Import/Export ──────────────────────────────────────────────────

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get("/import-export/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dmoc-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useExportDecision() {
  return useMutation({
    mutationFn: async (decisionId: string) => {
      const res = await api.get(`/import-export/export/${decisionId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `decision-${decisionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/import-export/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
  });
}

export function useImportConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, createNew, title }: { file: File; createNew: boolean; title?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("createNew", String(createNew));
      if (title) formData.append("title", title);
      const res = await api.post("/import-export/import/confirm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
