# Product Scope

This document defines what the demo is intended to prove and what is intentionally out of scope.

## Product Vision

KoopCare Fullstack Demo Platform is a portfolio-grade web application that demonstrates how a cooperative financing workflow can use AI-assisted credit scoring while preserving human decision-making.

The target demo flow:

```text
User submits a financing application.
Backend stores the application.
Backend requests AI risk recommendation.
Admin reviews the application and AI signal.
Admin makes the final decision.
User sees the application status.
```

## In Scope

Initial product scope:

- user web flow;
- admin web flow;
- backend API;
- MySQL database;
- loan application lifecycle;
- MLOps API integration;
- AI assessment storage;
- demo data;
- local development setup;
- professional documentation;
- eventual public demo preparation.

## Out of Scope for Early Phases

The early phases will not implement:

- production banking-grade compliance;
- real payment gateway;
- real WhatsApp OTP;
- production Google OAuth approval;
- production KYC document storage;
- model retraining;
- automatic credit approval;
- real customer data usage.

## Primary Personas

### Member

A cooperative member or prospective borrower who wants to submit a financing application.

### Admin

A cooperative officer who reviews submitted applications and makes the final decision.

### Reviewer

A technical or portfolio reviewer who wants to inspect the fullstack implementation and understand the MLOps integration.

## AI Product Policy

The product must consistently communicate:

```text
AI recommendation is advisory.
Human review is required.
Final decision belongs to the cooperative officer.
```

Avoid product language such as:

```text
AI approved the loan.
AI rejected the applicant.
```

Prefer:

```text
AI recommendation: Eligible for review.
AI risk level: Medium.
Final decision: Pending officer review.
```

