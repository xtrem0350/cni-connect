-- ============================================
-- AJOUT DES COLONNES POUR DECLARATIONS
-- ============================================

ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS prenom text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS lieu_perte_trouvaille text,
  ADD COLUMN IF NOT EXISTS type_document text;

ALTER TABLE public.declarations
  ALTER COLUMN numero_hash DROP NOT NULL;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'declarations'
ORDER BY ordinal_position;
