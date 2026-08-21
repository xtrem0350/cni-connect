-- Photos for found-document declarations. Keep this bucket private.

ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS photo_url text;

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