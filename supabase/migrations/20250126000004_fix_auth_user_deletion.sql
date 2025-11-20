/*
  # Fix Auth User Deletion
  This migration creates a trigger to automatically delete teacher profile
  when user is deleted from auth.users (enables deletion from Supabase Dashboard)
*/

-- ============================================
-- FUNCTION TO DELETE TEACHER BEFORE AUTH USER DELETION
-- ============================================

-- Function to automatically delete teacher profile when user is deleted from auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from teachers table before user is deleted from auth.users
  -- This prevents foreign key constraint error
  DELETE FROM public.teachers
  WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- ============================================
-- TRIGGER TO DELETE TEACHER BEFORE AUTH USER DELETION
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_deleted_teacher ON auth.users;

-- Create trigger that runs BEFORE DELETE on auth.users
CREATE TRIGGER on_auth_user_deleted_teacher
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_auth_user_deleted() TO service_role, authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.handle_auth_user_deleted() IS 'Automatically deletes teacher profile when user is deleted from auth.users. This enables deletion from Supabase Dashboard without foreign key constraint errors.';

