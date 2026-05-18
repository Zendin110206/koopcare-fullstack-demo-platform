import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { authenticateDemoLogin, getDemoAuthSummary, readDemoSession, requireDemoAuth } from "./auth.js";

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

type AuditEventKind = "application_submitted" | "ai_scored" | "ai_rescored" | "officer_decision_saved" | "record_migrated";
type AuditActorRole = "member" | "admin" | "system";
type AuditEvent = {
  id: string;
  kind: AuditEventKind;
  label: string;
  actorRole: AuditActorRole;
  actorName: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, boolean | number | string | null>;
};

type FinancingApplication = {
  id: string;
  memberAccessCode: string;
  ownerUserId: string;
  ownerRole: AuditActorRole;
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
  auditTrail: AuditEvent[];
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

type ReadinessCheck = {
  name: string;
  status: "ok" | "failed" | "skipped";
  message: string;
  details?: Record<string, number | string | boolean>;
};

type MlEndpointProbe = {
  body?: unknown;
  error?: string;
  ok: boolean;
  path: string;
  statusCode?: number;
};

const app = express();

const port = parseEnvNumber(process.env.PORT ?? process.env.API_PORT, 5002);
const environment = process.env.APP_ENV ?? "development";
const mlApiBaseUrl = process.env.ML_API_BASE_URL ?? "http://127.0.0.1:8000";
const mlApiTimeoutMs = parseEnvNumber(process.env.ML_API_TIMEOUT_MS, 5000);
const mlStatusTimeoutMs = Math.min(parseEnvNumber(process.env.ML_STATUS_TIMEOUT_MS, 1500), mlApiTimeoutMs);
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

function isLocalHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

function isLocalMlApiTarget() {
  try {
    return isLocalHostname(new URL(mlApiBaseUrl).hostname);
  } catch {
    return false;
  }
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

function createMemberAccessCode() {
  return `KC-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function getLegacyOwnerUserId(application: Pick<FinancingApplication, "id">) {
  return `legacy-json-owner-${application.id.toLowerCase()}`;
}

function createAuditEvent({
  actorName,
  actorRole,
  createdAt = nowIso(),
  kind,
  label,
  message,
  metadata
}: {
  actorName: string;
  actorRole: AuditActorRole;
  createdAt?: string;
  kind: AuditEventKind;
  label: string;
  message: string;
  metadata?: Record<string, boolean | number | string | null>;
}): AuditEvent {
  return {
    id: `AUD-${randomUUID().slice(0, 10).toUpperCase()}`,
    kind,
    label,
    actorRole,
    actorName,
    message,
    createdAt,
    ...(metadata ? { metadata } : {})
  };
}

function createSubmissionAuditEvent(application: Pick<FinancingApplication, "applicantName" | "id" | "createdAt" | "requestedAmount" | "tenorMonths">) {
  return createAuditEvent({
    actorName: application.applicantName,
    actorRole: "member",
    createdAt: application.createdAt,
    kind: "application_submitted",
    label: "Application submitted",
    message: `${application.applicantName} submitted financing application ${application.id}.`,
    metadata: {
      requestedAmount: application.requestedAmount,
      tenorMonths: application.tenorMonths
    }
  });
}

function createScoringAuditEvent(application: Pick<FinancingApplication, "id">, assessment: AiAssessment, kind: "ai_scored" | "ai_rescored") {
  return createAuditEvent({
    actorName: kind === "ai_scored" ? "KoopCare API" : "Admin reviewer",
    actorRole: kind === "ai_scored" ? "system" : "admin",
    createdAt: assessment.createdAt,
    kind,
    label: kind === "ai_scored" ? "AI assessment created" : "AI assessment refreshed",
    message: `${assessment.modelName} returned ${assessment.aiRecommendation} with ${assessment.riskLevel} risk for ${application.id}.`,
    metadata: {
      confidence: assessment.confidence,
      eligibilityScore: assessment.eligibilityScore,
      modelName: assessment.modelName,
      modelVersion: assessment.modelVersion,
      probDefault: assessment.probDefault,
      source: assessment.source
    }
  });
}

function createDecisionAuditEvent({
  applicationId,
  decision,
  note,
  reviewerName,
  timestamp
}: {
  applicationId: string;
  decision: ApplicationDecision;
  note: string;
  reviewerName: string;
  timestamp: string;
}) {
  return createAuditEvent({
    actorName: reviewerName,
    actorRole: "admin",
    createdAt: timestamp,
    kind: "officer_decision_saved",
    label: "Final decision saved",
    message: `${reviewerName} saved ${decision} decision for ${applicationId}.`,
    metadata: {
      decision,
      note
    }
  });
}

function createSeedApplications(): FinancingApplication[] {
  const timestamp = nowIso();

  return [
    {
      id: "APP-2026-001",
      memberAccessCode: "KC-SEED01",
      ownerUserId: "koopcare-demo-member",
      ownerRole: "member",
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
      auditTrail: [
        createAuditEvent({
          actorName: "Siti Aminah",
          actorRole: "member",
          createdAt: timestamp,
          kind: "application_submitted",
          label: "Application submitted",
          message: "Siti Aminah submitted financing application APP-2026-001.",
          metadata: {
            requestedAmount: 8_000_000,
            tenorMonths: 10
          }
        })
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "APP-2026-002",
      memberAccessCode: "KC-SEED02",
      ownerUserId: "koopcare-demo-member",
      ownerRole: "member",
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
      auditTrail: [
        createAuditEvent({
          actorName: "Budi Santoso",
          actorRole: "member",
          createdAt: timestamp,
          kind: "application_submitted",
          label: "Application submitted",
          message: "Budi Santoso submitted financing application APP-2026-002.",
          metadata: {
            requestedAmount: 12_500_000,
            tenorMonths: 12
          }
        })
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "APP-2026-003",
      memberAccessCode: "KC-SEED03",
      ownerUserId: "koopcare-demo-member",
      ownerRole: "member",
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
      auditTrail: [
        createAuditEvent({
          actorName: "Nur Hidayah",
          actorRole: "member",
          createdAt: timestamp,
          kind: "application_submitted",
          label: "Application submitted",
          message: "Nur Hidayah submitted financing application APP-2026-003.",
          metadata: {
            requestedAmount: 5_000_000,
            tenorMonths: 6
          }
        }),
        createAuditEvent({
          actorName: "KoopCare API",
          actorRole: "system",
          createdAt: timestamp,
          kind: "ai_scored",
          label: "AI assessment created",
          message: "Demo Rule-Based Fallback returned LAYAK with LOW risk for APP-2026-003.",
          metadata: {
            confidence: 0.76,
            eligibilityScore: 76,
            modelName: "Demo Rule-Based Fallback",
            modelVersion: "fallback-v1",
            probDefault: 0.24,
            source: "demo_rule_based_fallback"
          }
        }),
        createAuditEvent({
          actorName: "Admin Demo",
          actorRole: "admin",
          createdAt: timestamp,
          kind: "officer_decision_saved",
          label: "Final decision saved",
          message: "Admin Demo saved APPROVED decision for APP-2026-003.",
          metadata: {
            decision: "APPROVED",
            note: "Approved as seeded demo data."
          }
        })
      ],
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

  const applications = parsed as FinancingApplication[];
  let changed = false;
  const normalizedApplications = applications.map((application) => {
    const auditTrail = Array.isArray(application.auditTrail) ? application.auditTrail : buildMigratedAuditTrail(application);
    const memberAccessCode =
      typeof application.memberAccessCode === "string" && application.memberAccessCode.trim().length > 0
        ? application.memberAccessCode
        : createMemberAccessCode();
    const ownerUserId =
      typeof application.ownerUserId === "string" && application.ownerUserId.trim().length > 0
        ? application.ownerUserId
        : getLegacyOwnerUserId(application);
    const ownerRole = application.ownerRole === "admin" || application.ownerRole === "member" ? application.ownerRole : "member";

    if (
      application.memberAccessCode === memberAccessCode &&
      application.ownerUserId === ownerUserId &&
      application.ownerRole === ownerRole &&
      application.auditTrail === auditTrail
    ) {
      return application;
    }

    changed = true;
    return {
      ...application,
      memberAccessCode,
      ownerRole,
      ownerUserId,
      auditTrail
    };
  });

  if (changed) {
    await writeApplications(normalizedApplications);
  }

  return normalizedApplications;
}

function buildMigratedAuditTrail(application: FinancingApplication): AuditEvent[] {
  const auditTrail = [
    createSubmissionAuditEvent({
      applicantName: application.applicantName,
      createdAt: application.createdAt,
      id: application.id,
      requestedAmount: application.requestedAmount,
      tenorMonths: application.tenorMonths
    })
  ];

  if (application.aiAssessment) {
    auditTrail.push(createScoringAuditEvent(application, application.aiAssessment, "ai_scored"));
  }

  if (application.decision) {
    auditTrail.push(
      createDecisionAuditEvent({
        applicationId: application.id,
        decision: application.decision.decision,
        note: application.decision.note,
        reviewerName: application.decision.reviewerName,
        timestamp: application.decision.decidedAt
      })
    );
  }

  auditTrail.push(
    createAuditEvent({
      actorName: "KoopCare API",
      actorRole: "system",
      createdAt: nowIso(),
      kind: "record_migrated",
      label: "Record normalized",
      message: "Legacy JSON record was normalized with missing demo metadata.",
      metadata: {
        applicationId: application.id
      }
    })
  );

  return auditTrail;
}

async function writeApplications(applications: FinancingApplication[]) {
  await mkdir(path.dirname(dataFilePath), { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(applications, null, 2)}\n`, "utf8");
}

async function checkStorageReadiness(): Promise<ReadinessCheck> {
  try {
    const applications = await readApplications();

    return {
      name: "json_storage",
      status: "ok",
      message: "Application storage is readable.",
      details: {
        applications: applications.length,
        path: dataFilePath
      }
    };
  } catch (error) {
    return {
      name: "json_storage",
      status: "failed",
      message: error instanceof Error ? error.message : "Application storage failed readiness check.",
      details: {
        path: dataFilePath
      }
    };
  }
}

function checkWebBuildReadiness(): ReadinessCheck {
  if (!serveWebApp) {
    return {
      name: "web_build",
      status: "skipped",
      message: "Web build serving is disabled for this runtime.",
      details: {
        serve_web_app: false
      }
    };
  }

  if (existsSync(webIndexPath)) {
    return {
      name: "web_build",
      status: "ok",
      message: "React build is available for API-served public preview.",
      details: {
        index_path: webIndexPath,
        serve_web_app: true
      }
    };
  }

  return {
    name: "web_build",
    status: "failed",
    message: "SERVE_WEB_APP=true but the React build output is missing.",
    details: {
      index_path: webIndexPath,
      serve_web_app: true
    }
  };
}

function checkMlScoringReadiness(): ReadinessCheck {
  return {
    name: "ml_scoring_configuration",
    status: "ok",
    message:
      mlScoringMode === "strict_ml"
        ? "Strict ML mode is configured. Scoring requests require the MLOps API."
        : "Optional fallback mode is configured for demo reliability.",
    details: {
      base_url: mlApiBaseUrl,
      scoring_mode: mlScoringMode,
      timeout_ms: mlApiTimeoutMs
    }
  };
}

async function buildReadinessReport() {
  const checks = [await checkStorageReadiness(), checkWebBuildReadiness(), checkMlScoringReadiness()];
  const ready = checks.every((check) => check.status !== "failed");

  return {
    status: ready ? "ready" : "not_ready",
    service: "KoopCare Fullstack Demo API",
    environment,
    version: "0.3.0",
    checks,
    timestamp: nowIso()
  };
}

async function probeMlEndpoint(pathname: string): Promise<MlEndpointProbe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), mlStatusTimeoutMs);

  try {
    const response = await fetch(`${mlApiBaseUrl}${pathname}`, {
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    });
    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      body,
      ok: response.ok,
      path: pathname,
      statusCode: response.status
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ML API probe failed.",
      ok: false,
      path: pathname
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function buildMlApiStatusReport() {
  const [health, modelInfo] = await Promise.all([probeMlEndpoint("/health"), probeMlEndpoint("/model-info")]);
  const modelInfoBody = isObject(modelInfo.body) ? modelInfo.body : null;
  const modelLoaded = typeof modelInfoBody?.model_loaded === "boolean" ? modelInfoBody.model_loaded : false;
  const artifactStatus = typeof modelInfoBody?.artifact_status === "string" ? modelInfoBody.artifact_status : "unknown";
  const predictionReady = health.ok && modelInfo.ok && modelLoaded && artifactStatus === "available";
  const localTargetWarning = isLocalMlApiTarget()
    ? "ML_API_BASE_URL points to a local address. In public hosting, that address is inside the deployed service container and is not a public MLOps API URL."
    : null;

  return {
    status: predictionReady ? "ready" : health.ok || modelInfo.ok ? "not_ready" : "unreachable",
    prediction_ready: predictionReady,
    integration_status: getMlIntegrationStatus(),
    ml_scoring_mode: mlScoringMode,
    ml_api_base_url: mlApiBaseUrl,
    timeout_ms: mlStatusTimeoutMs,
    local_target_warning: localTargetWarning,
    checks: {
      health,
      model_info: modelInfo
    },
    guidance: predictionReady
      ? "The configured MLOps API reports an available model artifact and is ready for trained scoring."
      : "Fallback scoring may remain active until the MLOps API is reachable and /model-info reports model_loaded=true with artifact_status=available.",
    timestamp: nowIso()
  };
}

function buildApplication(input: CreateApplicationRequest, owner: { role: AuditActorRole; userId: string }): FinancingApplication {
  const timestamp = nowIso();

  return {
    id: `APP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    memberAccessCode: createMemberAccessCode(),
    ownerRole: owner.role,
    ownerUserId: owner.userId,
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
    auditTrail: [],
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

function summarizeApplicationMetrics(applications: FinancingApplication[]) {
  const scoredApplications = applications.filter((item) => item.aiAssessment !== null);

  return {
    average_eligibility:
      scoredApplications.length === 0
        ? 0
        : Math.round(
            scoredApplications.reduce((total, item) => total + (item.aiAssessment?.eligibilityScore ?? 0), 0) /
              scoredApplications.length
          ),
    risk_summary: {
      low: applications.filter((item) => item.aiAssessment?.riskLevel === "LOW").length,
      medium: applications.filter((item) => item.aiAssessment?.riskLevel === "MEDIUM").length,
      high: applications.filter((item) => item.aiAssessment?.riskLevel === "HIGH").length
    },
    audit_events: applications.reduce((total, item) => total + item.auditTrail.length, 0)
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

function getAccessCodeFromRequest(request: Request) {
  const queryValue = request.query.accessCode;

  if (typeof queryValue === "string") {
    return queryValue.trim();
  }

  const headerValue = request.headers["x-koopcare-access-code"];

  if (typeof headerValue === "string") {
    return headerValue.trim();
  }

  return "";
}

function canReadMemberStatus(request: Request, application: FinancingApplication) {
  const session = readDemoSession(request.headers.authorization);

  if (session?.role === "admin") {
    return true;
  }

  if (session?.role === "member" && session.userId === application.ownerUserId) {
    return true;
  }

  return getAccessCodeFromRequest(request).toUpperCase() === application.memberAccessCode.toUpperCase();
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
    auth: getDemoAuthSummary(),
    timestamp: nowIso()
  });
});

app.get("/ready", async (_request, response) => {
  const readiness = await buildReadinessReport();

  response.status(readiness.status === "ready" ? 200 : 503).json(readiness);
});

app.get("/api/v1/demo/summary", async (_request, response) => {
  const applications = await readApplications();

  response.json({
    service: "KoopCare Fullstack Demo API",
    phase: "Runnable MVP demo",
    product_principle: "AI recommends, cooperative officers decide.",
    counts: summarizeApplications(applications),
    metrics: summarizeApplicationMetrics(applications),
    integration: {
      database: "json_file_storage",
      ml_api: getMlIntegrationStatus(),
      ml_api_base_url: mlApiBaseUrl,
      ml_scoring_mode: mlScoringMode,
      web_app: serveWebApp ? "served_by_api" : "separate_web_server",
      web_dist_available: existsSync(webIndexPath),
      auth: getDemoAuthSummary().mode
    }
  });
});

app.post("/api/v1/auth/login", (request, response) => {
  if (!isObject(request.body)) {
    response.status(400).json({
      error: "Bad Request",
      message: "Request body must be an object."
    });
    return;
  }

  const result = authenticateDemoLogin(request.body.role, request.body.password);

  if (!result) {
    response.status(401).json({
      error: "Unauthorized",
      message: "Invalid demo role or password."
    });
    return;
  }

  response.json({
    data: result
  });
});

app.get("/api/v1/auth/session", (request, response) => {
  const session = readDemoSession(request.headers.authorization);

  if (!session) {
    response.status(401).json({
      error: "Unauthorized",
      message: "Demo session is missing or expired."
    });
    return;
  }

  response.json({
    data: {
      session
    }
  });
});

app.get("/api/v1/ml/status", async (_request, response) => {
  response.json(await buildMlApiStatusReport());
});

app.get("/api/v1/demo/applications", requireDemoAuth(["admin"]), async (_request, response) => {
  const applications = await readApplications();

  response.json({
    data: applications.map(toClientApplication)
  });
});

app.get("/api/v1/applications", requireDemoAuth(["admin"]), async (_request, response) => {
  const applications = await readApplications();

  response.json({
    data: applications.map(toClientApplication)
  });
});

app.get("/api/v1/applications/mine", requireDemoAuth(["member"]), async (request, response) => {
  const session = readDemoSession(request.headers.authorization);

  if (!session) {
    response.status(401).json({
      error: "Unauthorized",
      message: "Demo session is missing or expired."
    });
    return;
  }

  const applications = await readApplications();

  response.json({
    data: applications.filter((item) => item.ownerUserId === session.userId).map(toClientApplication)
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

  if (!canReadMemberStatus(request, application)) {
    response.status(401).json({
      error: "Unauthorized",
      message: "Application ID and access code are required to view member status."
    });
    return;
  }

  response.json({
    data: toClientApplication(application)
  });
});

app.post("/api/v1/applications", requireDemoAuth(["member", "admin"]), async (request, response) => {
  try {
    if (!isObject(request.body)) {
      throw new Error("Request body must be an object.");
    }

    const session = readDemoSession(request.headers.authorization);

    if (!session) {
      throw createHttpError(401, "Unauthorized", "Demo login is required for this action.");
    }

    const applications = await readApplications();
    const application = buildApplication(request.body, {
      role: session.role,
      userId: session.userId
    });
    const aiAssessment = await scoreApplication(application);
    const applicationWithScore: FinancingApplication = {
      ...application,
      status: "UNDER_REVIEW",
      aiAssessment,
      auditTrail: [createSubmissionAuditEvent(application), createScoringAuditEvent(application, aiAssessment, "ai_scored")],
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

app.post("/api/v1/applications/:id/score", requireDemoAuth(["admin"]), async (request, response) => {
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
    auditTrail: [...application.auditTrail, createScoringAuditEvent(application, aiAssessment, "ai_rescored")],
    updatedAt: nowIso()
  };

  applications[applicationIndex] = updatedApplication;
  await writeApplications(applications);

  response.json({
    data: toClientApplication(updatedApplication)
  });
});

app.post("/api/v1/applications/:id/decision", requireDemoAuth(["admin"]), async (request, response) => {
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
    const decidedAt = nowIso();
    const updatedApplication: FinancingApplication = {
      ...application,
      status: decision,
      decision: {
        decision,
        reviewerName,
        note,
        decidedAt
      },
      auditTrail: [
        ...application.auditTrail,
        createDecisionAuditEvent({
          applicationId: application.id,
          decision,
          note,
          reviewerName,
          timestamp: decidedAt
        })
      ],
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
