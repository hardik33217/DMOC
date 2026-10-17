import { TreeNodeData } from "./types";

interface Tree2DProps {
  rootNode: TreeNodeData;
  selectedNode: TreeNodeData | null;
  onSelectNode: (node: TreeNodeData | null) => void;
}

const RISK_BADGES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300 dark:border-rose-700",
};

export function Tree2D({ rootNode, selectedNode, onSelectNode }: Tree2DProps) {
  const alternatives = rootNode.children || [];

  return (
    <div className="w-full h-full p-6 overflow-auto bg-surface-light dark:bg-surface-dark select-none">
      <div className="min-w-[700px] flex items-stretch gap-8">
        {/* Root Decision Node */}
        <div className="flex flex-col justify-center">
          <button
            type="button"
            onClick={() => onSelectNode(rootNode)}
            className={`w-64 p-4 rounded-xl text-left transition-all shadow-sm border ${
              selectedNode?.id === rootNode.id
                ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500"
                : "bg-surface-light dark:bg-surface-dark-card border-surface-light-border dark:border-surface-dark-border hover:border-brand-400"
            }`}
          >
            <div className="text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
              Root Decision
            </div>
            <div className="font-semibold text-text-light dark:text-text-dark text-base mt-1 line-clamp-2">
              {rootNode.title}
            </div>
            {rootNode.description && (
              <p className="text-xs text-text-light-muted dark:text-text-dark-muted mt-1.5 line-clamp-2">
                {rootNode.description}
              </p>
            )}
            <div className="mt-3 text-[11px] text-text-light-muted dark:text-text-dark-muted font-medium">
              {alternatives.length} Alternatives
            </div>
          </button>
        </div>

        {/* Alternatives & Outcomes Branches */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          {alternatives.map((alt) => {
            const isAltSelected = selectedNode?.id === alt.id;
            const outcomes = alt.children || [];

            return (
              <div key={alt.id} className="flex items-center gap-6">
                {/* Alternative Card */}
                <button
                  type="button"
                  onClick={() => onSelectNode(alt)}
                  className={`w-56 p-3.5 rounded-xl text-left transition-all shadow-sm border flex-shrink-0 ${
                    isAltSelected
                      ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500"
                      : "bg-surface-light dark:bg-surface-dark-card border-surface-light-border dark:border-surface-dark-border hover:border-blue-400"
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                    Alternative
                  </div>
                  <div className="font-semibold text-text-light dark:text-text-dark text-sm mt-0.5 line-clamp-2">
                    {alt.title}
                  </div>
                  <div className="mt-2 text-[11px] text-text-light-muted dark:text-text-dark-muted">
                    {outcomes.length} possible outcomes
                  </div>
                </button>

                {/* Outcomes list */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {outcomes.map((out) => {
                    const isOutSelected = selectedNode?.id === out.id;
                    const badgeClass = RISK_BADGES[out.riskLevel || "low"];

                    return (
                      <button
                        key={out.id}
                        type="button"
                        onClick={() => onSelectNode(out)}
                        className={`p-3 rounded-lg text-left transition-all border text-xs ${
                          isOutSelected
                            ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500"
                            : "bg-surface-light dark:bg-surface-dark-card border-surface-light-border dark:border-surface-dark-border hover:border-emerald-400"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
                            {out.riskLevel || "low"}
                          </span>
                          {out.probability !== undefined && (
                            <span className="font-mono text-[11px] text-text-light-muted dark:text-text-dark-muted">
                              {Math.round(out.probability * 100)}% prob
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-text-light dark:text-text-dark truncate">
                          {out.title}
                        </div>
                        {out.monetaryPayoff != null && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold mt-1">
                            ${out.monetaryPayoff.toLocaleString()}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {outcomes.length === 0 && (
                    <div className="p-3 text-xs text-text-light-muted dark:text-text-dark-muted italic border border-dashed border-surface-light-border dark:border-surface-dark-border rounded-lg">
                      No outcomes added yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
