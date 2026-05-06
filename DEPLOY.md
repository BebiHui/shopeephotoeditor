# Cara Deploy ke GitHub + Vercel (Web Online)

Panduan ini bikin aplikasi Anda online dengan URL yang bisa diakses dari mana saja, gratis, lewat **Vercel** (perusahaan yang bikin Next.js, jadi kompatibilitas 100%). Total waktu: **±15 menit**.

---

## 🎯 Hasil akhir

- Anda dapat URL seperti `https://shopee-photo-editor-xxxx.vercel.app`
- Setiap kali Anda update kode dan push ke GitHub → Vercel otomatis deploy ulang
- Gratis, tidak perlu kartu kredit
- Bisa pasang custom domain nanti (mis. `editor.tokoanda.com`)

---

## STEP 1 — Install Git (kalau belum)

Cek dulu apakah git sudah ada. Buka **Terminal** (Mac) atau **PowerShell** (Windows), ketik:

```
git --version
```

- **Kalau muncul angka versi** (mis. `git version 2.39.0`) → sudah ada, skip ke Step 2.
- **Kalau "command not found"** atau error:
  - **Mac:** terminal akan otomatis nawarin install Xcode Command Line Tools — klik **Install**, tunggu 5-10 menit.
  - **Windows:** download dari https://git-scm.com/download/win → install (klik Next-Next saja).

Verifikasi lagi dengan `git --version`.

### Set nama & email git (sekali seumur hidup)

```
git config --global user.name "Vincentius Walawala"
git config --global user.email "vincentiuswalawala@gmail.com"
```

---

## STEP 2 — Buat akun GitHub & repository

### A. Akun GitHub

Kalau belum punya: daftar di https://github.com/signup (gratis, pakai email Anda).

### B. Bikin repository baru

1. Login ke GitHub.
2. Klik tanda **+** di kanan atas → **New repository**.
3. Isi:
   - **Repository name:** `shopee-photo-editor`
   - **Description:** (opsional) `Auto background removal & logo for Shopee product photos`
   - **Public** atau **Private** — bebas. Private aman kalau Anda gak mau orang lain lihat kodenya.
   - **JANGAN centang** "Add a README file", "Add .gitignore", atau "Choose a license" — kita upload dari komputer.
4. Klik **Create repository**.
5. Halaman berikutnya akan menampilkan URL repo. Cari kotak yang isinya seperti ini, **copy URL HTTPS-nya**:
   ```
   https://github.com/USERNAME-ANDA/shopee-photo-editor.git
   ```

---

## STEP 3 — Upload kode dari laptop ke GitHub

Buka terminal **di dalam folder project**:

- **Mac:** klik kanan folder `shopee-photo-editor` di Finder → **New Terminal at Folder**.
- **Windows:** masuk ke folder `shopee-photo-editor` di File Explorer → klik bar alamat → ketik `cmd` → Enter.

Lalu jalankan perintah ini **satu per satu** (copy-paste, tekan Enter, tunggu selesai, baru lanjut perintah berikutnya):

```
git init
```

```
git add .
```

```
git commit -m "first commit: initial app"
```

```
git branch -M main
```

```
git remote add origin https://github.com/USERNAME-ANDA/shopee-photo-editor.git
```
> **Ganti `USERNAME-ANDA`** dengan username GitHub Anda. URL ini yang Anda copy di Step 2-B.

```
git push -u origin main
```

Saat push pertama, GitHub akan minta login.

- **Cara paling mudah:** GitHub akan buka jendela browser untuk login, klik **Sign in with browser**, ikuti instruksinya.
- Atau pakai **Personal Access Token** (kalau diminta password): buat di https://github.com/settings/tokens → Generate new token → centang `repo` → copy → paste sebagai password.

Tunggu sampai upload selesai. Refresh halaman GitHub → semua file Anda sudah ada di sana. ✅

> **Catatan:** folder `node_modules/` dan `.next/` tidak ikut ke-upload — itu sengaja (sudah di-skip lewat `.gitignore`). Vercel akan install ulang sendiri saat deploy.

---

## STEP 4 — Deploy ke Vercel

### A. Daftar Vercel

1. Buka https://vercel.com/signup
2. Klik **Continue with GitHub** → izinkan akses → done.

### B. Import project

1. Setelah login, klik **Add New…** → **Project**.
2. Vercel tampilkan semua repo GitHub Anda. Cari **shopee-photo-editor** → klik **Import**.
   - Kalau repo tidak muncul: klik **Adjust GitHub App Permissions** → tambahkan repo → kembali ke Vercel.
3. Halaman **Configure Project**:
   - **Framework Preset:** Otomatis terdeteksi sebagai **Next.js** (jangan diubah).
   - **Root Directory:** `./` (default, jangan diubah).
   - **Build Command:** kosongkan (pakai default `next build`).
   - **Environment Variables:** biarkan kosong (aplikasi ini tidak butuh API key).
4. Klik tombol **Deploy**.

### C. Tunggu build (±2–4 menit)

Anda akan lihat log build berjalan. Yang Vercel lakukan:

1. `npm install` (instal paket)
2. `next build` (compile aplikasi)
3. Deploy ke CDN global

Setelah selesai, muncul tampilan "🎉 Congratulations" dengan URL aplikasi Anda, mis.:

```
https://shopee-photo-editor-abc123.vercel.app
```

Klik URL → aplikasi Anda sudah online. ✅

---

## STEP 5 — Update aplikasi nanti (workflow harian)

Setiap kali Anda ubah kode di laptop:

```
git add .
git commit -m "deskripsi perubahan"
git push
```

Vercel otomatis deploy ulang dalam 1–2 menit. URL tetap sama.

---

## ⚠️ Hal-hal yang perlu Anda tahu

### 1. Pertama kali user buka URL → ada loading model AI

Sama seperti di lokal: pertama kali tekan **Process All** akan download model ±30–80 MB sekali, lalu di-cache di browser. Jadi kunjungan kedua langsung cepat.

### 2. Foto tidak diunggah ke server Vercel

Aplikasi ini 100% berjalan di browser. Vercel cuma jadi tempat menyimpan **HTML + JavaScript**. Foto-foto produk Anda tidak pernah meninggalkan komputer pengguna.

### 3. Bandwidth gratis Vercel

Free tier Vercel: 100 GB bandwidth/bulan. Untuk aplikasi seperti ini lebih dari cukup (tiap user cuma download HTML+JS+model sekali).

### 4. Domain custom (opsional, nanti)

Kalau mau pakai `editor.tokoanda.com`:

1. Beli domain (mis. di Namecheap, Cloudflare, atau Domainesia).
2. Di Vercel: **Project → Settings → Domains** → Add → ketik domain Anda → ikuti instruksi DNS.
3. Selesai dalam 5 menit. SSL/HTTPS otomatis aktif.

---

## 🛟 Troubleshooting

| Masalah                                                         | Solusi                                                                                              |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `git push` minta password tapi password Anda ditolak            | GitHub tidak terima password biasa. Pakai Personal Access Token (link di Step 3) atau "Sign in with browser". |
| Vercel build error "Module not found"                           | Pastikan Anda sudah commit semua file. Cek di GitHub apakah folder `lib/`, `components/`, `store/`, `app/` ada di repo. |
| Vercel build error tentang `sharp` atau `onnxruntime-node`      | Pastikan file `next.config.mjs` Anda **persis** seperti yang sudah saya buat — itu yang nge-disable paket-paket itu. |
| Halaman tampil tapi tombol Process All gagal                    | Buka Developer Tools (F12) → tab Console → screenshot error → kasih ke saya.                         |
| URL Vercel-nya jelek (`shopee-photo-editor-abc123.vercel.app`) | Project → Settings → General → ganti **Project Name** → URL berubah jadi rapi.                       |
| Mau private (jangan ada di Google search)                       | Vercel Project → Settings → Deployment Protection → **Vercel Authentication** → user harus login dulu untuk akses. |

---

## 📝 Ringkasan singkat (cheat sheet)

```bash
# Pertama kali (di folder project)
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/shopee-photo-editor.git
git push -u origin main

# Lalu di vercel.com → New Project → import repo → Deploy

# Setiap update
git add .
git commit -m "perubahan apa"
git push
# ↑ Vercel otomatis re-deploy
```

Selamat — aplikasi Anda sekarang bisa diakses dari handphone, laptop teman, atau di-share linknya ke siapapun. 🚀
