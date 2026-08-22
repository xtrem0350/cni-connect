-- Photos des declarations trouvees et regles Storage associees.
-- A executer dans le SQL Editor Supabase.

ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS photo_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'declarations_photo_trouve_only'
      AND conrelid = 'public.declarations'::regclass
  ) THEN
    ALTER TABLE public.declarations
      ADD CONSTRAINT declarations_photo_trouve_only
      CHECK (photo_url IS NULL OR type = 'trouve');
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can upload declaration photos" ON storage.objects;
CREATE POLICY "Users can upload declaration photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'declarations'
    AND (storage.foldername(name))[2] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can view own declaration photos" ON storage.objects;
CREATE POLICY "Users can view own declaration photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'declarations'
    AND (storage.foldername(name))[2] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete own declaration photos" ON storage.objects;
CREATE POLICY "Users can delete own declaration photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'declarations'
    AND (storage.foldername(name))[2] = (select auth.uid()::text)
  );
