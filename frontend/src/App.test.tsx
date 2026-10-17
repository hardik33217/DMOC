import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import { Tree2D } from "./components/DecisionTree3D/Tree2D";

describe("Frontend Public and Visualization Components", () => {
  it("renders Privacy Policy page correctly", () => {
    render(
      <BrowserRouter>
        <PrivacyPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Privacy Policy")).toBeDefined();
    expect(screen.getByText(/At DMOC.*your privacy/)).toBeDefined();
  });

  it("renders Terms of Service page correctly", () => {
    render(
      <BrowserRouter>
        <TermsPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Terms of Service")).toBeDefined();
    expect(screen.getByText(/Nature of Analytical Simulations/)).toBeDefined();
  });

  it("renders Tree2D fallback hierarchy with alternatives and outcomes", () => {
    const mockRoot = {
      id: "root-1",
      type: "decision" as const,
      title: "Career Choice",
      children: [
        {
          id: "alt-1",
          type: "alternative" as const,
          title: "Startup Offer",
          children: [
            {
              id: "out-1",
              type: "outcome" as const,
              title: "Rapid Growth",
              probability: 0.5,
              monetaryPayoff: 150000,
              riskLevel: "medium" as const,
            },
          ],
        },
      ],
    };

    render(
      <Tree2D
        rootNode={mockRoot}
        selectedNode={null}
        onSelectNode={() => {}}
      />
    );

    expect(screen.getByText("Career Choice")).toBeDefined();
    expect(screen.getByText("Startup Offer")).toBeDefined();
    expect(screen.getByText("Rapid Growth")).toBeDefined();
  });
});
