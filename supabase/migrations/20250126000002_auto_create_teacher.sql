/*
  # Auto-Create Teacher Profile on Auth User Creation
  This migration creates a trigger that automatically creates a teacher profile
  when a new user is added to Supabase Auth
*/

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

-- Also handle existing users (run this once to create profiles for existing auth users)
INSERT INTO public.teachers (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'Teacher'
  )
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.id = au.id
)
ON CONFLICT (id) DO NOTHING;

