-- Add profile contact fields used by the citizen dashboard.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS telephone text;

UPDATE public.profiles
SET telephone = phone
WHERE telephone IS NULL AND phone IS NOT NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('nom', 'telephone', 'phone')
ORDER BY ordinal_position;
