import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const apiRoot = path.resolve(currentDirectory, "..");
const repoRoot = path.resolve(apiRoot, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config();

type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

type ApplicationDecision = "APPROVED" | "REJECTED";
type MlScoringMode = "optional_fallback" | "strict_ml";

type AiAssessment = {
  source: "ml_api" | "demo_rule_based_fallback";
  aiRecommendation: "LAYAK" | "TIDAK_LAYAK";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  probDefault: number;
  threshold: number;
  confidence: number;
  eligibilityScore: number;
  modelName: string;
  modelVersion: string;
  humanReviewRequired: boolean;
  note: string;
  createdAt: string;
};

type FinancingApplication = {
  id: string;
  applicantName: string;
  phoneNumber: string;
  gender: "M" | "F";
  age: number;
  businessType: string;
  monthlyIncome: number;
  requestedAmount: number;
  tenorMonths: number;
  purpose: string;
  yearsInBusiness: number;
  existingLoanCount: number;
  familyMembers: number;
  children: number;
  hasCollateral: boolean;
  status: ApplicationStatus;
  aiAssessment: AiAssessment | null;
  decision: {
    decision: ApplicationDecision;
    reviewerName: string;
    note: string;
    decidedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type CreateApplicationRequest = {
  applicantName?: unknown;
  phoneNumber?: unknown;
  gender?: unknown;
  age?: unknown;
  businessType?: unknown;
  monthlyIncome?: unknown;
  requestedAmount?: unknown;
  tenorMonths?: unknown;
  purpose?: unknown;
  yearsInBusiness?: unknown;
  existingLoanCount?: unknown;
  familyMembers?: unknown;
  children?: unknown;
  hasCollateral?: unknown;
};

type MlPredictionResponse = {
  ai_recommendation: "LAYAK" | "TIDAK_LAYAK";
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  prob_default: number;
  threshold: number;
  confidence: number;
  model_name: string;
  model_version: string;
  human_review_required: boolean;
  note: string;
};

const app = express();

const port = parseEnvNumber(process.env.API_PORT, 5002);
const environment = process.env.APP_ENV ?? "development";
const mlApiBaseUrl = process.env.ML_API_BASE_URL ?? "http://127.0.0.1:8000";
const mlApiTimeoutMs = parseEnvNumber(process.env.ML_API_TIMEOUT_MS, 5000);
const mlScoringMode = parseMlScoringMode(process.env.ML_SCORING_MODE);
const serveWebApp = parseBooleanFlag(process.env.SERVE_WEB_APP);
const webDistPath = process.env.WEB_DIST_PATH?.trim()
  ? resolveProjectPath(process.env.WEB_DIST_PATH.trim())
  : path.resolve(repoRoot, "apps", "web", "dist");
const webIndexPath = path.join(webDistPath, "index.html");
const moneyRules = {
  monthlyIncome: {
    min: 500_000,
    max: 100_000_000,
    step: 100_000
  },
  requestedAmount: {
    min: 500_000,
    max: 100_000_000,
    step: 500_000
  }
} as const;
const dataFilePath = process.env.DATA_FILE_PATH?.trim()
  ? resolveProjectPath(process.env.DATA_FILE_PATH.trim())
  : path.resolve(apiRoot, ".data", "applications.local.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function nowIso() {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseEnvNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseMlScoringMode(value: string | undefined): MlScoringMode {
  return value === "strict_ml" ? "strict_ml" : "optional_fallback";
}

function parseBooleanFlag(value: string | undefined) {
  if (value === undefined) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getMlIntegrationStatus() {
  return mlScoringMode === "strict_ml" ? "strict_ml_required" : "optional_with_fallback";
}

function resolveProjectPath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createHttpError(statusCode: number, errorLabel: string, message: string) {
  const error = new Error(message) as Error & {
    errorLabel: string;
    statusCode: number;
  };

  error.errorLabel = errorLabel;
  error.statusCode = statusCode;

  return error;
}

function parseString(
  value: unknown,
  field: string,
  options: {
    minLength?: number;
    maxLength?: number;
  } = {}
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  const trimmed = value.trim();

  if (options.minLength !== undefined && trimmed.length < options.minLength) {
    throw new Error(`${field} must be at least ${options.minLength} characters.`);
  }

  if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
    throw new Error(`${field} must be at most ${options.maxLength} characters.`);
  }

  return trimmed;
}

function parseGender(value: unknown) {
  if (value === "M" || value === "F") {
    return value;
  }

  throw new Error("gender must be M or F.");
}

function parseNumber(value: unknown, field: string, options: { min?: number; max?: number } = {}) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a valid number.`);
  }

  if (options.min !== undefined && numberValue < options.min) {
    throw new Error(`${field} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && numberValue > options.max) {
    throw new Error(`${field} must be at most ${options.max}.`);
  }

  return numberValue;
}

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(value)}`;
}

function parseInteger(value: unknown, field: string, options: { min?: number; max?: number } = {}) {
  const numberValue = parseNumber(value, field, options);

  if (!Number.isInteger(numberValue)) {
    throw new Error(`${field} must be an integer.`);
  }

  return numberValue;
}

function parseMoney(
  value: unknown,
  field: string,
  options: {
    min: number;
    max: number;
    step: number;
  }
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${field} must be a valid number.`);
  }

  if (!Number.isInteger(numberValue)) {
    throw new Error(`${field} must be an integer rupiah amount.`);
  }

  if (numberValue < options.min) {
    throw new Error(`${field} must be at least ${formatRupiah(options.min)}.`);
  }

  if (numberValue > options.max) {
    throw new Error(`${field} must be at most ${formatRupiah(options.max)}.`);
  }

  if (numberValue % options.step !== 0) {
    throw new Error(`${field} must use ${formatRupiah(options.step)} increments.`);
  }

  return numberValue;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("hasCollateral must be true or false.");
}

function createSeedApplications(): FinancingApplication[] {
  const timestamp = nowIso();

  return [
    {
      id: "APP-2026-001",
      applicantName: "Siti Aminah",
      phoneNumber: "081234567001",
      gender: "F",
      age: 36,
      businessType: "Grocery microbusiness",
      monthlyIncome: 6_500_000,
      requestedAmount: 8_000_000,
      tenorMonths: 10,
      purpose: "Working capital for grocery inventory",
      yearsInBusiness: 4,
      existingLoanCount: 0,
      familyMembers: 4,
      children: 2,
      hasCollateral: true,
      status: "UNDER_REVIEW",
      aiAssessment: null,
      decision: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "APP-2026-002",
      applicantName: "Budi Santoso",
      phoneNumber: "081234567002",
      gender: "M",
      age: 42,
      businessType: "Equipment repair service",
      monthlyIncome: 8_200_000,
      requestedAmount: 12_500_000,
      tenorMonths: 12,
      purpose: "Equipment financing",
      yearsInBusiness: 7,
      existingLoanCount: 1,
      familyMembers: 3,
      children: 1,
      hasCollateral: false,
      status: "SUBMITTED",
      aiAssessment: null,
      decision: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "APP-2026-003",
      applicantName: "Nur Hidayah",
      phoneNumber: "081234567003",
      gender: "F",
      age: 31,
      businessType: "Home food production",
      monthlyIncome: 5_700_000,
      requestedAmount: 5_000_000,
      tenorMonths: 6,
      purpose: "Microbusiness expansion",
      yearsInBusiness: 5,
      existingLoanCount: 0,
      familyMembers: 2,
      children: 0,
      hasCollateral: true,
      status: "APPROVED",
      aiAssessment: {
        source: "demo_rule_based_fallback",
        aiRecommendation: "LAYAK",
        riskLevel: "LOW",
        probDefault: 0.24,
        threshold: 0.666079580783844,
        confidence: 0.76,
        eligibilityScore: 76,
        modelName: "Demo Rule-Based Fallback",
        modelVersion: "fallback-v1",
        humanReviewRequired: true,
        note: "Seeded demo assessment. Final decision remains with the officer.",
        createdAt: timestamp
      },
      decision: {
        decision: "APPROVED",
        reviewerName: "Admin Demo",
        note: "Approved as seeded demo data.",
        decidedAt: timestamp
      },
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];
}

async function ensureDataFile() {
  await mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await readFile(dataFilePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await writeApplications(createSeedApplications());
  }
}

async function readApplications() {
  await ensureDataFile();
  const content = await readFile(dataFilePath, "utf8");
  const parsed = JSON.parse(content) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Application data file must contain an array.");
  }

  return parsed as FinancingApplication[];
}

async function writeApplications(applications: FinancingApplication[]) {
  await mkdir(path.dirname(dataFilePath), { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(applications, null, 2)}\n`, "utf8");
}

function buildApplication(input: CreateApplicationRequest): FinancingApplication {
  const timestamp = nowIso();

  return {
    id: `APP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    applicantName: parseString(input.applicantName, "applicantName"),
    phoneNumber: parseString(input.phoneNumber, "phoneNumber"),
    gender: parseGender(input.gender),
    age: parseInteger(input.age, "age", { min: 18, max: 75 }),
    businessType: parseString(input.businessType, "businessType"),
    monthlyIncome: parseMoney(input.monthlyIncome, "monthlyIncome", moneyRules.monthlyIncome),
    requestedAmount: parseMoney(input.requestedAmount, "requestedAmount", moneyRules.requestedAmount),
    tenorMonths: parseInteger(input.tenorMonths, "tenorMonths", { min: 1, max: 36 }),
    purpose: parseString(input.purpose, "purpose"),
    yearsInBusiness: parseInteger(input.yearsInBusiness, "yearsInBusiness", { min: 0, max: 60 }),
    existingLoanCount: parseInteger(input.existingLoanCount, "existingLoanCount", { min: 0, max: 20 }),
    familyMembers: parseInteger(input.familyMembers, "familyMembers", { min: 1, max: 20 }),
    children: parseInteger(input.children, "children", { min: 0, max: 15 }),
    hasCollateral: parseBoolean(input.hasCollateral),
    status: "SUBMITTED",
    aiAssessment: null,
    decision: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function summarizeApplications(applications: FinancingApplication[]) {
  return {
    total_applications: applications.length,
    submitted: applications.filter((item) => item.status === "SUBMITTED").length,
    under_review: applications.filter((item) => item.status === "UNDER_REVIEW").length,
    approved: applications.filter((item) => item.status === "APPROVED").length,
    rejected: applications.filter((item) => item.status === "REJECTED").length,
    scored: applications.filter((item) => item.aiAssessment !== null).length
  };
}

function buildMlPayload(application: FinancingApplication) {
  return {
    code_gender: application.gender,
    name_income_type: "Working",
    name_education_type: "Secondary / secondary special",
    name_family_status: application.familyMembers > 1 ? "Married" : "Single / not married",
    occupation_type: "Laborers",
    flag_own_car: "N",
    flag_own_realty: application.hasCollateral ? "Y" : "N",
    cnt_children: application.children,
    cnt_fam_members: application.familyMembers,
    amt_income_total: application.monthlyIncome,
    amt_credit: application.requestedAmount,
    amt_annuity: Math.max(application.requestedAmount / application.tenorMonths, 1),
    amt_goods_price: application.requestedAmount,
    days_birth: -Math.round(application.age * 365.25),
    days_employed: -Math.round(application.yearsInBusiness * 365.25),
    days_last_phone_change: -365,
    ext_source_1: application.hasCollateral ? 0.62 : 0.48,
    ext_source_2: clamp(0.42 + application.yearsInBusiness * 0.025, 0.25, 0.85),
    ext_source_3: clamp(0.58 - application.existingLoanCount * 0.04, 0.25, 0.8)
  };
}

function mapMlResponse(response: MlPredictionResponse): AiAssessment {
  return {
    source: "ml_api",
    aiRecommendation: response.ai_recommendation,
    riskLevel: response.risk_level,
    probDefault: response.prob_default,
    threshold: response.threshold,
    confidence: response.confidence,
    eligibilityScore: Math.round((1 - response.prob_default) * 100),
    modelName: response.model_name,
    modelVersion: response.model_version,
    humanReviewRequired: response.human_review_required,
    note: response.note,
    createdAt: nowIso()
  };
}

function isValidMlPredictionResponse(value: unknown): value is MlPredictionResponse {
  if (!isObject(value)) {
    return false;
  }

  const aiRecommendation = value.ai_recommendation;
  const riskLevel = value.risk_level;

  return (
    (aiRecommendation === "LAYAK" || aiRecommendation === "TIDAK_LAYAK") &&
    (riskLevel === "LOW" || riskLevel === "MEDIUM" || riskLevel === "HIGH") &&
    typeof value.prob_default === "number" &&
    Number.isFinite(value.prob_default) &&
    typeof value.threshold === "number" &&
    Number.isFinite(value.threshold) &&
    typeof value.confidence === "number" &&
    Number.isFinite(value.confidence) &&
    typeof value.model_name === "string" &&
    typeof value.model_version === "string" &&
    typeof value.human_review_required === "boolean" &&
    typeof value.note === "string"
  );
}

function buildFallbackAssessment(application: FinancingApplication, reason: string): AiAssessment {
  const debtPressure = application.requestedAmount / Math.max(application.monthlyIncome * application.tenorMonths, 1);
  const stabilityCredit = Math.min(application.yearsInBusiness * 0.018, 0.12);
  const collateralCredit = application.hasCollateral ? 0.08 : 0;
  const existingLoanPenalty = application.existingLoanCount * 0.075;
  const tenorPenalty = Math.max(application.tenorMonths - 12, 0) * 0.008;
  const agePenalty = application.age < 23 || application.age > 60 ? 0.04 : 0;
  const probDefault = clamp(
    0.22 + debtPressure * 0.35 + existingLoanPenalty + tenorPenalty + agePenalty - stabilityCredit - collateralCredit,
    0.05,
    0.92
  );
  const threshold = 0.666079580783844;
  const riskLevel = probDefault < 0.35 ? "LOW" : probDefault < threshold ? "MEDIUM" : "HIGH";

  return {
    source: "demo_rule_based_fallback",
    aiRecommendation: probDefault < threshold ? "LAYAK" : "TIDAK_LAYAK",
    riskLevel,
    probDefault,
    threshold,
    confidence: Math.round(Math.abs(threshold - probDefault) * 100) / 100,
    eligibilityScore: Math.round((1 - probDefault) * 100),
    modelName: "Demo Rule-Based Fallback",
    modelVersion: "fallback-v1",
    humanReviewRequired: true,
    note: `Fallback demo assessment used because ML API scoring was unavailable. Reason: ${reason}.`,
    createdAt: nowIso()
  };
}

async function scoreApplication(application: FinancingApplication): Promise<AiAssessment> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), mlApiTimeoutMs);

  try {
    const response = await fetch(`${mlApiBaseUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildMlPayload(application)),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}`);
    }

    const payload = (await response.json()) as unknown;

    if (!isValidMlPredictionResponse(payload)) {
      throw new Error("ML API returned an invalid prediction payload");
    }

    return mapMlResponse(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";

    if (mlScoringMode === "strict_ml") {
      throw createHttpError(
        503,
        "Service Unavailable",
        `ML scoring is required, but the MLOps API is unavailable. Reason: ${reason}.`
      );
    }

    return buildFallbackAssessment(application, reason);
  } finally {
    clearTimeout(timeout);
  }
}

function toClientApplication(application: FinancingApplication) {
  return {
    ...application,
    requestedAmountFormatted: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(application.requestedAmount)
  };
}

app.get("/health", async (_request, response) => {
  const applications = await readApplications();

  response.json({
    status: "ok",
    service: "KoopCare Fullstack Demo API",
    environment,
    version: "0.3.0",
    storage: {
      type: "json_file",
      path: dataFilePath,
      applications: applications.length
    },
    ml_api: {
      base_url: mlApiBaseUrl,
      timeout_ms: mlApiTimeoutMs,
      scoring_mode: mlScoringMode,
      integration_status: getMlIntegrationStatus()
    },
    timestamp: nowIso()
  });
});

app.get("/api/v1/demo/summary", async (_request, response) => {
  const applications = await readApplications();

  response.json({
    service: "KoopCare Fullstack Demo API",
    phase: "Runnable MVP demo",
    product_principle: "AI recommends, cooperative officers decide.",
    counts: summarizeApplications(applications),
    integration: {
      database: "json_file_storage",
      ml_api: getMlIntegrationStatus(),
      ml_api_base_url: mlApiBaseUrl,
      ml_scoring_mode: mlScoringMode,
      web_app: serveWebApp ? "served_by_api" : "separate_web_server",
      web_dist_available: existsSync(webIndexPath),
      auth: "demo_mode"
    }
  });
});

app.get("/api/v1/demo/applications", async (_request, response) => {
  const applications = await readApplications();

  response.json({
    data: applications.map(toClientApplication)
  });
});

app.get("/api/v1/applications", async (_request, response) => {
  const applications = await readApplications();

  response.json({
    data: applications.map(toClientApplication)
  });
});

app.get("/api/v1/applications/:id/status", async (request, response) => {
  const applications = await readApplications();
  const application = applications.find((item) => item.id === request.params.id);

  if (!application) {
    response.status(404).json({
      error: "Not Found",
      message: "Application not found."
    });
    return;
  }

  response.json({
    data: toClientApplication(application)
  });
});

app.post("/api/v1/applications", async (request, response) => {
  try {
    if (!isObject(request.body)) {
      throw new Error("Request body must be an object.");
    }

    const applications = await readApplications();
    const application = buildApplication(request.body);
    const aiAssessment = await scoreApplication(application);
    const applicationWithScore: FinancingApplication = {
      ...application,
      status: "UNDER_REVIEW",
      aiAssessment,
      updatedAt: nowIso()
    };

    applications.unshift(applicationWithScore);
    await writeApplications(applications);

    response.status(201).json({
      data: toClientApplication(applicationWithScore)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    const statusCode = getHttpErrorStatus(error, 400);

    response.status(statusCode).json({
      error: getHttpErrorLabel(error, statusCode),
      message
    });
  }
});

app.post("/api/v1/applications/:id/score", async (request, response) => {
  const applications = await readApplications();
  const applicationIndex = applications.findIndex((item) => item.id === request.params.id);

  if (applicationIndex === -1) {
    response.status(404).json({
      error: "Not Found",
      message: "Application not found."
    });
    return;
  }

  const application = applications[applicationIndex];
  const aiAssessment = await scoreApplication(application);
  const updatedApplication: FinancingApplication = {
    ...application,
    status: application.status === "SUBMITTED" ? "UNDER_REVIEW" : application.status,
    aiAssessment,
    updatedAt: nowIso()
  };

  applications[applicationIndex] = updatedApplication;
  await writeApplications(applications);

  response.json({
    data: toClientApplication(updatedApplication)
  });
});

app.post("/api/v1/applications/:id/decision", async (request, response) => {
  try {
    if (!isObject(request.body)) {
      throw new Error("Request body must be an object.");
    }

    const decision = request.body.decision;

    if (decision !== "APPROVED" && decision !== "REJECTED") {
      throw new Error("decision must be APPROVED or REJECTED.");
    }

    const reviewerName = parseString(request.body.reviewerName, "reviewerName", { maxLength: 80 });
    const note = parseString(request.body.note, "note", { minLength: 12, maxLength: 1_000 });
    const applications = await readApplications();
    const applicationIndex = applications.findIndex((item) => item.id === request.params.id);

    if (applicationIndex === -1) {
      response.status(404).json({
        error: "Not Found",
        message: "Application not found."
      });
      return;
    }

    const application = applications[applicationIndex];
    const updatedApplication: FinancingApplication = {
      ...application,
      status: decision,
      decision: {
        decision,
        reviewerName,
        note,
        decidedAt: nowIso()
      },
      updatedAt: nowIso()
    };

    applications[applicationIndex] = updatedApplication;
    await writeApplications(applications);

    response.json({
      data: toClientApplication(updatedApplication)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";

    response.status(400).json({
      error: "Bad Request",
      message
    });
  }
});

if (serveWebApp) {
  if (existsSync(webIndexPath)) {
    const serveSpaFallback: RequestHandler = (request, response, next) => {
      if (!request.accepts("html")) {
        next();
        return;
      }

      response.sendFile(webIndexPath);
    };

    app.use(express.static(webDistPath, { index: false }));
    app.get(/^(?!\/api\/|\/health$).*/, serveSpaFallback);
  } else {
    console.warn(`SERVE_WEB_APP=true but web build was not found at ${webIndexPath}`);
  }
}

app.use((_request, response) => {
  response.status(404).json({
    error: "Not Found",
    message: "The requested demo endpoint does not exist."
  });
});

function getHttpErrorStatus(error: unknown, fallbackStatus = 500) {
  if (!isObject(error)) {
    return fallbackStatus;
  }

  const status = typeof error.statusCode === "number" ? error.statusCode : error.status;

  if (typeof status === "number" && status >= 400 && status < 600) {
    return status;
  }

  return fallbackStatus;
}

function getHttpErrorLabel(error: unknown, statusCode: number) {
  if (isObject(error) && typeof error.errorLabel === "string") {
    return error.errorLabel;
  }

  if (statusCode >= 500) {
    return "Internal Server Error";
  }

  return "Bad Request";
}

function getHttpErrorMessage(error: unknown, statusCode: number) {
  if (isObject(error) && error.type === "entity.parse.failed") {
    return "Request body must be valid JSON.";
  }

  if (statusCode === 413) {
    return "Request body is too large.";
  }

  if (isObject(error) && typeof error.statusCode === "number" && typeof error.message === "string") {
    return error.message;
  }

  if (statusCode >= 500) {
    return "The demo API failed to process the request.";
  }

  if (isObject(error) && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return "The request could not be processed.";
}

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = getHttpErrorStatus(error);

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: getHttpErrorLabel(error, statusCode),
    message: getHttpErrorMessage(error, statusCode)
  });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`KoopCare Fullstack Demo API running on http://localhost:${port}`);
});
