-- Migration: Add WhatsApp auth support and admin columns to profiles
-- Date: 2026-08-16

-- 1. Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create OTP codes table for verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '10 minutes'),
  verified BOOLEAN DEFAULT false
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- 4. Create RPC functions for OTP management
CREATE OR REPLACE FUNCTION send_otp_sms(phone_number TEXT)
RETURNS JSON AS $$
DECLARE
  otp_code TEXT;
  result JSON;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD((FLOOR(RANDOM() * 1000000)::INTEGER)::TEXT, 6, '0');
  
  -- Insert or update OTP code
  INSERT INTO otp_codes (phone, code, verified)
  VALUES (phone_number, otp_code, false)
  ON CONFLICT (phone) DO UPDATE SET
    code = otp_code,
    verified = false,
    created_at = now(),
    expires_at = now() + INTERVAL '10 minutes';
  
  -- In production, send via SMS provider (Twilio, Vonage, etc.)
  -- For now, return the code for testing
  result := json_build_object(
    'success', true,
    'code', otp_code,
    'message', 'OTP sent via SMS'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_otp_sms(phone_number TEXT, otp_code TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  is_valid BOOLEAN;
  otp_record RECORD;
BEGIN
  -- Get OTP record
  SELECT * INTO otp_record FROM otp_codes
  WHERE phone = phone_number
  AND code = otp_code
  AND verified = false
  AND expires_at > now();
  
  is_valid := FOUND;
  
  IF is_valid THEN
    -- Mark as verified
    UPDATE otp_codes SET verified = true
    WHERE phone = phone_number AND code = otp_code;
    
    result := json_build_object(
      'valid', true,
      'message', 'OTP verified successfully'
    );
  ELSE
    result := json_build_object(
      'valid', false,
      'message', 'Invalid or expired OTP code'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_admin
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
    ),
    false
  );
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin_profile());

-- 6. Update RLS for otp_codes (should not be directly accessible)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "OTP codes are only accessible via RPC" ON otp_codes;

CREATE POLICY "OTP codes are only accessible via RPC"
  ON otp_codes FOR ALL
  USING (false);
