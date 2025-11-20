# Setup Disqus untuk Newsroom

Fitur komentar Disqus telah diintegrasikan ke dalam halaman Newsroom. Setiap postingan yang dipublikasikan akan otomatis memiliki thread komentar Disqus yang unik.

## Konfigurasi

### 1. Daftar Akun Disqus

1. Kunjungi [https://disqus.com/](https://disqus.com/)
2. Buat akun baru atau login ke akun yang sudah ada
3. Buat situs baru (site) untuk aplikasi LMS Anda
4. Catat **shortname** dari situs Disqus Anda

**Shortname Disqus:** `lms-2lyxfqsfhg`

### 2. Setup Environment Variable

Tambahkan environment variable `VITE_DISQUS_SHORTNAME` ke file `.env` atau `.env.local`:

```env
VITE_DISQUS_SHORTNAME=lms-2lyxfqsfhg
```

**Catatan:** Jika environment variable tidak diatur, sistem akan menggunakan default `lms-newsroom`.

### 3. Verifikasi

Setelah konfigurasi:
1. Buat atau edit postingan di Newsroom
2. Publikasikan postingan tersebut
3. Buka postingan untuk melihat komentar Disqus
4. Thread komentar akan otomatis dibuat dengan identifier unik: `newsroom-{post-id}`

## Fitur

- ✅ Komentar Disqus otomatis muncul pada setiap postingan yang dipublikasikan
- ✅ Setiap postingan memiliki thread komentar yang unik
- ✅ Komentar hanya muncul untuk postingan dengan status "published"
- ✅ Mendukung bahasa Indonesia (default)
- ✅ Script Disqus dimuat secara lazy dan hanya sekali

## Komponen

Komponen `DisqusComments` dapat digunakan di halaman lain dengan cara:

```tsx
import { DisqusComments } from '../../components';

<DisqusComments
  shortname="lms-2lyxfqsfhg"
  identifier={`newsroom-${postId}`}
  url={`${window.location.origin}/newsroom/${postId}`}
  title={postTitle}
  language="id"
/>
```

## Troubleshooting

### Komentar tidak muncul
1. Pastikan postingan memiliki status "published"
2. Periksa console browser untuk error
3. Pastikan shortname Disqus sudah benar
4. Pastikan situs Disqus sudah diaktifkan

### Komentar muncul di semua postingan
- Setiap postingan memiliki identifier unik berdasarkan ID postingan
- Pastikan identifier berbeda untuk setiap postingan

## Catatan

- Disqus memerlukan koneksi internet untuk berfungsi
- Komentar Disqus memerlukan JavaScript untuk berfungsi
- Disqus gratis untuk penggunaan dasar

## Fitur Disqus

### ✅ Fitur yang Sudah Tersedia (CUKUP UNTUK OPERASI DASAR)

1. **Komentar Dasar**
   - ✅ Embed komentar Disqus pada setiap postingan
   - ✅ Identifier unik per postingan (`newsroom-{post-id}`)
   - ✅ URL dan title yang benar untuk setiap thread
   - ✅ Bahasa Indonesia (default)
   - ✅ Lazy loading script
   - ✅ Reset thread saat navigasi

2. **Konfigurasi**
   - ✅ Shortname Disqus: `lms-2lyxfqsfhg`
   - ✅ Komentar hanya muncul untuk postingan yang dipublikasikan

### 📝 Catatan Penting

**Fitur dasar Disqus sudah CUKUP untuk operasi normal sistem LMS.**

Fitur advanced seperti SSO, webhook, analytics, dan moderation tools:
- ❌ **TIDAK WAJIB** untuk operasi dasar
- ❌ Memerlukan Disqus Business plan (berbayar)
- ❌ Memerlukan setup backend tambahan
- ✅ Hanya diperlukan jika ada kebutuhan khusus

**Rekomendasi:** Gunakan fitur dasar yang sudah tersedia. Jika nanti diperlukan fitur advanced, dapat ditambahkan kemudian.

