# Control Room — Centralized Service Dashboard

Dashboard ReactJS untuk mengoperasikan User Management, Scheduler, Centralized Alert, dan Audit Log melalui satu API Gateway.

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
- `src/store`: state sesi autentikasi in-memory.
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
