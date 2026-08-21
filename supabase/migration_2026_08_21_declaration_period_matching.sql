-- Store declaration delivery periods and match overlapping periods.
-- Run this migration after adding periode_debut and periode_fin.

CREATE OR REPLACE FUNCTION public.check_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.matchs (declaration_perdu_id, declaration_trouve_id)
  SELECT
    CASE WHEN NEW.type = 'perdu' THEN NEW.id ELSE d.id END,
    CASE WHEN NEW.type = 'perdu' THEN d.id ELSE NEW.id END
  FROM public.declarations AS d
  WHERE d.id <> NEW.id
    AND d.statut = 'actif'
    AND d.type <> NEW.type
    AND d.type_document = NEW.type_document
    AND d.date_naissance = NEW.date_naissance
    AND lower(trim(d.lieu_naissance)) = lower(trim(NEW.lieu_naissance))
    AND (
      (
        d.periode_debut IS NOT NULL
        AND d.periode_fin IS NOT NULL
        AND NEW.periode_debut IS NOT NULL
        AND NEW.periode_fin IS NOT NULL
        AND greatest(d.periode_debut::int, NEW.periode_debut::int)
          <= least(d.periode_fin::int, NEW.periode_fin::int)
      )
      OR (
        d.periode_debut IS NULL
        AND NEW.periode_debut IS NULL
        AND d.date_delivrance = NEW.date_delivrance
      )
    )
  ON CONFLICT (declaration_perdu_id, declaration_trouve_id) DO NOTHING;

  UPDATE public.declarations
  SET last_matched_at = now()
  WHERE id IN (
    SELECT declaration_perdu_id
    FROM public.matchs
    WHERE declaration_perdu_id = NEW.id OR declaration_trouve_id = NEW.id
    UNION
    SELECT declaration_trouve_id
    FROM public.matchs
    WHERE declaration_perdu_id = NEW.id OR declaration_trouve_id = NEW.id
  );

  RETURN NEW;
END;
$$;