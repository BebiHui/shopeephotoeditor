# Custom Fonts

Drop your font files into THIS folder (`public/fonts/`), with the **exact filenames** below.
You only need to provide files for **Gagalin** dan **ITC Motter Corpus** — **Lilita One** sudah otomatis di-load dari Google Fonts CDN, jadi tidak perlu file lokal.

## Filenames yang diharapkan

Drop salah satu format saja per font (yang paling kecil/cepat = `.woff2`):

```
public/fonts/
├── gagalin.woff2              ← atau .woff / .ttf / .otf
└── itc-motter-corpus.woff2    ← atau .woff / .ttf / .otf
```

Browser otomatis pilih format yang tersedia. Format lain yang tidak ada akan 404 dengan diam-diam — tidak masalah.

## Format yang didukung (urutan rekomendasi)

1. **woff2** — paling kecil, paling cepat, dukungan modern semua browser. **Rekomendasi utama.**
2. woff
3. ttf
4. otf

Kalau file Anda dalam format `.ttf` atau `.otf`, **tetap bisa** dipakai langsung — Anda tidak perlu konversi. Cukup namai sesuai daftar di atas (mis. `gagalin.ttf`).

## Cara konversi (kalau perlu)

Kalau Anda hanya punya `.ttf` / `.otf` dan ingin versi `.woff2` (lebih cepat):

- Online: https://transfonter.org (drop file, pilih WOFF2, download)
- CLI: `npx ttf2woff2 input.ttf > output.woff2`

## Catatan lisensi

Pastikan Anda punya **hak menggunakan** font tersebut (lisensi pribadi/komersial sesuai keperluan).
ITC Motter Corpus dan beberapa weight Gagalin adalah font berbayar — gunakan yang Anda miliki secara legal.

## Cara test

Setelah file font berada di folder ini:

1. Stop & restart `npm run dev` (sekali saja supaya CSS dimuat ulang).
2. Refresh browser.
3. Buka panel **Product Text Content** → tab apapun → buka **Typography** → klik dropdown font.
4. Pilih `Gagalin`, `ITC Motter Corpus`, atau `Lilita One`. Live preview di atas akan langsung ganti font.
5. Klik **Process All** / **Re-process** — font akan ikut ke-render di hasil akhir foto dan ZIP download.

Kalau font tidak tampil di preview:
- Cek nama file persis sama (huruf kecil semua, tanda hubung benar).
- Cek di DevTools → Network tab — request `/fonts/gagalin.woff2` harus return **200**, bukan **404**.
- Hard refresh browser (Cmd/Ctrl + Shift + R) untuk bypass cache.
