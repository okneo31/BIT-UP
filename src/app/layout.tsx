import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BitUp - Crypto Exchange',
  description: 'Trade cryptocurrencies with zero fees on BitUp Exchange',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
