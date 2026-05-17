# Database

This directory is reserved for database schema, migrations, and seed data.

Current persistence:

```text
apps/api/.data/applications.local.json
```

The current MVP intentionally uses JSON file storage so the user and admin workflow can be tested before the MySQL milestone.

Planned database milestone:

```text
MySQL
```

Initial planned tables:

```text
users
loan_applications
ai_assessments
admin_audit_logs
```

The MySQL layer is not implemented yet.
