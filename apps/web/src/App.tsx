import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle
} from "lucide-react";
import type { FormEvent } from "react";
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
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
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

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
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
  const [activeView, setActiveView] = useState<"user" | "admin" | "system">("user");
  const [summary, setSummary] = useState<DemoSummary | null>(null);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
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
      setSuccessMessage(`Application ${response.data.id} submitted and scored for admin review.`);
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
      setSuccessMessage(`Application ${id} marked as ${formatStatus(decision)}.`);
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save decision.";
      setErrorMessage(message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">KoopCare Fullstack Demo</p>
          <h1>Financing Application Workspace</h1>
        </div>
        <button className="icon-button" type="button" onClick={() => void loadDemoData()}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </header>

      <section className="status-strip" aria-label="System status summary">
        <MetricCard
          icon={<ClipboardList aria-hidden="true" size={20} />}
          label="Applications"
          value={summary?.counts.total_applications ?? "-"}
          caption="Stored demo records"
        />
        <MetricCard
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label="Under Review"
          value={summary?.counts.under_review ?? "-"}
          caption="Officer queue"
        />
        <MetricCard
          icon={<Database aria-hidden="true" size={20} />}
          label="Storage"
          value={summary?.integration.database ?? "loading"}
          caption="JSON file MVP"
        />
        <MetricCard
          icon={<Sparkles aria-hidden="true" size={20} />}
          label="ML API"
          value={summary?.integration.ml_api ?? "loading"}
          caption="Optional fallback"
        />
      </section>

      <nav className="segmented-control" aria-label="Workspace sections">
        <button
          className={activeView === "user" ? "active" : ""}
          type="button"
          onClick={() => setActiveView("user")}
        >
          <UserRound aria-hidden="true" size={17} />
          User Application
        </button>
        <button
          className={activeView === "admin" ? "active" : ""}
          type="button"
          onClick={() => setActiveView("admin")}
        >
          <ShieldCheck aria-hidden="true" size={17} />
          Admin Review
        </button>
        <button
          className={activeView === "system" ? "active" : ""}
          type="button"
          onClick={() => setActiveView("system")}
        >
          <Database aria-hidden="true" size={17} />
          System Status
        </button>
      </nav>

      {errorMessage ? (
        <section className="notice error" role="alert">
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{errorMessage}</span>
        </section>
      ) : null}

      {successMessage ? (
        <section className="notice success" role="status">
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>{successMessage}</span>
        </section>
      ) : null}

      {activeView === "user" ? (
        <UserApplicationPanel
          form={form}
          installment={estimatedInstallment}
          isSubmitting={isSubmitting}
          onSubmit={(event) => void submitApplication(event)}
          updateForm={updateForm}
        />
      ) : null}

      {activeView === "admin" ? (
        <AdminReviewPanel
          applications={applications}
          isLoading={isLoading}
          onScore={(id) => void scoreApplication(id)}
          onDecide={(id, decision) => void decideApplication(id, decision)}
        />
      ) : null}

      {activeView === "system" ? (
        <SystemStatusPanel summary={summary} apiBaseUrl={apiBaseUrl} isLoading={isLoading} />
      ) : null}
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function UserApplicationPanel({
  form,
  installment,
  isSubmitting,
  onSubmit,
  updateForm
}: {
  form: ApplicationFormState;
  installment: number;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateForm: <Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) => void;
}) {
  return (
    <section className="workspace-grid">
      <form className="panel" onSubmit={onSubmit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">User flow</p>
            <h2>Submit financing application</h2>
          </div>
          <span className="pill neutral">MVP form</span>
        </div>

        <div className="form-grid">
          <label>
            Applicant name
            <input
              required
              value={form.applicantName}
              onChange={(event) => updateForm("applicantName", event.target.value)}
            />
          </label>
          <label>
            Phone number
            <input
              required
              value={form.phoneNumber}
              onChange={(event) => updateForm("phoneNumber", event.target.value)}
            />
          </label>
          <label>
            Gender
            <select
              value={form.gender}
              onChange={(event) => updateForm("gender", event.target.value as "M" | "F")}
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </label>
          <label>
            Age
            <input
              min={18}
              max={75}
              required
              type="number"
              value={form.age}
              onChange={(event) => updateForm("age", Number(event.target.value))}
            />
          </label>
          <label>
            Business type
            <select
              value={form.businessType}
              onChange={(event) => updateForm("businessType", event.target.value)}
            >
              <option value="Grocery microbusiness">Grocery microbusiness</option>
              <option value="Equipment repair service">Equipment repair service</option>
              <option value="Home food production">Home food production</option>
              <option value="Tailoring service">Tailoring service</option>
            </select>
          </label>
          <label>
            Years in business
            <input
              min={0}
              max={60}
              required
              type="number"
              value={form.yearsInBusiness}
              onChange={(event) => updateForm("yearsInBusiness", Number(event.target.value))}
            />
          </label>
          <label>
            Monthly income
            <input
              min={1}
              required
              step={100000}
              type="number"
              value={form.monthlyIncome}
              onChange={(event) => updateForm("monthlyIncome", Number(event.target.value))}
            />
          </label>
          <label>
            Requested amount
            <input
              min={500000}
              required
              step={500000}
              type="number"
              value={form.requestedAmount}
              onChange={(event) => updateForm("requestedAmount", Number(event.target.value))}
            />
          </label>
          <label>
            Tenor in months
            <input
              min={1}
              max={36}
              required
              type="number"
              value={form.tenorMonths}
              onChange={(event) => updateForm("tenorMonths", Number(event.target.value))}
            />
          </label>
          <label>
            Existing loans
            <input
              min={0}
              max={20}
              required
              type="number"
              value={form.existingLoanCount}
              onChange={(event) => updateForm("existingLoanCount", Number(event.target.value))}
            />
          </label>
          <label>
            Family members
            <input
              min={1}
              max={20}
              required
              type="number"
              value={form.familyMembers}
              onChange={(event) => updateForm("familyMembers", Number(event.target.value))}
            />
          </label>
          <label>
            Children
            <input
              min={0}
              max={15}
              required
              type="number"
              value={form.children}
              onChange={(event) => updateForm("children", Number(event.target.value))}
            />
          </label>
          <label>
            Collateral
            <select
              value={String(form.hasCollateral)}
              onChange={(event) => updateForm("hasCollateral", event.target.value === "true")}
            >
              <option value="true">Available</option>
              <option value="false">Not available</option>
            </select>
          </label>
          <label className="full-span">
            Financing purpose
            <textarea
              required
              value={form.purpose}
              onChange={(event) => updateForm("purpose", event.target.value)}
            />
          </label>
        </div>

        <button className="primary-action" disabled={isSubmitting} type="submit">
          <ClipboardCheck aria-hidden="true" size={18} />
          {isSubmitting ? "Submitting..." : "Submit and Score Application"}
        </button>
      </form>

      <aside className="panel side-panel">
        <p className="eyebrow">Preview</p>
        <h2>{currencyFormatter.format(form.requestedAmount)}</h2>
        <dl className="summary-list">
          <div>
            <dt>Monthly income</dt>
            <dd>{currencyFormatter.format(form.monthlyIncome)}</dd>
          </div>
          <div>
            <dt>Tenor</dt>
            <dd>{form.tenorMonths} months</dd>
          </div>
          <div>
            <dt>Estimated base installment</dt>
            <dd>{currencyFormatter.format(installment)}</dd>
          </div>
          <div>
            <dt>Collateral</dt>
            <dd>{form.hasCollateral ? "Available" : "Not available"}</dd>
          </div>
        </dl>
        <div className="notice">
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>
            Submission now writes to local JSON storage and immediately creates an AI assessment for officer review.
          </span>
        </div>
      </aside>
    </section>
  );
}

function AdminReviewPanel({
  applications,
  isLoading,
  onScore,
  onDecide
}: {
  applications: FinancingApplication[];
  isLoading: boolean;
  onScore: (id: string) => void;
  onDecide: (id: string, decision: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Admin flow</p>
          <h2>Application review queue</h2>
        </div>
        <span className="pill">Actionable MVP</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Applicant</th>
              <th>Amount</th>
              <th>Status</th>
              <th>AI</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Loading applications...</td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.id}</strong>
                    <small>{application.purpose}</small>
                  </td>
                  <td>
                    <strong>{application.applicantName}</strong>
                    <small>{application.businessType}</small>
                  </td>
                  <td>
                    <strong>{application.requestedAmountFormatted}</strong>
                    <small>{application.tenorMonths} months</small>
                  </td>
                  <td>{formatStatus(application.status)}</td>
                  <td>
                    <strong>{application.aiAssessment?.aiRecommendation ?? "Not scored"}</strong>
                    <small>
                      {application.aiAssessment
                        ? `${application.aiAssessment.eligibilityScore}/100 eligibility`
                        : "Needs scoring"}
                    </small>
                  </td>
                  <td>
                    <strong>{application.aiAssessment?.riskLevel ?? "-"}</strong>
                    <small>
                      {application.aiAssessment
                        ? `${Math.round(application.aiAssessment.probDefault * 100)}% default risk`
                        : "No probability"}
                    </small>
                  </td>
                  <td>
                    <div className="action-row">
                      <button className="small-action" type="button" onClick={() => onScore(application.id)}>
                        <Sparkles aria-hidden="true" size={15} />
                        Score
                      </button>
                      <button
                        className="small-action approve"
                        disabled={application.status === "APPROVED"}
                        type="button"
                        onClick={() => onDecide(application.id, "APPROVED")}
                      >
                        <CheckCircle2 aria-hidden="true" size={15} />
                        Approve
                      </button>
                      <button
                        className="small-action reject"
                        disabled={application.status === "REJECTED"}
                        type="button"
                        onClick={() => onDecide(application.id, "REJECTED")}
                      >
                        <XCircle aria-hidden="true" size={15} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemStatusPanel({
  summary,
  apiBaseUrl,
  isLoading
}: {
  summary: DemoSummary | null;
  apiBaseUrl: string;
  isLoading: boolean;
}) {
  return (
    <section className="workspace-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">System</p>
            <h2>Integration readiness</h2>
          </div>
          <span className="pill neutral">{isLoading ? "Loading" : "Loaded"}</span>
        </div>
        <dl className="summary-list">
          <div>
            <dt>API base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>{summary?.integration.database ?? "loading"}</dd>
          </div>
          <div>
            <dt>ML API</dt>
            <dd>{summary?.integration.ml_api ?? "loading"}</dd>
          </div>
          <div>
            <dt>ML API target</dt>
            <dd>{summary?.integration.ml_api_base_url ?? "loading"}</dd>
          </div>
          <div>
            <dt>Auth</dt>
            <dd>{summary?.integration.auth ?? "loading"}</dd>
          </div>
        </dl>
      </article>

      <aside className="panel side-panel">
        <p className="eyebrow">Governance</p>
        <h2>AI recommends. Officers decide.</h2>
        <p className="body-copy">
          The backend attempts to call the KoopCare MLOps API. If the ML service is unavailable, the demo uses a
          transparent rule-based fallback so the product workflow remains testable.
        </p>
      </aside>
    </section>
  );
}
