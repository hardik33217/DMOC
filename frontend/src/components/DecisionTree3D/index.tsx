import { useState, useMemo } from "react";
import { CubeIcon, Squares2X2Icon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Scene3D } from "./Scene3D";
import { Tree2D } from "./Tree2D";
import { DecisionTreeProps, TreeNodeData } from "./types";

export function DecisionTree3D({ decision, onSelectNode }: DecisionTreeProps) {
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);

  // Transform decision data into a unified tree graph structure
  const rootNode = useMemo<TreeNodeData>(() => {
    return {
      id: decision.id,
      type: "decision",
      title: decision.title,
      description: decision.question,
      children: (decision.alternatives || []).map((alt) => ({
        id: alt.id,
        type: "alternative" as const,
        title: alt.title,
        description: alt.description || undefined,
        parentId: decision.id,
        children: (alt.outcomes || []).map((out) => ({
          id: out.id,
          type: "outcome" as const,
          title: out.title,
          description: out.description || undefined,
          probability: out.probability,
          monetaryPayoff: out.monetaryPayoff,
          utilityScore: out.utilityScore,
          riskLevel: out.riskLevel,
          parentId: alt.id,
        })),
      })),
    };
  }, [decision]);

  const handleSelect = (node: TreeNodeData | null) => {
    setSelectedNode(node);
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  const hasAlternatives = (decision.alternatives || []).length > 0;

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface-light-border dark:border-surface-dark-border shadow-sm text-xs font-medium text-text-light dark:text-text-dark">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Tree</span>
          <span className="text-text-light-muted dark:text-text-dark-muted">• Drag to rotate, scroll to zoom</span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md p-1 rounded-lg border border-surface-light-border dark:border-surface-dark-border shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "3d"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark"
            }`}
          >
            <CubeIcon className="w-3.5 h-3.5" /> 3D View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("2d")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "2d"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark"
            }`}
          >
            <Squares2X2Icon className="w-3.5 h-3.5" /> 2D Tree
          </button>
        </div>
      </div>

      {/* Main Canvas / Fallback Area */}
      <div className="flex-1 w-full h-full relative">
        {!hasAlternatives ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <InformationCircleIcon className="w-12 h-12 text-brand-500 mb-3 opacity-80" />
            <h4 className="font-semibold text-text-light dark:text-text-dark text-base">No Alternatives Added</h4>
            <p className="text-sm text-text-light-muted dark:text-text-dark-muted mt-1 max-w-sm">
              Add alternatives and outcomes in the Decision Wizard to generate your interactive 3D decision tree.
            </p>
          </div>
        ) : viewMode === "3d" ? (
          <Scene3D
            rootNode={rootNode}
            selectedNode={selectedNode}
            onSelectNode={handleSelect}
          />
        ) : (
          <Tree2D
            rootNode={rootNode}
            selectedNode={selectedNode}
            onSelectNode={handleSelect}
          />
        )}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md p-4 rounded-xl border border-surface-light-border dark:border-surface-dark-border shadow-lg transition-all animate-fade-in text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400">
                {selectedNode.type} Node
              </span>
              <h4 className="font-semibold text-text-light dark:text-text-dark text-sm mt-0.5">
                {selectedNode.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-text-light-muted hover:text-text-light dark:text-text-dark-muted dark:hover:text-text-dark p-1"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {selectedNode.description && (
            <p className="text-text-light-muted dark:text-text-dark-muted mt-2">
              {selectedNode.description}
            </p>
          )}

          {selectedNode.type === "outcome" && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-light-border dark:border-surface-dark-border">
              {selectedNode.probability !== undefined && (
                <div>
                  <span className="text-text-light-muted dark:text-text-dark-muted block">Probability</span>
                  <span className="font-mono font-bold text-text-light dark:text-text-dark">
                    {Math.round(selectedNode.probability * 100)}%
                  </span>
                </div>
              )}
              {selectedNode.monetaryPayoff != null && (
                <div>
                  <span className="text-text-light-muted dark:text-text-dark-muted block">Payoff</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${selectedNode.monetaryPayoff.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedNode.utilityScore != null && (
                <div>
                  <span className="text-text-light-muted dark:text-text-dark-muted block">Utility Score</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {selectedNode.utilityScore} / 100
                  </span>
                </div>
              )}
              {selectedNode.riskLevel && (
                <div>
                  <span className="text-text-light-muted dark:text-text-dark-muted block">Risk Level</span>
                  <span className="font-bold uppercase text-[10px] text-amber-600 dark:text-amber-400">
                    {selectedNode.riskLevel}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DecisionTree3D;
