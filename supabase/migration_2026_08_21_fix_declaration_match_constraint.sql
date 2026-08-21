-- Fix: the declaration matching trigger relies on this unique pair.
-- Run this migration in the Supabase SQL Editor on an existing project.

CREATE UNIQUE INDEX IF NOT EXISTS uq_matchs_declaration_pair
  ON public.matchs (declaration_perdu_id, declaration_trouve_id);