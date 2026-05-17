import { AlertTriangle, CheckCircle2, FileCheck2, Search, Sparkles, XCircle } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { Badge, MiniMetric, ProfileItem, SidebarMetric } from "../components/ui";
import {
  currencyFormatter,
  fallbackScoringMessage,
  formatAge,
  formatAssessmentSource,
  formatBusinessType,
  formatCollateral,
  formatMembers,
  formatPercent,
  formatRecommendation,
  formatRiskLevel,
  formatStatus,
  formatTenor,
  recommendationTone,
  riskTone,
  sourceTone,
  statusTone,
  t
} from "../formatters";
import type { ActionState, AppLanguage, ApplicationStatus, DecisionDraft, DemoSummary, FinancingApplication, StatusFilter } from "../types";
export function AdminView({
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
  onStatusFilterChange,
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
  onDecide: (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewerName: string,
    note: string,
  ) => void;
  onScore: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectApplication: (id: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  const scoredByMlApi = applications.filter(
    (application) => application.aiAssessment?.source === "ml_api",
  ).length;
  const scoredByFallback = applications.filter(
    (application) =>
      application.aiAssessment?.source === "demo_rule_based_fallback",
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
            <small>
              {t(language, "Officer review console", "Konsol review petugas")}
            </small>
          </div>
        </div>
        <div className="sidebar-metrics">
          <SidebarMetric
            label="Total"
            value={summary?.counts.total_applications ?? applications.length}
          />
          <SidebarMetric
            label={t(language, "Review", "Review")}
            value={summary?.counts.under_review ?? 0}
          />
          <SidebarMetric
            label={t(language, "Approved", "Disetujui")}
            value={summary?.counts.approved ?? 0}
          />
          <SidebarMetric
            label={t(language, "Rejected", "Ditolak")}
            value={summary?.counts.rejected ?? 0}
          />
        </div>
        <div
          className="risk-stack"
          aria-label={t(language, "Risk distribution", "Distribusi risiko")}
        >
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
            <p className="eyebrow">
              {t(language, "Admin workspace", "Ruang kerja admin")}
            </p>
            <h1>{t(language, "Application Review", "Review Pengajuan")}</h1>
            <p>
              {t(
                language,
                "Prioritize, inspect AI signals, rescore when needed, and keep the officer as final decision maker.",
                "Prioritaskan antrean, baca sinyal AI, lakukan rescore jika perlu, dan tetap jadikan petugas sebagai pembuat keputusan final.",
              )}
            </p>
          </div>
        </div>

        <section
          className={`ml-status ${isFallbackActive || hasMixedScoring ? "warning" : "positive"}`}
          aria-label={t(language, "ML model status", "Status model ML")}
        >
          {isFallbackActive || hasMixedScoring ? (
            <AlertTriangle aria-hidden="true" size={20} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={20} />
          )}
          <div>
            <strong>
              {isStrictMlMode
                ? t(
                    language,
                    "Strict ML mode is enabled",
                    "Mode Strict ML aktif",
                  )
                : isFallbackActive
                  ? t(
                      language,
                      "Fallback scoring is active",
                      "Fallback scoring aktif",
                    )
                  : hasMixedScoring
                    ? t(
                        language,
                        "Mixed scoring sources",
                        "Sumber scoring campuran",
                      )
                    : t(
                        language,
                        "Trained ML scoring ready when service responds",
                        "Scoring ML terlatih siap ketika service merespons",
                      )}
            </strong>
            <p>
              {isStrictMlMode
                ? t(
                    language,
                    "The backend will require the Python MLOps API for scoring. If the model service is unavailable, new scoring requests return a clear service-unavailable error instead of using fallback.",
                    "Backend wajib memakai API MLOps Python untuk scoring. Jika service model tidak tersedia, request scoring baru akan gagal dengan error yang jelas, bukan memakai fallback.",
                  )
                : isFallbackActive
                  ? fallbackScoringMessage(summary, language)
                  : hasMixedScoring
                    ? t(
                        language,
                        "Some records were scored while the trained model was unavailable. Refresh a selected score after the MLOps API is running to replace fallback assessments.",
                        "Beberapa record discoring saat model terlatih belum tersedia. Refresh score pada pengajuan terpilih setelah API MLOps aktif untuk mengganti assessment fallback.",
                      )
                    : t(
                        language,
                        "Applications can show trained MLOps scores when the Python service responds. Fallback remains labeled if the service is unavailable.",
                        "Pengajuan bisa menampilkan score MLOps terlatih ketika service Python merespons. Fallback tetap diberi label jika service tidak tersedia.",
                      )}
            </p>
          </div>
          <Badge
            tone={isFallbackActive || hasMixedScoring ? "warning" : "positive"}
          >
            {scoredByMlApi} ML / {scoredByFallback} fallback
          </Badge>
        </section>

        <div className="admin-toolbar">
          <label className="search-box">
            <Search aria-hidden="true" size={17} />
            <input
              placeholder={t(
                language,
                "Search applicant, business, or application ID",
                "Cari pemohon, usaha, atau ID pengajuan",
              )}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <div
            className="filter-group"
            aria-label={t(language, "Status filters", "Filter status")}
          >
            {(
              [
                "ALL",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "REJECTED",
              ] as StatusFilter[]
            ).map((status) => (
              <button
                className={statusFilter === status ? "active" : ""}
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
              >
                {status === "ALL"
                  ? t(language, "All", "Semua")
                  : formatStatus(status, language)}
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
  onSelectApplication,
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
          <h2>
            {t(language, "Financing Applications", "Pengajuan Pembiayaan")}
          </h2>
        </div>
        <span>
          {applications.length} {t(language, "records", "record")}
        </span>
      </div>
      <div className="application-list">
        {isLoading ? (
          <p className="empty-copy">
            {t(language, "Loading applications...", "Memuat pengajuan...")}
          </p>
        ) : null}
        {!isLoading && applications.length === 0 ? (
          <p className="empty-copy">
            {t(
              language,
              "No applications match the current filter.",
              "Tidak ada pengajuan yang cocok dengan filter saat ini.",
            )}
          </p>
        ) : null}
        {!isLoading
          ? applications.map((application) => (
              <button
                className={
                  selectedApplicationId === application.id
                    ? "application-card selected"
                    : "application-card"
                }
                key={application.id}
                type="button"
                onClick={() => onSelectApplication(application.id)}
              >
                <div className="application-card-main">
                  <strong>{application.applicantName}</strong>
                  <span>{application.id}</span>
                  <small>
                    {formatBusinessType(application.businessType, language)}
                  </small>
                </div>
                <div className="application-card-finance">
                  <span>{t(language, "Requested", "Pengajuan")}</span>
                  <strong>{application.requestedAmountFormatted}</strong>
                  <small>
                    {formatTenor(application.tenorMonths, language)}
                  </small>
                </div>
                <div className="application-card-signals">
                  <Badge tone={statusTone(application.status)}>
                    {formatStatus(application.status, language)}
                  </Badge>
                  <Badge tone={riskTone(application.aiAssessment?.riskLevel)}>
                    {formatRiskLevel(
                      application.aiAssessment?.riskLevel,
                      language,
                    )}
                  </Badge>
                  <span className="score-chip">
                    {application.aiAssessment
                      ? `${application.aiAssessment.eligibilityScore}/100`
                      : t(language, "Not scored", "Belum discoring")}
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
  onScore,
}: {
  actionState: ActionState;
  application: FinancingApplication | null;
  language: AppLanguage;
  onDecide: (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewerName: string,
    note: string,
  ) => void;
  onScore: (id: string) => void;
}) {
  const [decisionDraft, setDecisionDraft] = useState<DecisionDraft | null>(
    null,
  );

  useEffect(() => {
    setDecisionDraft(null);
  }, [application?.id]);

  if (!application) {
    return (
      <aside className="detail-panel empty">
        <FileCheck2 aria-hidden="true" size={28} />
        <strong>
          {t(language, "Select an application", "Pilih pengajuan")}
        </strong>
        <p>
          {t(
            language,
            "Choose a row from the queue to inspect profile, AI assessment, and decision controls.",
            "Pilih salah satu antrean untuk melihat profil, assessment AI, dan kontrol keputusan.",
          )}
        </p>
      </aside>
    );
  }

  const assessment = application.aiAssessment;
  const isScoring =
    actionState?.kind === "score" && actionState.id === application.id;
  const isDeciding =
    actionState?.kind === "decision" && actionState.id === application.id;
  const defaultReviewerName =
    application.decision?.reviewerName ?? "Demo Officer";
  const canSubmitDecision =
    decisionDraft !== null &&
    decisionDraft.reviewerName.trim().length > 0 &&
    decisionDraft.note.trim().length >= 12;

  function openDecisionDraft(decision: "APPROVED" | "REJECTED") {
    setDecisionDraft({
      decision,
      reviewerName: defaultReviewerName,
      note: "",
    });
  }

  function updateDecisionDraft<Key extends keyof DecisionDraft>(
    key: Key,
    value: DecisionDraft[Key],
  ) {
    setDecisionDraft((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  }

  async function saveDecision() {
    if (!application || !decisionDraft || !canSubmitDecision) {
      return;
    }

    await onDecide(
      application.id,
      decisionDraft.decision,
      decisionDraft.reviewerName,
      decisionDraft.note,
    );
    setDecisionDraft(null);
  }

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">
            {t(language, "Selected case", "Kasus terpilih")}
          </p>
          <h2>{application.applicantName}</h2>
          <span>{application.id}</span>
        </div>
        <Badge tone={statusTone(application.status)}>
          {formatStatus(application.status, language)}
        </Badge>
      </div>

      {assessment?.source === "demo_rule_based_fallback" ? (
        <section className="model-warning">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>
              {t(
                language,
                "Trained model is not active for this score.",
                "Model terlatih tidak aktif untuk score ini.",
              )}
            </strong>
            <p>
              {t(
                language,
                "The app is using the labeled fallback path because the Python MLOps API did not return a score.",
                "Aplikasi memakai jalur fallback berlabel karena API MLOps Python tidak mengembalikan score.",
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
            <strong>
              {formatRecommendation(assessment?.aiRecommendation, language)}
            </strong>
          </div>
          {assessment ? (
            <Badge tone={sourceTone(assessment.source)}>
              {formatAssessmentSource(assessment.source, language)}
            </Badge>
          ) : null}
        </div>
        <div className="eligibility-meter">
          <div
            className="score-ring"
            aria-label={t(
              language,
              `Eligibility score ${assessment?.eligibilityScore ?? 0} out of 100`,
              `Skor eligibility ${assessment?.eligibilityScore ?? 0} dari 100`,
            )}
            style={
              {
                "--score": `${assessment?.eligibilityScore ?? 0}%`,
              } as CSSProperties
            }
          >
            <strong>{assessment?.eligibilityScore ?? 0}</strong>
          </div>
          <div className="eligibility-copy">
            <span>{t(language, "Eligibility score", "Skor eligibility")}</span>
            <strong>
              {assessment
                ? `${assessment.eligibilityScore}/100`
                : t(language, "Not scored", "Belum discoring")}
            </strong>
            <p>
              {t(
                language,
                "Higher is better. The officer still saves the final financing decision.",
                "Semakin tinggi semakin baik. Petugas tetap menyimpan keputusan final pembiayaan.",
              )}
            </p>
          </div>
        </div>
        <div className="ai-grid">
          <MiniMetric
            label={t(language, "Risk", "Risiko")}
            value={formatRiskLevel(assessment?.riskLevel, language)}
            tone={riskTone(assessment?.riskLevel)}
          />
          <MiniMetric
            label={t(language, "Default risk", "Risiko default")}
            value={assessment ? formatPercent(assessment.probDefault) : "-"}
          />
          <MiniMetric
            label={t(language, "Confidence", "Confidence")}
            value={assessment ? formatPercent(assessment.confidence) : "-"}
          />
          <MiniMetric label="Model" value={assessment?.modelName ?? "-"} />
        </div>
        <p>
          {assessment?.note ??
            t(
              language,
              "Run scoring to generate an AI assessment for this application.",
              "Jalankan scoring untuk membuat assessment AI pada pengajuan ini.",
            )}
        </p>
      </div>

      <div className="detail-section">
        <h3>{t(language, "Applicant profile", "Profil pemohon")}</h3>
        <div className="profile-grid">
          <ProfileItem
            label={t(language, "Business", "Usaha")}
            value={formatBusinessType(application.businessType, language)}
          />
          <ProfileItem
            label={t(language, "Phone", "Telepon")}
            value={application.phoneNumber}
          />
          <ProfileItem
            label={t(language, "Age", "Umur")}
            value={formatAge(application.age, language)}
          />
          <ProfileItem
            label={t(language, "Family", "Keluarga")}
            value={formatMembers(application.familyMembers, language)}
          />
          <ProfileItem
            label={t(language, "Children", "Anak")}
            value={String(application.children)}
          />
          <ProfileItem
            label={t(language, "Collateral", "Agunan")}
            value={formatCollateral(application.hasCollateral, language)}
          />
          <ProfileItem
            label={t(language, "Income", "Pendapatan")}
            value={currencyFormatter.format(application.monthlyIncome)}
          />
          <ProfileItem
            label={t(language, "Requested", "Pengajuan")}
            value={application.requestedAmountFormatted}
          />
        </div>
      </div>

      <div className="detail-section">
        <h3>{t(language, "Purpose", "Tujuan")}</h3>
        <p className="purpose-copy">{application.purpose}</p>
      </div>

      {application.decision ? (
        <div className="decision-note">
          <strong>
            {t(language, "Final decision saved", "Keputusan final tersimpan")}
          </strong>
          <span>
            {t(
              language,
              `${formatStatus(application.decision.decision)} by ${application.decision.reviewerName}`,
              `${formatStatus(application.decision.decision, language)} oleh ${application.decision.reviewerName}`,
            )}
          </span>
          <p>{application.decision.note}</p>
        </div>
      ) : null}

      {decisionDraft ? (
        <section
          className={
            decisionDraft.decision === "APPROVED"
              ? "confirm-box approve"
              : "confirm-box reject"
          }
        >
          <div>
            <strong>
              {t(
                language,
                `Confirm ${formatStatus(decisionDraft.decision)}?`,
                `Konfirmasi ${formatStatus(decisionDraft.decision, language)}?`,
              )}
            </strong>
            <p>
              {t(
                language,
                `Write the officer reason before saving. This note becomes the human audit trail for ${application.applicantName}.`,
                `Tulis alasan petugas sebelum menyimpan. Catatan ini menjadi audit trail manusia untuk ${application.applicantName}.`,
              )}
            </p>
          </div>
          <div className="decision-form-grid">
            <label className="decision-field">
              <span>{t(language, "Reviewer name", "Nama reviewer")}</span>
              <input
                value={decisionDraft.reviewerName}
                onChange={(event) =>
                  updateDecisionDraft("reviewerName", event.target.value)
                }
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
                        "Contoh: Cashflow usaha, agunan, dan kemampuan bayar sudah diverifikasi petugas.",
                      )
                    : t(
                        language,
                        "Example: Requested amount is too high compared with verified repayment capacity.",
                        "Contoh: Nominal pengajuan terlalu tinggi dibanding kemampuan bayar yang terverifikasi.",
                      )
                }
                value={decisionDraft.note}
                onChange={(event) =>
                  updateDecisionDraft("note", event.target.value)
                }
              />
            </label>
            <p className="decision-helper">
              {t(
                language,
                "Minimum 12 characters. The backend will reject empty notes.",
                "Minimal 12 karakter. Backend akan menolak catatan kosong.",
              )}
            </p>
          </div>
          <div className="confirm-actions">
            <button
              className="secondary-action"
              type="button"
              onClick={() => setDecisionDraft(null)}
            >
              {t(language, "Cancel", "Batal")}
            </button>
            <button
              className={
                decisionDraft.decision === "APPROVED"
                  ? "decision-button approve"
                  : "decision-button reject"
              }
              disabled={isDeciding || !canSubmitDecision}
              type="button"
              onClick={() => void saveDecision()}
            >
              {isDeciding
                ? t(language, "Saving...", "Menyimpan...")
                : t(
                    language,
                    `Confirm ${formatStatus(decisionDraft.decision)}`,
                    `Konfirmasi ${formatStatus(decisionDraft.decision, language)}`,
                  )}
            </button>
          </div>
        </section>
      ) : null}

      <div className="decision-actions">
        <button
          className="secondary-action"
          disabled={isScoring || isDeciding}
          type="button"
          onClick={() => onScore(application.id)}
        >
          <Sparkles aria-hidden="true" size={17} />
          {isScoring
            ? t(language, "Scoring...", "Scoring...")
            : t(language, "Refresh Score", "Refresh Score")}
        </button>
        <button
          className="decision-button approve"
          disabled={
            application.status === "APPROVED" || isScoring || isDeciding
          }
          type="button"
          onClick={() => openDecisionDraft("APPROVED")}
        >
          <CheckCircle2 aria-hidden="true" size={17} />
          {t(language, "Approve", "Setujui")}
        </button>
        <button
          className="decision-button reject"
          disabled={
            application.status === "REJECTED" || isScoring || isDeciding
          }
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
