# 🔧 Fix Teacher Login - Panduan Perbaikan

## Masalah
Guru tidak bisa login meskipun sudah terdaftar di Supabase Auth.

## Solusi

### Langkah 1: Jalankan Migration SQL

Jika `npx supabase db push` gagal karena masalah koneksi, jalankan SQL berikut secara manual di **Supabase Dashboard > SQL Editor**:

```sql
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

-- Update RLS policies
DROP POLICY IF EXISTS "Teachers can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert their profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update all teacher profiles" ON teachers;

-- Recreate with better policies
CREATE POLICY "Teachers can view all teachers" ON teachers
  FOR SELECT TO authenticated 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can insert their profile" ON teachers
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can update teacher profiles" ON teachers
  FOR UPDATE TO authenticated 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Langkah 2: Verifikasi

1. Pastikan function sudah dibuat:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'create_or_get_teacher_profile';
   ```

2. Test login dengan akun guru yang sudah terdaftar di Supabase Auth

### Langkah 3: Troubleshooting

Jika masih tidak bisa login:

1. **Cek apakah user ada di Supabase Auth:**
   - Buka Supabase Dashboard > Authentication > Users
   - Pastikan email guru ada di list

2. **Cek apakah profile teacher sudah ada:**
   ```sql
   SELECT * FROM teachers WHERE email = 'email_guru@example.com';
   ```

3. **Cek error di browser console:**
   - Buka Developer Tools (F12)
   - Lihat tab Console untuk error messages
   - Lihat tab Network untuk failed requests

4. **Test RPC function langsung:**
   ```sql
   -- Ganti dengan UUID user yang login
   SELECT * FROM create_or_get_teacher_profile(
     'user-uuid-here'::UUID,
     'email@example.com',
     'Nama Guru'
   );
   ```

## Penjelasan Perbaikan

1. **RPC Function dengan SECURITY DEFINER:**
   - Function ini melewati RLS (Row Level Security)
   - Memungkinkan create teacher profile setelah login
   - Lebih aman daripada membuka RLS policy

2. **Fallback di authService.ts:**
   - Jika RPC function gagal, akan fallback ke direct query
   - Memberikan error message yang lebih jelas

3. **RLS Policies yang Diperbaiki:**
   - Teachers dapat view semua teachers (untuk admin)
   - Teachers dapat insert profile sendiri (auth.uid() = id)
   - Teachers dapat update profile (untuk edit profil)

## Catatan

- Pastikan user sudah terdaftar di **Supabase Auth** (bukan hanya di tabel teachers)
- Function `create_or_get_teacher_profile` akan otomatis membuat profile jika belum ada
- Migration file sudah diupdate di `supabase/migrations/20250126000001_fix_teacher_login.sql`


