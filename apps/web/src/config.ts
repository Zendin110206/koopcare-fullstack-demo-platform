import type { ApplicationFormState, LocalizedText } from "./types";

type BusinessTypeOption = {
  value: ApplicationFormState["businessType"];
  label: LocalizedText;
};

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredBaseUrl === "string") {
    return configuredBaseUrl.trim().replace(/\/$/, "");
  }

  return import.meta.env.DEV ? "http://localhost:5002" : "";
}

function resolveDemoPassword(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export const apiBaseUrl = resolveApiBaseUrl();
export const apiDisplayUrl = apiBaseUrl.length > 0 ? apiBaseUrl : "Same origin";
export const demoCredentials = {
  admin: {
    password: resolveDemoPassword(import.meta.env.VITE_DEMO_ADMIN_PASSWORD, "admin-demo-2026"),
    role: "admin"
  },
  member: {
    password: resolveDemoPassword(import.meta.env.VITE_DEMO_MEMBER_PASSWORD, "member-demo-2026"),
    role: "member"
  }
} as const;

export const moneyRules = {
  monthlyIncome: {
    min: 500000,
    max: 100000000,
    step: 100000
  },
  requestedAmount: {
    min: 500000,
    max: 100000000,
    step: 500000
  }
} as const;

export const initialForm: ApplicationFormState = {
  applicantName: "Siti Aminah",
  phoneNumber: "081234567001",
  gender: "F",
  age: 36,
  businessType: "Grocery microbusiness",
  monthlyIncome: 6500000,
  requestedAmount: 8000000,
  tenorMonths: 10,
  purpose: "Modal kerja untuk menambah stok warung sebelum siklus pasar berikutnya.",
  yearsInBusiness: 4,
  existingLoanCount: 0,
  familyMembers: 4,
  children: 2,
  hasCollateral: true
};

export const businessTypeOptions: BusinessTypeOption[] = [
  { value: "Grocery microbusiness", label: { en: "Grocery microbusiness", id: "Usaha warung/sembako" } },
  { value: "Equipment repair service", label: { en: "Equipment repair service", id: "Jasa perbaikan alat" } },
  { value: "Home food production", label: { en: "Home food production", id: "Produksi makanan rumahan" } },
  { value: "Tailoring service", label: { en: "Tailoring service", id: "Jasa jahit" } }
];
