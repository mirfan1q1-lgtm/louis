# 🔄 Panduan Reset Akun Guru di Supabase

Panduan ini menjelaskan cara menghapus dan membuat ulang akun guru di Supabase Auth ketika:
- Guru tidak bisa login
- Guru lupa password
- Ingin membuat ulang akun dengan email yang sama

---

## ⚠️ PENTING: Sebelum Menghapus

**Data yang akan tetap aman:**
- ✅ Data siswa (tidak terpengaruh)
- ✅ Data kelas (tidak terpengaruh)
- ✅ Data tugas/assignment (tidak terpengaruh)
- ✅ Data nilai/grades (tidak terpengaruh)
- ✅ Data kehadiran (tidak terpengaruh)

**Yang akan terhapus:**
- ❌ Akun guru di Supabase Auth
- ❌ Profile guru di tabel `teachers` (jika ada)

**Catatan:** Karena data siswa dan kelas diimport via CSV, referensi ke teacher biasanya NULL atau tidak ada, jadi data tidak akan terpengaruh.

---

## 📋 Langkah 1: Menghapus Akun Guru Lama

### Metode A: Melalui Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke [https://app.supabase.com](https://app.supabase.com)
   - Pilih project Anda

2. **Akses Authentication**
   - Klik menu **"Authentication"** di sidebar kiri
   - Pilih tab **"Users"**

3. **Cari User Guru**
   - Cari email guru yang ingin dihapus
   - Klik pada user tersebut untuk melihat detail

4. **Hapus User**
   - Scroll ke bawah, klik tombol **"Delete user"** (biasanya berwarna merah)
   - Konfirmasi penghapusan
   - User akan dihapus dari `auth.users`

5. **Hapus Profile Teacher (Opsional)**
   - Buka **SQL Editor** di Supabase Dashboard
   - Jalankan query berikut (ganti email dengan email guru yang dihapus):

   ```sql
   -- Hapus profile teacher berdasarkan email
   DELETE FROM teachers 
   WHERE email = 'guru@sekolah.com';  -- Ganti dengan email guru
   ```

   **Catatan:** Jika profile teacher tidak ada, query ini tidak akan error, hanya tidak menghapus apa-apa.

---

### Metode B: Melalui SQL Editor (Advanced)

Jika Anda lebih nyaman menggunakan SQL:

1. **Buka SQL Editor** di Supabase Dashboard

2. **Cari ID User Guru**
   ```sql
   -- Cari user berdasarkan email
   SELECT id, email, created_at 
   FROM auth.users 
   WHERE email = 'guru@sekolah.com';  -- Ganti dengan email guru
   ```

3. **Hapus Profile Teacher (jika ada)**
   ```sql
   -- Hapus profile teacher
   DELETE FROM teachers 
   WHERE email = 'guru@sekolah.com';  -- Ganti dengan email guru
   ```

4. **Hapus User dari Auth**
   ```sql
   -- Hapus user dari auth.users
   DELETE FROM auth.users 
   WHERE email = 'guru@sekolah.com';  -- Ganti dengan email guru
   ```

   **⚠️ PERINGATAN:** Hapus user dari auth.users akan menghapus semua data autentikasi. Pastikan Anda sudah menghapus profile teacher terlebih dahulu.

---

## 📋 Langkah 2: Membuat Akun Guru Baru

### Metode 1: Melalui Supabase Dashboard (Recommended)

1. **Buka Authentication → Users**
   - Di Supabase Dashboard, klik **"Authentication"** → **"Users"**

2. **Tambah User Baru**
   - Klik tombol **"Add user"** atau **"Create new user"** (biasanya di pojok kanan atas)

3. **Isi Form**
   - **Email**: Masukkan email guru (bisa sama dengan yang lama atau berbeda)
   - **Password**: Masukkan password baru untuk guru
   - **Auto Confirm User**: ✅ **Centang ini** (penting untuk skip email confirmation)
   - **Send invitation email**: ❌ **Jangan centang** (karena kita sudah tahu password)

4. **Buat User**
   - Klik **"Create user"** atau **"Add user"**
   - User akan muncul di daftar dengan status "Confirmed" (hijau)

5. **Verifikasi**
   - Pastikan user muncul di daftar
   - Status harus "Confirmed" (hijau)
   - Email harus sesuai dengan yang dimasukkan

---

### Metode 2: Melalui SQL Editor (Advanced)

Jika Anda ingin membuat user melalui SQL:

1. **Buka SQL Editor** di Supabase Dashboard

2. **Jalankan Query**
   ```sql
   -- Buat user baru di Supabase Auth
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
     NOW(),  -- Email langsung confirmed
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{}',
     FALSE,
     '',
     ''
   );
   ```

   **Catatan:** Metode SQL lebih kompleks. Gunakan Metode 1 (Dashboard) lebih mudah dan aman.

---

## 📋 Langkah 3: Login dan Verifikasi

1. **Buka Aplikasi LMS**
   - Buka halaman login aplikasi Anda

2. **Login sebagai Guru**
   - Pilih tab **"TEACHER"**
   - Masukkan:
     - **Email**: Email yang baru dibuat
     - **Password**: Password yang baru dibuat
   - Klik **"EXECUTE LOGIN"**

3. **Verifikasi**
   - Login harus berhasil
   - Akan redirect ke dashboard guru
   - Profile teacher akan dibuat otomatis oleh sistem

4. **Cek Profile Teacher**
   - Profile teacher akan dibuat otomatis saat login pertama kali
   - Data akan tersimpan di tabel `teachers`
   - ID teacher akan sama dengan ID user di `auth.users`

---

## 🔍 Troubleshooting

### Error: "User already exists"
**Penyebab:** User dengan email tersebut masih ada di Supabase Auth.

**Solusi:**
1. Pastikan sudah menghapus user lama (Langkah 1)
2. Cek di Authentication → Users apakah email masih ada
3. Jika masih ada, hapus dulu sebelum membuat yang baru

### Error: "Invalid login credentials"
**Penyebab:** 
- Email atau password salah
- User belum dibuat di Supabase Auth
- Email belum dikonfirmasi

**Solusi:**
1. Pastikan user sudah dibuat di Supabase Auth
2. Pastikan status user "Confirmed" (hijau)
3. Pastikan email dan password yang dimasukkan benar
4. Pastikan "Auto Confirm User" dicentang saat membuat user

### Profile Teacher Tidak Terbuat Otomatis
**Penyebab:** Ada masalah saat insert ke tabel `teachers`.

**Solusi:**
1. Cek error di browser console (F12)
2. Buat profile teacher manual melalui SQL Editor:

   ```sql
   -- Dapatkan ID user terlebih dahulu
   SELECT id, email FROM auth.users WHERE email = 'guru@sekolah.com';
   
   -- Buat profile teacher (ganti ID dan email sesuai hasil query di atas)
   INSERT INTO teachers (id, email, full_name)
   VALUES (
     'uuid-dari-query-di-atas',  -- Ganti dengan ID dari query di atas
     'guru@sekolah.com',  -- Ganti dengan email guru
     'Nama Guru'  -- Ganti dengan nama guru
   );
   ```

### Data Kelas/Siswa Hilang
**Penyebab:** Tidak mungkin terjadi jika data diimport via CSV.

**Solusi:**
- Data kelas dan siswa tidak terpengaruh karena:
  - `created_by` biasanya NULL jika diimport via CSV
  - Foreign key tidak akan menghapus data jika `created_by` NULL
  - Data siswa dan kelas independen dari teacher

---

## ✅ Checklist Reset Akun Guru

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] User lama sudah dihapus dari Supabase Auth
- [ ] Profile teacher lama sudah dihapus (opsional)
- [ ] User baru sudah dibuat di Supabase Auth
- [ ] Status user baru "Confirmed" (hijau)
- [ ] "Auto Confirm User" sudah dicentang saat membuat user
- [ ] Sudah mencoba login dengan email dan password baru
- [ ] Login berhasil dan redirect ke dashboard
- [ ] Profile teacher terbuat otomatis (cek di tabel `teachers`)

---

## 📝 Catatan Penting

1. **Email Bisa Sama atau Berbeda**
   - Anda bisa menggunakan email yang sama dengan yang lama
   - Atau menggunakan email yang berbeda
   - Yang penting user lama sudah dihapus dari Supabase Auth

2. **Password Baru**
   - Buat password yang kuat dan mudah diingat
   - Simpan password dengan aman
   - Jangan bagikan password ke orang lain

3. **Profile Teacher Otomatis**
   - Profile teacher akan dibuat otomatis saat login pertama kali
   - Tidak perlu membuat manual di tabel `teachers`
   - Sistem akan mengambil email dan membuat profile dengan nama default

4. **Data Tidak Terpengaruh**
   - Data siswa, kelas, tugas, nilai, dan kehadiran tidak terpengaruh
   - Karena data diimport via CSV, referensi ke teacher biasanya NULL
   - Tidak ada data yang akan hilang

---

## 🆘 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Cek Supabase Dashboard**
   - Pastikan project aktif
   - Cek error logs di Logs → API Logs

2. **Cek Browser Console**
   - Buka Developer Tools (F12)
   - Lihat error di Console tab

3. **Cek Network Tab**
   - Buka Developer Tools (F12)
   - Lihat request ke Supabase di Network tab
   - Cek response error dari API

4. **Hubungi Support**
   - support@lms3.com
   - Sertakan screenshot error dan langkah yang sudah dilakukan

---

**Selamat! Akun guru sudah berhasil direset dan bisa digunakan kembali.** 🎉

