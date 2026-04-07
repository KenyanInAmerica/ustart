CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.audit_logs
  ADD COLUMN payload_text TEXT GENERATED ALWAYS AS (payload::text) STORED;

CREATE INDEX audit_logs_payload_text_trgm_idx
  ON public.audit_logs USING gin (payload_text gin_trgm_ops);