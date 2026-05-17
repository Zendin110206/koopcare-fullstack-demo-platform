import { KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { demoCredentials } from "../config";
import { t } from "../formatters";
import type { AppLanguage, AuthRole } from "../types";

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
  const [password, setPassword] = useState<string>(demoCredentials[preferredRole].password);

  useEffect(() => {
    setRole(preferredRole);
    setPassword(demoCredentials[preferredRole].password);
  }, [preferredRole]);

  function chooseRole(nextRole: AuthRole) {
    setRole(nextRole);
    setPassword(demoCredentials[nextRole].password);
  }

  return (
    <section className="view-stack auth-view">
      <section className="page-intro auth-intro">
        <div>
          <p className="eyebrow">{t(language, "Demo access", "Akses demo")}</p>
          <h1>{t(language, "Choose the workspace role first.", "Pilih role workspace dulu.")}</h1>
          <p>
            {t(
              language,
              "This public demo now separates member submission actions from officer review actions. It is still a demo gate, not production account security.",
              "Demo public ini sekarang memisahkan aksi anggota dan aksi petugas. Ini masih gate demo, bukan keamanan akun production."
            )}
          </p>
        </div>
        <span className="badge positive">
          <ShieldCheck aria-hidden="true" size={16} />
          {t(language, "Role gate active", "Role gate aktif")}
        </span>
      </section>

      <section className="auth-layout">
        <div className="auth-panel">
          <div className="auth-role-grid" aria-label={t(language, "Demo role", "Role demo")}>
            <button
              aria-pressed={role === "member"}
              className={role === "member" ? "auth-role-card active" : "auth-role-card"}
              type="button"
              onClick={() => chooseRole("member")}
            >
              <UserRound aria-hidden="true" size={22} />
              <strong>{t(language, "Member", "Anggota")}</strong>
              <span>{t(language, "Submit financing applications", "Mengirim pengajuan pembiayaan")}</span>
            </button>
            <button
              aria-pressed={role === "admin"}
              className={role === "admin" ? "auth-role-card active" : "auth-role-card"}
              type="button"
              onClick={() => chooseRole("admin")}
            >
              <ShieldCheck aria-hidden="true" size={22} />
              <strong>{t(language, "Officer Admin", "Petugas Admin")}</strong>
              <span>{t(language, "Rescore and save decisions", "Rescore dan simpan keputusan")}</span>
            </button>
          </div>

          <label className="auth-field">
            <span>{t(language, "Demo password", "Password demo")}</span>
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
              <LogIn aria-hidden="true" size={18} />
              {isSubmitting ? t(language, "Signing in...", "Sedang masuk...") : t(language, "Enter Workspace", "Masuk Workspace")}
            </button>
            <button className="secondary-action large" disabled={isSubmitting} type="button" onClick={onCancel}>
              {t(language, "Back to Overview", "Kembali ke Ringkasan")}
            </button>
          </div>
        </div>

        <aside className="auth-help-panel">
          <p className="eyebrow">{t(language, "What changed", "Apa yang berubah")}</p>
          <h2>{t(language, "Actions now match the real workflow.", "Aksi sekarang mengikuti workflow asli.")}</h2>
          <ul>
            <li>
              {t(
                language,
                "Members can create applications after member demo login.",
                "Anggota bisa membuat pengajuan setelah login demo anggota."
              )}
            </li>
            <li>
              {t(
                language,
                "Officer actions need the admin demo role.",
                "Aksi petugas membutuhkan role demo admin."
              )}
            </li>
            <li>
              {t(
                language,
                "The AI score is still advice; the officer still owns the final decision.",
                "Score AI tetap saran; keputusan final tetap milik petugas."
              )}
            </li>
          </ul>
        </aside>
      </section>
    </section>
  );
}
