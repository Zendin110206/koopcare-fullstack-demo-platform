# Security Notes

This repository is currently a local MVP demo project.

The public portfolio demo uses:

- demo member/admin login tokens;
- generated access codes for member status lookup;
- admin-only access for the full application queue.

These controls are meant to make the demo safer and clearer for reviewers. They are not a substitute for production authentication, database-backed ownership checks, rate limiting, or compliance review.

Do not commit:

- `.env` files;
- real database credentials;
- JWT secrets;
- OAuth client secrets;
- real personal data;
- private model artifacts;
- production database dumps.

Before any public demo deployment, review:

- authentication and authorization;
- protected admin routes;
- input validation;
- CORS configuration;
- rate limiting;
- secret management;
- database access;
- logging behavior;
- demo data safety.

AI recommendations must be presented as decision support only. The product must not imply that the model makes final financing decisions.
