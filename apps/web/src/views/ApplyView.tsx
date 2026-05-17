import { ClipboardCheck, Gauge } from "lucide-react";
import { useState } from "react";

import { Badge, Field, FormSection, MiniMetric, ReviewItem, StepBadge } from "../components/ui";
import { businessTypeOptions, moneyRules } from "../config";
import {
  compactNumberFormatter,
  currencyFormatter,
  formatBusinessType,
  formatCollateral,
  formatGender,
  formatMoneyHint,
  formatPercent,
  formatTenor,
  formatYesNo,
  normalizeMoneyValue,
  t
} from "../formatters";
import type { AppLanguage, ApplicationFormState } from "../types";
export function ApplyView({
  affordabilityRatio,
  form,
  installment,
  isSubmitting,
  language,
  onSubmit,
  updateForm,
}: {
  affordabilityRatio: number;
  form: ApplicationFormState;
  installment: number;
  isSubmitting: boolean;
  language: AppLanguage;
  onSubmit: () => void;
  updateForm: <Key extends keyof ApplicationFormState>(
    key: Key,
    value: ApplicationFormState[Key],
  ) => void;
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const affordabilityTone =
    affordabilityRatio <= 0.3
      ? "positive"
      : affordabilityRatio <= 0.5
        ? "warning"
        : "danger";
  const affordabilityLabel =
    affordabilityRatio <= 0.3
      ? t(language, "Healthy", "Sehat")
      : affordabilityRatio <= 0.5
        ? t(language, "Needs review", "Perlu review")
        : t(language, "High pressure", "Beban tinggi");

  function updateAndCloseReview<Key extends keyof ApplicationFormState>(
    key: Key,
    value: ApplicationFormState[Key],
  ) {
    setIsReviewOpen(false);
    updateForm(key, value);
  }

  function normalizeMoneyField(key: "monthlyIncome" | "requestedAmount") {
    const normalized = normalizeMoneyValue(form[key], moneyRules[key]);

    if (normalized !== form[key]) {
      updateAndCloseReview(key, normalized);
    }
  }

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">
            {t(language, "Member portal", "Portal anggota")}
          </p>
          <h1>
            {t(
              language,
              "Apply for cooperative financing",
              "Ajukan pembiayaan koperasi",
            )}
          </h1>
          <p>
            {t(
              language,
              "The demo keeps the form intentionally simple while still collecting enough structured information for the backend scoring workflow.",
              "Form demo dibuat sederhana, tetapi tetap mengumpulkan data terstruktur yang dibutuhkan untuk alur scoring backend.",
            )}
          </p>
        </div>
        <div
          className="stepper"
          aria-label={t(language, "Application steps", "Langkah pengajuan")}
        >
          <StepBadge
            active
            label={t(language, "Profile", "Profil")}
            number="1"
          />
          <StepBadge
            active
            label={t(language, "Financing", "Pembiayaan")}
            number="2"
          />
          <StepBadge
            label={t(language, "Officer Review", "Review Petugas")}
            number="3"
          />
        </div>
      </section>

      <section className="application-layout">
        <form
          className="form-surface"
          onSubmit={(event) => {
            event.preventDefault();
            setIsReviewOpen(true);
          }}
        >
          <FormSection
            description={t(
              language,
              "Basic member details used for identification and model feature mapping.",
              "Data dasar anggota dipakai untuk identifikasi dan mapping fitur model.",
            )}
            eyebrow={t(language, "Step 1", "Langkah 1")}
            title={t(language, "Applicant profile", "Profil pemohon")}
          >
            <Field label={t(language, "Applicant name", "Nama pemohon")}>
              <input
                required
                value={form.applicantName}
                onChange={(event) =>
                  updateAndCloseReview("applicantName", event.target.value)
                }
              />
            </Field>
            <Field label={t(language, "Phone number", "Nomor telepon")}>
              <input
                required
                value={form.phoneNumber}
                onChange={(event) =>
                  updateAndCloseReview("phoneNumber", event.target.value)
                }
              />
            </Field>
            <Field label={t(language, "Gender", "Jenis kelamin")}>
              <select
                value={form.gender}
                onChange={(event) =>
                  updateAndCloseReview(
                    "gender",
                    event.target.value as "M" | "F",
                  )
                }
              >
                <option value="F">{formatGender("F", language)}</option>
                <option value="M">{formatGender("M", language)}</option>
              </select>
            </Field>
            <Field label={t(language, "Age", "Umur")}>
              <input
                min={18}
                max={75}
                required
                type="number"
                value={form.age}
                onChange={(event) =>
                  updateAndCloseReview("age", Number(event.target.value))
                }
              />
            </Field>
          </FormSection>

          <FormSection
            description={t(
              language,
              "Business stability and household size help the demo estimate risk and repayment capacity.",
              "Stabilitas usaha dan jumlah keluarga membantu demo memperkirakan risiko serta kemampuan bayar.",
            )}
            eyebrow={t(language, "Step 2", "Langkah 2")}
            title={t(language, "Business capacity", "Kapasitas usaha")}
          >
            <Field label={t(language, "Business type", "Jenis usaha")}>
              <select
                value={form.businessType}
                onChange={(event) =>
                  updateAndCloseReview("businessType", event.target.value)
                }
              >
                {businessTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[language]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t(language, "Years in business", "Lama usaha")}>
              <input
                min={0}
                max={60}
                required
                type="number"
                value={form.yearsInBusiness}
                onChange={(event) =>
                  updateAndCloseReview(
                    "yearsInBusiness",
                    Number(event.target.value),
                  )
                }
              />
            </Field>
            <Field label={t(language, "Family members", "Jumlah keluarga")}>
              <input
                min={1}
                max={20}
                required
                type="number"
                value={form.familyMembers}
                onChange={(event) =>
                  updateAndCloseReview(
                    "familyMembers",
                    Number(event.target.value),
                  )
                }
              />
            </Field>
            <Field label={t(language, "Children", "Anak")}>
              <input
                min={0}
                max={15}
                required
                type="number"
                value={form.children}
                onChange={(event) =>
                  updateAndCloseReview("children", Number(event.target.value))
                }
              />
            </Field>
          </FormSection>

          <FormSection
            description={t(
              language,
              "The backend uses these values to calculate affordability and build the ML request payload.",
              "Backend memakai nilai ini untuk menghitung affordability dan membuat payload request ML.",
            )}
            eyebrow={t(language, "Step 3", "Langkah 3")}
            title={t(language, "Financing request", "Pengajuan pembiayaan")}
          >
            <Field label={t(language, "Monthly income", "Pendapatan bulanan")}>
              <input
                inputMode="numeric"
                min={moneyRules.monthlyIncome.min}
                max={moneyRules.monthlyIncome.max}
                required
                step={moneyRules.monthlyIncome.step}
                type="number"
                value={form.monthlyIncome}
                onChange={(event) =>
                  updateAndCloseReview(
                    "monthlyIncome",
                    Number(event.target.value),
                  )
                }
                onBlur={() => normalizeMoneyField("monthlyIncome")}
              />
              <small className="field-hint">
                {formatMoneyHint(moneyRules.monthlyIncome, language)}
              </small>
            </Field>
            <Field label={t(language, "Requested amount", "Nominal pengajuan")}>
              <input
                inputMode="numeric"
                min={moneyRules.requestedAmount.min}
                max={moneyRules.requestedAmount.max}
                required
                step={moneyRules.requestedAmount.step}
                type="number"
                value={form.requestedAmount}
                onChange={(event) =>
                  updateAndCloseReview(
                    "requestedAmount",
                    Number(event.target.value),
                  )
                }
                onBlur={() => normalizeMoneyField("requestedAmount")}
              />
              <small className="field-hint">
                {formatMoneyHint(moneyRules.requestedAmount, language)}
              </small>
            </Field>
            <Field label={t(language, "Tenor in months", "Tenor dalam bulan")}>
              <input
                min={1}
                max={36}
                required
                type="number"
                value={form.tenorMonths}
                onChange={(event) =>
                  updateAndCloseReview(
                    "tenorMonths",
                    Number(event.target.value),
                  )
                }
              />
            </Field>
            <Field label={t(language, "Existing loans", "Pinjaman aktif")}>
              <input
                min={0}
                max={20}
                required
                type="number"
                value={form.existingLoanCount}
                onChange={(event) =>
                  updateAndCloseReview(
                    "existingLoanCount",
                    Number(event.target.value),
                  )
                }
              />
            </Field>
            <Field label={t(language, "Collateral", "Agunan")}>
              <select
                value={String(form.hasCollateral)}
                onChange={(event) =>
                  updateAndCloseReview(
                    "hasCollateral",
                    event.target.value === "true",
                  )
                }
              >
                <option value="true">{t(language, "Available", "Ada")}</option>
                <option value="false">
                  {t(language, "Not available", "Tidak ada")}
                </option>
              </select>
            </Field>
            <Field
              label={t(language, "Financing purpose", "Tujuan pembiayaan")}
              wide
            >
              <textarea
                required
                value={form.purpose}
                onChange={(event) =>
                  updateAndCloseReview("purpose", event.target.value)
                }
              />
            </Field>
          </FormSection>

          {isReviewOpen ? (
            <section className="submit-review-panel">
              <div className="submit-review-heading">
                <div>
                  <p className="eyebrow">
                    {t(language, "Final check", "Cek akhir")}
                  </p>
                  <h2>
                    {t(
                      language,
                      "Review before sending to officer workspace",
                      "Review sebelum dikirim ke ruang kerja petugas",
                    )}
                  </h2>
                </div>
                <Badge tone={affordabilityTone}>{affordabilityLabel}</Badge>
              </div>
              <div className="review-grid">
                <ReviewItem
                  label={t(language, "Applicant", "Pemohon")}
                  value={form.applicantName}
                />
                <ReviewItem
                  label={t(language, "Business", "Usaha")}
                  value={formatBusinessType(form.businessType, language)}
                />
                <ReviewItem
                  label={t(language, "Requested", "Pengajuan")}
                  value={currencyFormatter.format(form.requestedAmount)}
                />
                <ReviewItem
                  label={t(language, "Base installment", "Estimasi cicilan")}
                  value={currencyFormatter.format(installment)}
                />
                <ReviewItem
                  label={t(language, "Affordability", "Affordability")}
                  value={formatPercent(affordabilityRatio)}
                />
                <ReviewItem
                  label={t(language, "Collateral", "Agunan")}
                  value={formatCollateral(form.hasCollateral, language)}
                />
              </div>
              <p className="review-note">
                {t(
                  language,
                  "After confirmation, the backend stores this request, calls the MLOps scoring API, and sends the case to the admin workspace for final human review.",
                  "Setelah dikonfirmasi, backend menyimpan pengajuan ini, memanggil API scoring MLOps, lalu mengirim kasus ke admin untuk review final oleh manusia.",
                )}
              </p>
              <div className="submit-review-actions">
                <button
                  className="secondary-action"
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                >
                  {t(language, "Back to edit", "Kembali edit")}
                </button>
                <button
                  className="primary-action"
                  disabled={isSubmitting}
                  type="button"
                  onClick={onSubmit}
                >
                  <ClipboardCheck aria-hidden="true" size={18} />
                  {isSubmitting
                    ? t(
                        language,
                        "Submitting and scoring...",
                        "Mengirim dan scoring...",
                      )
                    : t(language, "Confirm and Submit", "Konfirmasi dan Kirim")}
                </button>
              </div>
            </section>
          ) : null}

          {!isReviewOpen ? (
            <div className="form-actions">
              <button
                className="primary-action submit-action"
                disabled={isSubmitting}
                type="submit"
              >
                <ClipboardCheck aria-hidden="true" size={18} />
                {t(language, "Review Application", "Review Pengajuan")}
              </button>
            </div>
          ) : null}
        </form>

        <aside className="application-summary">
          <div className="summary-hero">
            <span>
              {t(language, "Requested financing", "Nominal pembiayaan")}
            </span>
            <strong>{currencyFormatter.format(form.requestedAmount)}</strong>
            <small>{formatTenor(form.tenorMonths, language)}</small>
          </div>
          <div className="summary-grid">
            <MiniMetric
              label={t(language, "Monthly income", "Pendapatan bulanan")}
              value={compactNumberFormatter.format(form.monthlyIncome)}
            />
            <MiniMetric
              label={t(language, "Base installment", "Estimasi cicilan")}
              value={compactNumberFormatter.format(installment)}
            />
            <MiniMetric
              label={t(language, "Affordability", "Affordability")}
              value={formatPercent(affordabilityRatio)}
              tone={affordabilityTone}
            />
            <MiniMetric
              label={t(language, "Collateral", "Agunan")}
              value={formatYesNo(form.hasCollateral, language)}
            />
          </div>
          <div className="insight-panel">
            <Gauge aria-hidden="true" size={22} />
            <div>
              <strong>
                {t(
                  language,
                  "What happens after submit?",
                  "Apa yang terjadi setelah submit?",
                )}
              </strong>
              <p>
                {t(
                  language,
                  "The API stores the request, calls the ML scoring service, then sends the application to the admin review workspace. AI never makes the final financing decision.",
                  "API menyimpan pengajuan, memanggil service scoring ML, lalu mengirim pengajuan ke ruang review admin. AI tidak pernah membuat keputusan final pembiayaan.",
                )}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </section>
  );
}
