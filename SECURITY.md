# Security Notes

This repository is currently a local MVP demo project.

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
