import { businessTypeOptions } from "./config";
import type { AiAssessment, AppLanguage, ApplicationFormState, ApplicationStatus, DemoSummary } from "./types";

export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

export const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function t(language: AppLanguage, en: string, id: string) {
  return language === "id" ? id : en;
}

export function formatStatus(value: string, language: AppLanguage = "en") {
  const localizedStatus: Partial<Record<ApplicationStatus, Record<AppLanguage, string>>> = {
    SUBMITTED: { en: "Submitted", id: "Diajukan" },
    UNDER_REVIEW: { en: "Under Review", id: "Dalam Review" },
    APPROVED: { en: "Approved", id: "Disetujui" },
    REJECTED: { en: "Rejected", id: "Ditolak" }
  };
  const mapped = localizedStatus[value as ApplicationStatus];

  if (mapped) {
    return mapped[language];
  }

  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatRiskLevel(risk: AiAssessment["riskLevel"] | undefined, language: AppLanguage = "en") {
  if (risk === "LOW") {
    return language === "id" ? "Rendah" : "Low";
  }

  if (risk === "MEDIUM") {
    return language === "id" ? "Sedang" : "Medium";
  }

  if (risk === "HIGH") {
    return language === "id" ? "Tinggi" : "High";
  }

  return language === "id" ? "Menunggu" : "Pending";
}

export function formatRecommendation(value: AiAssessment["aiRecommendation"] | undefined, language: AppLanguage = "en") {
  if (!value) {
    return language === "id" ? "Belum discoring" : "Not scored";
  }

  if (value === "TIDAK_LAYAK") {
    return language === "id" ? "TIDAK LAYAK" : "NOT ELIGIBLE";
  }

  return language === "id" ? "LAYAK" : "ELIGIBLE";
}

export function formatBusinessType(value: string, language: AppLanguage = "en") {
  return businessTypeOptions.find((option) => option.value === value)?.label[language] ?? value;
}

export function formatGender(value: ApplicationFormState["gender"], language: AppLanguage = "en") {
  if (value === "F") {
    return language === "id" ? "Perempuan" : "Female";
  }

  return language === "id" ? "Laki-laki" : "Male";
}

export function formatCollateral(value: boolean, language: AppLanguage = "en") {
  return value ? t(language, "Available", "Ada") : t(language, "Not available", "Tidak ada");
}

export function formatYesNo(value: boolean, language: AppLanguage = "en") {
  return value ? t(language, "Yes", "Ya") : t(language, "No", "Tidak");
}

export function formatTenor(months: number, language: AppLanguage = "en") {
  return language === "id" ? `${months} bulan` : `${months} months`;
}

export function formatAge(years: number, language: AppLanguage = "en") {
  return language === "id" ? `${years} tahun` : `${years} years`;
}

export function formatMembers(count: number, language: AppLanguage = "en") {
  return language === "id" ? `${count} orang` : `${count} members`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function statusTone(status: ApplicationStatus) {
  if (status === "APPROVED") {
    return "positive";
  }

  if (status === "REJECTED") {
    return "danger";
  }

  if (status === "UNDER_REVIEW") {
    return "warning";
  }

  return "neutral";
}

export function riskTone(risk?: AiAssessment["riskLevel"]) {
  if (risk === "LOW") {
    return "positive";
  }

  if (risk === "HIGH") {
    return "danger";
  }

  if (risk === "MEDIUM") {
    return "warning";
  }

  return "neutral";
}

export function recommendationTone(recommendation?: AiAssessment["aiRecommendation"]) {
  if (!recommendation) {
    return "neutral";
  }

  return recommendation === "LAYAK" ? "positive" : "danger";
}

export function sourceTone(source?: AiAssessment["source"]) {
  return source === "ml_api" ? "positive" : "warning";
}

export function formatAssessmentSource(source?: AiAssessment["source"], language: AppLanguage = "en") {
  if (source === "ml_api") {
    return language === "id" ? "API ML Terlatih" : "Trained ML API";
  }

  if (source === "demo_rule_based_fallback") {
    return language === "id" ? "Fallback aktif" : "Fallback active";
  }

  return language === "id" ? "Belum discoring" : "Not scored";
}

export function formatScoringMode(mode?: DemoSummary["integration"]["ml_scoring_mode"], language: AppLanguage = "en") {
  if (mode === "strict_ml") {
    return "Strict ML";
  }

  return language === "id" ? "Fallback boleh" : "Fallback allowed";
}

export function formatMlIntegration(value?: string, language: AppLanguage = "en") {
  if (value === "strict_ml_required") {
    return language === "id" ? "ML wajib" : "Strict required";
  }

  if (value === "optional_with_fallback") {
    return language === "id" ? "Fallback opsional" : "Optional fallback";
  }

  return value ?? "loading";
}

export function formatStorageMode(value?: string, language: AppLanguage = "en") {
  if (value === "json_file_storage") {
    return language === "id" ? "File JSON" : "JSON file";
  }

  return value ?? "loading";
}

export function formatWebAppMode(value?: DemoSummary["integration"]["web_app"], language: AppLanguage = "en") {
  if (value === "served_by_api") {
    return language === "id" ? "Satu service public" : "Single public service";
  }

  if (value === "separate_web_server") {
    return language === "id" ? "Server web terpisah" : "Separate web server";
  }

  return "loading";
}

function isLocalHostname(hostname?: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1";
}

function isPublicBrowserRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.protocol.startsWith("http") && !isLocalHostname(window.location.hostname);
}

function isLocalServiceUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return isLocalHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function formatMlApiTargetCaption(value?: string, language: AppLanguage = "en") {
  if (!value) {
    return language === "id" ? "Mengecek target" : "Checking target";
  }

  if (isPublicBrowserRuntime() && isLocalServiceUrl(value)) {
    return language === "id" ? "API ML public belum dikonfigurasi" : "No public ML API configured yet";
  }

  return value;
}

export function formatScoringModeCaption(summary: DemoSummary | null, language: AppLanguage = "en") {
  if (summary?.integration.ml_api === "ready") {
    return language === "id"
      ? "Scoring model terlatih tersedia; fallback tetap diberi label jika dipakai"
      : "Trained scoring available; fallback stays labeled if needed";
  }

  if (summary?.integration.ml_scoring_mode === "strict_ml") {
    return language === "id"
      ? "Request akan gagal dengan jelas jika API ML tidak tersedia"
      : "Requests fail clearly if the ML API is unavailable";
  }

  return language === "id"
    ? "Fallback tetap diberi label sampai scoring terlatih bisa diakses"
    : "Fallback remains labeled until trained scoring is reachable";
}

export function fallbackScoringMessage(summary: DemoSummary | null, language: AppLanguage = "en") {
  const mlApiBaseUrl = summary?.integration.ml_api_base_url;

  if (isPublicBrowserRuntime() && isLocalServiceUrl(mlApiBaseUrl)) {
    return language === "id"
      ? "API MLOps Python terlatih belum bisa dijangkau dari service public ini, jadi demo public memakai fallback scoring yang diberi label jelas. Deploy API MLOps dan isi ML_API_BASE_URL di Railway untuk mengaktifkan jalur model terlatih."
      : "The trained Python MLOps API is not deployed or reachable from this public service yet, so this public demo is using clearly labeled fallback scoring. Deploy the MLOps API and set ML_API_BASE_URL on Railway to activate the trained model path.";
  }

  return language === "id"
    ? `API MLOps Python belum mengembalikan score, jadi demo workflow memakai fallback scoring yang diberi label jelas. Hubungkan API MLOps di ${mlApiBaseUrl ?? "URL API ML yang dikonfigurasi"} untuk mengaktifkan jalur model terlatih.`
    : `The Python MLOps API is not currently returning scores, so this workflow demo is using clearly labeled fallback scoring. Start or connect the MLOps API at ${mlApiBaseUrl ?? "the configured ML API URL"} to activate the trained model path.`;
}

export function formatAuthMode(value?: string, language: AppLanguage = "en") {
  if (value === "demo_mode") {
    return language === "id" ? "Mode demo" : "Demo mode";
  }

  return value ?? "loading";
}

export function normalizeMoneyValue(
  value: number,
  rule: {
    min: number;
    max: number;
    step: number;
  }
) {
  if (!Number.isFinite(value)) {
    return rule.min;
  }

  const clamped = Math.min(Math.max(Math.round(value), rule.min), rule.max);

  return Math.round(clamped / rule.step) * rule.step;
}

export function formatMoneyHint(rule: { min: number; max: number; step: number }, language: AppLanguage = "en") {
  return language === "id"
    ? `${currencyFormatter.format(rule.min)} sampai ${currencyFormatter.format(rule.max)}, kelipatan ${currencyFormatter.format(rule.step)}.`
    : `${currencyFormatter.format(rule.min)} to ${currencyFormatter.format(rule.max)}, increments of ${currencyFormatter.format(rule.step)}.`;
}
