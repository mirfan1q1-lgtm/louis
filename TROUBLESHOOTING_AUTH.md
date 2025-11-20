# 🔧 Troubleshooting Authentication - Teacher Login

## ❌ Error: "Invalid login credentials"

Error ini muncul saat login sebagai guru dengan pesan:
```
AuthApiError: Invalid login credentials
POST https://[your-project].supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

---

## 🔍 Penyebab Error

### 1. **Email atau Password Salah** ✅ (Paling Umum)
- Email yang dimasukkan tidak sesuai
- Password yang dimasukkan salah
- Perhatikan huruf besar/kecil (case-sensitive)

### 2. **Akun Belum Terdaftar di Supabase Auth** ⚠️ (Paling Sering Terjadi)
- Teacher harus terdaftar di Supabase Auth terlebih dahulu
- Hanya membuat record di tabel `teachers` tidak cukup
- Harus ada user di `auth.users` di Supabase

### 3. **Email Belum Dikonfirmasi**
- Jika email confirmation diaktifkan di Supabase
- User harus klik link konfirmasi di email terlebih dahulu

---

## ✅ Solusi: Mendaftarkan Teacher di Supabase Auth

### Metode 1: Melalui Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**:
   - Login ke [https://app.supabase.com](https://app.supabase.com)
   - Pilih project Anda

2. **Akses Authentication**:
   - Klik menu **"Authentication"** di sidebar kiri
   - Pilih tab **"Users"**

3. **Tambah User Baru**:
   - Klik tombol **"Add user"** atau **"Create new user"**
   - Isi form:
     - **Email**: Email guru (contoh: `guru@sekolah.com`)
     - **Password**: Password untuk guru
     - **Auto Confirm User**: ✅ Centang ini (untuk skip email confirmation)
   - Klik **"Create user"**

4. **Verifikasi**:
   - User akan muncul di daftar users
   - Status harus "Confirmed" (hijau)

5. **Login**:
   - Gunakan email dan password yang baru dibuat
   - Login akan berhasil dan profile teacher akan dibuat otomatis

---

### Metode 2: Melalui SQL Editor (Advanced)

Jika Anda ingin membuat user melalui SQL:

1. **Buka SQL Editor** di Supabase Dashboard

2. **Jalankan Query**:
   ```sql
   -- Ganti email dan password sesuai kebutuhan
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin,
     confirmation_token,
     recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'guru@sekolah.com',  -- Ganti dengan email guru
     crypt('password123', gen_salt('bf')),  -- Ganti dengan password yang diinginkan
     NOW(),
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{}',
     FALSE,
     '',
     ''
   );
   ```

**Catatan**: Metode SQL lebih kompleks dan tidak direkomendasikan. Gunakan Metode 1 (Dashboard) lebih mudah.

---

### Metode 3: Membuat Sign Up Function (Untuk Development)

Jika Anda ingin membuat fitur sign up untuk teacher, tambahkan function di `authService.ts`:

```typescript
async signUpTeacher(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}
```

**Catatan**: 
- Fitur sign up memerlukan konfigurasi di Supabase Dashboard
- Email confirmation mungkin perlu diaktifkan/nonaktifkan sesuai kebutuhan

---

## 🔐 Konfigurasi Supabase Auth

### 1. Disable Email Confirmation (Untuk Development)

1. Buka **Authentication** → **Settings** di Supabase Dashboard
2. Scroll ke **"Email Auth"**
3. **Uncheck** "Enable email confirmations"
4. Klik **"Save"**

**Catatan**: Untuk production, sebaiknya email confirmation diaktifkan.

### 2. Enable Sign Up (Jika Ingin Fitur Sign Up)

1. Buka **Authentication** → **Settings**
2. Scroll ke **"Email Auth"**
3. **Check** "Enable email signup"
4. Klik **"Save"**

---

## 🧪 Testing Login

Setelah membuat user di Supabase Auth:

1. **Buka halaman login** aplikasi LMS
2. **Pilih "Login sebagai Guru"**
3. **Masukkan**:
   - Email: Email yang dibuat di Supabase Auth
   - Password: Password yang dibuat di Supabase Auth
4. **Klik "Masuk"**
5. **Harus berhasil** dan redirect ke dashboard guru

---

## 📝 Checklist Troubleshooting

Jika masih error, cek:

- [ ] **Email benar**: Pastikan email yang dimasukkan sama persis dengan yang di Supabase Auth
- [ ] **Password benar**: Pastikan password yang dimasukkan sama persis
- [ ] **User ada di Supabase Auth**: Cek di Authentication → Users
- [ ] **User status "Confirmed"**: Status harus hijau/confirmed
- [ ] **Email confirmation disabled**: Jika development, disable email confirmation
- [ ] **Environment variables**: Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar
- [ ] **Network connection**: Pastikan koneksi internet stabil
- [ ] **Browser console**: Cek error lain di console browser

---

## 🆘 Masalah Lain

### Error: "Email not confirmed"
**Solusi**: 
- Nonaktifkan email confirmation di Supabase Settings, ATAU
- Klik link konfirmasi di email

### Error: "User already registered"
**Solusi**: 
- User sudah ada, gunakan email dan password yang sudah terdaftar
- Atau reset password di Supabase Dashboard

### Error: "Network error" atau "Failed to fetch"
**Solusi**:
- Cek koneksi internet
- Cek environment variables Supabase
- Cek apakah Supabase project masih aktif

---

## 📞 Bantuan Lebih Lanjut

Jika masalah masih berlanjut:

1. **Cek Supabase Dashboard**: Pastikan project aktif dan tidak ada masalah
2. **Cek Logs**: Lihat error logs di Supabase Dashboard → Logs
3. **Cek Browser Console**: Lihat error detail di browser console (F12)
4. **Hubungi Support**: support@lms3.com

---

**Catatan Penting**: 
- Teacher **HARUS** terdaftar di Supabase Auth terlebih dahulu
- Tabel `teachers` hanya menyimpan profile, bukan credentials
- Credentials (email/password) disimpan di Supabase Auth (`auth.users`)


