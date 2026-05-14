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
import type { CSSProperties, FormEvent, ReactNode } from "react";
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

type ViewKey = "home" | "apply" | "admin" | "system";
type StatusFilter = "ALL" | ApplicationStatus;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5002";

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
  { key: "admin", label: "Admin", icon: <LayoutDashboard aria-hidden="true" size={17} /> },
  { key: "system", label: "System", icon: <Database aria-hidden="true" size={17} /> }
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
  return recommendation === "LAYAK" ? "positive" : "danger";
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
  const [form, setForm] = useState<ApplicationFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setSuccessMessage(`Application ${response.data.id} submitted and scored for officer review.`);
      setActiveView("admin");
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function scoreApplication(id: string) {
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
    }
  }

  async function decideApplication(id: string, decision: "APPROVED" | "REJECTED") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const note =
      decision === "APPROVED"
        ? "Approved in demo review after officer verification."
        : "Rejected in demo review after officer verification.";

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(
        `${apiBaseUrl}/api/v1/applications/${id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({
            decision,
            reviewerName: "Demo Officer",
            note
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
          onSubmit={(event) => void submitApplication(event)}
          updateForm={updateForm}
        />
      ) : null}

      {activeView === "admin" ? (
        <AdminView
          applications={applications}
          filteredApplications={filteredApplications}
          isLoading={isLoading}
          riskSummary={riskSummary}
          searchQuery={searchQuery}
          selectedApplication={selectedApplication}
          statusFilter={statusFilter}
          summary={summary}
          onDecide={(id, decision) => void decideApplication(id, decision)}
          onScore={(id) => void scoreApplication(id)}
          onSearchChange={setSearchQuery}
          onSelectApplication={setSelectedApplicationId}
          onStatusFilterChange={setStatusFilter}
        />
      ) : null}

      {activeView === "system" ? <SystemView apiBaseUrl={apiBaseUrl} isLoading={isLoading} summary={summary} /> : null}
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateForm: <Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) => void;
}) {
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
        <form className="form-surface" onSubmit={onSubmit}>
          <FormSection
            description="Basic member details used for identification and model feature mapping."
            eyebrow="Step 1"
            title="Applicant profile"
          >
            <Field label="Applicant name">
              <input
                required
                value={form.applicantName}
                onChange={(event) => updateForm("applicantName", event.target.value)}
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                value={form.phoneNumber}
                onChange={(event) => updateForm("phoneNumber", event.target.value)}
              />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(event) => updateForm("gender", event.target.value as "M" | "F")}>
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
                onChange={(event) => updateForm("age", Number(event.target.value))}
              />
            </Field>
          </FormSection>

          <FormSection
            description="Business stability and household size help the demo estimate risk and repayment capacity."
            eyebrow="Step 2"
            title="Business capacity"
          >
            <Field label="Business type">
              <select value={form.businessType} onChange={(event) => updateForm("businessType", event.target.value)}>
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
                onChange={(event) => updateForm("yearsInBusiness", Number(event.target.value))}
              />
            </Field>
            <Field label="Family members">
              <input
                min={1}
                max={20}
                required
                type="number"
                value={form.familyMembers}
                onChange={(event) => updateForm("familyMembers", Number(event.target.value))}
              />
            </Field>
            <Field label="Children">
              <input
                min={0}
                max={15}
                required
                type="number"
                value={form.children}
                onChange={(event) => updateForm("children", Number(event.target.value))}
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
                min={1}
                required
                step={100000}
                type="number"
                value={form.monthlyIncome}
                onChange={(event) => updateForm("monthlyIncome", Number(event.target.value))}
              />
            </Field>
            <Field label="Requested amount">
              <input
                min={500000}
                required
                step={500000}
                type="number"
                value={form.requestedAmount}
                onChange={(event) => updateForm("requestedAmount", Number(event.target.value))}
              />
            </Field>
            <Field label="Tenor in months">
              <input
                min={1}
                max={36}
                required
                type="number"
                value={form.tenorMonths}
                onChange={(event) => updateForm("tenorMonths", Number(event.target.value))}
              />
            </Field>
            <Field label="Existing loans">
              <input
                min={0}
                max={20}
                required
                type="number"
                value={form.existingLoanCount}
                onChange={(event) => updateForm("existingLoanCount", Number(event.target.value))}
              />
            </Field>
            <Field label="Collateral">
              <select
                value={String(form.hasCollateral)}
                onChange={(event) => updateForm("hasCollateral", event.target.value === "true")}
              >
                <option value="true">Available</option>
                <option value="false">Not available</option>
              </select>
            </Field>
            <Field label="Financing purpose" wide>
              <textarea
                required
                value={form.purpose}
                onChange={(event) => updateForm("purpose", event.target.value)}
              />
            </Field>
          </FormSection>

          <button className="primary-action submit-action" disabled={isSubmitting} type="submit">
            <ClipboardCheck aria-hidden="true" size={18} />
            {isSubmitting ? "Submitting and scoring..." : "Submit Application"}
          </button>
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
            <MiniMetric label="Affordability" value={formatPercent(affordabilityRatio)} />
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

function AdminView({
  applications,
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
  filteredApplications: FinancingApplication[];
  isLoading: boolean;
  riskSummary: { low: number; medium: number; high: number };
  searchQuery: string;
  selectedApplication: FinancingApplication | null;
  statusFilter: StatusFilter;
  summary: DemoSummary | null;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED") => void;
  onScore: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectApplication: (id: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
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
          <ApplicationDetailPanel application={selectedApplication} onDecide={onDecide} onScore={onScore} />
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
    <section className="table-panel">
      <div className="table-header">
        <div>
          <p className="eyebrow">Queue</p>
          <h2>Financing Applications</h2>
        </div>
        <span>{applications.length} records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Amount</th>
              <th>Status</th>
              <th>AI</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>Loading applications...</td>
              </tr>
            ) : null}
            {!isLoading && applications.length === 0 ? (
              <tr>
                <td colSpan={5}>No applications match the current filter.</td>
              </tr>
            ) : null}
            {!isLoading
              ? applications.map((application) => (
                  <tr
                    className={selectedApplicationId === application.id ? "selected" : ""}
                    key={application.id}
                    onClick={() => onSelectApplication(application.id)}
                  >
                    <td>
                      <strong>{application.applicantName}</strong>
                      <small>{application.id}</small>
                    </td>
                    <td>
                      <strong>{application.requestedAmountFormatted}</strong>
                      <small>{application.tenorMonths} months</small>
                    </td>
                    <td>
                      <Badge tone={statusTone(application.status)}>{formatStatus(application.status)}</Badge>
                    </td>
                    <td>
                      {application.aiAssessment ? (
                        <>
                          <strong>{application.aiAssessment.eligibilityScore}/100</strong>
                          <small>{application.aiAssessment.aiRecommendation}</small>
                        </>
                      ) : (
                        <small>Not scored</small>
                      )}
                    </td>
                    <td>
                      <Badge tone={riskTone(application.aiAssessment?.riskLevel)}>
                        {application.aiAssessment?.riskLevel ?? "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApplicationDetailPanel({
  application,
  onDecide,
  onScore
}: {
  application: FinancingApplication | null;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED") => void;
  onScore: (id: string) => void;
}) {
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

      <div className="ai-card">
        <div className="ai-card-top">
          <Sparkles aria-hidden="true" size={22} />
          <div>
            <span>AI recommendation</span>
            <strong>{assessment?.aiRecommendation ?? "Not scored"}</strong>
          </div>
          {assessment ? <Badge tone={recommendationTone(assessment.aiRecommendation)}>{assessment.source}</Badge> : null}
        </div>
        <div className="score-ring" style={{ "--score": `${assessment?.eligibilityScore ?? 0}%` } as CSSProperties}>
          <strong>{assessment?.eligibilityScore ?? 0}</strong>
          <span>eligibility</span>
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

      <div className="decision-actions">
        <button className="secondary-action" type="button" onClick={() => onScore(application.id)}>
          <Sparkles aria-hidden="true" size={17} />
          Refresh Score
        </button>
        <button
          className="decision-button approve"
          disabled={application.status === "APPROVED"}
          type="button"
          onClick={() => onDecide(application.id, "APPROVED")}
        >
          <CheckCircle2 aria-hidden="true" size={17} />
          Approve
        </button>
        <button
          className="decision-button reject"
          disabled={application.status === "REJECTED"}
          type="button"
          onClick={() => onDecide(application.id, "REJECTED")}
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
        <MetricTile icon={<Database aria-hidden="true" size={20} />} label="Storage" value={summary?.integration.database ?? "loading"} caption="Current MVP persistence" />
        <MetricTile icon={<Sparkles aria-hidden="true" size={20} />} label="ML API" value={summary?.integration.ml_api ?? "loading"} caption={summary?.integration.ml_api_base_url ?? "Checking target"} />
        <MetricTile icon={<ShieldCheck aria-hidden="true" size={20} />} label="Auth" value={summary?.integration.auth ?? "loading"} caption="Demo mode for now" />
        <MetricTile icon={<Activity aria-hidden="true" size={20} />} label="API URL" value={apiBaseUrl} caption="Frontend configuration" />
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
