-- Align the remote declarations table with the declaration form.
ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS lieu_perte_trouvaille text,
  ADD COLUMN IF NOT EXISTS type_document text,
  ADD COLUMN IF NOT EXISTS date_creation timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS numero_hash text;

-- The document number is optional; only its hash is stored when provided.
ALTER TABLE public.declarations
  ALTER COLUMN numero_hash DROP NOT NULL;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'declarations'
ORDER BY ordinal_position;