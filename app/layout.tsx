import type { Metadata } from 'next';
import './globals.css';
import { buildGoogleFontsUrl } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Shopee Photo Editor — Auto Background Removal & Logo',
  description:
    'Aplikasi editing foto produk otomatis untuk seller Shopee. Remove background, auto enhance, tambahkan logo, dan export ZIP.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        {/* Preconnect speeds up the Google Fonts request */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={buildGoogleFontsUrl()} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
