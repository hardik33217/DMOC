import { Router, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createApiResponse } from "@decisionos/shared";
import { getLiveExchangeRates, getMarketBenchmarks } from "../services/marketDataService.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/rates", asyncHandler(async (req: AuthRequest, res: Response) => {
  const base = ((req.query.base as string) || "USD").toUpperCase();
  const data = await getLiveExchangeRates(base);
  return res.json(createApiResponse(data));
}));

router.get("/benchmarks", asyncHandler(async (_req: AuthRequest, res: Response) => {
  const benchmarks = await getMarketBenchmarks();
  return res.json(createApiResponse(benchmarks));
}));

router.post("/convert", asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    amount: z.number(),
    from: z.string().default("USD"),
    to: z.string().default("EUR"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const { amount, from, to } = parsed.data;
  const ratesData = await getLiveExchangeRates(from);
  const targetRate = ratesData.rates[to.toUpperCase()] ?? 1.0;
  const converted = amount * targetRate;

  return res.json(createApiResponse({
    amount,
    from,
    to,
    rate: targetRate,
    converted: Math.round(converted * 100) / 100,
    source: ratesData.source,
  }));
}));

export { router as marketDataRouter };
