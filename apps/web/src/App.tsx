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

import { fetchJson } from "./apiClient";
import { apiBaseUrl, apiDisplayUrl, businessTypeOptions, initialForm, moneyRules } from "./config";
import { homeCopy, systemCopy, systemWorkflowSteps } from "./copy";
import {
  derivedFeatureRows,
  derivedReasonIdByModelColumn,
  featureMappingIdByRequestField,
  featureSourceIdByRequestField,
  mlFeatureMapRows
} from "./featureMapping";
import {
  compactNumberFormatter,
  currencyFormatter,
  fallbackScoringMessage,
  formatAge,
  formatAssessmentSource,
  formatAuthMode,
  formatBusinessType,
  formatCollateral,
  formatGender,
  formatMembers,
  formatMlApiTargetCaption,
  formatMlIntegration,
  formatMoneyHint,
  formatPercent,
  formatRecommendation,
  formatRiskLevel,
  formatScoringMode,
  formatScoringModeCaption,
  formatStatus,
  formatStorageMode,
  formatTenor,
  formatWebAppMode,
  formatYesNo,
  normalizeMoneyValue,
  recommendationTone,
  riskTone,
  sourceTone,
  statusTone,
  t
} from "./formatters";
import type {
  ActionState,
  AppLanguage,
  ApplicationFormState,
  ApplicationStatus,
  DecisionDraft,
  DemoSummary,
  FinancingApplication,
  LocalizedText,
  StatusFilter,
  ViewKey
} from "./types";

const views: Array<{ key: ViewKey; label: LocalizedText; icon: ReactNode }> = [
  { key: "home", label: { en: "Overview", id: "Ringkasan" }, icon: <Home aria-hidden="true" size={17} /> },
  { key: "apply", label: { en: "Apply", id: "Ajukan" }, icon: <UserRound aria-hidden="true" size={17} /> },
  { key: "status", label: { en: "Status", id: "Status" }, icon: <FileCheck2 aria-hidden="true" size={17} /> },
  { key: "admin", label: { en: "Admin", id: "Admin" }, icon: <LayoutDashboard aria-hidden="true" size={17} /> },
  { key: "system", label: { en: "System", id: "Sistem" }, icon: <Database aria-hidden="true" size={17} /> }
];

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [language, setLanguage] = useState<AppLanguage>("id");
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
      setSuccessMessage(
        t(
          language,
          `Application ${response.data.id} submitted. The member status tracker is ready.`,
          `Pengajuan ${response.data.id} berhasil dikirim. Status anggota sudah siap dicek.`
        )
      );
      setActiveView("status");
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to submit application.", "Gagal mengirim pengajuan.");
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
      setSuccessMessage(t(language, `Application ${id} has a refreshed AI assessment.`, `Assessment AI untuk pengajuan ${id} berhasil diperbarui.`));
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to score application.", "Gagal melakukan scoring pengajuan.");
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
      setSuccessMessage(
        t(language, `Application ${id} marked as ${formatStatus(decision)}.`, `Pengajuan ${id} ditandai sebagai ${formatStatus(decision, language)}.`)
      );
      await loadDemoData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to save decision.", "Gagal menyimpan keputusan.");
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
        language={language}
        onLanguageChange={setLanguage}
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
          language={language}
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
          language={language}
          onSubmit={() => void submitApplication()}
          updateForm={updateForm}
        />
      ) : null}

      {activeView === "status" ? (
        <StatusView
          applications={applications}
          isLoading={isLoading}
          language={language}
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
          language={language}
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

      {activeView === "system" ? <SystemView apiBaseUrl={apiDisplayUrl} isLoading={isLoading} language={language} summary={summary} /> : null}
    </main>
  );
}

function TopNavigation({
  activeView,
  isLoading,
  language,
  onLanguageChange,
  onRefresh,
  onViewChange
}: {
  activeView: ViewKey;
  isLoading: boolean;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
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
          <small>{t(language, "Fullstack Demo", "Demo Fullstack")}</small>
        </span>
      </button>

      <nav className="nav-tabs" aria-label={t(language, "Primary navigation", "Navigasi utama")}>
        {views.map((item) => (
          <button
            className={activeView === item.key ? "active" : ""}
            key={item.key}
            type="button"
            onClick={() => onViewChange(item.key)}
          >
            {item.icon}
            {item.label[language]}
          </button>
        ))}
      </nav>

      <div className="language-toggle" aria-label={t(language, "Language selector", "Pilihan bahasa")}>
        {(["id", "en"] as const).map((item) => (
          <button
            aria-pressed={language === item}
            className={language === item ? "active" : ""}
            key={item}
            type="button"
            onClick={() => onLanguageChange(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <button className="utility-button" disabled={isLoading} type="button" onClick={onRefresh}>
        <RefreshCw aria-hidden="true" size={17} />
        {language === "id" ? "Muat ulang" : "Refresh"}
      </button>
    </header>
  );
}

function HomeView({
  averageEligibility,
  language,
  riskSummary,
  summary,
  onOpenAdmin,
  onStartApplication
}: {
  averageEligibility: number;
  language: AppLanguage;
  riskSummary: { low: number; medium: number; high: number };
  summary: DemoSummary | null;
  onOpenAdmin: () => void;
  onStartApplication: () => void;
}) {
  const copy = homeCopy[language];

  return (
    <section className="view-stack">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="hero-lede">{copy.lede}</p>
          <div className="hero-actions">
            <button className="primary-action large" type="button" onClick={onStartApplication}>
              {copy.startApplication}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button className="secondary-action large" type="button" onClick={onOpenAdmin}>
              {copy.openAdmin}
              <LayoutDashboard aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="hero-proof">
            <ProofPill label={copy.proofAi} />
            <ProofPill label={copy.proofHuman} />
            <ProofPill label={copy.proofPublic} />
          </div>
        </div>

        <div className="hero-product" aria-label="KoopCare product snapshot">
          <div className="snapshot-top">
            <div>
              <span>{copy.officerReview}</span>
              <strong>
                {summary?.counts.under_review ?? 0} {copy.activeCases}
              </strong>
            </div>
            <span className="live-dot">{copy.liveDemo}</span>
          </div>
          <div className="snapshot-score">
            <Gauge aria-hidden="true" size={24} />
            <div>
              <span>{copy.averageEligibility}</span>
              <strong>{averageEligibility || 0}/100</strong>
            </div>
          </div>
          <div className="snapshot-grid">
            <MiniMetric label={copy.lowRisk} value={riskSummary.low} tone="positive" />
            <MiniMetric label={copy.mediumRisk} value={riskSummary.medium} tone="warning" />
            <MiniMetric label={copy.highRisk} value={riskSummary.high} tone="danger" />
          </div>
          <div className="snapshot-flow">
            <span>{copy.flowMember}</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>{copy.flowApi}</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>{copy.flowMl}</span>
            <ChevronRight aria-hidden="true" size={16} />
            <span>{copy.flowOfficer}</span>
          </div>
        </div>
      </section>

      <section className="metrics-row" aria-label={t(language, "Product metrics", "Metrik produk")}>
        <MetricTile
          icon={<FileText aria-hidden="true" size={20} />}
          label={t(language, "Applications", "Pengajuan")}
          value={summary?.counts.total_applications ?? "-"}
          caption={t(language, "Stored in demo storage", "Tersimpan di storage demo")}
        />
        <MetricTile
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label={t(language, "Under Review", "Dalam Review")}
          value={summary?.counts.under_review ?? "-"}
          caption={t(language, "Officer queue", "Antrean petugas")}
        />
        <MetricTile
          icon={<Sparkles aria-hidden="true" size={20} />}
          label={t(language, "Scored", "Sudah Discoring")}
          value={summary?.counts.scored ?? "-"}
          caption={t(language, "AI assessment created", "Assessment AI dibuat")}
        />
        <MetricTile
          icon={<Activity aria-hidden="true" size={20} />}
          label={t(language, "Decision Principle", "Prinsip Keputusan")}
          value={t(language, "Human", "Manusia")}
          caption={t(language, "AI recommends only", "AI hanya memberi saran")}
        />
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">{t(language, "Workflow", "Workflow")}</p>
          <h2>{t(language, "One product path, two clear workspaces.", "Satu alur produk, dua ruang kerja yang jelas.")}</h2>
        </div>
        <div className="workflow-grid">
          <WorkflowCard
            icon={<UserRound aria-hidden="true" size={22} />}
            title={t(language, "Member onboarding", "Pengajuan anggota")}
            copy={t(
              language,
              "A member starts from a friendly application flow, fills business and financing details, then submits the request.",
              "Anggota mulai dari form yang mudah dipahami, mengisi detail usaha dan pembiayaan, lalu mengirim pengajuan."
            )}
          />
          <WorkflowCard
            icon={<Sparkles aria-hidden="true" size={22} />}
            title={t(language, "AI assessment", "Assessment AI")}
            copy={t(
              language,
              "The backend maps the request into the MLOps API contract and returns recommendation, risk, confidence, and model metadata.",
              "Backend memetakan pengajuan ke kontrak API MLOps, lalu mengembalikan rekomendasi, risiko, confidence, dan metadata model."
            )}
          />
          <WorkflowCard
            icon={<ShieldCheck aria-hidden="true" size={22} />}
            title={t(language, "Officer decision", "Keputusan petugas")}
            copy={t(
              language,
              "Admin review shows the queue, detail panel, AI signal, and controlled approve/reject actions for the final decision.",
              "Admin melihat antrean, detail pengajuan, sinyal AI, dan tombol approve/reject yang tetap dikendalikan manusia."
            )}
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
  language,
  onSubmit,
  updateForm
}: {
  affordabilityRatio: number;
  form: ApplicationFormState;
  installment: number;
  isSubmitting: boolean;
  language: AppLanguage;
  onSubmit: () => void;
  updateForm: <Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) => void;
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const affordabilityTone = affordabilityRatio <= 0.3 ? "positive" : affordabilityRatio <= 0.5 ? "warning" : "danger";
  const affordabilityLabel =
    affordabilityRatio <= 0.3
      ? t(language, "Healthy", "Sehat")
      : affordabilityRatio <= 0.5
        ? t(language, "Needs review", "Perlu review")
        : t(language, "High pressure", "Beban tinggi");

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
          <p className="eyebrow">{t(language, "Member portal", "Portal anggota")}</p>
          <h1>{t(language, "Apply for cooperative financing", "Ajukan pembiayaan koperasi")}</h1>
          <p>
            {t(
              language,
              "The demo keeps the form intentionally simple while still collecting enough structured information for the backend scoring workflow.",
              "Form demo dibuat sederhana, tetapi tetap mengumpulkan data terstruktur yang dibutuhkan untuk alur scoring backend."
            )}
          </p>
        </div>
        <div className="stepper" aria-label={t(language, "Application steps", "Langkah pengajuan")}>
          <StepBadge active label={t(language, "Profile", "Profil")} number="1" />
          <StepBadge active label={t(language, "Financing", "Pembiayaan")} number="2" />
          <StepBadge label={t(language, "Officer Review", "Review Petugas")} number="3" />
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
            description={t(
              language,
              "Basic member details used for identification and model feature mapping.",
              "Data dasar anggota dipakai untuk identifikasi dan mapping fitur model."
            )}
            eyebrow={t(language, "Step 1", "Langkah 1")}
            title={t(language, "Applicant profile", "Profil pemohon")}
          >
            <Field label={t(language, "Applicant name", "Nama pemohon")}>
              <input
                required
                value={form.applicantName}
                onChange={(event) => updateAndCloseReview("applicantName", event.target.value)}
              />
            </Field>
            <Field label={t(language, "Phone number", "Nomor telepon")}>
              <input
                required
                value={form.phoneNumber}
                onChange={(event) => updateAndCloseReview("phoneNumber", event.target.value)}
              />
            </Field>
            <Field label={t(language, "Gender", "Jenis kelamin")}>
              <select value={form.gender} onChange={(event) => updateAndCloseReview("gender", event.target.value as "M" | "F")}>
                <option value="F">{formatGender("F", language)}</option>
                <option value="M">{formatGender("M", language)}</option>
              </select>
            </Field>
            <Field label={t(language, "Age", "Umur")}>
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
            description={t(
              language,
              "Business stability and household size help the demo estimate risk and repayment capacity.",
              "Stabilitas usaha dan jumlah keluarga membantu demo memperkirakan risiko serta kemampuan bayar."
            )}
            eyebrow={t(language, "Step 2", "Langkah 2")}
            title={t(language, "Business capacity", "Kapasitas usaha")}
          >
            <Field label={t(language, "Business type", "Jenis usaha")}>
              <select value={form.businessType} onChange={(event) => updateAndCloseReview("businessType", event.target.value)}>
                {businessTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[language]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t(language, "Years in business", "Lama usaha")}>
              <input
                min={0}
                max={60}
                required
                type="number"
                value={form.yearsInBusiness}
                onChange={(event) => updateAndCloseReview("yearsInBusiness", Number(event.target.value))}
              />
            </Field>
            <Field label={t(language, "Family members", "Jumlah keluarga")}>
              <input
                min={1}
                max={20}
                required
                type="number"
                value={form.familyMembers}
                onChange={(event) => updateAndCloseReview("familyMembers", Number(event.target.value))}
              />
            </Field>
            <Field label={t(language, "Children", "Anak")}>
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
            description={t(
              language,
              "The backend uses these values to calculate affordability and build the ML request payload.",
              "Backend memakai nilai ini untuk menghitung affordability dan membuat payload request ML."
            )}
            eyebrow={t(language, "Step 3", "Langkah 3")}
            title={t(language, "Financing request", "Pengajuan pembiayaan")}
          >
            <Field label={t(language, "Monthly income", "Pendapatan bulanan")}>
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
              <small className="field-hint">{formatMoneyHint(moneyRules.monthlyIncome, language)}</small>
            </Field>
            <Field label={t(language, "Requested amount", "Nominal pengajuan")}>
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
              <small className="field-hint">{formatMoneyHint(moneyRules.requestedAmount, language)}</small>
            </Field>
            <Field label={t(language, "Tenor in months", "Tenor dalam bulan")}>
              <input
                min={1}
                max={36}
                required
                type="number"
                value={form.tenorMonths}
                onChange={(event) => updateAndCloseReview("tenorMonths", Number(event.target.value))}
              />
            </Field>
            <Field label={t(language, "Existing loans", "Pinjaman aktif")}>
              <input
                min={0}
                max={20}
                required
                type="number"
                value={form.existingLoanCount}
                onChange={(event) => updateAndCloseReview("existingLoanCount", Number(event.target.value))}
              />
            </Field>
            <Field label={t(language, "Collateral", "Agunan")}>
              <select
                value={String(form.hasCollateral)}
                onChange={(event) => updateAndCloseReview("hasCollateral", event.target.value === "true")}
              >
                <option value="true">{t(language, "Available", "Ada")}</option>
                <option value="false">{t(language, "Not available", "Tidak ada")}</option>
              </select>
            </Field>
            <Field label={t(language, "Financing purpose", "Tujuan pembiayaan")} wide>
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
                  <p className="eyebrow">{t(language, "Final check", "Cek akhir")}</p>
                  <h2>{t(language, "Review before sending to officer workspace", "Review sebelum dikirim ke ruang kerja petugas")}</h2>
                </div>
                <Badge tone={affordabilityTone}>{affordabilityLabel}</Badge>
              </div>
              <div className="review-grid">
                <ReviewItem label={t(language, "Applicant", "Pemohon")} value={form.applicantName} />
                <ReviewItem label={t(language, "Business", "Usaha")} value={formatBusinessType(form.businessType, language)} />
                <ReviewItem label={t(language, "Requested", "Pengajuan")} value={currencyFormatter.format(form.requestedAmount)} />
                <ReviewItem label={t(language, "Base installment", "Estimasi cicilan")} value={currencyFormatter.format(installment)} />
                <ReviewItem label={t(language, "Affordability", "Affordability")} value={formatPercent(affordabilityRatio)} />
                <ReviewItem label={t(language, "Collateral", "Agunan")} value={formatCollateral(form.hasCollateral, language)} />
              </div>
              <p className="review-note">
                {t(
                  language,
                  "After confirmation, the backend stores this request, calls the MLOps scoring API, and sends the case to the admin workspace for final human review.",
                  "Setelah dikonfirmasi, backend menyimpan pengajuan ini, memanggil API scoring MLOps, lalu mengirim kasus ke admin untuk review final oleh manusia."
                )}
              </p>
              <div className="submit-review-actions">
                <button className="secondary-action" disabled={isSubmitting} type="button" onClick={() => setIsReviewOpen(false)}>
                  {t(language, "Back to edit", "Kembali edit")}
                </button>
                <button className="primary-action" disabled={isSubmitting} type="button" onClick={onSubmit}>
                  <ClipboardCheck aria-hidden="true" size={18} />
                  {isSubmitting
                    ? t(language, "Submitting and scoring...", "Mengirim dan scoring...")
                    : t(language, "Confirm and Submit", "Konfirmasi dan Kirim")}
                </button>
              </div>
            </section>
          ) : null}

          {!isReviewOpen ? (
            <div className="form-actions">
              <button className="primary-action submit-action" disabled={isSubmitting} type="submit">
                <ClipboardCheck aria-hidden="true" size={18} />
                {t(language, "Review Application", "Review Pengajuan")}
              </button>
            </div>
          ) : null}
        </form>

        <aside className="application-summary">
          <div className="summary-hero">
            <span>{t(language, "Requested financing", "Nominal pembiayaan")}</span>
            <strong>{currencyFormatter.format(form.requestedAmount)}</strong>
            <small>{formatTenor(form.tenorMonths, language)}</small>
          </div>
          <div className="summary-grid">
            <MiniMetric label={t(language, "Monthly income", "Pendapatan bulanan")} value={compactNumberFormatter.format(form.monthlyIncome)} />
            <MiniMetric label={t(language, "Base installment", "Estimasi cicilan")} value={compactNumberFormatter.format(installment)} />
            <MiniMetric label={t(language, "Affordability", "Affordability")} value={formatPercent(affordabilityRatio)} tone={affordabilityTone} />
            <MiniMetric label={t(language, "Collateral", "Agunan")} value={formatYesNo(form.hasCollateral, language)} />
          </div>
          <div className="insight-panel">
            <Gauge aria-hidden="true" size={22} />
            <div>
              <strong>{t(language, "What happens after submit?", "Apa yang terjadi setelah submit?")}</strong>
              <p>
                {t(
                  language,
                  "The API stores the request, calls the ML scoring service, then sends the application to the admin review workspace. AI never makes the final financing decision.",
                  "API menyimpan pengajuan, memanggil service scoring ML, lalu mengirim pengajuan ke ruang review admin. AI tidak pernah membuat keputusan final pembiayaan."
                )}
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
  language,
  query,
  onOpenApply,
  onQueryChange
}: {
  applications: FinancingApplication[];
  isLoading: boolean;
  language: AppLanguage;
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
          <p className="eyebrow">{t(language, "Member status", "Status anggota")}</p>
          <h1>{t(language, "Track a financing application", "Lacak status pengajuan pembiayaan")}</h1>
          <p>
            {t(
              language,
              "Members can look up the current review state after submitting an application. Officers still own the final approval or rejection decision.",
              "Anggota bisa melihat status review setelah mengirim pengajuan. Petugas tetap menjadi pemilik keputusan final approve atau reject."
            )}
          </p>
        </div>
        <button className="primary-action large" type="button" onClick={onOpenApply}>
          {t(language, "New Application", "Pengajuan Baru")}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>

      <section className="status-layout">
        <aside className="status-search-panel">
          <label className="search-box status-search">
            <Search aria-hidden="true" size={17} />
            <input
              placeholder={t(language, "Search by application ID, phone, or name", "Cari ID pengajuan, nomor telepon, atau nama")}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>

          <div className="status-result-list">
            {isLoading ? <p className="empty-copy">{t(language, "Loading application status...", "Memuat status pengajuan...")}</p> : null}
            {!isLoading && visibleApplications.length === 0 ? (
              <p className="empty-copy">{t(language, "No application matches this lookup.", "Tidak ada pengajuan yang cocok.")}</p>
            ) : null}
            {!isLoading
              ? visibleApplications.map((application) => (
                  <article className="status-result-card" key={application.id}>
                    <div>
                      <strong>{application.applicantName}</strong>
                      <span>{application.id}</span>
                    </div>
                    <Badge tone={statusTone(application.status)}>{formatStatus(application.status, language)}</Badge>
                  </article>
                ))
              : null}
          </div>
        </aside>

        {selectedApplication ? (
          <article className="member-status-panel">
            <div className="status-case-heading">
              <div>
                <p className="eyebrow">{t(language, "Current case", "Kasus saat ini")}</p>
                <h2>{selectedApplication.applicantName}</h2>
                <span>{selectedApplication.id}</span>
              </div>
              <Badge tone={statusTone(selectedApplication.status)}>{formatStatus(selectedApplication.status, language)}</Badge>
            </div>

            <div className="status-timeline" aria-label={t(language, "Application status timeline", "Timeline status pengajuan")}>
              <StatusStep
                state="complete"
                title={t(language, "Submitted", "Diajukan")}
                copy={t(language, "The backend has stored the financing request.", "Backend sudah menyimpan pengajuan pembiayaan.")}
              />
              <StatusStep
                state={selectedApplication.status === "SUBMITTED" ? "current" : "complete"}
                title={t(language, "Officer review", "Review petugas")}
                copy={t(language, "The case is ready for cooperative officer review.", "Kasus siap direview oleh petugas koperasi.")}
              />
              <StatusStep
                state={selectedApplication.decision ? "complete" : "waiting"}
                title={t(language, "Final decision", "Keputusan final")}
                copy={
                  selectedApplication.decision
                    ? t(
                        language,
                        `${formatStatus(selectedApplication.decision.decision)} by ${selectedApplication.decision.reviewerName}.`,
                        `${formatStatus(selectedApplication.decision.decision, language)} oleh ${selectedApplication.decision.reviewerName}.`
                      )
                    : t(language, "Waiting for the officer to save a final decision.", "Menunggu petugas menyimpan keputusan final.")
                }
              />
            </div>

            <div className="status-summary-grid">
              <MiniMetric label={t(language, "Requested", "Pengajuan")} value={selectedApplication.requestedAmountFormatted} />
              <MiniMetric label={t(language, "Tenor", "Tenor")} value={formatTenor(selectedApplication.tenorMonths, language)} />
              <MiniMetric
                label={t(language, "AI signal", "Sinyal AI")}
                value={formatRecommendation(selectedApplication.aiAssessment?.aiRecommendation, language)}
                tone={recommendationTone(selectedApplication.aiAssessment?.aiRecommendation)}
              />
              <MiniMetric
                label="Eligibility"
                value={selectedApplication.aiAssessment ? `${selectedApplication.aiAssessment.eligibilityScore}/100` : "-"}
              />
            </div>

            {selectedApplication.decision ? (
              <div className="decision-note">
                <strong>{t(language, "Officer note", "Catatan petugas")}</strong>
                <span>
                  {t(
                    language,
                    `${formatStatus(selectedApplication.decision.decision)} by ${selectedApplication.decision.reviewerName}`,
                    `${formatStatus(selectedApplication.decision.decision, language)} oleh ${selectedApplication.decision.reviewerName}`
                  )}
                </span>
                <p>{selectedApplication.decision.note}</p>
              </div>
            ) : (
              <div className="status-waiting-note">
                <ShieldCheck aria-hidden="true" size={18} />
                <p>
                  {t(
                    language,
                    "AI has no final authority here. The member status updates after an officer saves a decision.",
                    "AI tidak punya wewenang final. Status anggota berubah setelah petugas menyimpan keputusan."
                  )}
                </p>
              </div>
            )}
          </article>
        ) : (
          <article className="member-status-panel empty">
            <FileCheck2 aria-hidden="true" size={28} />
            <strong>{t(language, "No status selected", "Belum ada status dipilih")}</strong>
            <p>{t(language, "Submit a new application or search an existing application ID.", "Kirim pengajuan baru atau cari ID pengajuan yang sudah ada.")}</p>
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
  language,
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
  language: AppLanguage;
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
            <small>{t(language, "Officer review console", "Konsol review petugas")}</small>
          </div>
        </div>
        <div className="sidebar-metrics">
          <SidebarMetric label="Total" value={summary?.counts.total_applications ?? applications.length} />
          <SidebarMetric label={t(language, "Review", "Review")} value={summary?.counts.under_review ?? 0} />
          <SidebarMetric label={t(language, "Approved", "Disetujui")} value={summary?.counts.approved ?? 0} />
          <SidebarMetric label={t(language, "Rejected", "Ditolak")} value={summary?.counts.rejected ?? 0} />
        </div>
        <div className="risk-stack" aria-label={t(language, "Risk distribution", "Distribusi risiko")}>
          <div>
            <span>{t(language, "Low", "Rendah")}</span>
            <strong>{riskSummary.low}</strong>
          </div>
          <div>
            <span>{t(language, "Medium", "Sedang")}</span>
            <strong>{riskSummary.medium}</strong>
          </div>
          <div>
            <span>{t(language, "High", "Tinggi")}</span>
            <strong>{riskSummary.high}</strong>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">{t(language, "Admin workspace", "Ruang kerja admin")}</p>
            <h1>{t(language, "Application Review", "Review Pengajuan")}</h1>
            <p>
              {t(
                language,
                "Prioritize, inspect AI signals, rescore when needed, and keep the officer as final decision maker.",
                "Prioritaskan antrean, baca sinyal AI, lakukan rescore jika perlu, dan tetap jadikan petugas sebagai pembuat keputusan final."
              )}
            </p>
          </div>
        </div>

        <section className={`ml-status ${isFallbackActive || hasMixedScoring ? "warning" : "positive"}`} aria-label={t(language, "ML model status", "Status model ML")}>
          {isFallbackActive || hasMixedScoring ? (
            <AlertTriangle aria-hidden="true" size={20} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={20} />
          )}
          <div>
            <strong>
              {isStrictMlMode
                ? t(language, "Strict ML mode is enabled", "Mode Strict ML aktif")
                : isFallbackActive
                ? t(language, "Fallback scoring is active", "Fallback scoring aktif")
                : hasMixedScoring
                  ? t(language, "Mixed scoring sources", "Sumber scoring campuran")
                  : t(language, "Trained ML scoring ready when service responds", "Scoring ML terlatih siap ketika service merespons")}
            </strong>
            <p>
              {isStrictMlMode
                ? t(
                    language,
                    "The backend will require the Python MLOps API for scoring. If the model service is unavailable, new scoring requests return a clear service-unavailable error instead of using fallback.",
                    "Backend wajib memakai API MLOps Python untuk scoring. Jika service model tidak tersedia, request scoring baru akan gagal dengan error yang jelas, bukan memakai fallback."
                  )
                : isFallbackActive
                ? fallbackScoringMessage(summary, language)
                : hasMixedScoring
                  ? t(
                      language,
                      "Some records were scored while the trained model was unavailable. Refresh a selected score after the MLOps API is running to replace fallback assessments.",
                      "Beberapa record discoring saat model terlatih belum tersedia. Refresh score pada pengajuan terpilih setelah API MLOps aktif untuk mengganti assessment fallback."
                    )
                  : t(
                      language,
                      "Applications can show trained MLOps scores when the Python service responds. Fallback remains labeled if the service is unavailable.",
                      "Pengajuan bisa menampilkan score MLOps terlatih ketika service Python merespons. Fallback tetap diberi label jika service tidak tersedia."
                    )}
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
              placeholder={t(language, "Search applicant, business, or application ID", "Cari pemohon, usaha, atau ID pengajuan")}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <div className="filter-group" aria-label={t(language, "Status filters", "Filter status")}>
            {(["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as StatusFilter[]).map((status) => (
              <button
                className={statusFilter === status ? "active" : ""}
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
              >
                {status === "ALL" ? t(language, "All", "Semua") : formatStatus(status, language)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-content">
          <ApplicationTable
            applications={filteredApplications}
            isLoading={isLoading}
            language={language}
            selectedApplicationId={selectedApplication?.id ?? null}
            onSelectApplication={onSelectApplication}
          />
          <ApplicationDetailPanel
            actionState={actionState}
            application={selectedApplication}
            language={language}
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
  language,
  selectedApplicationId,
  onSelectApplication
}: {
  applications: FinancingApplication[];
  isLoading: boolean;
  language: AppLanguage;
  selectedApplicationId: string | null;
  onSelectApplication: (id: string) => void;
}) {
  return (
    <section className="queue-panel">
      <div className="table-header">
        <div>
          <p className="eyebrow">{t(language, "Queue", "Antrean")}</p>
          <h2>{t(language, "Financing Applications", "Pengajuan Pembiayaan")}</h2>
        </div>
        <span>{applications.length} {t(language, "records", "record")}</span>
      </div>
      <div className="application-list">
        {isLoading ? <p className="empty-copy">{t(language, "Loading applications...", "Memuat pengajuan...")}</p> : null}
        {!isLoading && applications.length === 0 ? (
          <p className="empty-copy">{t(language, "No applications match the current filter.", "Tidak ada pengajuan yang cocok dengan filter saat ini.")}</p>
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
                  <small>{formatBusinessType(application.businessType, language)}</small>
                </div>
                <div className="application-card-finance">
                  <span>{t(language, "Requested", "Pengajuan")}</span>
                  <strong>{application.requestedAmountFormatted}</strong>
                  <small>{formatTenor(application.tenorMonths, language)}</small>
                </div>
                <div className="application-card-signals">
                  <Badge tone={statusTone(application.status)}>{formatStatus(application.status, language)}</Badge>
                  <Badge tone={riskTone(application.aiAssessment?.riskLevel)}>
                    {formatRiskLevel(application.aiAssessment?.riskLevel, language)}
                  </Badge>
                  <span className="score-chip">
                    {application.aiAssessment ? `${application.aiAssessment.eligibilityScore}/100` : t(language, "Not scored", "Belum discoring")}
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
  language,
  onDecide,
  onScore
}: {
  actionState: ActionState;
  application: FinancingApplication | null;
  language: AppLanguage;
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
        <strong>{t(language, "Select an application", "Pilih pengajuan")}</strong>
        <p>
          {t(
            language,
            "Choose a row from the queue to inspect profile, AI assessment, and decision controls.",
            "Pilih salah satu antrean untuk melihat profil, assessment AI, dan kontrol keputusan."
          )}
        </p>
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
          <p className="eyebrow">{t(language, "Selected case", "Kasus terpilih")}</p>
          <h2>{application.applicantName}</h2>
          <span>{application.id}</span>
        </div>
        <Badge tone={statusTone(application.status)}>{formatStatus(application.status, language)}</Badge>
      </div>

      {assessment?.source === "demo_rule_based_fallback" ? (
        <section className="model-warning">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>{t(language, "Trained model is not active for this score.", "Model terlatih tidak aktif untuk score ini.")}</strong>
            <p>
              {t(
                language,
                "The app is using the labeled fallback path because the Python MLOps API did not return a score.",
                "Aplikasi memakai jalur fallback berlabel karena API MLOps Python tidak mengembalikan score."
              )}
            </p>
          </div>
        </section>
      ) : null}

      <div className="ai-card">
        <div className="ai-card-top">
          <Sparkles aria-hidden="true" size={22} />
          <div>
            <span>{t(language, "AI recommendation", "Rekomendasi AI")}</span>
            <strong>{formatRecommendation(assessment?.aiRecommendation, language)}</strong>
          </div>
          {assessment ? <Badge tone={sourceTone(assessment.source)}>{formatAssessmentSource(assessment.source, language)}</Badge> : null}
        </div>
        <div className="eligibility-meter">
          <div
            className="score-ring"
            aria-label={t(
              language,
              `Eligibility score ${assessment?.eligibilityScore ?? 0} out of 100`,
              `Skor eligibility ${assessment?.eligibilityScore ?? 0} dari 100`
            )}
            style={{ "--score": `${assessment?.eligibilityScore ?? 0}%` } as CSSProperties}
          >
            <strong>{assessment?.eligibilityScore ?? 0}</strong>
          </div>
          <div className="eligibility-copy">
            <span>{t(language, "Eligibility score", "Skor eligibility")}</span>
            <strong>{assessment ? `${assessment.eligibilityScore}/100` : t(language, "Not scored", "Belum discoring")}</strong>
            <p>
              {t(
                language,
                "Higher is better. The officer still saves the final financing decision.",
                "Semakin tinggi semakin baik. Petugas tetap menyimpan keputusan final pembiayaan."
              )}
            </p>
          </div>
        </div>
        <div className="ai-grid">
          <MiniMetric label={t(language, "Risk", "Risiko")} value={formatRiskLevel(assessment?.riskLevel, language)} tone={riskTone(assessment?.riskLevel)} />
          <MiniMetric label={t(language, "Default risk", "Risiko default")} value={assessment ? formatPercent(assessment.probDefault) : "-"} />
          <MiniMetric label={t(language, "Confidence", "Confidence")} value={assessment ? formatPercent(assessment.confidence) : "-"} />
          <MiniMetric label="Model" value={assessment?.modelName ?? "-"} />
        </div>
        <p>
          {assessment?.note ??
            t(
              language,
              "Run scoring to generate an AI assessment for this application.",
              "Jalankan scoring untuk membuat assessment AI pada pengajuan ini."
            )}
        </p>
      </div>

      <div className="detail-section">
        <h3>{t(language, "Applicant profile", "Profil pemohon")}</h3>
        <div className="profile-grid">
          <ProfileItem label={t(language, "Business", "Usaha")} value={formatBusinessType(application.businessType, language)} />
          <ProfileItem label={t(language, "Phone", "Telepon")} value={application.phoneNumber} />
          <ProfileItem label={t(language, "Age", "Umur")} value={formatAge(application.age, language)} />
          <ProfileItem label={t(language, "Family", "Keluarga")} value={formatMembers(application.familyMembers, language)} />
          <ProfileItem label={t(language, "Children", "Anak")} value={String(application.children)} />
          <ProfileItem label={t(language, "Collateral", "Agunan")} value={formatCollateral(application.hasCollateral, language)} />
          <ProfileItem label={t(language, "Income", "Pendapatan")} value={currencyFormatter.format(application.monthlyIncome)} />
          <ProfileItem label={t(language, "Requested", "Pengajuan")} value={application.requestedAmountFormatted} />
        </div>
      </div>

      <div className="detail-section">
        <h3>{t(language, "Purpose", "Tujuan")}</h3>
        <p className="purpose-copy">{application.purpose}</p>
      </div>

      {application.decision ? (
        <div className="decision-note">
          <strong>{t(language, "Final decision saved", "Keputusan final tersimpan")}</strong>
          <span>
            {t(
              language,
              `${formatStatus(application.decision.decision)} by ${application.decision.reviewerName}`,
              `${formatStatus(application.decision.decision, language)} oleh ${application.decision.reviewerName}`
            )}
          </span>
          <p>{application.decision.note}</p>
        </div>
      ) : null}

      {decisionDraft ? (
        <section className={decisionDraft.decision === "APPROVED" ? "confirm-box approve" : "confirm-box reject"}>
          <div>
            <strong>{t(language, `Confirm ${formatStatus(decisionDraft.decision)}?`, `Konfirmasi ${formatStatus(decisionDraft.decision, language)}?`)}</strong>
            <p>
              {t(
                language,
                `Write the officer reason before saving. This note becomes the human audit trail for ${application.applicantName}.`,
                `Tulis alasan petugas sebelum menyimpan. Catatan ini menjadi audit trail manusia untuk ${application.applicantName}.`
              )}
            </p>
          </div>
          <div className="decision-form-grid">
            <label className="decision-field">
              <span>{t(language, "Reviewer name", "Nama reviewer")}</span>
              <input
                value={decisionDraft.reviewerName}
                onChange={(event) => updateDecisionDraft("reviewerName", event.target.value)}
              />
            </label>
            <label className="decision-field wide">
              <span>{t(language, "Decision reason", "Alasan keputusan")}</span>
              <textarea
                placeholder={
                  decisionDraft.decision === "APPROVED"
                    ? t(
                        language,
                        "Example: Business cashflow, collateral, and repayment capacity were verified by the officer.",
                        "Contoh: Cashflow usaha, agunan, dan kemampuan bayar sudah diverifikasi petugas."
                      )
                    : t(
                        language,
                        "Example: Requested amount is too high compared with verified repayment capacity.",
                        "Contoh: Nominal pengajuan terlalu tinggi dibanding kemampuan bayar yang terverifikasi."
                      )
                }
                value={decisionDraft.note}
                onChange={(event) => updateDecisionDraft("note", event.target.value)}
              />
            </label>
            <p className="decision-helper">
              {t(language, "Minimum 12 characters. The backend will reject empty notes.", "Minimal 12 karakter. Backend akan menolak catatan kosong.")}
            </p>
          </div>
          <div className="confirm-actions">
            <button className="secondary-action" type="button" onClick={() => setDecisionDraft(null)}>
              {t(language, "Cancel", "Batal")}
            </button>
            <button
              className={decisionDraft.decision === "APPROVED" ? "decision-button approve" : "decision-button reject"}
              disabled={isDeciding || !canSubmitDecision}
              type="button"
              onClick={() => void saveDecision()}
            >
              {isDeciding
                ? t(language, "Saving...", "Menyimpan...")
                : t(language, `Confirm ${formatStatus(decisionDraft.decision)}`, `Konfirmasi ${formatStatus(decisionDraft.decision, language)}`)}
            </button>
          </div>
        </section>
      ) : null}

      <div className="decision-actions">
        <button className="secondary-action" disabled={isScoring || isDeciding} type="button" onClick={() => onScore(application.id)}>
          <Sparkles aria-hidden="true" size={17} />
          {isScoring ? t(language, "Scoring...", "Scoring...") : t(language, "Refresh Score", "Refresh Score")}
        </button>
        <button
          className="decision-button approve"
          disabled={application.status === "APPROVED" || isScoring || isDeciding}
          type="button"
          onClick={() => openDecisionDraft("APPROVED")}
        >
          <CheckCircle2 aria-hidden="true" size={17} />
          {t(language, "Approve", "Setujui")}
        </button>
        <button
          className="decision-button reject"
          disabled={application.status === "REJECTED" || isScoring || isDeciding}
          type="button"
          onClick={() => openDecisionDraft("REJECTED")}
        >
          <XCircle aria-hidden="true" size={17} />
          {t(language, "Reject", "Tolak")}
        </button>
      </div>
    </aside>
  );
}

function SystemView({
  apiBaseUrl,
  isLoading,
  language,
  summary
}: {
  apiBaseUrl: string;
  isLoading: boolean;
  language: AppLanguage;
  summary: DemoSummary | null;
}) {
  const copy = systemCopy[language];
  const featureCountsLabel = language === "id" ? "Jumlah field dan kolom model" : "Feature mapping counts";
  const apiUrlValue = apiBaseUrl === "Same origin" ? (language === "id" ? "Origin yang sama" : "Same origin") : "API";

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">{copy.pageEyebrow}</p>
          <h1>{copy.pageTitle}</h1>
          <p>{copy.pageDescription}</p>
        </div>
        <Badge tone={isLoading ? "warning" : "positive"}>{isLoading ? copy.loading : copy.loaded}</Badge>
      </section>

      <section className="system-grid">
        <MetricTile icon={<Database aria-hidden="true" size={20} />} label={copy.metricStorage} value={formatStorageMode(summary?.integration.database, language)} caption={copy.metricStorageCaption} />
        <MetricTile icon={<Sparkles aria-hidden="true" size={20} />} label={copy.metricMlApi} value={formatMlIntegration(summary?.integration.ml_api, language)} caption={formatMlApiTargetCaption(summary?.integration.ml_api_base_url, language)} />
        <MetricTile icon={<ShieldCheck aria-hidden="true" size={20} />} label={copy.metricScoring} value={formatScoringMode(summary?.integration.ml_scoring_mode, language)} caption={formatScoringModeCaption(summary, language)} />
        <MetricTile icon={<LayoutDashboard aria-hidden="true" size={20} />} label={copy.metricWebApp} value={formatWebAppMode(summary?.integration.web_app, language)} caption={summary?.integration.web_dist_available ? copy.metricWebCaptionReady : copy.metricWebCaptionDev} />
        <MetricTile icon={<ShieldCheck aria-hidden="true" size={20} />} label={copy.metricAuth} value={formatAuthMode(summary?.integration.auth, language)} caption={copy.metricAuthCaption} />
        <MetricTile icon={<Activity aria-hidden="true" size={20} />} label={copy.metricApiUrl} value={apiUrlValue} caption={apiBaseUrl} />
      </section>

      <section className="architecture-panel">
        <div>
          <p className="eyebrow">{copy.architectureEyebrow}</p>
          <h2>{copy.architectureTitle}</h2>
          <p>{copy.architectureDescription}</p>
        </div>
        <div className="architecture-flow">
          <FlowNode icon={<UserRound aria-hidden="true" size={18} />} label={copy.flowMember} />
          <FlowArrow />
          <FlowNode icon={<Building2 aria-hidden="true" size={18} />} label={copy.flowBackend} />
          <FlowArrow />
          <FlowNode icon={<Sparkles aria-hidden="true" size={18} />} label={copy.flowMl} />
          <FlowArrow />
          <FlowNode icon={<ShieldCheck aria-hidden="true" size={18} />} label={copy.flowOfficer} />
        </div>
      </section>

      <section className="workflow-explain-panel">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">{copy.workflowEyebrow}</p>
            <h2>{copy.workflowTitle}</h2>
            <p>{copy.workflowDescription}</p>
          </div>
        </div>

        <div className="workflow-explain-grid">
          {systemWorkflowSteps.map((step) => (
            <article key={step.title.en}>
              <strong>{step.title[language]}</strong>
              <p>{step.copy[language]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-map-panel">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">{copy.featureEyebrow}</p>
            <h2>{copy.featureTitle}</h2>
            <p>{copy.featureDescription}</p>
          </div>
          <Badge tone="positive">{copy.verifiedBadge}</Badge>
        </div>

        <div className="feature-count-strip" aria-label={featureCountsLabel}>
          <div>
            <span>{copy.countProduct}</span>
            <strong>14 fields</strong>
            <small>{copy.countProductCaption}</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>{copy.countRequest}</span>
            <strong>19 fields</strong>
            <small>{copy.countRequestCaption}</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>{copy.countModel}</span>
            <strong>25 columns</strong>
            <small>{copy.countModelCaption}</small>
          </div>
        </div>

        <div className="mapping-note">
          <FileText aria-hidden="true" size={19} />
          <p>{copy.mappingNote}</p>
        </div>

        <div className="mapping-table-wrap">
          <table className="mapping-table">
            <caption>{copy.mappingCaption}</caption>
            <thead>
              <tr>
                <th>{copy.requestFieldHeader}</th>
                <th>{copy.sourceHeader}</th>
                <th>{copy.mappingHeader}</th>
                <th>{copy.impactHeader}</th>
              </tr>
            </thead>
            <tbody>
              {mlFeatureMapRows.map((row) => (
                <tr key={row.requestField}>
                  <td>
                    <code>{row.requestField}</code>
                  </td>
                  <td>{language === "id" ? featureSourceIdByRequestField[row.requestField] ?? row.source : row.source}</td>
                  <td>{language === "id" ? featureMappingIdByRequestField[row.requestField] ?? row.mapping : row.mapping}</td>
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
            <p className="eyebrow">{copy.derivedEyebrow}</p>
            <h2>{copy.derivedTitle}</h2>
            <p>{copy.derivedDescription}</p>
          </div>
          <Badge tone="neutral">{copy.engineeredBadge}</Badge>
        </div>

        <div className="derived-grid">
          {derivedFeatureRows.map((row) => (
            <article key={row.modelColumn}>
              <strong>{row.modelColumn}</strong>
              <code>{row.formula}</code>
              <p>{language === "id" ? derivedReasonIdByModelColumn[row.modelColumn] ?? row.reason : row.reason}</p>
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
