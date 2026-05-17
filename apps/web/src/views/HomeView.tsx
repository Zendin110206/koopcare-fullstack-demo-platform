import {
  Activity,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";

import { MetricTile, ProofPill, WorkflowCard } from "../components/ui";
import { homeCopy } from "../copy";
import { t } from "../formatters";
import type { AppLanguage, DemoSummary } from "../types";
export function HomeView({
  averageEligibility,
  language,
  riskSummary,
  summary,
  onOpenAdmin,
  onOpenLogin,
  onOpenStatus,
  onStartApplication,
}: {
  averageEligibility: number;
  language: AppLanguage;
  riskSummary: { low: number; medium: number; high: number };
  summary: DemoSummary | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onOpenStatus: () => void;
  onStartApplication: () => void;
}) {
  const copy = homeCopy[language];

  return (
    <section className="view-stack">
      <section className="member-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span>{copy.eyebrow}</span>
            <BadgeCheck aria-hidden="true" size={16} />
            <strong>{copy.liveDemo}</strong>
          </div>
          <h1>{copy.title}</h1>
          <p className="hero-lede">{copy.lede}</p>
          <div className="hero-actions">
            <button
              className="primary-action large"
              type="button"
              onClick={onStartApplication}
            >
              {copy.startApplication}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button
              className="secondary-action large"
              type="button"
              onClick={onOpenLogin}
            >
              {copy.login}
              <UserRound aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="member-trust-row">
            <ProofPill label={copy.trustFast} />
            <ProofPill label={copy.trustSecure} />
            <ProofPill label={copy.trustTransparent} />
          </div>
          <button className="status-link-button" type="button" onClick={onOpenStatus}>
            <FileCheck2 aria-hidden="true" size={17} />
            {copy.checkStatus}
          </button>
        </div>

        <div className="hero-finance-preview" aria-label="KoopCare member product preview">
          <div className="member-card-visual">
            <div className="member-card-top">
              <span>KoopCare</span>
              <strong>Member Pass</strong>
            </div>
            <div className="member-card-balance">
              <span>{t(language, "Requested limit", "Limit pengajuan")}</span>
              <strong>Rp 8.000.000</strong>
            </div>
            <div className="member-card-footer">
              <span>KC-2489</span>
              <LockKeyhole aria-hidden="true" size={18} />
            </div>
          </div>

          <div className="member-flow-panel">
            <div className="flow-panel-header">
              <span>{t(language, "Application preview", "Preview pengajuan")}</span>
              <strong>{t(language, "Ready for review", "Siap direview")}</strong>
            </div>
            <div className="flow-step-list">
              <div className="flow-step done">
                <Clock3 aria-hidden="true" size={16} />
                <span>{t(language, "2 minute member form", "Form anggota 2 menit")}</span>
              </div>
              <div className="flow-step done">
                <Sparkles aria-hidden="true" size={16} />
                <span>{t(language, "ML score attached", "Score ML terhubung")}</span>
              </div>
              <div className="flow-step">
                <ShieldCheck aria-hidden="true" size={16} />
                <span>{t(language, "Officer final decision", "Keputusan final petugas")}</span>
              </div>
            </div>
          </div>

          <div className="snapshot-flow member-flow">
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

      <section
        className="metrics-row"
        aria-label={t(language, "Product metrics", "Metrik produk")}
      >
        <MetricTile
          icon={<FileText aria-hidden="true" size={20} />}
          label={t(language, "Applications", "Pengajuan")}
          value={summary?.counts.total_applications ?? "-"}
          caption={t(
            language,
            "Stored in demo storage",
            "Tersimpan di storage demo",
          )}
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

      <section className="member-onboarding-band">
        <div className="section-heading">
          <p className="eyebrow">{t(language, "Member journey", "Perjalanan anggota")}</p>
          <h2>
            {t(
              language,
              "A calmer financing flow from first visit to status tracking.",
              "Alur pembiayaan yang lebih tenang dari kunjungan pertama sampai cek status.",
            )}
          </h2>
        </div>
        <div className="workflow-grid">
          <WorkflowCard
            icon={<UserRound aria-hidden="true" size={22} />}
            title={t(language, "Create or log in", "Buat akun atau masuk")}
            copy={t(
              language,
              "The demo account screen feels like a real member onboarding path, including a Google-style option without connecting to Google yet.",
              "Layar akun demo dibuat seperti onboarding anggota sungguhan, termasuk opsi bergaya Google tanpa koneksi Google dulu.",
            )}
          />
          <WorkflowCard
            icon={<Sparkles aria-hidden="true" size={22} />}
            title={t(language, "Apply with guidance", "Ajukan dengan panduan")}
            copy={t(
              language,
              "The application form stays understandable for non-technical members while still collecting the fields needed by the scoring workflow.",
              "Form tetap mudah dipahami anggota awam, tetapi tetap mengumpulkan field yang dibutuhkan workflow scoring.",
            )}
          />
          <WorkflowCard
            icon={<ShieldCheck aria-hidden="true" size={22} />}
            title={t(language, "Track safely", "Cek status dengan aman")}
            copy={t(
              language,
              "Members use their application ID and access code to see one status record without exposing the full review queue.",
              "Anggota memakai ID pengajuan dan kode akses untuk melihat satu status tanpa membuka seluruh antrean review.",
            )}
          />
        </div>
      </section>

      <section className="member-confidence-band">
        <div>
          <p className="eyebrow">{t(language, "Trust signals", "Sinyal kepercayaan")}</p>
          <h2>{t(language, "Built to reduce financing anxiety.", "Dibuat untuk mengurangi rasa khawatir saat mengajukan pembiayaan.")}</h2>
        </div>
        <div className="confidence-grid">
          <div>
            <strong>{summary?.counts.total_applications ?? 0}</strong>
            <span>{t(language, "demo applications stored", "pengajuan demo tersimpan")}</span>
          </div>
          <div>
            <strong>{averageEligibility || 0}/100</strong>
            <span>{copy.averageEligibility}</span>
          </div>
          <div>
            <strong>{riskSummary.low}</strong>
            <span>{copy.lowRisk}</span>
          </div>
          <div>
            <strong>AI + Officer</strong>
            <span>{t(language, "recommendation stays advisory", "rekomendasi tetap sebagai saran")}</span>
          </div>
        </div>
        <button className="secondary-action large" type="button" onClick={onOpenAdmin}>
          {copy.openAdmin}
          <LayoutDashboard aria-hidden="true" size={18} />
        </button>
      </section>
    </section>
  );
}
