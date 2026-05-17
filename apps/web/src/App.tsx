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
  const [form, setForm] = useState<ApplicationFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const authToken = session?.token ?? null;

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
      await loadDemoData();
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
      await loadDemoData();
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
        session={session}
        onLanguageChange={setLanguage}
        onLoginOpen={() => requestLogin("member", "home")}
        onLogout={logout}
        onRefresh={() => void loadDemoData()}
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
          applications={applications}
          isLoading={isLoading}
          language={language}
          query={statusLookupQuery}
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
