import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { TreeNodeData } from "./types";

const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

interface ConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  active?: boolean;
}

function ConnectionLine({ start, end, color = "#6366f1", active = false }: ConnectionProps) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midX = (start[0] + end[0]) / 2;
    const p1 = new THREE.Vector3(midX, start[1], start[2]);
    const p2 = new THREE.Vector3(midX, end[1], end[2]);

    const curve = new THREE.CubicBezierCurve3(startVec, p1, p2, endVec);
    return curve.getPoints(24);
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      object={
        new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            linewidth: active ? 3 : 1.5,
            transparent: true,
            opacity: active ? 0.95 : 0.45,
          })
        )
      }
      ref={lineRef}
    />
  );
}

interface NodeMeshProps {
  node: TreeNodeData;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (node: TreeNodeData) => void;
}

function NodeMesh({ node, position, isSelected, onSelect }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_state, delta) => {
    if (meshRef.current && (hovered || isSelected)) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  const nodeColor = useMemo(() => {
    if (node.type === "decision") return "#6366f1";
    if (node.type === "alternative") return "#3b82f6";
    return RISK_COLORS[node.riskLevel || "low"] || "#10b981";
  }, [node]);

  const size = node.type === "decision" ? 0.65 : node.type === "alternative" ? 0.5 : 0.4;

  return (
    <group position={position}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
        >
          {node.type === "decision" ? (
            <octahedronGeometry args={[size, 1]} />
          ) : node.type === "alternative" ? (
            <boxGeometry args={[size * 1.5, size * 0.9, size * 0.9]} />
          ) : (
            <sphereGeometry args={[size, 16, 16]} />
          )}

          <meshStandardMaterial
            color={nodeColor}
            emissive={nodeColor}
            emissiveIntensity={isSelected ? 0.6 : hovered ? 0.35 : 0.15}
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
      </Float>

      {/* HTML Label with high fidelity styling */}
      <Html
        position={[0, -size - 0.25, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-md transition-all duration-200 ${
            isSelected
              ? "bg-brand-600 text-white ring-2 ring-white scale-105"
              : hovered
              ? "bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark ring-1 ring-brand-500 scale-105"
              : "bg-surface-light/90 dark:bg-surface-dark/90 text-text-light dark:text-text-dark border border-surface-light-border dark:border-surface-dark-border"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {node.type === "outcome" && node.probability !== undefined && (
              <span className="text-[10px] px-1 rounded bg-black/20 text-white font-mono">
                {Math.round(node.probability * 100)}%
              </span>
            )}
            <span>{node.title.length > 20 ? node.title.slice(0, 18) + "…" : node.title}</span>
          </div>
          {node.monetaryPayoff != null && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono text-center">
              ${node.monetaryPayoff.toLocaleString()}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

interface SceneProps {
  rootNode: TreeNodeData;
  selectedNode: TreeNodeData | null;
  onSelectNode: (node: TreeNodeData | null) => void;
}

export function Scene3D({ rootNode, selectedNode, onSelectNode }: SceneProps) {
  // Compute positions
  const { nodes, connections } = useMemo(() => {
    const nodeList: Array<{ node: TreeNodeData; position: [number, number, number] }> = [];
    const connList: Array<{ start: [number, number, number]; end: [number, number, number]; active: boolean; color?: string }> = [];

    // Root node
    const rootPos: [number, number, number] = [-4.5, 0, 0];
    nodeList.push({ node: rootNode, position: rootPos });

    const alternatives = rootNode.children || [];
    const altCount = alternatives.length;
    const altSpacing = Math.max(2.4, 6.5 / Math.max(1, altCount));

    alternatives.forEach((alt, altIdx) => {
      const altY = (altIdx - (altCount - 1) / 2) * altSpacing;
      const altPos: [number, number, number] = [-0.5, altY, 0];
      nodeList.push({ node: alt, position: altPos });

      const isAltPathSelected =
        selectedNode?.id === alt.id ||
        selectedNode?.parentId === alt.id ||
        alt.children?.some((o) => o.id === selectedNode?.id);

      connList.push({
        start: rootPos,
        end: altPos,
        active: !!isAltPathSelected,
        color: "#6366f1",
      });

      const outcomes = alt.children || [];
      const outCount = outcomes.length;
      const outSpacing = Math.max(1.5, 3.2 / Math.max(1, outCount));

      outcomes.forEach((out, outIdx) => {
        const outY = altY + (outIdx - (outCount - 1) / 2) * outSpacing;
        const outPos: [number, number, number] = [3.8, outY, 0];
        nodeList.push({ node: out, position: outPos });

        const isOutSelected = selectedNode?.id === out.id;
        connList.push({
          start: altPos,
          end: outPos,
          active: isOutSelected,
          color: RISK_COLORS[out.riskLevel || "low"] || "#10b981",
        });
      });
    });

    return { nodes: nodeList, connections: connList };
  }, [rootNode, selectedNode]);

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 48 }}
      className="w-full h-full"
      onPointerMissed={() => onSelectNode(null)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />
      <directionalLight position={[-10, -5, -5]} intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={0.8} />

      <group>
        {connections.map((c, i) => (
          <ConnectionLine
            key={i}
            start={c.start}
            end={c.end}
            active={c.active}
            color={c.color}
          />
        ))}

        {nodes.map(({ node, position }) => (
          <NodeMesh
            key={node.id}
            node={node}
            position={position}
            isSelected={selectedNode?.id === node.id}
            onSelect={onSelectNode}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={22}
        minDistance={3.5}
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
