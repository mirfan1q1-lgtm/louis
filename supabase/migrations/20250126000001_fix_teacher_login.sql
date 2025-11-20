/*
  # Fix Teacher Login RLS Issues
  This migration fixes RLS policies to allow teachers to login and create their profile
*/

-- Function to create or get teacher profile (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION create_or_get_teacher_profile(
  teacher_id UUID,
  teacher_email TEXT,
  teacher_full_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_record RECORD;
BEGIN
  -- Try to get existing teacher
  SELECT * INTO teacher_record
  FROM teachers
  WHERE id = teacher_id;
  
  -- If teacher doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO teachers (id, email, full_name)
    VALUES (
      teacher_id,
      teacher_email,
      COALESCE(teacher_full_name, split_part(teacher_email, '@', 1), 'Teacher')
    )
    RETURNING * INTO teacher_record;
  END IF;
  
  -- Return teacher record
  RETURN QUERY
  SELECT 
    teacher_record.id,
    teacher_record.full_name,
    teacher_record.email,
    teacher_record.phone,
    teacher_record.avatar_url,
    teacher_record.created_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_or_get_teacher_profile(UUID, TEXT, TEXT) TO authenticated, anon;

-- Update RLS policies to be more permissive for authenticated users
-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert their profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update all teacher profiles" ON teachers;

-- Recreate with better policies
-- Teachers can view all teachers (including themselves)
CREATE POLICY "Teachers can view all teachers" ON teachers
  FOR SELECT TO authenticated 
  USING (auth.uid() IS NOT NULL);

-- Teachers can insert their own profile (must match auth.uid())
CREATE POLICY "Teachers can insert their profile" ON teachers
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Teachers can update their own profile or any profile (for admin purposes)
CREATE POLICY "Teachers can update teacher profiles" ON teachers
  FOR UPDATE TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow service role to insert (for edge functions)
CREATE POLICY "Service role can manage teachers" ON teachers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- AUTO-CREATE TEACHER PROFILE ON AUTH USER CREATION
-- ============================================

-- Function to automatically create teacher profile when user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into teachers table if not exists
  INSERT INTO public.teachers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Teacher'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create teacher profile
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;
CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_teacher();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_teacher() TO service_role, authenticated;


