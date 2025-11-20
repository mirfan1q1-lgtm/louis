# 🔄 Auto-Create Teacher Profile

## Fitur
Sekarang ketika akun email ditambahkan di **Supabase Auth**, profil guru akan **otomatis dibuat** di tabel `teachers`.

## Cara Kerja

### 1. Database Trigger
- Trigger `on_auth_user_created_teacher` akan otomatis dipanggil ketika ada user baru di `auth.users`
- Function `handle_new_teacher()` akan membuat record di tabel `teachers` dengan:
  - `id`: UUID dari auth.users
  - `email`: Email dari auth.users
  - `full_name`: Diambil dari metadata atau email (jika tidak ada)

### 2. Fallback Mechanism
- Jika trigger belum jalan atau gagal, RPC function `create_or_get_teacher_profile` akan dipanggil
- Jika RPC juga gagal, akan fallback ke direct query

## Cara Menggunakan

### Menambahkan Guru Baru

1. **Buka Supabase Dashboard**
   - Login ke [https://app.supabase.com](https://app.supabase.com)
   - Pilih project Anda

2. **Tambah User di Authentication**
   - Klik menu **"Authentication"** di sidebar
   - Pilih tab **"Users"**
   - Klik **"Add user"** atau **"Create new user"**
   - Isi:
     - **Email**: Email guru (contoh: `guru@sekolah.com`)
     - **Password**: Password untuk guru
     - **Auto Confirm User**: ✅ Centang ini
   - Klik **"Create user"**

3. **Profil Otomatis Dibuat**
   - Trigger akan otomatis membuat profil di tabel `teachers`
   - Guru bisa langsung login tanpa perlu setup tambahan

## Migration Files

1. **20250126000001_fix_teacher_login.sql**
   - Function `create_or_get_teacher_profile`
   - RLS policies yang diperbaiki
   - Trigger `on_auth_user_created_teacher`

2. **20250126000002_auto_create_teacher.sql**
   - Backup migration untuk trigger
   - Script untuk create profile untuk existing users

## Verifikasi

### Cek Trigger
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_teacher';
```

### Cek Function
```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_teacher';
```

### Test Manual
```sql
-- Cek apakah user ada di auth.users
SELECT id, email FROM auth.users WHERE email = 'guru@sekolah.com';

-- Cek apakah profile sudah dibuat
SELECT * FROM teachers WHERE email = 'guru@sekolah.com';
```

### Create Profile untuk Existing Users
Jika ada user yang sudah ada di auth.users tapi belum ada di teachers, jalankan:
```sql
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
```

## Troubleshooting

### Trigger Tidak Jalan
1. Pastikan migration sudah dijalankan
2. Cek apakah trigger ada:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_teacher';
   ```
3. Jika tidak ada, jalankan migration lagi

### Profile Tidak Terbuat
1. Cek error di Supabase Dashboard > Logs
2. Pastikan RLS policies sudah benar
3. Cek apakah function `handle_new_teacher` ada dan bisa dijalankan

### Login Masih Error
1. Pastikan user sudah ada di Supabase Auth
2. Pastikan profile sudah dibuat (cek di tabel teachers)
3. Cek browser console untuk error messages
4. Pastikan RPC function `create_or_get_teacher_profile` bisa dijalankan

## Catatan Penting

- ✅ Trigger akan otomatis membuat profile untuk user baru
- ✅ RPC function sebagai fallback jika trigger gagal
- ✅ Direct query sebagai fallback terakhir
- ✅ Profile dibuat dengan `full_name` dari metadata atau email
- ✅ Tidak perlu setup manual setelah user dibuat di Auth

