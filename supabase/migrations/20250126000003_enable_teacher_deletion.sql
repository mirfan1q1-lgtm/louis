/*
  # Enable Teacher Account Deletion
  This migration enables deletion of teacher accounts from Supabase Auth
  and ensures auto-creation of teacher profiles when new users are added
*/

-- ============================================
-- FUNCTION TO DELETE TEACHER ACCOUNT
-- ============================================

-- Function to delete teacher account (from both teachers table and auth.users)
CREATE OR REPLACE FUNCTION delete_teacher_account(teacher_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  teacher_id UUID;
  deleted_teacher RECORD;
  result JSON;
BEGIN
  -- Get teacher ID from email
  SELECT id INTO teacher_id
  FROM teachers
  WHERE email = teacher_email;
  
  -- If teacher not found, return error
  IF teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher with email % not found', teacher_email;
  END IF;
  
  -- Store teacher info before deletion
  SELECT * INTO deleted_teacher
  FROM teachers
  WHERE id = teacher_id;
  
  -- Delete from teachers table first (to avoid foreign key constraint issues)
  DELETE FROM teachers
  WHERE id = teacher_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users
  WHERE id = teacher_id;
  
  -- Return deleted teacher info
  SELECT json_build_object(
    'success', true,
    'message', 'Teacher account deleted successfully',
    'deleted_teacher', json_build_object(
      'id', deleted_teacher.id,
      'email', deleted_teacher.email,
      'full_name', deleted_teacher.full_name
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_teacher_account(TEXT) TO authenticated, service_role;

-- ============================================
-- RLS POLICY FOR DELETE ON TEACHERS
-- ============================================

-- Add DELETE policy for teachers (if not exists)
DROP POLICY IF EXISTS "Teachers can delete teacher accounts" ON teachers;

CREATE POLICY "Teachers can delete teacher accounts" ON teachers
  FOR DELETE TO authenticated 
  USING (auth.uid() IS NOT NULL);

-- Also allow service role to delete
-- (Service role policy already exists from previous migration, but ensure it covers DELETE)

-- ============================================
-- ENSURE AUTO-CREATE TRIGGER IS ACTIVE
-- ============================================

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;

CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_teacher();

-- ============================================
-- FUNCTION TO DELETE BY ID (Alternative)
-- ============================================

-- Alternative function to delete by teacher ID instead of email
CREATE OR REPLACE FUNCTION delete_teacher_account_by_id(teacher_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  deleted_teacher RECORD;
  result JSON;
BEGIN
  -- Get teacher info
  SELECT * INTO deleted_teacher
  FROM teachers
  WHERE id = teacher_id;
  
  -- If teacher not found, return error
  IF deleted_teacher IS NULL THEN
    RAISE EXCEPTION 'Teacher with ID % not found', teacher_id;
  END IF;
  
  -- Delete from teachers table first
  DELETE FROM teachers
  WHERE id = teacher_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users
  WHERE id = teacher_id;
  
  -- Return deleted teacher info
  SELECT json_build_object(
    'success', true,
    'message', 'Teacher account deleted successfully',
    'deleted_teacher', json_build_object(
      'id', deleted_teacher.id,
      'email', deleted_teacher.email,
      'full_name', deleted_teacher.full_name
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_teacher_account_by_id(UUID) TO authenticated, service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION delete_teacher_account(TEXT) IS 'Deletes a teacher account from both teachers table and auth.users by email';
COMMENT ON FUNCTION delete_teacher_account_by_id(UUID) IS 'Deletes a teacher account from both teachers table and auth.users by ID';

