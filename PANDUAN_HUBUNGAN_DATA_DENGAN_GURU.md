# 📚 Panduan: Hubungan Data Siswa & Kelas dengan Akun Guru

Dokumen ini menjelaskan hubungan antara data siswa dan kelas yang diimport dengan akun guru di sistem LMS.

---

## 🔍 Analisis Struktur Database

### 1. Tabel `students` (Siswa)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)  -- ⚠️ BISA NULL (OPSIONAL)
);
```

**Kesimpulan:**
- ✅ Kolom `created_by` **TIDAK wajib** (bisa NULL)
- ✅ Data siswa **TIDAK memerlukan** akun guru untuk dibuat
- ✅ Data siswa yang diimport **TIDAK terpengaruh** jika akun guru dihapus

### 2. Tabel `classes` (Kelas)

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)  -- ⚠️ BISA NULL (OPSIONAL)
);
```

**Kesimpulan:**
- ✅ Kolom `created_by` **TIDAK wajib** (bisa NULL)
- ✅ Data kelas **TIDAK memerlukan** akun guru jika diimport langsung ke database
- ✅ Data kelas yang diimport **TIDAK terpengaruh** jika akun guru dihapus

---

## 📊 Cara Import Data

### A. Import Melalui Web (Membutuhkan Login Guru)

#### 1. Import Siswa via Web
- **Lokasi:** Halaman "Daftar Siswa" → Tombol "Import Excel"
- **Syarat:** Harus login sebagai guru
- **Cara kerja:**
  ```typescript
  // Kode di StudentList.tsx baris 1046-1054
  await studentService.bulkImportStudents(
    data.map(...),
    teacher.id  // ✅ created_by diisi dengan ID guru yang login
  );
  ```
- **Hasil:** `created_by` akan terisi dengan ID guru yang sedang login

#### 2. Import Kelas via Web
- **Lokasi:** Halaman "Daftar Kelas" → Tombol "Tambah Kelas"
- **Syarat:** Harus login sebagai guru
- **Cara kerja:**
  ```typescript
  // Kode di classService.ts baris 72-77
  async createClass(classData: {
    name: string;
    grade: '10' | '11' | '12';
    class_code: string;
    created_by: string;  // ✅ WAJIB diisi
  })
  ```
- **Hasil:** `created_by` akan terisi dengan ID guru yang sedang login

### B. Import Langsung ke Database (TIDAK Membutuhkan Login)

#### 1. Import Siswa via SQL/CSV langsung ke Database
- **Cara:** Insert langsung ke tabel `students` via SQL Editor atau import tool
- **Syarat:** Tidak perlu login
- **Contoh SQL:**
  ```sql
  INSERT INTO students (email, full_name, password_hash, birth_date)
  VALUES ('siswa@sekolah.com', 'Nama Siswa', 'hash_password', '2005-01-01');
  -- created_by bisa NULL atau tidak diisi
  ```
- **Hasil:** `created_by` akan NULL (tidak ada hubungan dengan guru)

#### 2. Import Kelas via SQL/CSV langsung ke Database
- **Cara:** Insert langsung ke tabel `classes` via SQL Editor atau import tool
- **Syarat:** Tidak perlu login
- **Contoh SQL:**
  ```sql
  INSERT INTO classes (name, grade, class_code, description)
  VALUES ('Matematika 10A', '10', 'MATH10A', 'Kelas matematika');
  -- created_by bisa NULL atau tidak diisi
  ```
- **Hasil:** `created_by` akan NULL (tidak ada hubungan dengan guru)

---

## ✅ Jawaban Pertanyaan Anda

### Q: Apakah data siswa dan kelas yang diimport mempengaruhi atau berhubungan dengan akun guru?

**Jawaban: TIDAK WAJIB, tergantung cara import:**

1. **Jika diimport melalui Web (setelah login sebagai guru):**
   - ✅ `created_by` akan terisi dengan ID guru
   - ✅ Ada hubungan dengan akun guru
   - ⚠️ Jika akun guru dihapus, `created_by` menjadi NULL (data tetap aman)

2. **Jika diimport langsung ke database (SQL/CSV):**
   - ✅ `created_by` akan NULL
   - ✅ TIDAK ada hubungan dengan akun guru
   - ✅ Data TIDAK terpengaruh sama sekali jika akun guru dihapus

### Q: Apakah data siswa harus dibuat oleh guru melalui web, tidak boleh diimport?

**Jawaban: BOLEH diimport langsung ke database!**

- ✅ **Boleh diimport langsung** ke database tanpa login sebagai guru
- ✅ **Boleh dibuat melalui web** setelah login sebagai guru
- ✅ **Kedua cara sama-sama valid** dan data akan berfungsi normal

**Perbedaan:**
- Import via web: `created_by` terisi, ada activity log
- Import langsung: `created_by` NULL, tidak ada activity log

---

## 🔐 Dampak Menghapus Akun Guru

### Data yang TIDAK Terpengaruh:

1. ✅ **Data Siswa**
   - Data siswa tetap ada
   - `created_by` menjadi NULL (jika sebelumnya terisi)
   - Siswa tetap bisa login
   - Semua data siswa tetap utuh

2. ✅ **Data Kelas**
   - Data kelas tetap ada
   - `created_by` menjadi NULL (jika sebelumnya terisi)
   - Kelas tetap bisa diakses
   - Semua data kelas tetap utuh

3. ✅ **Data Tugas (Assignments)**
   - Data tugas tetap ada
   - `created_by` menjadi NULL (jika sebelumnya terisi)
   - Tugas tetap bisa dilihat dan dikerjakan

4. ✅ **Data Nilai (Grades)**
   - Data nilai tetap ada
   - Tidak terpengaruh sama sekali

5. ✅ **Data Kehadiran (Attendance)**
   - Data kehadiran tetap ada
   - `marked_by` menjadi NULL (jika sebelumnya terisi)

### Data yang Terpengaruh:

1. ⚠️ **Activity Logs**
   - Log aktivitas yang terkait dengan guru akan tetap ada
   - Tapi `teacher_id` menjadi NULL atau invalid

2. ⚠️ **Profile Teacher**
   - Profile guru di tabel `teachers` akan terhapus
   - Tapi ini tidak mempengaruhi data lain

---

## 📝 Kesimpulan

### Untuk Kasus Anda (Import via CSV):

Jika Anda mengimport data siswa dan kelas langsung ke database (bukan melalui web setelah login), maka:

1. ✅ **Data siswa dan kelas TIDAK berhubungan dengan akun guru**
2. ✅ **Data siswa dan kelas TIDAK terpengaruh** jika akun guru dihapus
3. ✅ **Anda bisa menghapus dan membuat ulang akun guru** tanpa khawatir kehilangan data
4. ✅ **Data akan tetap utuh** dan berfungsi normal

### Rekomendasi:

1. **Jika data sudah diimport langsung ke database:**
   - ✅ Aman untuk menghapus akun guru lama
   - ✅ Buat akun guru baru
   - ✅ Data tidak akan terpengaruh

2. **Jika ingin ada tracking siapa yang membuat data:**
   - Import ulang data melalui web setelah login sebagai guru
   - Atau update `created_by` manual via SQL:
     ```sql
     -- Update created_by untuk siswa
     UPDATE students 
     SET created_by = 'uuid-guru-baru' 
     WHERE created_by IS NULL;
     
     -- Update created_by untuk kelas
     UPDATE classes 
     SET created_by = 'uuid-guru-baru' 
     WHERE created_by IS NULL;
     ```

---

## 🆘 FAQ

### Q: Apakah saya harus import ulang data setelah membuat akun guru baru?

**A: TIDAK PERLU!** Data yang sudah diimport tetap bisa digunakan. Hanya jika Anda ingin `created_by` terisi dengan ID guru baru, baru perlu update manual.

### Q: Apakah siswa bisa login jika akun guru dihapus?

**A: YA!** Login siswa tidak tergantung pada akun guru. Siswa login menggunakan email dan password yang ada di tabel `students`, bukan melalui Supabase Auth.

### Q: Apakah kelas masih bisa diakses jika akun guru dihapus?

**A: YA!** Kelas tetap bisa diakses. Hanya `created_by` yang menjadi NULL, tapi data kelas tetap utuh.

### Q: Bagaimana cara update `created_by` untuk data yang sudah diimport?

**A: Gunakan SQL query:**
```sql
-- Dapatkan ID guru baru terlebih dahulu
SELECT id, email FROM teachers WHERE email = 'guru@sekolah.com';

-- Update created_by untuk siswa
UPDATE students 
SET created_by = 'uuid-guru-baru'  -- Ganti dengan ID guru baru
WHERE created_by IS NULL;

-- Update created_by untuk kelas
UPDATE classes 
SET created_by = 'uuid-guru-baru'  -- Ganti dengan ID guru baru
WHERE created_by IS NULL;
```

---

**Kesimpulan:** Data siswa dan kelas yang diimport langsung ke database **TIDAK memerlukan** dan **TIDAK terpengaruh** oleh akun guru. Anda bisa dengan aman menghapus dan membuat ulang akun guru tanpa khawatir kehilangan data! 🎉

