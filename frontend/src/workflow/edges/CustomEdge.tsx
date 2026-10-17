import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = Boolean(data?.animated);
  const label = typeof data?.label === "string" ? data.label : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 2.5 : 2,
          stroke: selected
            ? "#6366f1"
            : isAnimated
            ? "#3b82f6"
            : "#94a3b8",
          transition: "stroke 0.2s, stroke-width 0.2s",
          ...style,
        }}
        className={isAnimated ? "animated-edge stroke-dash" : ""}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-light dark:bg-surface-dark border border-surface-light-border dark:border-surface-dark-border shadow-sm text-text-light-muted dark:text-text-dark-muted"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
