import type { AppLanguage, LocalizedText } from "./types";

export const systemWorkflowSteps: Array<{ title: LocalizedText; copy: LocalizedText }> = [
  {
    title: { en: "1. Member submits the form", id: "1. Anggota mengisi form" },
    copy: {
      en: "The form stores identity, phone, income, requested amount, tenor, business duration, family size, children, and collateral.",
      id: "Form menyimpan identitas, nomor telepon, pendapatan, nominal pengajuan, tenor, lama usaha, jumlah keluarga, anak, dan agunan."
    }
  },
  {
    title: { en: "2. Backend validates and stores", id: "2. Backend validasi dan simpan" },
    copy: {
      en: "The fullstack backend checks the input rules, creates an application ID, and stores the application record.",
      id: "Backend fullstack mengecek aturan input, membuat ID pengajuan, lalu menyimpan data pengajuan."
    }
  },
  {
    title: { en: "3. Backend builds 19 ML request fields", id: "3. Backend membuat 19 field ML" },
    copy: {
      en: "Product fields are translated into the request contract expected by the KoopCare MLOps Credit Scoring API.",
      id: "Field produk diterjemahkan menjadi kontrak request yang dibutuhkan KoopCare MLOps Credit Scoring API."
    }
  },
  {
    title: { en: "4. MLOps API builds 25 model columns", id: "4. MLOps API membuat 25 kolom model" },
    copy: {
      en: "The MLOps service derives age, debt ratio, payment rate, and proxy score summaries before calling XGBoost.",
      id: "Service MLOps membuat umur, rasio utang, payment rate, dan ringkasan proxy score sebelum memanggil XGBoost."
    }
  },
  {
    title: { en: "5. AI result is saved as advice", id: "5. Hasil AI disimpan sebagai saran" },
    copy: {
      en: "The recommendation, default risk, confidence, eligibility score, model name, and source are stored with the application.",
      id: "Rekomendasi, risiko default, confidence, eligibility score, nama model, dan sumber scoring disimpan bersama pengajuan."
    }
  },
  {
    title: { en: "6. Officer makes the final decision", id: "6. Petugas membuat keputusan final" },
    copy: {
      en: "Admin officers still approve or reject manually and must write a decision reason for the audit trail.",
      id: "Petugas admin tetap approve atau reject secara manual dan wajib menulis alasan keputusan untuk audit trail."
    }
  }
];

export const homeCopy: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    lede: string;
    startApplication: string;
    openAdmin: string;
    proofAi: string;
    proofHuman: string;
    proofPublic: string;
    officerReview: string;
    activeCases: string;
    liveDemo: string;
    averageEligibility: string;
    lowRisk: string;
    mediumRisk: string;
    highRisk: string;
    flowMember: string;
    flowApi: string;
    flowMl: string;
    flowOfficer: string;
  }
> = {
  en: {
    eyebrow: "AI-assisted cooperative financing",
    title: "KoopCare helps members apply and helps officers decide with clearer risk signals.",
    lede:
      "A clean public demo for the core KoopCare workflow: members submit financing requests, the backend calls the ML scoring service, and cooperative officers keep the final decision.",
    startApplication: "Start Member Application",
    openAdmin: "Open Admin Workspace",
    proofAi: "Backend-owned AI calls",
    proofHuman: "Human final decision",
    proofPublic: "Public demo ready",
    officerReview: "Officer review",
    activeCases: "active cases",
    liveDemo: "Live demo",
    averageEligibility: "Average eligibility",
    lowRisk: "Low risk",
    mediumRisk: "Medium",
    highRisk: "High risk",
    flowMember: "Member Form",
    flowApi: "API",
    flowMl: "ML",
    flowOfficer: "Officer"
  },
  id: {
    eyebrow: "Pembiayaan koperasi dengan bantuan AI",
    title: "KoopCare membantu anggota mengajukan pembiayaan dan membantu petugas membaca sinyal risiko.",
    lede:
      "Demo public ini menampilkan alur utama KoopCare: anggota mengisi pengajuan, backend meminta scoring ML, lalu petugas koperasi tetap membuat keputusan final.",
    startApplication: "Mulai Pengajuan Anggota",
    openAdmin: "Buka Admin",
    proofAi: "AI dipanggil dari backend",
    proofHuman: "Keputusan final oleh manusia",
    proofPublic: "Demo public siap",
    officerReview: "Review petugas",
    activeCases: "kasus aktif",
    liveDemo: "Demo live",
    averageEligibility: "Rata-rata eligibility",
    lowRisk: "Risiko rendah",
    mediumRisk: "Sedang",
    highRisk: "Risiko tinggi",
    flowMember: "Form Anggota",
    flowApi: "API",
    flowMl: "ML",
    flowOfficer: "Petugas"
  }
};

export const systemCopy: Record<
  AppLanguage,
  {
    pageEyebrow: string;
    pageTitle: string;
    pageDescription: string;
    loaded: string;
    loading: string;
    metricStorage: string;
    metricStorageCaption: string;
    metricMlApi: string;
    metricScoring: string;
    metricWebApp: string;
    metricWebCaptionReady: string;
    metricWebCaptionDev: string;
    metricAuth: string;
    metricAuthCaption: string;
    metricApiUrl: string;
    architectureEyebrow: string;
    architectureTitle: string;
    architectureDescription: string;
    flowMember: string;
    flowBackend: string;
    flowMl: string;
    flowOfficer: string;
    workflowEyebrow: string;
    workflowTitle: string;
    workflowDescription: string;
    featureEyebrow: string;
    featureTitle: string;
    featureDescription: string;
    verifiedBadge: string;
    countProduct: string;
    countProductCaption: string;
    countRequest: string;
    countRequestCaption: string;
    countModel: string;
    countModelCaption: string;
    mappingNote: string;
    mappingCaption: string;
    requestFieldHeader: string;
    sourceHeader: string;
    mappingHeader: string;
    impactHeader: string;
    derivedEyebrow: string;
    derivedTitle: string;
    derivedDescription: string;
    engineeredBadge: string;
  }
> = {
  en: {
    pageEyebrow: "System readiness",
    pageTitle: "Backend-owned ML integration",
    pageDescription: "The product frontend talks to the Express API. The API owns validation, storage, and ML service calls.",
    loaded: "Loaded",
    loading: "Loading",
    metricStorage: "Storage",
    metricStorageCaption: "Current MVP persistence",
    metricMlApi: "ML API",
    metricScoring: "Scoring Mode",
    metricWebApp: "Web App",
    metricWebCaptionReady: "Build output available",
    metricWebCaptionDev: "Development mode",
    metricAuth: "Auth",
    metricAuthCaption: "Member/admin action gate",
    metricApiUrl: "API URL",
    architectureEyebrow: "Architecture",
    architectureTitle: "Safe product boundary",
    architectureDescription:
      "The browser never calls the ML service directly. This keeps mapping, validation, storage, and business rules inside the backend where they can be reviewed and audited.",
    flowMember: "Member Web",
    flowBackend: "Fullstack API",
    flowMl: "MLOps API",
    flowOfficer: "Officer Review",
    workflowEyebrow: "Real workflow",
    workflowTitle: "What actually happens after a member submits",
    workflowDescription:
      "This is the practical flow reviewers can follow from public form, backend storage, trained ML scoring, admin review, and member status.",
    featureEyebrow: "Feature mapping",
    featureTitle: "From 19 request fields to 25 model columns",
    featureDescription:
      "The member form stays product-friendly. The backend translates it into the MLOps API request, then the FastAPI service builds the exact XGBoost feature columns expected by `best_model.pkl`.",
    verifiedBadge: "Public ML path verified",
    countProduct: "Product form",
    countProductCaption: "member/admin workflow data",
    countRequest: "MLOps request",
    countRequestCaption: "payload sent to MLOps API",
    countModel: "Model frame",
    countModelCaption: "XGBoost artifact contract",
    mappingNote:
      "Identity and workflow fields such as applicant name, phone number, business type, and purpose are stored for review, but they are not sent directly to the model. Some model fields are temporary prototype defaults until KoopCare retrains a BMT-native model.",
    mappingCaption: "Fullstack backend payload mapping into MLOps API request fields",
    requestFieldHeader: "MLOps request field",
    sourceHeader: "Source in fullstack app",
    mappingHeader: "Mapping rule",
    impactHeader: "MLOps model column impact",
    derivedEyebrow: "Derived columns",
    derivedTitle: "Why 19 becomes 25",
    derivedDescription:
      "The MLOps API keeps most raw request fields, drops raw `DAYS_BIRTH` after converting it to age, and adds seven engineered columns before the model predicts default risk.",
    engineeredBadge: "7 engineered columns"
  },
  id: {
    pageEyebrow: "Kesiapan sistem",
    pageTitle: "Integrasi ML dikendalikan oleh backend",
    pageDescription:
      "Frontend produk berbicara ke API fullstack. API ini yang mengurus validasi, penyimpanan, dan pemanggilan service ML.",
    loaded: "Siap",
    loading: "Memuat",
    metricStorage: "Penyimpanan",
    metricStorageCaption: "Penyimpanan MVP saat ini",
    metricMlApi: "API ML",
    metricScoring: "Mode Scoring",
    metricWebApp: "Web App",
    metricWebCaptionReady: "Build web tersedia",
    metricWebCaptionDev: "Mode development",
    metricAuth: "Auth",
    metricAuthCaption: "Gate aksi anggota/admin",
    metricApiUrl: "URL API",
    architectureEyebrow: "Arsitektur",
    architectureTitle: "Batas produk yang aman",
    architectureDescription:
      "Browser tidak memanggil service ML secara langsung. Mapping field, validasi, penyimpanan, dan aturan bisnis tetap berada di backend agar bisa diaudit.",
    flowMember: "Web Anggota",
    flowBackend: "API Fullstack",
    flowMl: "API MLOps",
    flowOfficer: "Review Petugas",
    workflowEyebrow: "Workflow nyata",
    workflowTitle: "Apa yang terjadi setelah anggota submit",
    workflowDescription:
      "Ini alur praktis yang bisa diikuti reviewer: form publik, penyimpanan backend, scoring ML terlatih, review admin, lalu status anggota.",
    featureEyebrow: "Mapping fitur",
    featureTitle: "Dari 19 field request menjadi 25 kolom model",
    featureDescription:
      "Form anggota dibuat tetap sederhana. Backend menerjemahkannya menjadi request untuk API MLOps, lalu service FastAPI membuat kolom XGBoost yang dibutuhkan `best_model.pkl`.",
    verifiedBadge: "Jalur ML public sudah verified",
    countProduct: "Form produk",
    countProductCaption: "data workflow anggota/admin",
    countRequest: "Request MLOps",
    countRequestCaption: "payload yang dikirim ke API MLOps",
    countModel: "Frame model",
    countModelCaption: "kontrak artifact XGBoost",
    mappingNote:
      "Field identitas dan workflow seperti nama pemohon, nomor telepon, jenis usaha, dan tujuan pengajuan disimpan untuk review, tetapi tidak dikirim langsung ke model. Beberapa field model masih default/proxy sementara sampai KoopCare melakukan retraining model BMT-native.",
    mappingCaption: "Mapping payload backend fullstack ke request API MLOps",
    requestFieldHeader: "Field request MLOps",
    sourceHeader: "Sumber di aplikasi fullstack",
    mappingHeader: "Aturan mapping",
    impactHeader: "Dampak ke kolom model MLOps",
    derivedEyebrow: "Kolom turunan",
    derivedTitle: "Kenapa 19 menjadi 25",
    derivedDescription:
      "API MLOps mempertahankan sebagian besar field mentah, membuang `DAYS_BIRTH` setelah mengubahnya menjadi umur, lalu menambahkan tujuh kolom engineered sebelum model memprediksi risiko default.",
    engineeredBadge: "7 kolom engineered"
  }
};
