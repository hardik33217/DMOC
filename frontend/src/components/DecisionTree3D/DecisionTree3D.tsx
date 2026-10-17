import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Html } from "@react-three/drei";

interface DecisionTreeNode {
  id: string;
  title: string;
  type: "decision" | "alternative" | "outcome";
  position: [number, number, number];
  color: string;
  data?: Record<string, unknown>;
}

interface DecisionTreeLink {
  source: string;
  target: string;
}

interface DecisionTree3DProps {
  nodes: DecisionTreeNode[];
  links: DecisionTreeLink[];
  selectedNodeId?: string;
  onNodeClick?: (node: DecisionTreeNode) => void;
  className?: string;
  height?: number;
}

const NODE_RADIUS = {
  decision: 1.2,
  alternative: 0.8,
  outcome: 0.5,
} as const;

function Node({
  node,
  isSelected,
  onClick,
}: {
  node: DecisionTreeNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <mesh>
        <sphereGeometry args={[NODE_RADIUS[node.type], 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? "#f59e0b" : node.color}
          emissive={isSelected ? "#f59e0b" : node.color}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.15 : 0}
          metalness={0.1}
          roughness={0.3}
          transparent
          opacity={0.95}
        />
      </mesh>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[NODE_RADIUS[node.type] * 1.15, 32, 32]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      <Html
        position={[0, -NODE_RADIUS[node.type] - 0.4, 0]}
        style={{
          fontSize: "0.7rem",
          maxWidth: "120px",
          textAlign: "center",
          color: "#1e293b",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {node.title}
      </Html>
    </group>
  );
}

function Link({ start, end, color = "#94a3b8" }: { start: THREE.Vector3; end: THREE.Vector3; color?: string }) {
  const points = useMemo(() => [start, end], [start, end]);
  const positions = useMemo(() => new Float32Array(points.flatMap((p) => p.toArray())), [start, end]);

  return (
    <primitive
      object={useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.6,
          linewidth: 2,
        });
        return new THREE.Line(geometry, material);
      }, [positions, color])}
    />
  );
}

function TreeScene({
  nodes,
  links,
  selectedNodeId,
  onNodeClick,
}: {
  nodes: DecisionTreeNode[];
  links: DecisionTreeLink[];
  selectedNodeId?: string;
  onNodeClick?: (node: DecisionTreeNode) => void;
}) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const linkLines = useMemo(() => {
    return links
      .map((link) => {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (!sourceNode || !targetNode) return null;
        return (
          <Link
            key={`${link.source}-${link.target}`}
            start={new THREE.Vector3(...sourceNode.position)}
            end={new THREE.Vector3(...targetNode.position)}
            color={targetNode.type === "outcome" && targetNode.data?.monetaryPayoff !== undefined && (targetNode.data.monetaryPayoff as number) < 0
              ? "#ef4444"
              : "#94a3b8"}
          />
        );
      })
      .filter((l): l is React.ReactElement => l !== null);
  }, [links, nodeMap]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />

      {linkLines}

      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onClick={() => onNodeClick?.(node)}
        />
      ))}
    </>
  );
}

function TreeCanvas({
  nodes,
  links,
  selectedNodeId,
  onNodeClick,
}: {
  nodes: DecisionTreeNode[];
  links: DecisionTreeLink[];
  selectedNodeId?: string;
  onNodeClick?: (node: DecisionTreeNode) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (nodes.length > 0) {
      const positions = nodes.map((n) => new THREE.Vector3(...n.position));
      const box = new THREE.Box3().setFromPoints(positions);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const fov = perspectiveCamera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
    }
  }, [nodes, camera]);

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <TreeScene
        nodes={nodes}
        links={links}
        selectedNodeId={selectedNodeId}
        onNodeClick={onNodeClick}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

export default function DecisionTree3D({
  nodes = [],
  links = [],
  selectedNodeId,
  onNodeClick,
  className = "",
  height = 500,
}: DecisionTree3DProps) {
  const [show2D, setShow2D] = useState(false);

  if (nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-light-hover dark:bg-surface-dark-hover rounded-xl border border-surface-light-border dark:border-surface-dark-border ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 mx-auto mb-4">
            <svg className="h-10 w-10 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          <h3 className="heading-4 mb-2">No Decision Tree Data</h3>
          <p className="body mb-6">Add alternatives, outcomes, and criteria to visualize your decision tree.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border border-surface-light-border dark:border-surface-dark-border overflow-hidden ${className}`} style={{ height }}>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-text-light-muted dark:text-text-dark-muted cursor-pointer">
          <input
            type="checkbox"
            checked={show2D}
            onChange={(e) => setShow2D(e.target.checked)}
            className="h-4 w-4 rounded border-surface-light-border text-brand-600 focus:ring-brand-500"
          />
          2D View
        </label>
      </div>

      {show2D ? (
        <DecisionTree2D nodes={nodes} links={links} selectedNodeId={selectedNodeId} onNodeClick={onNodeClick} style={{ height: "100%" }} />
      ) : (
        <TreeCanvas
          nodes={nodes}
          links={links}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
        />
      )}
    </div>
  );
}

function DecisionTree2D({
  nodes,
  links,
  selectedNodeId,
  onNodeClick,
  style,
}: {
  nodes: DecisionTreeNode[];
  links: DecisionTreeLink[];
  selectedNodeId?: string;
  onNodeClick?: (node: DecisionTreeNode) => void;
  style?: React.CSSProperties;
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const linkLines = useMemo(() => {
    return links
      .map((link) => {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (!sourceNode || !targetNode) return null;
        return { source: sourceNode, target: targetNode };
      })
      .filter((l): l is { source: DecisionTreeNode; target: DecisionTreeNode } => l !== null);
  }, [links, nodeMap]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setTransform((t) => ({
      ...t,
      scale: Math.min(Math.max(t.scale * (e.deltaY > 0 ? 0.9 : 1.1), 0.1), 3),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - transform.x;
    const startY = e.clientY - transform.y;
    const handleMove = (moveEvent: MouseEvent) => {
      setTransform((t) => ({
        ...t,
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      }));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#f8fafc",
        borderRadius: "0.75rem",
        position: "relative",
      } as React.CSSProperties}
    >
      <svg
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
        </defs>
        {linkLines.map((link, i) => (
          <line
            key={i}
            x1={link.source.position[0] * 150 + 400}
            y1={link.source.position[1] * -100 + 300}
            x2={link.target.position[0] * 150 + 400}
            y2={link.target.position[1] * -100 + 300}
            stroke="#94a3b8"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
            opacity={0.6}
          />
        ))}
        {nodes.map((node) => (
          <g
            key={node.id}
            onClick={() => onNodeClick?.(node)}
            style={{ cursor: "pointer" }}
            transform={`translate(${node.position[0] * 150 + 400}, ${node.position[1] * -100 + 300})`}
          >
            <circle
              r={node.type === "decision" ? 30 : node.type === "alternative" ? 22 : 15}
              fill={selectedNodeId === node.id ? "#f59e0b" : node.color}
              stroke={selectedNodeId === node.id ? "#fbbf24" : "white"}
              strokeWidth={selectedNodeId === node.id ? 3 : 2}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={node.type === "decision" ? 12 : node.type === "alternative" ? 10 : 8}
              fontWeight={600}
              dy={4}
            >
              {node.title.length > 18 ? node.title.substring(0, 18) + "..." : node.title}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-text-light-muted dark:text-text-dark-muted">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4f46e5" }} />
          <span>Decision</span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#059669" }} />
          <span>Alternatives</span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#dc2626" }} />
          <span>Outcomes</span>
        </div>
      </div>
    </div>
  );
}

export type { DecisionTreeNode, DecisionTreeLink, DecisionTree3DProps };