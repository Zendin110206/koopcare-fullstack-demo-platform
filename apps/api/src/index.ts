import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ path: "../../.env" });
dotenv.config();

const app = express();

const port = Number(process.env.API_PORT ?? 5002);
const environment = process.env.APP_ENV ?? "development";
const mlApiBaseUrl = process.env.ML_API_BASE_URL ?? "http://127.0.0.1:8000";
const mlApiTimeoutMs = Number(process.env.ML_API_TIMEOUT_MS ?? 5000);

app.use(cors());
app.use(express.json());

const demoApplications = [
  {
    id: "APP-2026-001",
    applicantName: "Siti Aminah",
    requestedAmount: 8_000_000,
    tenorMonths: 10,
    purpose: "Working capital for grocery inventory",
    status: "PENDING_REVIEW",
    aiRecommendation: "READY_FOR_SCORING",
    riskLevel: "NOT_SCORED_YET"
  },
  {
    id: "APP-2026-002",
    applicantName: "Budi Santoso",
    requestedAmount: 12_500_000,
    tenorMonths: 12,
    purpose: "Equipment financing",
    status: "DRAFT",
    aiRecommendation: "WAITING_FOR_COMPLETE_DATA",
    riskLevel: "NOT_SCORED_YET"
  },
  {
    id: "APP-2026-003",
    applicantName: "Nur Hidayah",
    requestedAmount: 5_000_000,
    tenorMonths: 6,
    purpose: "Microbusiness expansion",
    status: "APPROVED_DEMO",
    aiRecommendation: "APPROVED_BY_OFFICER_DEMO",
    riskLevel: "LOW_DEMO"
  }
];

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "KoopCare Fullstack Demo API",
    environment,
    version: "0.1.0",
    ml_api: {
      base_url: mlApiBaseUrl,
      timeout_ms: mlApiTimeoutMs,
      integration_status: "planned"
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/demo/summary", (_request, response) => {
  response.json({
    service: "KoopCare Fullstack Demo API",
    phase: "Progress 02 - runnable web and API scaffold",
    product_principle: "AI recommends, cooperative officers decide.",
    counts: {
      total_applications: demoApplications.length,
      pending_review: demoApplications.filter((item) => item.status === "PENDING_REVIEW").length,
      draft: demoApplications.filter((item) => item.status === "DRAFT").length,
      approved_demo: demoApplications.filter((item) => item.status === "APPROVED_DEMO").length
    },
    integration: {
      database: "not_connected_yet",
      ml_api: "planned",
      ml_api_base_url: mlApiBaseUrl,
      auth: "not_connected_yet"
    }
  });
});

app.get("/api/v1/demo/applications", (_request, response) => {
  response.json({
    data: demoApplications
  });
});

app.use((_request, response) => {
  response.status(404).json({
    error: "Not Found",
    message: "The requested demo endpoint does not exist."
  });
});

app.listen(port, () => {
  console.log(`KoopCare Fullstack Demo API running on http://localhost:${port}`);
});
