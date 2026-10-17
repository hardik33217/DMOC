import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { auditMiddleware } from "./middleware/audit.js";
import { authRouter } from "./routes/auth.js";
import { decisionsRouter } from "./routes/decisions.js";
import { alternativesRouter } from "./routes/alternatives.js";
import { criteriaRouter } from "./routes/criteria.js";
import { outcomesRouter } from "./routes/outcomes.js";
import { scenariosRouter } from "./routes/scenarios.js";
import { simulationsRouter } from "./routes/simulations.js";
import { sharesRouter } from "./routes/shares.js";
import { usersRouter } from "./routes/users.js";
import { importExportRouter } from "./routes/importExport.js";
import { healthRouter } from "./routes/health.js";
import { workflowsRouter } from "./routes/workflows.js";
import { workflowNodesRouter } from "./routes/workflowNodes.js";
import { workflowEdgesRouter } from "./routes/workflowEdges.js";
import { workflowRunsRouter } from "./routes/workflowRuns.js";
import { marketDataRouter } from "./routes/marketData.js";
import { businessesRouter } from "./routes/businesses.js";
import { productsRouter } from "./routes/products.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { inventoryRouter } from "./routes/inventory.js";
import { salesRouter } from "./routes/sales.js";
import { inventoryDecisionsRouter } from "./routes/inventoryDecisions.js";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.set("trust proxy", 1);

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max: process.env.NODE_ENV === "development" ? 100000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === "development" || req.path === "/health" || req.path === "/api/health";
  },
});
app.use("/api/", limiter);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/decisions", authMiddleware, auditMiddleware, decisionsRouter);
app.use("/api/decisions/:decisionId/alternatives", authMiddleware, auditMiddleware, alternativesRouter);
app.use("/api/decisions/:decisionId/criteria", authMiddleware, auditMiddleware, criteriaRouter);
app.use("/api/decisions/:decisionId/outcomes", authMiddleware, auditMiddleware, outcomesRouter);
app.use("/api/decisions/:decisionId/scenarios", authMiddleware, auditMiddleware, scenariosRouter);
app.use("/api/decisions/:decisionId/simulations", authMiddleware, auditMiddleware, simulationsRouter);
app.use("/api/decisions/:decisionId/shares", authMiddleware, auditMiddleware, sharesRouter);
app.use("/api/import-export", authMiddleware, auditMiddleware, importExportRouter);
app.use("/api/workflows", authMiddleware, auditMiddleware, workflowsRouter);
app.use("/api/workflows/:workflowId/nodes", authMiddleware, auditMiddleware, workflowNodesRouter);
app.use("/api/workflows/:workflowId/edges", authMiddleware, auditMiddleware, workflowEdgesRouter);
app.use("/api/workflows/:workflowId/runs", authMiddleware, auditMiddleware, workflowRunsRouter);
app.use("/api/market-data", authMiddleware, auditMiddleware, marketDataRouter);
app.use("/api/businesses", authMiddleware, auditMiddleware, businessesRouter);
app.use("/api/products", authMiddleware, auditMiddleware, productsRouter);
app.use("/api/suppliers", authMiddleware, auditMiddleware, suppliersRouter);
app.use("/api/inventory", authMiddleware, auditMiddleware, inventoryRouter);
app.use("/api/sales", authMiddleware, auditMiddleware, salesRouter);
app.use("/api/inventory-decisions", authMiddleware, auditMiddleware, inventoryDecisionsRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use(errorHandler);

async function start() {
  try {
    try {
      await prisma.$connect();
      console.log("Database connected");
    } catch (dbErr) {
      console.warn("Database connection deferred (PostgreSQL at localhost:5432 not currently reachable):", (dbErr as Error).message);
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});