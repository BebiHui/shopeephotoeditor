# Shopee Photo Editor — Auto BG Removal, Auto Enhance, Auto Logo

Aplikasi web-based untuk seller Shopee. Drop foto produk → otomatis dihapus background, di-enhance, ditambahkan logo toko, lalu siap di-download (satu-satu atau ZIP). Semua proses berjalan **di browser Anda** — foto tidak dikirim ke server manapun, tidak butuh API key, tidak butuh Python.

---

## 1. Rekomendasi arsitektur (kenapa setup ini)

| Pertimbangan                              | Pilihan                                         | Alasan singkat                                                                                                    |
| ----------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Framework                                 | **Next.js 14 (App Router) + TypeScript**       | Standar industri, hot-reload, mudah deploy ke Vercel kalau nanti mau online.                                      |
| Styling                                   | **Tailwind CSS**                                | Cepat dibuat, hasil rapi, tidak perlu CSS terpisah.                                                                |
| State                                     | **Zustand**                                     | Lebih simpel dari Redux, cukup untuk skala MVP–growth.                                                             |
| **Background removal**                    | **`@imgly/background-removal`** (browser)       | Pakai model U2Net/IS-Net di **ONNX Runtime Web** + alpha matting bawaan. Berjalan di browser, tanpa server Python. Hasil bersih untuk foto produk dengan background polos. |
| Image manipulation                        | Canvas API (native)                             | Tidak perlu Sharp/Jimp di backend; semua di client.                                                                |
| Export ZIP                                | `jszip` + `file-saver`                          | Bundle .zip langsung dari browser.                                                                                 |
| Backend Python                            | **TIDAK DIPAKAI**                               | Setup `rembg` butuh Python + model + virtualenv. Bagi user non-IT terlalu rumit. Browser sudah cukup.              |

> **Catatan:** kalau di kemudian hari Anda mau hasil edge yang **lebih bersih lagi** (misalnya untuk fotografi rambut/bulu), tinggal tambahkan adapter ke `remove.bg` API atau jalankan `rembg` di backend Python. Strukturnya sudah disiapkan di `lib/backgroundRemoval.ts` (fungsi tunggal `removeImageBackground` — tinggal swap implementasi).

---

## 2. Struktur folder

```
shopee-photo-editor/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  ← halaman utama (orchestrator)
├── components/
│   ├── PhotoUploader.tsx         ← drag-drop / multi upload
│   ├── LogoLibrary.tsx           ← upload + simpan beberapa logo
│   ├── EnhancementControls.tsx   ← preset + slider manual
│   ├── LogoControls.tsx          ← posisi, ukuran, opacity, margin
│   ├── CanvasControls.tsx        ← ukuran output, background
│   ├── PhotoGrid.tsx             ← grid before/after + status
│   ├── PhotoPreview.tsx          ← modal compare 3 tahap
│   ├── ProcessingStatus.tsx      ← progress bar + model loading
│   ├── Stepper.tsx               ← step 1..6 progress
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Slider.tsx
├── lib/
│   ├── backgroundRemoval.ts      ← wrapper @imgly/background-removal
│   ├── imageEnhancement.ts       ← brightness/contrast/sat/sharpen
│   ├── canvasComposer.ts         ← compose final canvas + logo
│   ├── zipExport.ts              ← JSZip + file-saver
│   ├── types.ts                  ← Photo, Logo, Config types
│   └── utils.ts                  ← cn(), loadImage, getOpaqueBounds
├── store/
│   └── useEditorStore.ts         ← Zustand global state
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md                     ← dokumen ini
```

---

## 3. Cara install dependency (step-by-step, sangat detail)

> Anda hanya perlu install **Node.js** sekali. Tidak perlu Python, tidak perlu Docker.

### A. Install Node.js (kalau belum punya)

1. Buka https://nodejs.org/en/download
2. Download versi **LTS** (yang berwarna hijau).
3. Install seperti aplikasi biasa (klik next-next).
4. Verifikasi dengan buka **Terminal** (Mac) atau **Command Prompt / PowerShell** (Windows), ketik:
   ```
   node -v
   npm -v
   ```
   Kalau muncul angka versi, berarti sukses.

### B. Buka folder project di terminal

1. Copy folder `shopee-photo-editor/` ini ke lokasi mana saja (mis. `Documents/`).
2. Buka terminal di folder tersebut.
   - **Mac:** klik kanan folder → **New Terminal at Folder**.
   - **Windows:** masuk ke folder, klik bar alamat di File Explorer, ketik `cmd`, tekan Enter.

### C. Install semua dependency

Di terminal, ketik:

```
npm install
```

Tunggu sekitar 1–3 menit. Akan muncul folder `node_modules/`.

> Kalau ada error tentang Python/sharp/onnxruntime-node, **abaikan** — kita memang menonaktifkan paket-paket itu di `next.config.mjs`. Yang penting `npm install` selesai tanpa **fatal error**.

---

## 4. Cara menjalankan aplikasi di lokal

Tetap di folder yang sama, ketik:

```
npm run dev
```

Akan muncul output kira-kira:

```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
```

Buka **http://localhost:3000** di browser (Chrome / Edge / Firefox terbaru).

> **Pertama kali tekan Process All**, browser akan men-download model AI (~40–80 MB) — ini hanya sekali. Progressnya kelihatan di bagian status. Setelah itu, foto-foto berikutnya diproses langsung tanpa loading.

### Workflow di aplikasi (sesuai keinginan Anda)

1. **Upload Foto Produk** → drag/drop atau klik tombol. Boleh 5–9 foto sekaligus.
2. **Logo Toko** → upload logo (PNG transparan paling bagus). Bisa simpan beberapa logo, klik untuk pilih yang aktif.
3. **Enhancement** → pilih preset:
   - *Natural Marketplace* — cocok untuk hampir semua produk.
   - *Bright Clean* — fashion, baju, sepatu.
   - *Premium Product* — gadget, kosmetik, jam tangan.
   - Atau geser slider sendiri (otomatis switch ke "Custom").
4. **Posisi Logo** → klik salah satu kotak posisi, atau pilih *Custom* dan atur slider X/Y.
5. **Canvas Output** → ukuran (1024×1024 default) + background (putih/transparan/abu/custom).
6. **Process All** → klik. Tiap foto:
   - background di-remove (transparent PNG)
   - di-enhance (brightness/contrast/sat/sharpen/warmth)
   - dipusat-otomatiskan di canvas square dengan padding
   - logo distempel sesuai posisi pilihan
7. **Download** → hover foto untuk download satu-satu, atau klik **Download ZIP** untuk semua sekaligus. Nama file sudah rapi: `product-photo-01.png`, `product-photo-02.png`, dst.

---

## 5. Cara testing aplikasi

### Quick smoke test (paling penting)

1. `npm run dev`
2. Upload 3 foto produk (background putih).
3. Upload 1 logo PNG transparan.
4. Tekan **Process All**.
5. Periksa bahwa:
   - tiap foto berubah dari ORIGINAL ke AFTER
   - background sudah benar-benar bersih (klik foto → modal tampilkan 3 panel: Original / Background-removed / Final)
   - logo terlihat di posisi yang Anda pilih
   - foto tampak lebih cerah dari aslinya
   - **Download ZIP** menghasilkan file zip yang berisi semua foto
6. Coba ganti preset/posisi logo, klik **Re-process** → semua di-render ulang.

### Cek lint + build

```
npm run lint       # opsional
npm run build      # cek production build sukses
```

---

## 6. Cara build / deploy

### Lokal production build

```
npm run build
npm run start
```

Ini menjalankan versi optimized di port 3000.

### Deploy ke Vercel (gratis, paling cepat)

1. Buat akun di https://vercel.com (login pakai GitHub/Google).
2. Push folder ini ke GitHub (kalau belum):
   ```
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin <REPO_URL>
   git push -u origin main
   ```
3. Di Vercel klik **Import Project** → pilih repo → **Deploy**. Selesai.

### Deploy "satu file" (statik)

Karena aplikasinya 100% client-side, Anda **bisa juga** export jadi static HTML:

```
npx next build && npx next export
```

Lalu upload folder `out/` ke hosting statik mana saja (Netlify, Cloudflare Pages, S3, dst).

---

## 7. Catatan penting untuk hasil background removal terbaik

1. **Foto produk dengan background polos (putih, abu, hitam) hampir selalu sempurna.** Inilah kasus utama Shopee.
2. Hindari foto dengan:
   - background ramai/berpola tabrakan dengan produk
   - bayangan keras yang menyatu dengan produk
   - warna produk identik dengan background
3. **Resolusi disarankan 1000×1000–2000×2000.** Foto >4000 px akan lambat dan boros RAM.
4. Untuk produk **rambut/bulu/jaring** halus, hasil mungkin sedikit kasar di tepi. Solusi:
   - upload dengan background lebih kontras
   - atau aktifkan **High Quality** di kode (`removeImageBackground(file, { highQuality: true })`)
5. Aplikasi mengaktifkan **alpha matting** otomatis lewat library, jadi pinggiran biasanya sudah halus.
6. Logo **PNG transparan** akan lebih rapi daripada JPG. Kalau memakai JPG, latar logo akan jadi kotak.
7. Jangan gunakan **incognito** — model di-cache di IndexedDB; di incognito akan didownload ulang setiap kali buka.

---

## 8. Roadmap pengembangan (struktur sudah scalable untuk ini)

Struktur project ini sudah dipisah dengan rapi sehingga bisa dikembangkan tanpa rewrite:

- **Auto text overlay** → tambahkan komponen `TextOverlayControls`, fungsi `drawText` di `canvasComposer.ts`.
- **Template desain produk** → simpan preset di `store/`, render preview thumbnails.
- **Auto watermark** → reuse `drawLogo` dengan mode tile/diagonal.
- **Auto cover photo** → tambahkan rasio 16:9 / 4:3 di `CanvasConfig`.
- **Multi-marketplace ratio** (Shopee 1:1, Tokopedia 1:1, TikTok Shop 9:16) → tambah array di `CanvasControls`.
- **Auto upload ke marketplace** → bikin route `/api/upload-shopee` di Next.js (server-side), pakai Shopee Open API.
- **Backend rembg** opsional → buat service Python FastAPI; lalu di `lib/backgroundRemoval.ts` ganti implementasi di balik fungsi yang sama (interface tetap).

---

## 9. Troubleshooting cepat

| Masalah                                                | Solusi                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm install` gagal di paket `sharp` atau `onnxruntime-node` | Abaikan. Kita matikan paket-paket itu via `next.config.mjs`. Pastikan `npm install` "selesai", bukan "gagal total". |
| Halaman blank di browser                               | Pastikan port 3000 tidak dipakai aplikasi lain. Jalankan `npm run dev -- -p 3010` untuk pindah port.|
| Background removal sangat lambat                       | Foto Anda terlalu besar. Resize dulu ke ≤2000 px sebelum upload.                                    |
| Model gagal didownload                                 | Cek koneksi internet. Setelah download pertama, model dicache dan tidak butuh internet lagi.        |
| Hasil edge masih kasar                                 | Edit `lib/backgroundRemoval.ts`, pakai `model: 'isnet'` (bukan `isnet_fp16`) untuk akurasi lebih.   |
| Logo terpotong                                         | Kecilkan ukuran logo (slider "Ukuran logo") atau besarkan margin.                                   |

---

Selamat memakai. Kalau ada bagian yang ingin di-polish lebih lanjut, semua kode sudah di-comment dan dipecah per file kecil supaya mudah diubah.
