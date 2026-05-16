import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type DemoSummary = {
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
  integration: {
    database: string;
    ml_api: string;
    ml_api_base_url: string;
    ml_scoring_mode: "optional_fallback" | "strict_ml";
    web_app: "served_by_api" | "separate_web_server";
    web_dist_available: boolean;
    auth: string;
  };
};

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

type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

type FinancingApplication = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

type ApplicationFormState = {
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

type ViewKey = "home" | "apply" | "status" | "admin" | "system";
type StatusFilter = "ALL" | ApplicationStatus;
type ActionState = { id: string; kind: "score" | "decision" } | null;
type DecisionDraft = {
  decision: "APPROVED" | "REJECTED";
  reviewerName: string;
  note: string;
};

type MlFeatureMapRow = {
  requestField: string;
  source: string;
  mapping: string;
  modelColumns: string;
};

type DerivedFeatureRow = {
  modelColumn: string;
  formula: string;
  reason: string;
};

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredBaseUrl === "string") {
    return configuredBaseUrl.trim().replace(/\/$/, "");
  }

  return import.meta.env.DEV ? "http://localhost:5002" : "";
}

const apiBaseUrl = resolveApiBaseUrl();
const apiDisplayUrl = apiBaseUrl.length > 0 ? apiBaseUrl : "Same origin";
const moneyRules = {
  monthlyIncome: {
    min: 500000,
    max: 100000000,
    step: 100000
  },
  requestedAmount: {
    min: 500000,
    max: 100000000,
    step: 500000
  }
} as const;

const initialForm: ApplicationFormState = {
  applicantName: "Siti Aminah",
  phoneNumber: "081234567001",
  gender: "F",
  age: 36,
  businessType: "Grocery microbusiness",
  monthlyIncome: 6500000,
  requestedAmount: 8000000,
  tenorMonths: 10,
  purpose: "Working capital for additional grocery inventory before the next market cycle.",
  yearsInBusiness: 4,
  existingLoanCount: 0,
  familyMembers: 4,
  children: 2,
  hasCollateral: true
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1
});

const views: Array<{ key: ViewKey; label: string; icon: ReactNode }> = [
  { key: "home", label: "Overview", icon: <Home aria-hidden="true" size={17} /> },
  { key: "apply", label: "Apply", icon: <UserRound aria-hidden="true" size={17} /> },
  { key: "status", label: "Status", icon: <FileCheck2 aria-hidden="true" size={17} /> },
  { key: "admin", label: "Admin", icon: <LayoutDashboard aria-hidden="true" size={17} /> },
  { key: "system", label: "System", icon: <Database aria-hidden="true" size={17} /> }
];

const mlFeatureMapRows: MlFeatureMapRow[] = [
  {
    requestField: "code_gender",
    source: "gender",
    mapping: "Direct mapping from member form.",
    modelColumns: "CODE_GENDER"
  },
  {
    requestField: "name_income_type",
    source: "Backend default",
    mapping: "Fixed to Working for this portfolio demo.",
    modelColumns: "NAME_INCOME_TYPE"
  },
  {
    requestField: "name_education_type",
    source: "Backend default",
    mapping: "Fixed to Secondary / secondary special until the public form collects education.",
    modelColumns: "NAME_EDUCATION_TYPE"
  },
  {
    requestField: "name_family_status",
    source: "familyMembers",
    mapping: "More than one family member becomes Married; otherwise Single / not married.",
    modelColumns: "NAME_FAMILY_STATUS"
  },
  {
    requestField: "occupation_type",
    source: "Backend default",
    mapping: "Fixed to Laborers until the public form collects occupation.",
    modelColumns: "OCCUPATION_TYPE"
  },
  {
    requestField: "flag_own_car",
    source: "Backend default",
    mapping: "Fixed to N because the current KoopCare form does not collect car ownership.",
    modelColumns: "FLAG_OWN_CAR"
  },
  {
    requestField: "flag_own_realty",
    source: "hasCollateral",
    mapping: "Collateral is treated as property/realty ownership signal for the prototype contract.",
    modelColumns: "FLAG_OWN_REALTY"
  },
  {
    requestField: "cnt_children",
    source: "children",
    mapping: "Direct mapping from member form.",
    modelColumns: "CNT_CHILDREN"
  },
  {
    requestField: "cnt_fam_members",
    source: "familyMembers",
    mapping: "Direct mapping from member form.",
    modelColumns: "CNT_FAM_MEMBERS"
  },
  {
    requestField: "amt_income_total",
    source: "monthlyIncome",
    mapping: "Monthly cooperative income is sent as total income for this demo contract.",
    modelColumns: "AMT_INCOME_TOTAL, DEBT_TO_INCOME"
  },
  {
    requestField: "amt_credit",
    source: "requestedAmount",
    mapping: "Requested financing amount.",
    modelColumns: "AMT_CREDIT, DEBT_TO_INCOME, PAYMENT_RATE"
  },
  {
    requestField: "amt_annuity",
    source: "requestedAmount, tenorMonths",
    mapping: "Calculated as requestedAmount / tenorMonths, with minimum value 1.",
    modelColumns: "AMT_ANNUITY, PAYMENT_RATE"
  },
  {
    requestField: "amt_goods_price",
    source: "requestedAmount",
    mapping: "Mirrors requestedAmount because the demo does not separate goods price from financing amount.",
    modelColumns: "AMT_GOODS_PRICE"
  },
  {
    requestField: "days_birth",
    source: "age",
    mapping: "Calculated as -round(age * 365.25). Used only to derive AGE_YEARS.",
    modelColumns: "AGE_YEARS"
  },
  {
    requestField: "days_employed",
    source: "yearsInBusiness",
    mapping: "Calculated as -round(yearsInBusiness * 365.25).",
    modelColumns: "DAYS_EMPLOYED, DAYS_EMPLOYED_ANOM"
  },
  {
    requestField: "days_last_phone_change",
    source: "Backend default",
    mapping: "Fixed to -365 until the public form collects phone-change history.",
    modelColumns: "DAYS_LAST_PHONE_CHANGE"
  },
  {
    requestField: "ext_source_1",
    source: "hasCollateral",
    mapping: "0.62 when collateral exists, otherwise 0.48.",
    modelColumns: "EXT_SOURCE_1, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  },
  {
    requestField: "ext_source_2",
    source: "yearsInBusiness",
    mapping: "clamp(0.42 + yearsInBusiness * 0.025, 0.25, 0.85).",
    modelColumns: "EXT_SOURCE_2, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  },
  {
    requestField: "ext_source_3",
    source: "existingLoanCount",
    mapping: "clamp(0.58 - existingLoanCount * 0.04, 0.25, 0.8).",
    modelColumns: "EXT_SOURCE_3, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  }
];

const derivedFeatureRows: DerivedFeatureRow[] = [
  {
    modelColumn: "AGE_YEARS",
    formula: "abs(days_birth) / 365",
    reason: "The model uses age in years instead of raw negative birth-day offset."
  },
  {
    modelColumn: "DAYS_EMPLOYED_ANOM",
    formula: "days_employed == 365243 ? 1 : 0",
    reason: "Keeps the Home Credit anomaly flag explicit before replacing the anomaly with missing value."
  },
  {
    modelColumn: "EXT_SOURCE_MEAN",
    formula: "mean(ext_source_1, ext_source_2, ext_source_3)",
    reason: "Summarizes external/proxy score strength."
  },
  {
    modelColumn: "EXT_SOURCE_MIN",
    formula: "min(ext_source_1, ext_source_2, ext_source_3)",
    reason: "Keeps the weakest external/proxy signal visible to the model."
  },
  {
    modelColumn: "EXT_SOURCE_PROD",
    formula: "ext_source_1 * ext_source_2 * ext_source_3",
    reason: "Captures combined strength across all external/proxy scores."
  },
  {
    modelColumn: "DEBT_TO_INCOME",
    formula: "amt_credit / (amt_income_total + 1)",
    reason: "Measures requested financing size relative to income."
  },
  {
    modelColumn: "PAYMENT_RATE",
    formula: "amt_annuity / (amt_credit + 1)",
    reason: "Measures installment burden relative to requested financing."
  }
];

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function statusTone(status: ApplicationStatus) {
  if (status === "APPROVED") {
    return "positive";
  }

  if (status === "REJECTED") {
    return "danger";
  }

  if (status === "UNDER_REVIEW") {
    return "warning";
  }

  return "neutral";
}

function riskTone(risk?: AiAssessment["riskLevel"]) {
  if (risk === "LOW") {
    return "positive";
  }

  if (risk === "HIGH") {
    return "danger";
  }

  if (risk === "MEDIUM") {
    return "warning";
  }

  return "neutral";
}

function recommendationTone(recommendation?: AiAssessment["aiRecommendation"]) {
  if (!recommendation) {
    return "neutral";
  }

  return recommendation === "LAYAK" ? "positive" : "danger";
}

function sourceTone(source?: AiAssessment["source"]) {
  return source === "ml_api" ? "positive" : "warning";
}

function formatAssessmentSource(source?: AiAssessment["source"]) {
  if (source === "ml_api") {
    return "Trained ML API";
  }

  if (source === "demo_rule_based_fallback") {
    return "Fallback active";
  }

  return "Not scored";
}

function formatScoringMode(mode?: DemoSummary["integration"]["ml_scoring_mode"]) {
  if (mode === "strict_ml") {
    return "Strict ML";
  }

  return "Fallback allowed";
}

function formatMlIntegration(value?: string) {
  if (value === "strict_ml_required") {
    return "Strict required";
  }

  if (value === "optional_with_fallback") {
    return "Optional fallback";
  }

  return value ?? "loading";
}

function formatStorageMode(value?: string) {
  if (value === "json_file_storage") {
    return "JSON file";
  }

  return value ?? "loading";
}

function formatWebAppMode(value?: DemoSummary["integration"]["web_app"]) {
  if (value === "served_by_api") {
    return "Single public service";
  }

  if (value === "separate_web_server") {
    return "Separate local server";
  }

  return "loading";
}

function isLocalHostname(hostname?: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1";
}

function isPublicBrowserRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.protocol.startsWith("http") && !isLocalHostname(window.location.hostname);
}

function isLocalServiceUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return isLocalHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

function formatMlApiTargetCaption(value?: string) {
  if (!value) {
    return "Checking target";
  }

  if (isPublicBrowserRuntime() && isLocalServiceUrl(value)) {
    return "No public ML API configured yet";
  }

  return value;
}

function formatScoringModeCaption(summary: DemoSummary | null) {
  if (summary?.integration.ml_api === "ready") {
    return "Trained scoring available; fallback stays labeled if needed";
  }

  if (summary?.integration.ml_scoring_mode === "strict_ml") {
    return "Requests fail clearly if the ML API is unavailable";
  }

  return "Fallback remains labeled until trained scoring is reachable";
}

function fallbackScoringMessage(summary: DemoSummary | null) {
  const mlApiBaseUrl = summary?.integration.ml_api_base_url;

  if (isPublicBrowserRuntime() && isLocalServiceUrl(mlApiBaseUrl)) {
    return "The trained Python MLOps API is not deployed or reachable from this public service yet, so this public demo is using clearly labeled fallback scoring. Deploy the MLOps API and set ML_API_BASE_URL on Railway to activate the trained model path.";
  }

  return `The Python MLOps API is not currently returning scores, so this workflow demo is using clearly labeled fallback scoring. Start or connect the MLOps API at ${mlApiBaseUrl ?? "the configured ML API URL"} to activate the trained model path.`;
}

function formatAuthMode(value?: string) {
  if (value === "demo_mode") {
    return "Demo mode";
  }

  return value ?? "loading";
}

function normalizeMoneyValue(
  value: number,
  rule: {
    min: number;
    max: number;
    step: number;
  }
) {
  if (!Number.isFinite(value)) {
    return rule.min;
  }

  const clamped = Math.min(Math.max(Math.round(value), rule.min), rule.max);

  return Math.round(clamped / rule.step) * rule.step;
}

function formatMoneyHint(rule: { min: number; max: number; step: number }) {
  return `${currencyFormatter.format(rule.min)} to ${currencyFormatter.format(rule.max)}, increments of ${currencyFormatter.format(rule.step)}.`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [summary, setSummary] = useState<DemoSummary | null>(null);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusLookupQuery, setStatusLookupQuery] = useState("");
  const [form, setForm] = useState<ApplicationFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadDemoData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [summaryData, applicationsData] = await Promise.all([
        fetchJson<DemoSummary>(`${apiBaseUrl}/api/v1/demo/summary`),
        fetchJson<{ data: FinancingApplication[] }>(`${apiBaseUrl}/api/v1/applications`)
      ]);

      setSummary(summaryData);
      setApplications(applicationsData.data);
      setSelectedApplicationId((current) => current ?? applicationsData.data[0]?.id ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load demo data.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDemoData();
  }, []);

  const estimatedInstallment = useMemo(() => {
    if (form.tenorMonths <= 0) {
      return 0;
    }

    return Math.round(form.requestedAmount / form.tenorMonths);
  }, [form.requestedAmount, form.tenorMonths]);

  const affordabilityRatio = useMemo(() => {
    if (form.monthlyIncome <= 0) {
      return 0;
    }

    return estimatedInstallment / form.monthlyIncome;
  }, [estimatedInstallment, form.monthlyIncome]);

  const selectedApplication =
    applications.find((application) => application.id === selectedApplicationId) ?? applications[0] ?? null;

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === "ALL" || application.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        application.id.toLowerCase().includes(normalizedSearch) ||
        application.applicantName.toLowerCase().includes(normalizedSearch) ||
        application.businessType.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [applications, searchQuery, statusFilter]);

  const riskSummary = useMemo(() => {
    return {
      low: applications.filter((application) => application.aiAssessment?.riskLevel === "LOW").length,
      medium: applications.filter((application) => application.aiAssessment?.riskLevel === "MEDIUM").length,
      high: applications.filter((application) => application.aiAssessment?.riskLevel === "HIGH").length
    };
  }, [applications]);

  const averageEligibility = useMemo(() => {
    const scored = applications.filter((application) => application.aiAssessment);

    if (scored.length === 0) {
      return 0;
    }

    return Math.round(
      scored.reduce((total, application) => total + (application.aiAssessment?.eligibilityScore ?? 0), 0) /
        scored.length
    );
  }, [applications]);

  function updateForm<Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function submitApplication() {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(`${apiBaseUrl}/api/v1/applications`, {
        method: "POST",
        body: JSON.stringify(form)
      });

      setApplications((current) => [response.data, ...current.filter((item) => item.id !== response.data.id)]);
      setSelectedApplicationId(response.data.id);
      setStatusLookupQuery(response.data.id);
      setSuccessMessage(`Application ${response.data.id} submitted. The member status tracker is ready.`);
      setActiveView("status");
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function scoreApplication(id: string) {
    setActionState({ id, kind: "score" });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(`${apiBaseUrl}/api/v1/applications/${id}/score`, {
        method: "POST"
      });

      setApplications((current) => current.map((item) => (item.id === id ? response.data : item)));
      setSelectedApplicationId(response.data.id);
      setSuccessMessage(`Application ${id} has a refreshed AI assessment.`);
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to score application.";
      setErrorMessage(message);
    } finally {
      setActionState(null);
    }
  }

  async function decideApplication(id: string, decision: "APPROVED" | "REJECTED", reviewerName: string, note: string) {
    setActionState({ id, kind: "decision" });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(
        `${apiBaseUrl}/api/v1/applications/${id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({
            decision,
            reviewerName: reviewerName.trim(),
            note: note.trim()
          })
        }
      );

      setApplications((current) => current.map((item) => (item.id === id ? response.data : item)));
      setSelectedApplicationId(response.data.id);
      setSuccessMessage(`Application ${id} marked as ${formatStatus(decision)}.`);
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save decision.";
      setErrorMessage(message);
    } finally {
      setActionState(null);
    }
  }

  return (
    <main className="app-shell">
      <TopNavigation
        activeView={activeView}
        isLoading={isLoading}
        onRefresh={() => void loadDemoData()}
        onViewChange={setActiveView}
      />

      {errorMessage ? (
        <section className="toast error" role="alert">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{errorMessage}</span>
        </section>
      ) : null}

      {successMessage ? (
        <section className="toast success" role="status">
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>{successMessage}</span>
        </section>
      ) : null}

      {activeView === "home" ? (
        <HomeView
          averageEligibility={averageEligibility}
          riskSummary={riskSummary}
          summary={summary}
          onOpenAdmin={() => setActiveView("admin")}
          onStartApplication={() => setActiveView("apply")}
        />
      ) : null}

      {activeView === "apply" ? (
        <ApplyView
          affordabilityRatio={affordabilityRatio}
          form={form}
          installment={estimatedInstallment}
          isSubmitting={isSubmitting}
          onSubmit={() => void submitApplication()}
          updateForm={updateForm}
        />
      ) : null}

      {activeView === "status" ? (
        <StatusView
          applications={applications}
          isLoading={isLoading}
          query={statusLookupQuery}
          onOpenApply={() => setActiveView("apply")}
          onQueryChange={setStatusLookupQuery}
        />
      ) : null}

      {activeView === "admin" ? (
        <AdminView
          applications={applications}
          actionState={actionState}
          filteredApplications={filteredApplications}
          isLoading={isLoading}
          riskSummary={riskSummary}
          searchQuery={searchQuery}
          selectedApplication={selectedApplication}
          statusFilter={statusFilter}
          summary={summary}
          onDecide={(id, decision, reviewerName, note) => void decideApplication(id, decision, reviewerName, note)}
          onScore={(id) => void scoreApplication(id)}
          onSearchChange={setSearchQuery}
          onSelectApplication={setSelectedApplicationId}
          onStatusFilterChange={setStatusFilter}
        />
      ) : null}

      {activeView === "system" ? <SystemView apiBaseUrl={apiDisplayUrl} isLoading={isLoading} summary={summary} /> : null}
    </main>
  );
}

function TopNavigation({
  activeView,
  isLoading,
  onRefresh,
  onViewChange
}: {
  activeView: ViewKey;
  isLoading: boolean;
  onRefresh: () => void;
  onViewChange: (view: ViewKey) => void;
}) {
  return (
    <header className="topbar">
      <button className="brand-mark" type="button" onClick={() => onViewChange("home")}>
        <span className="brand-logo">
          <Building2 aria-hidden="true" size={20} />
        </span>
        <span>
          <strong>KoopCare</strong>
          <small>Fullstack Demo</small>
        </span>
      </button>

      <nav className="nav-tabs" aria-label="Primary navigation">
        {views.map((item) => (
          <button
            className={activeView === item.key ? "active" : ""}
            key={item.key}
            type="button"
            onClick={() => onViewChange(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <button className="utility-button" disabled={isLoading} type="button" onClick={onRefresh}>
        <RefreshCw aria-hidden="true" size={17} />
        Refresh
      </button>
    </header>
  );
}

function HomeView({
  averageEligibility,
  riskSummary,
  summary,
  onOpenAdmin,
  onStartApplication
}: {
  averageEligibility: number;
  riskSummary: { low: number; medium: number; high: number };
  summary: DemoSummary | null;
  onOpenAdmin: () => void;
  onStartApplication: () => void;
}) {
  return (
    <section className="view-stack">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI-assisted cooperative financing</p>
          <h1>KoopCare helps members apply and helps officers decide with clearer risk signals.</h1>
          <p className="hero-lede">
            A clean local demo for the core KoopCare workflow: members submit financing requests, the backend calls the
            ML scoring service, and cooperative officers keep the final decision.
          </p>
          <div className="hero-actions">
            <button className="primary-action large" type="button" onClick={onStartApplication}>
              Start Member Application
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button className="secondary-action large" type="button" onClick={onOpenAdmin}>
              Open Admin Workspace
              <LayoutDashboard aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="hero-proof">
            <ProofPill label="Backend-owned AI calls" />
            <ProofPill label="Human final decision" />
            <ProofPill label="Local MVP ready" />
          </div>
        </div>

        <div className="hero-product" aria-label="KoopCare product snapshot">
          <div className="snapshot-top">
            <div>
              <span>Officer review</span>
              <strong>{summary?.counts.under_review ?? 0} active cases</strong>
            </div>
            <span className="live-dot">Live demo</span>
          </div>
          <div className="snapshot-score">
            <Gauge aria-hidden="true" size={24} />
            <div>
              <span>Average eligibility</span>
              <strong>{averageEligibility || 0}/100</strong>
            </div>
          </div>
          <div className="snapshot-grid">
            <MiniMetric label="Low risk" value={riskSummary.low} tone="positive" />
            <MiniMetric label="Medium" value={riskSummary.medium} tone="warning" />
            <MiniMetric label="High risk" value={riskSummary.high} tone="danger" />
          </div>
          <div className="snapshot-flow">
            <span>Member Form</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>API</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>ML</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>Officer</span>
          </div>
        </div>
      </section>

      <section className="metrics-row" aria-label="Product metrics">
        <MetricTile
          icon={<FileText aria-hidden="true" size={20} />}
          label="Applications"
          value={summary?.counts.total_applications ?? "-"}
          caption="Stored in local MVP"
        />
        <MetricTile
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label="Under Review"
          value={summary?.counts.under_review ?? "-"}
          caption="Officer queue"
        />
        <MetricTile
          icon={<Sparkles aria-hidden="true" size={20} />}
          label="Scored"
          value={summary?.counts.scored ?? "-"}
          caption="AI assessment created"
        />
        <MetricTile
          icon={<Activity aria-hidden="true" size={20} />}
          label="Decision Principle"
          value="Human"
          caption="AI recommends only"
        />
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>One product path, two clear workspaces.</h2>
        </div>
        <div className="workflow-grid">
          <WorkflowCard
            icon={<UserRound aria-hidden="true" size={22} />}
            title="Member onboarding"
            copy="A member starts from a friendly application flow, fills business and financing details, then submits the request."
          />
          <WorkflowCard
            icon={<Sparkles aria-hidden="true" size={22} />}
            title="AI assessment"
            copy="The backend maps the request into the MLOps API contract and returns recommendation, risk, confidence, and model metadata."
          />
          <WorkflowCard
            icon={<ShieldCheck aria-hidden="true" size={22} />}
            title="Officer decision"
            copy="Admin review shows the queue, detail panel, AI signal, and controlled approve/reject actions for the final decision."
          />
        </div>
      </section>
    </section>
  );
}

function ApplyView({
  affordabilityRatio,
  form,
  installment,
  isSubmitting,
  onSubmit,
  updateForm
}: {
  affordabilityRatio: number;
  form: ApplicationFormState;
  installment: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  updateForm: <Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) => void;
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const affordabilityTone = affordabilityRatio <= 0.3 ? "positive" : affordabilityRatio <= 0.5 ? "warning" : "danger";
  const affordabilityLabel =
    affordabilityRatio <= 0.3 ? "Healthy" : affordabilityRatio <= 0.5 ? "Needs review" : "High pressure";

  function updateAndCloseReview<Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) {
    setIsReviewOpen(false);
    updateForm(key, value);
  }

  function normalizeMoneyField(key: "monthlyIncome" | "requestedAmount") {
    const normalized = normalizeMoneyValue(form[key], moneyRules[key]);

    if (normalized !== form[key]) {
      updateAndCloseReview(key, normalized);
    }
  }

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Member portal</p>
          <h1>Apply for cooperative financing</h1>
          <p>
            The demo keeps the form intentionally simple while still collecting enough structured information for the
            backend scoring workflow.
          </p>
        </div>
        <div className="stepper" aria-label="Application steps">
          <StepBadge active label="Profile" number="1" />
          <StepBadge active label="Financing" number="2" />
          <StepBadge label="Officer Review" number="3" />
        </div>
      </section>

      <section className="application-layout">
        <form
          className="form-surface"
          onSubmit={(event) => {
            event.preventDefault();
            setIsReviewOpen(true);
          }}
        >
          <FormSection
            description="Basic member details used for identification and model feature mapping."
            eyebrow="Step 1"
            title="Applicant profile"
          >
            <Field label="Applicant name">
              <input
                required
                value={form.applicantName}
                onChange={(event) => updateAndCloseReview("applicantName", event.target.value)}
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                value={form.phoneNumber}
                onChange={(event) => updateAndCloseReview("phoneNumber", event.target.value)}
              />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(event) => updateAndCloseReview("gender", event.target.value as "M" | "F")}>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </Field>
            <Field label="Age">
              <input
                min={18}
                max={75}
                required
                type="number"
                value={form.age}
                onChange={(event) => updateAndCloseReview("age", Number(event.target.value))}
              />
            </Field>
          </FormSection>

          <FormSection
            description="Business stability and household size help the demo estimate risk and repayment capacity."
            eyebrow="Step 2"
            title="Business capacity"
          >
            <Field label="Business type">
              <select value={form.businessType} onChange={(event) => updateAndCloseReview("businessType", event.target.value)}>
                <option value="Grocery microbusiness">Grocery microbusiness</option>
                <option value="Equipment repair service">Equipment repair service</option>
                <option value="Home food production">Home food production</option>
                <option value="Tailoring service">Tailoring service</option>
              </select>
            </Field>
            <Field label="Years in business">
              <input
                min={0}
                max={60}
                required
                type="number"
                value={form.yearsInBusiness}
                onChange={(event) => updateAndCloseReview("yearsInBusiness", Number(event.target.value))}
              />
            </Field>
            <Field label="Family members">
              <input
                min={1}
                max={20}
                required
                type="number"
                value={form.familyMembers}
                onChange={(event) => updateAndCloseReview("familyMembers", Number(event.target.value))}
              />
            </Field>
            <Field label="Children">
              <input
                min={0}
                max={15}
                required
                type="number"
                value={form.children}
                onChange={(event) => updateAndCloseReview("children", Number(event.target.value))}
              />
            </Field>
          </FormSection>

          <FormSection
            description="The backend uses these values to calculate affordability and build the ML request payload."
            eyebrow="Step 3"
            title="Financing request"
          >
            <Field label="Monthly income">
              <input
                inputMode="numeric"
                min={moneyRules.monthlyIncome.min}
                max={moneyRules.monthlyIncome.max}
                required
                step={moneyRules.monthlyIncome.step}
                type="number"
                value={form.monthlyIncome}
                onChange={(event) => updateAndCloseReview("monthlyIncome", Number(event.target.value))}
                onBlur={() => normalizeMoneyField("monthlyIncome")}
              />
              <small className="field-hint">{formatMoneyHint(moneyRules.monthlyIncome)}</small>
            </Field>
            <Field label="Requested amount">
              <input
                inputMode="numeric"
                min={moneyRules.requestedAmount.min}
                max={moneyRules.requestedAmount.max}
                required
                step={moneyRules.requestedAmount.step}
                type="number"
                value={form.requestedAmount}
                onChange={(event) => updateAndCloseReview("requestedAmount", Number(event.target.value))}
                onBlur={() => normalizeMoneyField("requestedAmount")}
              />
              <small className="field-hint">{formatMoneyHint(moneyRules.requestedAmount)}</small>
            </Field>
            <Field label="Tenor in months">
              <input
                min={1}
                max={36}
                required
                type="number"
                value={form.tenorMonths}
                onChange={(event) => updateAndCloseReview("tenorMonths", Number(event.target.value))}
              />
            </Field>
            <Field label="Existing loans">
              <input
                min={0}
                max={20}
                required
                type="number"
                value={form.existingLoanCount}
                onChange={(event) => updateAndCloseReview("existingLoanCount", Number(event.target.value))}
              />
            </Field>
            <Field label="Collateral">
              <select
                value={String(form.hasCollateral)}
                onChange={(event) => updateAndCloseReview("hasCollateral", event.target.value === "true")}
              >
                <option value="true">Available</option>
                <option value="false">Not available</option>
              </select>
            </Field>
            <Field label="Financing purpose" wide>
              <textarea
                required
                value={form.purpose}
                onChange={(event) => updateAndCloseReview("purpose", event.target.value)}
              />
            </Field>
          </FormSection>

          {isReviewOpen ? (
            <section className="submit-review-panel">
              <div className="submit-review-heading">
                <div>
                  <p className="eyebrow">Final check</p>
                  <h2>Review before sending to officer workspace</h2>
                </div>
                <Badge tone={affordabilityTone}>{affordabilityLabel}</Badge>
              </div>
              <div className="review-grid">
                <ReviewItem label="Applicant" value={form.applicantName} />
                <ReviewItem label="Business" value={form.businessType} />
                <ReviewItem label="Requested" value={currencyFormatter.format(form.requestedAmount)} />
                <ReviewItem label="Base installment" value={currencyFormatter.format(installment)} />
                <ReviewItem label="Affordability" value={formatPercent(affordabilityRatio)} />
                <ReviewItem label="Collateral" value={form.hasCollateral ? "Available" : "Not available"} />
              </div>
              <p className="review-note">
                After confirmation, the backend stores this request, calls the MLOps scoring API, and sends the case to
                the admin workspace for final human review.
              </p>
              <div className="submit-review-actions">
                <button className="secondary-action" disabled={isSubmitting} type="button" onClick={() => setIsReviewOpen(false)}>
                  Back to edit
                </button>
                <button className="primary-action" disabled={isSubmitting} type="button" onClick={onSubmit}>
                  <ClipboardCheck aria-hidden="true" size={18} />
                  {isSubmitting ? "Submitting and scoring..." : "Confirm and Submit"}
                </button>
              </div>
            </section>
          ) : null}

          {!isReviewOpen ? (
            <div className="form-actions">
              <button className="primary-action submit-action" disabled={isSubmitting} type="submit">
                <ClipboardCheck aria-hidden="true" size={18} />
                Review Application
              </button>
            </div>
          ) : null}
        </form>

        <aside className="application-summary">
          <div className="summary-hero">
            <span>Requested financing</span>
            <strong>{currencyFormatter.format(form.requestedAmount)}</strong>
            <small>{form.tenorMonths} month tenor</small>
          </div>
          <div className="summary-grid">
            <MiniMetric label="Monthly income" value={compactNumberFormatter.format(form.monthlyIncome)} />
            <MiniMetric label="Base installment" value={compactNumberFormatter.format(installment)} />
            <MiniMetric label="Affordability" value={formatPercent(affordabilityRatio)} tone={affordabilityTone} />
            <MiniMetric label="Collateral" value={form.hasCollateral ? "Yes" : "No"} />
          </div>
          <div className="insight-panel">
            <Gauge aria-hidden="true" size={22} />
            <div>
              <strong>What happens after submit?</strong>
              <p>
                The API stores the request, calls the ML scoring service, then sends the application to the admin review
                workspace. AI never makes the final financing decision.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}

function StatusView({
  applications,
  isLoading,
  query,
  onOpenApply,
  onQueryChange
}: {
  applications: FinancingApplication[];
  isLoading: boolean;
  query: string;
  onOpenApply: () => void;
  onQueryChange: (value: string) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = applications.filter((application) => {
    if (normalizedQuery.length === 0) {
      return true;
    }

    return (
      application.id.toLowerCase().includes(normalizedQuery) ||
      application.phoneNumber.toLowerCase().includes(normalizedQuery) ||
      application.applicantName.toLowerCase().includes(normalizedQuery)
    );
  });
  const visibleApplications = normalizedQuery.length > 0 ? matches : applications.slice(0, 4);
  const selectedApplication = visibleApplications[0] ?? null;

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">Member status</p>
          <h1>Track a financing application</h1>
          <p>
            Members can look up the current review state after submitting an application. Officers still own the final
            approval or rejection decision.
          </p>
        </div>
        <button className="primary-action large" type="button" onClick={onOpenApply}>
          New Application
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>

      <section className="status-layout">
        <aside className="status-search-panel">
          <label className="search-box status-search">
            <Search aria-hidden="true" size={17} />
            <input
              placeholder="Search by application ID, phone, or name"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>

          <div className="status-result-list">
            {isLoading ? <p className="empty-copy">Loading application status...</p> : null}
            {!isLoading && visibleApplications.length === 0 ? (
              <p className="empty-copy">No application matches this lookup.</p>
            ) : null}
            {!isLoading
              ? visibleApplications.map((application) => (
                  <article className="status-result-card" key={application.id}>
                    <div>
                      <strong>{application.applicantName}</strong>
                      <span>{application.id}</span>
                    </div>
                    <Badge tone={statusTone(application.status)}>{formatStatus(application.status)}</Badge>
                  </article>
                ))
              : null}
          </div>
        </aside>

        {selectedApplication ? (
          <article className="member-status-panel">
            <div className="status-case-heading">
              <div>
                <p className="eyebrow">Current case</p>
                <h2>{selectedApplication.applicantName}</h2>
                <span>{selectedApplication.id}</span>
              </div>
              <Badge tone={statusTone(selectedApplication.status)}>{formatStatus(selectedApplication.status)}</Badge>
            </div>

            <div className="status-timeline" aria-label="Application status timeline">
              <StatusStep
                state="complete"
                title="Submitted"
                copy="The backend has stored the financing request."
              />
              <StatusStep
                state={selectedApplication.status === "SUBMITTED" ? "current" : "complete"}
                title="Officer review"
                copy="The case is ready for cooperative officer review."
              />
              <StatusStep
                state={selectedApplication.decision ? "complete" : "waiting"}
                title="Final decision"
                copy={
                  selectedApplication.decision
                    ? `${formatStatus(selectedApplication.decision.decision)} by ${selectedApplication.decision.reviewerName}.`
                    : "Waiting for the officer to save a final decision."
                }
              />
            </div>

            <div className="status-summary-grid">
              <MiniMetric label="Requested" value={selectedApplication.requestedAmountFormatted} />
              <MiniMetric label="Tenor" value={`${selectedApplication.tenorMonths} months`} />
              <MiniMetric
                label="AI signal"
                value={selectedApplication.aiAssessment?.aiRecommendation ?? "Pending"}
                tone={recommendationTone(selectedApplication.aiAssessment?.aiRecommendation)}
              />
              <MiniMetric
                label="Eligibility"
                value={selectedApplication.aiAssessment ? `${selectedApplication.aiAssessment.eligibilityScore}/100` : "-"}
              />
            </div>

            {selectedApplication.decision ? (
              <div className="decision-note">
                <strong>Officer note</strong>
                <span>
                  {formatStatus(selectedApplication.decision.decision)} by {selectedApplication.decision.reviewerName}
                </span>
                <p>{selectedApplication.decision.note}</p>
              </div>
            ) : (
              <div className="status-waiting-note">
                <ShieldCheck aria-hidden="true" size={18} />
                <p>AI has no final authority here. The member status updates after an officer saves a decision.</p>
              </div>
            )}
          </article>
        ) : (
          <article className="member-status-panel empty">
            <FileCheck2 aria-hidden="true" size={28} />
            <strong>No status selected</strong>
            <p>Submit a new application or search an existing application ID.</p>
          </article>
        )}
      </section>
    </section>
  );
}

function StatusStep({ copy, state, title }: { copy: string; state: "complete" | "current" | "waiting"; title: string }) {
  return (
    <div className={`status-step ${state}`}>
      <span>{state === "complete" ? <CheckCircle2 aria-hidden="true" size={16} /> : <FileCheck2 aria-hidden="true" size={16} />}</span>
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function AdminView({
  applications,
  actionState,
  filteredApplications,
  isLoading,
  riskSummary,
  searchQuery,
  selectedApplication,
  statusFilter,
  summary,
  onDecide,
  onScore,
  onSearchChange,
  onSelectApplication,
  onStatusFilterChange
}: {
  applications: FinancingApplication[];
  actionState: ActionState;
  filteredApplications: FinancingApplication[];
  isLoading: boolean;
  riskSummary: { low: number; medium: number; high: number };
  searchQuery: string;
  selectedApplication: FinancingApplication | null;
  statusFilter: StatusFilter;
  summary: DemoSummary | null;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED", reviewerName: string, note: string) => void;
  onScore: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectApplication: (id: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  const scoredByMlApi = applications.filter((application) => application.aiAssessment?.source === "ml_api").length;
  const scoredByFallback = applications.filter(
    (application) => application.aiAssessment?.source === "demo_rule_based_fallback"
  ).length;
  const isFallbackActive = scoredByFallback > 0 && scoredByMlApi === 0;
  const hasMixedScoring = scoredByFallback > 0 && scoredByMlApi > 0;
  const isStrictMlMode = summary?.integration.ml_scoring_mode === "strict_ml";

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <span className="avatar">KC</span>
          <div>
            <strong>KoopCare Admin</strong>
            <small>Officer review console</small>
          </div>
        </div>
        <div className="sidebar-metrics">
          <SidebarMetric label="Total" value={summary?.counts.total_applications ?? applications.length} />
          <SidebarMetric label="Review" value={summary?.counts.under_review ?? 0} />
          <SidebarMetric label="Approved" value={summary?.counts.approved ?? 0} />
          <SidebarMetric label="Rejected" value={summary?.counts.rejected ?? 0} />
        </div>
        <div className="risk-stack" aria-label="Risk distribution">
          <div>
            <span>Low</span>
            <strong>{riskSummary.low}</strong>
          </div>
          <div>
            <span>Medium</span>
            <strong>{riskSummary.medium}</strong>
          </div>
          <div>
            <span>High</span>
            <strong>{riskSummary.high}</strong>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>Application Review</h1>
            <p>Prioritize, inspect AI signals, rescore when needed, and keep the officer as final decision maker.</p>
          </div>
        </div>

        <section className={`ml-status ${isFallbackActive || hasMixedScoring ? "warning" : "positive"}`} aria-label="ML model status">
          {isFallbackActive || hasMixedScoring ? (
            <AlertTriangle aria-hidden="true" size={20} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={20} />
          )}
          <div>
            <strong>
              {isStrictMlMode
                ? "Strict ML mode is enabled"
                : isFallbackActive
                ? "Fallback scoring is active"
                : hasMixedScoring
                  ? "Mixed scoring sources"
                  : "Trained ML scoring ready when service responds"}
            </strong>
            <p>
              {isStrictMlMode
                ? "The backend will require the Python MLOps API for scoring. If the model service is unavailable, new scoring requests return a clear service-unavailable error instead of using fallback."
                : isFallbackActive
                ? fallbackScoringMessage(summary)
                : hasMixedScoring
                  ? "Some records were scored while the trained model was unavailable. Refresh a selected score after the MLOps API is running to replace fallback assessments."
                : "Applications can show trained MLOps scores when the Python service responds. Fallback remains labeled if the service is unavailable."}
            </p>
          </div>
          <Badge tone={isFallbackActive || hasMixedScoring ? "warning" : "positive"}>
            {scoredByMlApi} ML / {scoredByFallback} fallback
          </Badge>
        </section>

        <div className="admin-toolbar">
          <label className="search-box">
            <Search aria-hidden="true" size={17} />
            <input
              placeholder="Search applicant, business, or application ID"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <div className="filter-group" aria-label="Status filters">
            {(["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as StatusFilter[]).map((status) => (
              <button
                className={statusFilter === status ? "active" : ""}
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
              >
                {status === "ALL" ? "All" : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-content">
          <ApplicationTable
            applications={filteredApplications}
            isLoading={isLoading}
            selectedApplicationId={selectedApplication?.id ?? null}
            onSelectApplication={onSelectApplication}
          />
          <ApplicationDetailPanel
            actionState={actionState}
            application={selectedApplication}
            onDecide={onDecide}
            onScore={onScore}
          />
        </div>
      </section>
    </section>
  );
}

function ApplicationTable({
  applications,
  isLoading,
  selectedApplicationId,
  onSelectApplication
}: {
  applications: FinancingApplication[];
  isLoading: boolean;
  selectedApplicationId: string | null;
  onSelectApplication: (id: string) => void;
}) {
  return (
    <section className="queue-panel">
      <div className="table-header">
        <div>
          <p className="eyebrow">Queue</p>
          <h2>Financing Applications</h2>
        </div>
        <span>{applications.length} records</span>
      </div>
      <div className="application-list">
        {isLoading ? <p className="empty-copy">Loading applications...</p> : null}
        {!isLoading && applications.length === 0 ? (
          <p className="empty-copy">No applications match the current filter.</p>
        ) : null}
        {!isLoading
          ? applications.map((application) => (
              <button
                className={selectedApplicationId === application.id ? "application-card selected" : "application-card"}
                key={application.id}
                type="button"
                onClick={() => onSelectApplication(application.id)}
              >
                <div className="application-card-main">
                  <strong>{application.applicantName}</strong>
                  <span>{application.id}</span>
                  <small>{application.businessType}</small>
                </div>
                <div className="application-card-finance">
                  <span>Requested</span>
                  <strong>{application.requestedAmountFormatted}</strong>
                  <small>{application.tenorMonths} months</small>
                </div>
                <div className="application-card-signals">
                  <Badge tone={statusTone(application.status)}>{formatStatus(application.status)}</Badge>
                  <Badge tone={riskTone(application.aiAssessment?.riskLevel)}>
                    {application.aiAssessment?.riskLevel ?? "Pending"}
                  </Badge>
                  <span className="score-chip">
                    {application.aiAssessment ? `${application.aiAssessment.eligibilityScore}/100` : "Not scored"}
                  </span>
                </div>
              </button>
            ))
          : null}
      </div>
    </section>
  );
}

function ApplicationDetailPanel({
  actionState,
  application,
  onDecide,
  onScore
}: {
  actionState: ActionState;
  application: FinancingApplication | null;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED", reviewerName: string, note: string) => void;
  onScore: (id: string) => void;
}) {
  const [decisionDraft, setDecisionDraft] = useState<DecisionDraft | null>(null);

  useEffect(() => {
    setDecisionDraft(null);
  }, [application?.id]);

  if (!application) {
    return (
      <aside className="detail-panel empty">
        <FileCheck2 aria-hidden="true" size={28} />
        <strong>Select an application</strong>
        <p>Choose a row from the queue to inspect profile, AI assessment, and decision controls.</p>
      </aside>
    );
  }

  const assessment = application.aiAssessment;
  const isScoring = actionState?.kind === "score" && actionState.id === application.id;
  const isDeciding = actionState?.kind === "decision" && actionState.id === application.id;
  const defaultReviewerName = application.decision?.reviewerName ?? "Demo Officer";
  const canSubmitDecision =
    decisionDraft !== null && decisionDraft.reviewerName.trim().length > 0 && decisionDraft.note.trim().length >= 12;

  function openDecisionDraft(decision: "APPROVED" | "REJECTED") {
    setDecisionDraft({
      decision,
      reviewerName: defaultReviewerName,
      note: ""
    });
  }

  function updateDecisionDraft<Key extends keyof DecisionDraft>(key: Key, value: DecisionDraft[Key]) {
    setDecisionDraft((current) =>
      current
        ? {
            ...current,
            [key]: value
          }
        : current
    );
  }

  async function saveDecision() {
    if (!application || !decisionDraft || !canSubmitDecision) {
      return;
    }

    await onDecide(application.id, decisionDraft.decision, decisionDraft.reviewerName, decisionDraft.note);
    setDecisionDraft(null);
  }

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Selected case</p>
          <h2>{application.applicantName}</h2>
          <span>{application.id}</span>
        </div>
        <Badge tone={statusTone(application.status)}>{formatStatus(application.status)}</Badge>
      </div>

      {assessment?.source === "demo_rule_based_fallback" ? (
        <section className="model-warning">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>Trained model is not active for this score.</strong>
            <p>The app is using the labeled fallback path because the Python MLOps API did not return a score.</p>
          </div>
        </section>
      ) : null}

      <div className="ai-card">
        <div className="ai-card-top">
          <Sparkles aria-hidden="true" size={22} />
          <div>
            <span>AI recommendation</span>
            <strong>{assessment?.aiRecommendation ?? "Not scored"}</strong>
          </div>
          {assessment ? <Badge tone={sourceTone(assessment.source)}>{formatAssessmentSource(assessment.source)}</Badge> : null}
        </div>
        <div className="eligibility-meter">
          <div
            className="score-ring"
            aria-label={`Eligibility score ${assessment?.eligibilityScore ?? 0} out of 100`}
            style={{ "--score": `${assessment?.eligibilityScore ?? 0}%` } as CSSProperties}
          >
            <strong>{assessment?.eligibilityScore ?? 0}</strong>
          </div>
          <div className="eligibility-copy">
            <span>Eligibility score</span>
            <strong>{assessment ? `${assessment.eligibilityScore}/100` : "Not scored"}</strong>
            <p>Higher is better. The officer still saves the final financing decision.</p>
          </div>
        </div>
        <div className="ai-grid">
          <MiniMetric label="Risk" value={assessment?.riskLevel ?? "Pending"} tone={riskTone(assessment?.riskLevel)} />
          <MiniMetric label="Default risk" value={assessment ? formatPercent(assessment.probDefault) : "-"} />
          <MiniMetric label="Confidence" value={assessment ? formatPercent(assessment.confidence) : "-"} />
          <MiniMetric label="Model" value={assessment?.modelName ?? "-"} />
        </div>
        <p>{assessment?.note ?? "Run scoring to generate an AI assessment for this application."}</p>
      </div>

      <div className="detail-section">
        <h3>Applicant profile</h3>
        <div className="profile-grid">
          <ProfileItem label="Business" value={application.businessType} />
          <ProfileItem label="Phone" value={application.phoneNumber} />
          <ProfileItem label="Age" value={`${application.age} years`} />
          <ProfileItem label="Family" value={`${application.familyMembers} members`} />
          <ProfileItem label="Children" value={String(application.children)} />
          <ProfileItem label="Collateral" value={application.hasCollateral ? "Available" : "Not available"} />
          <ProfileItem label="Income" value={currencyFormatter.format(application.monthlyIncome)} />
          <ProfileItem label="Requested" value={application.requestedAmountFormatted} />
        </div>
      </div>

      <div className="detail-section">
        <h3>Purpose</h3>
        <p className="purpose-copy">{application.purpose}</p>
      </div>

      {application.decision ? (
        <div className="decision-note">
          <strong>Final decision saved</strong>
          <span>
            {formatStatus(application.decision.decision)} by {application.decision.reviewerName}
          </span>
          <p>{application.decision.note}</p>
        </div>
      ) : null}

      {decisionDraft ? (
        <section className={decisionDraft.decision === "APPROVED" ? "confirm-box approve" : "confirm-box reject"}>
          <div>
            <strong>Confirm {formatStatus(decisionDraft.decision)}?</strong>
            <p>
              Write the officer reason before saving. This note becomes the human audit trail for {application.applicantName}.
            </p>
          </div>
          <div className="decision-form-grid">
            <label className="decision-field">
              <span>Reviewer name</span>
              <input
                value={decisionDraft.reviewerName}
                onChange={(event) => updateDecisionDraft("reviewerName", event.target.value)}
              />
            </label>
            <label className="decision-field wide">
              <span>Decision reason</span>
              <textarea
                placeholder={
                  decisionDraft.decision === "APPROVED"
                    ? "Example: Business cashflow, collateral, and repayment capacity were verified by the officer."
                    : "Example: Requested amount is too high compared with verified repayment capacity."
                }
                value={decisionDraft.note}
                onChange={(event) => updateDecisionDraft("note", event.target.value)}
              />
            </label>
            <p className="decision-helper">Minimum 12 characters. The backend will reject empty notes.</p>
          </div>
          <div className="confirm-actions">
            <button className="secondary-action" type="button" onClick={() => setDecisionDraft(null)}>
              Cancel
            </button>
            <button
              className={decisionDraft.decision === "APPROVED" ? "decision-button approve" : "decision-button reject"}
              disabled={isDeciding || !canSubmitDecision}
              type="button"
              onClick={() => void saveDecision()}
            >
              {isDeciding ? "Saving..." : `Confirm ${formatStatus(decisionDraft.decision)}`}
            </button>
          </div>
        </section>
      ) : null}

      <div className="decision-actions">
        <button className="secondary-action" disabled={isScoring || isDeciding} type="button" onClick={() => onScore(application.id)}>
          <Sparkles aria-hidden="true" size={17} />
          {isScoring ? "Scoring..." : "Refresh Score"}
        </button>
        <button
          className="decision-button approve"
          disabled={application.status === "APPROVED" || isScoring || isDeciding}
          type="button"
          onClick={() => openDecisionDraft("APPROVED")}
        >
          <CheckCircle2 aria-hidden="true" size={17} />
          Approve
        </button>
        <button
          className="decision-button reject"
          disabled={application.status === "REJECTED" || isScoring || isDeciding}
          type="button"
          onClick={() => openDecisionDraft("REJECTED")}
        >
          <XCircle aria-hidden="true" size={17} />
          Reject
        </button>
      </div>
    </aside>
  );
}

function SystemView({
  apiBaseUrl,
  isLoading,
  summary
}: {
  apiBaseUrl: string;
  isLoading: boolean;
  summary: DemoSummary | null;
}) {
  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">System readiness</p>
          <h1>Backend-owned ML integration</h1>
          <p>The product frontend talks to the Express API. The API owns validation, storage, and ML service calls.</p>
        </div>
        <Badge tone={isLoading ? "warning" : "positive"}>{isLoading ? "Loading" : "Loaded"}</Badge>
      </section>

      <section className="system-grid">
        <MetricTile icon={<Database aria-hidden="true" size={20} />} label="Storage" value={formatStorageMode(summary?.integration.database)} caption="Current MVP persistence" />
        <MetricTile icon={<Sparkles aria-hidden="true" size={20} />} label="ML API" value={formatMlIntegration(summary?.integration.ml_api)} caption={formatMlApiTargetCaption(summary?.integration.ml_api_base_url)} />
        <MetricTile icon={<ShieldCheck aria-hidden="true" size={20} />} label="Scoring Mode" value={formatScoringMode(summary?.integration.ml_scoring_mode)} caption={formatScoringModeCaption(summary)} />
        <MetricTile icon={<LayoutDashboard aria-hidden="true" size={20} />} label="Web App" value={formatWebAppMode(summary?.integration.web_app)} caption={summary?.integration.web_dist_available ? "Build output available" : "Development mode"} />
        <MetricTile icon={<ShieldCheck aria-hidden="true" size={20} />} label="Auth" value={formatAuthMode(summary?.integration.auth)} caption="Demo mode for now" />
        <MetricTile icon={<Activity aria-hidden="true" size={20} />} label="API URL" value={apiBaseUrl === "Same origin" ? "Same origin" : "Local API"} caption={apiBaseUrl} />
      </section>

      <section className="architecture-panel">
        <div>
          <p className="eyebrow">Architecture</p>
          <h2>Safe product boundary</h2>
          <p>
            The browser never calls the ML service directly. This keeps mapping, validation, storage, and business rules
            inside the backend where they can be reviewed and audited.
          </p>
        </div>
        <div className="architecture-flow">
          <FlowNode icon={<UserRound aria-hidden="true" size={18} />} label="Member Web" />
          <FlowArrow />
          <FlowNode icon={<Building2 aria-hidden="true" size={18} />} label="Express API" />
          <FlowArrow />
          <FlowNode icon={<Sparkles aria-hidden="true" size={18} />} label="MLOps API" />
          <FlowArrow />
          <FlowNode icon={<ShieldCheck aria-hidden="true" size={18} />} label="Officer Review" />
        </div>
      </section>

      <section className="feature-map-panel">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">Feature mapping</p>
            <h2>From 19 request fields to 25 model columns</h2>
            <p>
              The member form stays product-friendly. The backend translates it into the project 13 API request, then the
              FastAPI service builds the exact XGBoost feature columns expected by `best_model.pkl`.
            </p>
          </div>
          <Badge tone="positive">Public ML path verified</Badge>
        </div>

        <div className="feature-count-strip" aria-label="Feature mapping counts">
          <div>
            <span>Product form</span>
            <strong>14 fields</strong>
            <small>member/admin workflow data</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>MLOps request</span>
            <strong>19 fields</strong>
            <small>payload sent to project 13</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>Model frame</span>
            <strong>25 columns</strong>
            <small>XGBoost artifact contract</small>
          </div>
        </div>

        <div className="mapping-note">
          <FileText aria-hidden="true" size={19} />
          <p>
            Identity and workflow fields such as applicant name, phone number, business type, and purpose are stored for
            review, but they are not sent directly to the model. Some model fields are temporary prototype defaults until
            KoopCare retrains a BMT-native model.
          </p>
        </div>

        <div className="mapping-table-wrap">
          <table className="mapping-table">
            <caption>Project 14 backend payload mapping into project 13 request fields</caption>
            <thead>
              <tr>
                <th>MLOps request field</th>
                <th>Source in project 14</th>
                <th>Mapping rule</th>
                <th>Project 13 model column impact</th>
              </tr>
            </thead>
            <tbody>
              {mlFeatureMapRows.map((row) => (
                <tr key={row.requestField}>
                  <td>
                    <code>{row.requestField}</code>
                  </td>
                  <td>{row.source}</td>
                  <td>{row.mapping}</td>
                  <td>{row.modelColumns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="feature-map-panel compact">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">Derived columns</p>
            <h2>Why 19 becomes 25</h2>
            <p>
              Project 13 keeps most raw request fields, drops raw `DAYS_BIRTH` after converting it to age, and adds seven
              engineered columns before the model predicts default risk.
            </p>
          </div>
          <Badge tone="neutral">7 engineered columns</Badge>
        </div>

        <div className="derived-grid">
          {derivedFeatureRows.map((row) => (
            <article key={row.modelColumn}>
              <strong>{row.modelColumn}</strong>
              <code>{row.formula}</code>
              <p>{row.reason}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function MetricTile({
  caption,
  icon,
  label,
  value
}: {
  caption: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className="metric-tile">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}

function MiniMetric({ label, tone, value }: { label: string; tone?: string; value: string | number }) {
  return (
    <div className={`mini-metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowCard({ copy, icon, title }: { copy: string; icon: ReactNode; title: string }) {
  return (
    <article className="workflow-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function ProofPill({ label }: { label: string }) {
  return (
    <span className="proof-pill">
      <CheckCircle2 aria-hidden="true" size={15} />
      {label}
    </span>
  );
}

function StepBadge({ active, label, number }: { active?: boolean; label: string; number: string }) {
  return (
    <div className={`step-badge ${active ? "active" : ""}`}>
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function Field({ children, label, wide }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function FormSection({
  children,
  description,
  eyebrow,
  title
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function SidebarMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="sidebar-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FlowNode({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flow-node">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function FlowArrow() {
  return <ChevronRight aria-hidden="true" className="flow-arrow" size={18} />;
}
