# Buku Kas — Dashboard Keuangan Member

Aplikasi pencatatan saldo & pengeluaran mingguan per member, dengan login khusus admin.
Dibangun dengan **Next.js 14 (App Router)**, **Neon Postgres**, siap deploy ke **Vercel**.

## Fitur

- 🔐 Login khusus **admin** (member tidak punya akun/login sendiri)
- ➕ Admin bisa **menambah member** (nama + saldo awal opsional)
- 🗑️ Admin bisa **menghapus member** (beserta semua riwayat transaksinya)
- 💰 Catat **saldo masuk** dan **pengeluaran** per tanggal untuk tiap member
- 📅 Otomatis dikelompokkan per **minggu (Minggu–Sabtu)** dalam satu bulan — otomatis
  menyesuaikan jadi 4, 5, atau 6 minggu tergantung bulannya
- 📊 Total saldo, total pengeluaran, dan **sisa saldo berjalan** langsung terlihat di
  setiap minggu maupun di ringkasan dashboard
- 🗓️ Navigasi ganti bulan (bulan lalu / bulan depan / pilih langsung)

## 1. Siapkan Database (Neon Postgres)

1. Buat akun di [neon.tech](https://neon.tech) dan buat project baru.
2. Buka **SQL Editor** di dashboard Neon, lalu jalankan isi file [`schema.sql`](./schema.sql)
   untuk membuat tabel `members` dan `transactions`.
3. Salin **connection string** (pilih yang **pooled connection**, biasanya mengandung
   `-pooler` di hostname-nya) — ini akan dipakai sebagai `DATABASE_URL`.

## 2. Konfigurasi Environment Variables

Salin `.env.example` menjadi `.env.local` untuk development lokal:

```bash
cp .env.example .env.local
```

Isi variabelnya:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string dari Neon |
| `ADMIN_USERNAME` | Username untuk login admin, mis. `admin` |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt dari password admin (lihat cara generate di bawah) |
| `SESSION_SECRET` | String acak panjang untuk menandatangani session login |

**Generate hash password admin:**

```bash
npm install
npm run hash-password -- "passwordRahasiaAnda"
```

Perintah di atas akan mencetak nilai `ADMIN_PASSWORD_HASH` yang tinggal ditempel ke `.env.local`.

**Generate `SESSION_SECRET`:**

```bash
openssl rand -base64 32
```

## 3. Jalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan otomatis diarahkan ke halaman login.

## 4. Deploy ke Vercel

1. Push folder project ini ke repository GitHub/GitLab/Bitbucket.
2. Di [vercel.com](https://vercel.com), klik **Add New → Project**, pilih repo tersebut.
3. Vercel otomatis mendeteksi Next.js — tidak perlu ubah build settings.
4. Di bagian **Environment Variables**, tambahkan 4 variabel yang sama seperti di
   `.env.local` (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`).
5. Klik **Deploy**. Selesai — aplikasi bisa langsung diakses lewat URL Vercel.

> Tips: gunakan connection string **pooled** dari Neon (bukan direct connection) karena
> Vercel menjalankan fungsi secara serverless dan bisa membuka banyak koneksi paralel.

## Struktur Data

**`members`** — daftar member (bukan akun login, hanya data yang dikelola admin)
- `id`, `name`, `created_at`

**`transactions`** — setiap baris saldo masuk atau pengeluaran
- `id`, `member_id`, `type` (`saldo` | `pengeluaran`), `amount`, `description`, `date`, `created_at`

Total saldo, total pengeluaran, dan sisa saldo dihitung on-the-fly dari tabel ini — tidak
ada kolom saldo yang disimpan statis, jadi datanya selalu akurat dan bisa diedit ulang
(hapus transaksi) kapan saja.

## Struktur Folder Penting

```
src/
  app/
    login/              -> halaman & server action login admin
    dashboard/
      page.tsx           -> ringkasan total + daftar member + tambah member
      actions.ts          -> server actions (tambah/hapus member & transaksi, logout)
      member/[id]/page.tsx -> rincian mingguan per member + form tambah transaksi
    layout.tsx            -> font & shell halaman
  lib/
    db.ts                 -> koneksi Neon Postgres
    auth.ts                -> session admin (JWT di cookie httpOnly)
    weeks.ts               -> logika pembagian minggu Minggu–Sabtu dalam sebulan
    format.ts               -> format Rupiah
middleware.ts               -> proteksi route /dashboard, redirect ke /login jika belum login
schema.sql                    -> skema tabel untuk dijalankan di Neon
```

## Keamanan

- Password admin **tidak disimpan dalam bentuk teks biasa** — hanya hash bcrypt yang
  disimpan di environment variable.
- Session admin memakai cookie **httpOnly** (tidak bisa diakses lewat JavaScript di
  browser) yang ditandatangani dengan `SESSION_SECRET`.
- Hanya ada **satu akun admin** (berbasis environment variable) — member yang dicatat di
  dalam aplikasi murni data, bukan akun login.
# uang
