import { ArrowRight, FileCheck2, Search, ShieldCheck } from "lucide-react";

import { Badge, MiniMetric, StatusStep } from "../components/ui";
import {
  formatPercent,
  formatRecommendation,
  formatStatus,
  formatTenor,
  recommendationTone,
  statusTone,
  t
} from "../formatters";
import type { AppLanguage, FinancingApplication } from "../types";
export function StatusView({
  accessCode,
  application,
  isLoading,
  language,
  query,
  onAccessCodeChange,
  onLookup,
  onOpenApply,
  onQueryChange,
}: {
  accessCode: string;
  application: FinancingApplication | null;
  isLoading: boolean;
  language: AppLanguage;
  query: string;
  onAccessCodeChange: (value: string) => void;
  onLookup: () => void;
  onOpenApply: () => void;
  onQueryChange: (value: string) => void;
}) {
  const selectedApplication = application;

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">
            {t(language, "Member status", "Status anggota")}
          </p>
          <h1>
            {t(
              language,
              "Track a financing application",
              "Lacak status pengajuan pembiayaan",
            )}
          </h1>
          <p>
            {t(
              language,
              "Members can look up the current review state after submitting an application. Officers still own the final approval or rejection decision.",
              "Anggota bisa melihat status review setelah mengirim pengajuan. Petugas tetap menjadi pemilik keputusan final approve atau reject.",
            )}
          </p>
        </div>
        <button
          className="primary-action large"
          type="button"
          onClick={onOpenApply}
        >
          {t(language, "New Application", "Pengajuan Baru")}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>

      <section className="status-layout">
        <aside className="status-search-panel">
          <form
            className="status-lookup-form"
            onSubmit={(event) => {
              event.preventDefault();
              onLookup();
            }}
          >
            <label className="status-lookup-field">
              <span>{t(language, "Application ID", "ID pengajuan")}</span>
              <div className="search-box status-search">
                <Search aria-hidden="true" size={17} />
                <input
                  placeholder="APP-2026-..."
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                />
              </div>
            </label>

            <label className="status-lookup-field">
              <span>{t(language, "Access code", "Kode akses")}</span>
              <input
                className="status-access-input"
                placeholder="KC-XXXXXX"
                value={accessCode}
                onChange={(event) => onAccessCodeChange(event.target.value.toUpperCase())}
              />
            </label>

            <button className="primary-action" disabled={isLoading} type="submit">
              <FileCheck2 aria-hidden="true" size={17} />
              {isLoading ? t(language, "Checking...", "Mengecek...") : t(language, "Check Status", "Cek Status")}
            </button>
          </form>

          <div className="status-access-note">
            <ShieldCheck aria-hidden="true" size={18} />
            <p>
              {t(
                language,
                "For privacy, member status now needs the application ID and access code shown after submission.",
                "Demi privasi, status anggota sekarang membutuhkan ID pengajuan dan kode akses yang muncul setelah submit."
              )}
            </p>
          </div>

          <div className="status-result-list">
            {isLoading ? (
              <p className="empty-copy">
                {t(
                  language,
                  "Loading application status...",
                  "Memuat status pengajuan...",
                )}
              </p>
            ) : null}
            {!isLoading && !selectedApplication ? (
              <p className="empty-copy">
                {t(
                  language,
                  "Enter an application ID and access code to load one status record.",
                  "Masukkan ID pengajuan dan kode akses untuk memuat satu status.",
                )}
              </p>
            ) : null}
            {!isLoading && selectedApplication ? (
              <article className="status-result-card">
                <div>
                  <strong>{selectedApplication.applicantName}</strong>
                  <span>{selectedApplication.id}</span>
                </div>
                <Badge tone={statusTone(selectedApplication.status)}>
                  {formatStatus(selectedApplication.status, language)}
                </Badge>
              </article>
            ) : null}
          </div>
        </aside>

        {selectedApplication ? (
          <article className="member-status-panel">
            <div className="status-case-heading">
              <div>
                <p className="eyebrow">
                  {t(language, "Current case", "Kasus saat ini")}
                </p>
                <h2>{selectedApplication.applicantName}</h2>
                <span>{selectedApplication.id}</span>
              </div>
              <Badge tone={statusTone(selectedApplication.status)}>
                {formatStatus(selectedApplication.status, language)}
              </Badge>
            </div>

            <div
              className="status-timeline"
              aria-label={t(
                language,
                "Application status timeline",
                "Timeline status pengajuan",
              )}
            >
              <StatusStep
                state="complete"
                title={t(language, "Submitted", "Diajukan")}
                copy={t(
                  language,
                  "The backend has stored the financing request.",
                  "Backend sudah menyimpan pengajuan pembiayaan.",
                )}
              />
              <StatusStep
                state={
                  selectedApplication.status === "SUBMITTED"
                    ? "current"
                    : "complete"
                }
                title={t(language, "Officer review", "Review petugas")}
                copy={t(
                  language,
                  "The case is ready for cooperative officer review.",
                  "Kasus siap direview oleh petugas koperasi.",
                )}
              />
              <StatusStep
                state={selectedApplication.decision ? "complete" : "waiting"}
                title={t(language, "Final decision", "Keputusan final")}
                copy={
                  selectedApplication.decision
                    ? t(
                        language,
                        `${formatStatus(selectedApplication.decision.decision)} by ${selectedApplication.decision.reviewerName}.`,
                        `${formatStatus(selectedApplication.decision.decision, language)} oleh ${selectedApplication.decision.reviewerName}.`,
                      )
                    : t(
                        language,
                        "Waiting for the officer to save a final decision.",
                        "Menunggu petugas menyimpan keputusan final.",
                      )
                }
              />
            </div>

            <div className="status-summary-grid">
              <MiniMetric
                label={t(language, "Requested", "Pengajuan")}
                value={selectedApplication.requestedAmountFormatted}
              />
              <MiniMetric
                label={t(language, "Tenor", "Tenor")}
                value={formatTenor(selectedApplication.tenorMonths, language)}
              />
              <MiniMetric
                label={t(language, "AI signal", "Sinyal AI")}
                value={formatRecommendation(
                  selectedApplication.aiAssessment?.aiRecommendation,
                  language,
                )}
                tone={recommendationTone(
                  selectedApplication.aiAssessment?.aiRecommendation,
                )}
              />
              <MiniMetric
                label="Eligibility"
                value={
                  selectedApplication.aiAssessment
                    ? `${selectedApplication.aiAssessment.eligibilityScore}/100`
                    : "-"
                }
              />
            </div>

            {selectedApplication.decision ? (
              <div className="decision-note">
                <strong>
                  {t(language, "Officer note", "Catatan petugas")}
                </strong>
                <span>
                  {t(
                    language,
                    `${formatStatus(selectedApplication.decision.decision)} by ${selectedApplication.decision.reviewerName}`,
                    `${formatStatus(selectedApplication.decision.decision, language)} oleh ${selectedApplication.decision.reviewerName}`,
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
                    "AI tidak punya wewenang final. Status anggota berubah setelah petugas menyimpan keputusan.",
                  )}
                </p>
              </div>
            )}
          </article>
        ) : (
          <article className="member-status-panel empty">
            <FileCheck2 aria-hidden="true" size={28} />
            <strong>
              {t(language, "No status selected", "Belum ada status dipilih")}
            </strong>
            <p>
              {t(
                language,
                "Submit a new application or search an existing application ID.",
                "Kirim pengajuan baru atau cari ID pengajuan yang sudah ada.",
              )}
            </p>
          </article>
        )}
      </section>
    </section>
  );
}
