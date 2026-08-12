# AGENTS.md

## Project overview

`web_app` adalah dashboard operasional React untuk mengakses `usermanagement`, `scheduler`,
`centralized_alert`, dan `audit_log` melalui satu `api_gateway`.

Stack utama:

- React dan React DOM
- React Router
- Vite
- React Context untuk session autentikasi, tema, dan bahasa
- Fetch wrapper untuk REST API
- STOMP WebSocket untuk notifikasi alert realtime
- Vitest, Testing Library, ESLint, dan jsdom
- Nginx sebagai static-file server pada runtime container

Prioritas desain:

- Permission-aware UI yang konsisten dengan enforcement backend dan API Gateway.
- Tidak mengirim request API yang sudah diketahui tidak diizinkan.
- Access token hanya disimpan dalam cookie `HttpOnly`; JavaScript tidak boleh membaca atau
  menyimpan token.
- Tampilan operasional yang responsif, mudah dipindai, dan tetap aksesibel.
- English sebagai bahasa default dengan terjemahan Bahasa Indonesia yang konsisten.
- Tidak membocorkan token, credential, atau data sensitif melalui UI, log, maupun build artifact.

## Project structure

```text
src/
├── components/             # Shared UI dan realtime notification components
├── hooks/                  # Reusable data-loading hooks
├── layouts/                # Application shell, navigation, and top bar
├── pages/                  # Route-level dashboard pages
├── services/               # REST and WebSocket clients
├── store/                  # Auth/theme contexts, session, and permission helpers
├── styles/                 # Global application styles
├── test/                   # Shared test setup
├── App.jsx                 # Routes and route authorization
└── main.jsx                # React bootstrap
```

Gunakan struktur yang sudah ada. Jangan menambah state-management library, design system, atau
request library baru tanpa kebutuhan project-wide yang jelas.

## Development commands

Jalankan perintah dari direktori `web_app`.

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Jalankan satu test:

```bash
npx vitest run src/store/permissions.test.js
```

## Authorization and permissions

- Treat `session.tenantKey === 'superadmin'` as the only platform permission bypass. The Tenant
  menu and `/tenants` route must additionally require this tenant key even when `tenant:view` is
  present. Never infer platform access from username or the tenant-scoped `SUPERADMIN` role.
- Identity menampilkan tenant selector hanya untuk platform superadmin. Tenant yang dipilih wajib
  menjadi `tenantId` untuk list dan mutation user, role, serta permission; tenant biasa selalu
  memakai `session.tenantId` dan tidak boleh melihat selector tersebut.
- Backend dan API Gateway adalah enforcement keamanan utama. Visibility guard frontend bukan
  pengganti authorization server-side.
- Ambil permission dari `session.permissions` pada response login.
- Definisikan authority di `src/store/permissions.js`; jangan menyebarkan string permission baru
  secara manual ke banyak komponen.
- Gunakan `can(permission)` atau `canAny(permissions)` dari `AuthContext`.
- Nama permission harus sama persis dengan kontrak backend, tanpa prefix `PERM_`, misalnya
  `tenant:view`, `user:create`, dan `scheduler:manage`.
- Terapkan permission pada seluruh lapisan UI yang relevan:
  - sidebar navigation;
  - overview/service cards;
  - direct route access;
  - tabs dan panels;
  - create/edit/delete/dispatch/toggle buttons;
  - modal dan form;
  - remote data loaders dan realtime connections.
- Jangan hanya menyembunyikan tombol. Pastikan loader atau effect tidak tetap memanggil endpoint
  yang tidak diizinkan.
- Jika satu workflow menjalankan beberapa endpoint, tombol hanya boleh muncul ketika semua
  permission yang diperlukan tersedia. Contoh create user saat ini membutuhkan `user:create`,
  `role:assign`, dan `role:view` karena user langsung ditempelkan ke role yang dipilih.
- Create scheduler group membutuhkan `scheduler:manage` untuk mutation dan `scheduler:read` untuk
  memuat pilihan task/child group. Kirim member sebagai `taskIds` dan `groupIds`, bukan object hasil
  list; minimal satu member wajib dipilih.
- Pengguna yang membuka route tanpa permission harus diarahkan ke overview, bukan melihat halaman
  yang kemudian gagal dengan 401/403.
- Setiap menu atau action baru wajib memiliki permission granular yang disepakati sebelum
  implementasi. Terapkan authority yang sama pada backend controller/API Gateway, katalog dan
  migration permission User Management, `src/store/permissions.js`, sidebar/service card, direct
  route guard, action/modal, serta loader/effect. Tambahkan focused allow/deny tests di frontend dan
  backend; perubahan belum lengkap bila salah satu lapisan tersebut belum diperbarui.

## Authentication and session

- Gunakan `AuthContext`; jangan membuat sumber session kedua.
- Normalisasi response login melalui `normalizeSession`.
- Semua request REST memakai `credentials: 'include'`; API Gateway mengambil JWT dari cookie
  `HttpOnly`. Jangan membuat kembali module-level access token atau header Bearer dari JavaScript.
- Saat bootstrap, panggil `GET /api/v1/auth/session` sebelum route guard memutuskan redirect agar
  refresh halaman mempertahankan login. Login hanya menyimpan metadata session di React state.
- Logout wajib memanggil `POST /api/v1/auth/logout` untuk menghapus cookie, lalu membersihkan React
  state walaupun request logout gagal.
- Jangan menyimpan access token ke `localStorage`, `sessionStorage`, cookie JavaScript, URL, log
  console, DOM attribute, atau error message.
- Jangan menampilkan halaman protected atau form login sebelum bootstrap session selesai.
- WebSocket notification hanya boleh aktif untuk session dengan `alert:read-notifications`.
  Browser mengirim cookie pada handshake dan gateway me-relay JWT; jangan mengirim token pada STOMP
  `CONNECT` dari JavaScript.

## REST and data loading

- Semua request HTTP baru harus ditambahkan ke `src/services/api.js` atau service module yang
  setara; page tidak boleh merakit fetch implementation sendiri.
- Gunakan API Gateway sebagai base URL. Browser tidak boleh mengakses hostname container seperti
  `host.docker.internal` atau nama Docker service.
- Gunakan `useRemoteList` untuk list sederhana dan berikan flag `enabled` berdasarkan permission.
- Pagination list harus server-side. Setiap Next, Previous, dan perubahan page size harus memanggil
  endpoint kembali dengan `limit` dan `offset`; jangan mengambil seluruh data lalu memotongnya di
  browser.
- Teruskan object `pagination` dari `useRemoteList` ke `DataTable` secara eksplisit.
- Reset `offset` ke `0` ketika filter atau query list berubah.
- Gunakan `paging.total_record` dari response backend sebagai total authoritative. Normalizer boleh
  mempertahankan fallback format lama, tetapi jangan mengganti total dengan panjang data page aktif.
- `DataTable` menampilkan rentang `offset + 1` sampai `min(offset + rows.length, total_record)` dan
  jumlah halaman `max(1, ceil(total_record / limit))`. Tombol Next dinonaktifkan hanya ketika akhir
  page telah mencapai `total_record`.
- Teruskan `AbortSignal` agar request dibatalkan ketika component unmount atau dependency berubah.
- Tangani loading, empty, error, retry, dan success feedback secara eksplisit.
- Jangan retry 401/403 secara otomatis. Error tersebut harus diselesaikan melalui session atau
  permission yang benar.
- Gunakan envelope normalization yang sudah tersedia; jangan membuat format response kedua.
- Jangan mengirim field kosong yang mengubah arti request jika API membedakan antara absent dan
  empty.

## Components and UX

- Gunakan komponen bersama dari `src/components/ui.jsx` sebelum membuat variasi baru.
- Semua icon aplikasi wajib memakai komponen `MaterialIcon` dan nama ligature Material Icons yang
  tersedia. Jangan memakai emoji, karakter Unicode dekoratif, atau library icon lain sebagai icon UI.
- Pertahankan pola `Panel`, `Status`, `Notice`, `DataTable`, `Field`, `Button`, dan `Modal`.
- Semua tabel default memakai 10 baris dengan opsi 50, 100, dan 500, kecuali scheduler history
  yang default 500 dengan opsi 1000, 1500, dan 2000.
- `DataTable` wajib mempertahankan horizontal scroll ketika jumlah/lebar kolom melebihi panel.
  Area tabel harus keyboard-focusable dan pagination tetap berada di luar area horizontal scroll.
- Form harus memiliki label, name, validation attribute, loading state, dan feedback kegagalan.
- Tombol aksi destruktif harus jelas dan tidak boleh dipicu tanpa interaksi pengguna.
- Modal harus dapat ditutup, mempunyai judul yang terhubung secara aksesibel, dan tidak kehilangan
  state tanpa alasan.
- English adalah bahasa default. Semua teks UI baru harus memiliki terjemahan English dan Bahasa
  Indonesia melalui `LanguageContext`; jangan menambah string bilingual yang tersebar langsung di
  component.
- Gunakan `useLanguage()` dan `t(key)` untuk label, tombol, empty state, filter, serta feedback.
  Gunakan locale `en-US` atau `id-ID` sesuai bahasa aktif untuk tanggal dan angka.
- Tempatkan pilihan bahasa di samping pilihan tema pada application shell dan halaman login.
- Pada application header mobile, gabungkan pilihan tema dan bahasa dalam popup di bawah tombol
  settings agar topbar tidak penuh. Jangan menerapkan pola popup ini pada halaman login.
- Preferensi bahasa boleh disimpan di `localStorage`, tetapi access token tetap hanya boleh hidup
  selama tab aktif.
- Jangan membuat layout baru yang mengabaikan responsive behavior dan theme variables yang ada.
- Ikon harus memiliki label aksesibel jika maknanya tidak disertai teks.

## Audit and gateway log presentation

- Halaman Audit menampilkan Service dari field `resourceType`; jangan mengambil Service dari
  `sourceSystem`, action, atau metadata permission.
- Halaman Audit menampilkan Endpoint dari metadata `httpMethod` dan `httpPath` dalam format
  `<METHOD> <PATH>`. Gunakan placeholder netral untuk event historis yang belum memiliki metadata.
- Jangan menyimpulkan endpoint hanya dari action. Recipient configuration dan delivery history
  harus tetap dapat dibedakan walaupun berasal dari service yang sama.
- Halaman Gateway Logs mengambil data dari `/api/v1/gateway-logs` melalui API Gateway dan hanya
  tersedia bagi pengguna dengan permission khusus `gateway-log:read`. Permission `audit:read`
  hanya membuka Audit Log dan tidak boleh ikut membuka Gateway Logs.

## React guidelines

- Gunakan function components dan hooks.
- Jangan melakukan side effect saat render.
- Jangan menonaktifkan rules of hooks.
- Simpan state sedekat mungkin dengan consumer-nya; naikkan ke Context hanya untuk state lintas
  halaman seperti auth atau theme.
- Hindari duplikasi derived state. Gunakan nilai yang dihitung dari session/data jika memungkinkan.
- Jangan menambahkan Redux Toolkit hanya untuk state lokal atau permission checks. Penambahan global
  state library memerlukan keputusan arsitektur project-wide.
- Pastikan callback async selalu mengembalikan loading state ke kondisi normal melalui `finally`.
- Jangan mengabaikan race, abort, atau state update setelah unmount pada data loader.

## Styling

- Gunakan class naming dan CSS variables yang sudah ada di `src/styles/global.css`.
- Jangan memasukkan style kompleks secara inline.
- Pertahankan dukungan theme dan kontras teks/control.
- Uji tampilan desktop dan viewport sempit untuk perubahan layout material.
- Hindari ukuran fixed yang memotong tabel, modal, atau form pada layar kecil.

## Testing

Setiap perubahan perilaku membutuhkan focused test.

Minimal cakupan perilaku yang harus diuji:

- session response terbungkus dan tidak terbungkus;
- permission helper untuk allow dan deny;
- menu/route/action visibility untuk pengguna dengan dan tanpa permission;
- data loader tidak memanggil API ketika disabled;
- form submit success dan error untuk workflow yang berubah;
- pagination defaults dan options;
- pagination memakai `paging.total_record` untuk label Showing dan total halaman;
- rendering Service dan Endpoint audit dari field kontrak yang benar;
- perubahan halaman memanggil loader kembali dengan pasangan `limit` dan `offset` yang benar;
- English menjadi bahasa default dan pergantian ke Bahasa Indonesia tersimpan serta memperbarui
  atribut `lang` pada document;
- realtime notification visibility dan lifecycle;
- theme behavior untuk perubahan theme-related.

Gunakan Testing Library berdasarkan perilaku pengguna dan accessible role/text. Jangan menguji
detail implementasi internal yang tidak terlihat oleh pengguna.

## Security and privacy

- Jangan log JWT, password, authorization header, recipient credential, atau response sensitif.
- Jangan menggunakan `dangerouslySetInnerHTML` untuk content API tanpa sanitization yang disetujui.
- Jangan menganggap hidden button sebagai security control.
- Jangan memasukkan secret ke variable Vite karena value `VITE_*` menjadi bagian bundle browser.
- Render metadata atau JSON eksternal sebagai text, bukan executable HTML.
- Gunakan `rel="noopener noreferrer"` untuk external link yang membuka tab baru.
- Jangan menampilkan stack trace atau detail internal backend kepada pengguna.

## Docker and runtime

- Build artifact Vite disajikan oleh Nginx.
- Runtime configuration yang perlu berubah antar-environment tidak boleh di-hardcode ke source tanpa
  strategi injection yang terdokumentasi.
- Browser harus memakai URL yang dapat di-resolve dari host pengguna, biasanya
  `http://localhost:9001` untuk development lokal.
- Perubahan frontend tidak boleh langsung dibuild menjadi image, restart container, atau dideploy.
  Serahkan source change dan hasil test/build lokal kepada pengguna untuk diperiksa terlebih dahulu.

## Before finishing any task

1. Baca `git status` dan pertahankan perubahan pengguna yang tidak terkait.
2. Petakan endpoint yang disentuh ke permission backend dan API Gateway.
3. Pastikan menu, route, tab, action, modal, dan loader memiliki guard yang konsisten.
4. Jalankan focused tests selama pengembangan.
5. Jalankan `npm test`.
6. Jalankan `npm run build`.
7. Jalankan `npm run lint` dan laporkan warning yang masih ada.
8. Jalankan `git diff --check`.
9. Pastikan tidak ada token, secret, `.env`, `dist/`, atau dependency artifact yang ikut berubah.
10. Jangan deploy frontend kecuali pengguna memintanya secara eksplisit.

## Never do

- Jangan deploy atau restart frontend secara otomatis setelah perubahan.
- Jangan bypass permission dengan hardcoded role seperti `SUPERADMIN` jika authority granular sudah
  tersedia.
- Jangan memanggil endpoint unauthorized lalu mengandalkan 401/403 untuk menyembunyikan UI.
- Jangan menyimpan token ke persistent browser storage.
- Jangan menambahkan secret ke source atau bundle frontend.
- Jangan mengubah backend contract diam-diam agar cocok dengan asumsi UI.
- Jangan menonaktifkan test atau lint rule hanya untuk membuat pipeline berhasil.
- Jangan commit `node_modules/`, `dist/`, `.env`, coverage output, atau credential.
