-- Migration: Simple citizen identification without OTP
-- Date: 2026-08-17

-- 1. Ajout des colonnes pour les citoyens dans la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS citizen_code TEXT UNIQUE,  -- ex: 06200103T
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Création d'index pour des performances optimales
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_citizen_code ON profiles(citizen_code);

-- 3. Fonction simple pour générer un code citoyen automatiquement
-- (Optionnel : si tu veux que Supabase le génère tout seul à l'inscription)
CREATE OR REPLACE FUNCTION generate_citizen_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  -- Génère un code aléatoire de 9 caractères (ex: 06200103T)
  code := LPAD((FLOOR(RANDOM() * 1000000000)::BIGINT)::TEXT, 9, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 4. Politiques de sécurité (RLS) sans récursion infinie
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Citizens can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profils lisibles par le proprietaire" ON profiles;

CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_admin
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ),
    false
  );
$$;

-- Les citoyens peuvent voir et modifier leur propre profil
CREATE POLICY "Citizens can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Citizens can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Citizens can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Les admins peuvent tout voir, sans réinterroger la table profiles dans la politique elle-même
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin_profile());