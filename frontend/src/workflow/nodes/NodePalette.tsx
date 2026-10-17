import { useState } from "react";
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { NODE_CATEGORIES, NODE_TYPE_CONFIGS, WorkflowNodeTypeConfig } from "./nodeTypes";

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function NodePalette({ onDragStart, searchQuery = "", onSearchChange }: NodePaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    NODE_CATEGORIES.map(c => c.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = NODE_CATEGORIES.filter(category => {
    const nodes = Object.values(NODE_TYPE_CONFIGS).filter(n => n.category === category.id);
    return nodes.some(node =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getNodesForCategory = (categoryId: string) =>
    Object.values(NODE_TYPE_CONFIGS)
      .filter(n => n.category === categoryId)
      .filter(node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="w-72 bg-surface-light border-r border-surface-light-border dark:bg-surface-dark dark:border-surface-dark-border flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-surface-light-border dark:border-surface-dark-border">
        <h2 className="heading-5 mb-3">Node Palette</h2>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light-muted dark:text-text-dark-muted" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-light-hover dark:bg-surface-dark-hover border border-surface-light-border dark:border-surface-dark-border rounded-lg text-sm text-text-light dark:text-text-dark placeholder-text-light-muted dark:placeholder-text-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredCategories.map(category => {
          const nodes = getNodesForCategory(category.id);
          if (nodes.length === 0) return null;

          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id} className="space-y-2">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-text-light-muted dark:text-text-dark-muted hover:text-text-light dark:hover:text-text-dark rounded-lg hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover"
              >
                <div className={clsx("w-3 h-3 rounded", category.color)} />
                <span className="flex-1 truncate">{category.label}</span>
                <span className="text-xs text-text-light-muted dark:text-text-dark-muted">{nodes.length}</span>
                {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              </button>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-surface-light-border dark:border-surface-dark-border pl-2">
                  {nodes.map(nodeConfig => (
                    <DraggableNodeItem
                      key={nodeConfig.type}
                      nodeConfig={nodeConfig}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-surface-light-border dark:border-surface-dark-border">
        <p className="text-xs text-text-light-muted dark:text-text-dark-muted text-center">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}

interface DraggableNodeItemProps {
  nodeConfig: WorkflowNodeTypeConfig;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

function DraggableNodeItem({ nodeConfig, onDragStart }: DraggableNodeItemProps) {
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("application/json", JSON.stringify({
      type: "workflow-node",
      nodeType: nodeConfig.type,
      label: nodeConfig.label,
      defaultConfig: nodeConfig.defaultConfig,
    }));
    event.dataTransfer.effectAllowed = "copy";
    onDragStart(event, nodeConfig.type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex items-center gap-2 px-2 py-1.5 text-sm text-text-light dark:text-text-dark rounded-lg hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover cursor-grab active:cursor-grabbing transition-colors"
      title={`${nodeConfig.label}: ${nodeConfig.description}`}
    >
      <div className={clsx("w-3 h-3 rounded flex-shrink-0", nodeConfig.color)} />
      <span className="flex-1 truncate group-hover:font-medium">{nodeConfig.label}</span>
      <PlusIcon className="h-4 w-4 text-text-light-muted dark:text-text-dark-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}