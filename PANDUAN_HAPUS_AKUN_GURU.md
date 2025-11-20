# 🗑️ Panduan Menghapus Akun Guru

Panduan ini menjelaskan cara menghapus akun guru dari Supabase Auth dengan mudah.

---

## ✨ Fitur Baru

Sekarang Anda dapat menghapus akun guru dengan mudah:
- ✅ **Dari Supabase Dashboard** - Hapus langsung dari menu Authentication (otomatis menghapus profil teacher)
- ✅ **Menggunakan Function Database** - Hapus dengan function untuk kontrol lebih detail
- ✅ **Trigger Otomatis** - Profil teacher akan otomatis terhapus ketika user dihapus dari `auth.users`

---

## 📋 Cara Menghapus Akun Guru

### Metode 1: Menggunakan Function Database (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke [https://app.supabase.com](https://app.supabase.com)
   - Pilih project Anda

2. **Buka SQL Editor**
   - Klik menu **"SQL Editor"** di sidebar
   - Klik **"New query"**

3. **Jalankan Function**

   **Opsi A: Hapus berdasarkan Email**
   ```sql
   SELECT delete_teacher_account('guru@sekolah.com');
   ```

   **Opsi B: Hapus berdasarkan ID**
   ```sql
   SELECT delete_teacher_account_by_id('uuid-guru-di-sini');
   ```

4. **Verifikasi**
   - Function akan mengembalikan JSON dengan informasi guru yang dihapus
   - Cek di **Authentication → Users** untuk memastikan akun sudah terhapus
   - Cek di tabel `teachers` untuk memastikan profil sudah terhapus

---

### Metode 2: Melalui Supabase Dashboard (Manual)

1. **Hapus dari Authentication**
   - Buka **Authentication → Users**
   - Cari email guru yang ingin dihapus
   - Klik pada user tersebut
   - Scroll ke bawah, klik **"Delete user"**
   - Konfirmasi penghapusan

2. **Hapus Profil Teacher (Opsional)**
   - Buka **SQL Editor**
   - Jalankan query:
   ```sql
   DELETE FROM teachers 
   WHERE email = 'guru@sekolah.com';
   ```

---

## 🔄 Menambahkan Akun Guru Baru

Setelah menghapus, Anda bisa menambahkan akun guru baru dengan mudah:

1. **Buka Authentication → Users**
   - Klik **"Add user"** atau **"Create new user"**

2. **Isi Form**
   - **Email**: Email guru (contoh: `guru@sekolah.com`)
   - **Password**: Password untuk guru
   - **Auto Confirm User**: ✅ **Centang ini** (penting!)
   - **Send invitation email**: ❌ Jangan centang

3. **Klik "Create user"**

4. **Profil Otomatis Dibuat**
   - Trigger `on_auth_user_created_teacher` akan otomatis membuat profil di tabel `teachers`
   - Guru bisa langsung login tanpa setup tambahan

---

## 📝 Function yang Tersedia

### 1. `delete_teacher_account(email TEXT)`
Menghapus akun guru berdasarkan email.

**Contoh:**
```sql
SELECT delete_teacher_account('guru@sekolah.com');
```

**Response:**
```json
{
  "success": true,
  "message": "Teacher account deleted successfully",
  "deleted_teacher": {
    "id": "uuid-here",
    "email": "guru@sekolah.com",
    "full_name": "Nama Guru"
  }
}
```

### 2. `delete_teacher_account_by_id(teacher_id UUID)`
Menghapus akun guru berdasarkan ID.

**Contoh:**
```sql
SELECT delete_teacher_account_by_id('123e4567-e89b-12d3-a456-426614174000');
```

---

## ⚠️ Catatan Penting

1. **Data yang Terpengaruh:**
   - ❌ Akun guru di Supabase Auth akan dihapus
   - ❌ Profil guru di tabel `teachers` akan dihapus
   - ✅ Data siswa, kelas, tugas, nilai, dan kehadiran **TIDAK** terpengaruh

2. **Foreign Key Constraints:**
   - Function akan menghapus dari `teachers` terlebih dahulu, kemudian dari `auth.users`
   - Ini mencegah error foreign key constraint

3. **Auto-Create Trigger:**
   - Trigger `on_auth_user_created_teacher` tetap aktif
   - Setiap user baru di `auth.users` akan otomatis mendapat profil di `teachers`

---

## 🔍 Verifikasi

### Cek Apakah Akun Sudah Terhapus

```sql
-- Cek di auth.users
SELECT id, email FROM auth.users WHERE email = 'guru@sekolah.com';

-- Cek di teachers
SELECT id, email, full_name FROM teachers WHERE email = 'guru@sekolah.com';
```

Kedua query di atas seharusnya tidak mengembalikan hasil jika akun sudah terhapus.

---

## 🛠️ Troubleshooting

### Error: "Teacher with email ... not found"
- Pastikan email yang dimasukkan benar
- Cek apakah guru ada di tabel `teachers`

### Error: "Permission denied"
- Pastikan Anda menggunakan service role atau authenticated user
- Function menggunakan `SECURITY DEFINER` jadi seharusnya tidak ada masalah

### Trigger Tidak Membuat Profil Otomatis
- Cek apakah trigger aktif:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_teacher';
  ```
- Jika tidak ada, jalankan migration `20250126000001_fix_teacher_login.sql` atau `20250126000002_auto_create_teacher.sql`

---

## 📚 Migration Files

- `20250126000003_enable_teacher_deletion.sql` - Function untuk menghapus akun guru
- `20250126000001_fix_teacher_login.sql` - Trigger auto-create teacher profile
- `20250126000002_auto_create_teacher.sql` - Backup trigger auto-create

---

## 💡 Tips

1. **Backup Data (Opsional)**
   - Sebelum menghapus, Anda bisa backup data guru:
   ```sql
   SELECT * FROM teachers WHERE email = 'guru@sekolah.com';
   ```

2. **Cek Dependencies**
   - Sebelum menghapus, cek apakah guru masih memiliki data terkait:
   ```sql
   -- Cek kelas yang dibuat oleh guru
   SELECT COUNT(*) FROM classes WHERE created_by = (SELECT id FROM teachers WHERE email = 'guru@sekolah.com');
   
   -- Cek tugas yang dibuat oleh guru
   SELECT COUNT(*) FROM assignments WHERE created_by = (SELECT id FROM teachers WHERE email = 'guru@sekolah.com');
   ```

3. **Gunakan Function untuk Konsistensi**
   - Lebih baik menggunakan function `delete_teacher_account()` daripada menghapus manual
   - Function memastikan semua data terhapus dengan benar

