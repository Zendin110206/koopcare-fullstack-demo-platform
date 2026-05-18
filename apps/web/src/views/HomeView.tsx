import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards
} from "lucide-react";

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
  onStartApplication
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
    <section className="marketing-page">
      <section className="landing-hero" aria-label={t(language, "KoopCare public landing page", "Landing page public KoopCare")}>
        <div className="landing-copy">
          <div className="landing-kicker">
            <BadgeCheck aria-hidden="true" size={16} />
            <span>{copy.eyebrow}</span>
            <strong>{copy.liveDemo}</strong>
          </div>

          <h1>{copy.title}</h1>
          <p className="landing-lede">{copy.lede}</p>

          <div className="landing-actions">
            <button className="primary-action landing-action" type="button" onClick={onStartApplication}>
              {copy.startApplication}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button className="secondary-action landing-action" type="button" onClick={onOpenLogin}>
              {copy.login}
              <UserRound aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="landing-trust-strip" aria-label={t(language, "Trust signals", "Sinyal kepercayaan")}>
            <div>
              <Clock3 aria-hidden="true" size={18} />
              <span>{copy.trustFast}</span>
            </div>
            <div>
              <LockKeyhole aria-hidden="true" size={18} />
              <span>{copy.trustSecure}</span>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" size={18} />
              <span>{copy.trustTransparent}</span>
            </div>
          </div>
        </div>

        <div className="landing-stage" aria-label={t(language, "KoopCare product preview", "Preview produk KoopCare")}>
          <div className="member-phone-frame">
            <div className="phone-status-bar">
              <span>{t(language, "Member preview", "Preview anggota")}</span>
              <span>KC-2489</span>
            </div>
            <div className="phone-card">
              <span>{t(language, "Available financing preview", "Preview pembiayaan tersedia")}</span>
              <strong>Rp 8.000.000</strong>
              <small>{t(language, "Estimated tenor: 12 months", "Estimasi tenor: 12 bulan")}</small>
            </div>
            <div className="phone-progress-list">
              <div className="phone-progress-item complete">
                <CheckCircle2 aria-hidden="true" size={16} />
                <span>{t(language, "Member profile ready", "Profil anggota siap")}</span>
              </div>
              <div className="phone-progress-item complete">
                <Sparkles aria-hidden="true" size={16} />
                <span>{t(language, "ML score attached", "Score ML terhubung")}</span>
              </div>
              <div className="phone-progress-item">
                <ShieldCheck aria-hidden="true" size={16} />
                <span>{t(language, "Officer final review", "Review final petugas")}</span>
              </div>
            </div>
          </div>

          <div className="landing-score-card">
            <div>
              <span>{copy.averageEligibility}</span>
              <strong>{averageEligibility || 0}/100</strong>
            </div>
            <div className="score-ring" aria-hidden="true">
              <span>{averageEligibility || 0}</span>
            </div>
          </div>

          <button className="landing-status-card" type="button" onClick={onOpenStatus}>
            <FileCheck2 aria-hidden="true" size={20} />
            <span>
              <strong>{copy.checkStatus}</strong>
              <small>{t(language, "Application ID + access code", "ID pengajuan + kode akses")}</small>
            </span>
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </section>

      <section className="landing-proof-grid" aria-label={t(language, "Public demo proof", "Bukti demo public")}>
        <article>
          <span>
            <Banknote aria-hidden="true" size={20} />
          </span>
          <strong>{summary?.counts.total_applications ?? 0}</strong>
          <p>{t(language, "applications stored in the demo workflow", "pengajuan tersimpan di workflow demo")}</p>
        </article>
        <article>
          <span>
            <LineChart aria-hidden="true" size={20} />
          </span>
          <strong>{summary?.counts.scored ?? 0}</strong>
          <p>{t(language, "applications already scored by AI", "pengajuan sudah memiliki scoring AI")}</p>
        </article>
        <article>
          <span>
            <WalletCards aria-hidden="true" size={20} />
          </span>
          <strong>{riskSummary.low}</strong>
          <p>{t(language, "low-risk records in the current demo sample", "record risiko rendah pada sampel demo saat ini")}</p>
        </article>
        <article>
          <span>
            <ShieldCheck aria-hidden="true" size={20} />
          </span>
          <strong>{t(language, "Officer", "Petugas")}</strong>
          <p>{t(language, "keeps the final financing decision", "tetap memegang keputusan pembiayaan final")}</p>
        </article>
      </section>

      <section className="landing-flow-section">
        <div className="landing-section-heading">
          <p className="eyebrow">{t(language, "Member journey", "Perjalanan anggota")}</p>
          <h2>
            {t(
              language,
              "A financing journey that feels clear before it feels technical.",
              "Perjalanan pembiayaan yang terasa jelas sebelum terasa teknis."
            )}
          </h2>
        </div>

        <div className="landing-flow-cards">
          <article>
            <span>01</span>
            <h3>{t(language, "Create access", "Buat akses")}</h3>
            <p>
              {t(
                language,
                "Member opens a clean account page with create-account, login, and Google-style demo options.",
                "Anggota membuka halaman akun yang rapi dengan opsi buat akun, masuk, dan Google-style demo."
              )}
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>{t(language, "Submit financing", "Kirim pengajuan")}</h3>
            <p>
              {t(
                language,
                "The form collects cooperative financing data while keeping the wording readable for non-technical users.",
                "Form mengumpulkan data pembiayaan koperasi sambil tetap memakai bahasa yang mudah dipahami pengguna awam."
              )}
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>{t(language, "Track status", "Lacak status")}</h3>
            <p>
              {t(
                language,
                "Application ID and access code let the member see one status record without exposing the review queue.",
                "ID pengajuan dan kode akses membuat anggota melihat satu status tanpa membuka antrean review."
              )}
            </p>
          </article>
          <article>
            <span>04</span>
            <h3>{t(language, "Officer decides", "Petugas memutuskan")}</h3>
            <p>
              {t(
                language,
                "AI risk signals support the review, but the final decision stays with a cooperative officer.",
                "Sinyal risiko AI membantu review, tetapi keputusan final tetap di petugas koperasi."
              )}
            </p>
          </article>
        </div>
      </section>

      <section className="landing-operations-band">
        <div>
          <p className="eyebrow">{t(language, "For reviewers", "Untuk reviewer")}</p>
          <h2>{t(language, "The officer workspace is available after the member story is clear.", "Ruang petugas tersedia setelah cerita anggota jelas.")}</h2>
          <p>
            {t(
              language,
              "This keeps the public first impression focused on real users, while still proving the admin review, rescoring, decision note, and timeline workflow.",
              "Ini membuat first impression public fokus ke user nyata, tetapi tetap membuktikan workflow review admin, rescoring, catatan keputusan, dan timeline."
            )}
          </p>
        </div>
        <button className="secondary-action landing-action" type="button" onClick={onOpenAdmin}>
          {copy.openAdmin}
          <LayoutDashboard aria-hidden="true" size={18} />
        </button>
      </section>
    </section>
  );
}
