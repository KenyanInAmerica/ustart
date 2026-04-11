# Database Schema

The canonical schema is in `001_initial_schema.sql` — extracted directly from production on April 10, 2026.

## Applying to a new environment

Run `001_initial_schema.sql` in the Supabase SQL Editor, then seed:
- Pricing table with all six products
- Config table with `whatsapp_invite_link`
- Create a storage bucket named `pdfs` (private)
- Set up auth URL configuration and email templates

## Adding schema changes

1. Write the SQL change
2. Run on staging first — verify
3. Run on production
4. Update `001_initial_schema.sql` to reflect the new state
5. Include the change in your PR description
