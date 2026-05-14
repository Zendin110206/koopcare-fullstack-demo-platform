import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Database,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DemoSummary = {
  service: string;
  phase: string;
  product_principle: string;
  counts: {
    total_applications: number;
    pending_review: number;
    draft: number;
    approved_demo: number;
  };
  integration: {
    database: string;
    ml_api: string;
    ml_api_base_url: string;
    auth: string;
  };
};

type DemoApplication = {
  id: string;
  applicantName: string;
  requestedAmount: number;
  tenorMonths: number;
  purpose: string;
  status: string;
  aiRecommendation: string;
  riskLevel: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5002";

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

export function App() {
  const [activeView, setActiveView] = useState<"user" | "admin" | "system">("user");
  const [summary, setSummary] = useState<DemoSummary | null>(null);
  const [applications, setApplications] = useState<DemoApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState(8000000);
  const [draftTenor, setDraftTenor] = useState(10);

  async function loadDemoData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [summaryResponse, applicationsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/demo/summary`),
        fetch(`${apiBaseUrl}/api/v1/demo/applications`)
      ]);

      if (!summaryResponse.ok || !applicationsResponse.ok) {
        throw new Error("The demo API returned an unsuccessful response.");
      }

      const summaryData = (await summaryResponse.json()) as DemoSummary;
      const applicationsData = (await applicationsResponse.json()) as {
        data: DemoApplication[];
      };

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
    if (draftTenor <= 0) {
      return 0;
    }

    return Math.round(draftAmount / draftTenor);
  }, [draftAmount, draftTenor]);

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
          caption="Demo records"
        />
        <MetricCard
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label="Pending Review"
          value={summary?.counts.pending_review ?? "-"}
          caption="Officer queue"
        />
        <MetricCard
          icon={<Database aria-hidden="true" size={20} />}
          label="Database"
          value={summary?.integration.database ?? "loading"}
          caption="Progress 03 target"
        />
        <MetricCard
          icon={<Sparkles aria-hidden="true" size={20} />}
          label="ML API"
          value={summary?.integration.ml_api ?? "loading"}
          caption="Progress 06 target"
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
          <span>{errorMessage} Check that the API is running on {apiBaseUrl}.</span>
        </section>
      ) : null}

      {activeView === "user" ? (
        <UserApplicationPanel
          amount={draftAmount}
          tenor={draftTenor}
          installment={estimatedInstallment}
          setAmount={setDraftAmount}
          setTenor={setDraftTenor}
        />
      ) : null}

      {activeView === "admin" ? (
        <AdminReviewPanel applications={applications} isLoading={isLoading} />
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
  amount,
  tenor,
  installment,
  setAmount,
  setTenor
}: {
  amount: number;
  tenor: number;
  installment: number;
  setAmount: (value: number) => void;
  setTenor: (value: number) => void;
}) {
  return (
    <section className="workspace-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">User flow</p>
            <h2>Draft financing application</h2>
          </div>
          <span className="pill neutral">Local draft</span>
        </div>

        <div className="form-grid">
          <label>
            Applicant name
            <input defaultValue="Siti Aminah" />
          </label>
          <label>
            Business type
            <select defaultValue="grocery">
              <option value="grocery">Grocery microbusiness</option>
              <option value="tailor">Tailoring service</option>
              <option value="food">Home food production</option>
            </select>
          </label>
          <label>
            Requested amount
            <input
              min={1000000}
              step={500000}
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label>
            Tenor in months
            <input
              min={1}
              max={24}
              type="number"
              value={tenor}
              onChange={(event) => setTenor(Number(event.target.value))}
            />
          </label>
          <label className="full-span">
            Financing purpose
            <textarea defaultValue="Working capital for additional grocery inventory before the next market cycle." />
          </label>
        </div>

        <button className="primary-action" type="button">
          <ArrowRight aria-hidden="true" size={18} />
          Prepare Application
        </button>
      </article>

      <aside className="panel side-panel">
        <p className="eyebrow">Preview</p>
        <h2>{currencyFormatter.format(amount)}</h2>
        <dl className="summary-list">
          <div>
            <dt>Tenor</dt>
            <dd>{tenor} months</dd>
          </div>
          <div>
            <dt>Estimated base installment</dt>
            <dd>{currencyFormatter.format(installment)}</dd>
          </div>
          <div>
            <dt>Next checkpoint</dt>
            <dd>Persist to database</dd>
          </div>
        </dl>
        <div className="notice">
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>This panel is ready for Progress 04. Submission is intentionally disabled until API persistence exists.</span>
        </div>
      </aside>
    </section>
  );
}

function AdminReviewPanel({
  applications,
  isLoading
}: {
  applications: DemoApplication[];
  isLoading: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Admin flow</p>
          <h2>Application review queue</h2>
        </div>
        <span className="pill">Demo API</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Applicant</th>
              <th>Amount</th>
              <th>Tenor</th>
              <th>Status</th>
              <th>AI State</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading demo applications...</td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.id}</td>
                  <td>{application.applicantName}</td>
                  <td>{currencyFormatter.format(application.requestedAmount)}</td>
                  <td>{application.tenorMonths} months</td>
                  <td>{formatStatus(application.status)}</td>
                  <td>{formatStatus(application.aiRecommendation)}</td>
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
            <dt>Database</dt>
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
        </dl>
      </article>

      <aside className="panel side-panel">
        <p className="eyebrow">Governance</p>
        <h2>AI recommends. Officers decide.</h2>
        <p className="body-copy">
          The demo keeps ML inference behind the API backend. The UI must present risk signals as decision support,
          not as automatic approval or rejection.
        </p>
      </aside>
    </section>
  );
}
