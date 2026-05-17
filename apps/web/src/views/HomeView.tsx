import { Activity, ArrowRight, ChevronRight, FileText, Gauge, LayoutDashboard, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { MetricTile, MiniMetric, ProofPill, WorkflowCard } from "../components/ui";
import { homeCopy } from "../copy";
import { t } from "../formatters";
import type { AppLanguage, DemoSummary } from "../types";
export function HomeView({
  averageEligibility,
  language,
  riskSummary,
  summary,
  onOpenAdmin,
  onStartApplication,
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
              onClick={onOpenAdmin}
            >
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
            <MiniMetric
              label={copy.lowRisk}
              value={riskSummary.low}
              tone="positive"
            />
            <MiniMetric
              label={copy.mediumRisk}
              value={riskSummary.medium}
              tone="warning"
            />
            <MiniMetric
              label={copy.highRisk}
              value={riskSummary.high}
              tone="danger"
            />
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

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">{t(language, "Workflow", "Workflow")}</p>
          <h2>
            {t(
              language,
              "One product path, two clear workspaces.",
              "Satu alur produk, dua ruang kerja yang jelas.",
            )}
          </h2>
        </div>
        <div className="workflow-grid">
          <WorkflowCard
            icon={<UserRound aria-hidden="true" size={22} />}
            title={t(language, "Member onboarding", "Pengajuan anggota")}
            copy={t(
              language,
              "A member starts from a friendly application flow, fills business and financing details, then submits the request.",
              "Anggota mulai dari form yang mudah dipahami, mengisi detail usaha dan pembiayaan, lalu mengirim pengajuan.",
            )}
          />
          <WorkflowCard
            icon={<Sparkles aria-hidden="true" size={22} />}
            title={t(language, "AI assessment", "Assessment AI")}
            copy={t(
              language,
              "The backend maps the request into the MLOps API contract and returns recommendation, risk, confidence, and model metadata.",
              "Backend memetakan pengajuan ke kontrak API MLOps, lalu mengembalikan rekomendasi, risiko, confidence, dan metadata model.",
            )}
          />
          <WorkflowCard
            icon={<ShieldCheck aria-hidden="true" size={22} />}
            title={t(language, "Officer decision", "Keputusan petugas")}
            copy={t(
              language,
              "Admin review shows the queue, detail panel, AI signal, and controlled approve/reject actions for the final decision.",
              "Admin melihat antrean, detail pengajuan, sinyal AI, dan tombol approve/reject yang tetap dikendalikan manusia.",
            )}
          />
        </div>
      </section>
    </section>
  );
}