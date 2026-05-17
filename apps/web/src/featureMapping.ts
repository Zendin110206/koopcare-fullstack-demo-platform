import type { DerivedFeatureRow, MlFeatureMapRow } from "./types";

export const mlFeatureMapRows: MlFeatureMapRow[] = [
  {
    requestField: "code_gender",
    source: "gender",
    mapping: "Direct mapping from member form.",
    modelColumns: "CODE_GENDER"
  },
  {
    requestField: "name_income_type",
    source: "Backend default",
    mapping: "Fixed to Working for this portfolio demo.",
    modelColumns: "NAME_INCOME_TYPE"
  },
  {
    requestField: "name_education_type",
    source: "Backend default",
    mapping: "Fixed to Secondary / secondary special until the public form collects education.",
    modelColumns: "NAME_EDUCATION_TYPE"
  },
  {
    requestField: "name_family_status",
    source: "familyMembers",
    mapping: "More than one family member becomes Married; otherwise Single / not married.",
    modelColumns: "NAME_FAMILY_STATUS"
  },
  {
    requestField: "occupation_type",
    source: "Backend default",
    mapping: "Fixed to Laborers until the public form collects occupation.",
    modelColumns: "OCCUPATION_TYPE"
  },
  {
    requestField: "flag_own_car",
    source: "Backend default",
    mapping: "Fixed to N because the current KoopCare form does not collect car ownership.",
    modelColumns: "FLAG_OWN_CAR"
  },
  {
    requestField: "flag_own_realty",
    source: "hasCollateral",
    mapping: "Collateral is treated as property/realty ownership signal for the prototype contract.",
    modelColumns: "FLAG_OWN_REALTY"
  },
  {
    requestField: "cnt_children",
    source: "children",
    mapping: "Direct mapping from member form.",
    modelColumns: "CNT_CHILDREN"
  },
  {
    requestField: "cnt_fam_members",
    source: "familyMembers",
    mapping: "Direct mapping from member form.",
    modelColumns: "CNT_FAM_MEMBERS"
  },
  {
    requestField: "amt_income_total",
    source: "monthlyIncome",
    mapping: "Monthly cooperative income is sent as total income for this demo contract.",
    modelColumns: "AMT_INCOME_TOTAL, DEBT_TO_INCOME"
  },
  {
    requestField: "amt_credit",
    source: "requestedAmount",
    mapping: "Requested financing amount.",
    modelColumns: "AMT_CREDIT, DEBT_TO_INCOME, PAYMENT_RATE"
  },
  {
    requestField: "amt_annuity",
    source: "requestedAmount, tenorMonths",
    mapping: "Calculated as requestedAmount / tenorMonths, with a minimum value of 1.",
    modelColumns: "AMT_ANNUITY, PAYMENT_RATE"
  },
  {
    requestField: "amt_goods_price",
    source: "requestedAmount",
    mapping: "Mirrors requestedAmount because the demo does not separate goods price and credit amount yet.",
    modelColumns: "AMT_GOODS_PRICE"
  },
  {
    requestField: "days_birth",
    source: "age",
    mapping: "Converted to negative day count: -round(age * 365.25).",
    modelColumns: "AGE_YEARS"
  },
  {
    requestField: "days_employed",
    source: "yearsInBusiness",
    mapping: "Converted to negative day count: -round(yearsInBusiness * 365.25).",
    modelColumns: "DAYS_EMPLOYED, DAYS_EMPLOYED_ANOM"
  },
  {
    requestField: "days_last_phone_change",
    source: "Backend default",
    mapping: "Fixed to -365 until the public form collects phone-history data.",
    modelColumns: "DAYS_LAST_PHONE_CHANGE"
  },
  {
    requestField: "ext_source_1",
    source: "hasCollateral",
    mapping: "Proxy score: 0.62 when collateral exists, otherwise 0.48.",
    modelColumns: "EXT_SOURCE_1, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  },
  {
    requestField: "ext_source_2",
    source: "yearsInBusiness",
    mapping: "Proxy score: clamp(0.42 + yearsInBusiness * 0.025, 0.25, 0.85).",
    modelColumns: "EXT_SOURCE_2, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  },
  {
    requestField: "ext_source_3",
    source: "existingLoanCount",
    mapping: "Proxy score: clamp(0.58 - existingLoanCount * 0.04, 0.25, 0.8).",
    modelColumns: "EXT_SOURCE_3, EXT_SOURCE_MEAN, EXT_SOURCE_MIN, EXT_SOURCE_PROD"
  }
];

export const derivedFeatureRows: DerivedFeatureRow[] = [
  {
    modelColumn: "AGE_YEARS",
    formula: "abs(DAYS_BIRTH) / 365.25",
    reason: "The model expects age in years, not raw negative birth-day counts."
  },
  {
    modelColumn: "DAYS_EMPLOYED_ANOM",
    formula: "DAYS_EMPLOYED == 365243 ? 1 : 0",
    reason: "Keeps the Home Credit anomaly marker before replacing anomalous employment values."
  },
  {
    modelColumn: "EXT_SOURCE_MEAN",
    formula: "mean(ext_source_1..3)",
    reason: "Summarizes the average strength of the proxy/external scores."
  },
  {
    modelColumn: "EXT_SOURCE_MIN",
    formula: "min(ext_source_1..3)",
    reason: "Captures the weakest proxy signal."
  },
  {
    modelColumn: "EXT_SOURCE_PROD",
    formula: "ext_source_1 * ext_source_2 * ext_source_3",
    reason: "Captures combined proxy-score strength."
  },
  {
    modelColumn: "DEBT_TO_INCOME",
    formula: "AMT_CREDIT / (AMT_INCOME_TOTAL + 1)",
    reason: "Estimates financing size relative to income."
  },
  {
    modelColumn: "PAYMENT_RATE",
    formula: "AMT_ANNUITY / (AMT_CREDIT + 1)",
    reason: "Estimates installment burden relative to requested financing."
  }
];

export const featureSourceIdByRequestField: Record<string, string> = {
  code_gender: "gender",
  name_income_type: "Default dari backend",
  name_education_type: "Default dari backend",
  name_family_status: "familyMembers",
  occupation_type: "Default dari backend",
  flag_own_car: "Default dari backend",
  flag_own_realty: "hasCollateral",
  cnt_children: "children",
  cnt_fam_members: "familyMembers",
  amt_income_total: "monthlyIncome",
  amt_credit: "requestedAmount",
  amt_annuity: "requestedAmount, tenorMonths",
  amt_goods_price: "requestedAmount",
  days_birth: "age",
  days_employed: "yearsInBusiness",
  days_last_phone_change: "Default dari backend",
  ext_source_1: "hasCollateral",
  ext_source_2: "yearsInBusiness",
  ext_source_3: "existingLoanCount"
};

export const featureMappingIdByRequestField: Record<string, string> = {
  code_gender: "Langsung dari form anggota.",
  name_income_type: "Sementara diisi Working untuk demo portfolio ini.",
  name_education_type: "Sementara diisi Secondary / secondary special sampai form publik punya field pendidikan.",
  name_family_status: "Jika jumlah keluarga lebih dari satu dianggap Married; selain itu Single / not married.",
  occupation_type: "Sementara diisi Laborers sampai form publik punya field pekerjaan.",
  flag_own_car: "Sementara diisi N karena form KoopCare saat ini belum menanyakan kepemilikan mobil.",
  flag_own_realty: "Agunan dipakai sebagai sinyal kepemilikan properti untuk kontrak prototype.",
  cnt_children: "Langsung dari form anggota.",
  cnt_fam_members: "Langsung dari form anggota.",
  amt_income_total: "Pendapatan bulanan anggota dikirim sebagai total income untuk kontrak demo ini.",
  amt_credit: "Nominal pembiayaan yang diajukan.",
  amt_annuity: "Dihitung dari requestedAmount / tenorMonths, dengan nilai minimum 1.",
  amt_goods_price: "Mengikuti requestedAmount karena demo belum memisahkan harga barang dan nominal pembiayaan.",
  days_birth: "Dihitung dari -round(age * 365.25). Dipakai untuk membuat AGE_YEARS.",
  days_employed: "Dihitung dari -round(yearsInBusiness * 365.25).",
  days_last_phone_change: "Sementara diisi -365 sampai form publik punya riwayat perubahan nomor telepon.",
  ext_source_1: "0.62 jika ada agunan, 0.48 jika tidak ada agunan.",
  ext_source_2: "clamp(0.42 + yearsInBusiness * 0.025, 0.25, 0.85).",
  ext_source_3: "clamp(0.58 - existingLoanCount * 0.04, 0.25, 0.8)."
};

export const derivedReasonIdByModelColumn: Record<string, string> = {
  AGE_YEARS: "Model memakai umur dalam tahun, bukan angka hari lahir mentah yang bernilai negatif.",
  DAYS_EMPLOYED_ANOM: "Menandai nilai anomali dari format dataset Home Credit sebelum nilai itu diganti menjadi kosong.",
  EXT_SOURCE_MEAN: "Merangkum kekuatan tiga proxy/external score.",
  EXT_SOURCE_MIN: "Menangkap sinyal terlemah dari tiga proxy/external score.",
  EXT_SOURCE_PROD: "Menangkap kekuatan gabungan dari semua proxy/external score.",
  DEBT_TO_INCOME: "Mengukur besar pembiayaan dibanding pendapatan.",
  PAYMENT_RATE: "Mengukur beban cicilan dibanding nominal pembiayaan."
};
