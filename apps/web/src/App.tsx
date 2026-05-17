import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { authHeaders, fetchJson } from "./apiClient";
import { clearStoredAuthSession, readStoredAuthSession, saveStoredAuthSession } from "./authSession";
import { apiBaseUrl, apiDisplayUrl, initialForm } from "./config";
import { formatStatus, t } from "./formatters";
import type {
  ActionState,
  AppLanguage,
  ApplicationFormState,
  AuthRole,
  DemoSummary,
  FinancingApplication,
  StatusFilter,
  StoredAuthSession,
  ViewKey
} from "./types";
import { AdminView, ApplyView, HomeView, LoginView, StatusView, SystemView, TopNavigation } from "./views";

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [language, setLanguage] = useState<AppLanguage>("id");
  const [summary, setSummary] = useState<DemoSummary | null>(null);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [session, setSession] = useState<StoredAuthSession | null>(() => readStoredAuthSession());
  const [preferredLoginRole, setPreferredLoginRole] = useState<AuthRole>("member");
  const [postLoginView, setPostLoginView] = useState<ViewKey>("home");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusLookupQuery, setStatusLookupQuery] = useState("");
  const [statusLookupAccessCode, setStatusLookupAccessCode] = useState("");
  const [statusApplication, setStatusApplication] = useState<FinancingApplication | null>(null);
  const [form, setForm] = useState<ApplicationFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isStatusLookupLoading, setIsStatusLookupLoading] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const authToken = session?.token ?? null;

  async function loadDemoData(authSession: StoredAuthSession | null = session) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const summaryData = await fetchJson<DemoSummary>(`${apiBaseUrl}/api/v1/demo/summary`);
      const applicationsData =
        authSession?.session.role === "admin"
          ? await fetchJson<{ data: FinancingApplication[] }>(`${apiBaseUrl}/api/v1/applications`, {
              headers: authHeaders(authSession.token)
            })
          : { data: [] };

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
    if (applications.length === 0 && summary?.metrics.risk_summary) {
      return summary.metrics.risk_summary;
    }

    return {
      low: applications.filter((application) => application.aiAssessment?.riskLevel === "LOW").length,
      medium: applications.filter((application) => application.aiAssessment?.riskLevel === "MEDIUM").length,
      high: applications.filter((application) => application.aiAssessment?.riskLevel === "HIGH").length
    };
  }, [applications, summary]);

  const averageEligibility = useMemo(() => {
    const scored = applications.filter((application) => application.aiAssessment);

    if (scored.length === 0) {
      return summary?.metrics.average_eligibility ?? 0;
    }

    return Math.round(
      scored.reduce((total, application) => total + (application.aiAssessment?.eligibilityScore ?? 0), 0) /
        scored.length
    );
  }, [applications, summary]);

  function updateForm<Key extends keyof ApplicationFormState>(key: Key, value: ApplicationFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function requestLogin(role: AuthRole, targetView: ViewKey) {
    setPreferredLoginRole(role);
    setPostLoginView(targetView);
    setActiveView("login");
  }

  function changeView(nextView: ViewKey) {
    if (nextView === "apply" && !session) {
      requestLogin("member", "apply");
      return;
    }

    if (nextView === "admin" && session?.session.role !== "admin") {
      requestLogin("admin", "admin");
      return;
    }

    setActiveView(nextView);
  }

  async function login(role: AuthRole, password: string) {
    setIsAuthSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: StoredAuthSession }>(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          password,
          role
        })
      });

      setSession(response.data);
      saveStoredAuthSession(response.data);
      setSuccessMessage(
        t(
          language,
          `Signed in as ${role === "admin" ? "admin officer" : "member"}.`,
          `Berhasil masuk sebagai ${role === "admin" ? "petugas admin" : "anggota"}.`
        )
      );
      setActiveView(postLoginView);
      await loadDemoData(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to sign in.", "Gagal masuk.");
      setErrorMessage(message);
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  function logout() {
    setSession(null);
    clearStoredAuthSession();
    setApplications([]);
    setSelectedApplicationId(null);
    setSuccessMessage(t(language, "Signed out from the demo role.", "Sudah keluar dari role demo."));

    if (activeView === "apply" || activeView === "admin") {
      setActiveView("home");
    }
  }

  async function submitApplication() {
    if (!authToken) {
      requestLogin("member", "apply");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(`${apiBaseUrl}/api/v1/applications`, {
        headers: authHeaders(authToken),
        method: "POST",
        body: JSON.stringify(form)
      });

      setApplications((current) => [response.data, ...current.filter((item) => item.id !== response.data.id)]);
      setSelectedApplicationId(response.data.id);
      setStatusLookupQuery(response.data.id);
      setStatusLookupAccessCode(response.data.memberAccessCode);
      setStatusApplication(response.data);
      setSuccessMessage(
        t(
          language,
          `Application ${response.data.id} submitted. Save access code ${response.data.memberAccessCode} for status lookup.`,
          `Pengajuan ${response.data.id} berhasil dikirim. Simpan kode akses ${response.data.memberAccessCode} untuk cek status.`
        )
      );
      setActiveView("status");
      await loadDemoData(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to submit application.", "Gagal mengirim pengajuan.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function scoreApplication(id: string) {
    if (session?.session.role !== "admin" || !authToken) {
      requestLogin("admin", "admin");
      return;
    }

    setActionState({ id, kind: "score" });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(`${apiBaseUrl}/api/v1/applications/${id}/score`, {
        headers: authHeaders(authToken),
        method: "POST"
      });

      setApplications((current) => current.map((item) => (item.id === id ? response.data : item)));
      setSelectedApplicationId(response.data.id);
      setSuccessMessage(t(language, `Application ${id} has a refreshed AI assessment.`, `Assessment AI untuk pengajuan ${id} berhasil diperbarui.`));
      await loadDemoData(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to score application.", "Gagal melakukan scoring pengajuan.");
      setErrorMessage(message);
    } finally {
      setActionState(null);
    }
  }

  async function decideApplication(id: string, decision: "APPROVED" | "REJECTED", reviewerName: string, note: string) {
    if (session?.session.role !== "admin" || !authToken) {
      requestLogin("admin", "admin");
      return;
    }

    setActionState({ id, kind: "decision" });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(
        `${apiBaseUrl}/api/v1/applications/${id}/decision`,
        {
          headers: authHeaders(authToken),
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
      setStatusApplication((current) => (current?.id === id ? response.data : current));
      setSuccessMessage(
        t(language, `Application ${id} marked as ${formatStatus(decision)}.`, `Pengajuan ${id} ditandai sebagai ${formatStatus(decision, language)}.`)
      );
      await loadDemoData(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to save decision.", "Gagal menyimpan keputusan.");
      setErrorMessage(message);
    } finally {
      setActionState(null);
    }
  }

  async function lookupApplicationStatus() {
    const applicationId = statusLookupQuery.trim();
    const accessCode = statusLookupAccessCode.trim();

    if (!applicationId) {
      setErrorMessage(t(language, "Application ID is required.", "ID pengajuan wajib diisi."));
      return;
    }

    if (!accessCode && session?.session.role !== "admin") {
      setErrorMessage(t(language, "Access code is required for member status lookup.", "Kode akses wajib diisi untuk cek status anggota."));
      return;
    }

    setIsStatusLookupLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetchJson<{ data: FinancingApplication }>(`${apiBaseUrl}/api/v1/applications/${encodeURIComponent(applicationId)}/status`, {
        headers: {
          ...authHeaders(authToken),
          ...(accessCode ? { "x-koopcare-access-code": accessCode } : {})
        }
      });

      setStatusApplication(response.data);
      setSuccessMessage(t(language, "Application status found.", "Status pengajuan ditemukan."));
    } catch (error) {
      const message = error instanceof Error ? error.message : t(language, "Failed to look up status.", "Gagal mencari status.");
      setStatusApplication(null);
      setErrorMessage(message);
    } finally {
      setIsStatusLookupLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <TopNavigation
        activeView={activeView}
        isLoading={isLoading}
        language={language}
        session={session}
        onLanguageChange={setLanguage}
        onLoginOpen={() => requestLogin("member", "home")}
        onLogout={logout}
        onRefresh={() => void loadDemoData(session)}
        onViewChange={changeView}
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
          onOpenAdmin={() => changeView("admin")}
          onOpenLogin={() => requestLogin("member", "home")}
          onOpenStatus={() => changeView("status")}
          onStartApplication={() => changeView("apply")}
        />
      ) : null}

      {activeView === "login" ? (
        <LoginView
          isSubmitting={isAuthSubmitting}
          language={language}
          preferredRole={preferredLoginRole}
          onCancel={() => setActiveView("home")}
          onLogin={(role, password) => void login(role, password)}
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
          accessCode={statusLookupAccessCode}
          application={statusApplication}
          isLoading={isLoading || isStatusLookupLoading}
          language={language}
          query={statusLookupQuery}
          onAccessCodeChange={setStatusLookupAccessCode}
          onLookup={() => void lookupApplicationStatus()}
          onOpenApply={() => changeView("apply")}
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
