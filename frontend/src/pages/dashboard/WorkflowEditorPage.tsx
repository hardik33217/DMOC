import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  ConnectionMode,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  PlayIcon,
  StopIcon,
  Squares2X2Icon,
  XMarkIcon,
  CheckIcon,
  Bars3Icon,
  PencilSquareIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { toast } from "react-hot-toast";
import { NodePalette } from "../../workflow/nodes/NodePalette";
import { PropertiesPanel } from "../../workflow/nodes/PropertiesPanel";
import { WorkflowNode, CustomWorkflowNode } from "../../workflow/nodes/CustomNodes";
import { CustomEdge } from "../../workflow/edges/CustomEdge";
import { WorkflowExecutionConsole } from "../../workflow/WorkflowExecutionConsole";
import { useWorkflowStore } from "../../hooks/useWorkflowStore";
import api from "../../utils/api";
import { NODE_TYPE_CONFIGS, WorkflowNodeData, WorkflowEdgeData } from "../../workflow/nodes/nodeTypes";

const nodeTypes: NodeTypes = {
  workflow: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
};

function WorkflowEditorInner() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const {
    workflow,
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNode,
    setSelectedNode,
    executionState,
    setExecutionState,
    isDirty,
    setIsDirty,
    saveWorkflow,
    loadWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useWorkflowStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const [showPalette, setShowPalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // Store workspace profile for business context
  const [activeStore, setActiveStore] = useState<{ id: string; name: string; category: string; currency: string } | null>(null);

  // AI Copilot state
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{
    id: string;
    sender: "ai" | "user";
    text: string;
    action?: { label: string; onClick: () => void };
  }>>([]);

  // Detect dark mode from document class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkTheme(isDark);

    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Fetch store workspace profile
  useEffect(() => {
    let active = true;
    const fetchBiz = async () => {
      try {
        const res = await api.get("/inventory-decisions/businesses");
        const list = res.data?.data || [];
        if (list.length > 0 && active) {
          const matched = list.find((b: any) => b.id === workflow?.businessId) || list[0];
          setActiveStore(matched);
        }
      } catch (err) {
        console.warn("Could not fetch store profile:", err);
      }
    };
    fetchBiz();
    return () => { active = false; };
  }, [workflow?.businessId]);

  // Sync title draft
  useEffect(() => {
    if (workflow?.title) {
      setTitleDraft(workflow.title);
    }
  }, [workflow?.title]);

  const handleSaveTitle = async () => {
    if (!titleDraft.trim() || !workflowId) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await api.patch(`/workflows/${workflowId}`, { title: titleDraft.trim() });
      if (workflow) {
        useWorkflowStore.setState({ workflow: { ...workflow, title: titleDraft.trim() } });
      }
      setIsEditingTitle(false);
      toast.success("Workflow title updated");
    } catch (err) {
      console.error("Failed to update title:", err);
      toast.error("Failed to rename workflow");
    }
  };

  // Load workflow on mount / id change
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId).catch((err) => {
        toast.error("Failed to load workflow");
        console.error(err);
      });
    }
  }, [workflowId, loadWorkflow]);

  // Warn on beforeunload if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Node changes
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<WorkflowNodeData>>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      setIsDirty(true);
    },
    [setNodes, setIsDirty]
  );

  // Edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<WorkflowEdgeData>>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds as Edge<WorkflowEdgeData>[]) as Edge<WorkflowEdgeData>[]);
      setIsDirty(true);
    },
    [setEdges, setIsDirty]
  );

  // Connect edges seamlessly with node role validation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Prevent self connection
      if (connection.source === connection.target) {
        toast.error("Cannot connect a node to itself");
        return;
      }

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // End node cannot be a source
      if (sourceNode.data.type === "end") {
        toast.error("End node cannot have output connections");
        return;
      }

      // Trigger nodes cannot receive input
      const triggerTypes = ["start_decision", "manual_trigger", "import_spreadsheet", "existing_decision"];
      if (triggerTypes.includes(targetNode.data.type)) {
        toast.error("Trigger nodes cannot receive input connections");
        return;
      }

      // Prevent duplicate edges
      const edgeExists = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          (e.sourceHandle || null) === (connection.sourceHandle || null) &&
          (e.targetHandle || null) === (connection.targetHandle || null)
      );
      if (edgeExists) {
        toast.error("Connection already exists");
        return;
      }

      // Determine clean edge label (e.g. True / False branches from if_else)
      const edgeLabel =
        connection.sourceHandle === "true"
          ? "True"
          : connection.sourceHandle === "false"
          ? "False"
          : undefined;

      const newEdge: Edge<WorkflowEdgeData> = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || "output",
        targetHandle: connection.targetHandle || "input",
        type: "default",
        animated: false,
        label: edgeLabel,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: {
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          label: edgeLabel,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setIsDirty(true);
    },
    [nodes, edges, setEdges, setIsDirty]
  );

  // Select node on click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as CustomWorkflowNode);
      setShowProperties(true);
    },
    [setSelectedNode, setShowProperties]
  );

  // Deselect on canvas click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Drag over canvas handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // Drop onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData("application/json");
      if (!dataStr) return;

      try {
        const payload = JSON.parse(dataStr);
        const { nodeType, label, defaultConfig } = payload;
        if (!nodeType || !reactFlowInstance) return;

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNodeId = crypto.randomUUID();
        const configType = NODE_TYPE_CONFIGS[nodeType];

        const newNode: CustomWorkflowNode = {
          id: newNodeId,
          type: "workflow",
          position,
          data: {
            id: newNodeId,
            type: nodeType,
            label: label || configType?.label || nodeType,
            description: configType?.description || "",
            config: defaultConfig ? { ...defaultConfig } : configType?.defaultConfig ? { ...configType.defaultConfig } : {},
            status: "idle",
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setSelectedNode(newNode);
        setIsDirty(true);
        toast.success(`Added ${newNode.data.label}`);
      } catch (err) {
        console.error("Drop node error:", err);
      }
    },
    [reactFlowInstance, setNodes, setSelectedNode, setIsDirty]
  );

  // Update node config from properties panel
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const updated = {
              ...n,
              data: {
                ...n.data,
                ...updates,
              },
            };
            if (selectedNode?.id === nodeId) {
              setSelectedNode(updated);
            }
            return updated;
          }
          return n;
        })
      );
      setIsDirty(true);
    },
    [setNodes, selectedNode, setSelectedNode, setIsDirty]
  );

  // Reset node config to defaults
  const handleNodeReset = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const nodeTypeConfig = NODE_TYPE_CONFIGS[node.data.type];
        if (nodeTypeConfig) {
          handleNodeUpdate(nodeId, { config: { ...nodeTypeConfig.defaultConfig } });
          toast.success("Reset node configuration to defaults");
        }
      }
    },
    [nodes, handleNodeUpdate]
  );

  // Save node explicitly
  const handleNodeSave = useCallback(
    async (_nodeId: string) => {
      try {
        await saveWorkflow();
        toast.success("Node and workflow saved");
      } catch {
        toast.error("Failed to save");
      }
    },
    [saveWorkflow]
  );

  // Save whole workflow
  const handleSave = useCallback(async () => {
    try {
      await saveWorkflow();
      toast.success("Workflow saved successfully");
    } catch {
      toast.error("Failed to save workflow");
    }
  }, [saveWorkflow]);

  // Validate workflow
  const handleValidate = useCallback(async () => {
    if (!workflowId) return false;
    try {
      const response = await api.post(`/workflows/${workflowId}/validate`);
      const { valid, errors } = response.data.data;
      if (!valid && errors && errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Validation found ${errors.length} issue(s)`);
        return false;
      }
      setValidationErrors([]);
      toast.success("Workflow validation passed!");
      return true;
    } catch {
      toast.error("Validation request failed");
      return false;
    }
  }, [workflowId]);

  // Run workflow with visual simulation & execution
  const handleRun = useCallback(async () => {
    if (!workflow) return;

    // Save if dirty before executing
    if (isDirty) {
      try {
        await saveWorkflow();
      } catch {
        toast.error("Failed to save workflow before running");
        return;
      }
    }

    // Validate
    const isValid = await handleValidate();
    if (!isValid) return;

    setIsRunning(true);
    setShowLogDrawer(true);
    setExecutionState({
      status: "running",
      nodeStatuses: nodes.reduce((acc, n) => ({ ...acc, [n.id]: "running" as const }), {}),
      nodeOutputs: {},
    });

    // Animate edges while running
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: true,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          ...e.data,
          animated: true,
        },
      }))
    );

    try {
      const response = await api.post(`/workflows/${workflowId}/runs/run`, { inputData: {} });
      const run = response.data.data;

      // Animate execution sequentially for visual feedback
      const nodeResults: any[] = run.nodeResults || [];

      for (let i = 0; i < nodeResults.length; i++) {
        const nr = nodeResults[i];
        const parsedOutput = nr.outputData ? JSON.parse(nr.outputData) : undefined;
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nr.nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: nr.status === "success" ? "success" : nr.status === "skipped" ? "skipped" : "error",
                    error: nr.error || undefined,
                    result: parsedOutput,
                  },
                }
              : n
          )
        );
        // Small delay for rich visual stepping
        await new Promise((r) => setTimeout(r, 120));
      }

      setExecutionState({
        status: run.status,
        nodeStatuses: nodeResults.reduce((acc: Record<string, string>, nr: any) => {
          acc[nr.nodeId] = nr.status;
          return acc;
        }, {}),
        nodeOutputs: nodeResults.reduce((acc: Record<string, unknown>, nr: any) => {
          acc[nr.nodeId] = nr.outputData ? JSON.parse(nr.outputData) : {};
          return acc;
        }, {}),
        runId: run.id,
      });

      if (run.status === "completed") {
        toast.success("Workflow executed successfully!");
      } else {
        toast.error(`Workflow execution finished with status: ${run.status}`);
      }
    } catch (error: any) {
      console.error("Execution error:", error);
      toast.error(error.response?.data?.error?.message || "Workflow execution failed");
      setExecutionState({ status: "failed", nodeStatuses: {}, nodeOutputs: {} });
    } finally {
      setIsRunning(false);
      // Turn off edge animation
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: false,
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            ...e.data,
            animated: false,
          },
        }))
      );
    }
  }, [
    workflow,
    workflowId,
    isDirty,
    saveWorkflow,
    handleValidate,
    nodes,
    setExecutionState,
    setEdges,
    setNodes,
  ]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setExecutionState({ status: "idle", nodeStatuses: {}, nodeOutputs: {} });
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          ...e.data,
          animated: false,
        },
      }))
    );
    toast("Execution stopped", { icon: "⏹️" });
  }, [setExecutionState, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        if (canUndo()) undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Delete or Backspace when node selected and not in input
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedNode) {
        e.preventDefault();
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
        );
        setSelectedNode(null);
        setIsDirty(true);
        toast.success("Node deleted");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, canUndo, undo, canRedo, redo, selectedNode, setNodes, setEdges, setSelectedNode, setIsDirty]);

  // Layout and view helpers
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 300 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 300 });
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.15, duration: 400 });
  }, [reactFlowInstance]);

  // Extract real store decision parameters from nodes for AI Agent
  const productNode = nodes.find((n) => n.data.type === "product_lookup");
  const purchaseNode = nodes.find((n) => n.data.type === "proposed_purchase");
  const stockNode = nodes.find((n) => n.data.type === "inventory_snapshot");
  const demandNode = nodes.find((n) => n.data.type === "demand_forecast");
  const marginNode = nodes.find((n) => n.data.type === "cost_margin");

  const pName = (productNode?.data?.config?.productName as string) || "Current Product";
  const currentStock = Number(stockNode?.data?.config?.currentStock ?? 10);
  const orderQty = Number(purchaseNode?.data?.config?.orderQuantity ?? 20);
  const unitCost = Number(purchaseNode?.data?.config?.unitCost ?? marginNode?.data?.config?.unitCost ?? 20.5);
  const sellingPrice = Number(marginNode?.data?.config?.sellingPrice ?? 28);
  const capitalOutlay = Number(purchaseNode?.data?.config?.capitalRequired ?? Math.round(orderQty * unitCost));
  const velocity = Number(demandNode?.data?.config?.dailySalesVelocity ?? 4.0);
  const horizonDays = Number(demandNode?.data?.config?.horizonDays ?? 30);
  const expectedDemand = Number(demandNode?.data?.config?.expectedDemand ?? Math.round(velocity * horizonDays));
  const runwayDays = velocity > 0 ? +(currentStock / velocity).toFixed(1) : 0;
  const breakEvenUnits = sellingPrice > unitCost ? Math.ceil(capitalOutlay / (sellingPrice - unitCost)) : 15;

  const handleAutoTuneOrder = (newQty: number, reason: string) => {
    if (!purchaseNode) {
      toast.error("No Proposed Purchase node found on canvas");
      return;
    }
    const cap = Math.round(newQty * unitCost);
    handleNodeUpdate(purchaseNode.id, {
      label: `4. Proposed Order (${newQty} units)`,
      config: {
        ...purchaseNode.data.config,
        orderQuantity: newQty,
        capitalRequired: cap,
      },
    });
    setAiMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "ai",
        text: `✓ Auto-tuned order quantity to ${newQty} units (Total Capital: ₹${cap.toLocaleString()}). ${reason}`,
      },
    ]);
    toast.success(`Updated order to ${newQty} units`);
  };

  const handleAskAi = (question: string) => {
    if (!question.trim()) return;
    const userMsg = { id: crypto.randomUUID(), sender: "user" as const, text: question.trim() };
    const qLower = question.toLowerCase();

    let aiText = "";
    let action: { label: string; onClick: () => void } | undefined;

    if (qLower.includes("safe") || qLower.includes("weekend") || qLower.includes("stockout")) {
      const weekendDemand = Math.round(velocity * 3);
      if (currentStock >= weekendDemand) {
        aiText = `Your current stock of ${currentStock} units is sufficient for a 3-day weekend (${weekendDemand} units needed at ${velocity} units/day). However, stock will drop to ${currentStock - weekendDemand} units by Monday. Placing the proposed order of ${orderQty} units ensures complete replenishment without stockouts.`;
      } else {
        aiText = `⚠️ High stockout risk! A 3-day weekend requires ~${weekendDemand} units, but you only have ${currentStock} units on hand. You risk running out during peak hours. Proceed with at least ${orderQty} units immediately.`;
      }
    } else if (qLower.includes("break-even") || qLower.includes("breakeven") || qLower.includes("recover")) {
      aiText = `At a selling price of ₹${sellingPrice} and wholesale cost of ₹${unitCost} (margin ₹${(sellingPrice - unitCost).toFixed(2)}/unit), you must sell ${breakEvenUnits} units to fully recover your ₹${capitalOutlay.toLocaleString()} investment. At your current velocity of ${velocity} units/day, break-even occurs in ~${Math.ceil(breakEvenUnits / (velocity || 1))} days.`;
    } else if (qLower.includes("optimize") || qLower.includes("month") || qLower.includes("how much") || qLower.includes("quantity")) {
      const optimal30d = Math.max(10, Math.round(velocity * 30));
      aiText = `Based on your average sales velocity of ${velocity} units/day, your 30-day customer demand is ${optimal30d} units. Your current proposed order is ${orderQty} units. Ordering ${optimal30d} units avoids supplier reorder fees and maximizes gross margin return by +₹${Math.round(optimal30d * (sellingPrice - unitCost)).toLocaleString()}.`;
      action = {
        label: `Apply ${optimal30d} Units Order`,
        onClick: () => handleAutoTuneOrder(optimal30d, "Matches exact 30-day forecasted demand."),
      };
    } else if (qLower.includes("capital") || qLower.includes("cash") || qLower.includes("money") || qLower.includes("cost")) {
      aiText = `This proposed purchase requires ₹${capitalOutlay.toLocaleString()} of working capital (${orderQty} units × ₹${unitCost}). Holding costs are estimated at ~2% per month (₹${Math.round(capitalOutlay * 0.02)}). Expected gross margin is ${(((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(1)}%.`;
    } else {
      aiText = `Analyzing decision for ${pName}: Current stock is ${currentStock} units (${runwayDays} days of coverage). Proposed purchase of ${orderQty} units requires ₹${capitalOutlay.toLocaleString()}. Expected horizon demand is ${expectedDemand} units. To cover full 30-day demand without stockouts, consider ordering ${Math.round(velocity * 30)} units.`;
      action = {
        label: `Set to Monthly Demand (${Math.round(velocity * 30)} units)`,
        onClick: () => handleAutoTuneOrder(Math.round(velocity * 30), "Optimized for 30-day horizon."),
      };
    }

    setAiMessages((prev) => [...prev, userMsg, { id: crypto.randomUUID(), sender: "ai", text: aiText, action }]);
    setAiQuery("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-surface-light dark:bg-surface-dark overflow-hidden font-sans text-text-light dark:text-text-dark">
      {/* LEFT: Node Palette Sidebar */}
      <aside
        className={clsx(
          "transition-all duration-300 z-20 flex-shrink-0 flex flex-col border-r border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark",
          showPalette ? "w-72" : "w-12"
        )}
      >
        {showPalette ? (
          <div className="flex-1 flex flex-col h-full relative">
            <button
              onClick={() => setShowPalette(false)}
              className="absolute right-2 top-3 p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover z-10"
              title="Collapse palette"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <NodePalette
              onDragStart={(event, nodeType) => {
                event.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({
                    type: "workflow-node",
                    nodeType,
                    label: NODE_TYPE_CONFIGS[nodeType]?.label || nodeType,
                    defaultConfig: NODE_TYPE_CONFIGS[nodeType]?.defaultConfig || {},
                  })
                );
              }}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center py-4 gap-4">
            <button
              onClick={() => setShowPalette(true)}
              className="p-2 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover"
              title="Expand node palette"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* CENTER: Main Canvas Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur border-b border-surface-light-border dark:border-surface-dark-border flex items-center justify-between px-4 gap-3 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/workflows"
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              title="Back to Workflows"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>

            {/* Store Workspace Badge */}
            {activeStore && (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex-shrink-0">
                <BuildingStorefrontIcon className="h-3.5 w-3.5 text-brand-500" />
                <span className="truncate max-w-[130px]">{activeStore.name}</span>
                <span className="text-[10px] text-brand-500 font-normal capitalize">({activeStore.category})</span>
              </span>
            )}

            {/* Editable Title */}
            <div className="flex items-center gap-2 truncate">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="px-2 py-0.5 text-xs sm:text-sm font-semibold rounded border border-brand-500 bg-white dark:bg-surface-dark text-text-light dark:text-text-dark focus:outline-none max-w-[220px] sm:max-w-xs"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    title="Confirm rename"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTitleDraft(workflow?.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="group flex items-center gap-1.5 hover:text-brand-600 transition-colors text-left truncate"
                  title="Click to rename workflow"
                >
                  <h1 className="font-semibold text-xs sm:text-sm md:text-base text-text-light dark:text-text-dark group-hover:text-brand-600 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                    {workflow?.title || "Decision Workflow"}
                  </h1>
                  <PencilSquareIcon className="h-3.5 w-3.5 text-text-light-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              )}

              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-light-hover dark:bg-surface-dark-hover text-text-light-muted dark:text-text-dark-muted border border-surface-light-border dark:border-surface-dark-border">
                v{workflow?.version || 1}
              </span>
              <span
                className={clsx(
                  "px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider",
                  workflow?.status === "active"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {workflow?.status || "draft"}
              </span>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                  Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover disabled:opacity-40 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover disabled:opacity-40 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <ArrowUturnRightIcon className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-surface-light-border dark:bg-surface-dark-border mx-1" />

            <button
              onClick={handleFitView}
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              title="Fit View"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              title="Zoom In"
            >
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-text-light-muted hover:text-text-light dark:hover:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              title="Zoom Out"
            >
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-surface-light-border dark:bg-surface-dark-border mx-1" />

            <button
              onClick={handleValidate}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-text-light dark:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border transition-colors"
              title="Check workflow connectivity and errors"
            >
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              Validate
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover text-text-light dark:text-text-dark hover:bg-surface-light-border dark:hover:bg-surface-dark-border border border-surface-light-border dark:border-surface-dark-border disabled:opacity-50 transition-all"
              title="Save Workflow (Ctrl+S)"
            >
              <CheckIcon className="h-4 w-4 text-brand-500" />
              Save
            </button>

            <button
              onClick={isRunning ? handleStop : handleRun}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition-all",
                isRunning
                  ? "bg-rose-600 hover:bg-rose-700 animate-pulse"
                  : "bg-brand-600 hover:bg-brand-700 active:scale-95"
              )}
            >
              {isRunning ? (
                <>
                  <StopIcon className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 fill-current" />
                  Run
                </>
              )}
            </button>

            {/* AI Copilot Toggle */}
            <button
              onClick={() => {
                setShowAiCopilot(!showAiCopilot);
                if (!showAiCopilot && showProperties) {
                  setShowProperties(false);
                }
              }}
              className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm",
                showAiCopilot
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-transparent ring-2 ring-brand-500/30"
                  : "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-100"
              )}
              title="Toggle AI Decision Agent Copilot"
            >
              <SparklesIcon className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">AI Agent</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-black tracking-wider uppercase bg-white/20">
                Copilot
              </span>
            </button>

            {/* Reports Link */}
            <Link
              to="/reports"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-text-light dark:text-text-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border transition-colors"
              title="View Decision Reports"
            >
              <DocumentChartBarIcon className="h-4 w-4 text-brand-500" />
              <span>Reports</span>
            </Link>

            <button
              onClick={() => {
                setShowProperties(!showProperties);
                if (!showProperties && showAiCopilot) {
                  setShowAiCopilot(false);
                }
              }}
              className={clsx(
                "p-1.5 rounded-lg border transition-colors",
                showProperties
                  ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 border-brand-200 dark:border-brand-800"
                  : "text-text-light-muted hover:text-text-light border-transparent"
              )}
              title="Toggle Properties Panel"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Canvas Body */}
        <div ref={reactFlowWrapper} className="flex-1 relative w-full h-full overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: "default",
              animated: false,
              markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            }}
          >
            <Background
              color={isDarkTheme ? "#334155" : "#cbd5e1"}
              gap={24}
              size={1.5}
            />
            <Controls
              showZoom={true}
              showFitView={true}
              showInteractive={true}
              className="!bg-surface-light dark:!bg-surface-dark !border !border-surface-light-border dark:!border-surface-dark-border !shadow-md !rounded-xl overflow-hidden"
            />
            <MiniMap
              nodeColor={(node: Node) => {
                const n = node as CustomWorkflowNode;
                const status = n.data?.status || "idle";
                if (status === "running") return "#6366f1";
                if (status === "success") return "#10b981";
                if (status === "error") return "#ef4444";
                if (status === "skipped") return "#94a3b8";
                return isDarkTheme ? "#475569" : "#cbd5e1";
              }}
              maskColor={isDarkTheme ? "rgba(15, 23, 42, 0.7)" : "rgba(241, 245, 249, 0.7)"}
              className="!bg-surface-light dark:!bg-surface-dark !border !border-surface-light-border dark:!border-surface-dark-border !rounded-xl !shadow-lg"
            />
          </ReactFlow>

          {/* Validation Errors Overlay */}
          {validationErrors.length > 0 && (
            <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 animate-in fade-in slide-in-from-top-2">
              <div className="bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl p-3.5 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-semibold text-xs sm:text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                    Validation Issues ({validationErrors.length})
                  </div>
                  <button
                    onClick={() => setValidationErrors([])}
                    className="p-1 rounded text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300 max-h-36 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Bottom Point-Wise Execution Console */}
          {showLogDrawer && (
            <WorkflowExecutionConsole
              status={executionState.status}
              runId={executionState.runId}
              nodeStatuses={executionState.nodeStatuses}
              nodeOutputs={executionState.nodeOutputs}
              nodes={nodes}
              onClose={() => setShowLogDrawer(false)}
              onSelectNode={(nodeId) => {
                const targetNode = nodes.find((n) => n.id === nodeId);
                if (targetNode) {
                  setSelectedNode(targetNode);
                  setShowProperties(true);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* RIGHT: Properties Panel Sidebar */}
      {showProperties && (
        <aside className="w-80 flex-shrink-0 border-l border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark h-full z-20 flex flex-col">
          <PropertiesPanel
            node={selectedNode ? selectedNode.data : null}
            onUpdate={handleNodeUpdate}
            onClose={() => setShowProperties(false)}
            onSave={handleNodeSave}
            onReset={handleNodeReset}
            isDirty={isDirty}
          />
        </aside>
      )}

      {/* RIGHT: AI Decision Copilot Sidebar */}
      {showAiCopilot && (
        <aside className="w-96 flex-shrink-0 border-l border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark h-full z-20 flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border flex items-center justify-between bg-gradient-to-r from-brand-500/10 to-indigo-500/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-500 text-white">
                <SparklesIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-light dark:text-text-dark">DMOC AI Agent</h3>
                <p className="text-[10px] text-text-light-muted dark:text-text-dark-muted">Store Decision Copilot & Risk Analyzer</p>
              </div>
            </div>
            <button
              onClick={() => setShowAiCopilot(false)}
              className="p-1 text-text-light-muted hover:text-text-light rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Live Store Decision Summary Card */}
            <div className="p-3.5 rounded-xl bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                <div className="flex items-center gap-1.5 truncate">
                  <BuildingStorefrontIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{pName}</span>
                </div>
                <span className="font-mono text-[10px] bg-brand-100 dark:bg-brand-900/60 px-1.5 py-0.5 rounded flex-shrink-0">
                  {activeStore?.category || "Retail Store"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white dark:bg-surface-dark p-2 rounded-lg border border-surface-light-border/60 dark:border-surface-dark-border/60">
                  <span className="text-[10px] text-text-light-muted block">Current Stock</span>
                  <span className="font-bold">{currentStock} units</span>
                  <span className="text-[10px] text-text-light-muted block">({runwayDays}d runway)</span>
                </div>
                <div className="bg-white dark:bg-surface-dark p-2 rounded-lg border border-surface-light-border/60 dark:border-surface-dark-border/60">
                  <span className="text-[10px] text-text-light-muted block">Proposed Order</span>
                  <span className="font-bold">{orderQty} units</span>
                  <span className="text-[10px] text-emerald-600 font-mono block">₹{capitalOutlay.toLocaleString()}</span>
                </div>
                <div className="bg-white dark:bg-surface-dark p-2 rounded-lg border border-surface-light-border/60 dark:border-surface-dark-border/60">
                  <span className="text-[10px] text-text-light-muted block">Sales Velocity</span>
                  <span className="font-bold">{velocity} units/day</span>
                  <span className="text-[10px] text-text-light-muted block">Demand: {expectedDemand}u/{horizonDays}d</span>
                </div>
                <div className="bg-white dark:bg-surface-dark p-2 rounded-lg border border-surface-light-border/60 dark:border-surface-dark-border/60">
                  <span className="text-[10px] text-text-light-muted block">Break-Even Sales</span>
                  <span className="font-bold">{breakEvenUnits} units</span>
                  <span className="text-[10px] text-brand-600 font-mono block">~{Math.ceil(breakEvenUnits / (velocity || 1))} days</span>
                </div>
              </div>
            </div>

            {/* AI Automated Recommendation Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <ShieldCheckIcon className="h-4 w-4" />
                <span>AI Risk Assessment & Guidance</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {currentStock < Math.round(velocity * 3)
                  ? `Immediate replenishment required. Stock is below the 3-day buffer (${Math.round(velocity * 3)} units). Ordering ${orderQty} units extends runway by ${+(orderQty / (velocity || 1)).toFixed(1)} days.`
                  : `Current stock covers ${runwayDays} days of operations. Proposed order of ${orderQty} units locks ₹${capitalOutlay.toLocaleString()} working capital. Break-even requires ${breakEvenUnits} units.`}
              </p>
            </div>

            {/* 1-Click AI Optimizations */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-text-light-muted uppercase tracking-wider block">
                Instant Store Actions
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleAutoTuneOrder(Math.max(10, Math.round(velocity * 30)), "Optimized for complete 30-day customer demand")}
                  className="w-full text-left p-2.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover hover:border-brand-500 border border-surface-light-border dark:border-surface-dark-border text-xs flex items-center justify-between group transition-all"
                >
                  <div>
                    <span className="font-bold block text-text-light dark:text-text-dark">⚡ Match 30-Day Demand ({Math.max(10, Math.round(velocity * 30))} units)</span>
                    <span className="text-[10px] text-text-light-muted">Prevents mid-month stockout and saves supplier reorder costs</span>
                  </div>
                  <CheckIcon className="h-4 w-4 text-brand-500 opacity-0 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleAutoTuneOrder(orderQty + 20, "Added safety buffer for peak weekend sales")}
                  className="w-full text-left p-2.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover hover:border-brand-500 border border-surface-light-border dark:border-surface-dark-border text-xs flex items-center justify-between group transition-all"
                >
                  <div>
                    <span className="font-bold block text-text-light dark:text-text-dark">🛡️ Add Weekend Buffer (+20 units)</span>
                    <span className="text-[10px] text-text-light-muted">Covers high-traffic spikes without financial over-commitment</span>
                  </div>
                  <CheckIcon className="h-4 w-4 text-brand-500 opacity-0 group-hover:opacity-100" />
                </button>

                <Link
                  to="/reports"
                  className="w-full text-left p-2.5 rounded-lg bg-surface-light-hover dark:bg-surface-dark-hover hover:border-brand-500 border border-surface-light-border dark:border-surface-dark-border text-xs flex items-center justify-between group transition-all"
                >
                  <div>
                    <span className="font-bold block text-text-light dark:text-text-dark">📑 Open Executive Decision Report</span>
                    <span className="text-[10px] text-text-light-muted">View printable PDF-ready summary with audit records</span>
                  </div>
                  <DocumentChartBarIcon className="h-4 w-4 text-brand-500" />
                </Link>
              </div>
            </div>

            {/* Quick Questions Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-text-light-muted uppercase tracking-wider block">
                Ask AI Decision Copilot
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Is 20 units safe for the weekend?",
                  "What is my exact break-even point?",
                  "How much working capital is locked?",
                  "Optimize quantity for maximum profit",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAskAi(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-surface-light-hover dark:bg-surface-dark-hover hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 border border-surface-light-border dark:border-surface-dark-border text-text-light-muted dark:text-text-dark-muted transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            {aiMessages.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-surface-light-border dark:border-surface-dark-border">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      "p-3 rounded-xl text-xs space-y-1.5 leading-relaxed",
                      msg.sender === "user"
                        ? "bg-brand-500 text-white ml-6"
                        : "bg-surface-light-hover dark:bg-surface-dark-hover text-text-light dark:text-text-dark mr-2 border border-surface-light-border dark:border-surface-dark-border"
                    )}
                  >
                    <p>{msg.text}</p>
                    {msg.action && (
                      <button
                        onClick={msg.action.onClick}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold shadow-sm transition-all mt-1"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        {msg.action.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Input Box */}
          <div className="p-3 border-t border-surface-light-border dark:border-surface-dark-border bg-surface-light dark:bg-surface-dark">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi(aiQuery);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about risk, profit, or quantity..."
                className="input flex-1 text-xs py-2"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim()}
                className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors"
                title="Send query"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}