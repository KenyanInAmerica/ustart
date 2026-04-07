# Database Migrations

All schema changes are tracked here as numbered SQL files.

## Rules

- Never modify a migration file after it has been run
- Always run migrations on staging first, verify, then run on production
- If a mistake was made, write a new migration to correct it — do not edit the original
- Every PR that includes a schema change must include a new migration file
- Migration files are run manually in the Supabase SQL Editor

## Order

Migrations must be applied in numerical order. Each file is idempotent where possible.

## Current state

| File                              | Description                                 | Staging | Production |
| --------------------------------- | ------------------------------------------- | ------- | ---------- |
| 001_initial_schema.sql            | Full initial schema through Feature 11      | ✅      | ✅         |
| 002_pre_launch_cleanup.sql        | FK fix, drop no-op function                 | ✅      | ✅         |
| 003_feature_14_user_deletion.sql  | is_active column, contact_submissions table | ✅      | ✅         |
| 004_audit_logs.sql                | audit_logs table, RLS, indexes              | ✅      | ✅         |
| 005_audit_logs_payload_search.sql | payload_text generated column, trgm index   | ✅      | ✅         |

## Adding a new migration

1. Create the next numbered file: `006_description.sql`
2. Write the SQL
3. Run on staging — verify it works
4. Update the table above marking staging as ✅
5. Include the file in your PR
6. After merging and deploying to production, run on production
7. Update the table marking production as ✅
8. Update the project snapshot to reflect the schema change
