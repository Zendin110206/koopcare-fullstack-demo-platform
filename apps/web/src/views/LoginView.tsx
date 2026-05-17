import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
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

  return (
    <section className="view-stack auth-view">
      <section className="auth-hero-layout">
        <div className="auth-product-panel">
          <button className="ghost-back-button" type="button" onClick={onCancel}>
            <ArrowLeft aria-hidden="true" size={17} />
            {t(language, "Back to home", "Kembali ke beranda")}
          </button>
          <p className="eyebrow">{t(language, "Member access", "Akses anggota")}</p>
          <h1>{t(language, "Start your cooperative financing journey.", "Mulai perjalanan pembiayaan koperasi.")}</h1>
          <p className="auth-lede">
            {t(
              language,
              "Create a demo member account, submit an application, and track the review status with a simpler flow built for non-technical users.",
              "Buat akun demo anggota, kirim pengajuan, lalu cek status review dengan alur yang lebih mudah untuk pengguna awam."
            )}
          </p>

          <div className="auth-preview-list">
            <div>
              <span>
                <CheckCircle2 aria-hidden="true" size={16} />
              </span>
              <div>
                <strong>{t(language, "Guided application", "Pengajuan terpandu")}</strong>
                <p>{t(language, "Plain-language fields before ML scoring.", "Field bahasa sederhana sebelum scoring ML.")}</p>
              </div>
            </div>
            <div>
              <span>
                <LockKeyhole aria-hidden="true" size={16} />
              </span>
              <div>
                <strong>{t(language, "Private status lookup", "Cek status privat")}</strong>
                <p>{t(language, "Application ID plus access code for member view.", "ID pengajuan plus kode akses untuk tampilan anggota.")}</p>
              </div>
            </div>
            <div>
              <span>
                <ShieldCheck aria-hidden="true" size={16} />
              </span>
              <div>
                <strong>{t(language, "Officer remains final", "Petugas tetap final")}</strong>
                <p>{t(language, "AI recommendation is advisory, not an auto-approval.", "Rekomendasi AI hanya saran, bukan auto-approval.")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel auth-signin-panel">
          <div className="auth-panel-heading">
            <span className="badge positive">
              <BadgeCheck aria-hidden="true" size={16} />
              {t(language, "Demo safe mode", "Mode demo aman")}
            </span>
            <h2>{role === "admin" ? t(language, "Officer demo login", "Login demo petugas") : t(language, "Member account", "Akun anggota")}</h2>
            <p>
              {t(
                language,
                "This screen behaves like a real sign-in flow, but it still uses local demo credentials so the public demo stays easy to try.",
                "Layar ini dibuat seperti alur masuk sungguhan, tetapi masih memakai kredensial demo supaya demo public mudah dicoba."
              )}
            </p>
          </div>

          {role === "member" ? (
            <div className="auth-mode-tabs" aria-label={t(language, "Account mode", "Mode akun")}>
              <button aria-pressed={mode === "create"} className={mode === "create" ? "active" : ""} type="button" onClick={() => setMode("create")}>
                {t(language, "Create account", "Buat akun")}
              </button>
              <button aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
                {t(language, "Log in", "Masuk")}
              </button>
            </div>
          ) : null}

          {role === "member" ? (
            <>
              <button className="social-login-button" disabled={isSubmitting} type="button" onClick={() => onLogin("member", demoCredentials.member.password)}>
                <span aria-hidden="true">G</span>
                {isSubmitting ? t(language, "Signing in...", "Sedang masuk...") : t(language, "Continue with Google (demo)", "Lanjut dengan Google (demo)")}
              </button>

              <div className="auth-divider">
                <span>{t(language, "or use demo details", "atau pakai data demo")}</span>
              </div>
            </>
          ) : null}

          {role === "member" && mode === "create" ? (
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
            <span>{role === "admin" ? t(language, "Officer demo password", "Password demo petugas") : t(language, "Demo password", "Password demo")}</span>
            <div>
              <KeyRound aria-hidden="true" size={18} />
              <input
                autoComplete="off"
                value={password}
                type="password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          <div className="auth-actions">
            <button className="primary-action large" disabled={isSubmitting} type="button" onClick={() => onLogin(role, password)}>
              {isSubmitting
                ? t(language, "Signing in...", "Sedang masuk...")
                : role === "admin"
                  ? t(language, "Enter officer workspace", "Masuk ruang petugas")
                  : mode === "create"
                    ? t(language, "Create demo account", "Buat akun demo")
                    : t(language, "Log in as member", "Masuk sebagai anggota")}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button className="secondary-action large" disabled={isSubmitting} type="button" onClick={onCancel}>
              {t(language, "Back", "Kembali")}
            </button>
          </div>

          <div className="officer-access-strip">
            <div>
              <strong>{t(language, "Reviewer access", "Akses reviewer")}</strong>
              <span>{t(language, "Only use this when reviewing applications.", "Pakai ini hanya saat mereview pengajuan.")}</span>
            </div>
            <button type="button" onClick={() => chooseRole(role === "admin" ? "member" : "admin")}>
              {role === "admin" ? t(language, "Use member account", "Pakai akun anggota") : t(language, "Officer login", "Login petugas")}
            </button>
          </div>

          <p className="demo-disclaimer">
            {t(
              language,
              "No real Google account is connected yet. This is a polished demo gate for the current public prototype.",
              "Belum ada akun Google sungguhan yang terhubung. Ini adalah gate demo yang dibuat rapi untuk prototipe public saat ini."
            )}
          </p>
        </div>
      </section>
    </section>
  );
}
