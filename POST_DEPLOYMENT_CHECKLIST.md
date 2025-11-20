# ✅ Checklist Post-Deployment LMS

Dokumentasi ini berisi checklist penting untuk memverifikasi semua fitur vital berfungsi dengan baik setelah setup atau deployment website LMS.

## 🎯 Tujuan

Memastikan semua fitur kritis berfungsi dengan benar setelah deployment, sehingga sistem siap digunakan oleh guru dan siswa.

---

## 📋 Checklist Pra-Deployment

### 1. Environment Variables
- [ ] **Supabase Configuration**
  - [ ] `VITE_SUPABASE_URL` sudah diisi
  - [ ] `VITE_SUPABASE_ANON_KEY` sudah diisi
  - [ ] `VITE_DISQUS_SHORTNAME` sudah diisi (opsional: `lms-2lyxfqsfjk`)

### 2. Database Migration
- [ ] **Migration sudah dijalankan**
  ```bash
  npx supabase db push
  ```
  - [ ] Semua tabel berhasil dibuat
  - [ ] RLS policies berhasil diterapkan
  - [ ] Storage buckets berhasil dibuat

### 3. Storage Buckets
- [ ] **Bucket `avatars`** - untuk foto profil
- [ ] **Bucket `materials`** - untuk materi pembelajaran
- [ ] **Bucket `submissions`** - untuk pengumpulan tugas
- [ ] **Bucket `newsroom-images`** - untuk gambar berita

---

## 🔐 Checklist Authentication (PRIORITAS TINGGI)

### Teacher Authentication
- [ ] **Login sebagai Guru**
  - [ ] Buka halaman login
  - [ ] Pilih "Login sebagai Guru"
  - [ ] Masukkan email dan password guru
  - [ ] ✅ Berhasil login dan redirect ke dashboard
  - [ ] ✅ Session tersimpan dengan benar

- [ ] **Logout**
  - [ ] Klik tombol logout
  - [ ] ✅ Session terhapus
  - [ ] ✅ Redirect ke halaman login

### Student Authentication
- [ ] **Login sebagai Siswa**
  - [ ] Buka halaman login
  - [ ] Pilih "Login sebagai Siswa"
  - [ ] Masukkan email dan password siswa
  - [ ] ✅ Berhasil login dan redirect ke dashboard
  - [ ] ✅ Session tersimpan dengan benar

- [ ] **Logout**
  - [ ] Klik tombol logout
  - [ ] ✅ Session terhapus
  - [ ] ✅ Redirect ke halaman login

### Error Handling
- [ ] **Login dengan kredensial salah**
  - [ ] ✅ Menampilkan error message yang jelas
  - [ ] ✅ Tidak crash aplikasi

---

## 🗄️ Checklist Database & Storage (PRIORITAS TINGGI)

### Database Connection
- [ ] **Koneksi ke Supabase**
  - [ ] Dashboard dapat memuat data
  - [ ] Tidak ada error di console browser
  - [ ] Tidak ada error di network tab

### Row Level Security (RLS)
- [ ] **Teacher dapat mengakses semua data**
  - [ ] ✅ Dapat melihat semua kelas
  - [ ] ✅ Dapat melihat semua siswa
  - [ ] ✅ Dapat melihat semua tugas

- [ ] **Student hanya dapat mengakses data sendiri**
  - [ ] ✅ Hanya melihat kelas yang diikuti
  - [ ] ✅ Hanya melihat tugas sendiri
  - [ ] ✅ Tidak dapat mengakses data siswa lain

### Storage Upload
- [ ] **Upload Avatar**
  - [ ] Teacher dapat upload foto profil
  - [ ] Student dapat upload foto profil
  - [ ] ✅ File tersimpan di bucket `avatars`
  - [ ] ✅ File dapat diakses kembali

- [ ] **Upload Material**
  - [ ] Teacher dapat upload materi pembelajaran
  - [ ] ✅ File tersimpan di bucket `materials`
  - [ ] ✅ Student dapat mengunduh materi

- [ ] **Upload Submission**
  - [ ] Student dapat upload tugas
  - [ ] ✅ File tersimpan di bucket `submissions`
  - [ ] ✅ Teacher dapat mengunduh submission

---

## 📚 Checklist Fitur Core (PRIORITAS TINGGI)

### 1. Kelas (Classes)
- [ ] **Membuat Kelas**
  - [ ] Teacher dapat membuat kelas baru
  - [ ] ✅ Kode kelas unik ter-generate
  - [ ] ✅ Kelas muncul di daftar kelas

- [ ] **Mengelola Kelas**
  - [ ] ✅ Edit informasi kelas
  - [ ] ✅ Hapus kelas
  - [ ] ✅ Lihat detail kelas

- [ ] **Menambah Siswa ke Kelas**
  - [ ] ✅ Teacher dapat menambah siswa ke kelas
  - [ ] ✅ Siswa muncul di daftar siswa kelas
  - [ ] ✅ Student dapat melihat kelas yang diikuti

### 2. Tugas (Assignments)
- [ ] **Membuat Tugas Wajib**
  - [ ] Teacher dapat membuat tugas wajib
  - [ ] ✅ Tugas muncul di kelas yang dipilih
  - [ ] ✅ Student dapat melihat tugas

- [ ] **Membuat Tugas Tambahan**
  - [ ] Teacher dapat membuat tugas tambahan
  - [ ] ✅ Tugas muncul untuk semua siswa di tingkat tertentu
  - [ ] ✅ Student dapat melihat tugas

- [ ] **Mengelola Tugas**
  - [ ] ✅ Edit tugas
  - [ ] ✅ Hapus tugas
  - [ ] ✅ Lihat detail tugas

### 3. Pengumpulan Tugas (Submissions)
- [ ] **Student Mengumpulkan Tugas**
  - [ ] ✅ Student dapat mengumpulkan tugas
  - [ ] ✅ File tersimpan dengan benar
  - [ ] ✅ Status berubah menjadi "submitted"

- [ ] **Teacher Menilai Tugas**
  - [ ] ✅ Teacher dapat melihat submission
  - [ ] ✅ Teacher dapat memberikan nilai
  - [ ] ✅ Teacher dapat memberikan feedback
  - [ ] ✅ Status berubah menjadi "graded"

- [ ] **Student Melihat Nilai**
  - [ ] ✅ Student dapat melihat nilai yang diberikan
  - [ ] ✅ Feedback dapat dibaca

### 4. Absensi (Attendance)
- [ ] **Mencatat Absensi**
  - [ ] ✅ Teacher dapat mencatat absensi
  - [ ] ✅ Status absensi tersimpan (present/absent/sick/permission)
  - [ ] ✅ Data absensi dapat dilihat kembali

- [ ] **Melihat Absensi**
  - [ ] ✅ Teacher dapat melihat laporan absensi
  - [ ] ✅ Student dapat melihat absensi sendiri

### 5. Materi Pembelajaran (Materials)
- [ ] **Upload Materi**
  - [ ] ✅ Teacher dapat upload materi
  - [ ] ✅ File tersimpan dengan benar
  - [ ] ✅ Student dapat mengunduh materi

- [ ] **Mengelola Materi**
  - [ ] ✅ Edit informasi materi
  - [ ] ✅ Hapus materi

### 6. Newsroom (Berita & Pengumuman)
- [ ] **Membuat Postingan**
  - [ ] ✅ Teacher dapat membuat berita/pengumuman
  - [ ] ✅ Upload gambar berhasil
  - [ ] ✅ Postingan dapat disimpan sebagai draft

- [ ] **Mempublikasikan Postingan**
  - [ ] ✅ Teacher dapat mempublikasikan postingan
  - [ ] ✅ Student dapat melihat postingan yang dipublikasikan
  - [ ] ✅ Postingan draft tidak terlihat oleh student

- [ ] **Komentar Disqus**
  - [ ] ✅ Komentar Disqus muncul pada postingan yang dipublikasikan
  - [ ] ✅ Setiap postingan memiliki thread komentar unik
  - [ ] ✅ User dapat menulis komentar

---

## 📊 Checklist Dashboard & Analytics

### Teacher Dashboard
- [ ] **Statistik**
  - [ ] ✅ Total kelas ditampilkan dengan benar
  - [ ] ✅ Total siswa ditampilkan dengan benar
  - [ ] ✅ Total tugas ditampilkan dengan benar
  - [ ] ✅ Tugas menunggu review ditampilkan dengan benar

- [ ] **Grafik**
  - [ ] ✅ Grafik tren tugas ditampilkan
  - [ ] ✅ Grafik distribusi nilai ditampilkan
  - [ ] ✅ Tidak ada error di console

### Student Dashboard
- [ ] **Statistik**
  - [ ] ✅ Total tugas ditampilkan dengan benar
  - [ ] ✅ Tugas dikumpulkan ditampilkan dengan benar
  - [ ] ✅ Tugas dinilai ditampilkan dengan benar
  - [ ] ✅ Total poin ditampilkan dengan benar

- [ ] **Grafik**
  - [ ] ✅ Grafik performa nilai ditampilkan
  - [ ] ✅ Tidak ada error di console

---

## 🔔 Checklist Notifikasi

- [ ] **Notifikasi untuk Teacher**
  - [ ] ✅ Notifikasi muncul saat ada submission baru
  - [ ] ✅ Notifikasi dapat ditandai sudah dibaca
  - [ ] ✅ Notifikasi dapat dihapus

- [ ] **Notifikasi untuk Student**
  - [ ] ✅ Notifikasi muncul saat tugas dinilai
  - [ ] ✅ Notifikasi muncul saat ada tugas baru
  - [ ] ✅ Notifikasi dapat ditandai sudah dibaca

---

## 📱 Checklist Responsive Design

- [ ] **Desktop (1920x1080)**
  - [ ] ✅ Layout tampil dengan benar
  - [ ] ✅ Semua fitur dapat diakses

- [ ] **Tablet (768x1024)**
  - [ ] ✅ Layout responsive
  - [ ] ✅ Menu navigasi berfungsi
  - [ ] ✅ Form dapat diisi dengan mudah

- [ ] **Mobile (375x667)**
  - [ ] ✅ Layout mobile-friendly
  - [ ] ✅ Bottom navigation berfungsi
  - [ ] ✅ Touch interactions berfungsi

---

## 🔍 Checklist Error Handling

- [ ] **Network Error**
  - [ ] ✅ Menampilkan pesan error yang jelas
  - [ ] ✅ Tidak crash aplikasi
  - [ ] ✅ User dapat retry

- [ ] **Validation Error**
  - [ ] ✅ Form validation berfungsi
  - [ ] ✅ Pesan error jelas dan membantu

- [ ] **Permission Error**
  - [ ] ✅ Student tidak dapat mengakses halaman teacher
  - [ ] ✅ Error 403/404 ditangani dengan baik

---

## 🚨 Checklist Keamanan

- [ ] **Authentication**
  - [ ] ✅ Password tidak terlihat di network request
  - [ ] ✅ Session expired ditangani dengan benar
  - [ ] ✅ Tidak ada token yang ter-expose di console

- [ ] **Authorization**
  - [ ] ✅ RLS policies berfungsi dengan benar
  - [ ] ✅ Student tidak dapat mengakses data teacher
  - [ ] ✅ Student tidak dapat mengakses data siswa lain

- [ ] **File Upload**
  - [ ] ✅ Validasi tipe file berfungsi
  - [ ] ✅ Validasi ukuran file berfungsi
  - [ ] ✅ File berbahaya tidak dapat diupload

---

## ⚡ Checklist Performance

- [ ] **Loading Time**
  - [ ] ✅ Halaman pertama load < 3 detik
  - [ ] ✅ Navigasi antar halaman smooth
  - [ ] ✅ Tidak ada lag saat interaksi

- [ ] **Image Optimization**
  - [ ] ✅ Gambar di-compress dengan benar
  - [ ] ✅ Lazy loading berfungsi

- [ ] **Code Splitting**
  - [ ] ✅ Bundle size tidak terlalu besar
  - [ ] ✅ Lazy loading komponen berfungsi

---

## 🧪 Quick Test Scenario

### Test Case 1: Flow Lengkap Tugas
1. [ ] Teacher login
2. [ ] Teacher membuat kelas
3. [ ] Teacher menambah siswa ke kelas
4. [ ] Teacher membuat tugas wajib
5. [ ] Student login
6. [ ] Student melihat tugas
7. [ ] Student mengumpulkan tugas
8. [ ] Teacher melihat submission
9. [ ] Teacher menilai tugas
10. [ ] Student melihat nilai

### Test Case 2: Flow Newsroom
1. [ ] Teacher login
2. [ ] Teacher membuat postingan berita
3. [ ] Teacher mempublikasikan postingan
4. [ ] Student login
5. [ ] Student melihat postingan
6. [ ] Student menulis komentar di Disqus
7. [ ] Komentar muncul dengan benar

### Test Case 3: Flow Absensi
1. [ ] Teacher login
2. [ ] Teacher membuka halaman absensi
3. [ ] Teacher mencatat absensi siswa
4. [ ] Student login
5. [ ] Student melihat absensi sendiri

---

## 📝 Catatan Penting

### Fitur Disqus
- **Yang Penting:** Komentar dasar sudah cukup
- **Tidak Perlu:** SSO, webhook, analytics (kecuali diperlukan)
- **Cek:** Pastikan komentar muncul dan dapat ditulis

### Environment Variables
- Pastikan semua environment variables sudah diisi
- Jangan commit `.env` ke repository
- Gunakan `.env.example` sebagai template

### Database
- Backup database secara berkala
- Monitor penggunaan storage
- Cek RLS policies secara berkala

---

## 🆘 Troubleshooting

### Jika Login Gagal
1. Cek environment variables Supabase
2. Cek koneksi internet
3. Cek console browser untuk error
4. Cek Supabase dashboard untuk status service

### Jika Upload File Gagal
1. Cek storage buckets sudah dibuat
2. Cek storage policies sudah benar
3. Cek ukuran file tidak melebihi limit
4. Cek tipe file diizinkan

### Jika Data Tidak Muncul
1. Cek RLS policies
2. Cek koneksi database
3. Cek console browser untuk error
4. Cek network tab untuk request yang gagal

---

## ✅ Final Checklist

Sebelum mengumumkan sistem siap digunakan:

- [ ] Semua checklist di atas sudah dicek
- [ ] Tidak ada error di console browser
- [ ] Tidak ada error di network tab
- [ ] Semua fitur core berfungsi
- [ ] Responsive design berfungsi di semua device
- [ ] Error handling berfungsi dengan baik
- [ ] Keamanan sudah diverifikasi

---

**Catatan:** Checklist ini fokus pada fitur vital. Fitur advanced seperti SSO Disqus, webhook, dan analytics tidak wajib untuk operasi dasar sistem.

