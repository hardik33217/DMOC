import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { ProductEnrichmentService } from "./productEnrichmentService.js";

vi.mock("axios");

describe("ProductEnrichmentService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retrieves verified pharmacy data with NPPA price ceiling guidelines and dosage", async () => {
    const { results, disclaimer } = await ProductEnrichmentService.searchProducts("Paracetamol 650", "pharmacy");
    expect(results.length).toBeGreaterThan(0);
    const paracetamol = results[0]!;
    expect(paracetamol.name).toContain("Paracetamol");
    expect(paracetamol.strength).toBe("650mg");
    expect(paracetamol.dosageForm).toBe("Tablet");
    expect(paracetamol.packSize).toBe(15);
    expect(paracetamol.isVerified).toBe(true);
    expect(paracetamol.regulatoryNotice).toContain("NPPA");
    expect(disclaimer).toContain("OFFICIAL REGULATORY NOTICE");
  });

  it("identifies Schedule H prescription medicines and marks prescription required", async () => {
    const { results } = await ProductEnrichmentService.searchProducts("Amoxicillin 500", "pharmacy");
    expect(results.length).toBeGreaterThan(0);
    const amox = results[0]!;
    expect(amox.requiresPrescription).toBe(true);
    expect(amox.regulatoryNotice).toContain("SCHEDULE H");
  });

  it("handles Open Food Facts barcode lookup with exact match and provenance", async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: 1,
        product: {
          product_name: "Whole Wheat Atta",
          brands: "Aashirvaad",
          categories_tags: ["en:staples"],
          ingredients_text: "Whole Wheat",
        },
      },
    });

    const { results } = await ProductEnrichmentService.searchProducts("Atta", "grocery", "8901030000001");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.sourceProvider).toBe("open_food_facts");
    expect(results[0]!.matchType).toBe("exact_barcode");
    expect(results[0]!.isVerified).toBe(true);
  });

  it("falls back gracefully with unverified warning when product is unknown and API returns empty", async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: { products: [] },
    });

    const { results } = await ProductEnrichmentService.searchProducts("xyz_custom_nonexistent_widget_999", "retail");
    expect(results.length).toBe(1);
    expect(results[0]!.isVerified).toBe(false);
    expect(results[0]!.regulatoryNotice).toContain("UNVERIFIED DATA WARNING");
  });
});
