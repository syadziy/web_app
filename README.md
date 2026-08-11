# Control Room — Centralized Service Dashboard

Dashboard operasional ReactJS untuk mengelola User Management, Scheduler, Centralized Alert, dan
Audit Log melalui satu API Gateway. Antarmuka menggunakan English sebagai bahasa default dan
menyediakan pilihan Bahasa Indonesia di samping pengaturan tema.

## Fitur utama

- Login multi-tenant dan session token yang hanya disimpan selama tab browser aktif.
- Menu, route, tab, loader, dan action yang mengikuti granular permission dari access token.
- Registrasi serta daftar tenant, termasuk pembuatan owner superadmin pertama.
- Manajemen user, role, dan permission di dalam tenant aktif.
- Scheduler untuk task, task group, schedule, serta history dengan filter tanggal dan atribut
  eksekusi.
- Centralized Alert untuk konfigurasi recipient, pembuatan alert, dan email delivery history.
- Audit Log untuk menelusuri aktivitas user dan service melalui API Gateway.
- Notifikasi alert realtime melalui STOMP WebSocket.
- Tema light, dark, dan system serta pilihan bahasa English/Bahasa Indonesia.
- Server-side pagination: perpindahan halaman dan perubahan page size selalu mengambil data baru
  menggunakan parameter `limit` dan `offset`.

Semua data table memakai default 10 baris dengan opsi 50, 100, dan 500. Scheduler history memakai
default 500 dengan opsi 1000, 1500, dan 2000.

## Menjalankan aplikasi

```bash
cp .env.example .env
npm install
npm run dev
```

API default berada di `http://localhost:9001`. Ubah `VITE_API_BASE_URL` jika API Gateway berjalan pada alamat lain.
Notifikasi realtime memakai `VITE_ALERT_WS_URL` dengan default `ws://localhost:9001/ws/alerts`.

## Struktur

- `src/components`: komponen UI reusable seperti input, modal, table, status, dan button.
- `src/pages`: halaman berdasarkan domain backend.
- `src/services`: HTTP client dan kontrak endpoint melalui API Gateway.
- `src/store`: context untuk session autentikasi, permission, tema, dan bahasa.
- `src/hooks`: logika request reusable.
- `src/layouts`: kerangka navigasi dashboard.
- `src/services/notifications.js`: koneksi STOMP, JWT `CONNECT`, heartbeat, dan reconnect otomatis.

Setelah login, header dashboard menampilkan indikator koneksi, unread counter, dan maksimal 50
notifikasi alert terbaru. Token harus membawa permission `alert:read-notifications`.

Menu, kartu overview, route halaman, tab, pemanggilan API, dan tombol aksi mengikuti permission
dari response login. Contohnya menu tenant membutuhkan `tenant:view`, tombol tambah user
membutuhkan `user:create` beserta `role:assign` dan `role:view`, sedangkan konfigurasi scheduler
membutuhkan `scheduler:manage`. Pemeriksaan UI hanya menyembunyikan akses yang tidak relevan;
backend dan API Gateway tetap menjadi enforcement keamanan utama.

## Bahasa dan tema

English adalah bahasa awal ketika belum ada preferensi tersimpan. Pengguna dapat mengganti bahasa
ke Bahasa Indonesia melalui selector di header, tepat di samping selector tema. Preferensi bahasa
disimpan dengan key `control-room-language` di `localStorage`; access token tetap tidak pernah
disimpan di sana.

Teks antarmuka bersama dikelola melalui `src/store/LanguageContext.jsx`. Teks baru tidak boleh
ditulis sebagai string terjemahan yang tersebar di component; tambahkan key English dan Indonesian
ke dictionary kemudian gunakan `t(key)`.

## Kontrak pagination API

List page menggunakan `useRemoteList` dan meneruskan state pagination ke service API. Request awal
mengirim `limit` dan `offset=0`; tombol Next, Previous, atau perubahan page size memicu request baru.
Backend sebaiknya mengembalikan envelope paging dengan nilai total, contohnya:

```json
{
  "data": [],
  "paging": {
    "limit": 10,
    "offset": 0,
    "total": 125
  }
}
```

Tanpa nilai `total` dari backend, web hanya dapat memperkirakan keberadaan halaman berikutnya.

## Verifikasi

```bash
npm run lint
npm test
npm run build
```

## Docker

Build image dengan alamat API Gateway yang akan dipakai oleh browser:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:9001 \
  --build-arg VITE_API_CLIENT_ID=operations-ui \
  --build-arg VITE_ALERT_WS_URL=ws://localhost:9001/ws/alerts \
  -t control-room-web:latest .
```

Jalankan container pada port `5173`:

```bash
docker run --rm -p 5173:5173 control-room-web:latest
```

Buka `http://localhost:5173`. Health check tersedia di `GET /health`. Karena Vite memasukkan
environment variable pada waktu build, gunakan build argument yang sesuai untuk setiap environment.

> API Gateway harus mengekspos route `/api/v1/auth/**` dan `/api/v1/tenants/**` agar halaman Identity dapat mengakses User Management melalui entry point yang sama.
