import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Node, Edge } from "@xyflow/react";
import { WorkflowNodeData, WorkflowEdgeData } from "../workflow/nodes/nodeTypes";
import api from "../utils/api";

interface Workflow {
  id: string;
  title: string;
  description?: string;
  businessId?: string | null;
  status: string;
  version: number;
  isTemplate: boolean;
  nodes: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    positionX: number;
    positionY: number;
    width?: number;
    height?: number;
    config: string;
    schemaVersion: number;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
  }>;
}

interface WorkflowState {
  workflow: Workflow | null;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  selectedNode: Node<WorkflowNodeData> | null;
  executionState: {
    status: "idle" | "running" | "completed" | "failed";
    nodeStatuses: Record<string, "idle" | "running" | "success" | "error" | "skipped">;
    nodeOutputs: Record<string, unknown>;
    runId?: string;
  };
  isDirty: boolean;
  history: { nodes: Node<WorkflowNodeData>[]; edges: Edge<WorkflowEdgeData>[] }[];
  historyIndex: number;

  setWorkflow: (workflow: Workflow | null) => void;
  setNodes: (nodes: Node<WorkflowNodeData>[] | ((prev: Node<WorkflowNodeData>[]) => Node<WorkflowNodeData>[])) => void;
  setEdges: (edges: Edge<WorkflowEdgeData>[] | ((prev: Edge<WorkflowEdgeData>[]) => Edge<WorkflowEdgeData>[])) => void;
  setSelectedNode: (node: Node<WorkflowNodeData> | null) => void;
  setExecutionState: (state: any) => void;
  setIsDirty: (dirty: boolean) => void;

  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  loadWorkflow: (workflowId: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  createWorkflow: (data: { title: string; description?: string }) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflow: null,
      nodes: [],
      edges: [],
      selectedNode: null,
      executionState: {
        status: "idle",
        nodeStatuses: {},
        nodeOutputs: {},
      },
      isDirty: false,
      history: [],
      historyIndex: -1,

      setWorkflow: (workflow) => {
        if (workflow) {
          const nodes: Node<WorkflowNodeData>[] = workflow.nodes.map(n => {
            let parsedConfig: Record<string, unknown> = {};
            if (typeof n.config === "string") {
              try {
                parsedConfig = JSON.parse(n.config);
              } catch (e) {
                console.warn(`Failed to parse config for node ${n.id}:`, e);
                parsedConfig = {};
              }
            } else if (n.config && typeof n.config === "object") {
              parsedConfig = n.config as Record<string, unknown>;
            }

            return {
              id: n.id,
              type: "workflow",
              position: { x: n.positionX, y: n.positionY },
              data: {
                id: n.id,
                type: n.type,
                label: n.title,
                description: n.description ?? undefined,
                config: parsedConfig,
                status: "idle",
              },
              width: n.width || 220,
            };
          });

          const edges: Edge<WorkflowEdgeData>[] = workflow.edges.map(e => ({
            id: e.id,
            source: e.sourceNodeId,
            target: e.targetNodeId,
            sourceHandle: e.sourceHandle === "out" ? "output" : (e.sourceHandle || "output"),
            targetHandle: e.targetHandle === "in" ? "input" : (e.targetHandle || "input"),
            label: e.label,
            type: "default",
            markerEnd: { type: "arrowclosed" as const, width: 20, height: 20 },
            data: { id: e.id, source: e.sourceNodeId, target: e.targetNodeId },
          }));

          set({
            workflow,
            nodes,
            edges,
            history: [{ nodes, edges }],
            historyIndex: 0,
            isDirty: false,
          });
        } else {
          set({
            workflow: null,
            nodes: [],
            edges: [],
            selectedNode: null,
            executionState: { status: "idle", nodeStatuses: {}, nodeOutputs: {} },
            isDirty: false,
            history: [],
            historyIndex: -1,
          });
        }
      },

      setNodes: (nodes) => {
        const newNodes = typeof nodes === "function" ? nodes(get().nodes) : nodes;
        set({ nodes: newNodes });
        if (get().historyIndex >= 0) {
          get().addToHistory();
        }
      },

      setEdges: (edges) => {
        const newEdges = typeof edges === "function" ? edges(get().edges) : edges;
        set({ edges: newEdges });
        if (get().historyIndex >= 0) {
          get().addToHistory();
        }
      },

      setSelectedNode: (node) => set({ selectedNode: node }),

      setExecutionState: (state) => set({ executionState: state }),

      setIsDirty: (dirty) => set({ isDirty: dirty }),

      addToHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: [...nodes], edges: [...edges] });
        if (newHistory.length > 50) newHistory.shift();
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          set({ nodes: prev.nodes, edges: prev.edges, historyIndex: historyIndex - 1, isDirty: true });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          set({ nodes: next.nodes, edges: next.edges, historyIndex: historyIndex + 1, isDirty: true });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      loadWorkflow: async (workflowId: string) => {
        try {
          const response = await api.get(`/workflows/${workflowId}`);
          if (response.data.success) {
            get().setWorkflow(response.data.data);
          } else {
            throw new Error(response.data.error?.message || "Failed to load workflow");
          }
        } catch (error) {
          console.error("Failed to load workflow:", error);
          throw error;
        }
      },

      saveWorkflow: async () => {
        const { workflow, nodes, edges } = get();
        if (!workflow) throw new Error("No workflow to save");

        const nodeData = nodes.map(n => ({
          id: n.id,
          type: n.data.type,
          title: n.data.label,
          description: n.data.description,
          positionX: n.position.x,
          positionY: n.position.y,
          width: n.width,
          height: n.height,
          config: JSON.stringify(n.data.config),
          schemaVersion: 1,
        }));

        const edgeData = edges.map(e => ({
          id: e.id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
        }));

        try {
          const response = await api.put(`/workflows/${workflow.id}/graph`, {
            nodes: nodeData,
            edges: edgeData,
          });
          if (response.data?.success && response.data?.data) {
            set((state) => ({
              isDirty: false,
              workflow: state.workflow ? { ...state.workflow, version: response.data.data.version } : null,
            }));
          } else {
            set({ isDirty: false });
          }
        } catch (error) {
          console.error("Failed to save workflow:", error);
          throw error;
        }
      },

      createWorkflow: async (data: { title: string; description?: string }) => {
        try {
          const response = await api.post("/workflows", data);
          if (response.data.success) {
            await get().loadWorkflow(response.data.data.id);
          }
        } catch (error) {
          console.error("Failed to create workflow:", error);
          throw error;
        }
      },
    }),
    {
      name: "workflow-editor-storage",
      partialize: (state) => ({
        history: state.history,
        historyIndex: state.historyIndex,
      }),
    }
  )
);