export type DemoSummary = {
  service: string;
  phase: string;
  product_principle: string;
  counts: {
    total_applications: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
    scored: number;
  };
  metrics: {
    average_eligibility: number;
    audit_events: number;
    risk_summary: {
      low: number;
      medium: number;
      high: number;
    };
  };
  integration: {
    database: string;
    ml_api: string;
    ml_api_base_url: string;
    ml_scoring_mode: "optional_fallback" | "strict_ml";
    web_app: "served_by_api" | "separate_web_server";
    web_dist_available: boolean;
    auth: "demo_role_gate" | "demo_mode" | string;
  };
};

export type AiAssessment = {
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

export type AuditEventKind = "application_submitted" | "ai_scored" | "ai_rescored" | "officer_decision_saved" | "record_migrated";
export type AuditActorRole = "member" | "admin" | "system";
export type AuditEvent = {
  id: string;
  kind: AuditEventKind;
  label: string;
  actorRole: AuditActorRole;
  actorName: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, boolean | number | string | null>;
};

export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type FinancingApplication = {
  id: string;
  memberAccessCode: string;
  applicantName: string;
  phoneNumber: string;
  gender: "M" | "F";
  age: number;
  businessType: string;
  monthlyIncome: number;
  requestedAmount: number;
  requestedAmountFormatted: string;
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
    decision: "APPROVED" | "REJECTED";
    reviewerName: string;
    note: string;
    decidedAt: string;
  } | null;
  auditTrail: AuditEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ApplicationFormState = {
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
};

export type AuthRole = "member" | "admin";
export type AuthSession = {
  role: AuthRole;
  displayName: string;
  issuedAt: string;
  expiresAt: string;
};
export type StoredAuthSession = {
  session: AuthSession;
  token: string;
};

export type ViewKey = "home" | "login" | "apply" | "status" | "admin" | "system";
export type AppLanguage = "en" | "id";
export type LocalizedText = Record<AppLanguage, string>;
export type StatusFilter = "ALL" | ApplicationStatus;
export type ActionState = { id: string; kind: "score" | "decision" } | null;

export type DecisionDraft = {
  decision: "APPROVED" | "REJECTED";
  reviewerName: string;
  note: string;
};

export type MlFeatureMapRow = {
  requestField: string;
  source: string;
  mapping: string;
  modelColumns: string;
};

export type DerivedFeatureRow = {
  modelColumn: string;
  formula: string;
  reason: string;
};
