import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useState } from "react";

import { demoCredentials } from "../config";
import { t } from "../formatters";
import type { AppLanguage, AuthRole } from "../types";

type AuthMode = "login" | "create";

export function LoginView({
  isSubmitting,
  language,
  preferredRole,
  onCancel,
  onLogin
}: {
  isSubmitting: boolean;
  language: AppLanguage;
  preferredRole: AuthRole;
  onCancel: () => void;
  onLogin: (role: AuthRole, password: string) => void;
}) {
  const [role, setRole] = useState<AuthRole>(preferredRole);
  const [mode, setMode] = useState<AuthMode>(preferredRole === "admin" ? "login" : "create");
  const [displayName, setDisplayName] = useState("Bang Arif");
  const [email, setEmail] = useState("arif.member@koopcare.demo");
  const [password, setPassword] = useState<string>(demoCredentials[preferredRole].password);

  useEffect(() => {
    setRole(preferredRole);
    setMode(preferredRole === "admin" ? "login" : "create");
    setPassword(demoCredentials[preferredRole].password);
  }, [preferredRole]);

  function chooseRole(nextRole: AuthRole) {
    setRole(nextRole);
    setMode(nextRole === "admin" ? "login" : mode);
    setPassword(demoCredentials[nextRole].password);
  }

  const isOfficer = role === "admin";

  return (
    <section className="auth-standalone-page">
      <header className="auth-standalone-header">
        <button className="brand-mark auth-brand" type="button" onClick={onCancel}>
          <span className="brand-logo">
            <Building2 aria-hidden="true" size={20} />
          </span>
          <span>
            <strong>KoopCare</strong>
            <small>{t(language, "Member financing", "Pembiayaan anggota")}</small>
          </span>
        </button>
        <button className="ghost-back-button" type="button" onClick={onCancel}>
          <ArrowLeft aria-hidden="true" size={17} />
          {t(language, "Back to landing", "Kembali ke landing")}
        </button>
      </header>

      <div className="auth-standalone-grid">
        <section className="auth-story-panel" aria-label={t(language, "Account value", "Nilai akun")}>
          <div className="landing-kicker">
            <BadgeCheck aria-hidden="true" size={16} />
            <span>{t(language, "Secure demo access", "Akses demo aman")}</span>
          </div>
          <h1>
            {isOfficer
              ? t(language, "Officer review starts from a controlled access point.", "Review petugas dimulai dari akses yang terkontrol.")
              : t(language, "Create access before submitting financing.", "Buat akses sebelum mengirim pengajuan pembiayaan.")}
          </h1>
          <p className="auth-story-lede">
            {isOfficer
              ? t(
                  language,
                  "Reviewer access is separated from the member journey so the public demo does not feel like an open admin dashboard.",
                  "Akses reviewer dipisahkan dari perjalanan anggota supaya demo public tidak terasa seperti dashboard admin terbuka."
                )
              : t(
                  language,
                  "A member gets a clearer path: account access, guided application, ML-assisted review, then private status tracking.",
                  "Anggota mendapat alur yang lebih jelas: akses akun, pengajuan terpandu, review berbantuan ML, lalu pelacakan status privat."
                )}
          </p>

          <div className="auth-story-steps">
            <div>
              <span>
                <UserRound aria-hidden="true" size={17} />
              </span>
              <strong>{t(language, "Member identity", "Identitas anggota")}</strong>
              <p>{t(language, "Clear account entry before application data is stored.", "Akses akun jelas sebelum data pengajuan disimpan.")}</p>
            </div>
            <div>
              <span>
                <Smartphone aria-hidden="true" size={17} />
              </span>
              <strong>{t(language, "App-like flow", "Alur seperti aplikasi")}</strong>
              <p>{t(language, "Short choices, clear copy, and no technical clutter.", "Pilihan pendek, copy jelas, dan tanpa kerumitan teknis.")}</p>
            </div>
            <div>
              <span>
                <LockKeyhole aria-hidden="true" size={17} />
              </span>
              <strong>{t(language, "Private status", "Status privat")}</strong>
              <p>{t(language, "Application status uses ID plus access code.", "Status pengajuan memakai ID plus kode akses.")}</p>
            </div>
          </div>
        </section>

        <section className="auth-card-panel" aria-label={t(language, "Demo sign in", "Masuk demo")}>
          <div className="auth-panel-heading">
            <span className="badge positive">
              <ShieldCheck aria-hidden="true" size={16} />
              {isOfficer ? t(language, "Reviewer mode", "Mode reviewer") : t(language, "Member mode", "Mode anggota")}
            </span>
            <h2>{isOfficer ? t(language, "Officer access", "Akses petugas") : t(language, "Member account", "Akun anggota")}</h2>
            <p>
              {t(
                language,
                "This is still a demo gate, not production authentication. It is designed to make the public prototype feel like a real product flow.",
                "Ini masih gate demo, bukan authentication production. Tujuannya agar prototipe public terasa seperti alur produk sungguhan."
              )}
            </p>
          </div>

          {!isOfficer ? (
            <div className="auth-mode-tabs" aria-label={t(language, "Account mode", "Mode akun")}>
              <button aria-pressed={mode === "create"} className={mode === "create" ? "active" : ""} type="button" onClick={() => setMode("create")}>
                {t(language, "Create account", "Buat akun")}
              </button>
              <button aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
                {t(language, "Log in", "Masuk")}
              </button>
            </div>
          ) : null}

          {!isOfficer ? (
            <>
              <button className="social-login-button" disabled={isSubmitting} type="button" onClick={() => onLogin("member", demoCredentials.member.password)}>
                <span aria-hidden="true">G</span>
                {isSubmitting ? t(language, "Signing in...", "Sedang masuk...") : t(language, "Continue with Google (demo)", "Lanjut dengan Google (demo)")}
              </button>
              <div className="auth-divider">
                <span>{t(language, "or continue with demo profile", "atau lanjut dengan profil demo")}</span>
              </div>
            </>
          ) : null}

          {!isOfficer && mode === "create" ? (
            <div className="auth-basic-grid">
              <label className="auth-field">
                <span>{t(language, "Full name", "Nama lengkap")}</span>
                <div>
                  <UserRound aria-hidden="true" size={18} />
                  <input autoComplete="name" value={displayName} type="text" onChange={(event) => setDisplayName(event.target.value)} />
                </div>
              </label>
              <label className="auth-field">
                <span>{t(language, "Email", "Email")}</span>
                <div>
                  <Mail aria-hidden="true" size={18} />
                  <input autoComplete="email" value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
                </div>
              </label>
            </div>
          ) : null}

          <label className="auth-field">
            <span>{isOfficer ? t(language, "Officer demo password", "Password demo petugas") : t(language, "Demo password", "Password demo")}</span>
            <div>
              <KeyRound aria-hidden="true" size={18} />
              <input autoComplete="off" value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
            </div>
          </label>

          <button className="primary-action auth-submit-button" disabled={isSubmitting} type="button" onClick={() => onLogin(role, password)}>
            {isSubmitting
              ? t(language, "Signing in...", "Sedang masuk...")
              : isOfficer
                ? t(language, "Enter officer workspace", "Masuk ruang petugas")
                : mode === "create"
                  ? t(language, "Create demo account", "Buat akun demo")
                  : t(language, "Log in as member", "Masuk sebagai anggota")}
            <ArrowRight aria-hidden="true" size={18} />
          </button>

          <div className="auth-security-note">
            <Sparkles aria-hidden="true" size={18} />
            <p>
              {t(
                language,
                "Google and account registration are simulated for this public prototype. Real OAuth comes with the production authentication milestone.",
                "Google dan registrasi akun masih disimulasikan untuk prototipe public ini. OAuth sungguhan masuk milestone production authentication."
              )}
            </p>
          </div>

          <div className="officer-access-strip">
            <div>
              <strong>{isOfficer ? t(language, "Back to member flow", "Kembali ke alur anggota") : t(language, "Reviewer access", "Akses reviewer")}</strong>
              <span>
                {isOfficer
                  ? t(language, "Switch back before testing member application.", "Kembali sebelum mencoba pengajuan anggota.")
                  : t(language, "Only use this when reviewing applications.", "Pakai ini hanya saat mereview pengajuan.")}
              </span>
            </div>
            <button type="button" onClick={() => chooseRole(isOfficer ? "member" : "admin")}>
              {isOfficer ? t(language, "Use member account", "Pakai akun anggota") : t(language, "Officer login", "Login petugas")}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
