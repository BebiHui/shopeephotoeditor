import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
