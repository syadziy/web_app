# Control Room — Centralized Service Dashboard

Dashboard ReactJS untuk mengoperasikan User Management, Scheduler, Centralized Alert, dan Audit Log melalui satu API Gateway.

## Menjalankan aplikasi

```bash
cp .env.example .env
npm install
npm run dev
```

API default berada di `http://localhost:9000`. Ubah `VITE_API_BASE_URL` jika API Gateway berjalan pada alamat lain.

## Struktur

- `src/components`: komponen UI reusable seperti input, modal, table, status, dan button.
- `src/pages`: halaman berdasarkan domain backend.
- `src/services`: HTTP client dan kontrak endpoint melalui API Gateway.
- `src/store`: state sesi autentikasi in-memory.
- `src/hooks`: logika request reusable.
- `src/layouts`: kerangka navigasi dashboard.

## Verifikasi

```bash
npm run lint
npm test
npm run build
```

> API Gateway harus mengekspos route `/api/v1/auth/**` dan `/api/v1/tenants/**` agar halaman Identity dapat mengakses User Management melalui entry point yang sama.
