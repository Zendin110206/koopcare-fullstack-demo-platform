# KoopCare Feature Mapping

Last updated: 2026-05-16

This document explains why the public KoopCare form does not have the same
number of fields as the XGBoost model input.

Short version:

```text
Project 14 member/admin workflow data
-> Project 14 Express backend builds 19 MLOps request fields
-> Project 13 FastAPI service builds 25 model columns
-> XGBoost best_model.pkl predicts default risk
```

The browser never calls the ML API directly. The backend owns this mapping so
the product can keep a stable, simpler user form while the ML contract remains
reviewable.

## Field Counts

| Layer | Count | Meaning |
| --- | ---: | --- |
| Project 14 public form/product record | 14 | User/admin workflow fields such as name, phone, income, request amount, tenor, business duration, family size, and collateral. |
| Project 14 to project 13 request payload | 19 | `POST /predict` JSON fields required by the current project 13 API contract. |
| Project 13 model frame | 25 | Exact feature columns expected by `models/best_model.pkl` after feature engineering. |

Identity and review fields such as applicant name, phone number, business type,
and purpose are stored for workflow review. They are not sent directly into the
current prototype model.

## Project 14 Payload Mapping

| Project 13 request field | Project 14 source | Mapping rule | Project 13 model column impact |
| --- | --- | --- | --- |
| `code_gender` | `gender` | Direct mapping from the member form. | `CODE_GENDER` |
| `name_income_type` | Backend default | Fixed to `Working` for this portfolio demo. | `NAME_INCOME_TYPE` |
| `name_education_type` | Backend default | Fixed to `Secondary / secondary special` until the public form collects education. | `NAME_EDUCATION_TYPE` |
| `name_family_status` | `familyMembers` | More than one family member becomes `Married`; otherwise `Single / not married`. | `NAME_FAMILY_STATUS` |
| `occupation_type` | Backend default | Fixed to `Laborers` until the public form collects occupation. | `OCCUPATION_TYPE` |
| `flag_own_car` | Backend default | Fixed to `N` because the current KoopCare form does not collect car ownership. | `FLAG_OWN_CAR` |
| `flag_own_realty` | `hasCollateral` | Collateral is treated as the property/realty ownership signal for the prototype contract. | `FLAG_OWN_REALTY` |
| `cnt_children` | `children` | Direct mapping from the member form. | `CNT_CHILDREN` |
| `cnt_fam_members` | `familyMembers` | Direct mapping from the member form. | `CNT_FAM_MEMBERS` |
| `amt_income_total` | `monthlyIncome` | Monthly cooperative income is sent as total income for this demo contract. | `AMT_INCOME_TOTAL`, `DEBT_TO_INCOME` |
| `amt_credit` | `requestedAmount` | Requested financing amount. | `AMT_CREDIT`, `DEBT_TO_INCOME`, `PAYMENT_RATE` |
| `amt_annuity` | `requestedAmount`, `tenorMonths` | Calculated as `requestedAmount / tenorMonths`, with minimum value `1`. | `AMT_ANNUITY`, `PAYMENT_RATE` |
| `amt_goods_price` | `requestedAmount` | Mirrors requested amount because the demo does not separate goods price from financing amount. | `AMT_GOODS_PRICE` |
| `days_birth` | `age` | Calculated as `-round(age * 365.25)`. | `AGE_YEARS` |
| `days_employed` | `yearsInBusiness` | Calculated as `-round(yearsInBusiness * 365.25)`. | `DAYS_EMPLOYED`, `DAYS_EMPLOYED_ANOM` |
| `days_last_phone_change` | Backend default | Fixed to `-365` until the public form collects phone-change history. | `DAYS_LAST_PHONE_CHANGE` |
| `ext_source_1` | `hasCollateral` | `0.62` when collateral exists, otherwise `0.48`. | `EXT_SOURCE_1`, `EXT_SOURCE_MEAN`, `EXT_SOURCE_MIN`, `EXT_SOURCE_PROD` |
| `ext_source_2` | `yearsInBusiness` | `clamp(0.42 + yearsInBusiness * 0.025, 0.25, 0.85)`. | `EXT_SOURCE_2`, `EXT_SOURCE_MEAN`, `EXT_SOURCE_MIN`, `EXT_SOURCE_PROD` |
| `ext_source_3` | `existingLoanCount` | `clamp(0.58 - existingLoanCount * 0.04, 0.25, 0.8)`. | `EXT_SOURCE_3`, `EXT_SOURCE_MEAN`, `EXT_SOURCE_MIN`, `EXT_SOURCE_PROD` |

## Project 13 Feature Engineering

Project 13 receives the 19 request fields and creates the final 25-column model
frame.

The current model columns are:

```text
CODE_GENDER
NAME_INCOME_TYPE
NAME_EDUCATION_TYPE
NAME_FAMILY_STATUS
OCCUPATION_TYPE
FLAG_OWN_CAR
FLAG_OWN_REALTY
CNT_CHILDREN
CNT_FAM_MEMBERS
AMT_INCOME_TOTAL
AMT_CREDIT
AMT_ANNUITY
AMT_GOODS_PRICE
DAYS_EMPLOYED
DAYS_LAST_PHONE_CHANGE
AGE_YEARS
DAYS_EMPLOYED_ANOM
EXT_SOURCE_1
EXT_SOURCE_2
EXT_SOURCE_3
EXT_SOURCE_MEAN
EXT_SOURCE_MIN
EXT_SOURCE_PROD
DEBT_TO_INCOME
PAYMENT_RATE
```

Derived columns:

| Model column | Formula | Purpose |
| --- | --- | --- |
| `AGE_YEARS` | `abs(days_birth) / 365` | Converts Home Credit style negative day offset into age. |
| `DAYS_EMPLOYED_ANOM` | `days_employed == 365243 ? 1 : 0` | Keeps the Home Credit employment anomaly flag explicit. |
| `EXT_SOURCE_MEAN` | `mean(ext_source_1, ext_source_2, ext_source_3)` | Summarizes external/proxy score strength. |
| `EXT_SOURCE_MIN` | `min(ext_source_1, ext_source_2, ext_source_3)` | Captures the weakest external/proxy signal. |
| `EXT_SOURCE_PROD` | `ext_source_1 * ext_source_2 * ext_source_3` | Captures combined score strength. |
| `DEBT_TO_INCOME` | `amt_credit / (amt_income_total + 1)` | Measures requested financing size relative to income. |
| `PAYMENT_RATE` | `amt_annuity / (amt_credit + 1)` | Measures installment burden relative to requested financing. |

`DAYS_BIRTH` is used only to derive `AGE_YEARS`; it is not included in the final
25-column model frame.

## Important Limitation

The current artifact is still a prototype trained with Home Credit style fields.
Several values in project 14 are controlled defaults or proxy values because the
current public form is a cooperative workflow demo, not a final BMT-native model
input form.

Future retraining should replace these prototype defaults with cooperative-native
fields such as:

- member active duration;
- saving balance;
- saving consistency;
- repayment history;
- late payment count;
- cooperative transaction behavior;
- officer review history.
