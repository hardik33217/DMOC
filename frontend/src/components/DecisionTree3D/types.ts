export interface TreeNodeData {
  id: string;
  type: "decision" | "alternative" | "outcome";
  title: string;
  description?: string;
  probability?: number;
  monetaryPayoff?: number | null;
  utilityScore?: number | null;
  riskLevel?: "low" | "medium" | "high" | "critical";
  parentId?: string;
  children?: TreeNodeData[];
  position?: [number, number, number];
}

export interface DecisionTreeProps {
  decision: {
    id: string;
    title: string;
    question?: string;
    alternatives?: Array<{
      id: string;
      title: string;
      description?: string | null;
      outcomes?: Array<{
        id: string;
        title: string;
        description?: string | null;
        probability: number;
        monetaryPayoff?: number | null;
        utilityScore?: number | null;
        riskLevel?: "low" | "medium" | "high" | "critical";
      }>;
    }>;
  };
  onSelectNode?: (node: TreeNodeData | null) => void;
}
