import { Building2, Database, FileCheck2, Home, LayoutDashboard, LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { t } from "../formatters";
import type { AppLanguage, LocalizedText, StoredAuthSession, ViewKey } from "../types";
const views: Array<{ key: ViewKey; label: LocalizedText; icon: ReactNode }> = [
  {
    key: "home",
    label: { en: "Overview", id: "Ringkasan" },
    icon: <Home aria-hidden="true" size={17} />,
  },
  {
    key: "apply",
    label: { en: "Apply", id: "Ajukan" },
    icon: <UserRound aria-hidden="true" size={17} />,
  },
  {
    key: "status",
    label: { en: "Status", id: "Status" },
    icon: <FileCheck2 aria-hidden="true" size={17} />,
  },
  {
    key: "admin",
    label: { en: "Admin", id: "Admin" },
    icon: <LayoutDashboard aria-hidden="true" size={17} />,
  },
  {
    key: "system",
    label: { en: "System", id: "Sistem" },
    icon: <Database aria-hidden="true" size={17} />,
  },
];
export function TopNavigation({
  activeView,
  isLoading,
  language,
  session,
  onLanguageChange,
  onLoginOpen,
  onLogout,
  onRefresh,
  onViewChange,
}: {
  activeView: ViewKey;
  isLoading: boolean;
  language: AppLanguage;
  session: StoredAuthSession | null;
  onLanguageChange: (language: AppLanguage) => void;
  onLoginOpen: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onViewChange: (view: ViewKey) => void;
}) {
  return (
    <header className="topbar">
      <button
        className="brand-mark"
        type="button"
        onClick={() => onViewChange("home")}
      >
        <span className="brand-logo">
          <Building2 aria-hidden="true" size={20} />
        </span>
        <span>
          <strong>KoopCare</strong>
          <small>{t(language, "Fullstack Demo", "Demo Fullstack")}</small>
        </span>
      </button>

      <nav
        className="nav-tabs"
        aria-label={t(language, "Primary navigation", "Navigasi utama")}
      >
        {views.map((item) => (
          <button
            className={activeView === item.key ? "active" : ""}
            key={item.key}
            type="button"
            onClick={() => onViewChange(item.key)}
          >
            {item.icon}
            {item.label[language]}
          </button>
        ))}
      </nav>

      <div
        className="language-toggle"
        aria-label={t(language, "Language selector", "Pilihan bahasa")}
      >
        {(["id", "en"] as const).map((item) => (
          <button
            aria-pressed={language === item}
            className={language === item ? "active" : ""}
            key={item}
            type="button"
            onClick={() => onLanguageChange(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {session ? (
        <button className="account-button" type="button" onClick={onLogout}>
          {session.session.role === "admin" ? <ShieldCheck aria-hidden="true" size={17} /> : <UserRound aria-hidden="true" size={17} />}
          <span>
            <strong>{session.session.role === "admin" ? t(language, "Admin", "Admin") : t(language, "Member", "Anggota")}</strong>
            <small>{t(language, "Sign out", "Keluar")}</small>
          </span>
          <LogOut aria-hidden="true" size={16} />
        </button>
      ) : (
        <button className="account-button" type="button" onClick={onLoginOpen}>
          <UserRound aria-hidden="true" size={17} />
          <span>
            <strong>{t(language, "Login", "Masuk")}</strong>
            <small>{t(language, "Demo role", "Role demo")}</small>
          </span>
        </button>
      )}

      <button
        className="utility-button"
        disabled={isLoading}
        type="button"
        onClick={onRefresh}
      >
        <RefreshCw aria-hidden="true" size={17} />
        {language === "id" ? "Muat ulang" : "Refresh"}
      </button>
    </header>
  );
}
